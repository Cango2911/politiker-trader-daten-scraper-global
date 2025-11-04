/**
 * Japan House of Representatives Scraper
 * Template - Wird später implementiert
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class JapanScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'https://www.shugiin.go.jp/';
  }

  async scrape(options = {}) {
    logger.info('Japan Scraper - Noch nicht vollständig implementiert');
    return []; // Wird später implementiert
  }
}

module.exports = JapanScraper;
