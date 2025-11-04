# 🌍 Globaler Politiker-Trading-Daten Scraper & API

Ein umfassendes Node.js-basiertes System zum Scrapen von Aktiengeschäften von Politikern weltweit und Bereitstellung einer REST API.

## 🌟 Features

- 🔍 **Multi-Source Web Scraper** für Politiker-Trading-Daten aus 16 Ländern
- 🚀 **FastAPI REST API** mit umfangreichen Endpoints
- 💾 **MongoDB Datenbank** für skalierbare Datenspeicherung
- 📊 **Erweiterte Filterung** nach Land, Politiker, Ticker, Handelsgröße
- ⚡ **Caching-System** zur Performance-Optimierung
- 🛡️ **Rate Limiting** zum Schutz vor Missbrauch
- 📝 **Umfassendes Logging** mit Winston
- 🐳 **Docker-Support** für einfache Bereitstellung
- 🔄 **Hot Reloading** für Entwicklung

## 🌍 Unterstützte Länder

### 🇺🇸 Nordamerika
- **USA** - Capitol Trades ✅ **Vollständig implementiert**

### 🇪🇺 Europa (Top 5)
- **Deutschland** - Bundestag Nebeneinkünfte & Beteiligungen
- **Vereinigtes Königreich** - UK Parliament Register & TheyWorkForYou ✅ **Erweitert implementiert**
- **Frankreich** - Assemblée Nationale
- **Italien** - Camera dei Deputati
- **Spanien** - Congreso de los Diputados
- **Russland** - State Duma & Declarator.org ✅ **Erweitert implementiert**

### 🌏 Asien (Top 5)
- **China** - Öffentliche Offenlegungspflichten (soweit verfügbar)
- **Japan** - House of Representatives Disclosures
- **Indien** - Lok Sabha Assets & Liabilities
- **Südkorea** - National Assembly
- **Indonesien** - DPR RI (Dewan Perwakilan Rakyat)

### 🌍 Afrika (Top 5)
- **Nigeria** - National Assembly
- **Südafrika** - Parliament of South Africa
- **Ägypten** - House of Representatives
- **Kenia** - Parliament of Kenya
- **Ghana** - Parliament of Ghana

### 🇹🇷 Naher Osten
- **Türkei** - Türkiye Büyük Millet Meclisi (TBMM)

## 📁 Projektstruktur

