const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ContactMessage = require('../models/ContactMessage');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
        if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS_HASH) {
            return res.status(500).json({ message: 'Admin credentials not configured' });
        }
    }

    if (username !== process.env.ADMIN_USER) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passHash = process.env.ADMIN_PASS_HASH;
    if (passHash) {
        const ok = await bcrypt.compare(String(password || ''), passHash);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    } else {
        if (password !== process.env.ADMIN_PASS) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    }
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

        const limit = parseInt(req.query.limit || '20', 10);
        const page = parseInt(req.query.page || '1', 10);
        const q = (req.query.q || '').trim();
        const from = req.query.from ? new Date(req.query.from) : null;
        const to = req.query.to ? new Date(req.query.to) : null;

        const query = {};
        if (q) {
            query.$or = [
                { subject: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { message: { $regex: q, $options: 'i' } }
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
        const from = req.query.from ? new Date(req.query.from) : null;
        const to = req.query.to ? new Date(req.query.to) : null;
        const query = {};
        if (q) {
            query.$or = [
                { subject: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { message: { $regex: q, $options: 'i' } }
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
