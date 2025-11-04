/**
 * Trades Routes
 */
const express = require('express');
const router = express.Router();
const TradesController = require('../controllers/trades.controller');
const { asyncHandler } = require('../middleware/error.middleware');
const { cacheMiddleware } = require('../middleware/cache.middleware');

// GET /api/trades - Alle Trades
router.get('/', cacheMiddleware, asyncHandler(TradesController.getAllTrades));

// GET /api/trades/:id - Einzelner Trade
router.get('/:id', cacheMiddleware, asyncHandler(TradesController.getTradeById));

// GET /api/trades/size/:tradeSize - Trades nach Größe
router.get('/size/:tradeSize', cacheMiddleware, asyncHandler(TradesController.getTradesBySize));

// GET /api/trades/by-politician/:politicianId - Trades eines Politikers
router.get('/by-politician/:politicianId', cacheMiddleware, asyncHandler(TradesController.getTradesByPolitician));

// Alias für by-politician
router.get('/official/:officialId', cacheMiddleware, asyncHandler(TradesController.getTradesByPolitician));

// GET /api/trades/by-ticker/:ticker - Trades nach Ticker
router.get('/by-ticker/:ticker', cacheMiddleware, asyncHandler(TradesController.getTradesByTicker));

// Alias für by-ticker
router.get('/ticker/:ticker', cacheMiddleware, asyncHandler(TradesController.getTradesByTicker));

module.exports = router;

