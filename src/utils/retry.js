/**
 * Retry-Utility für fehlerhafte Operationen
 */
const logger = require('./logger');
const config = require('../config/app.config');

/**
 * Führt eine Funktion mit Retry-Logik aus
 * @param {Function} fn - Die auszuführende Funktion
 * @param {Object} options - Optionen für Retry
 * @param {number} options.maxRetries - Maximale Anzahl von Wiederholungen
 * @param {number} options.delay - Verzögerung zwischen Versuchen in ms
 * @param {Function} options.onRetry - Callback bei jedem Retry
 * @returns {Promise} - Ergebnis der Funktion
 */
async function retry(fn, options = {}) {
  const {
    maxRetries = config.scraper.maxRetries,
    delay = config.scraper.retryDelayMs,
    onRetry = null,
    exponentialBackoff = true,
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const currentDelay = exponentialBackoff 
          ? delay * Math.pow(2, attempt)
          : delay;
        
        logger.warn(`Versuch ${attempt + 1}/${maxRetries + 1} fehlgeschlagen. Wiederhole in ${currentDelay}ms...`, {
          error: error.message,
          attempt: attempt + 1,
        });
        
        if (onRetry) {
          await onRetry(attempt, error);
        }
        
        await sleep(currentDelay);
      }
    }
  }
  
  logger.error(`Alle ${maxRetries + 1} Versuche fehlgeschlagen`, {
    error: lastError.message,
  });
  
  throw lastError;
}

/**
 * Sleep-Utility
 * @param {number} ms - Millisekunden zu warten
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Führt mehrere Operationen mit Rate-Limiting aus
 * @param {Array} items - Array von Items zu verarbeiten
 * @param {Function} fn - Funktion die auf jedes Item angewendet wird
 * @param {Object} options - Optionen
 * @returns {Promise<Array>} - Ergebnisse
 */
async function rateLimitedBatch(items, fn, options = {}) {
  const {
    batchSize = 5,
    delayBetweenBatches = 1000,
  } = options;
  
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    logger.debug(`Verarbeite Batch ${Math.floor(i / batchSize) + 1} von ${Math.ceil(items.length / batchSize)}`);
    
    const batchResults = await Promise.all(
      batch.map(item => retry(() => fn(item)))
    );
    
    results.push(...batchResults);
    
    // Warte zwischen Batches (außer beim letzten)
    if (i + batchSize < items.length) {
      await sleep(delayBetweenBatches);
    }
  }
  
  return results;
}

module.exports = {
  retry,
  sleep,
  rateLimitedBatch,
};

