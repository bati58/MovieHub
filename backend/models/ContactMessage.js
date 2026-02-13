const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 60,
        match: [/^[a-zA-Z\s.'-]+$/, 'Invalid name']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 254,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address']
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        minlength: 4,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 1500
    },
    ip: { type: String, maxlength: 100 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ContactMessage || mongoose.model('ContactMessage', contactMessageSchema);
