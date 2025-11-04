/**
 * Politicians Routes
 */
const express = require('express');
const router = express.Router();
const PoliticiansController = require('../controllers/politicians.controller');
const { asyncHandler } = require('../middleware/error.middleware');
const { cacheMiddleware } = require('../middleware/cache.middleware');

// GET /api/politicians - Alle Politiker
router.get('/', cacheMiddleware, asyncHandler(PoliticiansController.getAllPoliticians));

// GET /api/politicians/:id - Einzelner Politiker
router.get('/:id', cacheMiddleware, asyncHandler(PoliticiansController.getPoliticianById));

// GET /api/politicians/:id/trades - Trades eines Politikers
router.get('/:id/trades', cacheMiddleware, asyncHandler(PoliticiansController.getPoliticianTrades));

module.exports = router;

