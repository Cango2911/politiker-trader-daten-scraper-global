/**
 * FinanceHub - Modern Financial Platform
 * Main JavaScript Application
 */

// ===================================
// Global Configuration
// ===================================
const CONFIG = {
    API_BASE_URL: window.location.origin + '/api',
    ALPHA_VANTAGE_KEY: 'demo', // Will be replaced with actual key from backend
    UPDATE_INTERVAL: 60000, // 60 seconds
    SLIDER_INTERVAL: 5000, // 5 seconds
};

// ===================================
// Theme Management
// ===================================
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggle());
    }

    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
    }

    applyTheme() {
        document.body.classList.toggle('dark-theme', this.theme === 'dark');
        document.body.classList.toggle('light-theme', this.theme === 'light');
        
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
        }
    }
}

// ===================================
// Hero Slider
// ===================================
class HeroSlider {
    constructor() {
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.slide');
        this.dots = document.querySelectorAll('.dot');
        this.autoPlayInterval = null;
        this.init();
    }

    init() {
        // Prev/Next buttons
        document.querySelector('.slider-btn.prev')?.addEventListener('click', () => this.prevSlide());
        document.querySelector('.slider-btn.next')?.addEventListener('click', () => this.nextSlide());

        // Dots navigation
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        // Auto-play
        this.startAutoPlay();
        
        // Pause on hover
        document.querySelector('.hero-slider')?.addEventListener('mouseenter', () => this.stopAutoPlay());
        document.querySelector('.hero-slider')?.addEventListener('mouseleave', () => this.startAutoPlay());
    }

    goToSlide(index) {
        this.slides[this.currentSlide].classList.remove('active');
        this.dots[this.currentSlide].classList.remove('active');
        
        this.currentSlide = index;
        
        this.slides[this.currentSlide].classList.add('active');
        this.dots[this.currentSlide].classList.add('active');
    }

    nextSlide() {
        const next = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(next);
    }

    prevSlide() {
        const prev = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prev);
    }

    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => this.nextSlide(), CONFIG.SLIDER_INTERVAL);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
    }
}

// ===================================
// Market Data Manager
// ===================================
class MarketDataManager {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 60000; // 1 minute
    }

    async fetchMarketData() {
        try {
            // Fetch crypto data from CoinGecko
            const cryptoData = await this.fetchCryptoData();
            
            // Fetch indices data (simulated for now - will use Alpha Vantage)
            const indicesData = await this.fetchIndicesData();
            
            // Fetch commodities data (simulated)
            const commoditiesData = await this.fetchCommoditiesData();
            
            // Fetch forex data (simulated)
            const forexData = await this.fetchForexData();
            
            return {
                crypto: cryptoData,
                indices: indicesData,
                commodities: commoditiesData,
                forex: forexData
            };
        } catch (error) {
            console.error('Error fetching market data:', error);
            return null;
        }
    }

    async fetchCryptoData() {
        const cached = this.getFromCache('crypto');
        if (cached) return cached;

        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true');
            const data = await response.json();
            
            const formatted = data.map(coin => ({
                id: coin.id,
                symbol: coin.symbol.toUpperCase(),
                name: coin.name,
                price: coin.current_price,
                change24h: coin.price_change_percentage_24h,
                volume: coin.total_volume,
                marketCap: coin.market_cap,
                image: coin.image,
                sparkline: coin.sparkline_in_7d.price,
                category: 'crypto'
            }));
            
            this.setCache('crypto', formatted);
            return formatted;
        } catch (error) {
            console.error('Error fetching crypto data:', error);
            return [];
        }
    }

    async fetchIndicesData() {
        // Simulated data - will be replaced with Alpha Vantage API
        return [
            { symbol: 'SPX', name: 'S&P 500', price: 4550.50, change24h: 1.25, volume: 0, marketCap: 0, category: 'indices' },
            { symbol: 'DAX', name: 'DAX 40', price: 16450.20, change24h: 0.65, volume: 0, marketCap: 0, category: 'indices' },
            { symbol: 'IXIC', name: 'NASDAQ', price: 14200.10, change24h: 1.50, volume: 0, marketCap: 0, category: 'indices' },
            { symbol: 'FTSE', name: 'FTSE 100', price: 7650.40, change24h: -0.30, volume: 0, marketCap: 0, category: 'indices' },
        ];
    }

    async fetchCommoditiesData() {
        // Simulated data
        return [
            { symbol: 'BRENT', name: 'Brent Crude Oil', price: 85.32, change24h: -1.38, volume: 0, marketCap: 0, category: 'commodities' },
            { symbol: 'GOLD', name: 'Gold', price: 2050.40, change24h: 0.45, volume: 0, marketCap: 0, category: 'commodities' },
        ];
    }

    async fetchForexData() {
        // Simulated data
        return [
            { symbol: 'EURUSD', name: 'EUR/USD', price: 1.0856, change24h: 0.08, volume: 0, marketCap: 0, category: 'forex' },
            { symbol: 'GBPUSD', name: 'GBP/USD', price: 1.2698, change24h: 0.20, volume: 0, marketCap: 0, category: 'forex' },
        ];
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
}

