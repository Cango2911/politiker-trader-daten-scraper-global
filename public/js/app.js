/**
 * Follow the Money - Frontend App
 * CoinMarketCap-Style Design
 */

const API_BASE_URL = window.location.origin;
let currentFilters = {};
let allCountries = [];

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  initializeTradingViewWidgets();
});

async function initializeApp() {
  await checkAPIStatus();
  await loadSummaryStats();
  await loadCountriesForFilter();
  await loadTrades();
  await loadMarketData();
}

// ========================================
// TRADINGVIEW WIDGETS
// ========================================

function initializeTradingViewWidgets() {
  // 1. Market Overview Widget
  new TradingView.MediumWidget({
    "symbols": [
      ["Apple", "AAPL|1D"],
      ["NVIDIA", "NVDA|1D"],
      ["Microsoft", "MSFT|1D"],
      ["Tesla", "TSLA|1D"],
      ["Amazon", "AMZN|1D"]
    ],
    "chartOnly": false,
    "width": "100%",
    "height": "200",
    "locale": "de_DE",
    "colorTheme": "dark",
    "gridLineColor": "#2A2E39",
    "trendLineColor": "#3861FB",
    "fontColor": "#B0B0B8",
    "underLineColor": "#3861FB40",
    "isTransparent": true,
    "autosize": false,
    "container_id": "marketOverview"
  });
  
  // 2. Top Symbols (Meistgehandelte Politiker-Aktien)
  loadTopPoliticianStocks().then(symbols => {
    new TradingView.MiniChart({
      "symbol": symbols[0] || "NASDAQ:AAPL",
      "width": "100%",
      "height": "200",
      "locale": "de_DE",
      "dateRange": "1M",
      "colorTheme": "dark",
      "trendLineColor": "#3861FB",
      "underLineColor": "#3861FB40",
      "isTransparent": true,
      "autosize": false,
      "largeChartUrl": "",
      "container_id": "topSymbols"
    });
  });
  
  // 3. Technical Analysis Widget
  new TradingView.TechnicalAnalysisWidget({
    "interval": "1D",
    "width": "100%",
    "height": 200,
    "isTransparent": true,
    "colorTheme": "dark",
    "symbol": "NASDAQ:NVDA",
    "showIntervalTabs": true,
    "locale": "de_DE",
    "container_id": "technicalAnalysis"
  });
  
  // 4. Stock Heatmap
  new TradingView.widget({
    "width": "100%",
    "height": 300,
    "colorTheme": "dark",
    "dateRange": "1D",
    "exchange": "US",
    "showChart": true,
    "locale": "de_DE",
    "largeChartUrl": "",
    "isTransparent": true,
    "showSymbolLogo": true,
    "showFloatingTooltip": true,
    "plotLineColorGrowing": "rgba(22, 199, 132, 1)",
    "plotLineColorFalling": "rgba(234, 57, 67, 1)",
    "gridLineColor": "rgba(42, 46, 57, 0)",
    "scaleFontColor": "rgba(176, 176, 184, 1)",
    "belowLineFillColorGrowing": "rgba(22, 199, 132, 0.12)",
    "belowLineFillColorFalling": "rgba(234, 57, 67, 0.12)",
    "symbolActiveColor": "rgba(56, 97, 251, 0.12)",
    "container_id": "stockHeatmap"
  });
  
  // 5. Economic Calendar
  new TradingView.EconomicCalendarWidget({
    "colorTheme": "dark",
    "isTransparent": true,
    "width": "100%",
    "height": 300,
    "locale": "de_DE",
    "importanceFilter": "0,1",
    "container_id": "economicCalendar"
  });
  
  // 6. Stock Screener (Politiker-Portfolio)
  loadTopPoliticianStocks().then(symbols => {
    new TradingView.ScreenerWidget({
      "width": "100%",
      "height": 400,
      "defaultColumn": "overview",
      "defaultScreen": "general",
      "market": "america",
      "showToolbar": true,
      "colorTheme": "dark",
      "locale": "de_DE",
      "isTransparent": true,
      "container_id": "stockScreener"
    });
  });
}

