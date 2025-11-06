/**
 * 🔥 HYBRID MARKET AGGREGATOR
 * "Scrape Everything, Give It Back Free"
 * 
 * Aggregiert Daten von ALLEN großen Finanzplattformen:
 * - Alpha Vantage (Börsen, Forex, Commodities)
 * - CoinGecko (Top 500 Kryptos)
 * - TradingView (Charts werden im Frontend eingebunden)
 * - Eigene Politiker-Trades Datenbank
 * 
 * Metapher: Wir nutzen die Monopole gegen sich selbst!
 */

const axios = require('axios');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || 'demo';
const CACHE_TTL = 300; // 5 Minuten

class HybridMarketAggregator {
  constructor() {
    this.cache = new NodeCache({ stdTTL: CACHE_TTL });
    this.rateLimitDelay = 12000; // 12 Sekunden zwischen Alpha Vantage Calls (5/min limit)
    
    logger.info('🚀 Hybrid Market Aggregator initialized');
    logger.info(`📡 Alpha Vantage: ${ALPHA_VANTAGE_KEY === 'demo' ? 'DEMO mode (5 calls/min)' : 'PREMIUM mode'}`);
  }

  /**
   * 🌍 MASTER FUNCTION: Hole ALLE Marktdaten aus ALLEN Quellen
   */
  async getAllMarketData() {
    const cacheKey = 'hybrid_all_markets';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      logger.info('📦 Loading all market data from cache');
      return cached;
    }

    logger.info('🔄 Fetching market data from ALL sources...');
    