// ===================================
// Market Ticker Updates
// ===================================
async function updateMarketTicker() {
    const marketData = new MarketDataManager();
    const data = await marketData.fetchMarketData();
    
    if (!data) return;

    // Update S&P 500
    const sp500 = data.indices.find(i => i.symbol === 'SPX');
    if (sp500) {
        updateTickerItem('ticker-sp500', sp500.price, sp500.change24h);
    }

    // Update DAX
    const dax = data.indices.find(i => i.symbol === 'DAX');
    if (dax) {
        updateTickerItem('ticker-dax', dax.price, dax.change24h);
    }

    // Update BTC
    const btc = data.crypto.find(c => c.symbol === 'BTC');
    if (btc) {
        updateTickerItem('ticker-btc', btc.price, btc.change24h);
    }

    // Update Oil
    const oil = data.commodities.find(c => c.symbol === 'BRENT');
    if (oil) {
        updateTickerItem('ticker-oil', oil.price, oil.change24h);
    }

    // Update EUR/USD
    const eurusd = data.forex.find(f => f.symbol === 'EURUSD');
    if (eurusd) {
        updateTickerItem('ticker-eurusd', eurusd.price, eurusd.change24h);
    }
}

function updateTickerItem(id, price, change) {
    const item = document.getElementById(id);
    if (!item) return;

    const valueEl = item.querySelector('.ticker-value');
    const changeEl = item.querySelector('.ticker-change');

    if (valueEl) {
        valueEl.textContent = formatPrice(price);
    }

    if (changeEl) {
        const formattedChange = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
        changeEl.textContent = formattedChange;
        changeEl.classList.toggle('positive', change >= 0);
        changeEl.classList.toggle('negative', change < 0);
    }
}

// ===================================
// Market Table Rendering
// ===================================
async function loadMarketTable() {
    const marketData = new MarketDataManager();
    const data = await marketData.fetchMarketData();
    
    if (!data) {
        document.getElementById('marketTableBody').innerHTML = '<tr><td colspan="6" class="loading-cell">Failed to load market data</td></tr>';
        return;
    }

    // Combine all data
    const allMarkets = [
        ...data.crypto,
        ...data.indices,
        ...data.commodities,
        ...data.forex
    ];

    renderMarketTable(allMarkets);
}

function renderMarketTable(markets) {
    const tbody = document.getElementById('marketTableBody');
    if (!tbody) return;

    tbody.innerHTML = markets.map(market => `
        <tr>
            <td>
                <div class="asset-info">
                    ${market.image ? `<img src="${market.image}" alt="${market.name}" class="asset-icon">` : '<span class="asset-icon">📊</span>'}
                    <div>
                        <div class="asset-name">${market.name}</div>
                        <div class="asset-symbol">${market.symbol}</div>
                    </div>
                </div>
            </td>
            <td>${formatPrice(market.price)}</td>
            <td>
                <span class="price-change ${market.change24h >= 0 ? 'positive' : 'negative'}">
                    ${market.change24h >= 0 ? '+' : ''}${market.change24h.toFixed(2)}%
                </span>
            </td>
            <td>${market.volume > 0 ? formatVolume(market.volume) : 'N/A'}</td>
            <td>${market.marketCap > 0 ? formatVolume(market.marketCap) : 'N/A'}</td>
            <td>
                ${market.sparkline ? renderSparkline(market.sparkline) : '<span style="color: var(--text-tertiary);">No data</span>'}
            </td>
        </tr>
    `).join('');

    // Add filter functionality
    setupMarketFilters(markets);
}

function renderSparkline(data) {
    if (!data || data.length === 0) return '<span>-</span>';
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 60;
        const y = 20 - ((value - min) / range) * 20;
        return `${x},${y}`;
    }).join(' ');
    
    const color = data[data.length - 1] > data[0] ? 'var(--success)' : 'var(--danger)';
    
    return `<svg width="60" height="20" style="display: block;">
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" />
    </svg>`;
}

