/**
 * Follow the Money - Frontend JavaScript
 * Verbindet sich mit der Capitol Trades API
 */

// Konfiguration
const API_BASE_URL = window.location.origin;
let currentPage = 1;
let currentFilters = {};
let currentView = 'grid';

/**
 * Initialisierung
 */
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  initializeEventListeners();
  checkAPIHealth();
  loadCountries();
  loadTrades();
  loadGlobalStats();
});

/**
 * Theme Management
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-toggle .icon');
  if (icon) {
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
  }
}

/**
 * Event Listeners
 */
function initializeEventListeners() {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Filter Apply
  const applyFiltersBtn = document.getElementById('applyFilters');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyFilters);
  }

  // View Toggle
  const viewToggleBtns = document.querySelectorAll('.toggle-btn');
  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadTrades();
    });
  });

  // Modal Close
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
}

/**
 * API Health Check
 */
async function checkAPIHealth() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (data.success && data.status === 'healthy') {
      statusDot.classList.remove('offline');
      statusText.textContent = 'API Online';
    } else {
      statusDot.classList.add('offline');
      statusText.textContent = 'API Eingeschränkt';
    }
  } catch (error) {
    statusDot.classList.add('offline');
    statusText.textContent = 'API Offline';
  }
}

/**
 * Globale Statistiken laden
 */
async function loadGlobalStats() {
  try {
    // Hole Trades-Count direkt von der Trades-API
    const tradesResponse = await fetch(`${API_BASE_URL}/api/trades?limit=1`);
    const tradesData = await tradesResponse.json();
    
    // Hole Länder-Statistiken
    const countriesResponse = await fetch(`${API_BASE_URL}/api/countries`);
    const countriesData = await countriesResponse.json();
    
    if (tradesData.success && countriesData.success) {
      const totalTrades = tradesData.pagination?.total || 0;
      const totalCountries = countriesData.total || 18;
      
      // Berechne eindeutige Politiker aus den Trades
      const politiciansSet = new Set();
      if (totalTrades > 0) {
        const allTradesResponse = await fetch(`${API_BASE_URL}/api/trades?limit=1000`);
        const allTradesData = await allTradesResponse.json();
        allTradesData.data?.forEach(trade => {
          if (trade.politician?.name) {
            politiciansSet.add(`${trade.country}:${trade.politician.name}`);
          }
        });
      }
      
      document.getElementById('countryCount').textContent = totalCountries;
      document.getElementById('politicianCount').textContent = formatNumber(politiciansSet.size);
      document.getElementById('tradeCount').textContent = formatNumber(totalTrades);
      document.getElementById('totalTrades').textContent = formatNumber(totalTrades);
    }
  } catch (error) {
    console.error('Fehler beim Laden der Statistiken:', error);
    // Fallback-Werte
    document.getElementById('countryCount').textContent = '18';
    document.getElementById('politicianCount').textContent = '0';
    document.getElementById('tradeCount').textContent = '0';
    document.getElementById('totalTrades').textContent = '0';
  }
}

/**
 * Länder laden
 */