// Lade die meistgehandelten Aktien der Politiker
async function loadTopPoliticianStocks() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trades?limit=1000`);
    const data = await response.json();
    
    if (!data.success || !data.data) return ['NASDAQ:AAPL'];
    
    // Zähle Ticker-Häufigkeit
    const tickerCount = {};
    data.data.forEach(trade => {
      const ticker = trade.trade?.ticker;
      if (ticker && ticker !== 'N/A') {
        tickerCount[ticker] = (tickerCount[ticker] || 0) + 1;
      }
    });
    
    // Top 5 Ticker
    const topTickers = Object.entries(tickerCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ticker]) => `NASDAQ:${ticker}`);
    
    return topTickers.length > 0 ? topTickers : ['NASDAQ:AAPL'];
  } catch (error) {
    console.error('Error loading top stocks:', error);
    return ['NASDAQ:AAPL'];
  }
}

function setupEventListeners() {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Filters
  const applyBtn = document.getElementById('applyFilters');
  const resetBtn = document.getElementById('resetFilters');
  const viewAllBtn = document.getElementById('viewAllTrades');
  
  if (applyBtn) {
    applyBtn.addEventListener('click', applyFilters);
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }
  
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
      loadTrades(100); // Zeige mehr Trades
      viewAllBtn.style.display = 'none'; // Verstecke Button nach Klick
    });
  }
  
  // Enter key on search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyFilters();
      }
    });
  }
  
  // Chart Modal
  const chartModalClose = document.getElementById('chartModalClose');
  const chartModalBackdrop = document.getElementById('chartModalBackdrop');
  
  if (chartModalClose) {
    chartModalClose.addEventListener('click', closeChartModal);
  }
  
  if (chartModalBackdrop) {
    chartModalBackdrop.addEventListener('click', closeChartModal);
  }
  
  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('chartModal');
      if (modal && modal.classList.contains('active')) {
        closeChartModal();
      }
    }
  });
}

// ========================================
// API STATUS
// ========================================

async function checkAPIStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (data.status === 'healthy' || data.success) {
      if (statusDot) statusDot.style.background = '#16C784';
      if (statusText) statusText.textContent = 'API';
    }
  } catch (error) {
    console.error('API Status Check failed:', error);
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    if (statusDot) statusDot.style.background = '#EA3943';
    if (statusText) statusText.textContent = 'Offline';
  }
}

// ========================================
// INDICATORS (wie CMC)
// ========================================

async function loadSummaryStats() {
  try {
    // Lade Trending Market Data von Backend (mit echten TradingView/Alpha Vantage Daten)
    const marketRes = await fetch(`${API_BASE_URL}/api/market/trending`);
    const marketData = await marketRes.json();
    
    // Lade alle Trades für Berechnungen
    const allTradesRes = await fetch(`${API_BASE_URL}/api/trades?limit=1000`);
    const allTrades = await allTradesRes.json();
    const trades = allTrades.data || [];
    
    // 1. TOTAL VOLUME - ECHTE BÖRSENDATEN
    let totalVolume = 0;
    let volumeChange = 0;
    
    if (marketData.success && marketData.data?.aggregatedMetrics) {
      const metrics = marketData.data.aggregatedMetrics;
      totalVolume = metrics.totalVolume || 0;
      volumeChange = metrics.averageChange || 0;
      
      document.getElementById('totalVolume').textContent = formatVolume(totalVolume);
      
      const volumeChangeEl = document.getElementById('volumeChange');
      if (volumeChangeEl) {
        const changePercent = volumeChange >= 0 ? `+${volumeChange.toFixed(2)}%` : `${volumeChange.toFixed(2)}%`;
        volumeChangeEl.querySelector('.change-percent').textContent = changePercent;
        volumeChangeEl.querySelector('.change-percent').className = volumeChange >= 0 ? 'change-percent' : 'change-percent negative';
      }
    } else {
      // Fallback auf Trade-Summen
      totalVolume = trades.reduce((sum, t) => sum + (t.trade?.sizeMin || 0), 0);
      document.getElementById('totalVolume').textContent = formatAmount(totalVolume);
    }
    
    // 2. ACTIVITY SCORE (Anzahl Trades pro Tag)
    const daysActive = 7;
    const tradesPerDay = trades.length / daysActive;
    const activityScore = Math.min(100, Math.round(tradesPerDay * 5));
    document.getElementById('activityScore').textContent = activityScore;
    document.getElementById('activityFill').style.width = `${activityScore}%`;
    document.getElementById('activityLabel').textContent = 
      activityScore > 70 ? 'Hoch' : activityScore > 40 ? 'Mittel' : 'Niedrig';
    
    // 3. INSIDER CONFIDENCE (Buy/Sell Ratio)
    const buyTrades = trades.filter(t => t.trade?.type === 'purchase' || t.trade?.type === 'buy').length;
    const sellTrades = trades.filter(t => t.trade?.type === 'sale' || t.trade?.type === 'sell').length;
    const totalTyped = buyTrades + sellTrades;
    const sentimentScore = totalTyped > 0 ? Math.round((buyTrades / totalTyped) * 100) : 50;
    
    document.getElementById('sentimentScore').textContent = sentimentScore;
    document.getElementById('sentimentPointer').style.left = `${sentimentScore}%`;
    
    // 4. PARTY BALANCE (USA specific)
    const usaTrades = trades.filter(t => t.country === 'usa');
    const demTrades = usaTrades.filter(t => t.politician?.party?.toLowerCase()?.includes('democrat')).length;
    const repTrades = usaTrades.filter(t => t.politician?.party?.toLowerCase()?.includes('republican')).length;
    const totalParty = demTrades + repTrades;
    
    if (totalParty > 0) {
      const demPercent = Math.round((demTrades / totalParty) * 100);
      const repPercent = 100 - demPercent;
      
      document.getElementById('partyLeft').style.width = `${demPercent}%`;
      document.getElementById('partyRight').style.width = `${repPercent}%`;
      document.getElementById('partyRatio').textContent = `${demPercent} / ${repPercent}`;
    }
    
    // 5. MOMENTUM (letzte 7 Tage Trend)
    const momentumScore = activityScore; // Vereinfacht
    document.getElementById('momentumScore').textContent = 
      momentumScore > 70 ? 'Bullish' : momentumScore > 40 ? 'Neutral' : 'Bearish';
    document.getElementById('momentumFill').style.width = `${momentumScore}%`;
    document.getElementById('momentumLabel').textContent = `${activityScore > 50 ? '+' : ''}${activityScore - 50}%`;
    
    // 6. HOT TOPIC (Meistgehandelter Ticker)
    const tickerCount = {};
    trades.forEach(t => {
      const ticker = t.trade?.ticker;
      if (ticker && ticker !== 'N/A') {
        tickerCount[ticker] = (tickerCount[ticker] || 0) + 1;
      }
    });
    
    const hotTicker = Object.entries(tickerCount).sort((a, b) => b[1] - a[1])[0];
    if (hotTicker) {
      document.getElementById('hotTicker').textContent = hotTicker[0];
      document.getElementById('hotDesc').textContent = `${hotTicker[1]} Trades in den letzten 7 Tagen - Politiker kaufen stark`;
    }
    
  } catch (error) {
    console.error('Error loading indicators:', error);
  }
}

// ========================================
// COUNTRIES FOR FILTER
// ========================================

async function loadCountriesForFilter() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/countries`);
    const data = await response.json();
    
    if (data.success && data.data) {
      allCountries = data.data;
      populateCountryFilter(allCountries);
    }
  } catch (error) {
    console.error('Error loading countries:', error);
  }
}

