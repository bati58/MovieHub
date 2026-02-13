// API Base URL
const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isFileProtocol = window.location.protocol === 'file:';
const isBackendPort = window.location.port === '5000';
const API_BASE_URL = (isFileProtocol || (isLocalHost && !isBackendPort))
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`;

// DOM Elements
const featuredMoviesGrid = document.getElementById('featuredMovies');
const trendingMoviesGrid = document.getElementById('trendingMovies');
const catalogMoviesGrid = document.getElementById('catalogMovies');
const movieModal = document.getElementById('movieModal');
const closeModal = movieModal ? movieModal.querySelector('.close-modal') : null;
const movieDetails = document.getElementById('movieDetails');
const filterGenre = document.getElementById('filterGenre');
const filterYear = document.getElementById('filterYear');
const filterSort = document.getElementById('filterSort');
const filterLimit = document.getElementById('filterLimit');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageIndicator = document.getElementById('pageIndicator');
const catalogSearchInput = document.getElementById('catalogSearch');
const catalogSearchBtn = document.getElementById('catalogSearchBtn');
const activeFilters = document.getElementById('activeFilters');
const catalogCount = document.getElementById('catalogCount');
const genreDropdown = document.getElementById('genreDropdown');
const categoryGrid = document.getElementById('categoryGrid');
const legalModal = document.getElementById('legalModal');
const legalDetails = document.getElementById('legalDetails');
const closeLegalModal = document.getElementById('closeLegalModal');
const contactForm = document.getElementById('contactForm');
const loadMessagesBtn = document.getElementById('loadMessagesBtn');
const exportMessagesBtn = document.getElementById('exportMessagesBtn');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const adminUserInput = document.getElementById('adminUserInput');
const adminPassInput = document.getElementById('adminPassInput');
const messagesList = document.getElementById('messagesList');
const adminPrevPage = document.getElementById('adminPrevPage');
const adminNextPage = document.getElementById('adminNextPage');
const adminPageIndicator = document.getElementById('adminPageIndicator');
const adminStatusBadge = document.getElementById('adminStatusBadge');
const adminFeedback = document.getElementById('adminFeedback');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminAutoRefresh = document.getElementById('adminAutoRefresh');
const adminRefreshInterval = document.getElementById('adminRefreshInterval');
const adminDateFrom = document.getElementById('adminDateFrom');
const adminDateTo = document.getElementById('adminDateTo');
const applyAdminFiltersBtn = document.getElementById('applyAdminFiltersBtn');
const clearAdminFiltersBtn = document.getElementById('clearAdminFiltersBtn');
const statTotal = document.getElementById('statTotal');
const statToday = document.getElementById('statToday');
const statWeek = document.getElementById('statWeek');
const userStatusText = document.getElementById('userStatusText');
const userMeta = document.getElementById('userMeta');
const openLoginModalBtn = document.getElementById('openLoginModal');
const userLogoutBtn = document.getElementById('userLogoutBtn');
const authModal = document.getElementById('authModal');
const closeAuthModal = document.getElementById('closeAuthModal');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const openResetTab = document.getElementById('openResetTab');
const forgotForm = document.getElementById('forgotForm');
const resetForm = document.getElementById('resetForm');
const resetTokenInput = document.getElementById('resetTokenInput');
const resetHint = document.getElementById('resetHint');
const resetPanel = document.getElementById('resetPanel');
const authMessage = document.getElementById('authMessage');
const watchlistGrid = document.getElementById('watchlistGrid');
const historyGrid = document.getElementById('historyGrid');
const watchlistEmpty = document.getElementById('watchlistEmpty');
const historyEmpty = document.getElementById('historyEmpty');
const scrollToggleBtn = document.getElementById('scrollToggleBtn');
let adminToken = localStorage.getItem('admin_token') || '';
let adminPage = 1;
let adminTotal = 0;
let adminItemsCache = [];
let adminRefreshTimer = null;
const legalDownloadLinks = document.querySelectorAll('.legal-link[data-download]');
const ADMIN_USER_MAX_LENGTH = 64;
const ADMIN_PASS_MAX_LENGTH = 256;

let catalogPage = 1;
let catalogQuery = '';
let catalogTotal = 0;
let userToken = localStorage.getItem('user_token') || '';
let userFavorites = new Set();
let userHistory = [];
let userEmail = '';
const THEME_STORAGE_KEY = 'moviehub_theme';
let currentTheme = 'dark';

function getStoredTheme() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
}

function updateThemeToggleLabel() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    const isLight = currentTheme === 'light';
    const actionLabel = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    themeToggle.innerHTML = `<i class="fas ${isLight ? 'fa-moon' : 'fa-sun'}" aria-hidden="true"></i>`;
    themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', actionLabel);
    themeToggle.setAttribute('title', actionLabel);
}

function applyTheme(theme, persist = true) {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    if (document.body) {
        document.body.setAttribute('data-theme', currentTheme);
    }
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (persist) {
        localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    }
    updateThemeToggleLabel();
}

function ensureThemeToggleButton() {
    const navContainer = document.querySelector('.moviehub-navbar .container') || document.querySelector('.navbar .container');
    if (!navContainer) return null;

    let themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) {
        themeToggle = document.createElement('button');
        themeToggle.type = 'button';
        themeToggle.id = 'themeToggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Toggle color theme');

        const menuToggle = navContainer.querySelector('.menu-toggle');
        if (menuToggle) {
            navContainer.insertBefore(themeToggle, menuToggle);
        } else {
            navContainer.appendChild(themeToggle);
        }
    }
    return themeToggle;
}

function setupThemeToggle() {
    applyTheme(getStoredTheme(), false);
    const themeToggle = ensureThemeToggleButton();
    if (!themeToggle) return;

    updateThemeToggleLabel();
    themeToggle.addEventListener('click', () => {
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
    });
}
// Load movies on page load
function applyQueryToCatalog() {
    if (!('URLSearchParams' in window)) return;
    const params = new URLSearchParams(window.location.search);
    const genre = params.get('genre');
    const search = params.get('search');
    const year = params.get('year');
    const sort = params.get('sort');
    const limit = params.get('limit');
    const page = parseInt(params.get('page') || '1', 10) || 1;

    if (genre && filterGenre) filterGenre.value = genre;
    if (search) catalogQuery = search;
    if (year && filterYear) filterYear.value = year;
    if (sort && filterSort) filterSort.value = sort;
    if (limit && filterLimit) filterLimit.value = limit;
    catalogPage = page;
}

function ensureYearOptions() {
    if (!filterYear) return;
    const hasYearOption = Array.from(filterYear.options || []).some(option => {
        const value = option.value || option.textContent || '';
        return /^\d{4}$/.test(value.trim());
    });
    if (hasYearOption) return;

    const startYear = new Date().getFullYear();
    const endYear = 2010;
    for (let year = startYear; year >= endYear; year -= 1) {
        const option = document.createElement('option');
        option.value = String(year);
        option.textContent = String(year);
        filterYear.appendChild(option);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, starting initialization...');

    // Shared setup
    setupThemeToggle();
    ensureYearOptions();
    if (filterGenre || genreDropdown || categoryGrid) loadGenres();
    setupEventListeners();
    setupScrollButtons();
    setupHeroSearch();
    setupHeroParallax();
    setAdminStatus(Boolean(adminToken));
    initUserAccount();

    // Page-specific loads
    if (featuredMoviesGrid) loadFeaturedMovies();
    if (trendingMoviesGrid) loadTrendingMovies();
    if (catalogMoviesGrid) {
        applyQueryToCatalog();
        loadCatalogMovies();
    }
});

// Improved fetch function with timeout and fallback
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        console.log(`Fetching: ${url}`);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text || 'Request failed'}`);
        }
        
        const data = await response.json();
        console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 'data'} from ${url}`);
        return data;
    } catch (error) {
        console.warn(`Failed to fetch from ${url}:`, error.message);
        throw error;
    }
}

// Load featured movies with fallback
async function loadFeaturedMovies() {
    try {
        renderSkeletons(featuredMoviesGrid, 6);
        const movies = await fetchWithTimeout(`${API_BASE_URL}/movies/featured`);
        if (movies && movies.length > 0) {
            displayMovies(movies, featuredMoviesGrid);
        } else {
            showEmptyState(featuredMoviesGrid, 'No featured movies yet');
        }
    } catch (error) {
        console.log('Failed to load featured movies');
        showEmptyState(featuredMoviesGrid, 'Could not load featured movies');
    }
}

// Load trending movies with fallback
async function loadTrendingMovies() {
    try {
        renderSkeletons(trendingMoviesGrid, 6);
        const movies = await fetchWithTimeout(`${API_BASE_URL}/movies/trending`);
        if (movies && movies.length > 0) {
            displayMovies(movies, trendingMoviesGrid);
        } else {
            showEmptyState(trendingMoviesGrid, 'No trending movies yet');
        }
    } catch (error) {
        console.log('Failed to load trending movies');
        showEmptyState(trendingMoviesGrid, 'Could not load trending movies');
    }
}

function showEmptyState(container, message) {
    container.innerHTML = `
        <div class="no-movies">
            <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3>${message}</h3>
            <p>Seed TMDB data or check your connection.</p>
            ${container && container.id === 'catalogMovies' ? '<button class="filter-btn" id="resetCatalogEmpty">Reset Filters</button>' : ''}
        </div>
    `;

    const resetBtn = document.getElementById('resetCatalogEmpty');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (filterGenre) filterGenre.value = '';
            if (filterYear) filterYear.value = '';
            if (filterSort) filterSort.value = 'newest';
            if (filterLimit) filterLimit.value = '20';
            if (catalogSearchInput) catalogSearchInput.value = '';
            catalogQuery = '';
            catalogPage = 1;
            setActiveTab('newest');
            loadCatalogMovies();
        });
    }
}

async function loadGenres() {
    try {
        const genres = await fetchWithTimeout(`${API_BASE_URL}/movies/genres?min=3&sort=alpha`, 8000);
        if (Array.isArray(genres) && genres.length > 0) {
            populateGenres(genres);
        }
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

function populateGenres(genres) {
    const safeGenres = genres
        .filter(g => g && typeof g.name === 'string' && g.name.trim().length > 0)
        .map(g => ({ name: g.name.trim(), count: g.count || 0 }));

    const iconMap = {
        Action: 'fa-explosion',
        Adventure: 'fa-mountain',
        Animation: 'fa-wand-magic-sparkles',
        Comedy: 'fa-laugh',
        Crime: 'fa-mask',
        Documentary: 'fa-camera',
        Drama: 'fa-theater-masks',
        Family: 'fa-people-roof',
        Fantasy: 'fa-hat-wizard',
        History: 'fa-landmark',
        Horror: 'fa-ghost',
        Music: 'fa-music',
        Mystery: 'fa-user-secret',
        Romance: 'fa-heart',
        'Science Fiction': 'fa-robot',
        'Sci-Fi': 'fa-robot',
        Thriller: 'fa-bolt',
        War: 'fa-person-military-rifle',
        Western: 'fa-hat-cowboy'
    };

    if (filterGenre) {
        const current = filterGenre.value;
        filterGenre.innerHTML = '<option value="">All Genres</option>';
        safeGenres.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.name;
            opt.textContent = `${g.name} (${g.count})`;
            filterGenre.appendChild(opt);
        });
        filterGenre.value = current || '';
    }

    if (genreDropdown) {
        genreDropdown.innerHTML = '';
        safeGenres.forEach(g => {
            const link = document.createElement('a');
            link.href = `movies.html?genre=${encodeURIComponent(g.name)}`;
            link.dataset.genre = g.name;
            link.textContent = `${g.name} (${g.count})`;
            genreDropdown.appendChild(link);
        });
    }

    if (categoryGrid) {
        categoryGrid.innerHTML = '';
        safeGenres.forEach(g => {
            const card = document.createElement('a');
            card.href = `movies.html?genre=${encodeURIComponent(g.name)}`;
            card.className = 'category-card';
            card.dataset.genre = g.name;
            const iconClass = iconMap[g.name] || 'fa-film';
            card.innerHTML = `
                <i class="fas ${iconClass}"></i>
                <span>${g.name}</span>
                <small class="genre-count">${g.count} titles</small>
            `;
            categoryGrid.appendChild(card);
        });
    }
}

// Display movies in grid
function displayMovies(movies, container) {
    container.innerHTML = '';
    
    if (!movies || movies.length === 0) {
        container.innerHTML = `
            <div class="no-movies">
                <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>No movies found</h3>
                <p>Try refreshing the page or check your connection</p>
            </div>
        `;
        return;
    }
    
    movies.forEach((movie, index) => {
        const movieCard = document.createElement('div');
        const isFav = userFavorites && userFavorites.has(movie._id);
        movieCard.className = `movie-card${isFav ? ' is-favorite' : ''}`;
        movieCard.dataset.id = movie._id;
        movieCard.style.animationDelay = `${index * 40}ms`;

        const ratingValue = typeof movie.rating === 'number' ? movie.rating : parseFloat(movie.rating || '0');
        const isHigh = ratingValue >= 8.5;
        const ratingBadge = `
            <div class="rating-badge ${isHigh ? 'high' : ''}">
                <i class="fas fa-star"></i> ${ratingValue ? ratingValue.toFixed(1) : 'N/A'}
            </div>
        `;
        const favBadge = isFav ? `<div class="fav-badge"><i class="fas fa-heart"></i></div>` : '';

        const providers = Array.isArray(movie.watchProviders) ? movie.watchProviders.slice(0, 3) : [];

        const hoverTags = Array.isArray(movie.genre) ? movie.genre.slice(0, 3) : [];
        const hoverPanel = `
            <div class="hover-panel">
                ${hoverTags.map(g => `<span class="tag">${g}</span>`).join('')}
                <div class="row">
                    <div class="movie-meta">
                        <span>${movie.year || 'N/A'}</span>
                        <span>${movie.duration || 'N/A'}</span>
                    </div>
                    <div class="movie-meta">
                        <span><i class="fas fa-star"></i> ${ratingValue ? ratingValue.toFixed(1) : 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;

        movieCard.innerHTML = `
            <img src="${movie.poster || 'https://via.placeholder.com/300x450?text=No+Image'}" 
                 alt="${movie.title}" 
                 class="movie-poster"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=No+Image'">
            ${ratingBadge}
            ${favBadge}
            ${hoverPanel}
            <div class="movie-info">
                <h3 class="movie-title">${movie.title || 'Untitled'}</h3>
                <div class="movie-meta">
                    <span>${movie.year || 'N/A'}</span>
                    <span>${movie.duration || 'N/A'}</span>
                </div>
                <div class="movie-meta">
                    <span><i class="fas fa-star"></i> ${movie.rating || 'N/A'}/10</span>
                    <span><i class="fas fa-eye"></i> ${movie.views || '0'}</span>
                </div>
            </div>
        `;
        
        movieCard.addEventListener('click', () => showMovieDetails(movie._id));
        container.appendChild(movieCard);
    });
    
    console.log(`Displayed ${movies.length} movies in ${container.id}`);
}

