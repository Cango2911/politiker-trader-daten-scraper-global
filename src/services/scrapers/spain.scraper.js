/**
 * Spain Congreso Scraper
 * Template - Wird später implementiert
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class SpainScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'https://www.congreso.es/';
  }

  async scrape(options = {}) {
    logger.info('Spain Scraper - Noch nicht vollständig implementiert');
    return []; // Wird später implementiert
  }
}

module.exports = SpainScraper;