function populateCountryFilter(countries) {
  const select = document.getElementById('countryFilter');
  if (!select) return;
  
  const options = countries.map(c => 
    `<option value="${c.code}">${c.flag || '🌍'} ${c.name}</option>`
  ).join('');
  
  select.innerHTML = '<option value="">Alle Länder</option>' + options;
}

// ========================================
// LOAD TRADES
// ========================================

async function loadTrades(limit = 15) {
  const container = document.getElementById('tradesContainer');
  container.innerHTML = '<div class="loading-state">Lade Trades...</div>';
  
  try {
    const queryParams = new URLSearchParams({
      limit: limit,
      sort: '-dates.transaction', // Neueste zuerst
      ...currentFilters
    });
    
    const response = await fetch(`${API_BASE_URL}/api/trades?${queryParams}`);
    const data = await response.json();
    
    if (data.success && data.data && data.data.length > 0) {
      // Update total count in button
      const totalCount = data.pagination?.total || 0;
      const totalCountEl = document.getElementById('totalTradesCount');
      if (totalCountEl) {
        totalCountEl.textContent = totalCount;
      }
      
      // Filtere Trades: Zeige zuerst Trades mit echten Werten (USA)
      const tradesWithValues = data.data.filter(t => t.trade?.ticker && t.trade?.ticker !== 'N/A');
      const tradesWithoutValues = data.data.filter(t => !t.trade?.ticker || t.trade?.ticker === 'N/A');
      
      // USA zuerst, dann andere
      const sortedTrades = [...tradesWithValues, ...tradesWithoutValues];
      
      renderCMCTable(sortedTrades);
    } else {
      container.innerHTML = '<div class="error-state">Keine Trades gefunden</div>';
    }
  } catch (error) {
    console.error('Error loading trades:', error);
    container.innerHTML = '<div class="error-state">Fehler beim Laden der Trades</div>';
  }
}

