/**
 * Market Data Routes
 * Liefert Börsendaten und technische Indikatoren
 */

const express = require('express');
const router = express.Router();
const marketDataService = require('../services/market-data.service');
const logger = require('../utils/logger');

/**
 * GET /api/market/quote/:ticker
 * Hole Echtzeit-Quote für einen Ticker
 */
router.get('/quote/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const quote = await marketDataService.getQuote(ticker);
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote nicht gefunden'
      });
    }
    
    res.json({
      success: true,
      data: quote
    });
  } catch (error) {
    logger.error('Fehler bei Market Quote:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
});

/**
 * GET /api/market/indicators/:ticker
 * Hole technische Indikatoren (RSI, MACD) für einen Ticker
 */
router.get('/indicators/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    const [quote, rsi, macd] = await Promise.all([
      marketDataService.getQuote(ticker),
      marketDataService.getRSI(ticker),
      marketDataService.getMACD(ticker)
    ]);
    
    res.json({
      success: true,
      data: {
        ticker,
        quote,
        rsi,
        macd
      }
    });
  } catch (error) {
    logger.error('Fehler bei Market Indicators:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
});

/**
 * GET /api/market/trending
 * Hole aggregierte Metriken für die meistgehandelten Aktien
 */
router.get('/trending', async (req, res) => {
  try {
    // Hole die Top-Tickers aus unseren Trade-Daten
    const Trade = require('../models/trade.model');
    
    const topTickers = await Trade.aggregate([
      { $match: { 'trade.ticker': { $ne: null, $ne: 'N/A' } } },
      { $group: { _id: '$trade.ticker', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const tickers = topTickers.map(t => t._id);
    const metrics = await marketDataService.getAggregatedMetrics(tickers);
    
    res.json({
      success: true,
      data: {
        topTickers: topTickers.map(t => ({ ticker: t._id, tradeCount: t.count })),
        aggregatedMetrics: metrics
      }
    });
  } catch (error) {
    logger.error('Fehler bei Trending Markets:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
});

module.exports = router;

