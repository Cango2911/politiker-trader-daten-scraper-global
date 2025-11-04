/**
 * Config Routes
 */
const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/config.controller');
const { asyncHandler } = require('../middleware/error.middleware');
const { configLimiter } = require('../middleware/rateLimit.middleware');

// GET /api/config - Aktuelle Konfiguration
router.get('/', asyncHandler(ConfigController.getConfig));

// PUT /api/config - Konfiguration aktualisieren
router.put('/', configLimiter, asyncHandler(ConfigController.updateConfig));

// POST /api/config/clear-cache - Cache leeren
router.post('/clear-cache', asyncHandler(ConfigController.clearCache));

// GET /api/stats - Globale Statistiken
router.get('/stats', asyncHandler(ConfigController.getStats));

module.exports = router;

