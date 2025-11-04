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
      await this.navigateToUrl(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Warte extra Zeit für JavaScript-Rendering
      await this.page.waitForTimeout(5000);
      
      // Versuche mehrere Selektoren
      const selectors = [
        '.q-tr',
        'tr.q-tr',
        'div[class*="trade"]',
        'table tbody tr',
        '[class*="trade-row"]'
      ];
      
      let tableFound = false;
      for (const selector of selectors) {
        tableFound = await this.waitForSelector(selector, { timeout: 5000 });
        if (tableFound) {
          logger.info(`Tabelle gefunden mit Selector: ${selector}`);
          break;
        }
      }
      
      if (!tableFound) {
        logger.warn(`Keine Trades-Tabelle auf Seite ${page} gefunden - erstelle Screenshot`);
        await this.takeScreenshot(`debug-usa-page-${page}-${Date.now()}.png`);
        
        // Logge verfügbare Klassen für Debugging
        const availableClasses = await this.page.evaluate(() => {
          const allElements = document.querySelectorAll('[class]');
          const classes = new Set();
          allElements.forEach(el => {
            el.className.split(' ').forEach(c => c && classes.add(c));
          });
          return Array.from(classes).slice(0, 50); // Erste 50 Klassen
        });
        logger.info(`Verfügbare CSS-Klassen auf der Seite: ${availableClasses.join(', ')}`);
        break;
      }
      
      // Extrahiere Trades von dieser Seite
      const pageTrades = await this.extractTradesFromPage();
      allTrades.push(...pageTrades);
      
      logger.info(`${pageTrades.length} Trades von Seite ${page} extrahiert`);
      
      // Warte zwischen Seiten
      if (page < pages) {
        await this.page.waitForTimeout(3000);
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
      // Logge zuerst die HTML-Struktur für Debugging
      const htmlStructure = await this.page.evaluate(() => {
        const container = document.querySelector('body');
        return container ? container.innerHTML.substring(0, 5000) : 'No body found';
      });
      logger.debug(`HTML Structure (first 5000 chars): ${htmlStructure}`);
      
      const trades = await this.page.evaluate(() => {
        // Versuche verschiedene Selektoren
        let rows = [];
        
        // Versuch 1: Original Quasar-Struktur
        rows = Array.from(document.querySelectorAll('.q-tr'));
        
        // Versuch 2: Moderne Trade-Divs
        if (rows.length === 0) {
          rows = Array.from(document.querySelectorAll('div[class*="trade-row"], div[class*="trade-item"]'));
        }
        
        // Versuch 3: Tabellen-Rows
        if (rows.length === 0) {
          rows = Array.from(document.querySelectorAll('table tbody tr'));
        }
        
        // Versuch 4: Jedes div mit "trade" im Klassennamen
        if (rows.length === 0) {
          rows = Array.from(document.querySelectorAll('div[class*="trade"]'));
        }
        
        console.log(`Found ${rows.length} potential trade rows`);
        
        return rows.map((row, index) => {
          try {
            // Extrahiere gesamten Text des Elements
            const fullText = row.textContent || '';
            
            // Politiker-Name - versuche verschiedene Selektoren
            let politicianName = '';
            const politicianSelectors = [
              '.q-fieldset a.text-default',
              'a[href*="/politicians/"]',
              '[class*="politician"]',
              'a.politician-name',
              '.politician',
            ];
            
            for (const selector of politicianSelectors) {
              const element = row.querySelector(selector);
              if (element && element.textContent.trim()) {
                politicianName = element.textContent.trim();
                break;
              }
            }
            
            // Trade-Typ (kaufen/verkaufen)
            let tradeType = '';
            const tradeTypeMatch = fullText.match(/\b(Purchase|Sale|Sold|Bought|Buy|Sell)\b/i);
            if (tradeTypeMatch) {
              tradeType = tradeTypeMatch[1];
            }
            
            // Ticker-Symbol
            let ticker = '';
            const tickerSelectors = [
              'a[href*="/trades/stocks/"]',
              '[class*="ticker"]',
              '.stock-ticker',
            ];
            
            for (const selector of tickerSelectors) {
              const element = row.querySelector(selector);
              if (element && element.textContent.trim()) {
                ticker = element.textContent.trim();
                break;
              }
            }
            
            // Fallback: Suche nach Ticker-Pattern (2-5 Großbuchstaben)
            if (!ticker) {
              const tickerMatch = fullText.match(/\b([A-Z]{2,5})\b/);
              if (tickerMatch) {
                ticker = tickerMatch[1];
              }
            }
            
            // Asset-Name
            let assetName = '';
            const assetSelectors = [
              '.q-cell.text-left',
              '[class*="asset"]',
              '.stock-name',
            ];
            
            for (const selector of assetSelectors) {
              const element = row.querySelector(selector);
              if (element && element.textContent.trim()) {
                assetName = element.textContent.trim();
                break;
              }
            }
            
            // Trade-Größe (Betragsbereich wie "$1,001 - $15,000")
            let size = '';
            const sizeMatch = fullText.match(/\$[\d,]+\s*-\s*\$[\d,]+/);
            if (sizeMatch) {
              size = sizeMatch[0];
            } else {
              // Einzelner Betrag
              const singleSizeMatch = fullText.match(/\$[\d,]+/);
              if (singleSizeMatch) {
                size = singleSizeMatch[0];
              }
            }
            
            // Transaktionsdatum (MM/DD/YYYY Format)
            let transactionDate = '';
            const dateMatch = fullText.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
            if (dateMatch) {
              transactionDate = dateMatch[1];
            }
            
            // Source URL
            const sourceUrl = window.location.href;
            
            // Logge für Debugging
            if (index < 3) {
              console.log(`Trade ${index}:`, {
                politicianName,
                tradeType,
                ticker,
                assetName,
                size,
                transactionDate,
                fullTextPreview: fullText.substring(0, 200)
              });
            }
            
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
        }).filter(trade => {
          // Filtere nur Trades mit mindestens einem Politiker-Namen oder Ticker
          return trade && (trade.politicianName || trade.ticker);
        });
      });
      
      logger.info(`${trades.length} Trades erfolgreich extrahiert`);
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
    if (!dateString) {
      // Wenn kein Datum vorhanden ist, verwende aktuelles Datum
      // (besser als null, um Validierungsfehler zu vermeiden)
      logger.warn('Kein Datum gefunden, verwende aktuelles Datum als Fallback');
      return new Date();
    }
    
    try {
      // US-Format: MM/DD/YYYY oder M/D/YYYY
      const match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const [_, month, day, year] = match;
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        
        // Validiere, ob das Datum gültig ist
        if (isNaN(date.getTime())) {
          logger.warn(`Ungültiges Datum: ${dateString}, verwende aktuelles Datum`);
          return new Date();
        }
        
        return date;
      }
      
      // Fallback auf Standard-Parsing
      const fallbackDate = super.parseDate(dateString);
      if (fallbackDate && !isNaN(fallbackDate.getTime())) {
        return fallbackDate;
      }
      
      // Letzter Fallback: aktuelles Datum
      logger.warn(`Konnte Datum nicht parsen: ${dateString}, verwende aktuelles Datum`);
      return new Date();
    } catch (error) {
      logger.error(`Fehler beim Parsen des Datums ${dateString}:`, error);
      return new Date();
    }
  }
}

module.exports = UsaScraper;