```
.
├── src/
│   ├── index.js                    # Haupt-Einstiegspunkt
│   ├── config/
│   │   ├── app.config.js           # Anwendungskonfiguration
│   │   ├── database.config.js      # Datenbankkonfiguration
│   │   └── countries.config.js     # Länder- und Datenquellen-Konfiguration
│   ├── controllers/
│   │   ├── trades.controller.js    # Trade-Endpoints
│   │   ├── politicians.controller.js # Politiker-Endpoints
│   │   ├── countries.controller.js # Länder-Endpoints
│   │   └── config.controller.js    # Konfigurations-Endpoints
│   ├── middleware/
│   │   ├── cache.middleware.js     # Caching-Middleware
│   │   ├── rateLimit.middleware.js # Rate-Limiting
│   │   ├── error.middleware.js     # Fehlerbehandlung
│   │   └── requestId.middleware.js # Request-ID-Tracking
│   ├── services/
│   │   ├── scraper.service.js      # Haupt-Scraper-Service
│   │   └── scrapers/
│   │       ├── base.scraper.js     # Basis-Scraper-Klasse
│   │       ├── usa.scraper.js      # Capitol Trades (USA)
│   │       ├── germany.scraper.js  # Deutschland
│   │       ├── uk.scraper.js       # UK
│   │       ├── france.scraper.js   # Frankreich
│   │       ├── italy.scraper.js    # Italien
│   │       ├── spain.scraper.js    # Spanien
│   │       ├── china.scraper.js    # China
│   │       ├── japan.scraper.js    # Japan
│   │       ├── india.scraper.js    # Indien
│   │       ├── southKorea.scraper.js # Südkorea
│   │       ├── indonesia.scraper.js # Indonesien
│   │       ├── nigeria.scraper.js  # Nigeria
│   │       ├── southAfrica.scraper.js # Südafrika
│   │       ├── egypt.scraper.js    # Ägypten
│   │       ├── kenya.scraper.js    # Kenia
│   │       ├── ghana.scraper.js    # Ghana
│   │       └── turkey.scraper.js   # Türkei
│   ├── models/
│   │   ├── trade.model.js          # Trade-Datenmodell
│   │   └── politician.model.js     # Politiker-Datenmodell
│   ├── routes/
│   │   ├── index.js                # Haupt-Router
│   │   ├── trades.routes.js        # Trade-Routen
│   │   ├── politicians.routes.js   # Politiker-Routen
│   │   ├── countries.routes.js     # Länder-Routen
│   │   └── config.routes.js        # Config-Routen
│   └── utils/
│       ├── logger.js               # Winston-Logger
│       ├── retry.js                # Retry-Logik
│       └── validation.js           # Joi-Validierungen
├── docker/
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Installation

### Voraussetzungen

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (optional, für persistente Speicherung)
- Docker & Docker Compose (optional, für containerisierte Bereitstellung)

### Lokale Installation

1. **Repository klonen:**
```bash
git clone <repository-url>
cd "Trader Daten Politiker"
```

2. **Abhängigkeiten installieren:**
```bash
npm install
```

3. **Umgebungsvariablen konfigurieren:**
```bash
cp .env.example .env
# Passen Sie die .env-Datei nach Bedarf an
```

4. **Anwendung starten:**

**Entwicklungsmodus (mit Hot Reloading):**
```bash
npm run dev
```

**Produktionsmodus:**
```bash
npm start
```

### Docker Installation

1. **Docker Image bauen:**
```bash
npm run docker:build
```

2. **Container starten:**
```bash
npm run docker:up
```

3. **Logs anzeigen:**
```bash
npm run docker:logs
```

4. **Container stoppen:**
```bash
npm run docker:down
```

## 📡 API Endpoints

### Basis-Informationen

- `GET /` - API-Informationen und verfügbare Endpoints
- `GET /health` - Gesundheits-Check

### Trades

- `GET /api/trades` - Alle Trades mit optionaler Filterung
  - Query-Parameter:
    - `country` - Nach Land filtern (z.B. `usa`, `germany`, `turkey`)
    - `politician` - Nach Politikername filtern
    - `ticker` - Nach Ticker-Symbol filtern
    - `tradeSize` - Nach Handelsgröße filtern
    - `startDate` - Startdatum (ISO 8601)
    - `endDate` - Enddatum (ISO 8601)
    - `page` - Seitenzahl (Standard: 1)
    - `limit` - Ergebnisse pro Seite (Standard: 50)
    - `forceRefresh` - Cache umgehen (true/false)

- `GET /api/trades/:id` - Einzelnen Trade nach ID abrufen
- `GET /api/trades/size/:tradeSize` - Trades nach Handelsgröße
- `GET /api/trades/by-politician/:politicianId` - Trades eines Politikers
- `GET /api/trades/official/:officialId` - Alias für by-politician
- `GET /api/trades/by-ticker/:ticker` - Trades nach Ticker-Symbol
- `GET /api/trades/ticker/:ticker` - Alias für by-ticker

### Politiker

- `GET /api/politicians` - Alle Politiker abrufen
  - Query-Parameter:
    - `country` - Nach Land filtern
    - `page` - Seitenzahl
    - `limit` - Ergebnisse pro Seite

- `GET /api/politicians/:id` - Einzelnen Politiker abrufen
- `GET /api/politicians/:id/trades` - Alle Trades eines Politikers

### Länder

- `GET /api/countries` - Alle unterstützten Länder und Datenquellen
- `GET /api/countries/:countryCode` - Details zu einem bestimmten Land
- `GET /api/countries/:countryCode/trades` - Trades eines bestimmten Landes
- `GET /api/countries/:countryCode/politicians` - Politiker eines bestimmten Landes
- `POST /api/countries/:countryCode/scrape` - Daten für ein Land manuell scrapen

### Konfiguration

- `GET /api/config` - Aktuelle Konfiguration anzeigen
- `PUT /api/config` - Konfiguration aktualisieren
- `POST /api/config/clear-cache` - API-Cache leeren

### Statistiken

- `GET /api/stats` - Globale Statistiken
- `GET /api/stats/countries` - Statistiken nach Ländern

## 🔧 Konfiguration

Alle Konfigurationsoptionen werden über Umgebungsvariablen in der `.env`-Datei gesteuert:

### Server-Einstellungen
- `PORT` - Server-Port (Standard: 3000)
- `NODE_ENV` - Umgebung (development/production)

### Cache-Einstellungen
- `CACHE_ENABLED` - Cache aktivieren/deaktivieren (Standard: true)
- `CACHE_TTL` - Cache-Lebensdauer in Sekunden (Standard: 3600)

### Rate-Limiting
- `RATE_LIMIT_WINDOW_MS` - Zeitfenster in ms (Standard: 60000)
- `RATE_LIMIT_MAX_REQUESTS` - Max. Anfragen pro Zeitfenster (Standard: 100)

### Scraper-Einstellungen
- `ENABLE_[COUNTRY]_SCRAPER` - Scraper für bestimmte Länder aktivieren/deaktivieren
- `MAX_RETRIES` - Maximale Wiederholungsversuche (Standard: 3)
- `RETRY_DELAY_MS` - Verzögerung zwischen Versuchen in ms (Standard: 1000)

## 📊 Datenquellen

Jedes Land hat spezifische Datenquellen, die in `src/config/countries.config.js` definiert sind:

- **USA**: https://www.capitoltrades.com/trades
- **Deutschland**: Bundestagsdatenbank (soweit öffentlich zugänglich)
- **UK**: UK Parliament Register
- **Weitere**: Siehe Konfigurationsdatei für vollständige Liste

## 🛡️ Sicherheit

- ✅ Helmet.js für Security-Headers
- ✅ CORS-Konfiguration
- ✅ Rate-Limiting zum Schutz vor Missbrauch
- ✅ Input-Validierung mit Joi
- ✅ Fehlerbehandlung ohne sensible Informationen

## 📝 Logging

Die Anwendung verwendet Winston für strukturiertes Logging:

- **Error**: Fehler, die Aufmerksamkeit erfordern
- **Warn**: Warnungen
- **Info**: Allgemeine Informationen
- **Debug**: Detaillierte Debug-Informationen

Logs werden in der Konsole und in Dateien gespeichert (im `logs/`-Verzeichnis).

## 🧪 Testing

```bash
npm test
```

## 📄 Lizenz

MIT

## ⚠️ Rechtliche Hinweise

- Dieses Projekt dient ausschließlich zu Bildungs- und Forschungszwecken
- Respektieren Sie die `robots.txt` und Rate-Limits aller Quellwebsites
- Überprüfen Sie die lokalen Gesetze bezüglich Web-Scraping
- Die Verfügbarkeit von Daten variiert je nach Land und deren Offenlegungspflichten
- Verwenden Sie die Daten verantwortungsvoll

## 🤝 Beiträge

Beiträge sind willkommen! Bitte öffnen Sie ein Issue oder einen Pull Request.

## 📞 Support

Bei Fragen oder Problemen öffnen Sie bitte ein Issue im Repository.
