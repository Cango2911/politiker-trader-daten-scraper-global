/**
 * Countries Routes
 */
const express = require('express');
const router = express.Router();
const CountriesController = require('../controllers/countries.controller');
const { asyncHandler } = require('../middleware/error.middleware');
const { cacheMiddleware } = require('../middleware/cache.middleware');
const { scrapeLimiter } = require('../middleware/rateLimit.middleware');

// GET /api/countries - Alle Länder
router.get('/', cacheMiddleware, asyncHandler(CountriesController.getAllCountries));

// GET /api/countries/:countryCode - Details zu einem Land
router.get('/:countryCode', cacheMiddleware, asyncHandler(CountriesController.getCountryDetails));

// GET /api/countries/:countryCode/trades - Trades eines Landes
router.get('/:countryCode/trades', cacheMiddleware, asyncHandler(CountriesController.getCountryTrades));

// GET /api/countries/:countryCode/politicians - Politiker eines Landes
router.get('/:countryCode/politicians', cacheMiddleware, asyncHandler(CountriesController.getCountryPoliticians));

// POST /api/countries/:countryCode/scrape - Daten für ein Land scrapen
router.post('/:countryCode/scrape', scrapeLimiter, asyncHandler(CountriesController.scrapeCountry));

module.exports = router;

