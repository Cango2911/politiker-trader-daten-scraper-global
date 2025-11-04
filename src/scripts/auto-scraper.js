#!/usr/bin/env node

/**
 * Automatisches Scraping-Skript
 * Führt alle 6 Stunden Scraping für aktivierte Länder durch
 */

const ScraperService = require('../services/scraper.service');
const logger = require('../utils/logger');
const config = require('../config/app.config');

// Konfiguration
const SCRAPING_CONFIG = {
  usa: { pages: 10, enabled: true },
  germany: { pages: 1, enabled: true },
  uk: { pages: 1, enabled: false }, // UK Scraper muss noch verbessert werden
  russia: { pages: 1, enabled: false },
};

async function runAutoScraping() {
  logger.info('🚀 Starte automatisches Scraping...');
  
  const results = [];
  
  for (const [countryCode, countryConfig] of Object.entries(SCRAPING_CONFIG)) {
    if (!countryConfig.enabled) {
      logger.info(`⏭️ Überspringe ${countryCode} (deaktiviert)`);
      continue;
    }
    
    try {
      logger.info(`📡 Starte Scraping für ${countryCode} (${countryConfig.pages} Seiten)`);
      
      const result = await ScraperService.scrapeCountry(countryCode, {
        pages: countryConfig.pages,
        forceRefresh: false,
      });
      
      results.push({
        country: countryCode,
        success: result.success,
        trades: result.tradesCount,
      });
      
      if (result.success) {
        logger.info(`✅ ${countryCode}: ${result.tradesCount} Trades erfolgreich`);
      } else {
        logger.error(`❌ ${countryCode}: Scraping fehlgeschlagen - ${result.error}`);
      }
      
      // Warte 10 Sekunden zwischen Ländern
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } catch (error) {
      logger.error(`❌ Fehler beim Scraping von ${countryCode}:`, error);
      results.push({
        country: countryCode,
        success: false,
        error: error.message,
      });
    }
  }
  
  // Zusammenfassung
  const successCount = results.filter(r => r.success).length;
  const totalTrades = results.reduce((sum, r) => sum + (r.trades || 0), 0);
  
  logger.info(`
📊 Automatisches Scraping abgeschlossen:
  ✅ Erfolgreich: ${successCount}/${results.length} Länder
  📈 Trades gesamt: ${totalTrades}
  ⏰ Nächster Run: in 6 Stunden
  `);
  
  return results;
}

// Wenn direkt ausgeführt
if (require.main === module) {
  runAutoScraping()
    .then(() => {
      logger.info('✨ Auto-Scraping erfolgreich abgeschlossen');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Auto-Scraping fehlgeschlagen:', error);
      process.exit(1);
    });
}

module.exports = { runAutoScraping };

