/**
 * Basis-Scraper-Klasse
 * Alle länderspezifischen Scraper erben von dieser Klasse
 */
const puppeteer = require('puppeteer');
const config = require('../../config/app.config');
const logger = require('../../utils/logger');
const { retry } = require('../../utils/retry');

class BaseScraper {
  constructor(countryConfig) {
    this.countryConfig = countryConfig;
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialisiert den Browser
   */
  async initBrowser() {
    logger.info(`Initialisiere Browser für ${this.countryConfig.name}`);
    
    const launchOptions = {
      headless: config.puppeteer.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    };

    if (config.puppeteer.executablePath) {
      launchOptions.executablePath = config.puppeteer.executablePath;
    }

    this.browser = await puppeteer.launch(launchOptions);
    this.page = await this.browser.newPage();
    
    // User-Agent setzen
    await this.page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Viewport setzen
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Timeout setzen
    this.page.setDefaultTimeout(config.puppeteer.timeout);
    
    logger.info(`Browser erfolgreich initialisiert für ${this.countryConfig.name}`);
  }

  /**
   * Schließt den Browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      logger.info(`Browser geschlossen für ${this.countryConfig.name}`);
    }
  }

  /**
   * Navigiert zu einer URL mit Retry-Logik
   */
  async navigateToUrl(url, options = {}) {
    const { waitUntil = 'networkidle2', timeout = config.puppeteer.timeout } = options;
    
    return retry(async () => {
      logger.debug(`Navigiere zu ${url}`);
      await this.page.goto(url, { waitUntil, timeout });
      logger.debug(`Navigation erfolgreich zu ${url}`);
    });
  }

  /**
   * Wartet auf ein Element
   */
  async waitForSelector(selector, options = {}) {
    const { timeout = config.puppeteer.timeout } = options;
    
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      logger.warn(`Element nicht gefunden: ${selector}`);
      return false;
    }
  }

  /**
   * Behandelt Cookie-Banner und Popups
   */
  async handleCookieConsent() {
    const cookieSelectors = [
      'button[id*="accept"]',
      'button[id*="cookie"]',
      'button[class*="accept"]',
      'button[class*="cookie"]',
      '.cookie-consent-accept',
      '#cookie-accept',
      '[data-testid="cookie-accept"]',
    ];

    for (const selector of cookieSelectors) {
      try {
        const found = await this.waitForSelector(selector, { timeout: 3000 });
        if (found) {
          await this.page.click(selector);
          logger.debug('Cookie-Consent akzeptiert');
          await this.page.waitForTimeout(1000);
          return;
        }
      } catch (error) {
        // Ignoriere Fehler, versuche nächsten Selector
      }
    }
  }

  /**
   * Extrahiert Text aus einem Element
   */
  async extractText(selector) {
    try {
      const element = await this.page.$(selector);
      if (!element) return null;
      return await this.page.evaluate(el => el.textContent.trim(), element);
    } catch (error) {
      logger.debug(`Fehler beim Extrahieren von Text aus ${selector}:`, error.message);
      return null;
    }
  }

  /**
   * Extrahiert Attribut aus einem Element
   */
  async extractAttribute(selector, attribute) {
    try {
      const element = await this.page.$(selector);
      if (!element) return null;
      return await this.page.evaluate((el, attr) => el.getAttribute(attr), element, attribute);
    } catch (error) {
      logger.debug(`Fehler beim Extrahieren von ${attribute} aus ${selector}:`, error.message);
      return null;
    }
  }

  /**
   * Screenshot für Debugging
   */
  async takeScreenshot(filename) {
    try {
      await this.page.screenshot({ path: `logs/${filename}`, fullPage: true });
      logger.debug(`Screenshot gespeichert: ${filename}`);
    } catch (error) {
      logger.error('Screenshot-Fehler:', error.message);
    }
  }

  /**
   * Muss von jeder Subklasse implementiert werden
   */
  async scrape(options = {}) {
    throw new Error('scrape() muss von der Subklasse implementiert werden');
  }

