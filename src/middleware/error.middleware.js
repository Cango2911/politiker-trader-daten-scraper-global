/**
 * Error-Handling-Middleware
 * Zentrale Fehlerbehandlung für die gesamte Anwendung
 */
const logger = require('../utils/logger');
const config = require('../config/app.config');

/**
 * Fehlerbehandlungs-Middleware
 */
function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Request Error', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
  });

  // Bestimme Status-Code
  const statusCode = err.statusCode || err.status || 500;

  // Bestimme Fehlermeldung
  const message = err.message || 'Ein interner Serverfehler ist aufgetreten';

  // Antwort senden
  res.status(statusCode).json({
    error: true,
    message,
    statusCode,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    ...(config.env === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 Not Found Handler
 */
function notFoundHandler(req, res) {
  logger.warn('Route nicht gefunden', {
    requestId: req.id,
    method: req.method,
    path: req.path,
  });

  res.status(404).json({
    error: true,
    message: 'Route nicht gefunden',
    statusCode: 404,
    path: req.path,
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async-Handler-Wrapper
 * Fängt Fehler in async Route-Handlern ab
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Custom Error-Klassen
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Ressource nicht gefunden') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ScraperError extends Error {
  constructor(message, country = null) {
    super(message);
    this.name = 'ScraperError';
    this.statusCode = 500;
    this.country = country;
  }
}

class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ValidationError,
  NotFoundError,
  ScraperError,
  DatabaseError,
};

