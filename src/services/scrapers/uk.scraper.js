/**
 * UK Scraper
 * Scraped Daten vom UK Parliament Register of Members' Financial Interests
 * und von TheyWorkForYou als Alternative
 */
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');
const axios = require('axios');
const cheerio = require('cheerio');

class UkScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.parliamentUrl = 'https://www.parliament.uk/mps-lords-and-offices/standards-and-financial-interests/parliamentary-commissioner-for-standards/registers-of-interests/register-of-members-financial-interests/';
    this.theyWorkForYouApi = 'https://www.theyworkforyou.com/api';
  }

  /**
   * Scraped Finanzinteressen von UK MPs
   */
  async scrape(options = {}) {
    const { pages = 1 } = options;
    
    logger.info(`Starte UK Scraping (Parliament Register) - ${pages} Seite(n)`);
    
    const allTrades = [];
    
    try {
      // Versuche zuerst TheyWorkForYou API (einfacher Zugang)
      const trades = await this.scrapeFromTheyWorkForYou();
      allTrades.push(...trades);
      
      // Falls das nicht funktioniert, versuche Parliament Website
      if (allTrades.length === 0) {
        logger.info('TheyWorkForYou lieferte keine Daten, versuche Parliament Website');
        const parliamentTrades = await this.scrapeFromParliament();
        allTrades.push(...parliamentTrades);
      }
      
      logger.info(`UK Scraping abgeschlossen. ${allTrades.length} Einträge gefunden`);
      
    } catch (error) {
      logger.error('UK Scraping fehlgeschlagen:', error);
      throw error;
    }
    
    return allTrades.map(trade => this.normalizeTrade(trade));
  }

  /**
   * Scraped von TheyWorkForYou (öffentliche Daten über UK MPs)
   */
  async scrapeFromTheyWorkForYou() {
    logger.info('Versuche Daten von TheyWorkForYou zu laden');
    
    try {
      // TheyWorkForYou hat eine API für MP-Daten
      // Für vollständigen Zugriff benötigt man einen API-Key
      // Dies ist eine Beispiel-Implementierung
      
      const trades = [];
      
      // Beispiel: Lade MP-Liste
      // const response = await axios.get(`${this.theyWorkForYouApi}/getMPs`, {
      //   params: { output: 'js' }
      // });
      
      logger.warn('TheyWorkForYou API benötigt API-Key für vollständigen Zugriff');
      
      return trades;
    } catch (error) {
      logger.error('Fehler beim Abrufen von TheyWorkForYou:', error.message);
      return [];
    }
  }

  /**
   * Scraped direkt von Parliament Website
   */
  async scrapeFromParliament() {
    logger.info('Versuche Daten von Parliament Website zu scrapen');
    
    const trades = [];
    
    try {
      await this.navigateToUrl(this.parliamentUrl);
      await this.handleCookieConsent();
      
      // UK Parliament hat ein strukturiertes Register
      // Kategorien:
      // 1. Beschäftigung und Einkünfte
      // 2. Schenkungen, Vorteile und Hospitality
      // 3. Reisen außerhalb UK
      // 4. Landbesitz
      // 5. Aktien und Wertpapiere
      // Etc.
      
      // Extrahiere MPs-Liste
      const mps = await this.extractMPsList();
      
      logger.info(`${mps.length} MPs gefunden`);
      
      // Für jeden MP, extrahiere Finanzinteressen
      for (const mp of mps.slice(0, 10)) { // Limit für Demo
        const mpTrades = await this.extractMPFinancialInterests(mp);
        trades.push(...mpTrades);
        
        // Rate-Limiting
        await this.page.waitForTimeout(1000);
      }
      
      logger.info(`${trades.length} Finanzeinträge von Parliament Website extrahiert`);
      
    } catch (error) {
      logger.error('Fehler beim Scrapen von Parliament Website:', error);
    }
    
    return trades;
  }

  /**
   * Extrahiert Liste der MPs
   */
  async extractMPsList() {
    try {
      // Die tatsächlichen Selektoren müssen an die echte Seitenstruktur angepasst werden
      const mps = await this.page.evaluate(() => {
        const mpElements = Array.from(document.querySelectorAll('.mp-item, .member-item, a[href*="/biographies/"]') || []);
        
        return mpElements.map(el => {
          const name = el.textContent.trim();
          const link = el.href || el.querySelector('a')?.href || '';
          
          return {
            name,
            link,
          };
        }).filter(mp => mp.name && mp.name.length > 2);
      });
      
      // Deduplizierung
      const uniqueMPs = [...new Map(mps.map(mp => [mp.name, mp])).values()];
      
      return uniqueMPs;
    } catch (error) {
      logger.error('Fehler beim Extrahieren der MPs-Liste:', error);
      return [];
    }
  }

  /**
   * Extrahiert Finanzinteressen eines MPs
   */
  async extractMPFinancialInterests(mp) {
    const trades = [];
    
    try {
      if (!mp.link) {
        return trades;
      }
      
      logger.debug(`Extrahiere Finanzinteressen für ${mp.name}`);
      
      // Navigiere zu MP-Profil
      await this.navigateToUrl(mp.link);
      await this.page.waitForTimeout(1000);
      
      // Extrahiere Finanzeinträge
      const interests = await this.page.evaluate(() => {
        // Diese Selektoren sind Beispiele und müssen angepasst werden
        const interestElements = Array.from(document.querySelectorAll('.financial-interest, .register-entry') || []);
        
        return interestElements.map(el => {
          const category = el.querySelector('.category')?.textContent.trim() || '';
          const description = el.querySelector('.description')?.textContent.trim() || '';
          const date = el.querySelector('.date')?.textContent.trim() || '';
          const value = el.querySelector('.value')?.textContent.trim() || '';
          
          return {
            category,
            description,
            date,
            value,
          };
        });
      });
      
      // Konvertiere Interessen zu Trade-Format
      for (const interest of interests) {
        // Nur Aktien und Wertpapiere (Kategorie 5) sind relevant für Trading
        if (interest.category.includes('share') || 
            interest.category.includes('stock') ||
            interest.category.includes('securities')) {
          
          trades.push({
            politicianName: mp.name,
            party: null, // Könnte vom Profil extrahiert werden
            chamber: 'House of Commons',
            tradeType: this.determineTradeType(interest.description),
            ticker: this.extractTicker(interest.description),
            assetName: interest.description,
            assetType: 'stock',
            size: interest.value,
            transactionDate: interest.date,
            disclosureDate: interest.date,
            sourceUrl: mp.link,
            notes: `Category: ${interest.category}`,
          });
        }
      }
      
    } catch (error) {
      logger.debug(`Fehler beim Extrahieren für ${mp.name}:`, error.message);
    }
    
    return trades;
  }

  /**
   * Bestimmt Trade-Typ aus Beschreibung
   */
  determineTradeType(description) {
    const lower = description.toLowerCase();
    if (lower.includes('acquired') || lower.includes('purchased') || lower.includes('bought')) {
      return 'purchase';
    }
    if (lower.includes('sold') || lower.includes('disposed')) {
      return 'sale';
    }
    return 'other';
  }

  /**
   * Versucht Ticker-Symbol aus Beschreibung zu extrahieren
   */
  extractTicker(description) {
    // Suche nach Firmennamen oder Ticker in Klammern
    const tickerMatch = description.match(/\(([A-Z]{2,5})\)/);
    if (tickerMatch) {
      return tickerMatch[1];
    }
    
    // Alternativ: Extrahiere Firmennamen
    const companyMatch = description.match(/^([A-Z][A-Za-z\s&]+?)(?:\s+\(|,|$)/);
    if (companyMatch) {
      return companyMatch[1].trim();
    }
    
    return null;
  }

  /**
   * Parst UK-Datumsformat (DD/MM/YYYY)
   */
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      // UK-Format: DD/MM/YYYY oder DD Month YYYY
      const dmyMatch = dateString.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
      if (dmyMatch) {
        const [_, day, month, year] = dmyMatch;
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      }
      
      // Format: 12 January 2024
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                          'july', 'august', 'september', 'october', 'november', 'december'];
      const textDateMatch = dateString.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
      if (textDateMatch) {
        const [_, day, monthName, year] = textDateMatch;
        const monthIndex = monthNames.findIndex(m => m.startsWith(monthName.toLowerCase()));
        if (monthIndex >= 0) {
          return new Date(`${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      }
      
      // Fallback
      return super.parseDate(dateString);
    } catch (error) {
      return null;
    }
  }

  /**
   * HINWEISE für vollständige Implementierung:
   * 
   * UK MPs müssen ihre Finanzinteressen im Register offenlegen:
   * - Beschäftigung und Einkünfte
   * - Schenkungen über £300
   * - Reisen außerhalb UK über £300
   * - Landbesitz über £100,000
   * - Aktien und Wertpapiere über 15% eines Unternehmens
   * 
   * Datenquellen:
   * 1. Parliament Website (offiziell, strukturiert)
   * 2. TheyWorkForYou (API verfügbar mit Key)
   * 3. MPs' Register of Financial Interests (PDF-Downloads)
   * 
   * Für vollständige Implementierung:
   * - TheyWorkForYou API-Key beantragen
   * - PDF-Parser für Register-Downloads
   * - Mapping von Firmennamen zu Ticker-Symbolen
   * - Partei-Informationen extrahieren
   */
}

module.exports = UkScraper;