// ========================================
// RENDER CMC-STYLE TABLE
// ========================================

function renderCMCTable(trades) {
  const container = document.getElementById('tradesContainer');
  
  const html = `
    <table class="trades-cmc-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Politiker</th>
          <th>Asset</th>
          <th>Typ</th>
          <th class="text-right">Betrag</th>
          <th class="text-right">Preis</th>
          <th class="text-right">Datum</th>
        </tr>
      </thead>
      <tbody>
        ${trades.map((trade, index) => {
          const name = trade.politician?.name || 'Unbekannt';
          const imageUrl = trade.politician?.imageUrl;
          const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          const country = trade.country || 'unknown';
          const party = trade.politician?.party || '';
          
          // Ticker anzeigen (falls vorhanden, sonst leer)
          const ticker = trade.trade?.ticker;
          const displayTicker = (ticker && ticker !== 'N/A') ? ticker : '';
          
          // Asset Name
          const assetName = trade.trade?.assetName || 'Unbekannt';
          
          // Price formatieren
          const price = trade.trade?.price;
          const displayPrice = price ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
          
          // Size/Amount
          const size = trade.trade?.size || '';
          const sizeMin = trade.trade?.sizeMin;
          const displayAmount = sizeMin ? formatAmount(sizeMin) : (size || '-');
          
          return `
            <tr class="trade-row-cmc" data-trade-id="${trade._id}">
              <td class="rank-cell">${index + 1}</td>
              <td class="politician-cell">
                <div class="politician-row">
                  <div class="avatar-small">
                    ${imageUrl ? 
                      `<img src="${imageUrl}" alt="${name}" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${initials}</div>'">` :
                      `<div class="avatar-fallback">${initials}</div>`
                    }
                  </div>
                  <div class="politician-details">
                    <div class="politician-name-row">
                      <span class="politician-name-text">${name}</span>
                      <span class="country-flag-small">${getCountryFlag(country)}</span>
                    </div>
                    <div class="politician-subtitle">${country.toUpperCase()}${party ? ' • ' + party : ''}</div>
                  </div>
                </div>
              </td>
              <td class="asset-cell">
                <div class="asset-row">
                  ${displayTicker ? `<div class="ticker-badge">${displayTicker}</div>` : ''}
                  <div class="asset-name-text">${assetName}</div>
                </div>
              </td>
              <td class="type-cell">
                <span class="type-badge ${(trade.trade?.type || '').toLowerCase()}">${formatTradeType(trade.trade?.type)}</span>
              </td>
              <td class="amount-cell-cmc text-right">
                <div class="amount-main">${displayAmount}</div>
                ${size && size !== displayAmount ? `<div class="amount-sub">${size}</div>` : ''}
              </td>
              <td class="price-cell-cmc text-right">
                <span class="price-value">${displayPrice}</span>
              </td>
              <td class="date-cell-cmc text-right">${formatDate(trade.dates?.transaction)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
  
  // Add click listeners
  setTimeout(() => {
    document.querySelectorAll('.trade-row-cmc').forEach(row => {
      row.addEventListener('click', () => {
        const tradeId = row.dataset.tradeId;
        console.log('Trade clicked:', tradeId);
        // Future: Open detail modal
      });
    });
  }, 100);
}

// ========================================
// FILTERS
// ========================================

function applyFilters() {
  const countryFilter = document.getElementById('countryFilter')?.value;
  const typeFilter = document.getElementById('typeFilter')?.value;
  const searchInput = document.getElementById('searchInput')?.value;
  
  currentFilters = {};
  
  if (countryFilter) currentFilters.country = countryFilter;
  if (typeFilter) currentFilters.type = typeFilter;
  if (searchInput) currentFilters.search = searchInput;
  
  loadTrades();
}

function resetFilters() {
  document.getElementById('countryFilter').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('searchInput').value = '';
  
  currentFilters = {};
  loadTrades();
}

// ========================================
// THEME TOGGLE
// ========================================

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
  }
  
  localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = '☀️';
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatNumber(num) {
  if (!num) return '0';
  return new Intl.NumberFormat('de-DE').format(num);
}