// Show movie details
async function showMovieDetails(movieId) {
    try {
        const movie = await fetchWithTimeout(`${API_BASE_URL}/movies/${movieId}`);
        displayMovieModal(movie);
    } catch (error) {
        console.log('Failed to load movie details');
    }
}

function renderSkeletons(container, count = 8) {
    if (!container) return;
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'skeleton-grid';
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'skeleton-card';
        card.innerHTML = `
            <div class="skeleton-poster"></div>
            <div class="skeleton-lines">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        `;
        grid.appendChild(card);
    }
    container.appendChild(grid);
}

function buildCatalogQuery() {
    const params = new URLSearchParams();
    const genre = filterGenre ? filterGenre.value : '';
    const year = filterYear ? filterYear.value : '';
    const sort = filterSort ? filterSort.value : 'newest';
    const limit = filterLimit ? filterLimit.value : '20';
    const search = catalogQuery || '';

    if (genre) params.set('genre', genre);
    if (year) params.set('year', year);
    if (sort) params.set('sort', sort);
    if (search) params.set('search', search);
    params.set('limit', limit);
    params.set('page', String(catalogPage));

    return params.toString();
}

async function loadCatalogMovies() {
    if (!catalogMoviesGrid) return;
    renderSkeletons(catalogMoviesGrid, 10);
    try {
        const qs = buildCatalogQuery();
        const payload = await fetchWithTimeout(`${API_BASE_URL}/movies?${qs}`, 8000);
        const movies = Array.isArray(payload) ? payload : (payload.items || []);
        catalogTotal = Array.isArray(payload) ? movies.length : (payload.total || 0);
        displayMovies(movies, catalogMoviesGrid);
        if (catalogCount) {
            const totalText = catalogTotal ? `${catalogTotal} total` : '0 total';
            catalogCount.textContent = `Showing ${movies.length} results • ${totalText}`;
        }
        updatePaginationControls(movies.length);
        renderActiveFilters();
    } catch (error) {
        console.error('Error loading catalog movies:', error);
        showApiHelp(catalogMoviesGrid, 'catalog');
    }
}

function updatePaginationControls(currentCount) {
    if (!pageIndicator || !prevPageBtn || !nextPageBtn) return;
    const limit = parseInt(filterLimit ? filterLimit.value : '20', 10);
    const totalPages = Math.max(1, Math.ceil((catalogTotal || 0) / limit));
    pageIndicator.textContent = `Page ${catalogPage} of ${totalPages}`;
    prevPageBtn.disabled = catalogPage <= 1;
    nextPageBtn.disabled = catalogPage >= totalPages || currentCount < limit;
}

function showApiHelp(container, areaLabel) {
    const isFileProtocol = window.location.protocol === 'file:';
    const message = isFileProtocol
        ? 'Open the app via the backend server: http://localhost:5000'
        : 'Start the backend server: cd backend && node server.js';
    container.innerHTML = `
        <div class="no-movies">
            <i class="fas fa-plug" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3>Could not load ${areaLabel}</h3>
            <p>${message}</p>
        </div>
    `;
}

