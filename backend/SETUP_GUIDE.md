# MovieHub Phase 1 - Complete Setup Guide

This guide walks you through setting up all Phase 1 components for production deployment.

## What's Included in Phase 1

✓ **MongoDB Atlas Integration** - Cloud-based MongoDB database  
✓ **TMDB API Integration** - Real movie data (30+ movies)  
✓ **Cloudinary Storage** - Video file hosting and streaming  
✓ **Environment Configuration** - Secure credential management  
✓ **Connection Testing** - Automated verification of all integrations  

---

## Prerequisites

Before starting, make sure you have:
- Node.js 14+ installed
- A Cloudinary account (free tier available)
- A TMDB account
- A MongoDB Atlas account
- Internet connection

---

## Step-by-Step Setup

### STEP 1: Set Up MongoDB Atlas

**1.1 Create a MongoDB Atlas Account**
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Sign up for a free account
- Verify your email

**1.2 Create a Project**
- Click "New Project"
- Name it "MovieHub"
- Click "Create Project"

**1.3 Create a Cluster**
- Click "Build a Cluster"
- Select "M0 Sandbox" (Free tier)
- Choose your region (pick closest to you)
- Click "Create Cluster"
- Wait 2-3 minutes for cluster to deploy

**1.4 Create Database User**
- Click "Database Access" in left menu
- Click "Add New Database User"
- Username: `moviehub` (or your choice)
- Password: Generate a strong password
- Click "Add User"

**1.5 Get Connection String**
- Click "Databases" in left menu
- Click "Connect" button on your cluster
- Select "Connect your application"
- Copy the connection string
- Replace `<password>` with your database user password
- Replace `myFirstDatabase` with `moviehub`

**Example:** `mongodb+srv://moviehub:YOUR_PASSWORD@cluster.mongodb.net/moviehub?retryWrites=true&w=majority`

**1.6 Add IP Whitelist (Important!)**
- Click "Network Access" in left menu
- Click "Add IP Address"
- Select "Allow Access from Anywhere" (for development)
- Click "Confirm"
- Note: In production, restrict to your server IP

---

### STEP 2: Get TMDB API Key

