const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Movie = require('../models/Movie');

// Configure multer for file uploads
const uploadsRoot = path.join(__dirname, '..', 'uploads', 'movies');
if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsRoot);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Add new movie
router.post('/movies', upload.single('poster'), async (req, res) => {
    try {
        const movieData = req.body;
        
        if (req.file) {
            movieData.poster = `/uploads/movies/${req.file.filename}`;
        }
        
        // Parse array fields
        if (movieData.genre) {
            movieData.genre = JSON.parse(movieData.genre);
        }
        if (movieData.cast) {
            movieData.cast = JSON.parse(movieData.cast);
        }
        if (movieData.watchProviders) {
            movieData.watchProviders = JSON.parse(movieData.watchProviders);
        }
        
        const movie = new Movie(movieData);
        await movie.save();
        
        res.status(201).json(movie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update movie
router.put('/movies/:id', upload.single('poster'), async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        
        const updateData = req.body;
        
        if (req.file) {
            updateData.poster = `/uploads/movies/${req.file.filename}`;
        }
        
        // Parse array fields if they exist
        if (updateData.genre) {
            updateData.genre = JSON.parse(updateData.genre);
        }
        if (updateData.cast) {
            updateData.cast = JSON.parse(updateData.cast);
        }
        if (updateData.watchProviders) {
            updateData.watchProviders = JSON.parse(updateData.watchProviders);
        }
        
        Object.assign(movie, updateData);
        await movie.save();
        
        res.json(movie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete movie
router.delete('/movies/:id', async (req, res) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        
        res.json({ message: 'Movie deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all movies for admin
router.get('/movies', async (req, res) => {
    try {
        const movies = await Movie.find().sort({ createdAt: -1 });
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
