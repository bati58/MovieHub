const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchSuggestions = document.getElementById('searchSuggestions');

let searchTimeout;

// Search functionality
searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        searchSuggestions.style.display = 'none';
        return;
    }
    
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/movies/search/suggestions?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            const movies = await response.json();
            
            displaySearchSuggestions(movies);
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            searchSuggestions.style.display = 'none';
        }
    }, 300);
});

// Display search suggestions
function displaySearchSuggestions(movies) {
    if (!movies || movies.length === 0) {
        searchSuggestions.innerHTML = '<div class="suggestion-item">No movies found</div>';
        searchSuggestions.style.display = 'block';
        return;
    }
    
    searchSuggestions.innerHTML = '';
    
    movies.forEach(movie => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.dataset.id = movie._id;
        
        suggestionItem.innerHTML = `
            <img src="${movie.poster || 'https://via.placeholder.com/40x60?text=No+Image'}" 
                 alt="${movie.title}"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/40x60?text=No+Image'">
            <div>
                <div>${movie.title}</div>
                <small>${movie.year || 'N/A'}</small>
            </div>
        `;
        
        suggestionItem.addEventListener('click', () => {
            showMovieDetails(movie._id);
            searchSuggestions.style.display = 'none';
            searchInput.value = '';
        });
        
        searchSuggestions.appendChild(suggestionItem);
    });
    
    searchSuggestions.style.display = 'block';
}

// Search button click
searchBtn.addEventListener('click', performSearch);

// Enter key for search
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Perform search
async function performSearch(queryOverride) {
    const query = (queryOverride || searchInput.value || '').trim();
    
    if (!query) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/movies?search=${encodeURIComponent(query)}`);
        const payload = await response.json();
        const movies = Array.isArray(payload) ? payload : (payload.items || []);
        
        // Display search results in modal
        const modalContent = `
            <h2>Search Results for "${query}"</h2>
            <p>Found ${movies.length} movie(s)</p>
            <div class="movies-grid" id="searchResults"></div>
        `;
        
        movieDetails.innerHTML = modalContent;
        const resultsContainer = document.getElementById('searchResults');
        
        if (movies.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-movies" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No movies found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
        } else {
            displayMovies(movies, resultsContainer);
        }
        
        movieModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        searchSuggestions.style.display = 'none';
    } catch (error) {
        console.error('Error performing search:', error);
        alert('Search failed. Please ensure the backend is running at http://localhost:5000');
    }
}

window.performSearch = performSearch;

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
        searchSuggestions.style.display = 'none';
    }
});