function formatAmount(amount) {
  if (!amount || amount === 0) return 'N/A';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatVolume(volume) {
  if (!volume || volume === 0) return '$0';
  
  if (volume >= 1000000000) {
    return `$${(volume / 1000000000).toFixed(2)}B`;
  } else if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(2)}M`;
  } else if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(2)}K`;
  }
  
  return `$${volume.toFixed(0)}`;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays}d`;
    
    return date.toLocaleDateString('de-DE', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

function formatTradeType(type) {
  if (!type) return 'N/A';
  
  const types = {
    'purchase': 'BUY',
    'sale': 'SELL',
    'exchange': 'EXCHANGE',
    'other': 'OTHER',
    'disclosure': 'DISCLOSURE'
  };
  
  return types[type.toLowerCase()] || type.toUpperCase();
}

function getCountryFlag(countryCode) {
  if (!countryCode) return '🌍';
  
  const flags = {
    'usa': '🇺🇸',
    'uk': '🇬🇧',
    'germany': '🇩🇪',
    'france': '🇫🇷',
    'italy': '🇮🇹',
    'spain': '🇪🇸',
    'russia': '🇷🇺',
    'china': '🇨🇳',
    'japan': '🇯🇵',
    'india': '🇮🇳',
    'southkorea': '🇰🇷',
    'indonesia': '🇮🇩',
    'nigeria': '🇳🇬',
    'southafrica': '🇿🇦',
    'egypt': '🇪🇬',
    'kenya': '🇰🇪',
    'ghana': '🇬🇭',
    'turkey': '🇹🇷'
  };
  
  return flags[countryCode.toLowerCase()] || '🌍';
}

// ========================================
// MARKETS DATA (Indizes, Krypto, Rohstoffe)
// ========================================

async function loadMarketData() {
  // Tab-Switching
  const marketTabs = document.querySelectorAll('.market-tab');
  marketTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update active tab
      marketTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      document.querySelectorAll('.market-tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${tabName}`).classList.add('active');
    });
  });
  
  // Load initial data
  loadIndices();
  loadCrypto();
  loadCommodities();
}