function renderActiveFilters() {
    if (!activeFilters) return;
    activeFilters.innerHTML = '';
    const chips = [];
    if (catalogQuery) chips.push({ key: 'search', label: `Search: ${catalogQuery}` });
    if (filterGenre && filterGenre.value) chips.push({ key: 'genre', label: `Genre: ${filterGenre.value}` });
    if (filterYear && filterYear.value) chips.push({ key: 'year', label: `Year: ${filterYear.value}` });
    if (filterSort && filterSort.value) chips.push({ key: 'sort', label: `Sort: ${filterSort.value}` });
    if (filterLimit && filterLimit.value) chips.push({ key: 'limit', label: `Per page: ${filterLimit.value}` });

    chips.forEach(chip => {
        const el = document.createElement('div');
        el.className = 'filter-chip';
        el.innerHTML = `
            <span>${chip.label}</span>
            <button aria-label="Remove ${chip.key}">×</button>
        `;
        el.querySelector('button').addEventListener('click', () => {
            if (chip.key === 'search') catalogQuery = '';
            if (chip.key === 'genre' && filterGenre) filterGenre.value = '';
            if (chip.key === 'year' && filterYear) filterYear.value = '';
            if (chip.key === 'sort' && filterSort) filterSort.value = 'newest';
            if (chip.key === 'limit' && filterLimit) filterLimit.value = '20';
            catalogPage = 1;
            loadCatalogMovies();
        });
        activeFilters.appendChild(el);
    });
}

// Display movie in modal
function displayMovieModal(movie) {
    movieDetails.innerHTML = `
        <div class="movie-detail">
            <img src="${movie.poster || 'https://via.placeholder.com/300x450?text=No+Image'}" 
                 alt="${movie.title}" 
                 class="detail-poster"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="detail-info">
                <h2>${movie.title || 'Unknown Movie'} (${movie.year || 'N/A'})</h2>
                <div class="movie-meta">
                    <span><i class="fas fa-clock"></i> ${movie.duration || 'N/A'}</span>
                    <span><i class="fas fa-star"></i> ${movie.rating || 'N/A'}/10</span>
                    <span><i class="fas fa-eye"></i> ${movie.views || '0'} views</span>
                </div>
                <p><strong>Genre:</strong> ${(movie.genre && movie.genre.join(', ')) || 'N/A'}</p>
                <p><strong>Director:</strong> ${movie.director || 'N/A'}</p>
                <p><strong>Cast:</strong> ${(movie.cast && movie.cast.join(', ')) || 'N/A'}</p>
                <p class="description">${movie.description || 'No description available.'}</p>

                <div class="watch-options">
                    <h3>Where to Watch</h3>
                    ${movie.watchLink ? `
                        <a href="${movie.watchLink}" class="watch-btn" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-external-link-alt"></i> View Providers
                        </a>` : '<p class="no-watch">No provider links available for your region.</p>'}
                    ${Array.isArray(movie.watchProviders) && movie.watchProviders.length > 0 ? `
                        <div class="provider-logos">
                            ${Array.from(new Map(
                                movie.watchProviders
                                    .filter(p => p && p.name)
                                    .map(p => [p.name, p])
                            ).values())
                                .slice(0, 10)
                                .map(p => `
                                    <div class="provider-pill" title="${p.name}">
                                        ${p.logoUrl ? `<img src="${p.logoUrl}" alt="${p.name}">` : ''}
                                        <span>${p.name}</span>
                                    </div>
                                `).join('')}
                        </div>
                    ` : ''}
                </div>

                <div class="trailer-option">
                    ${movie.trailerUrl ? `
                        <a href="${movie.trailerUrl}" class="trailer-btn" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-play"></i> Watch Trailer
                        </a>` : '<p class="no-trailer">Trailer not available.</p>'}
                </div>
                <div class="detail-actions">
                    <button id="watchlistToggle" class="filter-btn">Add to Watchlist</button>
                </div>
                <p class="form-note" id="watchlistNote"></p>
            </div>
        </div>
    `;

    const watchlistToggle = document.getElementById('watchlistToggle');
    const watchlistNote = document.getElementById('watchlistNote');
    if (watchlistToggle) {
        if (!userToken) {
            watchlistToggle.textContent = 'Login to Save';
            watchlistToggle.disabled = false;
            watchlistToggle.addEventListener('click', () => {
                movieModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                openAuthModal('login');
            });
            if (watchlistNote) watchlistNote.textContent = 'Log in to add this movie to your watchlist.';
        } else {
            const isFav = userFavorites.has(movie._id);
            watchlistToggle.textContent = isFav ? 'Remove from Watchlist' : 'Add to Watchlist';
            watchlistToggle.disabled = false;
            watchlistToggle.addEventListener('click', async () => {
                await toggleFavorite(movie._id);
                const nowFav = userFavorites.has(movie._id);
                watchlistToggle.textContent = nowFav ? 'Remove from Watchlist' : 'Add to Watchlist';
            });
        }
    }

    movieModal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    recordHistory(movie._id);
}

function initUserAccount() {
    if (openLoginModalBtn) {
        openLoginModalBtn.addEventListener('click', () => openAuthModal('login'));
    }
    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', () => closeAuthModalView());
    }
    if (authTabs && authTabs.length) {
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => switchAuthTab(tab.dataset.auth));
        });
    }
    if (openResetTab) {
        openResetTab.addEventListener('click', () => {
            switchAuthTab('reset');
            updateResetState();
        });
    }
    setupAuthValidation();
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateAuthForm('login')) return;
            await handleAuthSubmit('login', new FormData(loginForm));
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateAuthForm('register')) return;
            await handleAuthSubmit('register', new FormData(registerForm));
        });
    }
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateAuthForm('forgot')) return;
            await handleForgotSubmit(new FormData(forgotForm));
        });
    }
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateAuthForm('reset')) return;
            await handleResetSubmit(new FormData(resetForm));
        });
    }
    if (userLogoutBtn) {
        userLogoutBtn.addEventListener('click', () => {
            clearUserSession();
        });
    }

    updateResetState('');
    const resetToken = new URLSearchParams(window.location.search).get('reset');
    if (resetToken) {
        openAuthModal('reset');
        updateResetState(resetToken);
        const url = new URL(window.location.href);
        url.searchParams.delete('reset');
        window.history.replaceState({}, document.title, url.toString());
    }

    setUserStatus(Boolean(userToken), userEmail);
    if (userToken) {
        loadUserProfile();
        loadUserFavorites();
        loadUserHistory();
    } else {
        renderMiniGrid([], watchlistGrid, watchlistEmpty, { emptyText: 'Log in to manage your watchlist.' });
        renderMiniGrid([], historyGrid, historyEmpty, { emptyText: 'Log in to see your recently viewed titles.' });
    }
}

function openAuthModal(defaultTab = 'login') {
    if (!authModal) return;
    authModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    setAuthMessage('');
    switchAuthTab(defaultTab);
}

function closeAuthModalView() {
    if (!authModal) return;
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    clearAuthFieldErrors();
}

function switchAuthTab(tab) {
    if (!authTabs) return;
    authTabs.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.auth === tab);
    });
    if (loginForm) loginForm.classList.toggle('active', tab === 'login');
    if (registerForm) registerForm.classList.toggle('active', tab === 'register');
    if (resetPanel) resetPanel.classList.toggle('active', tab === 'reset');
    setAuthMessage('');
    clearAuthFieldErrors();
    if (tab === 'reset') {
        updateResetState();
    }
}

function updateResetState(tokenValue) {
    if (!resetForm) return;
    const currentToken = tokenValue !== undefined
        ? tokenValue
        : (resetTokenInput ? resetTokenInput.value : '');
    const hasToken = Boolean(currentToken);

    if (resetTokenInput) resetTokenInput.value = currentToken || '';
    resetForm.dataset.ready = hasToken ? 'true' : 'false';
    resetForm.querySelectorAll('input, button').forEach((control) => {
        if (control === resetTokenInput) return;
        control.disabled = !hasToken;
    });
    if (resetHint) {
        resetHint.textContent = hasToken
            ? 'Verified reset link detected. Set a new password below.'
            : 'Open the reset link from your email to set a new password.';
    }
}

let authValidationState = {
    validators: new Map(),
    normalizers: new Map(),
    fieldsByForm: new Map(),
    isReady: false
};

