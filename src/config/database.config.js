/**
 * Datenbank-Konfiguration
 * Unterstützt sowohl MongoDB als auch In-Memory-Speicher
 */
const mongoose = require('mongoose');
const config = require('./app.config');
const logger = require('../utils/logger');

let isConnected = false;

/**
 * Verbindung zur MongoDB herstellen
 */
async function connectDatabase() {
  if (isConnected) {
    logger.info('Datenbank ist bereits verbunden');
    return;
  }

  try {
    if (config.database.useMemory) {
      logger.info('Verwende In-Memory-Speicher (MongoDB nicht konfiguriert)');
      isConnected = true;
      return;
    }

    await mongoose.connect(config.database.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    logger.info('MongoDB erfolgreich verbunden');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB Verbindungsfehler:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB Verbindung getrennt');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB wieder verbunden');
      isConnected = true;
    });

  } catch (error) {
    logger.error('MongoDB Verbindung fehlgeschlagen:', error);
    logger.info('Fallback auf In-Memory-Speicher');
    config.database.useMemory = true;
    isConnected = true;
  }
}

/**
 * Datenbank-Verbindung trennen
 */
async function disconnectDatabase() {
  if (!config.database.useMemory && isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB Verbindung getrennt');
  }
}

/**
 * Datenbank-Status prüfen
 */
function isDatabaseConnected() {
  if (config.database.useMemory) {
    return true;
  }
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
};

