/**
 * Haupt-Scraper-Service
 * Orchestriert alle länderspezifischen Scraper
 */
const { getEnabledCountries, getCountryByCode } = require('../config/countries.config');
const logger = require('../utils/logger');
const Trade = require('../models/trade.model');
const Politician = require('../models/politician.model');
const config = require('../config/app.config');

// Importiere alle Scraper
const UsaScraper = require('./scrapers/usa.scraper');
const GermanyScraper = require('./scrapers/germany.scraper');
const UkScraper = require('./scrapers/uk.scraper');
const FranceScraper = require('./scrapers/france.scraper');
const ItalyScraper = require('./scrapers/italy.scraper');
const SpainScraper = require('./scrapers/spain.scraper');
const ChinaScraper = require('./scrapers/china.scraper');
const JapanScraper = require('./scrapers/japan.scraper');
const IndiaScraper = require('./scrapers/india.scraper');
const SouthKoreaScraper = require('./scrapers/southKorea.scraper');
const IndonesiaScraper = require('./scrapers/indonesia.scraper');
const NigeriaScraper = require('./scrapers/nigeria.scraper');
const SouthAfricaScraper = require('./scrapers/southAfrica.scraper');
const EgyptScraper = require('./scrapers/egypt.scraper');
const KenyaScraper = require('./scrapers/kenya.scraper');
const GhanaScraper = require('./scrapers/ghana.scraper');
const TurkeyScraper = require('./scrapers/turkey.scraper');
const RussiaScraper = require('./scrapers/russia.scraper');

// Scraper-Mapping
const SCRAPER_MAP = {
  UsaScraper,
  GermanyScraper,
  UkScraper,
  FranceScraper,
  ItalyScraper,
  SpainScraper,
  RussiaScraper,
  ChinaScraper,
  JapanScraper,
  IndiaScraper,
  SouthKoreaScraper,
  IndonesiaScraper,
  NigeriaScraper,
  SouthAfricaScraper,
  EgyptScraper,
  KenyaScraper,
  GhanaScraper,
  TurkeyScraper,
};

class ScraperService {
  /**
   * Erstellt einen Scraper für ein bestimmtes Land
   */
  static createScraper(countryCode) {
    const countryConfig = getCountryByCode(countryCode);
    
    if (!countryConfig) {
      throw new Error(`Land nicht gefunden: ${countryCode}`);
    }
    
    if (!countryConfig.enabled) {
      throw new Error(`Scraper für ${countryConfig.name} ist deaktiviert`);
    }
    
    const ScraperClass = SCRAPER_MAP[countryConfig.scraperClass];
    
    if (!ScraperClass) {
      throw new Error(`Scraper-Klasse nicht gefunden: ${countryConfig.scraperClass}`);
    }
    
    return new ScraperClass(countryConfig);
  }

  /**
   * Scraped Daten für ein bestimmtes Land
   */
  static async scrapeCountry(countryCode, options = {}) {
    logger.info(`Starte Scraping für ${countryCode}`);
    
    try {
      const scraper = this.createScraper(countryCode);
      const trades = await scraper.run(options);
      
      logger.info(`Scraping abgeschlossen für ${countryCode}: ${trades.length} Trades`);
      
      // Speichere in Datenbank wenn nicht im Memory-Modus
      if (!config.database.useMemory && trades.length > 0) {
        await this.saveTrades(trades);
      }
      
      return {
        country: countryCode,
        success: true,
        tradesCount: trades.length,
        trades,
      };
    } catch (error) {
      logger.error(`Scraping fehlgeschlagen für ${countryCode}:`, error);
      
      return {
        country: countryCode,
        success: false,
        error: error.message,
        tradesCount: 0,
        trades: [],
      };
    }
  }

  /**
   * Scraped Daten für alle aktivierten Länder
   */
  static async scrapeAll(options = {}) {
    const enabledCountries = getEnabledCountries();
    const countryCodes = Object.keys(enabledCountries);
    
    logger.info(`Starte Scraping für ${countryCodes.length} Länder`);
    
    const results = [];
    
    for (const code of countryCodes) {
      try {
        const result = await this.scrapeCountry(code, options);
        results.push(result);
        
        // Warte zwischen Ländern um Server nicht zu überlasten
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        logger.error(`Fehler beim Scraping von ${code}:`, error);
        results.push({
          country: code,
          success: false,
          error: error.message,
          tradesCount: 0,
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalTrades = results.reduce((sum, r) => sum + r.tradesCount, 0);
    
    logger.info(`Scraping abgeschlossen: ${successCount}/${countryCodes.length} erfolgreich, ${totalTrades} Trades insgesamt`);
    
    return {
      totalCountries: countryCodes.length,
      successfulCountries: successCount,
      totalTrades,
      results,
    };
  }

  /**
   * Speichert Trades in der Datenbank
   */
  static async saveTrades(trades) {
    logger.info(`Speichere ${trades.length} Trades in Datenbank`);
    
    try {
      const savedTrades = [];
      const politicians = new Map();
      
      for (const tradeData of trades) {
        // Prüfe ob Trade bereits existiert (Deduplizierung)
        const existing = await Trade.findOne({
          country: tradeData.country,
          'politician.name': tradeData.politician.name,
          'dates.transaction': tradeData.dates.transaction,
          'trade.ticker': tradeData.trade.ticker,
        });
        
        if (existing) {
          logger.debug('Trade bereits vorhanden, überspringe', {
            politician: tradeData.politician.name,
            ticker: tradeData.trade.ticker,
          });
          continue;
        }
        
        // Erstelle neuen Trade
        const trade = new Trade(tradeData);
        await trade.save();
        savedTrades.push(trade);
        
        // Sammle Politiker-Informationen
        const politicianKey = `${tradeData.country}:${tradeData.politician.name}`;
        if (!politicians.has(politicianKey)) {
          politicians.set(politicianKey, tradeData.politician);
        }
      }
      
      // Update oder erstelle Politiker-Einträge
      for (const [key, politicianData] of politicians.entries()) {
        const [country] = key.split(':');
        await this.updateOrCreatePolitician(country, politicianData);
      }
      
      logger.info(`${savedTrades.length} neue Trades gespeichert`);
      
      return savedTrades;
    } catch (error) {
      logger.error('Fehler beim Speichern der Trades:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert oder erstellt einen Politiker-Eintrag
   */
  static async updateOrCreatePolitician(country, politicianData) {
    try {
      let politician = await Politician.findOne({
        country,
        name: politicianData.name,
      });
      
      if (!politician) {
        politician = new Politician({
          country,
          name: politicianData.name,
          party: politicianData.party,
          chamber: politicianData.chamber,
          district: politicianData.district,
        });
      } else {
        // Update nur wenn neue Daten vorhanden
        if (politicianData.party) politician.party = politicianData.party;
        if (politicianData.chamber) politician.chamber = politicianData.chamber;
        if (politicianData.district) politician.district = politicianData.district;
      }
      
      // Aktualisiere Statistiken
      await politician.updateStatistics(Trade);
      
      return politician;
    } catch (error) {
      logger.error('Fehler beim Aktualisieren des Politikers:', error);
      throw error;
    }
  }

  /**
   * Gibt eine Liste aller verfügbaren Scraper zurück
   */
  static getAvailableScrapers() {
    const enabledCountries = getEnabledCountries();
    
    return Object.entries(enabledCountries).map(([code, config]) => ({
      code,
      name: config.name,
      region: config.region,
      enabled: config.enabled,
      sources: config.sources,
    }));
  }
}

module.exports = ScraperService;

