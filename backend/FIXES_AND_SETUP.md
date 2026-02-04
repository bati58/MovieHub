# MongoDB Connection Fixes & Complete Setup Guide

## Issues Fixed

### 1. **MongoDB Deprecated Options Error** ✅
**Problem:** The project was using deprecated `useNewUrlParser` and `useUnifiedTopology` options that are no longer supported in newer mongoose versions (7.x and 9.x).

**Error Message:**
```
Deprecation Warning: The `useNewUrlParser` and `useUnifiedTopology` options are no longer supported 
in mongoose v7+. Remove them from your connection options.
```

**Solution:** Removed these deprecated options from all MongoDB connection calls:

**Files Fixed:**
- ✅ `/backend/server.js` - Main Express server connection
- ✅ `/backend/routes/movies.js` - Movie routes connection
- ✅ `/backend/seedTMDB.js` - TMDB seeding script
- ✅ `/backend/seed.js` - Sample data seeding script
- ✅ `/backend/test-mongo.js` - MongoDB test utility
- ✅ `/backend/testSetup.js` - Setup verification script
- ✅ `/backend/testConnections.js` - Connection test script

**Before:**
```javascript
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
```

**After:**
```javascript
mongoose.connect(MONGODB_URI);
```

## Current Status

### Test Results
- ✅ Environment Variables: All loaded correctly
- ✅ TMDB API: Connected successfully, can fetch movies
- ✅ Cloudinary: Connected successfully for file storage
- ✅ MongoDB: **NOW FIXED** - Connection working properly

## Complete Setup Guide

### Step 1: Set Up Environment Variables

Create a `.env` file in the `/backend` directory with the following:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/moviehub?appName=Cluster0

# TMDB API
TMDB_API_KEY=YOUR_TMDB_API_KEY

# Cloudinary
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET

# Server
PORT=5000
NODE_ENV=development
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Verify Connections

Run the connection test to ensure everything is set up:

```bash
npm run test:setup
```

You should see:
```
✓ Environment Variables: PASSED
✓ MongoDB Connection: PASSED
✓ TMDB API Connection: PASSED
✓ Cloudinary Connection: PASSED
```

### Step 4: Seed the Database (Optional)

To populate the database with TMDB movies:

```bash
npm run seed:tmdb
```

This will:
- Fetch popular, top-rated, and trending movies from TMDB
- Transform them to your database format
- Insert 30 sample movies into MongoDB
- Show genre statistics

### Step 5: Start the Backend Server

```bash
npm run dev
```

You should see:
```
✅ Server running on port 5000
✅ API available at http://localhost:5000/api/movies
✅ MongoDB connection status: Connected
```

### Step 6: Test the API

In your browser or with curl:

```bash
# Get all movies
curl http://localhost:5000/api/movies

# Get featured movies
curl http://localhost:5000/api/movies/featured

# Get trending movies
curl http://localhost:5000/api/movies/trending

# Search movies
curl http://localhost:5000/api/movies/search/suggestions?q=inception
```

## API Endpoints

### Movies
- `GET /api/movies` - Get all movies with pagination
- `GET /api/movies/featured` - Get featured movies
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/:id` - Get movie details
- `POST /api/movies/:id/download` - Track download
- `GET /api/movies/search/suggestions?q=query` - Search suggestions

### Query Parameters
- `genre` - Filter by genre
- `year` - Filter by year
- `search` - Search by title
- `sort` - Sort by newest/popular
- `limit` - Results per page (default: 20)
- `page` - Page number (default: 1)

## Database Schema

### Movie Document
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  year: Number,
  genre: [String],
  duration: String,
  director: String,
  cast: [String],
  poster: String,
  rating: Number,
  downloads: Number,
  views: Number,
  downloadLinks: {
    '480p': String,
    '720p': String,
    '1080p': String
  },
  streamLink: String,
  featured: Boolean,
  trending: Boolean,
  createdAt: Date,
  tmdbId: Number
}
```

## Troubleshooting

### MongoDB Connection Issues
```
Error: connect ECONNREFUSED
```
- Check MONGODB_URI in .env
- Ensure MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas Security

### TMDB API Issues
```
Error: 401 Unauthorized
```
- Verify TMDB_API_KEY is correct
- Check TMDB account is active
- Ensure internet connection

### Cloudinary Issues
```
Error: Invalid credentials
```
- Verify CLOUDINARY_CLOUD_NAME is correct
- Check CLOUDINARY_API_KEY and API_SECRET
- Ensure Cloudinary account is active

## Package Versions

```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3",
  "multer": "^2.0.0-rc.3",
  "axios": "^1.6.0",
  "cloudinary": "^1.40.0"
}
```

## Key Improvements Made

1. ✅ Fixed all mongoose deprecation warnings
2. ✅ Improved connection error handling
3. ✅ All test scripts now use correct mongoose syntax
4. ✅ Database can now properly seed with TMDB data
5. ✅ Verified all 4 integrations working:
   - MongoDB ✓
   - TMDB API ✓
   - Cloudinary ✓
   - Environment Variables ✓

## Next Steps

1. Start the backend server: `npm run dev`
2. The frontend will automatically load from `/frontend/index.html`
3. API will be available at `http://localhost:5000/api/movies`
4. Frontend can fetch and display movies in real-time

## Support

If you encounter any issues:
1. Check the error message carefully
2. Review the Troubleshooting section
3. Verify all environment variables are set
4. Run `npm run test:setup` to verify connections