// Börsen-Indizes der 18 Länder
async function loadIndices() {
  const indices = [
    { name: 'S&P 500', symbol: 'SPX', country: 'USA', icon: '🇺🇸', price: 4550.50, change: 1.25 },
    { name: 'Dow Jones', symbol: 'DJI', country: 'USA', icon: '🇺🇸', price: 35420.30, change: 0.85 },
    { name: 'NASDAQ', symbol: 'IXIC', country: 'USA', icon: '🇺🇸', price: 14200.10, change: 1.50 },
    { name: 'DAX', symbol: 'DAX', country: 'Germany', icon: '🇩🇪', price: 16450.20, change: 0.65 },
    { name: 'FTSE 100', symbol: 'FTSE', country: 'UK', icon: '🇬🇧', price: 7650.40, change: -0.30 },
    { name: 'CAC 40', symbol: 'FCHI', country: 'France', icon: '🇫🇷', price: 7350.60, change: 0.45 },
    { name: 'Nikkei 225', symbol: 'N225', country: 'Japan', icon: '🇯🇵', price: 33150.80, change: 1.10 },
    { name: 'Hang Seng', symbol: 'HSI', country: 'Hong Kong', icon: '🇭🇰', price: 18250.30, change: -1.20 },
    { name: 'SSE Composite', symbol: 'SSEC', country: 'China', icon: '🇨🇳', price: 3150.50, change: 0.80 },
    { name: 'MOEX Russia', symbol: 'IMOEX', country: 'Russia', icon: '🇷🇺', price: 3250.70, change: -0.50 },
    { name: 'KOSPI', symbol: 'KS11', country: 'South Korea', icon: '🇰🇷', price: 2550.30, change: 0.90 },
    { name: 'BSE Sensex', symbol: 'BSESN', country: 'India', icon: '🇮🇳', price: 65450.20, change: 1.35 },
  ];
  
  renderMarketCards('indicesGrid', indices, 'index');
}

// Top 30 Kryptowährungen (CoinGecko API)
async function loadCrypto() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=false&price_change_percentage=24h');
    const cryptoData = await response.json();
    
    const formattedCrypto = cryptoData.map(coin => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      icon: coin.image ? `<img src="${coin.image}" style="width:40px;height:40px;border-radius:50%;">` : '₿',
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      marketCap: coin.market_cap,
      volume: coin.total_volume,
    }));
    
    renderMarketCards('cryptoGrid', formattedCrypto, 'crypto');
  } catch (error) {
    console.error('Error loading crypto:', error);
    document.getElementById('cryptoGrid').innerHTML = '<div class="error-state">Fehler beim Laden der Krypto-Daten. CoinGecko API Rate Limit erreicht.</div>';
  }
}

// Rohstoffe
async function loadCommodities() {
  const commodities = [
    { name: 'Gold', symbol: 'XAU/USD', icon: '🥇', price: 2050.30, change: 0.45, unit: ' /oz' },
    { name: 'Silber', symbol: 'XAG/USD', icon: '🥈', price: 24.50, change: -0.25, unit: ' /oz' },
    { name: 'Rohöl (WTI)', symbol: 'CL', icon: '🛢️', price: 78.50, change: 1.20, unit: ' /bbl' },
    { name: 'Brent Öl', symbol: 'BZ', icon: '🛢️', price: 82.30, change: 1.10, unit: ' /bbl' },
    { name: 'Erdgas', symbol: 'NG', icon: '⛽', price: 3.25, change: -2.30, unit: ' /MMBtu' },
    { name: 'Kupfer', symbol: 'HG', icon: '🔶', price: 3.85, change: 0.60, unit: ' /lb' },
    { name: 'Platin', symbol: 'PL', icon: '⚪', price: 925.40, change: -0.15, unit: ' /oz' },
    { name: 'Palladium', symbol: 'PA', icon: '⚪', price: 1250.60, change: 0.80, unit: ' /oz' },
    { name: 'Weizen', symbol: 'ZW', icon: '🌾', price: 550.20, change: 1.50, unit: ' /bu' },
    { name: 'Mais', symbol: 'ZC', icon: '🌽', price: 450.30, change: -0.40, unit: ' /bu' },
  ];
  
  renderMarketCards('commoditiesGrid', commodities, 'commodity');
}

