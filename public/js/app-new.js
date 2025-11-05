// ===================================
// THEME TOGGLE
// ===================================

const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
body.className = savedTheme === 'light' ? 'light-theme' : 'dark-theme';
updateThemeIcon();

themeToggle.addEventListener('click', () => {
    const isLight = body.classList.contains('light-theme');
    body.className = isLight ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', isLight ? 'dark' : 'light');
    updateThemeIcon();
});

function updateThemeIcon() {
    const icon = themeToggle.querySelector('.theme-icon');
    icon.textContent = body.classList.contains('light-theme') ? '☀️' : '🌙';
}

// ===================================
// HERO SLIDER
// ===================================

const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prevSlide');
const nextBtn = document.getElementById('nextSlide');
const dotsContainer = document.getElementById('sliderDots');

let currentSlide = 0;
let slideInterval;

// Create dots
slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('slider-dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll('.slider-dot');

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[index].classList.add('active');
    dots[index].classList.add('active');
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
}

function goToSlide(index) {
    currentSlide = index;
    showSlide(currentSlide);
    resetInterval();
}

function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
}

prevBtn.addEventListener('click', () => {
    prevSlide();
    resetInterval();
});

nextBtn.addEventListener('click', () => {
    nextSlide();
    resetInterval();
});

// Auto-play
slideInterval = setInterval(nextSlide, 5000);

// ===================================
// MARKET TICKER
// ===================================

async function loadMarketTicker() {
    const tickerContainer = document.getElementById('marketTickerItems');
    
    try {
        // Fetch real-time market data
        const markets = [
            { symbol: 'BTC/USD', price: 103890, change: 2.79, type: 'crypto' },
            { symbol: 'ETH/USD', price: 3431, change: 4.93, type: 'crypto' },
            { symbol: 'S&P 500', price: 4550, change: 0.37, type: 'index' },
            { symbol: 'NASDAQ', price: 14200, change: 1.50, type: 'index' },
            { symbol: 'EUR/USD', price: 1.08, change: 0.08, type: 'forex' },
            { symbol: 'Gold', price: 2045, change: -0.52, type: 'commodity' },
            { symbol: 'Oil (Brent)', price: 82.5, change: -1.38, type: 'commodity' },
            { symbol: 'TSLA', price: 238, change: 3.2, type: 'stock' },
        ];
        
        // Duplicate for seamless scrolling
        const allMarkets = [...markets, ...markets];
        
        tickerContainer.innerHTML = allMarkets.map(market => `
            <div class="ticker-item">
                <span class="ticker-label">${market.symbol}</span>
                <span class="ticker-value">$${market.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span class="ticker-change ${market.change >= 0 ? 'positive' : 'negative'}">
                    ${market.change >= 0 ? '▲' : '▼'} ${Math.abs(market.change)}%
                </span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading market ticker:', error);
    }
}

// ===================================
// MARKET OVERVIEW TABLE
// ===================================

const filterBtns = document.querySelectorAll('.filter-btn');
let currentCategory = 'all';

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        loadMarketTable();
    });
});

async function loadMarketTable() {
    const tbody = document.getElementById('marketTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Loading market data...</td></tr>';
    
    try {
        // Sample market data
        const markets = [
            { name: 'Bitcoin', symbol: 'BTC', category: 'crypto', price: 103890, change: 2890, changePercent: 2.79, volume: '78.07B' },
            { name: 'Ethereum', symbol: 'ETH', category: 'crypto', price: 3431, change: 161, changePercent: 4.93, volume: '44.99B' },
            { name: 'S&P 500', symbol: 'SPX', category: 'indices', price: 4550.50, change: 16.70, changePercent: 0.37, volume: '2.1B' },
            { name: 'NASDAQ', symbol: 'IXIC', category: 'indices', price: 14200.10, change: 210.30, changePercent: 1.50, volume: '4.5B' },
            { name: 'DAX', symbol: 'DAX', category: 'indices', price: 16450.20, change: 106.40, changePercent: 0.65, volume: '3.2B' },
            { name: 'Gold', symbol: 'XAU', category: 'commodities', price: 2045.30, change: -10.60, changePercent: -0.52, volume: '180M' },
            { name: 'Oil (Brent)', symbol: 'BRN', category: 'commodities', price: 82.50, change: -1.15, changePercent: -1.38, volume: '350M' },
            { name: 'EUR/USD', symbol: 'EURUSD', category: 'forex', price: 1.0845, change: 0.0009, changePercent: 0.08, volume: '1.2T' },
            { name: 'GBP/USD', symbol: 'GBPUSD', category: 'forex', price: 1.2650, change: 0.0025, changePercent: 0.20, volume: '800B' },
        ];
        
        const filteredMarkets = currentCategory === 'all' 
            ? markets 
            : markets.filter(m => m.category === currentCategory);
        
        if (filteredMarkets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No markets found for this category</td></tr>';
            return;
        }
        
        tbody.innerHTML = filteredMarkets.map(market => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${market.name}</div>
                    <div style="font-size: 0.875rem; color: var(--text-tertiary);">${market.symbol}</div>
                </td>
                <td style="font-weight: 600;">$${market.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td style="color: ${market.change >= 0 ? 'var(--success)' : 'var(--danger)'}">
                    ${market.change >= 0 ? '+' : ''}${market.change.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td style="color: ${market.changePercent >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                    ${market.changePercent >= 0 ? '+' : ''}${market.changePercent.toFixed(2)}%
                </td>
                <td style="color: var(--text-secondary);">${market.volume}</td>
                <td>
                    <svg width="80" height="30" viewBox="0 0 80 30">
                        <polyline 
                            fill="none" 
                            stroke="${market.changePercent >= 0 ? 'var(--success)' : 'var(--danger)'}" 
                            stroke-width="2" 
                            points="${generateSparkline()}"
                        />
                    </svg>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading market table:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Error loading data. Please try again.</td></tr>';
    }
}

function generateSparkline() {
    // Generate random sparkline data
    const points = [];
    for (let i = 0; i < 7; i++) {
        const x = (i / 6) * 80;
        const y = 5 + Math.random() * 20;
        points.push(`${x},${y}`);
    }
    return points.join(' ');
}

// ===================================
// MARKET SENTIMENT
// ===================================

const regionBtns = document.querySelectorAll('.region-btn');

regionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        regionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Load region-specific data
    });
});

// ===================================
// NEWSLETTER FORM
// ===================================

const newsletterForm = document.getElementById('newsletterForm');

newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = e.target.querySelector('input[type="email"]').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Subscribing...';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        alert(`✅ Thank you for subscribing!\n\nWe've sent a confirmation email to: ${email}\n\nYour market report download will start shortly.`);
        
        // Reset form
        e.target.reset();
        submitBtn.textContent = '✓ Subscribed!';
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 3000);
    } catch (error) {
        alert('❌ Subscription failed. Please try again.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// ===================================
// INITIALIZE
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    loadMarketTicker();
    loadMarketTable();
    
    // Add smooth scroll behavior
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
});

// ===================================
// REFRESH DATA PERIODICALLY
// ===================================

setInterval(() => {
    loadMarketTicker();
    loadMarketTable();
}, 60000); // Refresh every minute

