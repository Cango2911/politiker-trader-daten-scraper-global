/**
 * Turkey TBMM Scraper
 * Template - Wird später implementiert
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class TurkeyScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'https://www.tbmm.gov.tr/';
  }

  async scrape(options = {}) {
    logger.info('Turkey Scraper - Noch nicht vollständig implementiert');
    return []; // Wird später implementiert
  }
}

module.exports = TurkeyScraper;
