const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class TMDBService {
  /**
   * Fetch popular movies from TMDB
   * @param {number} page - Page number for pagination
   * @returns {Promise<Array>} Array of movie objects
   */
  async getPopularMovies(page = 1) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
        params: {
          api_key: TMDB_API_KEY,
          page: page,
          language: 'en-US',
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching popular movies from TMDB:', error.message);
      throw error;
    }
  }

  /**
   * Fetch top rated movies from TMDB
   * @param {number} page - Page number for pagination
   * @returns {Promise<Array>} Array of movie objects
   */
  async getTopRatedMovies(page = 1) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/top_rated`, {
        params: {
          api_key: TMDB_API_KEY,
          page: page,
          language: 'en-US',
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching top rated movies from TMDB:', error.message);
      throw error;
    }
  }

  /**
   * Fetch trending movies from TMDB with pagination
   * @param {string} timeWindow - 'day' or 'week'
   * @param {number} page - Page number for pagination
   * @returns {Promise<Array>} Array of movie objects
   */
  async getTrendingMovies(timeWindow = 'week', page = 1) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/${timeWindow}`, {
        params: {
          api_key: TMDB_API_KEY,
          page: page,
          language: 'en-US',
        },
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching trending movies (${timeWindow}) from TMDB:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch movies by genre
   * @param {number} genreId - TMDB genre ID
   * @param {number} page - Page number for pagination
   * @returns {Promise<Array>} Array of movie objects
   */
  async getMoviesByGenre(genreId, page = 1) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          with_genres: genreId,
          page: page,
          language: 'en-US',
          sort_by: 'popularity.desc',
        },
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching movies by genre ${genreId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get movie details including cast and crew
   * @param {number} movieId - TMDB movie ID
   * @returns {Promise<Object>} Movie details object
   */
  async getMovieDetails(movieId) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          append_to_response: 'credits',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie details for ID ${movieId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get movie videos (trailers, teasers, etc.)
   * @param {number} movieId - TMDB movie ID
   * @returns {Promise<Array>} Array of video objects
   */
  async getMovieVideos(movieId) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/videos`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
        },
      });
      return response.data.results || [];
    } catch (error) {
      console.error(`Error fetching videos for movie ID ${movieId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get watch providers for a movie by region
   * @param {number} movieId - TMDB movie ID
   * @param {string} region - Region code (e.g., US)
   * @returns {Promise<Object>} Providers object
   */
  async getWatchProviders(movieId, region = 'US') {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/watch/providers`, {
        params: {
          api_key: TMDB_API_KEY,
        },
      });
      const results = response.data.results || {};
      return results[region] || null;
    } catch (error) {
      console.error(`Error fetching watch providers for movie ID ${movieId}:`, error.message);
      throw error;
    }
  }

  /**
   * Search for movies by query
   * @param {string} query - Search query
   * @param {number} page - Page number for pagination
   * @returns {Promise<Array>} Array of movie objects
   */
  async searchMovies(query, page = 1) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          page: page,
          language: 'en-US',
        },
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error searching movies with query "${query}":`, error.message);
      throw error;
    }
  }

  /**
   * Get all TMDB genres
   * @returns {Promise<Array>} Array of genre objects
   */
  async getGenres() {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
        },
      });
      return response.data.genres;
    } catch (error) {
      console.error('Error fetching genres from TMDB:', error.message);
      throw error;
    }
  }

  /**
   * Fetch movies by year range
   * @param {number} startYear - Start year
   * @param {number} endYear - End year
   * @param {number} page - Page number
   * @returns {Promise<Array>} Array of movie objects
   */
  async getMoviesByYearRange(startYear, endYear, page = 1) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          'primary_release_date.gte': `${startYear}-01-01`,
          'primary_release_date.lte': `${endYear}-12-31`,
          page: page,
          language: 'en-US',
          sort_by: 'popularity.desc',
        },
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching movies by year range ${startYear}-${endYear}:`, error.message);
      throw error;
    }
  }

  /**
   * Get movie credits (cast and crew)
   * @param {number} movieId - TMDB movie ID
   * @returns {Promise<Object>} Credits object with cast and crew
   */
  async getMovieCredits(movieId) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching credits for movie ID ${movieId}:`, error.message);
      throw error;
    }
  }

  /**
   * Enhanced: Transform TMDB movie object with real cast and director data
   * @param {Object} tmdbMovie - TMDB movie object
   * @param {Array} genres - Available genres
   * @param {Object} credits - Optional credits object
   * @returns {Promise<Object>} Formatted movie object for database
   */
  async transformTMDBMovie(tmdbMovie, genres = [], credits = null) {
    try {
      const details = await this.getMovieDetails(tmdbMovie.id);
      credits = details.credits || credits || { cast: [], crew: [] };

      // Get genre names
      const genreNames = (tmdbMovie.genre_ids || []).map(id => {
        const genre = genres.find(g => g.id === id);
        return genre ? genre.name : 'Unknown';
      });

      // Get directors
      const directors = credits.crew
        .filter(member => member.job === 'Director')
        .map(director => director.name)
        .slice(0, 2); // Take up to 2 directors

      // Get main cast (up to 6 actors)
      const cast = credits.cast
        .slice(0, 6)
        .map(actor => actor.name);

      // Get runtime if available
      let duration = 'N/A';
      if (details.runtime) {
        const hours = Math.floor(details.runtime / 60);
        const minutes = details.runtime % 60;
        duration = `${hours}h ${minutes}m`;
      }

      const videos = await this.getMovieVideos(tmdbMovie.id);
      const trailer = this.pickBestTrailer(videos);
      const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';

      const providers = await this.getWatchProviders(tmdbMovie.id, 'US');
      const { watchProviders, watchLink } = this.normalizeWatchProviders(providers);

      return {
        title: tmdbMovie.title,
        description: tmdbMovie.overview || 'No description available',
        year: new Date(tmdbMovie.release_date).getFullYear() || new Date().getFullYear(),
        genre: genreNames.length > 0 ? genreNames : ['Unknown'],
        duration: duration,
        director: directors.length > 0 ? directors.join(', ') : 'Unknown',
        cast: cast.length > 0 ? cast : ['Unknown'],
        poster: tmdbMovie.poster_path
          ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
          : 'https://via.placeholder.com/500x750?text=No+Image',
        backdrop: tmdbMovie.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${tmdbMovie.backdrop_path}`
          : '',
        rating: parseFloat((tmdbMovie.vote_average || 0).toFixed(1)),
        featured: tmdbMovie.vote_average >= 7.5 || tmdbMovie.popularity >= 100,
        trending: tmdbMovie.popularity >= 50,
        createdAt: new Date(),
        tmdbId: tmdbMovie.id,
        trailerUrl: trailerUrl,
        trailerKey: trailer ? trailer.key : '',
        watchProviders: watchProviders,
        watchLink: watchLink,
      };
    } catch (error) {
      console.error(`Error transforming movie ${tmdbMovie.title}:`, error.message);
      
      // Return basic transformation if credits fetch fails
      return this.transformTMDBMovieBasic(tmdbMovie, genres);
    }
  }

  /**
   * Basic transformation without credits (fallback)
   * @param {Object} tmdbMovie - TMDB movie object
   * @param {Array} genres - Available genres
   * @returns {Object} Basic formatted movie object
   */
  transformTMDBMovieBasic(tmdbMovie, genres = []) {
    const genreNames = (tmdbMovie.genre_ids || []).map(id => {
      const genre = genres.find(g => g.id === id);
      return genre ? genre.name : 'Unknown';
    });

    return {
      title: tmdbMovie.title,
      description: tmdbMovie.overview || 'No description available',
      year: new Date(tmdbMovie.release_date).getFullYear() || new Date().getFullYear(),
      genre: genreNames.length > 0 ? genreNames : ['Unknown'],
      duration: 'N/A',
      director: 'Unknown',
      cast: ['Unknown'],
      poster: tmdbMovie.poster_path
        ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Image',
      backdrop: tmdbMovie.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${tmdbMovie.backdrop_path}`
        : '',
      rating: parseFloat((tmdbMovie.vote_average || 0).toFixed(1)),
      featured: tmdbMovie.vote_average >= 7.5,
      trending: tmdbMovie.popularity >= 50,
      createdAt: new Date(),
      tmdbId: tmdbMovie.id,
      trailerUrl: '',
      trailerKey: '',
      watchProviders: [],
      watchLink: '',
    };
  }

  /**
   * Bulk transform movies with credits (more efficient)
   * @param {Array} tmdbMovies - Array of TMDB movie objects
   * @param {Array} genres - Available genres
   * @param {number} batchSize - Number of movies to process in parallel
   * @returns {Promise<Array>} Array of formatted movie objects
   */
  async transformTMDBMovies(tmdbMovies, genres = [], batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < tmdbMovies.length; i += batchSize) {
      const batch = tmdbMovies.slice(i, i + batchSize);
      const promises = batch.map(async (movie) => {
        try {
          // Try to get credits for each movie
          const credits = await this.getMovieCredits(movie.id);
          return await this.transformTMDBMovie(movie, genres, credits);
        } catch (error) {
          console.log(`Using basic transformation for ${movie.title}`);
          return this.transformTMDBMovieBasic(movie, genres);
        }
      });

      const batchResults = await Promise.allSettled(promises);
      
      // Add successful results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });

      // Add delay to avoid rate limiting
      if (i + batchSize < tmdbMovies.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Transform TMDB detailed movie object with credits
   * @param {Object} detailedMovie - TMDB detailed movie object
   * @returns {Object} Formatted movie object with full details
   */
  transformDetailedTMDBMovie(detailedMovie) {
    const genreNames = (detailedMovie.genres || []).map(g => g.name);
    const directors = (detailedMovie.credits?.crew || [])
      .filter(member => member.job === 'Director')
      .map(director => director.name);
    const cast = (detailedMovie.credits?.cast || [])
      .slice(0, 6)
      .map(actor => actor.name);

    // Calculate duration
    let duration = '2h 0m';
    if (detailedMovie.runtime) {
      const hours = Math.floor(detailedMovie.runtime / 60);
      const minutes = detailedMovie.runtime % 60;
      duration = `${hours}h ${minutes}m`;
    }

    return {
      title: detailedMovie.title,
      description: detailedMovie.overview || 'No description available',
      year: new Date(detailedMovie.release_date).getFullYear() || new Date().getFullYear(),
      genre: genreNames.length > 0 ? genreNames : ['Unknown'],
      duration: duration,
      director: directors.length > 0 ? directors.join(', ') : 'Unknown',
      cast: cast.length > 0 ? cast : ['Unknown'],
      poster: detailedMovie.poster_path
        ? `https://image.tmdb.org/t/p/w500${detailedMovie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Image',
      backdrop: detailedMovie.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${detailedMovie.backdrop_path}`
        : '',
      rating: parseFloat((detailedMovie.vote_average || 0).toFixed(1)),
      featured: detailedMovie.vote_average >= 7.5 || detailedMovie.popularity >= 100,
      trending: detailedMovie.popularity >= 50,
      createdAt: new Date(),
      tmdbId: detailedMovie.id,
      trailerUrl: '',
      trailerKey: '',
      watchProviders: [],
      watchLink: '',
    };
  }

  pickBestTrailer(videos) {
    if (!Array.isArray(videos) || videos.length === 0) return null;
    const youtubeVideos = videos.filter(v => v.site === 'YouTube');
    const trailers = youtubeVideos.filter(v => v.type === 'Trailer');
    if (trailers.length > 0) {
      const official = trailers.find(v => v.official);
      return official || trailers[0];
    }
    return youtubeVideos[0] || videos[0];
  }

  normalizeWatchProviders(providerData) {
    if (!providerData) {
      return { watchProviders: [], watchLink: '' };
    }

    const providers = [];
    const pushProviders = (items, type) => {
      if (!Array.isArray(items)) return;
      items.forEach(p => {
        providers.push({
          providerId: p.provider_id,
          name: p.provider_name,
          logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : '',
          type,
        });
      });
    };

    pushProviders(providerData.flatrate, 'flatrate');
    pushProviders(providerData.rent, 'rent');
    pushProviders(providerData.buy, 'buy');
    pushProviders(providerData.ads, 'ads');
    pushProviders(providerData.free, 'free');

    return {
      watchProviders: providers,
      watchLink: providerData.link || '',
    };
  }

  /**
   * Test TMDB API connection
   * @returns {Promise<Object>} Connection status
   */
  async testConnection() {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
        params: {
          api_key: TMDB_API_KEY,
          page: 1,
          language: 'en-US',
        },
      });
      
      return {
        success: true,
        message: 'TMDB API connection successful',
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      return {
        success: false,
        message: 'TMDB API connection failed',
        error: error.message,
      };
    }
  }
}

module.exports = new TMDBService();
