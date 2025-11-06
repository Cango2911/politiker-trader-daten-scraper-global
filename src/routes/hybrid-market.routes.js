/**
 * 🔥 HYBRID MARKET API ROUTES
 * Endpunkte für aggregierte Marktdaten aus ALLEN Quellen
 */

const express = require('express');
const router = express.Router();
const hybridAggregator = require('../services/hybrid-market-aggregator.service');
const logger = require('../utils/logger');

/**
 * @route GET /api/hybrid-market/all
 * @desc Get ALL market data from ALL sources (Crypto, Forex, Indices, Commodities)
 * @access Public
 */
router.get('/all', async (req, res) => {
  try {
    logger.info('📡 Incoming request for ALL market data');
    const data = await hybridAggregator.getAllMarketData();
    res.status(200).json(data);
  } catch (error) {
    logger.error('❌ Error in /hybrid-market/all:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch market data',
      error: error.message 
    });
  }
});

/**
 * @route GET /api/hybrid-market/crypto
 * @desc Get cryptocurrency data (CoinGecko)
 * @access Public
 */
router.get('/crypto', async (req, res) => {
  try {
    const crypto = await hybridAggregator.getCryptoData();
    res.status(200).json({ success: true, data: crypto, source: 'coingecko' });
  } catch (error) {
    logger.error('❌ Error in /hybrid-market/crypto:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/hybrid-market/forex
 * @desc Get forex data (Alpha Vantage)
 * @access Public
 */
router.get('/forex', async (req, res) => {
  try {
    const forex = await hybridAggregator.getForexData();
    res.status(200).json({ success: true, data: forex, source: 'alphavantage' });
  } catch (error) {
    logger.error('❌ Error in /hybrid-market/forex:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/hybrid-market/indices
 * @desc Get stock indices data (Alpha Vantage via ETFs)
 * @access Public
 */
router.get('/indices', async (req, res) => {
  try {
    const indices = await hybridAggregator.getIndicesData();
    res.status(200).json({ success: true, data: indices, source: 'alphavantage' });
  } catch (error) {
    logger.error('❌ Error in /hybrid-market/indices:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/hybrid-market/commodities
 * @desc Get commodities data (Alpha Vantage)
 * @access Public
 */
router.get('/commodities', async (req, res) => {
  try {
    const commodities = await hybridAggregator.getCommoditiesData();
    res.status(200).json({ success: true, data: commodities, source: 'alphavantage' });
  } catch (error) {
    logger.error('❌ Error in /hybrid-market/commodities:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/hybrid-market/sentiment
 * @desc Get market sentiment (Fear & Greed Index)
 * @access Public
 */
router.get('/sentiment', async (req, res) => {
  try {
    const sentiment = await hybridAggregator.getMarketSentiment();
    res.status(200).json({ success: true, data: sentiment });
  } catch (error) {
    logger.error('❌ Error in /hybrid-market/sentiment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