async function loadCountries() {
  const grid = document.getElementById('countriesGrid');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/countries`);
    const data = await response.json();
    
    if (data.success && data.data) {
      renderCountries(data.data);
      populateCountryFilter(data.data);
    } else {
      grid.innerHTML = '<div class="error-message">Keine Länder gefunden</div>';
    }
  } catch (error) {
    console.error('Fehler beim Laden der Länder:', error);
    grid.innerHTML = '<div class="error-message">Fehler beim Laden der Länder</div>';
  }
}

async function renderCountries(countries) {
  const grid = document.getElementById('countriesGrid');
  
  // Hole Trade-Counts für jedes Land
  const countriesWithStats = await Promise.all(countries.map(async (country) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trades?country=${country.code}&limit=1`);
      const data = await response.json();
      const tradeCount = data.pagination?.total || 0;
      
      // Zähle eindeutige Politiker
      let politicianCount = 0;
      if (tradeCount > 0) {
        const allTradesResponse = await fetch(`${API_BASE_URL}/api/trades?country=${country.code}&limit=100`);
        const allTradesData = await allTradesResponse.json();
        const politicians = new Set();
        allTradesData.data?.forEach(trade => {
          if (trade.politician?.name) {
            politicians.add(trade.politician.name);
          }
        });
        politicianCount = politicians.size;
      }
      
      return {
        ...country,
        tradeCount,
        politicianCount,
        scraperImplemented: tradeCount > 0
      };
    } catch (error) {
      return { ...country, tradeCount: 0, politicianCount: 0, scraperImplemented: false };
    }
  }));
  
  const html = countriesWithStats.map(country => `
    <div class="country-card" onclick="filterByCountry('${country.code}')">
      <div class="country-header">
        <span class="country-flag">${country.flag || '🌍'}</span>
        <span class="country-status ${country.scraperImplemented ? 'active' : ''}">${country.scraperImplemented ? 'Aktiv' : 'Geplant'}</span>
      </div>
      <h3 class="country-name">${country.name}</h3>
      <div class="country-stats">
        <div class="country-stat">
          <span>👥</span>
          <strong>${country.politicianCount || 0}</strong>
          Politiker
        </div>
        <div class="country-stat">
          <span>💼</span>
          <strong>${country.tradeCount || 0}</strong>
          Trades
        </div>
      </div>
    </div>
  `).join('');
  
  grid.innerHTML = html;
}

function populateCountryFilter(countries) {
  const select = document.getElementById('countryFilter');
  if (!select) return;
  
  const options = countries.map(country => 
    `<option value="${country.code}">${country.flag || '🌍'} ${country.name}</option>`
  ).join('');
  
  select.innerHTML = '<option value="">Alle Länder</option>' + options;
}

/**
 * Trades laden
 */
