// ===================================
// GLOBAL CONFIG
// ===================================

const API_BASE = window.location.origin;
let currentPage = 1;
let currentFilters = {};

// ===================================
// THEME TOGGLE
// ===================================

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const body = document.body;

const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
    body.classList.add('light-theme');
    themeIcon.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');
    themeIcon.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// ===================================
// HERO SLIDER (Swiper.js)
// ===================================

const breakingNewsSwiper = new Swiper('.breaking-news-slider', {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
});

// ===================================
// MARKET TICKER BAR (Alpha Vantage)
// ===================================

async function loadMarketTicker() {
    const tickerItems = document.querySelectorAll('.ticker-item');
    
    // Simulated data (replace with Alpha Vantage API calls)
    const marketData = {
        'SPX': { value: 4550.50, change: 0.37 },
        'DJI': { value: 35420.30, change: 0.15 },
        'DAX': { value: 16450.20, change: 0.65 },
        'BTC': { value: 103890.00, change: 2.79 },
        'EUR/USD': { value: 1.0856, change: 0.08 },
        'OIL': { value: 78.45, change: -1.38 }
    };
    
    tickerItems.forEach(item => {
        const symbol = item.dataset.symbol;
        const data = marketData[symbol];
        
        if (data) {
            const valueSpan = item.querySelector('.ticker-value');
            const changeSpan = item.querySelector('.ticker-change');
            
            if (symbol === 'BTC') {
                valueSpan.textContent = `$${data.value.toLocaleString('en-US', {minimumFractionDigits: 0})}`;
            } else if (symbol === 'EUR/USD') {
                valueSpan.textContent = data.value.toFixed(4);
            } else {
                valueSpan.textContent = data.value.toLocaleString('en-US', {minimumFractionDigits: 2});
            }
            
            const isPositive = data.change >= 0;
            changeSpan.textContent = `${isPositive ? '+' : ''}${data.change.toFixed(2)}%`;
            changeSpan.className = `ticker-change ${isPositive ? 'positive' : 'negative'}`;
        }
    });
}

// ===================================
// MARKET SENTIMENT & REGIONAL FILTERS
// ===================================

const regionButtons = document.querySelectorAll('.region-btn');

regionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        regionButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const region = btn.dataset.region;
        loadSentimentData(region);
    });
});

function loadSentimentData(region) {
    console.log(`Loading sentiment data for region: ${region}`);
    // This would fetch region-specific data from your API
    // For now, it's static in HTML
}

// ===================================
// POLITICIAN TRADES TABLE
// ===================================

async function loadTrades(page = 1, filters = {}) {
    try {
        const params = new URLSearchParams({
            page,
            limit: 20,
            ...filters
        });
        
        const response = await fetch(`${API_BASE}/api/trades?${params}`);
        const data = await response.json();
        
        if (data.success) {
            renderTrades(data.data);
            updatePagination(data.pagination);
        }
    } catch (error) {
        console.error('Error loading trades:', error);
        showError('Failed to load trades. Please try again.');
    }
}

function renderTrades(trades) {
    const tbody = document.getElementById('tradesTableBody');
    
    if (!trades || trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">No trades found</td></tr>';
        return;
    }
    
    tbody.innerHTML = trades.map((trade, index) => {
        const country = trade.country.toUpperCase();
        const countryFlag = getCountryFlag(country);
        const tradeType = trade.trade.type.toUpperCase();
        const tradeTypeClass = trade.trade.type === 'purchase' ? 'buy' : 'sell';
        
        return `
            <tr>
                <td>${(currentPage - 1) * 20 + index + 1}</td>
                <td>
                    <div class="politician-cell">
                        ${trade.politician.imageUrl ? 
                            `<img src="${trade.politician.imageUrl}" alt="${trade.politician.name}" class="politician-avatar">` :
                            `<div class="politician-avatar-fallback">${getInitials(trade.politician.name)}</div>`
                        }
                        <div class="politician-info">
                            <span class="politician-name">${trade.politician.name}</span>
                            ${trade.politician.party ? `<span class="politician-party">${trade.politician.party}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td>${countryFlag} ${country}</td>
                <td>
                    <div class="asset-cell">
                        ${trade.trade.ticker ? `<span class="asset-ticker">${trade.trade.ticker}</span>` : ''}
                        <span class="asset-name">${trade.trade.assetName || 'N/A'}</span>
                    </div>
                </td>
                <td><span class="trade-badge ${tradeTypeClass}">${tradeType}</span></td>
                <td>${formatAmount(trade.trade.sizeMin, trade.trade.sizeMax)}</td>
                <td>${trade.trade.price ? `$${trade.trade.price.toFixed(2)}` : '—'}</td>
                <td>${formatDate(trade.dates.transaction)}</td>
            </tr>
        `;
    }).join('');
}

function updatePagination(pagination) {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (pagination) {
        pageInfo.textContent = `Page ${pagination.page} of ${pagination.pages}`;
        prevBtn.disabled = pagination.page === 1;
        nextBtn.disabled = pagination.page === pagination.pages;
    }
}

// ===================================
// FILTERS & SEARCH
// ===================================

const countryFilter = document.getElementById('countryFilter');
const tradeTypeFilter = document.getElementById('tradeTypeFilter');
const searchInput = document.getElementById('searchInput');

countryFilter.addEventListener('change', applyFilters);
tradeTypeFilter.addEventListener('change', applyFilters);
searchInput.addEventListener('input', debounce(applyFilters, 500));

function applyFilters() {
    currentFilters = {
        country: countryFilter.value,
        tradeType: tradeTypeFilter.value,
        search: searchInput.value
    };
    
    currentPage = 1;
    loadTrades(currentPage, currentFilters);
}

// ===================================
// PAGINATION
// ===================================

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadTrades(currentPage, currentFilters);
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    currentPage++;
    loadTrades(currentPage, currentFilters);
});

// ===================================
// DOWNLOAD REPORT
// ===================================

document.getElementById('downloadBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE}/api/trades/export`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentFilters)
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `politician-trades-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            showError('Download failed. Please try again.');
        }
    } catch (error) {
        console.error('Download error:', error);
        showError('Download failed. Please try again.');
    }
});

// ===================================
// NEWSLETTER SIGNUP
// ===================================

document.getElementById('newsletterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = e.target.querySelector('input[type="email"]').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        if (response.ok) {
            showSuccess('Successfully subscribed to newsletter!');
            e.target.reset();
        } else {
            showError('Subscription failed. Please try again.');
        }
    } catch (error) {
        console.error('Newsletter error:', error);
        showError('Subscription failed. Please try again.');
    }
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

function getCountryFlag(countryCode) {
    const flags = {
        'USA': '🇺🇸',
        'GERMANY': '🇩🇪',
        'UK': '🇬🇧',
        'FRANCE': '🇫🇷',
        'RUSSIA': '🇷🇺',
        'CHINA': '🇨🇳',
        'JAPAN': '🇯🇵',
        'INDIA': '🇮🇳'
    };
    return flags[countryCode] || '🌍';
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

function formatAmount(min, max) {
    if (!min && !max) return '—';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max.toLocaleString()}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showSuccess(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===================================
// INITIALIZE ON PAGE LOAD
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    loadMarketTicker();
    loadTrades(1);
    
    // Refresh market ticker every 30 seconds
    setInterval(loadMarketTicker, 30000);
});