function setupAuthValidation() {
    if (authValidationState.isReady) return;
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const forgotEmail = document.getElementById('forgotEmail');
    const resetPassword = document.getElementById('resetPassword');

    const normalizeEmail = (value) => value.trim().toLowerCase();
    const normalizeSingleLine = (value) => value.replace(/\s+/g, ' ').trim();

    const validateEmail = (value) => {
        const normalized = normalizeSingleLine(value);
        if (!normalized) return 'Please enter your email address.';
        if (normalized.length > 254) return 'Email must be 254 characters or fewer.';
        const parts = normalized.split('@');
        if (parts.length !== 2) return 'Enter a valid email address.';
        const [local, domain] = parts;
        if (!local || !domain) return 'Enter a valid email address.';
        if (local.length > 64) return 'Email local part must be 64 characters or fewer.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
            return 'Enter a valid email address (e.g., name@example.com).';
        }
        return '';
    };

    const validateLoginPassword = (value) => {
        if (!value) return 'Please enter your password.';
        if (value.length > 128) return 'Password must be 128 characters or fewer.';
        return '';
    };

    const validateStrongPassword = (value) => {
        if (!value) return 'Please enter a password.';
        if (value.length < 8) return 'Password must be at least 8 characters.';
        if (value.length > 72) return 'Password must be 72 characters or fewer.';
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
            return 'Password must include at least one letter and one number.';
        }
        return '';
    };

    authValidationState.validators = new Map([
        [loginEmail, validateEmail],
        [registerEmail, validateEmail],
        [forgotEmail, validateEmail],
        [loginPassword, validateLoginPassword],
        [registerPassword, validateStrongPassword],
        [resetPassword, validateStrongPassword]
    ]);

    authValidationState.normalizers = new Map([
        [loginEmail, normalizeEmail],
        [registerEmail, normalizeEmail],
        [forgotEmail, normalizeEmail]
    ]);

    authValidationState.fieldsByForm = new Map([
        ['login', [loginEmail, loginPassword]],
        ['register', [registerEmail, registerPassword]],
        ['forgot', [forgotEmail]],
        ['reset', [resetPassword]]
    ]);

    const allFields = Array.from(authValidationState.validators.keys()).filter(Boolean);
    allFields.forEach((input) => {
        input.addEventListener('blur', () => validateAuthField(input, { mutate: true }));
        input.addEventListener('input', () => {
            if (input.classList.contains('input-error')) {
                validateAuthField(input, { mutate: false });
            }
        });
    });

    authValidationState.isReady = true;
}

function getAuthFieldValue(input, { mutate = false } = {}) {
    if (!input) return '';
    const raw = input.value || '';
    const normalizer = authValidationState.normalizers.get(input);
    const normalized = normalizer ? normalizer(raw) : raw;
    if (mutate && normalized !== input.value) {
        input.value = normalized;
    }
    return normalized;
}

function showAuthFieldError(input, message) {
    if (!input) return;
    const errorId = input.getAttribute('aria-describedby');
    let errorEl = errorId ? document.getElementById(errorId) : null;
    if (!errorEl && input.parentElement) {
        errorEl = input.parentElement.querySelector('.field-error');
    }
    if (!errorEl) {
        errorEl = document.createElement('small');
        errorEl.className = 'field-error';
        input.insertAdjacentElement('afterend', errorEl);
    }
    errorEl.textContent = message;
    errorEl.classList.add('is-visible');
    input.classList.add('input-error');
    input.setAttribute('aria-invalid', 'true');
}

function clearAuthFieldError(input) {
    if (!input) return;
    const errorId = input.getAttribute('aria-describedby');
    const errorEl = errorId ? document.getElementById(errorId) : input.parentElement?.querySelector('.field-error');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('is-visible');
    }
    input.classList.remove('input-error');
    input.removeAttribute('aria-invalid');
}

function validateAuthField(input, { mutate = false } = {}) {
    if (!input || input.disabled) return true;
    const validator = authValidationState.validators.get(input);
    if (!validator) return true;
    const value = getAuthFieldValue(input, { mutate });
    const message = validator(value);
    if (message) {
        showAuthFieldError(input, message);
        return false;
    }
    clearAuthFieldError(input);
    return true;
}

function validateAuthForm(formKey) {
    const fields = authValidationState.fieldsByForm.get(formKey) || [];
    let firstInvalid = null;
    fields.filter(Boolean).forEach((input) => {
        const valid = validateAuthField(input, { mutate: true });
        if (!valid && !firstInvalid) {
            firstInvalid = input;
        }
    });
    if (firstInvalid) {
        firstInvalid.focus();
        return false;
    }
    return true;
}

function clearAuthFieldErrors() {
    const fields = Array.from(authValidationState.validators.keys()).filter(Boolean);
    fields.forEach((input) => clearAuthFieldError(input));
}

function setAuthMessage(message = '', state = 'info') {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.classList.remove('is-visible', 'is-info', 'is-success', 'is-error');
    if (!message) return;
    authMessage.classList.add('is-visible');
    authMessage.classList.add(state === 'success' ? 'is-success' : state === 'error' ? 'is-error' : 'is-info');
}

function setAdminFeedback(message = '', state = 'info') {
    if (!adminFeedback) return;
    adminFeedback.textContent = message;
    adminFeedback.classList.remove('is-visible', 'is-info', 'is-success', 'is-error');
    if (!message) return;
    adminFeedback.classList.add('is-visible');
    adminFeedback.classList.add(state === 'success' ? 'is-success' : state === 'error' ? 'is-error' : 'is-info');
}

async function handleAuthSubmit(type, formData) {
    setAuthMessage('Processing...', 'info');
    const payload = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    try {
        const res = await fetch(`${API_BASE_URL}/auth/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Request failed');
        }
        const data = await res.json();
        if (!data.token) throw new Error('Missing token');
        userToken = data.token;
        userEmail = data.user?.email || payload.email;
        localStorage.setItem('user_token', userToken);
        setUserStatus(true, userEmail);
        await loadUserFavorites();
        await loadUserHistory();
        closeAuthModalView();
        setAuthMessage('');
    } catch (err) {
        setAuthMessage(err.message || 'Authentication failed', 'error');
    }
}

async function handleForgotSubmit(formData) {
    setAuthMessage('Sending reset link...', 'info');
    const payload = { email: formData.get('email') };
    try {
        const res = await fetch(`${API_BASE_URL}/auth/forgot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Request failed');
        }
        const data = await res.json();
        setAuthMessage(data.message || 'If that email exists, a reset link was sent.', 'success');
    } catch (err) {
        setAuthMessage(err.message || 'Reset request failed', 'error');
    }
}

async function handleResetSubmit(formData) {
    const tokenValue = String(formData.get('token') || '').trim();
    if (!tokenValue) {
        setAuthMessage('Open the reset link from your email to continue.', 'error');
        return;
    }
    setAuthMessage('Resetting password...', 'info');
    const payload = {
        token: tokenValue,
        password: formData.get('password')
    };
    try {
        const res = await fetch(`${API_BASE_URL}/auth/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Request failed');
        }
        const data = await res.json();
        setAuthMessage(data.message || 'Password reset successful. Please login.', 'success');
        updateResetState('');
        switchAuthTab('login');
    } catch (err) {
        setAuthMessage(err.message || 'Password reset failed', 'error');
    }
}

function setUserStatus(isLoggedIn, email = '') {
    if (userStatusText) {
        userStatusText.textContent = isLoggedIn
            ? `Logged in as ${email || 'user'}`
            : 'Not logged in.';
    }
    if (userMeta) {
        userMeta.textContent = isLoggedIn
            ? 'Your watchlist and history sync across this browser.'
            : 'Create an account to save favorites and history.';
    }
    if (userLogoutBtn) userLogoutBtn.disabled = !isLoggedIn;
}

function clearUserSession() {
    userToken = '';
    userEmail = '';
    userFavorites = new Set();
    userHistory = [];
    localStorage.removeItem('user_token');
    setUserStatus(false);
    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
    if (forgotForm) forgotForm.reset();
    if (resetForm) resetForm.reset();
    updateResetState('');
    setAuthMessage('');
    renderMiniGrid([], watchlistGrid, watchlistEmpty, { emptyText: 'Log in to manage your watchlist.' });
    renderMiniGrid([], historyGrid, historyEmpty, { emptyText: 'Log in to see your recently viewed titles.' });
    syncFavoriteBadges();
}

async function loadUserProfile() {
    if (!userToken) return;
    try {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!res.ok) throw new Error('Profile failed');
        const data = await res.json();
        userEmail = data.email || userEmail;
        setUserStatus(true, userEmail);
    } catch (err) {
        console.error('Profile load failed:', err.message);
        clearUserSession();
    }
}

async function loadUserFavorites() {
    if (!userToken) return;
    try {
        const res = await fetch(`${API_BASE_URL}/user/favorites`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!res.ok) throw new Error('Favorites failed');
        const data = await res.json();
        const items = data.items || [];
        userFavorites = new Set(items.map(item => item._id));
        renderMiniGrid(items, watchlistGrid, watchlistEmpty, { emptyText: 'No favorites yet.', removable: true });
        syncFavoriteBadges();
    } catch (err) {
        console.error('Favorites load failed:', err.message);
    }
}

async function loadUserHistory() {
    if (!userToken) return;
    try {
        const res = await fetch(`${API_BASE_URL}/user/history`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!res.ok) throw new Error('History failed');
        const data = await res.json();
        userHistory = data.items || [];
        renderMiniGrid(userHistory, historyGrid, historyEmpty, { emptyText: 'No history yet.', history: true });
    } catch (err) {
        console.error('History load failed:', err.message);
    }
}

async function toggleFavorite(movieId) {
    if (!userToken) {
        openAuthModal('login');
        return;
    }
    try {
        if (userFavorites.has(movieId)) {
            const res = await fetch(`${API_BASE_URL}/user/favorites/${movieId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (!res.ok) throw new Error('Remove failed');
            userFavorites.delete(movieId);
        } else {
            const res = await fetch(`${API_BASE_URL}/user/favorites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
                body: JSON.stringify({ movieId })
            });
            if (!res.ok) throw new Error('Add failed');
            userFavorites.add(movieId);
        }
        await loadUserFavorites();
    } catch (err) {
        console.error('Toggle favorite failed:', err.message);
    }
}

async function recordHistory(movieId) {
    if (!userToken || !movieId) return;
    try {
        await fetch(`${API_BASE_URL}/user/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
            body: JSON.stringify({ movieId })
        });
        await loadUserHistory();
    } catch (err) {
        console.error('History record failed:', err.message);
    }
}

function renderMiniGrid(items, container, emptyEl, options = {}) {
    if (!container) return;
    container.innerHTML = '';
    const list = Array.isArray(items) ? items : [];
    if (!list.length) {
        if (emptyEl) emptyEl.textContent = options.emptyText || 'No items yet.';
        return;
    }
    if (emptyEl) emptyEl.textContent = '';
    list.forEach(entry => {
        const movie = options.history ? entry.movie : entry;
        if (!movie) return;
        const card = document.createElement('div');
        card.className = 'mini-card';
        card.dataset.id = movie._id;
        const watchedAt = options.history && entry.watchedAt
            ? new Date(entry.watchedAt).toLocaleDateString()
            : '';
        card.innerHTML = `
            <img src="${movie.poster || 'https://via.placeholder.com/300x450?text=No+Image'}" alt="${movie.title}">
            <span class="mini-title">${movie.title || 'Untitled'}</span>
            ${watchedAt ? `<div class="mini-meta">Viewed ${watchedAt}</div>` : ''}
        `;
        if (options.removable) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'mini-remove';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await toggleFavorite(movie._id);
            });
            card.appendChild(removeBtn);
        }
        card.addEventListener('click', () => showMovieDetails(movie._id));
        container.appendChild(card);
    });
}

