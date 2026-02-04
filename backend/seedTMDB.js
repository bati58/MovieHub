require('dotenv').config();
const mongoose = require('mongoose');
const tmdbService = require('./services/tmdbService');
const Movie = require('./models/Movie');

/**
 * Seed database with movies from TMDB API
 * Usage: node seedTMDB.js [number_of_movies]
 * Example: node seedTMDB.js 300 (for 300 movies)
 * Example: node seedTMDB.js 500 (for 500 movies)
 * Optional: add --reset to clear existing movies
 * Example: node seedTMDB.js 300 --reset
 */
async function seedMoviesFromTMDB() {
  try {
    const args = process.argv.slice(2);
    const reset = args.includes('--reset');
    const desiredCountArg = args.find(a => !a.startsWith('--'));
    const desiredCount = desiredCountArg ? parseInt(desiredCountArg) : 100;
    
    if (isNaN(desiredCount) || desiredCount <= 0) {
      console.error('[SEED] Please provide a valid number of movies. Example: node seedTMDB.js 300');
      process.exit(1);
    }

    console.log(`[SEED] Target: Adding ${desiredCount} movies to database`);

    // Connect to MongoDB
    console.log('[SEED] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[SEED] Connected to MongoDB successfully');

    if (reset) {
      console.log('[SEED] Reset enabled. Deleting existing movies...');
      await Movie.deleteMany({});
      console.log('[SEED] Existing movies deleted.');
    }

    // Get existing movies
    const existingMovies = await Movie.find({}, 'tmdbId');
    const existingTmdbIds = new Set(existingMovies.map(m => m.tmdbId));
    console.log(`[SEED] Database already contains ${existingTmdbIds.size} movies`);

    // Calculate how many more we need
    const neededCount = Math.max(0, desiredCount - existingTmdbIds.size);
    
    if (neededCount === 0) {
      console.log(`[SEED] Already have ${existingTmdbIds.size} movies, which meets or exceeds target of ${desiredCount}`);
      console.log('[SEED] If you want more movies, specify a higher number.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`[SEED] Need to add ${neededCount} more movies`);

    // Fetch genres from TMDB
    console.log('[SEED] Fetching genres from TMDB...');
    const genres = await tmdbService.getGenres();
    console.log(`[SEED] Found ${genres.length} genres`);

    // Array to hold all movies
    const moviesToInsert = [];

    // Fetch movies from multiple sources until we reach the desired count
    console.log('[SEED] Fetching movies from TMDB...');

    // We'll fetch from multiple pages to get enough movies
    const totalPagesNeeded = Math.ceil(neededCount / 20); // TMDB returns 20 movies per page
    
    // Fetch popular movies from multiple pages
    for (let page = 1; page <= totalPagesNeeded && moviesToInsert.length < neededCount; page++) {
      console.log(`[SEED] Fetching popular movies page ${page}...`);
      try {
        const popularMovies = await tmdbService.getPopularMovies(page);
        
        for (const movie of popularMovies) {
          if (moviesToInsert.length >= neededCount) break;
          
          if (!existingTmdbIds.has(movie.id) && 
              !moviesToInsert.some(m => m.tmdbId === movie.id)) {
            
            const transformed = await tmdbService.transformTMDBMovie(movie, genres);
            moviesToInsert.push(transformed);
            existingTmdbIds.add(movie.id); // Add to set to avoid duplicates
          }
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`[SEED] Error fetching page ${page}:`, error.message);
      }
    }

    // If we still need more movies, fetch top-rated
    if (moviesToInsert.length < neededCount) {
      console.log(`[SEED] Need more movies. Fetching top-rated...`);
      for (let page = 1; page <= totalPagesNeeded && moviesToInsert.length < neededCount; page++) {
        console.log(`[SEED] Fetching top-rated movies page ${page}...`);
        try {
          const topRated = await tmdbService.getTopRatedMovies(page);
          
          for (const movie of topRated) {
            if (moviesToInsert.length >= neededCount) break;
            
            if (!existingTmdbIds.has(movie.id) && 
                !moviesToInsert.some(m => m.tmdbId === movie.id)) {
              
              const transformed = await tmdbService.transformTMDBMovie(movie, genres);
              moviesToInsert.push(transformed);
              existingTmdbIds.add(movie.id);
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.log(`[SEED] Error fetching page ${page}:`, error.message);
        }
      }
    }

    // If we still need more movies, fetch trending
    if (moviesToInsert.length < neededCount) {
      console.log(`[SEED] Need more movies. Fetching trending...`);
      try {
        const trending = await tmdbService.getTrendingMovies('week');
        
        for (const movie of trending) {
          if (moviesToInsert.length >= neededCount) break;
          
          if (!existingTmdbIds.has(movie.id) && 
              !moviesToInsert.some(m => m.tmdbId === movie.id)) {
            
            const transformed = await tmdbService.transformTMDBMovie(movie, genres);
            moviesToInsert.push(transformed);
            existingTmdbIds.add(movie.id);
          }
        }
      } catch (error) {
        console.log(`[SEED] Error fetching trending:`, error.message);
      }
    }

    // If we still need more movies, fetch by genre
    if (moviesToInsert.length < neededCount) {
      console.log(`[SEED] Need more movies. Fetching by genre...`);
      const genreIds = [
        { id: 28, name: 'Action' },
        { id: 35, name: 'Comedy' },
        { id: 18, name: 'Drama' },
        { id: 27, name: 'Horror' },
        { id: 10749, name: 'Romance' },
        { id: 878, name: 'Science Fiction' },
      ];
      
      for (const genre of genreIds) {
        if (moviesToInsert.length >= neededCount) break;
        
        console.log(`[SEED] Fetching ${genre.name} movies...`);
        try {
          const genreMovies = await tmdbService.getMoviesByGenre(genre.id, 1);
          
          for (const movie of genreMovies) {
            if (moviesToInsert.length >= neededCount) break;
            
            if (!existingTmdbIds.has(movie.id) && 
                !moviesToInsert.some(m => m.tmdbId === movie.id)) {
              
              const transformed = await tmdbService.transformTMDBMovie(movie, genres);
              moviesToInsert.push(transformed);
              existingTmdbIds.add(movie.id);
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.log(`[SEED] Error fetching ${genre.name}:`, error.message);
        }
      }
    }

    // Insert all movies into database
    if (moviesToInsert.length > 0) {
      const validMovies = moviesToInsert.filter(m => m && m.title && m.title.trim().length > 0);
      const dropped = moviesToInsert.length - validMovies.length;
      if (dropped > 0) {
        console.log(`[SEED] Dropped ${dropped} invalid movies missing titles`);
      }

      console.log(`[SEED] Inserting ${validMovies.length} movies into database...`);
      const insertedMovies = await Movie.insertMany(validMovies);
      console.log(`[SEED] Successfully inserted ${insertedMovies.length} movies`);
    } else {
      console.log('[SEED] No new movies to insert.');
    }

    // Log final stats
    const totalMovies = await Movie.countDocuments();
    console.log(`\n[SEED] Total movies in database: ${totalMovies}`);
    
    const stats = await Movie.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    if (stats.length > 0) {
      console.log('\n[SEED] Database Statistics:');
      console.log(`  Average Rating: ${stats[0].avgRating.toFixed(2)}`);
    }

    // Get genre breakdown
    const genreStats = await Movie.aggregate([
      { $unwind: '$genre' },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log('\n[SEED] Movies by Genre:');
    genreStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} movies`);
    });

    console.log('\n[SEED] Database seeding completed successfully!');
    console.log(`[SEED] You now have ${totalMovies} movies in your database.`);
    console.log(`[SEED] To add more movies, run: node seedTMDB.js [number]`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error during seeding:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seeding function
seedMoviesFromTMDB();
