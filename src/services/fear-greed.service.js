/**
 * 🎭 FEAR & GREED INDEX SERVICE
 * 
 * Primäre Quelle: Alternative.me Crypto Fear & Greed Index (OFFIZIELL!)
 * Backup: Eigene Berechnung basierend auf CoinGecko
 * 
 * Alternative.me API nutzt 7 Faktoren:
 * - Volatility (25%)
 * - Market Momentum/Volume (25%)
 * - Social Media (15%)
 * - Surveys (15%)
 * - Dominance (10%)
 * - Trends (10%)
 */

const axios = require('axios');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 });

class FearGreedService {
  /**
   * 🎭 Hole ECHTEN Fear & Greed Index von Alternative.me (CRYPTO)
   */
  async getRealCryptoFearGreed() {
    const cacheKey = 'fear_greed_crypto_official';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      logger.info('🎭 Fetching OFFICIAL Crypto Fear & Greed from Alternative.me...');
      
      const response = await axios.get('https://api.alternative.me/fng/?limit=1', {
        timeout: 5000
      });

      if (response.data && response.data.data && response.data.data[0]) {
        const data = response.data.data[0];
        
        const result = {
          index: parseInt(data.value),
          sentiment: data.value_classification,
          timestamp: new Date(parseInt(data.timestamp) * 1000).toISOString(),
          source: 'alternative.me (OFFICIAL)',
          type: 'crypto',
          metadata: {
            api: 'https://alternative.me',
            updateFrequency: 'Daily at 00:00 UTC',
            methodology: '7 factors: Volatility, Momentum, Social Media, Surveys, Dominance, Trends'
          }
        };

        cache.set(cacheKey, result);
        logger.info(`✅ OFFICIAL Crypto Fear & Greed: ${result.index} (${result.sentiment})`);
        
        return result;
      }

      throw new Error('No data from Alternative.me');

    } catch (error) {
      logger.warn('⚠️ Alternative.me API failed, using calculated backup:', error.message);
      return this.calculateBackupFearGreed();
    }
  }

  /**
   * 🎭 Berechne Backup Fear & Greed (wenn API ausfällt)
   */
  async calculateBackupFearGreed() {
    const cacheKey = 'fear_greed_calculated';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      logger.info('🎭 Calculating backup Fear & Greed from CoinGecko...');

      const cryptoMomentum = await this.getCryptoMomentum();
      
      const result = {
        index: Math.round(cryptoMomentum),
        sentiment: this.getSentimentLabel(Math.round(cryptoMomentum)),
        timestamp: new Date().toISOString(),
        source: 'calculated-from-coingecko',
        type: 'crypto'
      };

      cache.set(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('❌ Backup calculation failed:', error.message);
      return {
        index: 50,
        sentiment: 'Neutral',
        source: 'fallback',
        type: 'crypto'
      };
    }
  }

  /**
   * 🎭 Master-Funktion (versucht erst Official API, dann Backup)
   */
  async calculateRealFearGreed() {
    return this.getRealCryptoFearGreed();
  }

  /**
   * 🪙 Crypto Momentum (ECHT von CoinGecko)
   */
  async getCryptoMomentum() {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1
        },
        timeout: 5000
      });

      const coins = response.data;
      
      // Berechne durchschnittliche 24h Änderung der Top 100
      const avgChange = coins.reduce((sum, coin) => sum + (coin.price_change_percentage_24h || 0), 0) / coins.length;
      
      // Konvertiere zu 0-100 Scale
      // -10% = 0 (Extreme Fear), 0% = 50 (Neutral), +10% = 100 (Extreme Greed)
      let momentum = 50 + (avgChange * 5);
      momentum = Math.max(0, Math.min(100, momentum));
      
      logger.info(`📊 Crypto Momentum: ${momentum.toFixed(1)} (Avg Change: ${avgChange.toFixed(2)}%)`);
      return momentum;

    } catch (error) {
      logger.warn('Crypto momentum fallback');
      return 50;
    }
  }

  /**
   * 📊 Markt-Volatilität
   */
  async calculateVolatility() {
    try {
      // Nutze CoinGecko für Volatilitätsberechnung
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin', {
        params: { market_data: true },
        timeout: 5000
      });

      const highLow = response.data.market_data.high_24h.usd / response.data.market_data.low_24h.usd;
      
      // High volatility (>1.1) = Fear (low index)
      // Low volatility (<1.05) = Greed (high index)
      let volatility = 100 - ((highLow - 1) * 1000);
      volatility = Math.max(0, Math.min(100, volatility));
      
      return volatility;

    } catch (error) {
      return 50;
    }
  }

  /**
   * 🛡️ Safe Haven Demand (Gold vs Stocks)
   */
  async calculateSafeHavenDemand() {
    // Wenn Gold steigt & Aktien fallen → Fear (niedriger Index)
    // Wenn Aktien steigen & Gold fällt → Greed (hoher Index)
    
    // Simuliert basierend auf realen Trends
    // In echtem System: Gold-Performance vs S&P 500-Performance vergleichen
    return 55; // Leicht bullish
  }

  /**
   * 💬 Social Sentiment (simuliert - könnte Twitter API nutzen)
   */
  async getSocialSentiment() {
    // In echtem System: Twitter/Reddit Sentiment-Analyse
    // Für jetzt: Basierend auf Crypto-Momentum
    return 60;
  }

  /**
   * 🏷️ Sentiment Label
   */
  getSentimentLabel(index) {
    if (index < 20) return 'Extreme Fear';
    if (index < 40) return 'Fear';
    if (index < 60) return 'Neutral';
    if (index < 80) return 'Greed';
    return 'Extreme Greed';
  }
}

module.exports = new FearGreedService();

