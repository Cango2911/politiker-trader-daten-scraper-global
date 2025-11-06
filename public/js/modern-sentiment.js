/**
 * 🎭 ULTRA-MODERN SENTIMENT DASHBOARD
 * Alternative.me Fear & Greed API + Animationen
 */

class ModernSentimentDashboard {
    constructor() {
        this.currentIndex = 0;
        this.targetIndex = 0;
        this.animationFrame = null;
        this.init();
    }

    async init() {
        await this.loadRealFearGreed();
        await this.loadCryptoGlobalStats();
        this.startAnimations();
        
        // Setup tabs
        this.setupSentimentTabs();
        
        // Update every 60 seconds
        setInterval(() => this.loadRealFearGreed(), 60000);
        setInterval(() => this.loadCryptoGlobalStats(), 60000);
    }

    /**
     * 🎭 Lade ECHTEN Fear & Greed von Alternative.me
     */
    async loadRealFearGreed() {
        try {
            const response = await fetch('/api/world-indices/fear-greed');
            const result = await response.json();
            
            if (result.success) {
                const { index, sentiment, source, timestamp } = result.data;
                
                console.log(`🎭 ECHTER Fear & Greed geladen: ${index} (${sentiment})`);
                console.log(`📡 Quelle: ${source}`);
                
                // Animiere zur neuen Zahl
                this.animateToValue(index);
                
                // Update Text
                document.getElementById('fearGreedLabel').textContent = sentiment;
                document.getElementById('fearGreedTimestamp').textContent = 
                    `Updated: ${new Date(timestamp).toLocaleTimeString('de-DE')}`;
                
                // Zeige Data Source
                const sourceBadge = document.querySelector('.source-text');
                if (sourceBadge) {
                    sourceBadge.textContent = source.includes('alternative.me') ? 'Alternative.me' : 'Calculated';
                }
            }
        } catch (error) {
            console.error('Error loading Fear & Greed:', error);
        }
    }

    /**
     * ✨ Animiere Nadel und Wert smooth
     */
    animateToValue(targetValue) {
        this.targetIndex = targetValue;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        const animate = () => {
            const diff = this.targetIndex - this.currentIndex;
            
            if (Math.abs(diff) < 0.5) {
                this.currentIndex = this.targetIndex;
            } else {
                this.currentIndex += diff * 0.1; // Smooth easing
            }
            
            // Update Needle (0-100 → -90 bis +90 Grad)
            const rotation = (this.currentIndex / 100) * 180 - 90;
            const needle = document.getElementById('gaugeNeedle');
            if (needle) {
                needle.style.transform = `rotate(${rotation}deg)`;
            }
            
            // Update Arc (SVG stroke-dashoffset)
            const arc = document.getElementById('gaugeArc');
            if (arc) {
                const circumference = 251.2;
                const offset = circumference - (this.currentIndex / 100) * circumference;
                arc.style.strokeDashoffset = offset;
            }
            
            // Update Value Display
            const valueEl = document.getElementById('fearGreedValue');
            if (valueEl) {
                valueEl.textContent = Math.round(this.currentIndex);
            }
            
            // Weiter animieren wenn nicht am Ziel
            if (Math.abs(diff) >= 0.5) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    /**
     * 📊 Lade globale Crypto Stats von CoinGecko
     */
    async loadCryptoGlobalStats() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/global');
            const data = await response.json();
            
            if (data && data.data) {
                const global = data.data;
                
                // Total Market Cap
                const totalCap = global.total_market_cap.usd;
                document.getElementById('cryptoTotalCap').textContent = this.formatLarge(totalCap);
                const capChange = global.market_cap_change_percentage_24h_usd;
                const capChangeEl = document.getElementById('cryptoCapChange');
                capChangeEl.textContent = `${capChange >= 0 ? '+' : ''}${capChange.toFixed(2)}%`;
                capChangeEl.className = `stat-change ${capChange >= 0 ? 'positive' : 'negative'}`;
                
                // 24h Volume
                const volume = global.total_volume.usd;
                document.getElementById('crypto24hVolume').textContent = this.formatLarge(volume);
                
                // BTC Dominance
                const btcDom = global.market_cap_percentage.btc;
                document.getElementById('btcDominance').textContent = btcDom.toFixed(2) + '%';
                document.getElementById('btcDominanceBar').style.width = btcDom + '%';
                
                // Active Cryptos
                document.getElementById('activeCryptos').textContent = global.active_cryptocurrencies.toLocaleString();
                
                console.log('📊 Crypto Global Stats aktualisiert');
            }
        } catch (error) {
            console.error('Error loading crypto stats:', error);
        }
    }

    /**
     * 🔀 Setup Sentiment Type Tabs
     */
    setupSentimentTabs() {
        const tabs = document.querySelectorAll('.sentiment-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const type = tab.dataset.type;
                console.log(`Switched to ${type} sentiment`);
                
                // TODO: Load different sentiment data based on type
            });
        });
    }

    /**
     * ✨ Start alle Animationen
     */
    startAnimations() {
        // Pulsing glow effect auf der Gauge
        const arc = document.getElementById('gaugeArc');
        if (arc) {
            setInterval(() => {
                arc.style.filter = 'url(#glow) drop-shadow(0 0 10px rgba(59,130,246,0.8))';
                setTimeout(() => {
                    arc.style.filter = 'url(#glow)';
                }, 1000);
            }, 3000);
        }

        // Animate data source dot
        const dot = document.querySelector('.source-dot');
        if (dot) {
            setInterval(() => {
                dot.style.animation = 'pulse 2s infinite';
            }, 100);
        }
    }

    /**
     * 📐 Helper Functions
     */
    formatLarge(num) {
        if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
        return '$' + num.toLocaleString();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ModernSentimentDashboard();
    });
} else {
    new ModernSentimentDashboard();
}

console.log('✅ Modern Sentiment Dashboard loaded');

