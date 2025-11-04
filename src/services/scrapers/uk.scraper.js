/**
 * UK Parliament Register Scraper
 * Scraped Daten von UK Parliament Register of Members' Financial Interests
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class UkScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'https://www.theyworkforyou.com/';
  }

  /**
   * Scraped Trades von UK Parliament
   */
  async scrape(options = {}) {
    const { pages = 1 } = options;
    
    logger.info(`Starte UK Scraping - ${pages} Seite(n)`);
    
    const allTrades = [];
    
    try {
      // UK verwendet ein anderes System - wir navigieren zu TheyWorkForYou
      const url = `${this.baseUrl}mps/?f=csv`;
      await this.navigateToUrl(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Warte auf Seite zu laden
      await this.page.waitForTimeout(5000);
      
      // Extrahiere MP-Daten
      const mps = await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('tr'));
        
        return rows.slice(1, 50).map((row, index) => {
          try {
            const cells = row.querySelectorAll('td');
            if (cells.length < 3) return null;
            
            const name = cells[0]?.textContent?.trim() || '';
            const party = cells[1]?.textContent?.trim() || '';
            const constituency = cells[2]?.textContent?.trim() || '';
            
            // UK hat keine automatischen Trade-Daten wie USA
            // Wir erstellen Platzhalter für das Register
            return {
              politicianName: name,
              party,
              district: constituency,
              tradeType: 'Disclosure',
              ticker: 'N/A',
              assetName: 'Financial Interest Registered',
              size: null,
              transactionDate: new Date().toISOString(),
              sourceUrl: window.location.href,
              assetType: 'other',
            };
          } catch (error) {
            console.error('Fehler beim Parsen einer UK MP-Zeile:', error);
            return null;
          }
        }).filter(mp => mp && mp.politicianName);
      });
      
      allTrades.push(...mps);
      logger.info(`UK Scraping abgeschlossen. ${allTrades.length} MP-Einträge insgesamt`);
      
    } catch (error) {
      logger.error('Fehler beim UK Scraping:', error);
    }
    
    return allTrades.map(trade => this.normalizeTrade(trade));
  }

  /**
   * Parst UK-Datumsformat (DD/MM/YYYY)
   */
  parseDate(dateString) {
    if (!dateString) {
      return new Date();
    }
    
    try {
      // UK-Format: DD/MM/YYYY
      const match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const [_, day, month, year] = match;
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        
        if (isNaN(date.getTime())) {
          logger.warn(`Ungültiges UK-Datum: ${dateString}, verwende aktuelles Datum`);
          return new Date();
        }
        
        return date;
      }
      
      return new Date();
    } catch (error) {
      logger.error(`Fehler beim Parsen des UK-Datums ${dateString}:`, error);
      return new Date();
    }
  }
}

module.exports = UkScraper;
