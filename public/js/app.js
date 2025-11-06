/**
 * 🔥 Whiterock Industrie - HYBRID MONOPOL Frontend
 * "Scrape Everything, Give It Back Free"
 * 
 * Features:
 * - Auto-Scrolling Market Ticker
 * - Real-Time Data from Hybrid Aggregator
 * - TradingView Widgets Integration
 * - Smooth Scroll Navigation
 * - Interactive Elements
 */

// ===================================
// Global Configuration
// ===================================
const CONFIG = {
    API_BASE_URL: window.location.origin + '/api',
    UPDATE_INTERVAL: 60000, // 60 seconds
    SLIDER_INTERVAL: 5000, // 5 seconds
    TICKER_SCROLL_SPEED: 50, // pixels per second
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
        if (this.slides.length > 0) this.init();
    }

    init() {
        document.querySelector('.slider-btn.prev')?.addEventListener('click', () => this.prevSlide());
        document.querySelector('.slider-btn.next')?.addEventListener('click', () => this.nextSlide());

        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        this.startAutoPlay();
        
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
// Auto-Scrolling Market Ticker
// ===================================
class AutoScrollingTicker {
    constructor() {
        this.ticker = document.querySelector('.market-ticker');
        this.isScrolling = false;
        if (this.ticker) this.init();
    }

    init() {
        // Aktiviere Auto-Scrolling wenn viele Items vorhanden sind
        const items = this.ticker.querySelectorAll('.ticker-item');
        if (items.length > 5) {
            this.enableAutoScroll();
        }
    }

    enableAutoScroll() {
        this.isScrolling = true;
        this.ticker.style.overflowX = 'auto';
        this.ticker.style.scrollBehavior = 'smooth';
        
        let scrollDirection = 1;
        
        setInterval(() => {
            if (!this.isScrolling) return;
            
            if (this.ticker.scrollLeft >= (this.ticker.scrollWidth - this.ticker.clientWidth)) {
                scrollDirection = -1;
            } else if (this.ticker.scrollLeft <= 0) {
                scrollDirection = 1;
            }
            
            this.ticker.scrollLeft += scrollDirection;
        }, 50);

        // Pause on hover
        this.ticker.addEventListener('mouseenter', () => { this.isScrolling = false; });
        this.ticker.addEventListener('mouseleave', () => { this.isScrolling = true; });
    }
}

// ===================================
// Hybrid Market Data Manager
// ===================================
class HybridMarketDataManager {
    async fetchAllMarkets() {
        try {
            showLoading('market-ticker');
            showLoading('marketTableBody');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/hybrid-market/all`);
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Loaded market data from:', result.sources);
                return result.data;
            } else {
                console.warn('⚠️ Using fallback data');
                return this.getFallbackData();
            }
        } catch (error) {
            console.error('❌ Error fetching hybrid market data:', error);
            return this.getFallbackData();
        }
    }

    getFallbackData() {
        return {
            crypto: [],
            forex: [
                { symbol: 'EURUSD', name: 'EUR/USD', price: 1.0856, changePercent: '0.08', category: 'forex' },
                { symbol: 'GBPUSD', name: 'GBP/USD', price: 1.2698, changePercent: '0.20', category: 'forex' }
            ],
            indices: [
                { symbol: 'SPX', name: 'S&P 500', price: 4550.50, changePercent: '1.25', category: 'indices' },
                { symbol: 'DJI', name: 'Dow Jones', price: 35420.30, changePercent: '0.85', category: 'indices' },
                { symbol: 'NDX', name: 'NASDAQ 100', price: 14200.10, changePercent: '1.50', category: 'indices' }
            ],
            commodities: [
                { symbol: 'BRENT', name: 'Brent Crude Oil', price: 85.32, changePercent: '-1.38', category: 'commodities' },
                { symbol: 'GOLD', name: 'Gold', price: 2050.40, changePercent: '0.45', category: 'commodities' }
            ],
            sentiment: {
                fearGreedIndex: 47,
                sentiment: 'Neutral'
            }
        };
    }
}

// ===================================
// Market Ticker Updates
// ===================================
async function updateMarketTicker() {
    const manager = new HybridMarketDataManager();
    const data = await manager.fetchAllMarkets();
    
    if (!data) return;

    // Update S&P 500
    const sp500 = data.indices.find(i => i.symbol === 'SPX' || i.symbol === 'SPY');
    if (sp500) updateTickerItem('ticker-sp500', sp500.price, sp500.changePercent);

    // Update DAX (wenn verfügbar)
    const dax = data.indices.find(i => i.symbol === 'DAX');
    if (dax) updateTickerItem('ticker-dax', dax.price, dax.changePercent);

    // Update BTC
    const btc = data.crypto.find(c => c.symbol === 'BTC');
    if (btc) updateTickerItem('ticker-btc', btc.price, btc.changePercent || btc.change24h);

    // Update Oil
    const oil = data.commodities.find(c => c.symbol === 'BRENT' || c.symbol === 'WTI');
    if (oil) updateTickerItem('ticker-oil', oil.price, oil.changePercent);

    // Update EUR/USD
    const eurusd = data.forex.find(f => f.symbol === 'EURUSD');
    if (eurusd) updateTickerItem('ticker-eurusd', eurusd.price, eurusd.changePercent);

    hideLoading('market-ticker');
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
        const changeNum = parseFloat(change);
        const formattedChange = changeNum >= 0 ? `+${changeNum.toFixed(2)}%` : `${changeNum.toFixed(2)}%`;
        changeEl.textContent = formattedChange;
        changeEl.classList.toggle('positive', changeNum >= 0);
        changeEl.classList.toggle('negative', changeNum < 0);
    }
}

// ===================================
// Market Table Rendering
// ===================================
async function loadMarketTable() {
    const manager = new HybridMarketDataManager();
    const data = await manager.fetchAllMarkets();
    
    if (!data) {
        document.getElementById('marketTableBody').innerHTML = '<tr><td colspan="6" class="loading-cell">Failed to load market data</td></tr>';
        return;
    }

    // Combine all data
    const allMarkets = [
        ...data.crypto.slice(0, 10), // Top 10 crypto
        ...data.indices,
        ...data.commodities,
        ...data.forex
    ];

    renderMarketTable(allMarkets);
    hideLoading('marketTableBody');
}

function renderMarketTable(markets) {
    const tbody = document.getElementById('marketTableBody');
    if (!tbody) return;

    tbody.innerHTML = markets.map(market => `
        <tr onclick="openMarketDetail('${market.symbol}')" style="cursor: pointer;">
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
                <span class="price-change ${parseFloat(market.changePercent || market.change24h || 0) >= 0 ? 'positive' : 'negative'}">
                    ${parseFloat(market.changePercent || market.change24h || 0) >= 0 ? '+' : ''}${parseFloat(market.changePercent || market.change24h || 0).toFixed(2)}%
                </span>
            </td>
            <td>${market.volume ? formatVolume(market.volume) : 'N/A'}</td>
            <td>${market.marketCap ? formatVolume(market.marketCap) : 'N/A'}</td>
            <td>
                ${market.sparkline && market.sparkline.length > 0 ? renderSparkline(market.sparkline) : '<span style="color: var(--text-tertiary);">No data</span>'}
            </td>
        </tr>
    `).join('');

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
// Market Detail Modal (TradingView Integration)
// ===================================
function openMarketDetail(symbol) {
    alert(`Öffne TradingView Chart für ${symbol}\n\nKommt in der nächsten Version!`);
    // TODO: TradingView Chart Modal implementieren
}

// ===================================
// Fear & Greed Index Update
// ===================================
async function updateFearGreedIndex() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/hybrid-market/sentiment`);
        const result = await response.json();
        
        if (result.success) {
            const { fearGreedIndex, sentiment } = result.data;
            
            // Update Gauge
            const needle = document.querySelector('.gauge-needle');
            if (needle) {
                // Rotate needle (0-180 degrees)
                const rotation = (fearGreedIndex / 100) * 180;
                needle.style.transform = `rotate(${rotation}deg)`;
            }
            
            // Update Value
            const valueNumber = document.querySelector('.value-number');
            const valueLabel = document.querySelector('.value-label');
            if (valueNumber) valueNumber.textContent = fearGreedIndex;
            if (valueLabel) valueLabel.textContent = sentiment;
        }
    } catch (error) {
        console.error('Error updating Fear & Greed:', error);
    }
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
// Smooth Scroll Navigation
// ===================================
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===================================
// Download Market Report
// ===================================
document.getElementById('downloadMarketData')?.addEventListener('click', async () => {
    const manager = new HybridMarketDataManager();
    const data = await manager.fetchAllMarkets();
    
    if (!data) {
        alert('Failed to fetch market data');
        return;
    }

    const allMarkets = [
        ...data.crypto,
        ...data.indices,
        ...data.commodities,
        ...data.forex
    ];

    const csv = [
        ['Asset', 'Symbol', 'Price', 'Change 24h (%)', 'Volume', 'Market Cap', 'Category', 'Source'],
        ...allMarkets.map(m => [
            m.name,
            m.symbol,
            m.price,
            m.changePercent || m.change24h || 0,
            m.volume || '',
            m.marketCap || '',
            m.category,
            m.source || 'hybrid'
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hybrid-market-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
});

// ===================================
// Newsletter Form
// ===================================
document.getElementById('newsletterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    
    alert(`✅ Danke für deine Anmeldung mit ${email}!\n\nDu erhältst täglich:\n- Marktanalysen\n- Politiker-Trading-Alerts\n- AI-generierte Insights`);
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

function showLoading(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('loading');
}

function hideLoading(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('loading');
}

// ===================================
// Initialize Application
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔥 Whiterock Industrie - HYBRID MONOPOL Initializing...');
    console.log('📡 "Scrape Everything, Give It Back Free"');
    
    // Initialize theme
    new ThemeManager();
    
    // Initialize hero slider
    if (document.querySelector('.hero-slider')) {
        new HeroSlider();
    }
    
    // Initialize auto-scrolling ticker
    new AutoScrollingTicker();
    
    // Setup smooth scroll navigation
    setupSmoothScroll();
    
    // Load initial data
    updateMarketTicker();
    loadMarketTable();
    updateFearGreedIndex();
    loadPoliticalTradesPreview();
    
    // Set up periodic updates
    setInterval(updateMarketTicker, CONFIG.UPDATE_INTERVAL);
    setInterval(updateFearGreedIndex, CONFIG.UPDATE_INTERVAL);
    
    console.log('✅ Whiterock Industrie Ready!');
    console.log('🎯 Datenquellen: CoinGecko + Alpha Vantage + Politiker-DB');
});
