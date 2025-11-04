/**
 * Anwendungskonfiguration
 * Lädt und exportiert alle Umgebungsvariablen mit Standardwerten
 */
require('dotenv').config();

module.exports = {
  // Server-Konfiguration
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  
  // Scraper-Konfiguration
  scraper: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 50,
    defaultTradeSizes: process.env.DEFAULT_TRADE_SIZES || '5k-15k,15k-50k,50k-100k,100k-250k,250k-500k,500k-1m,1m-5m,5m-25m,25m-50m,50m+',
    defaultAssetType: process.env.DEFAULT_ASSET_TYPE || 'stock',
    maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS, 10) || 1000,
  },
  
  // Cache-Konfiguration
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL, 10) || 3600, // in Sekunden
  },
  
  // Rate-Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1 Minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  // Datenbank
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/capitol_trades',
    useMemory: process.env.USE_MEMORY_DB === 'true', // Fallback auf In-Memory wenn keine MongoDB
  },
  
  // Puppeteer-Konfiguration
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
    timeout: parseInt(process.env.PUPPETEER_TIMEOUT, 10) || 30000,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
  },
  
  // CORS-Konfiguration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
};

