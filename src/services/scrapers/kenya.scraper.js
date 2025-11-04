/**
 * Kenya Parliament Scraper
 * Template - Wird später implementiert
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class KenyaScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'http://www.parliament.go.ke/';
  }

  async scrape(options = {}) {
    logger.info('Kenya Scraper - Noch nicht vollständig implementiert');
    return []; // Wird später implementiert
  }
}

module.exports = KenyaScraper;
