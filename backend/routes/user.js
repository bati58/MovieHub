const express = require('express');
const userAuth = require('../middleware/userAuth');
const User = require('../models/User');
const Movie = require('../models/Movie');

const router = express.Router();

router.get('/me', userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('email favorites watchHistory');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({
            id: user._id,
            email: user.email,
            favoritesCount: user.favorites?.length || 0,
            historyCount: user.watchHistory?.length || 0
        });
    } catch (err) {
        console.error('User profile error:', err.message);
        res.status(500).json({ message: 'Failed to load profile' });
    }
});

router.get('/favorites', userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favorites');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ items: user.favorites || [] });
    } catch (err) {
        console.error('Favorites error:', err.message);
        res.status(500).json({ message: 'Failed to load favorites' });
    }
});

router.post('/favorites', userAuth, async (req, res) => {
    try {
        const { movieId } = req.body || {};
        if (!movieId) return res.status(400).json({ message: 'movieId required' });
        const movie = await Movie.findById(movieId).select('_id');
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        await User.updateOne(
            { _id: req.user.id },
            { $addToSet: { favorites: movieId } }
        );
        res.json({ message: 'Added to favorites' });
    } catch (err) {
        console.error('Add favorite error:', err.message);
        res.status(500).json({ message: 'Failed to add favorite' });
    }
});

router.delete('/favorites/:movieId', userAuth, async (req, res) => {
    try {
        const movieId = req.params.movieId;
        await User.updateOne(
            { _id: req.user.id },
            { $pull: { favorites: movieId } }
        );
        res.json({ message: 'Removed from favorites' });
    } catch (err) {
        console.error('Remove favorite error:', err.message);
        res.status(500).json({ message: 'Failed to remove favorite' });
    }
});

router.get('/history', userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('watchHistory.movie');
        if (!user) return res.status(404).json({ message: 'User not found' });
        const items = (user.watchHistory || [])
            .slice()
            .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
            .map(entry => ({
                watchedAt: entry.watchedAt,
                movie: entry.movie
            }));
        res.json({ items });
    } catch (err) {
        console.error('History error:', err.message);
        res.status(500).json({ message: 'Failed to load history' });
    }
});

router.post('/history', userAuth, async (req, res) => {
    try {
        const { movieId } = req.body || {};
        if (!movieId) return res.status(400).json({ message: 'movieId required' });
        const movie = await Movie.findById(movieId).select('_id');
        if (!movie) return res.status(404).json({ message: 'Movie not found' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const filtered = (user.watchHistory || []).filter(
            entry => String(entry.movie) !== String(movieId)
        );
        filtered.unshift({ movie: movieId, watchedAt: new Date() });
        user.watchHistory = filtered.slice(0, 20);
        await user.save();
        res.json({ message: 'History updated', count: user.watchHistory.length });
    } catch (err) {
        console.error('History update error:', err.message);
        res.status(500).json({ message: 'Failed to update history' });
    }
});

module.exports = router;
