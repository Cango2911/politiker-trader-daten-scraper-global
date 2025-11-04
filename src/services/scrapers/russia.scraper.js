/**
 * Russia State Duma Scraper
 * Scraped Daten von State Duma und Declarator.org
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class RussiaScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'http://duma.gov.ru/duma/deputies/';
  }

  /**
   * Scraped Daten von State Duma
   */
  async scrape(options = {}) {
    const { pages = 1 } = options;
    
    logger.info(`Starte Russland Scraping - ${pages} Seite(n)`);
    
    const allTrades = [];
    
    try {
      const url = this.baseUrl;
      await this.navigateToUrl(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Warte auf Seite zu laden
      await this.page.waitForTimeout(5000);
      
      // Extrahiere Abgeordneten-Daten
      const deputies = await this.page.evaluate(() => {
        const selectors = [
          '.deputy-item',
          '.deputy',
          'a[href*="/person/"]',
          'article',
          '.person',
          'div[class*="deputy"]'
        ];
        
        let elements = [];
        for (const selector of selectors) {
          elements = Array.from(document.querySelectorAll(selector));
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
            break;
          }
        }
        
        return elements.slice(0, 50).map((element, index) => {
          try {
            const fullText = element.textContent || '';
            
            // Name extrahieren
            let name = '';
            const nameElement = element.querySelector('h3, h2, .name, strong, a, .deputy-name');
            if (nameElement) {
              name = nameElement.textContent.trim();
            } else if (fullText.length > 0 && fullText.length < 100) {
              name = fullText.split('\n')[0].trim();
            }
            
            // Partei extrahieren
            let party = '';
            const partyPatterns = [
              'Единая Россия',
              'КПРФ',
              'ЛДПР',
              'Справедливая Россия',
              'United Russia',
              'Communist Party',
              'LDPR',
              'Fair Russia'
            ];
            
            for (const partyName of partyPatterns) {
              if (fullText.includes(partyName)) {
                party = partyName;
                break;
              }
            }
            
            return {
              politicianName: name,
              party,
              tradeType: 'Declaration',
              ticker: 'N/A',
              assetName: 'Asset Declaration',
              size: null,
              transactionDate: new Date().toISOString(),
              sourceUrl: window.location.href,
              assetType: 'other',
              chamber: 'State Duma',
              district: null,
            };
          } catch (error) {
            console.error('Fehler beim Parsen eines Duma-Mitglieds:', error);
            return null;
          }
        }).filter(item => item && item.politicianName && item.politicianName.length > 3);
      });
      
      allTrades.push(...deputies);
      logger.info(`Russland Scraping abgeschlossen. ${allTrades.length} Einträge insgesamt`);
      
    } catch (error) {
      logger.error('Fehler beim Russland Scraping:', error);
    }
    
    return allTrades.map(trade => this.normalizeTrade(trade));
  }

  /**
   * Parst russisches Datumsformat
   */
  parseDate(dateString) {
    if (!dateString) {
      return new Date();
    }
    
    try {
      // Verschiedene Formate
      const patterns = [
        /(\d{1,2})\.(\d{1,2})\.(\d{4})/,  // DD.MM.YYYY
        /(\d{4})-(\d{2})-(\d{2})/,        // YYYY-MM-DD
      ];
      
      for (const pattern of patterns) {
        const match = dateString.match(pattern);
        if (match) {
          let year, month, day;
          
          if (pattern.source.includes('\\.')) {
            // DD.MM.YYYY
            [_, day, month, year] = match;
          } else {
            // YYYY-MM-DD
            [_, year, month, day] = match;
          }
          
          const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
      
      return new Date();
    } catch (error) {
      logger.error(`Fehler beim Parsen des russischen Datums ${dateString}:`, error);
      return new Date();
    }
  }
}

module.exports = RussiaScraper;
