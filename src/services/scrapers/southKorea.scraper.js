/**
 * South Korea National Assembly Scraper
 * Template - Wird später implementiert
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class SouthKoreaScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'https://www.assembly.go.kr/';
  }

  async scrape(options = {}) {
    logger.info('South Korea Scraper - Noch nicht vollständig implementiert');
    return []; // Wird später implementiert
  }
}

module.exports = SouthKoreaScraper;
