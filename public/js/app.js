// ============================================
// Follow the Money - Main JavaScript
// ============================================

let currentPage = 1;
const PAGE_SIZE = 20;
let allTrades = [];
let filteredTrades = [];

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initSlider();
    initThemeToggle();
    loadMarketTicker();
    loadPoliticianTrades();
    initFilters();
    initDownload();
    initNewsletter();
    
    // Auto-refresh market data every 60 seconds
    setInterval(loadMarketTicker, 60000);
});

// ============================================
// SLIDER (Swiper)
// ============================================
function initSlider() {
    new Swiper('.breaking-news-slider', {
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
}

// ============================================
// MARKET TICKER BAR
// ============================================
async function loadMarketTicker() {
    const symbols = [
        { id: 'SPX', name: 'S&P 500', type: 'index' },
        { id: 'DJI', name: 'Dow Jones', type: 'index' },
        { id: 'DAX', name: 'DAX', type: 'index' },
        { id: 'BTC', name: 'Bitcoin', type: 'crypto' },
        { id: 'EUR/USD', name: 'EUR/USD', type: 'forex' },
        { id: 'OIL', name: 'Brent Crude', type: 'commodity' }
    ];

    // For demo: Fetch from CoinGecko for crypto, simulate for others
    for (const symbol of symbols) {
        const tickerEl = document.querySelector(`.ticker-item[data-symbol="${symbol.id}"]`);
        if (!tickerEl) continue;

        if (symbol.type === 'crypto') {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
                const data = await response.json();
                const price = data.bitcoin.usd;
                const change = data.bitcoin.usd_24h_change;

                tickerEl.querySelector('.ticker-value').textContent = `$${price.toLocaleString()}`;
                const changeEl = tickerEl.querySelector('.ticker-change');
                changeEl.textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                changeEl.className = `ticker-change ${change > 0 ? 'positive' : 'negative'}`;
            } catch (error) {
                console.error('Error fetching crypto data:', error);
            }
        } else {
            // Simulate other market data
            const price = getSimulatedPrice(symbol.id);
            const change = (Math.random() * 4 - 2).toFixed(2);

            tickerEl.querySelector('.ticker-value').textContent = symbol.type === 'forex' ? price.toFixed(4) : price.toLocaleString();
            const changeEl = tickerEl.querySelector('.ticker-change');
            changeEl.textContent = `${change > 0 ? '+' : ''}${change}%`;
            changeEl.className = `ticker-change ${change > 0 ? 'positive' : 'negative'}`;
        }
    }
}

function getSimulatedPrice(symbol) {
    const prices = {
        'SPX': 4550 + Math.random() * 100,
        'DJI': 35400 + Math.random() * 200,
        'DAX': 16450 + Math.random() * 100,
        'EUR/USD': 1.08 + Math.random() * 0.02,
        'OIL': 75 + Math.random() * 5
    };
    return prices[symbol] || 100;
}

// ============================================
// POLITICIAN TRADES
// ============================================
async function loadPoliticianTrades() {
    try {
        const response = await fetch('/api/trades?limit=100');
        const data = await response.json();
        
        if (data.success && data.data) {
            allTrades = data.data;
            filteredTrades = [...allTrades];
            renderTrades();
        }
    } catch (error) {
        console.error('Error loading trades:', error);
        document.getElementById('tradesTableBody').innerHTML = `
            <tr>
                <td colspan="8" class="loading-cell">Error loading trades. Please try again.</td>
            </tr>
        `;
    }
}

function renderTrades() {
    const tbody = document.getElementById('tradesTableBody');
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageTrades = filteredTrades.slice(start, end);

    if (pageTrades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-cell">No trades found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageTrades.map((trade, index) => {
        const rowNumber = start + index + 1;
        const countryFlag = getCountryFlag(trade.country);
        const tradeTypeClass = trade.trade?.type === 'purchase' ? 'buy' : 'sale';
        const amount = formatAmount(trade.trade?.size || '-');
        const price = trade.trade?.price ? `$${trade.trade.price.toFixed(2)}` : '-';
        const date = formatDate(trade.dates?.transaction);

        return `
            <tr onclick="showTradeDetails('${trade._id}')">
                <td>${rowNumber}</td>
                <td>
                    <strong>${trade.politician?.name || 'Unknown'}</strong><br>
                    <small style="color: #666;">${trade.politician?.party || ''}</small>
                </td>
                <td>${countryFlag} ${trade.country.toUpperCase()}</td>
                <td>
                    <strong>${trade.trade?.ticker || trade.trade?.assetName || 'N/A'}</strong><br>
                    <small style="color: #666;">${trade.trade?.assetName || ''}</small>
                </td>
                <td>
                    <span class="badge-${tradeTypeClass}">
                        ${(trade.trade?.type || 'other').toUpperCase()}
                    </span>
                </td>
                <td>${amount}</td>
                <td>${price}</td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');

    // Update pagination
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredTrades.length / PAGE_SIZE);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function getCountryFlag(country) {
    const flags = {
        'usa': '🇺🇸',
        'germany': '🇩🇪',
        'uk': '🇬🇧',
        'france': '🇫🇷',
        'russia': '🇷🇺',
        'china': '🇨🇳',
        'japan': '🇯🇵',
        'india': '🇮🇳'
    };
    return flags[country.toLowerCase()] || '🌍';
}

function formatAmount(amount) {
    if (!amount || amount === '-') return '-';
    if (typeof amount === 'string') {
        if (amount.includes('$')) return amount;
        return `$${amount}`;
    }
    return `$${amount.toLocaleString()}`;
}

function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    const today = new Date();
    const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return d.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
}

function showTradeDetails(tradeId) {
    // TODO: Implement modal/detail view
    console.log('Show trade details:', tradeId);
}

// ============================================
// FILTERS
// ============================================
function initFilters() {
    const countryFilter = document.getElementById('countryFilter');
    const tradeTypeFilter = document.getElementById('tradeTypeFilter');
    const searchInput = document.getElementById('searchInput');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    countryFilter.addEventListener('change', applyFilters);
    tradeTypeFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTrades();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredTrades.length / PAGE_SIZE);
        if (currentPage < totalPages) {
            currentPage++;
            renderTrades();
        }
    });

    // Region filter buttons
    document.querySelectorAll('.region-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // TODO: Filter by region
        });
    });
}

function applyFilters() {
    const country = document.getElementById('countryFilter').value.toLowerCase();
    const tradeType = document.getElementById('tradeTypeFilter').value.toLowerCase();
    const search = document.getElementById('searchInput').value.toLowerCase();

    filteredTrades = allTrades.filter(trade => {
        const matchesCountry = !country || trade.country.toLowerCase() === country;
        const matchesType = !tradeType || trade.trade?.type === tradeType;
        const matchesSearch = !search || 
            trade.politician?.name?.toLowerCase().includes(search) ||
            trade.trade?.ticker?.toLowerCase().includes(search) ||
            trade.trade?.assetName?.toLowerCase().includes(search);

        return matchesCountry && matchesType && matchesSearch;
    });

    currentPage = 1;
    renderTrades();
}

// ============================================
// DOWNLOAD FEATURE
// ============================================
function initDownload() {
    document.getElementById('downloadBtn').addEventListener('click', downloadReport);
}

function downloadReport() {
    // Convert trades to CSV
    const headers = ['#', 'Politician', 'Country', 'Asset', 'Type', 'Amount', 'Price', 'Date'];
    const rows = filteredTrades.map((trade, index) => [
        index + 1,
        trade.politician?.name || 'Unknown',
        trade.country.toUpperCase(),
        trade.trade?.ticker || trade.trade?.assetName || 'N/A',
        (trade.trade?.type || 'other').toUpperCase(),
        formatAmount(trade.trade?.size || '-'),
        trade.trade?.price ? `$${trade.trade.price.toFixed(2)}` : '-',
        formatDate(trade.dates?.transaction)
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `politician-trades-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('✅ Report downloaded successfully!');
}

// ============================================
// NEWSLETTER
// ============================================
function initNewsletter() {
    document.getElementById('newsletterForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        
        // TODO: Send to backend
        console.log('Newsletter signup:', email);
        alert('✅ Thank you for subscribing! You will receive daily updates.');
        e.target.reset();
    });
}

// ============================================
// THEME TOGGLE
// ============================================
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    .badge-buy {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        padding: 4px 12px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 12px;
    }
    .badge-sale {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        padding: 4px 12px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 12px;
    }
`;
document.head.appendChild(style);