function syncFavoriteBadges() {
    document.querySelectorAll('.movie-card').forEach(card => {
        const id = card.dataset.id;
        const isFav = userFavorites.has(id);
        card.classList.toggle('is-favorite', isFav);
        const badge = card.querySelector('.fav-badge');
        if (isFav && !badge) {
            const newBadge = document.createElement('div');
            newBadge.className = 'fav-badge';
            newBadge.innerHTML = '<i class="fas fa-heart"></i>';
            card.appendChild(newBadge);
        }
        if (!isFav && badge) {
            badge.remove();
        }
    });
}


// Setup event listeners
function setupEventListeners() {
    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            movieModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === movieModal) {
            movieModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (event.target === authModal) {
            closeAuthModalView();
        }
        if (event.target === legalModal) {
            legalModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Category filtering
    const genreDropdownEl = document.getElementById('genreDropdown');
    const categoryGridEl = document.getElementById('categoryGrid');

    if (genreDropdownEl) {
        genreDropdownEl.addEventListener('click', (e) => {
            const item = e.target.closest('a[data-genre]');
            if (!item) return;
            const genre = item.dataset.genre;

            // If we're on the movies page, intercept and filter in-place. Otherwise allow navigation.
            if (catalogMoviesGrid) {
                e.preventDefault();
                if (filterGenre) filterGenre.value = genre;
                catalogPage = 1;
                loadCatalogMovies();
                const catalogSection = document.getElementById('catalog');
                if (catalogSection) {
                    const navBar = document.querySelector('.navbar');
                    const offset = navBar ? navBar.offsetHeight : 0;
                    const top = catalogSection.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ top: Math.max(0, top - offset), behavior: 'smooth' });
                }
                const dropdown = document.querySelector('.dropdown');
                if (dropdown) dropdown.classList.remove('open');
            }
        });
    }

    if (categoryGridEl) {
        categoryGridEl.addEventListener('click', (e) => {
            const item = e.target.closest('.category-card[data-genre]');
            if (!item) return;
            const genre = item.dataset.genre;

            if (catalogMoviesGrid) {
                e.preventDefault();
                if (filterGenre) filterGenre.value = genre;
                catalogPage = 1;
                loadCatalogMovies();
                const catalogSection = document.getElementById('catalog');
                if (catalogSection) {
                    const navBar = document.querySelector('.navbar');
                    const offset = navBar ? navBar.offsetHeight : 0;
                    const top = catalogSection.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ top: Math.max(0, top - offset), behavior: 'smooth' });
                }
            }
            // otherwise the anchor's href will navigate to the movies page
        });
    }
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const dropdown = document.querySelector('.dropdown');
    const dropbtn = document.querySelector('.dropbtn');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isVisible = navLinks.style.display === 'flex';
            navLinks.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = 'var(--card-bg)';
                navLinks.style.padding = '1rem';
                navLinks.style.zIndex = '1000';
            }
        });
    }

    if (dropdown && dropbtn) {
        dropbtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            catalogPage = 1;
            loadCatalogMovies();
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (filterGenre) filterGenre.value = '';
            if (filterYear) filterYear.value = '';
            if (filterSort) filterSort.value = 'newest';
            if (filterLimit) filterLimit.value = '20';
            if (catalogSearchInput) catalogSearchInput.value = '';
            catalogQuery = '';
            catalogPage = 1;
            setActiveTab(filterSort ? filterSort.value : 'newest');
            loadCatalogMovies();
        });
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (catalogPage > 1) {
                catalogPage -= 1;
                loadCatalogMovies();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            catalogPage += 1;
            loadCatalogMovies();
        });
    }

    if (catalogSearchBtn && catalogSearchInput) {
        catalogSearchBtn.addEventListener('click', () => {
            catalogQuery = catalogSearchInput.value.trim();
            catalogPage = 1;
            loadCatalogMovies();
        });
        catalogSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                catalogSearchBtn.click();
            }
        });
    }

    document.querySelectorAll('.catalog-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sort = btn.dataset.sort || 'newest';
            if (filterSort) filterSort.value = sort;
            catalogPage = 1;
            setActiveTab(sort);
            loadCatalogMovies();
        });
    });

    document.querySelectorAll('.legal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.legal;
            if (!type) return;
            openLegalModal(type);
        });
    });

    if (closeLegalModal) {
        closeLegalModal.addEventListener('click', () => {
            if (legalModal) legalModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    if (contactForm) {
        const contactName = document.getElementById('contactName');
        const contactEmail = document.getElementById('contactEmail');
        const contactSubject = document.getElementById('contactSubject');
        const contactMessage = document.getElementById('contactMessage');
        const contactFeedback = document.getElementById('contactFeedback');
        const contactSubmitBtn = contactForm.querySelector('button[type="submit"]');

        const normalizeSingleLine = (value) => value.replace(/\s+/g, ' ').trim();
        const normalizeMessage = (value) => value.replace(/\r\n/g, '\n').trim();
        const getNormalizedValue = (input) => {
            if (!input) return '';
            const raw = input.value || '';
            if (input === contactMessage) return normalizeMessage(raw);
            if (input === contactEmail) return raw.trim();
            return normalizeSingleLine(raw);
        };

        const contactValidators = new Map([
            [contactName, (value) => {
                if (!value) return 'Please enter your full name.';
                if (value.length < 2) return 'Name must be at least 2 characters.';
                if (value.length > 60) return 'Name must be 60 characters or fewer.';
                if (!/^[a-zA-Z\s.'-]+$/.test(value)) return 'Name can only include letters, spaces, and .\'- characters.';
                const letterCount = value.replace(/[^a-zA-Z]/g, '').length;
                if (letterCount < 2) return 'Please include at least two letters in your name.';
                return '';
            }],
            [contactEmail, (value) => {
                if (!value) return 'Please enter your email address.';
                if (value.length > 254) return 'Email must be 254 characters or fewer.';
                const parts = value.split('@');
                if (parts.length !== 2) return 'Enter a valid email address.';
                const [local, domain] = parts;
                if (!local || !domain) return 'Enter a valid email address.';
                if (local.length > 64) return 'Email local part must be 64 characters or fewer.';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return 'Enter a valid email address (e.g., name@example.com).';
                }
                return '';
            }],
            [contactSubject, (value) => {
                if (!value) return 'Please enter a subject.';
                if (value.length < 4) return 'Subject must be at least 4 characters.';
                if (value.length > 100) return 'Subject must be 100 characters or fewer.';
                if (!/[a-zA-Z0-9]/.test(value)) return 'Subject must include letters or numbers.';
                return '';
            }],
            [contactMessage, (value) => {
                if (!value) return 'Please enter a message.';
                if (value.length < 10) return 'Message must be at least 10 characters.';
                if (value.length > 1500) return 'Message must be 1500 characters or fewer.';
                const wordCount = value.split(/\s+/).filter(Boolean).length;
                if (wordCount < 2) return 'Please add a bit more detail.';
                return '';
            }]
        ]);

        const setContactFeedback = (message = '', state = 'info') => {
            if (!contactFeedback) return;
            contactFeedback.textContent = message;
            contactFeedback.classList.remove('is-visible', 'is-info', 'is-success', 'is-error');
            if (!message) return;
            contactFeedback.classList.add('is-visible');
            contactFeedback.classList.add(state === 'success' ? 'is-success' : state === 'error' ? 'is-error' : 'is-info');
        };

        const showFieldError = (input, message) => {
            if (!input) return;
            const errorId = input.getAttribute('aria-describedby');
            let errorEl = errorId ? document.getElementById(errorId) : null;
            if (!errorEl && input.parentElement) {
                errorEl = input.parentElement.querySelector('.field-error');
            }
            if (!errorEl) {
                errorEl = document.createElement('small');
                errorEl.className = 'field-error';
                input.insertAdjacentElement('afterend', errorEl);
            }
            errorEl.textContent = message;
            errorEl.classList.add('is-visible');
            input.classList.add('input-error');
            input.setAttribute('aria-invalid', 'true');
        };

        const clearFieldError = (input) => {
            if (!input) return;
            const errorId = input.getAttribute('aria-describedby');
            const errorEl = errorId ? document.getElementById(errorId) : input.parentElement?.querySelector('.field-error');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.classList.remove('is-visible');
            }
            input.classList.remove('input-error');
            input.removeAttribute('aria-invalid');
        };

        const validateField = (input, { mutate = false } = {}) => {
            const validator = contactValidators.get(input);
            if (!validator) return true;
            let value = getNormalizedValue(input);
            if (input === contactEmail && value) value = value.toLowerCase();
            if (mutate && value !== input.value) {
                input.value = value;
            }
            const message = validator(value);
            if (message) {
                showFieldError(input, message);
                return false;
            }
            clearFieldError(input);
            return true;
        };

        const validateContactForm = () => {
            const fields = [contactName, contactEmail, contactSubject, contactMessage].filter(Boolean);
            let firstInvalid = null;
            fields.forEach((input) => {
                const valid = validateField(input, { mutate: true });
                if (!valid && !firstInvalid) {
                    firstInvalid = input;
                }
            });
            if (firstInvalid) {
                setContactFeedback('Please fix the highlighted fields and try again.', 'error');
                firstInvalid.focus();
                return false;
            }
            setContactFeedback('');
            return true;
        };

        [contactName, contactEmail, contactSubject, contactMessage].filter(Boolean).forEach((input) => {
            input.addEventListener('blur', () => validateField(input, { mutate: true }));
            input.addEventListener('input', () => {
                if (input.classList.contains('input-error')) {
                    validateField(input, { mutate: false });
                }
                if (contactFeedback?.classList.contains('is-error')) {
                    setContactFeedback('');
                }
            });
        });

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateContactForm()) return;
            if (contactSubmitBtn) contactSubmitBtn.disabled = true;
            setContactFeedback('Sending your message...', 'info');

            const payload = {
                name: getNormalizedValue(contactName),
                email: getNormalizedValue(contactEmail).toLowerCase(),
                subject: getNormalizedValue(contactSubject),
                message: getNormalizedValue(contactMessage),
            };

            try {
                const res = await fetch(`${API_BASE_URL}/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Failed');
                }
                contactForm.reset();
                [contactName, contactEmail, contactSubject, contactMessage].forEach((input) => clearFieldError(input));
                setContactFeedback('Message sent successfully. Thank you for reaching out.', 'success');
            } catch (err) {
                console.error('Contact submit failed:', err.message);
                setContactFeedback('Could not send message. Please try again.', 'error');
            } finally {
                if (contactSubmitBtn) contactSubmitBtn.disabled = false;
            }
        });
    }

    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', async () => {
            const username = adminUserInput ? adminUserInput.value.trim() : '';
            const password = adminPassInput ? adminPassInput.value : '';
            if (!username || !password) {
                setAdminFeedback('Enter admin username and password.', 'error');
                return;
            }
            if (username.length > ADMIN_USER_MAX_LENGTH) {
                setAdminFeedback(`Admin username must be ${ADMIN_USER_MAX_LENGTH} characters or fewer.`, 'error');
                if (adminUserInput) adminUserInput.focus();
                return;
            }
            if (password.length > ADMIN_PASS_MAX_LENGTH) {
                setAdminFeedback(`Admin password must be ${ADMIN_PASS_MAX_LENGTH} characters or fewer.`, 'error');
                if (adminPassInput) adminPassInput.focus();
                return;
            }
            adminLoginBtn.disabled = true;
            setAdminFeedback('Signing in...', 'info');
            try {
                const res = await fetch(`${API_BASE_URL}/admin/contact/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Login failed');
                }
                const data = await res.json();
                adminToken = data.token;
                localStorage.setItem('admin_token', adminToken);
                setAdminFeedback('Admin login successful.', 'success');
                if (adminPassInput) adminPassInput.value = '';
                setAdminStatus(true);
                if (adminAutoRefresh && adminAutoRefresh.checked) {
                    startAdminAutoRefresh();
                }
            } catch (err) {
                console.error('Admin login failed:', err.message);
                setAdminFeedback(err.message || 'Login failed.', 'error');
            } finally {
                adminLoginBtn.disabled = false;
            }
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            adminToken = '';
            localStorage.removeItem('admin_token');
            if (adminUserInput) adminUserInput.value = '';
            if (adminPassInput) adminPassInput.value = '';
            if (messagesList) {
                messagesList.innerHTML = `<p class="form-note">Logged out.</p>`;
            }
            if (adminPageIndicator) adminPageIndicator.textContent = 'Page 1';
            adminItemsCache = [];
            setAdminStatus(false);
            stopAdminAutoRefresh();
            setAdminFeedback('Logged out.', 'info');
        });
    }

    if (loadMessagesBtn) {
        loadMessagesBtn.addEventListener('click', async () => {
            await loadAdminMessages();
        });
    }

    if (exportMessagesBtn) {
        exportMessagesBtn.addEventListener('click', async () => {
            if (!adminToken) {
                setAdminFeedback('Please login first.', 'error');
                return;
            }
            exportMessagesBtn.disabled = true;
            exportMessagesBtn.innerHTML = `<span class="spinner-inline"></span> Exporting...`;
            setAdminFeedback('Preparing CSV export...', 'info');
            try {
                const params = new URLSearchParams();
                if (adminSearchInput && adminSearchInput.value.trim()) {
                    params.set('q', adminSearchInput.value.trim());
                }
                if (adminDateFrom && adminDateFrom.value) params.set('from', adminDateFrom.value);
                if (adminDateTo && adminDateTo.value) params.set('to', adminDateTo.value);

                const res = await fetch(`${API_BASE_URL}/admin/contact/messages/export?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Failed');
                }
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'contact-messages.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                setAdminFeedback('CSV export started.', 'success');
            } catch (err) {
                console.error('Export failed:', err.message);
                setAdminFeedback(err.message || 'Export failed.', 'error');
            } finally {
                exportMessagesBtn.disabled = false;
                exportMessagesBtn.innerHTML = 'Export CSV';
            }
        });
    }

    if (adminPrevPage) {
        adminPrevPage.addEventListener('click', () => {
            if (adminPage > 1) {
                adminPage -= 1;
                if (loadMessagesBtn) loadMessagesBtn.click();
            }
        });
    }

    if (adminNextPage) {
        adminNextPage.addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil((adminTotal || 0) / 20));
            if (adminPage < totalPages) {
                adminPage += 1;
                loadAdminMessages();
            }
        });
    }

    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', () => {
            const q = adminSearchInput.value.trim().toLowerCase();
            if (!q) {
                renderMessages(adminItemsCache);
                return;
            }
            const filtered = adminItemsCache.filter(m =>
                String(m.subject || '').toLowerCase().includes(q) ||
                String(m.name || '').toLowerCase().includes(q) ||
                String(m.email || '').toLowerCase().includes(q) ||
                String(m.message || '').toLowerCase().includes(q)
            );
            renderMessages(filtered);
        });
    }

    if (applyAdminFiltersBtn) {
        applyAdminFiltersBtn.addEventListener('click', () => {
            if (adminSearchInput) adminSearchInput.value = '';
            adminPage = 1;
            setAdminFeedback('Applying date filters...', 'info');
            loadAdminMessages();
        });
    }

    if (clearAdminFiltersBtn) {
        clearAdminFiltersBtn.addEventListener('click', () => {
            if (adminDateFrom) adminDateFrom.value = '';
            if (adminDateTo) adminDateTo.value = '';
            if (adminSearchInput) adminSearchInput.value = '';
            adminPage = 1;
            setAdminFeedback('Filters cleared.', 'info');
            loadAdminMessages();
        });
    }

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (adminSearchInput) adminSearchInput.value = '';
            const days = parseInt(btn.dataset.days || '0', 10);
            const hours = parseInt(btn.dataset.hours || '0', 10);
            if (!days && !hours) return;
            const to = new Date();
            const from = hours
                ? new Date(Date.now() - hours * 60 * 60 * 1000)
                : new Date(new Date().setDate(to.getDate() - days));
            if (adminDateFrom) adminDateFrom.value = from.toISOString().slice(0, 10);
            if (adminDateTo) adminDateTo.value = to.toISOString().slice(0, 10);
            adminPage = 1;
            setAdminFeedback('Preset applied. Loading messages...', 'info');
            loadAdminMessages();
        });
    });

    if (adminAutoRefresh && adminRefreshInterval) {
        adminAutoRefresh.addEventListener('change', () => {
            if (adminAutoRefresh.checked) {
                startAdminAutoRefresh();
                setAdminFeedback(`Auto-refresh enabled (${adminRefreshInterval.value}s).`, 'info');
            } else {
                stopAdminAutoRefresh();
                setAdminFeedback('Auto-refresh disabled.', 'info');
            }
        });

        adminRefreshInterval.addEventListener('change', () => {
            if (adminAutoRefresh.checked) {
                startAdminAutoRefresh();
                setAdminFeedback(`Auto-refresh interval set to ${adminRefreshInterval.value}s.`, 'info');
            }
        });
    }

    if (legalDownloadLinks && legalDownloadLinks.length > 0) {
        legalDownloadLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const type = link.dataset.download;
                const content = getLegalText(type);
                if (!content) return;

                const pdfLib = window.jspdf && window.jspdf.jsPDF ? window.jspdf : null;
                if (!pdfLib) {
                    alert('PDF library not loaded. Please refresh and try again.');
                    return;
                }

                const doc = new pdfLib.jsPDF({ unit: 'pt', format: 'a4' });
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 48;
                const lineHeight = 16;
                const maxWidth = pageWidth - margin * 2;
                const email = 'batijano58@gmail.com';
                const emailUrl = `mailto:${email}`;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                const lines = doc.splitTextToSize(content, maxWidth);
                let y = margin;

                lines.forEach(line => {
                    if (y > pageHeight - margin) {
                        doc.addPage();
                        y = margin;
                    }
                    doc.text(line, margin, y);
                    let matchIndex = line.indexOf(email);
                    while (matchIndex !== -1) {
                        const prefix = line.slice(0, matchIndex);
                        const prefixWidth = doc.getTextWidth(prefix);
                        const emailWidth = doc.getTextWidth(email);
                        const linkX = margin + prefixWidth;
                        const linkY = y - lineHeight + 3;
                        doc.link(linkX, linkY, emailWidth, lineHeight, { url: emailUrl });
                        matchIndex = line.indexOf(email, matchIndex + email.length);
                    }
                    y += lineHeight;
                });

                const filename = type === 'terms' ? 'terms.pdf' : 'privacy.pdf';
                doc.save(filename);
            });
        });
    }
}

function setupHeroSearch() {
    const heroInput = document.getElementById('heroSearchInput');
    const heroBtn = document.getElementById('heroSearchBtn');
    if (!heroInput || !heroBtn) return;

    heroBtn.addEventListener('click', () => {
        const query = heroInput.value.trim();
        if (!query) return;
        if (window.performSearch) {
            window.performSearch(query);
        } else {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = query;
            }
        }
    });

    heroInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            heroBtn.click();
        }
    });
}

function setupHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const heroMedia = hero.querySelector('.hero-media');
    if (!heroMedia) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let rafId = null;
    const updateParallax = () => {
        const rect = hero.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const inView = rect.bottom > 0 && rect.top < viewportHeight;
        if (!inView) {
            hero.style.setProperty('--hero-parallax-y', '0px');
            return;
        }
        const offset = Math.max(-20, Math.min(20, rect.top * -0.08));
        hero.style.setProperty('--hero-parallax-y', `${offset.toFixed(2)}px`);
    };

    const queueUpdate = () => {
        if (rafId !== null) return;
        rafId = window.requestAnimationFrame(() => {
            updateParallax();
            rafId = null;
        });
    };

    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate, { passive: true });
    queueUpdate();
}

function setupScrollButtons() {
    if (!scrollToggleBtn) return;

    const icon = scrollToggleBtn.querySelector('i');
    const navBar = document.querySelector('.navbar');
    const topBias = 8;
    const endThreshold = 120;
    const getNavOffset = () => (navBar ? navBar.offsetHeight : 0);
    const getSections = () =>
        Array.from(document.querySelectorAll('section')).filter((section) => section.offsetHeight > 0);

    const setDirection = (direction, wrapToTop = false) => {
        const isDown = direction === 'down';
        scrollToggleBtn.dataset.direction = direction;
        scrollToggleBtn.dataset.wrap = wrapToTop ? 'true' : 'false';
        if (icon) {
            icon.classList.toggle('fa-arrow-down', isDown);
            icon.classList.toggle('fa-arrow-up', !isDown);
        }
        if (isDown) {
            scrollToggleBtn.setAttribute('aria-label', 'Scroll to next section');
            scrollToggleBtn.title = 'Next section';
        } else if (wrapToTop) {
            scrollToggleBtn.setAttribute('aria-label', 'Scroll to top');
            scrollToggleBtn.title = 'Back to top';
        } else {
            scrollToggleBtn.setAttribute('aria-label', 'Scroll to previous section');
            scrollToggleBtn.title = 'Previous section';
        }
    };

    let sections = getSections();

    const findCurrentIndex = () => {
        const y = (window.scrollY || window.pageYOffset) + getNavOffset() + topBias;
        let currentIndex = 0;
        for (let i = 0; i < sections.length; i += 1) {
            const top = sections[i].getBoundingClientRect().top + window.scrollY;
            if (top <= y) {
                currentIndex = i;
            } else {
                break;
            }
        }
        return currentIndex;
    };

    const scrollToIndex = (index) => {
        const target = sections[index];
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY;
        const offsetTop = Math.max(0, top - getNavOffset());
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    };

    const updateButton = () => {
        sections = getSections();
        const shouldShow = sections.length > 1;
        scrollToggleBtn.classList.toggle('is-visible', shouldShow);
        if (!shouldShow) return;

        const y = window.scrollY || window.pageYOffset;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const isNearEnd = maxScroll - y <= endThreshold;
        if (isNearEnd) {
            setDirection('up', true);
            return;
        }

        const currentIndex = findCurrentIndex();
        const isLast = currentIndex >= sections.length - 1;
        const direction = isLast ? 'up' : 'down';
        const wrapToTop = isLast;
        setDirection(direction, wrapToTop);
    };

    scrollToggleBtn.addEventListener('click', () => {
        sections = getSections();
        if (sections.length < 2) return;
        const currentIndex = findCurrentIndex();
        const direction =
            scrollToggleBtn.dataset.direction || (currentIndex >= sections.length - 1 ? 'up' : 'down');
        const wrapToTop = scrollToggleBtn.dataset.wrap === 'true';
        let targetIndex = currentIndex;
        if (direction === 'up') {
            targetIndex = wrapToTop ? 0 : Math.max(0, currentIndex - 1);
        } else {
            targetIndex = Math.min(sections.length - 1, currentIndex + 1);
        }
        scrollToIndex(targetIndex);
    });

    window.addEventListener('scroll', updateButton, { passive: true });
    window.addEventListener('resize', updateButton);
    updateButton();
}

function openLegalModal(type) {
    if (!legalDetails || !legalModal) return;
    const contentMap = {
        terms: {
            title: 'Terms of Service',
            body: `
                <p>MovieHub provides movie metadata, official trailers, and where-to-watch links. We do not host, stream, or distribute full movies.</p>
                <p>By using MovieHub, you agree to:</p>
                <ul>
                    <li>Use the service for personal, non-commercial purposes only.</li>
                    <li>Follow the terms of any third-party provider you visit.</li>
                    <li>Not scrape, reverse-engineer, or disrupt the service.</li>
                    <li>Not upload or submit unlawful or infringing content.</li>
                    <li>Not attempt to bypass security or access restrictions.</li>
                </ul>
                <p><strong>Accounts:</strong> If you create an account, you are responsible for keeping your credentials secure and for activity under your account.</p>
                <p><strong>Content accuracy:</strong> We rely on third-party data sources and do not guarantee the accuracy or completeness of listings, posters, or metadata.</p>
                <p><strong>Availability:</strong> We may change, suspend, or discontinue features at any time without notice.</p>
                <p><strong>Disclaimer:</strong> The service is provided "as is" without warranties of any kind.</p>
                <p><strong>Limitation of liability:</strong> We are not liable for indirect, incidental, or consequential damages arising from use of the service.</p>
            `
        },
        privacy: {
            title: 'Privacy Policy',
            body: `
                <p>We collect minimal data to operate and improve the site.</p>
                <ul>
                    <li><strong>Usage analytics:</strong> page views, device type, and general usage patterns.</li>
                    <li><strong>Contact form:</strong> name, email, subject, and message when you contact us.</li>
                    <li><strong>Account data:</strong> email and login details if you register.</li>
                    <li><strong>Local storage:</strong> optional preferences saved in your browser.</li>
                </ul>
                <p><strong>How we use data:</strong> to provide the service, respond to messages, and improve site performance.</p>
                <p><strong>Sharing:</strong> we do not sell personal data. We share data only when required by law or to protect service integrity.</p>
                <p><strong>Retention:</strong> contact messages are retained for support and administrative purposes.</p>
                <p>You can request access, correction, or deletion by emailing <strong><a href="https://mail.google.com/mail/?view=cm&fs=1&to=batijano58@gmail.com" target="_blank" rel="noopener noreferrer" class="legal-email-link"><i class="fas fa-envelope"></i> batijano58@gmail.com</a></strong>.</p>
            `
        },
        dmca: {
            title: 'DMCA Policy',
            body: `
                <p>If you are a rights holder and believe content is listed in error, you may request removal.</p>
                <ul>
                    <li>Send a notice to <strong><a href="https://mail.google.com/mail/?view=cm&fs=1&to=batijano58@gmail.com" target="_blank" rel="noopener noreferrer" class="legal-email-link"><i class="fas fa-envelope"></i> batijano58@gmail.com</a></strong>.</li>
                    <li>Include the movie title and the specific URL.</li>
                    <li>Provide evidence of your rights and a good-faith statement.</li>
                    <li>Include your full name, organization, and contact email.</li>
                    <li>Electronic signature is acceptable.</li>
                </ul>
                <p><strong>Review timeline:</strong> we typically respond within 3-5 business days.</p>
                <p><strong>Counter-notice:</strong> if content was removed in error, the affected party may submit a counter-notice and we will follow applicable procedures.</p>
            `
        },
        contact: {
            title: 'Contact',
            body: `
                <p>For support and inquiries, contact us using the form below or email:</p>
                <p><strong><a href="mailto:batijano58@gmail.com" class="legal-email">batijano58@gmail.com</a></strong></p>
                <p>WhatsApp: <strong>+251989977058</strong></p>
                <p>Telegram: <strong>@CMY_TR</strong></p>
                <p>Instagram: <strong>@bati_jano</strong></p>
                <p>Response time: 24-48 hours on business days.</p>
            `
        }
    };

    const item = contentMap[type];
    if (!item) return;

    legalDetails.innerHTML = `
        <h2>${item.title}</h2>
        ${item.body}
    `;
    legalModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function getLegalText(type) {
    if (type === 'terms') {
        return `Terms of Service

Effective Date: February 3, 2026

1. Service Description
MovieHub provides movie metadata, official trailers, and links to third-party providers. We do not host, stream, or distribute full movies.

2. Acceptable Use
You agree to:
- Use MovieHub for personal, non-commercial purposes.
- Follow the terms of any third-party providers you visit.
- Not scrape, reverse-engineer, or disrupt the service.
- Not upload or submit unlawful or infringing content.
- Not attempt to bypass security or access restrictions.

3. Accounts
If you create an account, you are responsible for keeping your credentials secure and for activity under your account.

4. Content Accuracy
We rely on third-party data sources and do not guarantee the accuracy or completeness of listings, posters, or metadata.

5. Third-Party Links
MovieHub links to external services. We are not responsible for their content, availability, or policies.

6. Availability and Changes
We may modify or discontinue features at any time without notice. We may update these Terms and will post the updated version.

7. Intellectual Property
Movie data and posters are provided through TMDB and other sources. All trademarks belong to their respective owners.

8. Disclaimer
MovieHub is provided "as is" without warranties of any kind.

9. Limitation of Liability
We are not liable for any indirect, incidental, or consequential damages arising from use of the service.

10. Contact
Questions about these Terms can be sent to batijano58@gmail.com.
`;
    }
    if (type === 'privacy') {
        return `Privacy Policy

Effective Date: February 3, 2026

1. Data We Collect
- Usage analytics (page views, device type, general usage patterns).
- Contact form submissions (name, email, subject, message).
- Account information (email and login details) if you register.
- Local storage preferences (filters and session state).

2. How We Use Data
- To provide and improve MovieHub.
- To respond to messages you send us.
- To maintain account access and security.

3. Data Sharing
We do not sell personal data. We share data only when required by law or to protect service integrity.

4. Data Retention
Contact messages are retained for support and administrative purposes. Account data is retained while your account is active.

5. Your Rights
You may request access, correction, or deletion of your data by emailing batijano58@gmail.com.

6. Security
We take reasonable measures to protect your data, but no system is 100% secure.

7. Contact
Questions about this policy can be sent to batijano58@gmail.com.
`;
    }
    if (type === 'dmca') {
        return `DMCA Policy

1. How to Submit a Notice
- Email batijano58@gmail.com with the movie title and the specific URL.
- Include evidence of your rights and a good-faith statement.
- Provide your full name, organization, and contact email.
- An electronic signature is acceptable.

2. Review Timeline
We typically respond within 3-5 business days.

3. Counter-Notice
If content was removed in error, the affected party may submit a counter-notice and we will follow applicable procedures.
`;
    }
    return '';
}


function renderMessages(items) {
    if (!messagesList) return;
    if (!Array.isArray(items) || items.length === 0) {
        messagesList.innerHTML = `<p class="form-note">No messages yet.</p>`;
        return;
    }
    messagesList.innerHTML = items.map(m => `
        <div class="message-item">
            <div><strong>${m.subject}</strong></div>
            <div class="message-meta">${m.name} - ${m.email} - ${new Date(m.createdAt).toLocaleString()}</div>
            <p>${m.message}</p>
            <button class="filter-btn secondary" data-delete="${m._id}">Delete</button>
        </div>
    `).join('');

    messagesList.querySelectorAll('button[data-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!adminToken) {
                setAdminFeedback('Please login first.', 'error');
                return;
            }
            const id = btn.dataset.delete;
            btn.disabled = true;
            try {
                const res = await fetch(`${API_BASE_URL}/admin/contact/messages/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Failed');
                }
                btn.closest('.message-item').remove();
                adminItemsCache = adminItemsCache.filter((item) => String(item._id) !== String(id));
                adminTotal = Math.max(0, (adminTotal || 0) - 1);
                updateAdminPagination();
                if (messagesList && !messagesList.querySelector('.message-item')) {
                    messagesList.innerHTML = `<p class="form-note">No messages yet.</p>`;
                }
                setAdminFeedback('Message deleted.', 'success');
            } catch (err) {
                console.error('Delete failed:', err.message);
                setAdminFeedback(err.message || 'Delete failed.', 'error');
                btn.disabled = false;
            }
        });
    });
}