**2.1 Create TMDB Account**
- Go to [TMDB](https://www.themoviedb.org/)
- Click "Sign Up"
- Create your account and verify email

**2.2 Request API Key**
- Go to Settings > API
- Click "Create" under "Request an API Key"
- Select "Developer" option
- Accept terms and fill in details
- Click "Submit"
- Copy your API Key (starts with long alphanumeric string)

---

### STEP 3: Set Up Cloudinary

**3.1 Create Cloudinary Account**
- Go to [Cloudinary](https://cloudinary.com/)
- Click "Sign Up For Free"
- Create your account and verify email
- Skip the setup wizard

**3.2 Get Your Credentials**
- Go to [Cloudinary Dashboard](https://cloudinary.com/console/)
- In "Account Details", you'll find:
  - **Cloud Name** - Visible at top of dashboard
  - **API Key** - Under "API Environment variable"
  - **API Secret** - Also under "API Environment variable"

**3.3 Note Your Credentials**
- Copy all three values:
  - Cloud Name: `abc123xyz` (example)
  - API Key: `123456789` (example)
  - API Secret: `AbCdEfGhIjKlMnOpQrStUvWxYz` (example)

---

### STEP 4: Configure Environment Variables

**4.1 Create .env File**

In `/backend/.env`, add:

\`\`\`env
# MongoDB
MONGODB_URI=mongodb+srv://moviehub:YOUR_PASSWORD@cluster.mongodb.net/moviehub?retryWrites=true&w=majority

# TMDB API
TMDB_API_KEY=YOUR_TMDB_API_KEY_HERE

# Cloudinary
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET

# Server
PORT=5000
NODE_ENV=development
\`\`\`

Replace:
- `YOUR_PASSWORD` - Database user password from Step 1.4
- `YOUR_TMDB_API_KEY_HERE` - TMDB API key from Step 2.2
- `YOUR_CLOUD_NAME` - Cloudinary Cloud Name from Step 3.2
- `YOUR_API_KEY` - Cloudinary API Key from Step 3.2
- `YOUR_API_SECRET` - Cloudinary API Secret from Step 3.2

**4.2 Important Security Notes**
- NEVER commit `.env` to Git
- Keep credentials private
- In production, use secure secret management (AWS Secrets Manager, Vercel Secrets, etc.)

---

### STEP 5: Install Dependencies

\`\`\`bash
cd backend
npm install
\`\`\`

This installs:
- express (web framework)
- mongoose (MongoDB driver)
- axios (HTTP client for TMDB API)
- cors (cross-origin support)
- dotenv (environment variables)
- multer (file uploads)

---

### STEP 6: Test All Connections

Run the setup test to verify everything is configured correctly:

\`\`\`bash
npm run test:setup
\`\`\`

Expected output:
\`\`\`
✓ Environment Variables: PASSED
✓ MongoDB Connection: PASSED
✓ TMDB API Connection: PASSED
✓ Cloudinary Connection: PASSED

╔════════════════════════════════════════════╗
║  ✓ All tests passed! Ready for seeding    ║
╚════════════════════════════════════════════╝
\`\`\`

**If tests fail:**
1. Check error messages
2. Verify all credentials are correct
3. Ensure MongoDB/TMDB/R2 accounts are active
4. Check firewall/network restrictions

---

### STEP 7: Seed Database with Real Movie Data

Once tests pass, populate database with 30 real movies from TMDB:

\`\`\`bash
npm run seed:tmdb
\`\`\`

This script will:
- Fetch popular movies from TMDB
- Get top-rated movies
- Fetch trending movies
- Transform data to database format
- Insert into MongoDB
- Show statistics

Expected output:
\`\`\`
[SEED] Database Statistics:
  Total Movies: 30
  Average Rating: 8.1
  Average Views: 10500
  Average Downloads: 2500

[SEED] Movies by Genre:
  Action: 12 movies
  Drama: 8 movies
  Sci-Fi: 7 movies
  ...
\`\`\`

---

### STEP 8: Start Backend Server

\`\`\`bash
npm run dev
\`\`\`

Server will start on `http://localhost:5000`

Expected output:
\`\`\`
Server running on port 5000
Connected to MongoDB
\`\`\`

---

### STEP 9: Test API Endpoints

In another terminal, test the API:

\`\`\`bash
# Get all movies
curl http://localhost:5000/api/movies

# Get featured movies
curl http://localhost:5000/api/movies/featured

# Get trending movies
curl http://localhost:5000/api/movies/trending

# Search movies
curl http://localhost:5000/api/movies/search?q=inception

# Get single movie details
curl http://localhost:5000/api/movies/550988
\`\`\`

---

## Project Structure

\`\`\`
backend/
├── server.js                 # Main Express server
├── models/
│   └── User.js              # User schema
├── controllers/
│   └── movieController.js   # Movie logic
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── movies.js            # Movie API routes
│   └── admin.js             # Admin routes
├── services/
│   ├── tmdbService.js       # TMDB API integration
│   └── cloudinaryService.js # Cloudinary file storage
├── seed.js                  # Original seed data
├── seedTMDB.js              # TMDB seeding script
├── testSetup.js             # Connection testing
├── package.json             # Dependencies
├── .env.example             # Environment template
└── SETUP_GUIDE.md           # This file

frontend/
├── index.html               # Main page
├── main.js                  # Frontend logic
├── player.js                # Video player
├── search.js                # Search functionality
└── style.css                # Styling
\`\`\`

---

## Available npm Scripts

\`\`\`bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-reload)
npm run test:setup # Test all connections
npm run seed:tmdb  # Seed database from TMDB
npm run seed       # Use original seed data
\`\`\`

---

## What's Ready for Production

✓ Real movie data (30 movies from TMDB)  
✓ Poster images from TMDB  
✓ Movie ratings, cast, director info  
✓ Video storage infrastructure (R2)  
✓ Database with ratings and metadata  
✓ API endpoints for browsing/searching  
✓ Search suggestions  
✓ Genre filtering  
✓ Featured/Trending movies  

---

## What's Still Needed (Phase 2)

Next phase will add:
- User authentication (sign up/login)
- Download functionality
- Favorites/watchlist
- Video streaming integration
- Admin dashboard for uploads
- Subscription system (optional)
- Security hardening
- Performance optimization

---

## Troubleshooting

### "MongoDB connection failed"
- Check MONGODB_URI is correct
- Verify password (use URL encoding for special chars)
- Check IP whitelist in MongoDB Atlas
- Ensure cluster is running

### "TMDB API Error"
- Verify TMDB_API_KEY is correct
- Check API key status in TMDB Settings
- Rate limit: Max 40 requests/10 seconds

### "Cloudinary connection failed"
- Check all three credentials are present (Cloud Name, API Key, API Secret)
- Verify credentials from Cloudinary Dashboard
- Ensure your Cloudinary account is active
- Check internet connection

### "Movies not showing in database"
- Run `npm run test:setup` to verify connections
- Check MongoDB database exists in Atlas
- Verify no TMDB API errors in console
- Check movies collection was created

### Port already in use
\`\`\`bash
# Change PORT in .env or use:
PORT=3001 npm run dev
\`\`\`

---

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Credentials are never hardcoded
- [ ] MongoDB IP whitelist configured
- [ ] CORS limited to allowed origins
- [ ] API keys rotated periodically
- [ ] HTTPS enabled in production
- [ ] Environment-specific configs (.env.production)

---

## Next Steps

1. ✓ Complete this setup
2. ✓ Verify all tests pass
3. ✓ Seed database with movies
4. ✓ Test API endpoints
5. → **Next: Deploy to production**
   - Consider using Vercel, Heroku, or your hosting provider
   - Set up CI/CD pipeline
   - Configure production database
   - Set up monitoring and logging

---

## Support

For issues:
1. Check this guide's Troubleshooting section
2. Review service documentation:
   - [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
   - [TMDB API Docs](https://developer.themoviedb.org/)
   - [Cloudinary Docs](https://cloudinary.com/documentation)
3. Check console for error messages
4. Verify environment variables with `npm run test:setup`

---

**You're now ready to deploy MovieHub Phase 1! 🚀**