function renderMarketCards(containerId, items, type) {
  const container = document.getElementById(containerId);
  
  const html = items.map((item, index) => {
    const icon = typeof item.icon === 'string' && item.icon.startsWith('<') ? item.icon : `<span class="market-icon">${item.icon || '📊'}</span>`;
    const price = item.price ? `$${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...';
    const change = item.change24h !== undefined ? item.change24h : item.change;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const changeSymbol = change >= 0 ? '↗' : '↘';
    const changePct = Math.abs(change).toFixed(2);
    
    // TradingView Symbol basierend auf Typ
    let tvSymbol = '';
    if (type === 'crypto') {
      tvSymbol = `BINANCE:${item.symbol}USDT`;
    } else if (type === 'index') {
      const indexMapping = {
        'SPX': 'TVC:SPX',
        'DJI': 'TVC:DJI',
        'IXIC': 'NASDAQ:IXIC',
        'DAX': 'XETR:DAX',
        'FTSE': 'TVC:UKX',
        'FCHI': 'TVC:CAC',
        'N225': 'TVC:NI225',
        'HSI': 'TVC:HSI',
        'SSEC': 'SSE:000001',
        'IMOEX': 'MOEX:IMOEX',
        'KS11': 'TVC:KOSPI',
        'BSESN': 'BSE:SENSEX',
      };
      tvSymbol = indexMapping[item.symbol] || `TVC:${item.symbol}`;
    } else if (type === 'commodity') {
      const commodityMapping = {
        'XAU/USD': 'TVC:GOLD',
        'XAG/USD': 'TVC:SILVER',
        'CL': 'NYMEX:CL1!',
        'BZ': 'NYMEX:BZ1!',
        'NG': 'NYMEX:NG1!',
        'HG': 'COMEX:HG1!',
        'PL': 'NYMEX:PL1!',
        'PA': 'NYMEX:PA1!',
        'ZW': 'CBOT:ZW1!',
        'ZC': 'CBOT:ZC1!',
      };
      tvSymbol = commodityMapping[item.symbol] || `OANDA:${item.symbol}`;
    }
    
    return `
      <div class="market-card" data-symbol="${tvSymbol}" data-name="${item.name}" data-type="${type}">
        <div class="market-card-header">
          ${icon}
          <div class="market-info">
            <div class="market-name">${item.name}</div>
            <div class="market-symbol">${item.symbol}${item.unit || ''}</div>
          </div>
        </div>
        <div class="market-price">${price}${item.unit || ''}</div>
        <div class="market-change ${changeClass}">
          ${changeSymbol} ${changePct}% (24h)
        </div>
        ${item.marketCap || item.volume ? `
          <div class="market-stats">
            ${item.marketCap ? `
              <div class="market-stat">
                <div class="market-stat-label">Market Cap</div>
                <div class="market-stat-value">$${(item.marketCap / 1e9).toFixed(2)}B</div>
              </div>
            ` : ''}
            ${item.volume ? `
              <div class="market-stat">
                <div class="market-stat-label">24h Volume</div>
                <div class="market-stat-value">$${(item.volume / 1e9).toFixed(2)}B</div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
  
  // Add click listeners to open chart modal
  setTimeout(() => {
    container.querySelectorAll('.market-card').forEach(card => {
      card.addEventListener('click', () => {
        const symbol = card.dataset.symbol;
        const name = card.dataset.name;
        openChartModal(symbol, name);
      });
    });
  }, 100);
}

// ========================================
// CHART MODAL
// ========================================

function openChartModal(symbol, name) {
  const modal = document.getElementById('chartModal');
  const symbolEl = document.getElementById('chartModalSymbol');
  const nameEl = document.getElementById('chartModalName');
  
  symbolEl.textContent = symbol;
  nameEl.textContent = name;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Load TradingView Chart
  loadTradingViewChart(symbol);
}

function closeChartModal() {
  const modal = document.getElementById('chartModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  
  // Clear chart
  document.getElementById('tradingview_chart').innerHTML = '';
}

function loadTradingViewChart(symbol) {
  const chartContainer = document.getElementById('tradingview_chart');
  chartContainer.innerHTML = ''; // Clear previous chart
  
  new TradingView.widget({
    "autosize": true,
    "symbol": symbol,
    "interval": "D",
    "timezone": "Europe/Berlin",
    "theme": document.body.classList.contains('light-theme') ? "light" : "dark",
    "style": "1",
    "locale": "de_DE",
    "toolbar_bg": "#f1f3f6",
    "enable_publishing": false,
    "allow_symbol_change": true,
    "container_id": "tradingview_chart",
    "studies": [
      "RSI@tv-basicstudies",
      "MACD@tv-basicstudies",
      "BB@tv-basicstudies"
    ],
    "show_popup_button": true,
    "popup_width": "1000",
    "popup_height": "650",
    "support_host": "https://www.tradingview.com"
  });
}