function updateAdminPagination() {
    if (!adminPageIndicator || !adminPrevPage || !adminNextPage) return;
    const totalPages = Math.max(1, Math.ceil((adminTotal || 0) / 20));
    adminPageIndicator.textContent = `Page ${adminPage} of ${totalPages}`;
    adminPrevPage.disabled = adminPage <= 1;
    adminNextPage.disabled = adminPage >= totalPages;
}

function setActiveTab(sort) {
    document.querySelectorAll('.catalog-tabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sort);
    });
}

function setAdminStatus(isLoggedIn) {
    if (!adminStatusBadge) return;
    adminStatusBadge.textContent = isLoggedIn ? 'Logged in' : 'Logged out';
    adminStatusBadge.classList.toggle('ok', isLoggedIn);
}

async function loadAdminMessages() {
    if (!adminToken) {
        setAdminFeedback('Please login first.', 'error');
        return;
    }
    try {
        if (loadMessagesBtn) {
            loadMessagesBtn.disabled = true;
            loadMessagesBtn.innerHTML = `<span class="spinner-inline"></span> Loading...`;
        }
        setAdminFeedback('Loading messages...', 'info');
        const params = new URLSearchParams();
        params.set('page', String(adminPage));
        params.set('limit', '20');
        if (adminSearchInput && adminSearchInput.value.trim()) {
            params.set('q', adminSearchInput.value.trim());
        }
        if (adminDateFrom && adminDateFrom.value) params.set('from', adminDateFrom.value);
        if (adminDateTo && adminDateTo.value) params.set('to', adminDateTo.value);

        const res = await fetch(`${API_BASE_URL}/admin/contact/messages?${params.toString()}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Failed');
        }
        const data = await res.json();
        adminTotal = data.total || 0;
        adminItemsCache = data.items || [];
        renderMessages(adminItemsCache);
        updateAdminPagination();
        loadAdminStats();
        const count = Array.isArray(adminItemsCache) ? adminItemsCache.length : 0;
        setAdminFeedback(`Loaded ${count} message${count === 1 ? '' : 's'}.`, 'success');
    } catch (err) {
        console.error('Load messages failed:', err.message);
        if (messagesList) {
            messagesList.innerHTML = `<p class="form-note">Failed to load messages.</p>`;
        }
        setAdminFeedback(err.message || 'Failed to load messages.', 'error');
    } finally {
        if (loadMessagesBtn) {
            loadMessagesBtn.disabled = false;
            loadMessagesBtn.innerHTML = 'Load Messages';
        }
    }
}

async function loadAdminStats() {
    if (!adminToken) return;
    try {
        const res = await fetch(`${API_BASE_URL}/admin/contact/messages/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!res.ok) {
            throw new Error('Stats request failed');
        }
        const data = await res.json();
        if (statTotal) statTotal.textContent = data.total ?? '0';
        if (statToday) statToday.textContent = data.today ?? '0';
        if (statWeek) statWeek.textContent = data.week ?? '0';
    } catch (err) {
        console.error('Stats load failed:', err.message);
        // Fallback to client-side counts from the loaded page
        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const items = Array.isArray(adminItemsCache) ? adminItemsCache : [];
        const todayCount = items.filter(m => new Date(m.createdAt) >= startToday).length;
        const weekCount = items.filter(m => new Date(m.createdAt) >= startWeek).length;
        if (statTotal) statTotal.textContent = adminTotal || items.length || 0;
        if (statToday) statToday.textContent = todayCount;
        if (statWeek) statWeek.textContent = weekCount;
    }
}

function startAdminAutoRefresh() {
    stopAdminAutoRefresh();
    const seconds = parseInt(adminRefreshInterval ? adminRefreshInterval.value : '30', 10);
    adminRefreshTimer = setInterval(() => {
        if (adminToken) {
            loadAdminMessages();
        }
    }, seconds * 1000);
}

function stopAdminAutoRefresh() {
    if (adminRefreshTimer) {
        clearInterval(adminRefreshTimer);
        adminRefreshTimer = null;
    }
}
// Expose functions to global scope for HTML onclick

