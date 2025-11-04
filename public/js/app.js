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
// SUMMARY STATS
// ========================================

async function loadSummaryStats() {
  try {
    const [tradesRes, countriesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/trades?limit=1`),
      fetch(`${API_BASE_URL}/api/countries`)
    ]);
    
    const tradesData = await tradesRes.json();
    const countriesData = await countriesRes.json();
    
    const totalTrades = tradesData.pagination?.total || 0;
    const totalCountries = countriesData.total || 18;
    
    // Count unique politicians
    const allTradesRes = await fetch(`${API_BASE_URL}/api/trades?limit=1000`);
    const allTrades = await allTradesRes.json();
    const politicians = new Set();
    allTrades.data?.forEach(trade => {
      if (trade.politician?.name) {
        politicians.add(`${trade.country}:${trade.politician.name}`);
      }
    });
    
    document.getElementById('summaryTrades').textContent = formatNumber(totalTrades);
    document.getElementById('summaryPoliticians').textContent = formatNumber(politicians.size);
    document.getElementById('summaryCountries').textContent = totalCountries;
    document.getElementById('summaryNew').textContent = '+0'; // Placeholder
    
  } catch (error) {
    console.error('Error loading summary stats:', error);
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
