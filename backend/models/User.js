const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema(
    {
        movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
        watchedAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
    watchHistory: [watchHistorySchema],
    resetTokenHash: { type: String },
    resetTokenExpires: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