function setupMarketFilters(allMarkets) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            const filtered = category === 'all' ? allMarkets : allMarkets.filter(m => m.category === category);
            renderMarketTable(filtered);
        });
    });
}

// ===================================
// Political Trades Preview
// ===================================
async function loadPoliticalTradesPreview() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/trades?limit=5`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            renderPoliticalTradesPreview(data.data);
        }
    } catch (error) {
        console.error('Error loading political trades:', error);
    }
}

function renderPoliticalTradesPreview(trades) {
    const tbody = document.querySelector('#politicalTradesPreview tbody');
    if (!tbody) return;

    tbody.innerHTML = trades.map(trade => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    ${trade.politician.imageUrl 
                        ? `<img src="${trade.politician.imageUrl}" alt="${trade.politician.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` 
                        : `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem;">${trade.politician.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>`
                    }
                    <span style="font-weight: 600;">${trade.politician.name}</span>
                </div>
            </td>
            <td>
                <span style="display: flex; align-items: center; gap: 0.5rem;">
                    ${getCountryFlag(trade.country)}
                    ${formatCountry(trade.country)}
                </span>
            </td>
            <td>
                <div>
                    <div style="font-weight: 600;">${trade.trade.ticker || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">${trade.trade.assetName || '-'}</div>
                </div>
            </td>
            <td>
                <span class="trade-type-badge ${trade.trade.type}">
                    ${trade.trade.type.toUpperCase()}
                </span>
            </td>
            <td>${trade.trade.size || 'N/A'}</td>
            <td>${formatDate(trade.dates.transaction)}</td>
        </tr>
    `).join('');
}

// ===================================
// Download Market Report
// ===================================
document.getElementById('downloadMarketData')?.addEventListener('click', async () => {
    const marketData = new MarketDataManager();
    const data = await marketData.fetchMarketData();
    
    if (!data) {
        alert('Failed to fetch market data');
        return;
    }

    // Combine all data
    const allMarkets = [
        ...data.crypto,
        ...data.indices,
        ...data.commodities,
        ...data.forex
    ];

    // Create CSV
    const csv = [
        ['Asset', 'Symbol', 'Price', 'Change 24h (%)', 'Volume', 'Market Cap', 'Category'],
        ...allMarkets.map(m => [
            m.name,
            m.symbol,
            m.price,
            m.change24h,
            m.volume,
            m.marketCap,
            m.category
        ])
    ].map(row => row.join(',')).join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
});

// ===================================
// Newsletter Form
// ===================================
document.getElementById('newsletterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    
    // Simulate submission
    alert(`Thank you for subscribing with ${email}! We'll send you daily market insights.`);
    e.target.reset();
});

// ===================================
// Utility Functions
// ===================================
function formatPrice(price) {
    if (price > 1000) {
        return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '$' + price.toFixed(price < 1 ? 4 : 2);
}

function formatVolume(volume) {
    if (volume >= 1e12) return '$' + (volume / 1e12).toFixed(2) + 'T';
    if (volume >= 1e9) return '$' + (volume / 1e9).toFixed(2) + 'B';
    if (volume >= 1e6) return '$' + (volume / 1e6).toFixed(2) + 'M';
    if (volume >= 1e3) return '$' + (volume / 1e3).toFixed(2) + 'K';
    return '$' + volume.toFixed(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCountry(code) {
    const countries = {
        'usa': 'United States',
        'germany': 'Germany',
        'uk': 'United Kingdom',
        'france': 'France',
        'russia': 'Russia'
    };
    return countries[code] || code.toUpperCase();
}

function getCountryFlag(code) {
    const flags = {
        'usa': '🇺🇸',
        'germany': '🇩🇪',
        'uk': '🇬🇧',
        'france': '🇫🇷',
        'russia': '🇷🇺'
    };
    return flags[code] || '🌍';
}

// ===================================
// Initialize Application
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 FinanceHub Initializing...');
    
    // Initialize theme
    new ThemeManager();
    
    // Initialize hero slider
    if (document.querySelector('.hero-slider')) {
        new HeroSlider();
    }
    
    // Load initial data
    updateMarketTicker();
    loadMarketTable();
    loadPoliticalTradesPreview();
    
    // Set up periodic updates
    setInterval(updateMarketTicker, CONFIG.UPDATE_INTERVAL);
    
    console.log('✅ FinanceHub Ready!');
});
