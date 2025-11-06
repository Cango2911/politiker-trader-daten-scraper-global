/**
 * 🌍 WORLD INDICES API ROUTES
 * Endpunkte für Länder-Indizes mit kontinentaler Filterung
 */

const express = require('express');
const router = express.Router();
const worldIndicesService = require('../services/world-indices.service');
const fearGreedService = require('../services/fear-greed.service');
const logger = require('../utils/logger');

/**
 * @route GET /api/world-indices/all
 * @desc Get all indices from all 18 countries
 */
router.get('/all', (req, res) => {
  try {
    const indices = worldIndicesService.getAllIndices();
    res.json({ success: true, data: indices, count: indices.length });
  } catch (error) {
    logger.error('Error in /world-indices/all:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/world-indices/continent/:continent
 * @desc Get indices by continent (americas, europe, asia)
 */
router.get('/continent/:continent', (req, res) => {
  try {
    const { continent } = req.params;
    const indices = worldIndicesService.getIndicesByContinent(continent);
    res.json({ success: true, continent, data: indices, count: indices.length });
  } catch (error) {
    logger.error(`Error in /world-indices/continent/${req.params.continent}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/world-indices/country/:country
 * @desc Get indices by country
 */
router.get('/country/:country', (req, res) => {
  try {
    const { country } = req.params;
    const indices = worldIndicesService.getIndicesByCountry(country);
    res.json({ success: true, country, data: indices, count: indices.length });
  } catch (error) {
    logger.error(`Error in /world-indices/country/${req.params.country}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/world-indices/continents
 * @desc Get continents summary
 */
router.get('/continents', (req, res) => {
  try {
    const summary = worldIndicesService.getContinentsSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Error in /world-indices/continents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/world-indices/fear-greed
 * @desc Get REAL Fear & Greed Index
 */
router.get('/fear-greed', async (req, res) => {
  try {
    const fearGreed = await fearGreedService.calculateRealFearGreed();
    res.json({ success: true, data: fearGreed });
  } catch (error) {
    logger.error('Error in /world-indices/fear-greed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