  /**
   * Normalisiert Trade-Daten
   */
  normalizeTrade(rawTrade) {
    // Parse sizeMin und sizeMax
    let sizeMin = null;
    let sizeMax = null;
    
    // Verwende explizite Werte falls vorhanden
    if (rawTrade.sizeMin) {
      sizeMin = this.parseNumber(rawTrade.sizeMin);
    } else if (rawTrade.size) {
      // Fallback: Parse aus size String
      sizeMin = this.parseSizeMin(rawTrade.size);
    }
    
    if (rawTrade.sizeMax) {
      sizeMax = this.parseNumber(rawTrade.sizeMax);
    } else if (rawTrade.size) {
      // Fallback: Parse aus size String
      sizeMax = this.parseSizeMax(rawTrade.size);
    }
    
    // Parse price
    let price = null;
    if (rawTrade.price) {
      price = this.parseNumber(rawTrade.price);
    }
    
    return {
      country: this.countryConfig.code,
      politician: {
        name: rawTrade.politicianName || '',
        party: rawTrade.party || null,
        chamber: rawTrade.chamber || null,
        district: rawTrade.district || null,
        imageUrl: rawTrade.politicianImageUrl || null,
      },
      trade: {
        type: this.normalizeTradeType(rawTrade.tradeType),
        ticker: rawTrade.ticker ? rawTrade.ticker.toUpperCase() : null,
        assetName: rawTrade.assetName || null,
        assetType: this.normalizeAssetType(rawTrade.assetType),
        size: rawTrade.size || null,
        sizeMin: sizeMin,
        sizeMax: sizeMax,
        price: price,
      },
      dates: {
        transaction: this.parseDate(rawTrade.transactionDate),
        disclosure: this.parseDate(rawTrade.disclosureDate),
        filed: this.parseDate(rawTrade.filedDate),
      },
      metadata: {
        source: this.countryConfig.sources[0].name,
        sourceUrl: rawTrade.sourceUrl || null,
        documentId: rawTrade.documentId || null,
        notes: rawTrade.notes || null,
      },
    };
  }

  /**
   * Normalisiert Trade-Typ
   */
  normalizeTradeType(type) {
    if (!type) return 'other';
    const normalized = type.toLowerCase();
    if (normalized.includes('purchase') || normalized.includes('buy')) return 'purchase';
    if (normalized.includes('sale') || normalized.includes('sell')) return 'sale';
    if (normalized.includes('exchange')) return 'exchange';
    return 'other';
  }

  /**
   * Normalisiert Asset-Typ
   */
  normalizeAssetType(type) {
    if (!type) return 'other';
    const normalized = type.toLowerCase();
    if (normalized.includes('stock') || normalized.includes('equity')) return 'stock';
    if (normalized.includes('bond')) return 'bond';
    if (normalized.includes('option')) return 'option';
    if (normalized.includes('mutual') || normalized.includes('fund')) return 'mutual_fund';
    if (normalized.includes('crypto')) return 'cryptocurrency';
    return 'other';
  }

  /**
   * Parst eine Zahl aus einem String (entfernt $, Kommas, etc.)
   */
  parseNumber(value) {
    if (!value) return null;
    if (typeof value === 'number') return value;
    
    // Entferne $, Kommas und andere nicht-numerische Zeichen
    const cleaned = value.toString().replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parst Mindestgröße aus Size-String
   */
  parseSizeMin(sizeString) {
    if (!sizeString) return null;
    const match = sizeString.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (!match) return null;
    return parseFloat(match[1].replace(/,/g, ''));
  }

  /**
   * Parst Maximalgröße aus Size-String
   */
  parseSizeMax(sizeString) {
    if (!sizeString) return null;
    const matches = sizeString.match(/(\d+(?:,\d+)*(?:\.\d+)?)/g);
    if (!matches || matches.length < 2) {
      return this.parseSizeMin(sizeString) * 1.5; // Schätzung
    }
    return parseFloat(matches[1].replace(/,/g, ''));
  }

  /**
   * Parst Datum
   */
  parseDate(dateString) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }

  /**
   * Wrapper-Methode für den gesamten Scraping-Prozess
   */
  async run(options = {}) {
    try {
      await this.initBrowser();
      const data = await this.scrape(options);
      return data;
    } catch (error) {
      logger.error(`Scraping fehlgeschlagen für ${this.countryConfig.name}:`, error);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }
}

module.exports = BaseScraper;

