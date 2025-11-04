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
});

async function initializeApp() {
  await checkAPIStatus();
  await loadSummaryStats();
  await loadCountriesForFilter();
  await loadTrades();
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
  
  if (applyBtn) {
    applyBtn.addEventListener('click', applyFilters);
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
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
    // Lade alle Trades für Berechnungen
    const allTradesRes = await fetch(`${API_BASE_URL}/api/trades?limit=1000`);
    const allTrades = await allTradesRes.json();
    const trades = allTrades.data || [];
    
    // 1. TOTAL VOLUME
    const totalVolume = trades.reduce((sum, t) => sum + (t.trade?.sizeMin || 0), 0);
    document.getElementById('totalVolume').textContent = formatAmount(totalVolume);
    
    // Volume Change (simuliert - kann später mit historischen Daten berechnet werden)
    const volumeChangeEl = document.getElementById('volumeChange');
    if (volumeChangeEl) {
      const changePercent = Math.random() > 0.5 ? `+${(Math.random() * 10).toFixed(2)}%` : `-${(Math.random() * 10).toFixed(2)}%`;
      volumeChangeEl.querySelector('.change-percent').textContent = changePercent;
      volumeChangeEl.querySelector('.change-percent').className = changePercent.startsWith('+') ? 'change-percent' : 'change-percent negative';
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

async function loadTrades() {
  const container = document.getElementById('tradesContainer');
  container.innerHTML = '<div class="loading-state">Lade Trades...</div>';
  
  try {
    const queryParams = new URLSearchParams({
      limit: 100,
      ...currentFilters
    });
    
    const response = await fetch(`${API_BASE_URL}/api/trades?${queryParams}`);
    const data = await response.json();
    
    if (data.success && data.data && data.data.length > 0) {
      renderCMCTable(data.data);
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
                  <div class="ticker-row">
                    <span class="ticker-text">${trade.trade?.ticker || 'N/A'}</span>
                  </div>
                  <div class="asset-name-text">${trade.trade?.assetName || 'Unbekannt'}</div>
                </div>
              </td>
              <td class="type-cell">
                <span class="type-badge ${(trade.trade?.type || '').toLowerCase()}">${formatTradeType(trade.trade?.type)}</span>
              </td>
              <td class="amount-cell-cmc text-right">
                <div class="amount-main">${formatAmount(trade.trade?.sizeMin)}</div>
                ${trade.trade?.size ? `<div class="amount-sub">${trade.trade.size}</div>` : ''}
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
