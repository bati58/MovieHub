# MovieHub

![MovieHub](frontend/screenshot.png)

Live Demo: [view project](https://moviehub-xpqp.onrender.com)

MovieHub is a full-stack movie discovery app that pulls real metadata from TMDB and serves a fast, single-page UI for browsing, search, and watchlist features.

## Features
- Browse featured, trending, and catalog titles with filters and pagination
- Search suggestions and search modal
- Movie detail modal with trailers and watch providers
- User auth with favorites and watch history
- Contact form and admin inbox for messages
- Optional Redis caching and Sentry error tracking
- Optional HTTPS local certs

## Tech stack
- Backend: Node.js, Express, Mongoose, MongoDB, Redis (optional), Sentry (optional)
- Frontend: HTML, CSS, vanilla JS
- External APIs: TMDB

## Quick start
1. `cd backend`
2. `npm install`
3. Create or update `backend/.env` (see below)
4. `npm run dev`
5. Open `http://localhost:5000`

## Environment variables
Create `backend/.env` with values like:

```env
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/moviehub
TMDB_API_KEY=your_tmdb_key

# Auth
USER_JWT_SECRET=your_user_jwt_secret
ADMIN_JWT_SECRET=your_admin_jwt_secret
ADMIN_USER=admin
ADMIN_PASS=change-me
# Or use a bcrypt hash instead of ADMIN_PASS
# ADMIN_PASS_HASH=$2a$10$...

# App + email (optional for password reset and contact)
APP_URL=http://localhost:5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
RESET_EMAIL_FROM=MovieHub <you@example.com>
CONTACT_EMAIL_TO=you@example.com

# Ops (optional)
PORT=5000
RATE_LIMIT_PER_MIN=120
REDIS_URL=
SENTRY_DSN=

# HTTPS (optional)
FORCE_HTTPS=false
SSL_KEY_PATH=certs/localhost.key
SSL_CERT_PATH=certs/localhost.crt
```

## Seeding data
- Add movies without deleting existing ones: `npm run seed:tmdb -- 300`
- Reset and reseed from scratch: `node seedTMDB.js 300 --reset`

## Useful scripts
- `npm run dev` start backend with nodemon
- `npm start` start backend
- `npm run seed:tmdb -- 300` seed from TMDB
- `node scripts/cleanupMovies.js` remove invalid movies and dedupe providers

## API overview
Movies:
- `GET /api/movies` supports `genre`, `year`, `search`, `sort`, `limit`, `page`
- `GET /api/movies/featured`
- `GET /api/movies/trending`
- `GET /api/movies/genres`
- `GET /api/movies/search/suggestions?q=...`
- `GET /api/movies/:id`

Admin movies:
- `GET /api/admin/movies`
- `POST /api/admin/movies` (multipart with `poster`)
- `PUT /api/admin/movies/:id`
- `DELETE /api/admin/movies/:id`

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot`
- `POST /api/auth/reset`

User:
- `GET /api/user/me`
- `GET /api/user/favorites`
- `POST /api/user/favorites`
- `DELETE /api/user/favorites/:movieId`
- `GET /api/user/history`
- `POST /api/user/history`

Contact:
- `POST /api/contact`
- `POST /api/admin/contact/login`
- `GET /api/admin/contact/messages`
- `GET /api/admin/contact/messages/stats`
- `GET /api/admin/contact/messages/export`
- `DELETE /api/admin/contact/messages/:id`

## Project structure
```text
.
|-- backend
|   |-- server.js
|   |-- routes
|   |-- models
|   |-- middleware
|   |-- services
|   |-- scripts
|   |-- seedTMDB.js
|   |-- certs
|   |-- uploads
|   `-- package.json
`-- frontend
    |-- index.html
    |-- main.js
    |-- search.js
    |-- style.css
    `-- favicon.ico
```

## Key files
- `backend/server.js` Express app, API routes, static frontend
- `backend/routes/movies.js` catalog, search, featured, trending endpoints
- `backend/seedTMDB.js` TMDB seeder with duplicate protection
- `frontend/index.html` main UI layout
- `frontend/main.js` UI logic and API calls
- `frontend/search.js` search suggestions and search modal

## Notes
- The backend serves the frontend from `frontend/`, so running the backend is enough.
- Redis caching is automatic when `REDIS_URL` is set.
- HTTPS is enabled when `SSL_KEY_PATH` and `SSL_CERT_PATH` are set. Use `FORCE_HTTPS=true` to redirect HTTP to HTTPS.
- Do not commit `backend/.env`.
