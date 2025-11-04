/**
 * Countries Controller
 * Verwaltet alle Länder-bezogenen API-Endpoints
 */
const { getEnabledCountries, getCountryByCode, getRegions } = require('../config/countries.config');
const ScraperService = require('../services/scraper.service');
const Trade = require('../models/trade.model');
const Politician = require('../models/politician.model');
const logger = require('../utils/logger');
const { NotFoundError } = require('../middleware/error.middleware');
const config = require('../config/app.config');

class CountriesController {
  /**
   * GET /api/countries - Alle unterstützten Länder
   */
  static async getAllCountries(req, res) {
    const enabledCountries = getEnabledCountries();
    const regions = getRegions();

    const countriesArray = Object.entries(enabledCountries).map(([code, config]) => ({
      code,
      name: config.name,
      region: config.region,
      enabled: config.enabled,
      sources: config.sources,
    }));

    res.json({
      success: true,
      total: countriesArray.length,
      regions,
      data: countriesArray,
    });
  }

  /**
   * GET /api/countries/:countryCode - Details zu einem Land
   */
  static async getCountryDetails(req, res) {
    const { countryCode } = req.params;

    const countryConfig = getCountryByCode(countryCode);

    if (!countryConfig) {
      throw new NotFoundError(`Land nicht gefunden: ${countryCode}`);
    }

    // Statistiken aus Datenbank abrufen wenn verfügbar
    let statistics = {
      totalTrades: 0,
      totalPoliticians: 0,
      lastUpdate: null,
    };

    if (!config.database.useMemory) {
      try {
        const [tradesCount, politiciansCount, lastTrade] = await Promise.all([
          Trade.countDocuments({ country: countryCode }),
          Politician.countDocuments({ country: countryCode }),
          Trade.findOne({ country: countryCode }).sort({ 'dates.transaction': -1 }).lean(),
        ]);

        statistics = {
          totalTrades: tradesCount,
          totalPoliticians: politiciansCount,
          lastUpdate: lastTrade ? lastTrade.dates.transaction : null,
        };
      } catch (error) {
        logger.warn('Fehler beim Abrufen der Statistiken:', error);
      }
    }

    res.json({
      success: true,
      data: {
        code: countryConfig.code,
        name: countryConfig.name,
        region: countryConfig.region,
        enabled: countryConfig.enabled,
        sources: countryConfig.sources,
        statistics,
      },
    });
  }

  /**
   * GET /api/countries/:countryCode/trades - Trades eines Landes
   */
  static async getCountryTrades(req, res) {
    const { countryCode } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const countryConfig = getCountryByCode(countryCode);

    if (!countryConfig) {
      throw new NotFoundError(`Land nicht gefunden: ${countryCode}`);
    }

    if (config.database.useMemory) {
      return res.json({
        success: true,
        message: 'In-Memory-Modus: Keine Daten verfügbar',
        data: [],
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const filter = { country: countryCode };

    const [trades, total] = await Promise.all([
      Trade.find(filter).sort({ 'dates.transaction': -1 }).skip(skip).limit(limitNum).lean(),
      Trade.countDocuments(filter),
    ]);

    res.json({
      success: true,
      country: countryConfig.name,
      data: trades,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * GET /api/countries/:countryCode/politicians - Politiker eines Landes
   */
  static async getCountryPoliticians(req, res) {
    const { countryCode } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const countryConfig = getCountryByCode(countryCode);

    if (!countryConfig) {
      throw new NotFoundError(`Land nicht gefunden: ${countryCode}`);
    }

    if (config.database.useMemory) {
      return res.json({
        success: true,
        message: 'In-Memory-Modus: Keine Daten verfügbar',
        data: [],
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const filter = { country: countryCode };

    const [politicians, total] = await Promise.all([
      Politician.find(filter).sort({ 'statistics.totalTrades': -1 }).skip(skip).limit(limitNum).lean(),
      Politician.countDocuments(filter),
    ]);

    res.json({
      success: true,
      country: countryConfig.name,
      data: politicians,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }

  /**
   * POST /api/countries/:countryCode/scrape - Daten für ein Land scrapen
   */
  static async scrapeCountry(req, res) {
    const { countryCode } = req.params;
    const { pages = 1, forceRefresh = false } = req.body;

    const countryConfig = getCountryByCode(countryCode);

    if (!countryConfig) {
      throw new NotFoundError(`Land nicht gefunden: ${countryCode}`);
    }

    logger.info(`Starte manuelles Scraping für ${countryConfig.name}`, {
      requestId: req.id,
      pages,
      forceRefresh,
    });

    // Scraping im Hintergrund starten (nicht blockierend)
    ScraperService.scrapeCountry(countryCode, { pages })
      .then(result => {
        logger.info(`Scraping abgeschlossen für ${countryCode}`, result);
      })
      .catch(error => {
        logger.error(`Scraping fehlgeschlagen für ${countryCode}:`, error);
      });

    res.json({
      success: true,
      message: `Scraping für ${countryConfig.name} wurde gestartet`,
      country: countryConfig.name,
      code: countryCode,
    });
  }
}

module.exports = CountriesController;

