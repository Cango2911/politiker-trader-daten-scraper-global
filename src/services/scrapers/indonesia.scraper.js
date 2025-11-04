/**
 * Indonesia DPR RI Scraper
 * Template - Wird später implementiert
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class IndonesiaScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'https://www.dpr.go.id/';
  }

  async scrape(options = {}) {
    logger.info('Indonesia Scraper - Noch nicht vollständig implementiert');
    return []; // Wird später implementiert
  }
}

module.exports = IndonesiaScraper;
