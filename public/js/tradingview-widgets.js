/**
 * ⚪ Whiterock Industrie - TradingView Widgets Integration
 * Echte Charts & Indikatoren von TradingView
 */

// ===================================
// TradingView Chart Modal
// ===================================
let currentChart = null;

function openMarketDetail(symbol) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('tradingview-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'tradingview-modal';
        modal.className = 'tv-modal';
        modal.innerHTML = `
            <div class="tv-modal-backdrop"></div>
            <div class="tv-modal-content">
                <div class="tv-modal-header">
                    <h3 class="tv-modal-title">${symbol} Chart</h3>
                    <button class="tv-modal-close" onclick="closeTradingViewModal()">✕</button>
                </div>
                <div class="tv-modal-body">
                    <div id="tradingview_chart_modal" style="height: 600px;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add styles dynamically
        if (!document.getElementById('tv-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'tv-modal-styles';
            style.textContent = `
                .tv-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 9999;
                    display: none;
                }
                .tv-modal.active {
                    display: block;
                }
                .tv-modal-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                }
                .tv-modal-content {
                    position: relative;
                    max-width: 1200px;
                    margin: 50px auto;
                    background: var(--bg-primary);
                    border-radius: 1rem;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    overflow: hidden;
                }
                .tv-modal-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .tv-modal-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                }
                .tv-modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--text-secondary);
                    padding: 0.5rem;
                    transition: color 0.2s ease;
                }
                .tv-modal-close:hover {
                    color: var(--danger);
                }
                .tv-modal-body {
                    padding: 2rem;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Show modal
    modal.classList.add('active');
    
    // Map symbols to TradingView format
    const tvSymbol = mapToTradingViewSymbol(symbol);
    
    // Initialize TradingView Advanced Chart
    if (typeof TradingView !== 'undefined') {
        new TradingView.widget({
            "autosize": true,
            "symbol": tvSymbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": document.body.classList.contains('dark-theme') ? 'dark' : 'light',
            "style": "1",
            "locale": "de_DE",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "container_id": "tradingview_chart_modal",
            "studies": [
                "MASimple@tv-basicstudies",
                "RSI@tv-basicstudies",
                "MACD@tv-basicstudies",
                "BB@tv-basicstudies"
            ],
            "show_popup_button": true,
            "popup_width": "1000",
            "popup_height": "650"
        });
    } else {
        console.error('TradingView library not loaded!');
        alert('TradingView Charts werden geladen...');
    }
    
    // Close on backdrop click
    modal.querySelector('.tv-modal-backdrop').onclick = closeTradingViewModal;
}

function closeTradingViewModal() {
    const modal = document.getElementById('tradingview-modal');
    if (modal) {
        modal.classList.remove('active');
        // Clear chart
        const chartContainer = document.getElementById('tradingview_chart_modal');
        if (chartContainer) chartContainer.innerHTML = '';
    }
}

function mapToTradingViewSymbol(symbol) {
    // Map unsere Symbole zu TradingView-Format
    const symbolMap = {
        'BTC': 'BINANCE:BTCUSDT',
        'ETH': 'BINANCE:ETHUSDT',
        'SPX': 'TVC:SPX',
        'DJI': 'TVC:DJI',
        'NDX': 'NASDAQ:NDX',
        'DAX': 'XETR:DAX',
        'FTSE': 'TVC:UKX',
        'EURUSD': 'FX:EURUSD',
        'GBPUSD': 'FX:GBPUSD',
        'BRENT': 'TVC:UKOIL',
        'WTI': 'TVC:USOIL',
        'GOLD': 'TVC:GOLD'
    };
    
    return symbolMap[symbol] || `NASDAQ:${symbol}`;
}

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTradingViewModal();
    }
});

console.log('✅ TradingView Widgets loaded');

