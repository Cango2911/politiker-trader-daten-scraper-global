/**
 * Italy Camera dei Deputati Scraper
 * Template - Wird später implementiert
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class ItalyScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'https://www.camera.it/';
  }

  async scrape(options = {}) {
    logger.info('Italy Scraper - Noch nicht vollständig implementiert');
    return []; // Wird später implementiert
  }
}

module.exports = ItalyScraper;