async function loadTrades(page = 1) {
  const container = document.getElementById('tradesContainer');
  container.innerHTML = '<div class="loading">Lade Trades</div>';
  
  try {
    const queryParams = new URLSearchParams({
      page: page,
      limit: 20,
      ...currentFilters
    });
    
    const response = await fetch(`${API_BASE_URL}/api/trades?${queryParams}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      if (currentView === 'grid') {
        renderTradesGrid(data.data);
      } else {
        renderTradesTable(data.data);
      }
      renderPagination(data.pagination);
    } else {
      container.innerHTML = '<div class="error-message">Keine Trades gefunden</div>';
    }
  } catch (error) {
    console.error('Fehler beim Laden der Trades:', error);
    container.innerHTML = '<div class="error-message">Fehler beim Laden der Trades</div>';
  }
}

function renderTradesGrid(trades) {
  const container = document.getElementById('tradesContainer');
  
  if (!trades || trades.length === 0) {
    container.innerHTML = '<div class="error-message">Keine Trades gefunden</div>';
    return;
  }
  
  const html = `
    <div class="trades-grid">
      ${trades.map(trade => `
        <div class="trade-card" onclick='showTradeDetails(${JSON.stringify(trade).replace(/'/g, "&#39;")})'>
          <div class="trade-header">
            <div class="politician-info">
              <h3>${trade.politicianName || 'Unbekannt'}</h3>
              <div class="politician-country">
                <span>${getCountryFlag(trade.country)}</span>
                ${trade.country?.toUpperCase() || 'N/A'}
              </div>
            </div>
            <span class="trade-type ${(trade.transactionType || trade.type || '').toLowerCase()}">${trade.transactionType || trade.type || 'N/A'}</span>
          </div>
          
          <div class="stock-info">
            <div class="ticker">${trade.ticker || 'N/A'}</div>
            <div class="company-name">${trade.assetDescription || trade.companyName || 'Unbekannt'}</div>
          </div>
          
          <div class="trade-details">
            <div class="detail-item">
              <span class="detail-label">Betrag</span>
              <span class="detail-value amount">${formatAmount(trade.amount || trade.estimatedValue)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Größe</span>
              <span class="detail-value">${trade.tradeSize || 'N/A'}</span>
            </div>
          </div>
          
          <div class="trade-date">
            📅 ${formatDate(trade.transactionDate || trade.disclosureDate)}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  container.innerHTML = html;
}

function renderTradesTable(trades) {
  const container = document.getElementById('tradesContainer');
  
  if (!trades || trades.length === 0) {
    container.innerHTML = '<div class="error-message">Keine Trades gefunden</div>';
    return;
  }
  
  const html = `
    <div class="trades-table">
      <table>
        <thead>
          <tr>
            <th>Politiker</th>
            <th>Land</th>
            <th>Ticker</th>
            <th>Typ</th>
            <th>Betrag</th>
            <th>Datum</th>
          </tr>
        </thead>
        <tbody>
          ${trades.map(trade => `
            <tr onclick='showTradeDetails(${JSON.stringify(trade).replace(/'/g, "&#39;")})'>
              <td><strong>${trade.politicianName || 'Unbekannt'}</strong></td>
              <td>${getCountryFlag(trade.country)} ${trade.country?.toUpperCase() || 'N/A'}</td>
              <td><strong style="color: var(--accent-primary)">${trade.ticker || 'N/A'}</strong></td>
              <td><span class="badge badge-${(trade.transactionType || '').toLowerCase() === 'buy' ? 'success' : 'danger'}">${trade.transactionType || trade.type || 'N/A'}</span></td>
              <td><strong>${formatAmount(trade.amount || trade.estimatedValue)}</strong></td>
              <td>${formatDate(trade.transactionDate || trade.disclosureDate)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
}

/**
 * Pagination
 */
function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (!pagination || !container) return;
  
  const { currentPage, totalPages, hasNextPage, hasPreviousPage } = pagination;
  
  let html = '';
  
  // Previous Button
  html += `<button class="page-btn" ${!hasPreviousPage ? 'disabled' : ''} onclick="loadTrades(${currentPage - 1})">← Zurück</button>`;
  
  // Page Numbers
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadTrades(${i})">${i}</button>`;
  }
  
  // Next Button
  html += `<button class="page-btn" ${!hasNextPage ? 'disabled' : ''} onclick="loadTrades(${currentPage + 1})">Weiter →</button>`;
  
  container.innerHTML = html;
}

/**
 * Filter Functions
 */
function applyFilters() {
  const country = document.getElementById('countryFilter').value;
  const search = document.getElementById('searchInput').value;
  const tradeSize = document.getElementById('tradeSizeFilter').value;
  
  currentFilters = {};
  if (country) currentFilters.country = country;
  if (search) currentFilters.politician = search;
  if (tradeSize) currentFilters.tradeSize = tradeSize;
  
  currentPage = 1;
  loadTrades(1);
}

function filterByCountry(countryCode) {
  document.getElementById('countryFilter').value = countryCode;
  applyFilters();
  document.querySelector('.trades-section').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Trade Details Modal
 */
function showTradeDetails(trade) {
  const modal = document.getElementById('tradeModal');
  const modalBody = document.getElementById('modalBody');
  
  const html = `
    <h2 style="margin-bottom: 1.5rem; font-family: var(--font-display);">Trade Details</h2>
    
    <div style="display: grid; gap: 1.5rem;">
      <div class="detail-section">
        <h3 style="margin-bottom: 0.75rem; color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase;">Politiker</h3>
        <p style="font-size: 1.25rem; font-weight: 700;">${trade.politicianName || 'Unbekannt'}</p>
        <p style="color: var(--text-secondary);">${getCountryFlag(trade.country)} ${getCountryName(trade.country)}</p>
      </div>
      
      <div class="detail-section">
        <h3 style="margin-bottom: 0.75rem; color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase;">Aktie</h3>
        <p style="font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">${trade.ticker || 'N/A'}</p>
        <p style="color: var(--text-secondary);">${trade.assetDescription || trade.companyName || 'Unbekannt'}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <div class="detail-section">
          <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Typ</h3>
          <span class="trade-type ${(trade.transactionType || '').toLowerCase()}">${trade.transactionType || trade.type || 'N/A'}</span>
        </div>
        
        <div class="detail-section">
          <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Betrag</h3>
          <p style="font-size: 1.5rem; font-weight: 700; color: var(--accent-success);">${formatAmount(trade.amount || trade.estimatedValue)}</p>
        </div>
      </div>
      
      <div class="detail-section">
        <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Handelsgröße</h3>
        <p style="font-weight: 600;">${trade.tradeSize || 'Nicht angegeben'}</p>
      </div>
      
      <div class="detail-section">
        <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Datum</h3>
        <p style="font-weight: 600;">📅 ${formatDate(trade.transactionDate || trade.disclosureDate)}</p>
      </div>
      
      ${trade.reportedAt ? `
        <div class="detail-section">
          <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Gemeldet am</h3>
          <p style="font-weight: 600;">${formatDate(trade.reportedAt)}</p>
        </div>
      ` : ''}
      
      ${trade.sourceUrl ? `
        <div class="detail-section">
          <a href="${trade.sourceUrl}" target="_blank" class="btn-primary" style="display: inline-block; text-decoration: none; text-align: center;">
            🔗 Quelle anzeigen
          </a>
        </div>
      ` : ''}
    </div>
  `;
  
  modalBody.innerHTML = html;
  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('tradeModal');
  modal.classList.remove('active');
}

/**
 * Utility Functions
 */
function formatNumber(num) {
  if (!num) return '0';
  return new Intl.NumberFormat('de-DE').format(num);
}

function formatAmount(amount) {
  if (!amount) return 'N/A';
  
  if (typeof amount === 'string' && amount.includes('-')) {
    return amount; // Bereits formatierter Bereich wie "$1,001 - $15,000"
  }
  
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${num.toFixed(0)}`;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

function getCountryFlag(countryCode) {
  const flags = {
    'usa': '🇺🇸',
    'germany': '🇩🇪',
    'uk': '🇬🇧',
    'france': '🇫🇷',
    'italy': '🇮🇹',
    'spain': '🇪🇸',
    'russia': '🇷🇺',
    'china': '🇨🇳',
    'japan': '🇯🇵',
    'india': '🇮🇳',
    'south-korea': '🇰🇷',
    'indonesia': '🇮🇩',
    'nigeria': '🇳🇬',
    'south-africa': '🇿🇦',
    'egypt': '🇪🇬',
    'kenya': '🇰🇪',
    'ghana': '🇬🇭',
    'turkey': '🇹🇷'
  };
  
  return flags[countryCode?.toLowerCase()] || '🌍';
}

function getCountryName(countryCode) {
  const names = {
    'usa': 'Vereinigte Staaten',
    'germany': 'Deutschland',
    'uk': 'Vereinigtes Königreich',
    'france': 'Frankreich',
    'italy': 'Italien',
    'spain': 'Spanien',
    'russia': 'Russland',
    'china': 'China',
    'japan': 'Japan',
    'india': 'Indien',
    'south-korea': 'Südkorea',
    'indonesia': 'Indonesien',
    'nigeria': 'Nigeria',
    'south-africa': 'Südafrika',
    'egypt': 'Ägypten',
    'kenya': 'Kenia',
    'ghana': 'Ghana',
    'turkey': 'Türkei'
  };
  
  return names[countryCode?.toLowerCase()] || countryCode;
}

/**
 * Auto-Refresh (alle 5 Minuten)
 */
setInterval(() => {
  checkAPIHealth();
  loadGlobalStats();
}, 300000); // 5 Minuten

