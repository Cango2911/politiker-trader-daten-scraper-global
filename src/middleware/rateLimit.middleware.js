/**
 * Rate-Limiting-Middleware
 * Schützt die API vor Missbrauch durch Begrenzung der Anfragen pro IP
 */
const rateLimit = require('express-rate-limit');
const config = require('../config/app.config');
const logger = require('../utils/logger');

/**
 * Standard-Rate-Limiter für alle API-Routen
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Zu viele Anfragen von dieser IP. Bitte versuchen Sie es später erneut.',
    retryAfter: config.rateLimit.windowMs / 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate-Limit überschritten', {
      ip: req.ip,
      path: req.path,
      requestId: req.id,
    });
    
    res.status(429).json({
      error: 'Zu viele Anfragen',
      message: 'Sie haben das Rate-Limit überschritten. Bitte versuchen Sie es später erneut.',
      retryAfter: config.rateLimit.windowMs / 1000,
    });
  },
  skip: (req) => {
    // Skippe Health-Check
    return req.path === '/health';
  },
});

/**
 * Strengerer Rate-Limiter für Scrape-Endpoints
 */
const scrapeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 10, // Max 10 Scrape-Requests pro Stunde
  message: {
    error: 'Zu viele Scrape-Anfragen. Bitte warten Sie eine Stunde.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Scrape Rate-Limit überschritten', {
      ip: req.ip,
      path: req.path,
      requestId: req.id,
    });
    
    res.status(429).json({
      error: 'Zu viele Scrape-Anfragen',
      message: 'Sie haben das Scrape-Limit überschritten. Bitte versuchen Sie es in einer Stunde erneut.',
      retryAfter: 3600,
    });
  },
});

/**
 * Moderater Rate-Limiter für Config-Updates
 */
const configLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 20,
  message: {
    error: 'Zu viele Konfigurationsänderungen. Bitte warten Sie.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  scrapeLimiter,
  configLimiter,
};

