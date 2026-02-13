const express = require('express');
const mongoose = require('mongoose');
const ContactMessage = require('../models/ContactMessage');
const nodemailer = require('nodemailer');

const router = express.Router();
const EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_PART_MAX = 64;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 60;
const SUBJECT_MIN_LENGTH = 4;
const SUBJECT_MAX_LENGTH = 100;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 1500;

function normalizeSingleLine(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeMessage(value) {
    return String(value || '').replace(/\r\n/g, '\n').trim();
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function validateEmail(email) {
    if (!email) return 'Please enter your email address.';
    if (email.length > EMAIL_MAX_LENGTH) return 'Email must be 254 characters or fewer.';
    const parts = email.split('@');
    if (parts.length !== 2) return 'Enter a valid email address.';
    const [local, domain] = parts;
    if (!local || !domain) return 'Enter a valid email address.';
    if (local.length > EMAIL_LOCAL_PART_MAX) return 'Email local part must be 64 characters or fewer.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    return '';
}

function validateName(name) {
    if (!name) return 'Please enter your full name.';
    if (name.length < NAME_MIN_LENGTH) return 'Name must be at least 2 characters.';
    if (name.length > NAME_MAX_LENGTH) return 'Name must be 60 characters or fewer.';
    if (!/^[a-zA-Z\s.'-]+$/.test(name)) return 'Name can only include letters, spaces, and .\'- characters.';
    const letterCount = name.replace(/[^a-zA-Z]/g, '').length;
    if (letterCount < 2) return 'Please include at least two letters in your name.';
    return '';
}

function validateSubject(subject) {
    if (!subject) return 'Please enter a subject.';
    if (subject.length < SUBJECT_MIN_LENGTH) return 'Subject must be at least 4 characters.';
    if (subject.length > SUBJECT_MAX_LENGTH) return 'Subject must be 100 characters or fewer.';
    if (!/[a-zA-Z0-9]/.test(subject)) return 'Subject must include letters or numbers.';
    return '';
}

function validateMessage(message) {
    if (!message) return 'Please enter a message.';
    if (message.length < MESSAGE_MIN_LENGTH) return 'Message must be at least 10 characters.';
    if (message.length > MESSAGE_MAX_LENGTH) return 'Message must be 1500 characters or fewer.';
    const wordCount = message.split(/\s+/).filter(Boolean).length;
    if (wordCount < 2) return 'Please add a bit more detail.';
    return '';
}

router.post('/', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { name: rawName, email: rawEmail, subject: rawSubject, message: rawMessage } = req.body || {};
        const name = normalizeSingleLine(rawName);
        const email = normalizeEmail(rawEmail);
        const subject = normalizeSingleLine(rawSubject);
        const message = normalizeMessage(rawMessage);

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const errors = [
            validateName(name),
            validateEmail(email),
            validateSubject(subject),
            validateMessage(message)
        ].filter(Boolean);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0] });
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
            name,
            email,
            subject,
            message,
            ip
        });

        await sendContactEmail({
            name,
            email,
            subject,
            message,
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