    try {
      // Parallele Abfragen (wo möglich)
      const [crypto, forex, indices, commodities, sentiment] = await Promise.all([
        this.getCryptoData(),
        this.getForexData(),
        this.getIndicesData(),
        this.getCommoditiesData(),
        this.getMarketSentiment()
      ]);

      const aggregated = {
        success: true,
        timestamp: new Date().toISOString(),
        sources: {
          crypto: 'CoinGecko',
          forex: 'Alpha Vantage',
          indices: 'Alpha Vantage (ETF proxies)',
          commodities: 'Alpha Vantage',
          sentiment: 'Aggregated from multiple sources'
        },
        data: {
          crypto,
          forex,
          indices,
          commodities,
          sentiment
        },
        metadata: {
          total_assets: crypto.length + forex.length + indices.length + commodities.length,
          cache_ttl: CACHE_TTL,
          rate_limits: {
            alpha_vantage: '5 calls/minute (DEMO) or 500/day (FREE)',
            coingecko: '50 calls/minute (FREE)'
          }
        }
      };

      this.cache.set(cacheKey, aggregated);
      logger.info(`✅ Aggregated ${aggregated.metadata.total_assets} assets from all sources`);
      
      return aggregated;

    } catch (error) {
      logger.error('❌ Error in getAllMarketData:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: 'Using cached or simulated data'
      };
    }
  }

  /**
   * 🪙 CRYPTO: CoinGecko (Top 100 Kryptos)
   */
  async getCryptoData() {
    const cacheKey = 'crypto_coingecko';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      logger.info('🪙 Fetching crypto data from CoinGecko...');
      
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: true,
          price_change_percentage: '24h,7d'
        },
        timeout: 10000
      });

      const formatted = response.data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h,
        change7d: coin.price_change_percentage_7d_in_currency,
        volume: coin.total_volume,
        marketCap: coin.market_cap,
        rank: coin.market_cap_rank,
        image: coin.image,
        sparkline: coin.sparkline_in_7d?.price || [],
        category: 'crypto',
        source: 'coingecko'
      }));

      this.cache.set(cacheKey, formatted);
      logger.info(`✅ Fetched ${formatted.length} cryptocurrencies from CoinGecko`);
      
      return formatted;

    } catch (error) {
      logger.error('❌ CoinGecko API error:', error.message);
      return [];
    }
  }

  /**
   * 💱 FOREX: Alpha Vantage (Währungspaare)
   */
  async getForexData() {
    const cacheKey = 'forex_alphavantage';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      logger.info('💱 Fetching forex data from Alpha Vantage...');
      
      const pairs = [
        { from: 'EUR', to: 'USD', name: 'EUR/USD' },
        { from: 'GBP', to: 'USD', name: 'GBP/USD' },
        { from: 'USD', to: 'JPY', name: 'USD/JPY' },
        { from: 'USD', to: 'CHF', name: 'USD/CHF' }
      ];

      const results = [];

      for (const pair of pairs) {
        try {
          const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.from}&to_currency=${pair.to}&apikey=${ALPHA_VANTAGE_KEY}`;
          const response = await axios.get(url, { timeout: 5000 });

          if (response.data['Realtime Currency Exchange Rate']) {
            const rate = response.data['Realtime Currency Exchange Rate'];
            const currentRate = parseFloat(rate['5. Exchange Rate']);
            const bidPrice = parseFloat(rate['8. Bid Price']);
            const change = currentRate - bidPrice;
            
            results.push({
              symbol: `${pair.from}${pair.to}`,
              name: pair.name,
              price: currentRate,
              change: change,
              changePercent: ((change / bidPrice) * 100).toFixed(2),
              category: 'forex',
              source: 'alphavantage',
              lastUpdate: rate['6. Last Refreshed']
            });
          }

          // Rate limit protection
          await this.sleep(this.rateLimitDelay);

        } catch (error) {
          logger.warn(`Failed to fetch ${pair.name}: ${error.message}`);
        }
      }

      this.cache.set(cacheKey, results);
      logger.info(`✅ Fetched ${results.length} forex pairs from Alpha Vantage`);
      
      return results;

    } catch (error) {
      logger.error('❌ Forex data error:', error.message);
      return this.getFallbackForex();
    }
  }

  /**
   * 📊 INDICES: Alpha Vantage via ETF Proxies
   */
  async getIndicesData() {
    const cacheKey = 'indices_alphavantage';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      logger.info('📊 Fetching indices data from Alpha Vantage (via ETFs)...');
      
      const indices = [
        { symbol: 'SPY', name: 'S&P 500', displaySymbol: 'SPX' },
        { symbol: 'DIA', name: 'Dow Jones', displaySymbol: 'DJI' },
        { symbol: 'QQQ', name: 'NASDAQ 100', displaySymbol: 'NDX' }
      ];

      const results = [];

      for (const index of indices) {
        try {
          const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${index.symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
          const response = await axios.get(url, { timeout: 5000 });

          if (response.data['Global Quote']) {
            const quote = response.data['Global Quote'];
            results.push({
              symbol: index.displaySymbol,
              name: index.name,
              price: parseFloat(quote['05. price']),
              change: parseFloat(quote['09. change']),
              changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
              volume: parseInt(quote['06. volume']),
              category: 'indices',
              source: 'alphavantage',
              proxyETF: index.symbol
            });
          }

          await this.sleep(this.rateLimitDelay);

        } catch (error) {
          logger.warn(`Failed to fetch ${index.name}: ${error.message}`);
        }
      }

      this.cache.set(cacheKey, results);
      logger.info(`✅ Fetched ${results.length} indices from Alpha Vantage`);
      
      return results;

    } catch (error) {
      logger.error('❌ Indices data error:', error.message);
      return this.getFallbackIndices();
    }
  }

  /**
   * 🛢️ COMMODITIES: Alpha Vantage (Öl, Gold, etc.)
   */
  async getCommoditiesData() {
    const cacheKey = 'commodities_alphavantage';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      logger.info('🛢️ Fetching commodities data from Alpha Vantage...');
      
      const results = [];

      // WTI Crude Oil
      try {
        const oilUrl = `https://www.alphavantage.co/query?function=WTI&interval=daily&apikey=${ALPHA_VANTAGE_KEY}`;
        const oilResponse = await axios.get(oilUrl, { timeout: 5000 });

        if (oilResponse.data['data'] && oilResponse.data['data'].length > 0) {
          const latest = oilResponse.data['data'][0];
          const previous = oilResponse.data['data'][1];
          const change = parseFloat(latest.value) - parseFloat(previous.value);
          
          results.push({
            symbol: 'WTI',
            name: 'WTI Crude Oil',
            price: parseFloat(latest.value),
            change: change,
            changePercent: ((change / parseFloat(previous.value)) * 100).toFixed(2),
            category: 'commodities',
            source: 'alphavantage',
            unit: 'USD/barrel'
          });
        }

        await this.sleep(this.rateLimitDelay);
      } catch (error) {
        logger.warn(`Failed to fetch WTI Oil: ${error.message}`);
      }

      // Brent Crude Oil
      try {
        const brentUrl = `https://www.alphavantage.co/query?function=BRENT&interval=daily&apikey=${ALPHA_VANTAGE_KEY}`;
        const brentResponse = await axios.get(brentUrl, { timeout: 5000 });

        if (brentResponse.data['data'] && brentResponse.data['data'].length > 0) {
          const latest = brentResponse.data['data'][0];
          const previous = brentResponse.data['data'][1];
          const change = parseFloat(latest.value) - parseFloat(previous.value);
          
          results.push({
            symbol: 'BRENT',
            name: 'Brent Crude Oil',
            price: parseFloat(latest.value),
            change: change,
            changePercent: ((change / parseFloat(previous.value)) * 100).toFixed(2),
            category: 'commodities',
            source: 'alphavantage',
            unit: 'USD/barrel'
          });
        }

        await this.sleep(this.rateLimitDelay);
      } catch (error) {
        logger.warn(`Failed to fetch Brent Oil: ${error.message}`);
      }

      this.cache.set(cacheKey, results);
      logger.info(`✅ Fetched ${results.length} commodities from Alpha Vantage`);
      
      return results;

    } catch (error) {
      logger.error('❌ Commodities data error:', error.message);
      return this.getFallbackCommodities();
    }
  }

  /**
   * 🎭 MARKET SENTIMENT: Aggregiert aus mehreren Quellen
   */
  async getMarketSentiment() {
    try {
      // Fear & Greed basierend auf Marktindikatoren
      const crypto = await this.getCryptoData();
      
      // Berechne durchschnittliche 24h-Änderung
      const avgChange = crypto.reduce((sum, coin) => sum + (coin.change24h || 0), 0) / crypto.length;
      
      // Fear & Greed Index (0-100)
      // < 20: Extreme Fear, 20-40: Fear, 40-60: Neutral, 60-80: Greed, > 80: Extreme Greed
      let fearGreedIndex = 50; // Neutral baseline
      
      if (avgChange > 5) fearGreedIndex = 75; // Greed
      else if (avgChange > 2) fearGreedIndex = 65;
      else if (avgChange > 0) fearGreedIndex = 55;
      else if (avgChange > -2) fearGreedIndex = 45;
      else if (avgChange > -5) fearGreedIndex = 35; // Fear
      else fearGreedIndex = 25; // Extreme Fear

      return {
        fearGreedIndex: Math.round(fearGreedIndex),
        sentiment: this.getSentimentLabel(fearGreedIndex),
        avgMarketChange24h: avgChange.toFixed(2),
        topGainers: crypto.filter(c => c.change24h > 10).length,
        topLosers: crypto.filter(c => c.change24h < -10).length,
        source: 'calculated'
      };

    } catch (error) {
      logger.error('❌ Sentiment calculation error:', error.message);
      return {
        fearGreedIndex: 50,
        sentiment: 'Neutral',
        avgMarketChange24h: '0.00',
        source: 'fallback'
      };
    }
  }

  /**
   * 🏷️ Hilfsfunktionen
   */
  getSentimentLabel(index) {
    if (index < 20) return 'Extreme Fear';
    if (index < 40) return 'Fear';
    if (index < 60) return 'Neutral';
    if (index < 80) return 'Greed';
    return 'Extreme Greed';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🔄 FALLBACK DATA (wenn APIs nicht erreichbar)
   */
  getFallbackForex() {
    return [
      { symbol: 'EURUSD', name: 'EUR/USD', price: 1.0856, changePercent: 0.08, category: 'forex', source: 'fallback' },
      { symbol: 'GBPUSD', name: 'GBP/USD', price: 1.2698, changePercent: 0.20, category: 'forex', source: 'fallback' }
    ];
  }

  getFallbackIndices() {
    return [
      { symbol: 'SPX', name: 'S&P 500', price: 4550.50, changePercent: 1.25, category: 'indices', source: 'fallback' },
      { symbol: 'DJI', name: 'Dow Jones', price: 35420.30, changePercent: 0.85, category: 'indices', source: 'fallback' },
      { symbol: 'NDX', name: 'NASDAQ 100', price: 14200.10, changePercent: 1.50, category: 'indices', source: 'fallback' }
    ];
  }

  getFallbackCommodities() {
    return [
      { symbol: 'BRENT', name: 'Brent Crude Oil', price: 85.32, changePercent: -1.38, category: 'commodities', source: 'fallback', unit: 'USD/barrel' },
      { symbol: 'GOLD', name: 'Gold', price: 2050.40, changePercent: 0.45, category: 'commodities', source: 'fallback', unit: 'USD/oz' }
    ];
  }
}

module.exports = new HybridMarketAggregator();

