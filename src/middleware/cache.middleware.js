/**
 * Caching-Middleware
 * Cached API-Antworten basierend auf Request-URL und Query-Parametern
 */
const NodeCache = require('node-cache');
const config = require('../config/app.config');
const logger = require('../utils/logger');

// Cache-Instanz erstellen
const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: 120,
  useClones: false,
});

/**
 * Generiert einen Cache-Key basierend auf Request
 */
function generateCacheKey(req) {
  const { path, query } = req;
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  return `${path}${queryString ? '?' + queryString : ''}`;
}

/**
 * Cache-Middleware
 */
function cacheMiddleware(req, res, next) {
  // Prüfe ob Cache aktiviert ist
  if (!config.cache.enabled) {
    return next();
  }

  // Prüfe auf forceRefresh-Parameter
  if (req.query.forceRefresh === 'true') {
    logger.debug('Cache wird umgangen (forceRefresh=true)', {
      requestId: req.id,
      path: req.path,
    });
    return next();
  }

  const key = generateCacheKey(req);

  try {
    const cachedData = cache.get(key);
    
    if (cachedData) {
      logger.debug('Cache-Treffer', {
        requestId: req.id,
        key,
      });
      
      return res.json({
        ...cachedData,
        cached: true,
        cachedAt: new Date().toISOString(),
      });
    }

    logger.debug('Cache-Miss', {
      requestId: req.id,
      key,
    });

    // Original-Response-Methode speichern
    const originalJson = res.json.bind(res);

    // Response-Methode überschreiben um Daten zu cachen
    res.json = function(data) {
      // Nur erfolgreiche Antworten cachen
      if (res.statusCode === 200) {
        cache.set(key, data);
        logger.debug('Daten in Cache gespeichert', {
          requestId: req.id,
          key,
          ttl: config.cache.ttl,
        });
      }
      
      return originalJson(data);
    };

    next();
  } catch (error) {
    logger.error('Cache-Fehler', {
      requestId: req.id,
      error: error.message,
    });
    next();
  }
}

/**
 * Löscht den gesamten Cache
 */
function clearCache() {
  const keys = cache.keys();
  cache.flushAll();
  logger.info('Cache geleert', { keysCleared: keys.length });
  return keys.length;
}

/**
 * Löscht spezifische Cache-Einträge nach Pattern
 */
function clearCacheByPattern(pattern) {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => cache.del(key));
  logger.info('Cache-Einträge gelöscht', {
    pattern,
    keysCleared: matchingKeys.length,
  });
  return matchingKeys.length;
}

/**
 * Gibt Cache-Statistiken zurück
 */
function getCacheStats() {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize,
  };
}

module.exports = {
  cacheMiddleware,
  clearCache,
  clearCacheByPattern,
  getCacheStats,
  cache,
};

