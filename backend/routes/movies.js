const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Movie = require('../models/Movie');
const { getCache, setCache } = require('../services/cache');

const cacheTtlMs = 5 * 60 * 1000;
const listCacheTtlMs = 60 * 1000;

// Get all movies
router.get('/', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected');
            return res.json([]);
        }

        const { genre, year, search, sort, limit = 20, page = 1 } = req.query;
        const listKey = JSON.stringify({ genre, year, search, sort, limit, page });
        const listCached = await getCache(`list:${listKey}`);
        if (listCached) {
            return res.json(listCached);
        }
        let query = {};

        if (genre) {
            query.genre = genre;
        }

        if (year) {
            query.year = parseInt(year);
        }

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        let sortOption = {};
        if (sort === 'newest') {
            sortOption = { createdAt: -1 };
        } else if (sort === 'popular') {
            sortOption = { views: -1 };
        } else if (sort === 'rating') {
            sortOption = { rating: -1 };
        } else if (sort === 'year') {
            sortOption = { year: -1 };
        } else {
            sortOption = { title: 1 };
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const [movies, total] = await Promise.all([
            Movie.find(query)
                .sort(sortOption)
                .limit(limitNum)
                .skip((pageNum - 1) * limitNum),
            Movie.countDocuments(query),
        ]);

        console.log(`Found ${movies.length} movies`);
        const payload = {
            items: movies,
            total,
            page: pageNum,
            limit: limitNum,
        };
        await setCache(`list:${listKey}`, payload, listCacheTtlMs);
        res.json(payload);
    } catch (error) {
        console.error('Error fetching movies:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Get featured movies
router.get('/featured', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected');
            return res.json([]);
        }

        const cached = await getCache('featured');
        if (cached) return res.json(cached);

        const featuredMovies = await Movie.find({ featured: true }).limit(10);
        await setCache('featured', featuredMovies, cacheTtlMs);
        console.log(`Found ${featuredMovies.length} featured movies`);
        res.json(featuredMovies);
    } catch (error) {
        console.error('Error fetching featured movies:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Get trending movies
router.get('/trending', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected');
            return res.json([]);
        }

        const cached = await getCache('trending');
        if (cached) return res.json(cached);

        const trendingMovies = await Movie.find({ trending: true }).limit(10);
        await setCache('trending', trendingMovies, cacheTtlMs);
        console.log(`Found ${trendingMovies.length} trending movies`);
        res.json(trendingMovies);
    } catch (error) {
        console.error('Error fetching trending movies:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Search suggestions
router.get('/search/suggestions', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected');
            return res.json([]);
        }

        const { q } = req.query;
        if (!q) return res.json([]);

        const suggestions = await Movie.find({
            title: { $regex: q, $options: 'i' }
        })
            .limit(10)
            .select('title year poster');

        console.log(`Found ${suggestions.length} search suggestions for: ${q}`);
        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Get available genres
router.get('/genres', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected');
            return res.json([]);
        }

        const min = parseInt(req.query.min || '1', 10);
        const sort = (req.query.sort || 'count').toLowerCase();
        const cacheKey = `genres:min=${min}:sort=${sort}`;
        const cached = await getCache(cacheKey);
        if (cached) return res.json(cached);

        const stats = await Movie.aggregate([
            { $unwind: '$genre' },
            { $match: { genre: { $type: 'string' } } },
            { $group: { _id: '$genre', count: { $sum: 1 } } },
            { $match: { count: { $gte: min } } },
            { $sort: sort === 'alpha' ? { _id: 1 } : { count: -1, _id: 1 } }
        ]);

        const result = stats.map(s => ({ name: s._id, count: s.count }));
        await setCache(cacheKey, result, cacheTtlMs);
        res.json(result);
    } catch (error) {
        console.error('Error fetching genres:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Get movie by ID
router.get('/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected');
            return res.status(404).json({ message: 'MongoDB not connected' });
        }

        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Increment views
        movie.views = (movie.views || 0) + 1;
        await movie.save();

        console.log(`Fetched movie: ${movie.title}`);
        res.json(movie);
    } catch (error) {
        console.error('Error fetching movie:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
