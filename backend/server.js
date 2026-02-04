const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const https = require('https');
const Sentry = require('@sentry/node');
const { initRedis } = require('./services/cache');

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Simple request ID for logging
app.use((req, res, next) => {
    req.id = Math.random().toString(36).slice(2, 10);
    res.setHeader('x-request-id', req.id);
    next();
});

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0.1,
    });
    const requestHandler = Sentry.Handlers?.requestHandler?.();
    const tracingHandler = Sentry.Handlers?.tracingHandler?.();
    if (requestHandler) app.use(requestHandler);
    if (tracingHandler) app.use(tracingHandler);
}

// Middleware - Updated CORS to allow all origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic rate limiter (per IP)
const rateWindowMs = 60 * 1000;
const rateMax = parseInt(process.env.RATE_LIMIT_PER_MIN || '120', 10);
const rateStore = new Map();
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const now = Date.now();
    const record = rateStore.get(ip) || { count: 0, start: now };
    if (now - record.start > rateWindowMs) {
        record.count = 0;
        record.start = now;
    }
    record.count += 1;
    rateStore.set(ip, record);
    if (record.count > rateMax) {
        return res.status(429).json({ message: 'Too many requests. Please slow down.' });
    }
    return next();
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const movieUploadsDir = path.join(uploadsDir, 'movies');
if (!fs.existsSync(movieUploadsDir)) {
    fs.mkdirSync(movieUploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ========== MONGODB CONNECTION ==========
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-streaming';
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully!');
    })
    .catch(err => {
        console.log('❌ MongoDB connection error:', err.message);
        console.log('⚠️  Continuing with API, but using fallback data');
    });
// ========================================

// Routes
const movieRoutes = require('./routes/movies');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const contactAdminRoutes = require('./routes/contactAdmin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

app.use('/api/movies', movieRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/contact', contactAdminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// HTTPS redirect (when behind proxy)
if (process.env.FORCE_HTTPS === 'true') {
    app.use((req, res, next) => {
        if (req.secure) return next();
        const host = req.headers.host || '';
        return res.redirect(301, `https://${host}${req.originalUrl}`);
    });
}

// Simple test route
app.get('/api', (req, res) => {
    res.json({ 
        message: 'Movie Streaming API is running!',
        status: 'MongoDB connected: ' + (mongoose.connection.readyState === 1 ? '✅' : '❌'),
        endpoints: {
            movies: '/api/movies',
            featured: '/api/movies/featured',
            trending: '/api/movies/trending',
            search: '/api/movies/search/suggestions?q=search_term'
        }
    });
});

// Serve frontend (dev + prod)
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'Not found' });
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error monitoring (basic)
process.on('unhandledRejection', (reason) => {
    console.error('[UnhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[UncaughtException]', err);
});

if (process.env.SENTRY_DSN) {
    const errorHandler = Sentry.Handlers?.errorHandler?.();
    if (errorHandler) app.use(errorHandler);
}

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[Error][${req.id}]`, err.message);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;

// init redis if configured
initRedis().catch(err => console.error('[Redis] init failed', err.message));

if (sslKeyPath && sslCertPath) {
    const fs = require('fs');
    const key = fs.readFileSync(sslKeyPath);
    const cert = fs.readFileSync(sslCertPath);
    https.createServer({ key, cert }, app).listen(PORT, () => {
        console.log(`✅ HTTPS server running on port ${PORT}`);
        console.log(`✅ API available at https://localhost:${PORT}/api/movies`);
        console.log(`✅ UI available at https://localhost:${PORT}`);
        console.log(`✅ MongoDB connection status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected'}`);
    });
} else {
    http.createServer(app).listen(PORT, () => {
        console.log(`✅ HTTP server running on port ${PORT}`);
        console.log(`✅ API available at http://localhost:${PORT}/api/movies`);
        console.log(`✅ UI available at http://localhost:${PORT}`);
        console.log(`✅ MongoDB connection status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected'}`);
    });
}
