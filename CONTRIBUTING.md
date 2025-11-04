# 🤝 Beitragen zum Projekt

Vielen Dank für Ihr Interesse, zum Capitol Trades Global Scraper beizutragen!

## 📋 Inhaltsverzeichnis

- [Code of Conduct](#code-of-conduct)
- [Wie kann ich beitragen?](#wie-kann-ich-beitragen)
- [Entwicklungs-Setup](#entwicklungs-setup)
- [Pull Request Prozess](#pull-request-prozess)
- [Coding Standards](#coding-standards)
- [Neue Länder hinzufügen](#neue-länder-hinzufügen)

---

## Code of Conduct

Dieses Projekt folgt dem [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Wie kann ich beitragen?

### 🐛 Bugs melden

- Nutzen Sie GitHub Issues
- Beschreiben Sie das Problem detailliert
- Fügen Sie Schritte zur Reproduktion hinzu
- Geben Sie Ihre Umgebung an (OS, Node.js Version, etc.)

### 💡 Features vorschlagen

- Öffnen Sie ein Issue mit dem Label "enhancement"
- Beschreiben Sie den Use Case
- Erklären Sie, warum das Feature nützlich wäre

### 🌍 Neue Länder hinzufügen

Siehe Abschnitt [Neue Länder hinzufügen](#neue-länder-hinzufügen)

### 📝 Dokumentation verbessern

- Rechtschreibfehler korrigieren
- Unklare Stellen verbessern
- Beispiele hinzufügen
- Übersetzungen erstellen

---

## Entwicklungs-Setup

### Voraussetzungen

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Installation

```bash
# Repository forken und klonen
git clone https://github.com/IHR_USERNAME/trader-daten-politiker.git
cd trader-daten-politiker

# Abhängigkeiten installieren
npm install

# .env Datei erstellen
cp .env.example .env

# Development Server starten
npm run dev
```

### Tests ausführen

```bash
# Alle Tests
npm test

# Tests mit Coverage
npm run test:coverage

# Linting
npm run lint
```

---

## Pull Request Prozess

1. **Fork** das Repository
2. **Clone** Ihren Fork lokal
3. **Erstellen** Sie einen neuen Branch:
   ```bash
   git checkout -b feature/mein-neues-feature
   ```
4. **Machen** Sie Ihre Änderungen
5. **Testen** Sie Ihre Änderungen:
   ```bash
   npm test
   npm run lint
   ```
6. **Committen** Sie mit aussagekräftiger Message:
   ```bash
   git commit -m "feat: Füge UK Scraper Verbesserung hinzu"
   ```
7. **Pushen** Sie zu Ihrem Fork:
   ```bash
   git push origin feature/mein-neues-feature
   ```
8. **Erstellen** Sie einen Pull Request

### Commit Message Format

Wir folgen [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Neues Feature
- `fix`: Bugfix
- `docs`: Dokumentation
- `style`: Formatierung
- `refactor`: Code-Refactoring
- `test`: Tests hinzufügen/ändern
- `chore`: Build/Tools

**Beispiele:**
```
feat(scraper): Füge Deutschland Scraper hinzu
fix(api): Behebe Rate-Limiting Bug
docs(readme): Aktualisiere Installation-Anleitung
```

---

## Coding Standards

### JavaScript/Node.js

- Verwenden Sie ES6+ Syntax
- Async/Await statt Callbacks
- Aussagekräftige Variablennamen
- Kommentieren Sie komplexe Logik
- Fehlerbehandlung nicht vergessen

### Dateistruktur

```
src/
├── config/          # Konfigurationsdateien
├── controllers/     # API Controller
├── middleware/      # Express Middleware
├── models/          # Datenmodelle
├── routes/          # API Routes
├── services/        # Business Logic
│   └── scrapers/    # Länder-Scraper
└── utils/           # Hilfsfunktionen
```

### Scraper-Konventionen

1. **Erben von BaseScraper**
   ```javascript
   class MeinScraper extends BaseScraper {
     constructor(countryConfig) {
       super(countryConfig);
     }
   }
   ```

2. **Implementieren Sie `scrape()` Methode**
   ```javascript
   async scrape(options = {}) {
     // Ihre Implementierung
   }
   ```

3. **Nutzen Sie `normalizeTrade()`**
   ```javascript
   return trades.map(trade => this.normalizeTrade(trade));
   ```

---

## Neue Länder hinzufügen

### Schritt 1: Land zu Config hinzufügen

Bearbeiten Sie `src/config/countries.config.js`:

```javascript
myCountry: {
  code: 'myCountry',
  name: 'Mein Land',
  region: 'Europe',
  enabled: process.env.ENABLE_MY_COUNTRY_SCRAPER !== 'false',
  sources: [
    {
      name: 'Offizielle Quelle',
      url: 'https://...',
      type: 'web',
      description: 'Beschreibung',
    }
  ],
  scraperClass: 'MyCountryScraper',
},
```

### Schritt 2: Scraper erstellen

Erstellen Sie `src/services/scrapers/myCountry.scraper.js`:

```javascript
const BaseScraper = require('./base.scraper');
const logger = require('../../utils/logger');

class MyCountryScraper extends BaseScraper {
  constructor(countryConfig) {
    super(countryConfig);
    this.baseUrl = 'https://...';
  }

  async scrape(options = {}) {
    const { pages = 1 } = options;
    
    logger.info(`Starte Scraping für ${this.countryConfig.name}`);
    
    const allTrades = [];
    
    try {
      await this.navigateToUrl(this.baseUrl);
      await this.handleCookieConsent();
      
      // Ihre Scraping-Logik hier
      
    } catch (error) {
      logger.error(`Scraping fehlgeschlagen:`, error);
      throw error;
    }
    
    return allTrades.map(trade => this.normalizeTrade(trade));
  }
}

module.exports = MyCountryScraper;
```

### Schritt 3: Scraper registrieren

In `src/services/scraper.service.js`:

```javascript
const MyCountryScraper = require('./scrapers/myCountry.scraper');

const SCRAPER_MAP = {
  // ... andere Scraper
  MyCountryScraper,
};
```

### Schritt 4: Testen

```bash
# Server starten
npm run dev

# Scraper testen
curl -X POST http://localhost:3000/api/countries/myCountry/scrape \
  -H "Content-Type: application/json" \
  -d '{"pages": 1}'
```

### Schritt 5: Dokumentation

- Fügen Sie das Land zur README.md hinzu
- Dokumentieren Sie spezielle Anforderungen
- Fügen Sie Beispiel-Responses hinzu

---

## 📝 Dokumentation schreiben

### README.md

- Halten Sie es aktuell
- Fügen Sie Screenshots hinzu
- Beispiele für jeden Endpoint

### Code-Kommentare

```javascript
/**
 * Scraped Daten von der offiziellen Website
 * @param {Object} options - Scraping-Optionen
 * @param {number} options.pages - Anzahl der Seiten
 * @returns {Promise<Array>} - Array von normalisierten Trades
 */
async scrape(options = {}) {
  // Implementierung
}
```

---

## ✅ Checklist vor Pull Request

- [ ] Code funktioniert lokal
- [ ] Tests geschrieben und bestanden
- [ ] Linting ohne Fehler
- [ ] Dokumentation aktualisiert
- [ ] Commit Messages folgen Convention
- [ ] Branch ist aktuell mit main
- [ ] .env.example aktualisiert (falls nötig)

---

## 🆘 Hilfe bekommen

- 💬 GitHub Discussions für Fragen
- 🐛 GitHub Issues für Bugs
- 📧 Email für private Anfragen

---

## 🙏 Danke!

Jeder Beitrag, egal wie klein, wird geschätzt!

Besonderer Dank an alle [Contributors](https://github.com/IHR_USERNAME/trader-daten-politiker/graphs/contributors)!





