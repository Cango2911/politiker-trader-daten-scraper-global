/**
 * Haupt-Einstiegspunkt der Anwendung
 * Capitol Trades Global Scraper API
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/app.config');
const { connectDatabase, isDatabaseConnected } = require('./config/database.config');
const logger = require('./utils/logger');
const requestIdMiddleware = require('./middleware/requestId.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const routes = require('./routes');

// Express App erstellen
const app = express();

/**
 * Middleware Setup
 */

// Security Headers mit lockerer CSP für TradingView, CoinGecko, externe Bilder
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://s3.tradingview.com", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.coingecko.com", "wss://"],
      frameSrc: ["'self'", "https://www.tradingview.com"],
      workerSrc: ["'self'", "blob:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID Tracking
app.use(requestIdMiddleware);

// Static Files (Frontend)
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

// Rate Limiting
app.use('/api/', apiLimiter);

/**
 * Routes
 */

// Root Endpoint - Serve new main homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index-new.html'));
});

// Politician Trades - Bonus Feature (old homepage)
app.get('/politician-trades', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API Info Endpoint
app.get('/api-info', (req, res) => {
  res.json({
    success: true,
    message: 'FinanceHub API',
    version: '2.0.0',
    documentation: '/docs',
    endpoints: {
      trades: '/api/trades',
      politicians: '/api/politicians',
      countries: '/api/countries',
      config: '/api/config',
      stats: '/api/stats',
      market: '/api/market',
      health: '/health',
    },
    description: 'Global Financial News & Political Trading Data API',
    supportedCountries: [
      '🇺🇸 USA',
      '🇩🇪 Deutschland',
      '🇬🇧 UK',
      '🇫🇷 Frankreich',
      '🇮🇹 Italien',
      '🇪🇸 Spanien',
      '🇷🇺 Russland',
      '🇨🇳 China',
      '🇯🇵 Japan',
      '🇮🇳 Indien',
      '🇰🇷 Südkorea',
      '🇮🇩 Indonesien',
      '🇳🇬 Nigeria',
      '🇿🇦 Südafrika',
      '🇪🇬 Ägypten',
      '🇰🇪 Kenia',
      '🇬🇭 Ghana',
      '🇹🇷 Türkei',
    ],
  });
});

// Health Check
app.get('/health', (req, res) => {
  const dbConnected = isDatabaseConnected();
  const status = dbConnected || config.database.useMemory ? 'healthy' : 'degraded';

  res.status(status === 'healthy' ? 200 : 503).json({
    success: true,
    status,
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: {
      type: config.database.useMemory ? 'in-memory' : 'mongodb',
      connected: dbConnected,
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API Documentation (Simple)
app.get('/docs', (req, res) => {
  res.json({
    success: true,
    title: 'Capitol Trades Global Scraper API',
    version: '1.0.0',
    baseUrl: `http://localhost:${config.port}`,
    endpoints: [
      {
        method: 'GET',
        path: '/api/trades',
        description: 'Alle Trades mit optionaler Filterung',
        queryParams: ['country', 'politician', 'ticker', 'tradeSize', 'startDate', 'endDate', 'page', 'limit'],
      },
      {
        method: 'GET',
        path: '/api/trades/:id',
        description: 'Einzelnen Trade nach ID abrufen',
      },
      {
        method: 'GET',
        path: '/api/trades/size/:tradeSize',
        description: 'Trades nach Handelsgröße filtern',
      },
      {
        method: 'GET',
        path: '/api/trades/by-politician/:politicianId',
        description: 'Alle Trades eines Politikers',
      },
      {
        method: 'GET',
        path: '/api/trades/by-ticker/:ticker',
        description: 'Trades nach Ticker-Symbol',
      },
      {
        method: 'GET',
        path: '/api/politicians',
        description: 'Alle Politiker',
        queryParams: ['country', 'name', 'page', 'limit'],
      },
      {
        method: 'GET',
        path: '/api/politicians/:id',
        description: 'Einzelnen Politiker abrufen',
      },
      {
        method: 'GET',
        path: '/api/politicians/:id/trades',
        description: 'Alle Trades eines Politikers',
      },
      {
        method: 'GET',
        path: '/api/countries',
        description: 'Alle unterstützten Länder',
      },
      {
        method: 'GET',
        path: '/api/countries/:countryCode',
        description: 'Details zu einem Land',
      },
      {
        method: 'GET',
        path: '/api/countries/:countryCode/trades',
        description: 'Alle Trades eines Landes',
      },
      {
        method: 'GET',
        path: '/api/countries/:countryCode/politicians',
        description: 'Alle Politiker eines Landes',
      },
      {
        method: 'POST',
        path: '/api/countries/:countryCode/scrape',
        description: 'Daten für ein Land scrapen',
        body: { pages: 'number', forceRefresh: 'boolean' },
      },
      {
        method: 'GET',
        path: '/api/config',
        description: 'Aktuelle Konfiguration anzeigen',
      },
      {
        method: 'PUT',
        path: '/api/config',
        description: 'Konfiguration aktualisieren',
      },
      {
        method: 'POST',
        path: '/api/config/clear-cache',
        description: 'API-Cache leeren',
      },
      {
        method: 'GET',
        path: '/api/stats',
        description: 'Globale Statistiken',
      },
    ],
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use(notFoundHandler);

// Error Handler (muss als letztes kommen)
app.use(errorHandler);

/**
 * Server starten
 */
async function startServer() {
  try {
    // Verbinde zur Datenbank
    await connectDatabase();

    // Starte Server
    const server = app.listen(config.port, config.host, () => {
      logger.info(`🚀 Server läuft auf http://${config.host}:${config.port}`);
      logger.info(`📚 API-Dokumentation: http://localhost:${config.port}/docs`);
      logger.info(`💚 Health-Check: http://localhost:${config.port}/health`);
      logger.info(`🌍 Umgebung: ${config.env}`);
      logger.info(`💾 Datenbank: ${config.database.useMemory ? 'In-Memory' : 'MongoDB'}`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} empfangen. Starte graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP-Server geschlossen');
        
        const { disconnectDatabase } = require('./config/database.config');
        await disconnectDatabase();
        
        logger.info('Shutdown abgeschlossen');
        process.exit(0);
      });

      // Force shutdown nach 10 Sekunden
      setTimeout(() => {
        logger.error('Forced shutdown nach Timeout');
        process.exit(1);
      }, 10000);
    };

    // Signal Handler
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Uncaught Exception Handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Unhandled Rejection Handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason, promise });
    });

  } catch (error) {
    logger.error('Fehler beim Starten des Servers:', error);
    process.exit(1);
  }
}

// Server starten
if (require.main === module) {
  startServer();
}

module.exports = app;

