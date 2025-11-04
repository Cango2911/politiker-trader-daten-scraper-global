/**
 * Trades Controller
 * Verwaltet alle Trade-bezogenen API-Endpoints
 */
const Trade = require('../models/trade.model');
const logger = require('../utils/logger');
const { NotFoundError } = require('../middleware/error.middleware');
const config = require('../config/app.config');

class TradesController {
  /**
   * GET /api/trades - Alle Trades mit Filterung und Pagination
   */
  static async getAllTrades(req, res) {
    const {
      country,
      politician,
      ticker,
      tradeSize,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    try {
      // Build filter query
      const filter = {};
      
      if (country) filter.country = country.toLowerCase();
      if (politician) filter['politician.name'] = new RegExp(politician, 'i');
      if (ticker) filter['trade.ticker'] = ticker.toUpperCase();
      if (tradeSize) filter['trade.size'] = new RegExp(tradeSize, 'i');
      
      if (startDate || endDate) {
        filter['dates.transaction'] = {};
        if (startDate) filter['dates.transaction'].$gte = new Date(startDate);
        if (endDate) filter['dates.transaction'].$lte = new Date(endDate);
      }

      // Sorting
      const sort = {};
      if (sortBy === 'date') sort['dates.transaction'] = sortOrder === 'asc' ? 1 : -1;
      else if (sortBy === 'size') sort['trade.sizeMin'] = sortOrder === 'asc' ? 1 : -1;
      else if (sortBy === 'politician') sort['politician.name'] = sortOrder === 'asc' ? 1 : -1;
      else if (sortBy === 'ticker') sort['trade.ticker'] = sortOrder === 'asc' ? 1 : -1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // In-Memory Fallback wenn MongoDB nicht verfügbar
      if (config.database.useMemory) {
        return res.json({
          success: true,
          message: 'In-Memory-Modus: Keine Daten verfügbar. Bitte scrapen Sie zuerst Daten.',
          data: [],
          pagination: { page: 1, limit: limitNum, total: 0, pages: 0 },
        });
      }

      // Query ausführen
      const [trades, total] = await Promise.all([
        Trade.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
        Trade.countDocuments(filter),
      ]);

      logger.info('Trades abgerufen', {
        requestId: req.id,
        count: trades.length,
        total,
        filter,
      });

      res.json({
        success: true,
        data: trades,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        filter,
      });
    } catch (error) {
      logger.error('Fehler beim Abrufen der Trades:', error);
      throw error;
    }
  }

  /**
   * GET /api/trades/:id - Einzelnen Trade abrufen
   */
  static async getTradeById(req, res) {
    const { id } = req.params;

    if (config.database.useMemory) {
      throw new NotFoundError('In-Memory-Modus: Keine Daten verfügbar');
    }

    const trade = await Trade.findById(id);

    if (!trade) {
      throw new NotFoundError(`Trade mit ID ${id} nicht gefunden`);
    }

    logger.info('Trade abgerufen', { requestId: req.id, tradeId: id });

    res.json({
      success: true,
      data: trade,
    });
  }

  /**
   * GET /api/trades/size/:tradeSize - Trades nach Größe
   */
  static async getTradesBySize(req, res) {
    const { tradeSize } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (config.database.useMemory) {
      return res.json({
        success: true,
        message: 'In-Memory-Modus: Keine Daten verfügbar',
        data: [],
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const filter = { 'trade.size': new RegExp(tradeSize, 'i') };

    const [trades, total] = await Promise.all([
      Trade.find(filter).sort({ 'dates.transaction': -1 }).skip(skip).limit(limitNum).lean(),
      Trade.countDocuments(filter),
    ]);

    res.json({
      success: true,
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
   * GET /api/trades/by-politician/:politicianId - Trades eines Politikers
   */
  static async getTradesByPolitician(req, res) {
    const { politicianId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (config.database.useMemory) {
      return res.json({
        success: true,
        message: 'In-Memory-Modus: Keine Daten verfügbar',
        data: [],
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Suche nach Name oder ID
    const filter = {
      $or: [
        { 'politician.name': new RegExp(politicianId, 'i') },
      ],
    };

    const [trades, total] = await Promise.all([
      Trade.find(filter).sort({ 'dates.transaction': -1 }).skip(skip).limit(limitNum).lean(),
      Trade.countDocuments(filter),
    ]);

    res.json({
      success: true,
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
   * GET /api/trades/by-ticker/:ticker - Trades nach Ticker
   */
  static async getTradesByTicker(req, res) {
    const { ticker } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (config.database.useMemory) {
      return res.json({
        success: true,
        message: 'In-Memory-Modus: Keine Daten verfügbar',
        data: [],
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const filter = { 'trade.ticker': ticker.toUpperCase() };

    const [trades, total] = await Promise.all([
      Trade.find(filter).sort({ 'dates.transaction': -1 }).skip(skip).limit(limitNum).lean(),
      Trade.countDocuments(filter),
    ]);

    res.json({
      success: true,
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

module.exports = TradesController;

