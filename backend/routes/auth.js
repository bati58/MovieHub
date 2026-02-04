const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        if (!process.env.USER_JWT_SECRET) {
            return res.status(500).json({ message: 'USER_JWT_SECRET not configured' });
        }
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }
        const existing = await User.findOne({ email: String(email).toLowerCase() });
        if (existing) return res.status(409).json({ message: 'Email already in use' });

        const passwordHash = await bcrypt.hash(String(password), 10);
        const user = await User.create({
            email: String(email).toLowerCase(),
            passwordHash
        });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.USER_JWT_SECRET,
            { expiresIn: '30d' }
        );
        res.status(201).json({ token, user: { id: user._id, email: user.email } });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ message: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        if (!process.env.USER_JWT_SECRET) {
            return res.status(500).json({ message: 'USER_JWT_SECRET not configured' });
        }
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }
        const user = await User.findOne({ email: String(email).toLowerCase() });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        const ok = await bcrypt.compare(String(password), user.passwordHash);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.USER_JWT_SECRET,
            { expiresIn: '30d' }
        );
        res.json({ token, user: { id: user._id, email: user.email } });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Login failed' });
    }
});

router.post('/forgot', async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email) return res.status(400).json({ message: 'Email required' });

        const user = await User.findOne({ email: String(email).toLowerCase() });
        if (!user) {
            return res.json({ message: 'If that email exists, a reset link was sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 30);

        user.resetTokenHash = tokenHash;
        user.resetTokenExpires = expires;
        await user.save();

        await sendResetEmail(user.email, token);

        res.json({ message: 'If that email exists, a reset link was sent.' });
    } catch (err) {
        console.error('Forgot password error:', err.message);
        res.status(500).json({ message: 'Failed to process reset' });
    }
});

router.post('/reset', async (req, res) => {
    try {
        const { token, password } = req.body || {};
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password required' });
        }

        const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
        const user = await User.findOne({
            resetTokenHash: tokenHash,
            resetTokenExpires: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.passwordHash = await bcrypt.hash(String(password), 10);
        user.resetTokenHash = undefined;
        user.resetTokenExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset password error:', err.message);
        res.status(500).json({ message: 'Failed to reset password' });
    }
});

async function sendResetEmail(email, token) {
    const appUrl = process.env.APP_URL || 'https://localhost:5000';
    const resetLink = `${appUrl}/?reset=${token}`;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('[Reset] Email not configured. Reset link:', resetLink);
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

    await transporter.sendMail({
        from: process.env.RESET_EMAIL_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'MovieHub Password Reset',
        text: `Reset your password: ${resetLink}\n\nThis link expires in 30 minutes.`,
    });
}

module.exports = router;
