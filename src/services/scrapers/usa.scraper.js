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
   * Basierend auf Capitol Trades HTML-Struktur (November 2025)
   */
  async extractTradesFromPage() {
    try {
      const trades = await this.page.evaluate(() => {
        // Finde alle Table Rows (tr) die Trades enthalten
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        
        console.log(`Found ${rows.length} table rows on Capitol Trades`);
        
        return rows.map((row, index) => {
          try {
            const cells = row.querySelectorAll('td');
            if (cells.length < 9) {
              // Nicht genug Spalten für einen vollständigen Trade
              return null;
            }
            
            // ========== POLITIKER (Spalte 1) ==========
            const politicianCell = cells[0];
            const politicianNameEl = politicianCell.querySelector('.politician-name a, h2.politician-name a');
            const politicianName = politicianNameEl ? politicianNameEl.textContent.trim() : '';
            
            const politicianImgEl = politicianCell.querySelector('img');
            const politicianImageUrl = politicianImgEl ? politicianImgEl.src : '';
            
            // ========== ASSET (Spalte 2) ==========
            const assetCell = cells[1];
            const assetNameEl = assetCell.querySelector('.issuer-name a, h3.issuer-name a');
            const assetName = assetNameEl ? assetNameEl.textContent.trim() : '';
            
            const tickerEl = assetCell.querySelector('.issuer-ticker, span.q-field.issuer-ticker');
            let ticker = tickerEl ? tickerEl.textContent.trim() : '';
            // Entferne "N/A" als Ticker
            if (ticker === 'N/A') {
              ticker = '';
            }
            
            // ========== TRADED DATE (Spalte 4) ==========
            // Spalte 3 ist "Filed Date", Spalte 4 ist "Traded Date" (wir wollen Traded Date)
            const tradedDateCell = cells[3];
            let transactionDate = '';
            
            // Extrahiere Datum aus der Struktur: <div class="text-size-3 font-medium">30 Oct</div>
            const dateTextEl = tradedDateCell.querySelector('.text-size-3, div[class*="text"]');
            const yearTextEl = tradedDateCell.querySelector('.text-size-2, div[class*="text"]');
            
            if (dateTextEl && yearTextEl) {
              const dateText = dateTextEl.textContent.trim(); // "30 Oct"
              const yearText = yearTextEl.textContent.trim(); // "2025"
              transactionDate = `${dateText} ${yearText}`; // "30 Oct 2025"
            } else {
              // Fallback: gesamter Text der Zelle
              transactionDate = tradedDateCell.textContent.trim();
            }
            
            // ========== TRADE TYPE (Spalte 7) ==========
            const tradeTypeCell = cells[6];
            const tradeTypeEl = tradeTypeCell.querySelector('.tx-type');
            let tradeType = '';
            
            if (tradeTypeEl) {
              if (tradeTypeEl.classList.contains('tx-type--buy')) {
                tradeType = 'Purchase';
              } else if (tradeTypeEl.classList.contains('tx-type--sell')) {
                tradeType = 'Sale';
              } else {
                // Fallback auf Text
                const typeText = tradeTypeEl.textContent.trim().toLowerCase();
                if (typeText.includes('buy')) {
                  tradeType = 'Purchase';
                } else if (typeText.includes('sell')) {
                  tradeType = 'Sale';
                }
              }
            }
            
            // ========== SIZE (Spalte 8) ==========
            const sizeCell = cells[7];
            const sizeTextEl = sizeCell.querySelector('.trade-size span.mt-1, span[class*="text-size"]');
            let size = '';
            let sizeMin = '';
            
            if (sizeTextEl) {
              const sizeText = sizeTextEl.textContent.trim(); // "15K–50K", "1K–15K"
              
              // Parse z.B. "15K–50K" zu "$15,000 - $50,000"
              const rangeMatch = sizeText.match(/(\d+)K[–-](\d+)K/);
              if (rangeMatch) {
                const minK = parseInt(rangeMatch[1]);
                const maxK = parseInt(rangeMatch[2]);
                sizeMin = `$${minK},000`;
                size = `$${maxK},000`;
              } else {
                // Einzelwert oder anderes Format
                const singleMatch = sizeText.match(/(\d+)K/);
                if (singleMatch) {
                  const valueK = parseInt(singleMatch[1]);
                  size = `$${valueK},000`;
                  sizeMin = size;
                } else {
                  // Falls direkt ein Dollar-Betrag steht
                  size = sizeText;
                  sizeMin = sizeText;
                }
              }
            }
            
            // ========== PRICE (Spalte 9, vorletzte vor Pfeil) ==========
            const priceCell = cells[8];
            const priceText = priceCell.textContent.trim(); // "$271.40", "$109,556.00", "N/A"
            
            // Entferne "N/A" als Price
            const price = (priceText && priceText !== 'N/A') ? priceText : '';
            
            // ========== SOURCE URL ==========
            const sourceUrl = window.location.href;
            
            // Logge die ersten 3 Trades für Debugging
            if (index < 3) {
              console.log(`Trade ${index + 1}:`, {
                politicianName,
                ticker,
                assetName,
                tradeType,
                transactionDate,
                size,
                sizeMin,
                price
              });
            }
            
            return {
              politicianName,
              politicianImageUrl,
              ticker,
              assetName,
              tradeType,
              transactionDate,
              size,
              sizeMin,
              price,
              sourceUrl,
              assetType: 'stock',
            };
          } catch (error) {
            console.error(`Fehler beim Parsen von Trade-Zeile ${index}:`, error);
            return null;
          }
        }).filter(trade => {
          // Filtere nur Trades mit Politiker-Namen UND Asset-Name
          return trade && trade.politicianName && trade.assetName;
        });
      });
      
      logger.info(`✅ ${trades.length} Trades erfolgreich von Capitol Trades extrahiert`);
      return trades;
    } catch (error) {
      logger.error('❌ Fehler beim Extrahieren der Trades:', error);
      return [];
    }
  }

  /**
   * Parst verschiedene Datumsformate von Capitol Trades
   * Unterstützt: "30 Oct 2025", "Oct 30 2025", "10/30/2025"
   */
  parseDate(dateString) {
    if (!dateString) {
      logger.warn('Kein Datum gefunden, verwende aktuelles Datum als Fallback');
      return new Date();
    }
    
    try {
      // Format 1: "30 Oct 2025" oder "Oct 30 2025"
      const monthNames = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };
      
      // Versuch: "30 Oct 2025"
      let match = dateString.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
      if (match) {
        const [_, day, monthStr, year] = match;
        const month = monthNames[monthStr.toLowerCase()];
        if (month !== undefined) {
          const date = new Date(parseInt(year), month, parseInt(day));
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
      
      // Versuch: "Oct 30 2025"
      match = dateString.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
      if (match) {
        const [_, monthStr, day, year] = match;
        const month = monthNames[monthStr.toLowerCase()];
        if (month !== undefined) {
          const date = new Date(parseInt(year), month, parseInt(day));
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
      
      // Format 2: US-Format MM/DD/YYYY oder M/D/YYYY
      match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const [_, month, day, year] = match;
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Fallback auf Standard-Parsing
      const fallbackDate = super.parseDate(dateString);
      if (fallbackDate && !isNaN(fallbackDate.getTime())) {
        return fallbackDate;
      }
      
      // Letzter Fallback: aktuelles Datum
      logger.warn(`⚠️  Konnte Datum nicht parsen: ${dateString}, verwende aktuelles Datum`);
      return new Date();
    } catch (error) {
      logger.error(`❌ Fehler beim Parsen des Datums ${dateString}:`, error);
      return new Date();
    }
  }
}

module.exports = UsaScraper;

