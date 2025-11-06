/**
 * Haupt-Router
 * Kombiniert alle Route-Module
 */
const express = require('express');
const router = express.Router();

const tradesRoutes = require('./trades.routes');
const politiciansRoutes = require('./politicians.routes');
const countriesRoutes = require('./countries.routes');
const configRoutes = require('./config.routes');
const marketRoutes = require('./market.routes');
const hybridMarketRoutes = require('./hybrid-market.routes');

// Mount routes
router.use('/trades', tradesRoutes);
router.use('/politicians', politiciansRoutes);
router.use('/countries', countriesRoutes);
router.use('/config', configRoutes);
router.use('/stats', configRoutes); // stats ist ein Alias für config/stats
router.use('/market', marketRoutes); // Market data & indicators
router.use('/hybrid-market', hybridMarketRoutes); // 🔥 Hybrid Data Aggregator (ALL sources)

module.exports = router;

