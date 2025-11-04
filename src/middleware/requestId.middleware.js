/**
 * Request-ID-Middleware
 * Fügt jedem Request eine eindeutige ID hinzu für Tracking und Logging
 */
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request-ID-Middleware
 */
function requestIdMiddleware(req, res, next) {
  // Generiere oder verwende existierende Request-ID
  req.id = req.headers['x-request-id'] || uuidv4();
  
  // Füge Request-ID zu Response-Headers hinzu
  res.setHeader('X-Request-ID', req.id);
  
  // Log eingehenden Request
  logger.info('Eingehender Request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  // Erfasse Request-Startzeit für Performance-Messung
  req.startTime = Date.now();
  
  // Log Response wenn fertig
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    logger.info('Request abgeschlossen', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
}

module.exports = requestIdMiddleware;

