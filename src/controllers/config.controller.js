/**
 * Config Controller
 * Verwaltet Konfigurations-Endpoints
 */
const config = require('../config/app.config');
const { clearCache, getCacheStats } = require('../middleware/cache.middleware');
const logger = require('../utils/logger');

class ConfigController {
  /**
   * GET /api/config - Aktuelle Konfiguration anzeigen
   */
  static async getConfig(req, res) {
    const currentConfig = {
      environment: config.env,
      cache: {
        enabled: config.cache.enabled,
        ttl: config.cache.ttl,
        stats: getCacheStats(),
      },
      scraper: {
        defaultPageSize: config.scraper.defaultPageSize,
        maxRetries: config.scraper.maxRetries,
        retryDelayMs: config.scraper.retryDelayMs,
      },
      rateLimit: {
        windowMs: config.rateLimit.windowMs,
        maxRequests: config.rateLimit.maxRequests,
      },
      database: {
        type: config.database.useMemory ? 'in-memory' : 'mongodb',
        connected: !config.database.useMemory,
      },
    };

    res.json({
      success: true,
      data: currentConfig,
    });
  }

  /**
   * PUT /api/config - Konfiguration aktualisieren
   */
  static async updateConfig(req, res) {
    const updates = req.body;

    logger.info('Konfiguration wird aktualisiert', {
      requestId: req.id,
      updates,
    });

    // Nur erlaubte Felder aktualisieren
    if (updates.cache) {
      if (typeof updates.cache.enabled === 'boolean') {
        config.cache.enabled = updates.cache.enabled;
      }
      if (typeof updates.cache.ttl === 'number') {
        config.cache.ttl = updates.cache.ttl;
      }
    }

    if (updates.scraper) {
      if (typeof updates.scraper.maxRetries === 'number') {
        config.scraper.maxRetries = updates.scraper.maxRetries;
      }
      if (typeof updates.scraper.retryDelayMs === 'number') {
        config.scraper.retryDelayMs = updates.scraper.retryDelayMs;
      }
    }

    if (updates.rateLimit) {
      if (typeof updates.rateLimit.windowMs === 'number') {
        config.rateLimit.windowMs = updates.rateLimit.windowMs;
      }
      if (typeof updates.rateLimit.maxRequests === 'number') {
        config.rateLimit.maxRequests = updates.rateLimit.maxRequests;
      }
    }

    logger.info('Konfiguration aktualisiert', { requestId: req.id });

    res.json({
      success: true,
      message: 'Konfiguration erfolgreich aktualisiert',
      data: {
        cache: config.cache,
        scraper: config.scraper,
        rateLimit: config.rateLimit,
      },
    });
  }

  /**
   * POST /api/config/clear-cache - Cache leeren
   */
  static async clearCache(req, res) {
    logger.info('Cache wird geleert', { requestId: req.id });

    const keysCleared = clearCache();

    res.json({
      success: true,
      message: 'Cache erfolgreich geleert',
      keysCleared,
    });
  }

  /**
   * GET /api/stats - Globale Statistiken
   */
  static async getStats(req, res) {
    if (config.database.useMemory) {
      return res.json({
        success: true,
        message: 'In-Memory-Modus: Keine Daten verfügbar',
        data: {
          totalTrades: 0,
          totalPoliticians: 0,
          totalCountries: 0,
        },
      });
    }

    try {
      const Trade = require('../models/trade.model');
      const Politician = require('../models/politician.model');

      const [totalTrades, totalPoliticians, countriesStats, recentTrades] = await Promise.all([
        Trade.countDocuments(),
        Politician.countDocuments(),
        Trade.aggregate([
          {
            $group: {
              _id: '$country',
              count: { $sum: 1 },
            },
          },
        ]),
        Trade.find().sort({ 'dates.transaction': -1 }).limit(10).lean(),
      ]);

      res.json({
        success: true,
        data: {
          totalTrades,
          totalPoliticians,
          totalCountries: countriesStats.length,
          countriesStats,
          recentTrades,
        },
      });
    } catch (error) {
      logger.error('Fehler beim Abrufen der Statistiken:', error);
      throw error;
    }
  }
}

module.exports = ConfigController;

