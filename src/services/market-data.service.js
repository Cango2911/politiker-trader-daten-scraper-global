/**
 * Market Data Service
 * Holt echte Börsendaten und berechnet technische Indikatoren
 * API: Alpha Vantage (kostenlos)
 */

const axios = require('axios');
const logger = require('../utils/logger');

class MarketDataService {
  constructor() {
    // Alpha Vantage API Key (Demo - später in .env)
    this.apiKey = process.env.ALPHA_VANTAGE_KEY || 'demo';
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 Minuten Cache
  }

  /**
   * Hole Echtzeit-Kursdaten für ein Ticker-Symbol
   */
  async getQuote(ticker) {
    try {
      const cacheKey = `quote_${ticker}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: ticker,
          apikey: this.apiKey
        },
        timeout: 5000
      });

      const quote = response.data['Global Quote'];
      if (!quote) {
        logger.warn(`Keine Quote-Daten für ${ticker}`);
        return null;
      }

      const result = {
        ticker,
        price: parseFloat(quote['05. price']) || 0,
        change: parseFloat(quote['09. change']) || 0,
        changePercent: quote['10. change percent']?.replace('%', '') || '0',
        volume: parseInt(quote['06. volume']) || 0,
        high: parseFloat(quote['03. high']) || 0,
        low: parseFloat(quote['04. low']) || 0,
        open: parseFloat(quote['02. open']) || 0,
        previousClose: parseFloat(quote['08. previous close']) || 0,
        timestamp: new Date().toISOString()
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Quote für ${ticker}:`, error.message);
      return null;
    }
  }

  /**
   * Hole RSI (Relative Strength Index) - 14 Tage
   */
  async getRSI(ticker, period = 14) {
    try {
      const cacheKey = `rsi_${ticker}_${period}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'RSI',
          symbol: ticker,
          interval: 'daily',
          time_period: period,
          series_type: 'close',
          apikey: this.apiKey
        },
        timeout: 5000
      });

      const rsiData = response.data['Technical Analysis: RSI'];
      if (!rsiData) {
        logger.warn(`Keine RSI-Daten für ${ticker}`);
        return null;
      }

      // Hole neuesten RSI-Wert
      const dates = Object.keys(rsiData).sort().reverse();
      const latestRSI = parseFloat(rsiData[dates[0]]['RSI']) || 50;

      const result = {
        ticker,
        rsi: latestRSI,
        signal: latestRSI > 70 ? 'Overbought' : latestRSI < 30 ? 'Oversold' : 'Neutral',
        timestamp: new Date().toISOString()
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error(`Fehler beim Abrufen von RSI für ${ticker}:`, error.message);
      return null;
    }
  }

  /**
   * Hole MACD (Moving Average Convergence Divergence)
   */
  async getMACD(ticker) {
    try {
      const cacheKey = `macd_${ticker}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'MACD',
          symbol: ticker,
          interval: 'daily',
          series_type: 'close',
          apikey: this.apiKey
        },
        timeout: 5000
      });

      const macdData = response.data['Technical Analysis: MACD'];
      if (!macdData) {
        logger.warn(`Keine MACD-Daten für ${ticker}`);
        return null;
      }

      const dates = Object.keys(macdData).sort().reverse();
      const latest = macdData[dates[0]];

      const macd = parseFloat(latest['MACD']) || 0;
      const signal = parseFloat(latest['MACD_Signal']) || 0;
      const histogram = parseFloat(latest['MACD_Hist']) || 0;

      const result = {
        ticker,
        macd,
        signal,
        histogram,
        trend: histogram > 0 ? 'Bullish' : 'Bearish',
        timestamp: new Date().toISOString()
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error(`Fehler beim Abrufen von MACD für ${ticker}:`, error.message);
      return null;
    }
  }

  /**
   * Berechne aggregierte Metriken für mehrere Tickers
   */
  async getAggregatedMetrics(tickers) {
    try {
      const metrics = await Promise.all(
        tickers.slice(0, 5).map(async ticker => {
          const [quote, rsi] = await Promise.all([
            this.getQuote(ticker),
            this.getRSI(ticker)
          ]);
          return { ticker, quote, rsi };
        })
      );

      // Berechne Durchschnittswerte
      const validMetrics = metrics.filter(m => m.quote && m.rsi);
      if (validMetrics.length === 0) return null;

      const avgRSI = validMetrics.reduce((sum, m) => sum + m.rsi.rsi, 0) / validMetrics.length;
      const totalVolume = validMetrics.reduce((sum, m) => sum + m.quote.volume, 0);
      const avgChange = validMetrics.reduce((sum, m) => sum + parseFloat(m.quote.changePercent), 0) / validMetrics.length;

      return {
        averageRSI: avgRSI,
        totalVolume: totalVolume,
        averageChange: avgChange,
        marketSentiment: avgRSI > 70 ? 'Overbought' : avgRSI < 30 ? 'Oversold' : 'Neutral',
        tickers: validMetrics
      };
    } catch (error) {
      logger.error('Fehler bei aggregierten Metriken:', error.message);
      return null;
    }
  }

  /**
   * Cache-Management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

module.exports = new MarketDataService();

