/**
 * Deutschland Bundestag Scraper
 * Scraped Daten von Bundestag Abgeordneten
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class GermanyScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'https://www.bundestag.de/abgeordnete';
  }

  /**
   * Scraped Daten von Bundestag
   */
  async scrape(options = {}) {
    const { pages = 1 } = options;
    
    logger.info(`Starte Deutschland Scraping - ${pages} Seite(n)`);
    
    const allTrades = [];
    
    try {
      const url = this.baseUrl;
      await this.navigateToUrl(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Warte auf Seite zu laden
      await this.page.waitForTimeout(5000);
      
      // Extrahiere Abgeordneten-Daten
      const abgeordnete = await this.page.evaluate(() => {
        const selectors = [
          'a[href*="/abgeordnete/"]',
          '.bt-teaser-person',
          '[class*="abgeordnete"]',
          'article',
          '.person'
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
            const nameElement = element.querySelector('h3, h2, .name, strong, a');
            if (nameElement) {
              name = nameElement.textContent.trim();
            } else if (fullText.length > 0 && fullText.length < 100) {
              // Wenn kein spezifisches Element, nehme kurzen Text
              name = fullText.split('\n')[0].trim();
            }
            
            // Partei extrahieren
            let party = '';
            const partyMatch = fullText.match(/(CDU|CSU|SPD|FDP|GRÜNE|DIE LINKE|AfD)/i);
            if (partyMatch) {
              party = partyMatch[1];
            }
            
            return {
              politicianName: name,
              party,
              tradeType: 'Disclosure',
              ticker: 'N/A',
              assetName: 'Nebentätigkeiten/Vermögensangaben',
              size: null,
              transactionDate: new Date().toISOString(),
              sourceUrl: window.location.href,
              assetType: 'other',
              chamber: 'Bundestag',
              district: null,
            };
          } catch (error) {
            console.error('Fehler beim Parsen eines Abgeordneten:', error);
            return null;
          }
        }).filter(item => item && item.politicianName && item.politicianName.length > 3);
      });
      
      allTrades.push(...abgeordnete);
      logger.info(`Deutschland Scraping abgeschlossen. ${allTrades.length} Einträge insgesamt`);
      
    } catch (error) {
      logger.error('Fehler beim Deutschland Scraping:', error);
    }
    
    return allTrades.map(trade => this.normalizeTrade(trade));
  }

  /**
   * Parst deutsches Datumsformat (DD.MM.YYYY)
   */
  parseDate(dateString) {
    if (!dateString) {
      return new Date();
    }
    
    try {
      // Deutsches Format: DD.MM.YYYY
      const match = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (match) {
        const [_, day, month, year] = match;
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        
        if (isNaN(date.getTime())) {
          logger.warn(`Ungültiges deutsches Datum: ${dateString}, verwende aktuelles Datum`);
          return new Date();
        }
        
        return date;
      }
      
      return new Date();
    } catch (error) {
      logger.error(`Fehler beim Parsen des deutschen Datums ${dateString}:`, error);
      return new Date();
    }
  }
}

module.exports = GermanyScraper;
