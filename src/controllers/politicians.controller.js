/**
 * Politicians Controller
 * Verwaltet alle Politiker-bezogenen API-Endpoints
 */
const Politician = require('../models/politician.model');
const Trade = require('../models/trade.model');
const logger = require('../utils/logger');
const { NotFoundError } = require('../middleware/error.middleware');
const config = require('../config/app.config');

class PoliticiansController {
  /**
   * GET /api/politicians - Alle Politiker
   */
  static async getAllPoliticians(req, res) {
    const {
      country,
      name,
      page = 1,
      limit = 50,
    } = req.query;

    try {
      const filter = {};
      
      if (country) filter.country = country.toLowerCase();
      if (name) filter.name = new RegExp(name, 'i');

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      if (config.database.useMemory) {
        return res.json({
          success: true,
          message: 'In-Memory-Modus: Keine Daten verfügbar',
          data: [],
          pagination: { page: 1, limit: limitNum, total: 0, pages: 0 },
        });
      }

      const [politicians, total] = await Promise.all([
        Politician.find(filter).sort({ 'statistics.totalTrades': -1 }).skip(skip).limit(limitNum).lean(),
        Politician.countDocuments(filter),
      ]);

      logger.info('Politiker abgerufen', {
        requestId: req.id,
        count: politicians.length,
        total,
      });

      res.json({
        success: true,
        data: politicians,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Fehler beim Abrufen der Politiker:', error);
      throw error;
    }
  }

  /**
   * GET /api/politicians/:id - Einzelnen Politiker abrufen
   */
  static async getPoliticianById(req, res) {
    const { id } = req.params;

    if (config.database.useMemory) {
      throw new NotFoundError('In-Memory-Modus: Keine Daten verfügbar');
    }

    const politician = await Politician.findById(id);

    if (!politician) {
      throw new NotFoundError(`Politiker mit ID ${id} nicht gefunden`);
    }

    logger.info('Politiker abgerufen', { requestId: req.id, politicianId: id });

    res.json({
      success: true,
      data: politician,
    });
  }

  /**
   * GET /api/politicians/:id/trades - Alle Trades eines Politikers
   */
  static async getPoliticianTrades(req, res) {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (config.database.useMemory) {
      return res.json({
        success: true,
        message: 'In-Memory-Modus: Keine Daten verfügbar',
        data: [],
      });
    }

    const politician = await Politician.findById(id);

    if (!politician) {
      throw new NotFoundError(`Politiker mit ID ${id} nicht gefunden`);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const filter = {
      country: politician.country,
      'politician.name': politician.name,
    };

    const [trades, total] = await Promise.all([
      Trade.find(filter).sort({ 'dates.transaction': -1 }).skip(skip).limit(limitNum).lean(),
      Trade.countDocuments(filter),
    ]);

    res.json({
      success: true,
      politician: politician.name,
      data: trades,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
}

module.exports = PoliticiansController;

