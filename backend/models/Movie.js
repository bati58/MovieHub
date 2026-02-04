const mongoose = require('mongoose');

const watchProviderSchema = new mongoose.Schema(
    {
        providerId: Number,
        name: String,
        logoUrl: String,
        type: { type: String, enum: ['flatrate', 'rent', 'buy', 'ads', 'free'], default: 'flatrate' },
    },
    { _id: false }
);

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    year: Number,
    genre: [String],
    duration: String,
    director: String,
    cast: [String],
    poster: String,
    backdrop: String,
    rating: Number,
    views: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    tmdbId: { type: Number, index: true, unique: true, sparse: true },
    trailerUrl: String,
    trailerKey: String,
    watchProviders: [watchProviderSchema],
    watchLink: String,
    createdAt: { type: Date, default: Date.now },
});

// Indexes for catalog performance
movieSchema.index({ title: 1 });
movieSchema.index({ genre: 1 });
movieSchema.index({ createdAt: -1 });
movieSchema.index({ rating: -1 });
movieSchema.index({ year: -1 });

module.exports = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
