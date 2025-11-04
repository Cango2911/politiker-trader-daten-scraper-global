/**
 * USA Capitol Trades Scraper
 * Scraped Daten von https://www.capitoltrades.com/trades
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class UsaScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'https://www.capitoltrades.com/trades';
  }

  /**
   * Scraped Trades von Capitol Trades
   */
  async scrape(options = {}) {
    const { pages = 1, tradeSizes = null } = options;
    
    logger.info(`Starte USA Scraping (Capitol Trades) - ${pages} Seite(n)`);
    
    const allTrades = [];
    
    for (let page = 1; page <= pages; page++) {
      logger.info(`Scrape Seite ${page} von ${pages}`);
      
      const url = this.buildUrl(page, tradeSizes);
      await this.navigateToUrl(url);
      
      // Warte auf die Trades-Tabelle
      const tableFound = await this.waitForSelector('.q-tr', { timeout: 10000 });
      
      if (!tableFound) {
        logger.warn(`Keine Trades-Tabelle auf Seite ${page} gefunden`);
        break;
      }
      
      // Extrahiere Trades von dieser Seite
      const pageTrades = await this.extractTradesFromPage();
      allTrades.push(...pageTrades);
      
      logger.info(`${pageTrades.length} Trades von Seite ${page} extrahiert`);
      
      // Warte zwischen Seiten
      if (page < pages) {
        await this.page.waitForTimeout(2000);
      }
    }
    
    logger.info(`USA Scraping abgeschlossen. ${allTrades.length} Trades insgesamt`);
    
    return allTrades.map(trade => this.normalizeTrade(trade));
  }

  /**
   * Baut die URL für Capitol Trades
   */
  buildUrl(page, tradeSizes) {
    let url = `${this.baseUrl}?page=${page}`;
    
    if (tradeSizes) {
      url += `&txRange=${tradeSizes}`;
    }
    
    return url;
  }

  /**
   * Extrahiert Trades von der aktuellen Seite
   */
  async extractTradesFromPage() {
    try {
      const trades = await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.q-tr'));
        
        return rows.map(row => {
          try {
            // Politiker-Name
            const politicianElement = row.querySelector('.q-fieldset a.text-default');
            const politicianName = politicianElement ? politicianElement.textContent.trim() : '';
            
            // Trade-Typ (kaufen/verkaufen)
            const tradeTypeElement = row.querySelector('.q-cell.text-center');
            const tradeType = tradeTypeElement ? tradeTypeElement.textContent.trim() : '';
            
            // Ticker-Symbol
            const tickerElement = row.querySelector('a[href*="/trades/stocks/"]');
            const ticker = tickerElement ? tickerElement.textContent.trim() : '';
            
            // Asset-Name
            const assetNameElement = row.querySelector('.q-cell.text-left');
            const assetName = assetNameElement ? assetNameElement.textContent.trim() : '';
            
            // Trade-Größe
            const sizeElements = row.querySelectorAll('.q-cell');
            let size = '';
            for (let i = 0; i < sizeElements.length; i++) {
              const text = sizeElements[i].textContent.trim();
              if (text.includes('$') && (text.includes('-') || text.includes('+'))) {
                size = text;
                break;
              }
            }
            
            // Transaktionsdatum
            const dateElements = row.querySelectorAll('.q-cell');
            let transactionDate = '';
            for (let i = 0; i < dateElements.length; i++) {
              const text = dateElements[i].textContent.trim();
              if (text.match(/\d{2}\/\d{2}\/\d{4}/)) {
                transactionDate = text;
                break;
              }
            }
            
            // Source URL
            const sourceUrl = window.location.href;
            
            return {
              politicianName,
              tradeType,
              ticker,
              assetName,
              size,
              transactionDate,
              sourceUrl,
              assetType: 'stock',
            };
          } catch (error) {
            console.error('Fehler beim Parsen einer Trade-Zeile:', error);
            return null;
          }
        }).filter(trade => trade && trade.politicianName);
      });
      
      return trades;
    } catch (error) {
      logger.error('Fehler beim Extrahieren der Trades:', error);
      return [];
    }
  }

  /**
   * Parst US-Datumsformat (MM/DD/YYYY)
   */
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      // US-Format: MM/DD/YYYY
      const match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (match) {
        const [_, month, day, year] = match;
        return new Date(`${year}-${month}-${day}`);
      }
      
      // Fallback auf Standard-Parsing
      return super.parseDate(dateString);
    } catch (error) {
      return null;
    }
  }
}

module.exports = UsaScraper;

