const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ContactMessage = require('../models/ContactMessage');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_LOCK_MS = 10 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 10;
const ADMIN_USER_MAX_LENGTH = 64;
const ADMIN_PASS_MAX_LENGTH = 256;
const LOGIN_ATTEMPTS = new Map();

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

function checkAdminLoginLimit(ip) {
    const now = Date.now();
    const record = LOGIN_ATTEMPTS.get(ip);
    if (!record) return null;
    if (record.lockUntil && record.lockUntil > now) {
        return Math.ceil((record.lockUntil - now) / 1000);
    }
    if (now - record.firstAt > ADMIN_LOGIN_WINDOW_MS) {
        LOGIN_ATTEMPTS.delete(ip);
        return null;
    }
    return null;
}

function recordAdminLoginFailure(ip) {
    const now = Date.now();
    const current = LOGIN_ATTEMPTS.get(ip);
    let record;
    if (!current || (now - current.firstAt > ADMIN_LOGIN_WINDOW_MS)) {
        record = { count: 1, firstAt: now, lockUntil: 0 };
    } else {
        record = {
            count: current.count + 1,
            firstAt: current.firstAt,
            lockUntil: current.lockUntil || 0
        };
    }
    if (record.count >= ADMIN_LOGIN_MAX_ATTEMPTS) {
        record.lockUntil = now + ADMIN_LOGIN_LOCK_MS;
    }
    LOGIN_ATTEMPTS.set(ip, record);
}

function clearAdminLoginFailures(ip) {
    LOGIN_ATTEMPTS.delete(ip);
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseDateInput(value) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'INVALID';
    return parsed;
}

router.post('/login', async (req, res) => {
    const ip = getClientIp(req);
    const retryAfter = checkAdminLoginLimit(ip);
    if (retryAfter) {
        return res.status(429).json({ message: `Too many login attempts. Try again in ${retryAfter}s.` });
    }

    const { username: rawUsername, password: rawPassword } = req.body || {};
    const username = String(rawUsername || '').trim();
    const password = String(rawPassword || '');

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    if (username.length > ADMIN_USER_MAX_LENGTH) {
        return res.status(400).json({ message: `Username must be ${ADMIN_USER_MAX_LENGTH} characters or fewer` });
    }
    if (password.length > ADMIN_PASS_MAX_LENGTH) {
        return res.status(400).json({ message: `Password must be ${ADMIN_PASS_MAX_LENGTH} characters or fewer` });
    }

    if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
        if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS_HASH) {
            return res.status(500).json({ message: 'Admin credentials not configured' });
        }
    }

    if (username !== process.env.ADMIN_USER) {
        recordAdminLoginFailure(ip);
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passHash = process.env.ADMIN_PASS_HASH;
    if (passHash) {
        const ok = await bcrypt.compare(password, passHash);
        if (!ok) {
            recordAdminLoginFailure(ip);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } else {
        if (password !== process.env.ADMIN_PASS) {
            recordAdminLoginFailure(ip);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    }

    clearAdminLoginFailures(ip);
    const token = jwt.sign(
        { role: 'admin', username },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: '12h' }
    );
    return res.json({ token });
});

// List messages (most recent first)
router.get('/messages', adminAuth, async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10) || 20, 1), 100);
        const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
        const q = (req.query.q || '').trim();
        const from = parseDateInput(req.query.from);
        const to = parseDateInput(req.query.to);
        if (from === 'INVALID' || to === 'INVALID') {
            return res.status(400).json({ message: 'Invalid date filter' });
        }

        const query = {};
        if (q) {
            const safeQ = escapeRegex(q);
            query.$or = [
                { subject: { $regex: safeQ, $options: 'i' } },
                { name: { $regex: safeQ, $options: 'i' } },
                { email: { $regex: safeQ, $options: 'i' } },
                { message: { $regex: safeQ, $options: 'i' } }
            ];
        }
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = from;
            if (to) {
                const end = new Date(to);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const [items, total] = await Promise.all([
            ContactMessage.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit),
            ContactMessage.countDocuments(query)
        ]);

        res.json({ items, total, page, limit });
    } catch (error) {
        console.error('Contact admin list error:', error.message);
        res.status(500).json({ message: 'Failed to load messages' });
    }
});

router.delete('/messages/:id', adminAuth, async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database not connected' });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid message id' });
        }
        const deleted = await ContactMessage.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Message not found' });
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('Contact admin delete error:', error.message);
        res.status(500).json({ message: 'Failed to delete message' });
    }
});

router.get('/messages/export', adminAuth, async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database not connected' });
        }
        const q = (req.query.q || '').trim();
        const from = parseDateInput(req.query.from);
        const to = parseDateInput(req.query.to);
        if (from === 'INVALID' || to === 'INVALID') {
            return res.status(400).json({ message: 'Invalid date filter' });
        }
        const query = {};
        if (q) {
            const safeQ = escapeRegex(q);
            query.$or = [
                { subject: { $regex: safeQ, $options: 'i' } },
                { name: { $regex: safeQ, $options: 'i' } },
                { email: { $regex: safeQ, $options: 'i' } },
                { message: { $regex: safeQ, $options: 'i' } }
            ];
        }
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = from;
            if (to) {
                const end = new Date(to);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=\"contact-messages.csv\"');
        res.write('name,email,subject,message,createdAt\n');

        const cursor = ContactMessage.find(query).sort({ createdAt: -1 }).cursor();
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const safe = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
            const line = [
                safe(doc.name),
                safe(doc.email),
                safe(doc.subject),
                safe(doc.message),
                safe(doc.createdAt)
            ].join(',') + '\n';
            res.write(line);
        }
        res.end();
    } catch (error) {
        console.error('Contact admin export error:', error.message);
        res.status(500).json({ message: 'Failed to export messages' });
    }
});

router.get('/messages/stats', adminAuth, async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database not connected' });
        }
        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

        const [total, today, week] = await Promise.all([
            ContactMessage.countDocuments(),
            ContactMessage.countDocuments({ createdAt: { $gte: startToday } }),
            ContactMessage.countDocuments({ createdAt: { $gte: startWeek } })
        ]);
        res.json({ total, today, week });
    } catch (error) {
        console.error('Contact admin stats error:', error.message);
        res.status(500).json({ message: 'Failed to load stats' });
    }
});

module.exports = router;
