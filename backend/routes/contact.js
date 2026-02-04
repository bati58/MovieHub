const express = require('express');
const mongoose = require('mongoose');
const ContactMessage = require('../models/ContactMessage');
const nodemailer = require('nodemailer');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { name, email, subject, message } = req.body || {};
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Basic rate limit: max 5 messages per IP in 15 minutes
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
        const since = new Date(Date.now() - 15 * 60 * 1000);
        const recentCount = await ContactMessage.countDocuments({
            ip,
            createdAt: { $gte: since }
        });
        if (recentCount >= 5) {
            return res.status(429).json({ message: 'Too many messages. Please wait and try again.' });
        }

        const saved = await ContactMessage.create({
            name: String(name).trim(),
            email: String(email).trim(),
            subject: String(subject).trim(),
            message: String(message).trim(),
            ip
        });

        await sendContactEmail({
            name: String(name).trim(),
            email: String(email).trim(),
            subject: String(subject).trim(),
            message: String(message).trim(),
        });

        res.status(201).json({ success: true, id: saved._id });
    } catch (error) {
        console.error('Contact submit error:', error.message);
        res.status(500).json({ message: 'Failed to save message' });
    }
});

async function sendContactEmail({ name, email, subject, message }) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const to = process.env.CONTACT_EMAIL_TO || process.env.SMTP_USER;
    await transporter.sendMail({
        from: process.env.CONTACT_EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject: `[MovieHub] ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
}

module.exports = router;
