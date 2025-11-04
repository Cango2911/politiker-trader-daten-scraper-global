# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [1.0.0] - 2025-11-04

### Hinzugefügt

- ✅ **Initial Release**
- 🌍 **18 Länder unterstützt**: USA, Deutschland, UK, Frankreich, Italien, Spanien, Russland, China, Japan, Indien, Südkorea, Indonesien, Nigeria, Südafrika, Ägypten, Kenia, Ghana, Türkei
- ✅ **3 vollständig implementierte Scraper**: USA (Capitol Trades), UK (Parliament Register), Russland (State Duma & Declarator)
- 🚀 **REST API** mit vollständiger Dokumentation
- 💾 **MongoDB-Integration** mit In-Memory-Fallback
- ⚡ **Caching-System** für verbesserte Performance
- 🛡️ **Rate-Limiting** zum Schutz vor Missbrauch
- 📝 **Winston-Logging** mit strukturiertem Logging
- 🔍 **Request-ID-Tracking** für Debugging
- 🐳 **Docker & Docker Compose** Support
- 🔄 **Hot-Reloading** für Development
- 📚 **Umfangreiche Dokumentation**

### API Endpoints

- `GET /` - API-Übersicht
- `GET /health` - Health-Check
- `GET /docs` - API-Dokumentation
- `GET /api/trades` - Alle Trades mit Filterung
- `GET /api/trades/:id` - Einzelner Trade
- `GET /api/trades/by-politician/:politicianId` - Trades eines Politikers
- `GET /api/trades/by-ticker/:ticker` - Trades nach Ticker
- `GET /api/politicians` - Alle Politiker
- `GET /api/politicians/:id` - Einzelner Politiker
- `GET /api/politicians/:id/trades` - Trades eines Politikers
- `GET /api/countries` - Alle unterstützten Länder
- `GET /api/countries/:countryCode` - Land-Details
- `GET /api/countries/:countryCode/trades` - Trades eines Landes
- `GET /api/countries/:countryCode/politicians` - Politiker eines Landes
- `POST /api/countries/:countryCode/scrape` - Daten scrapen
- `GET /api/config` - Konfiguration anzeigen
- `PUT /api/config` - Konfiguration aktualisieren
- `POST /api/config/clear-cache` - Cache leeren
- `GET /api/stats` - Statistiken

### Features

- **Modulare Scraper-Architektur**: Einfach neue Länder hinzufügen
- **Base-Scraper-Klasse**: Wiederverwendbare Logik für alle Scraper
- **Retry-Mechanismus**: Automatische Wiederholungen bei Fehlern
- **Error-Handling**: Umfassende Fehlerbehandlung
- **Validierung**: Joi-basierte Input-Validierung
- **Pagination**: Alle Listen-Endpoints unterstützen Pagination
- **Filterung**: Flexible Filterung nach Land, Politiker, Ticker, etc.
- **Sortierung**: Anpassbare Sortierung
- **Cache-Control**: Konfigurierbares Caching mit force-refresh Option

### Dokumentation

- 📖 README.md - Hauptdokumentation
- 🚀 QUICKSTART.md - Schnellstart-Anleitung
- 🇬🇧🇷🇺 INTEGRATION_UK_RUSSIA.md - UK & Russland Details
- 🚢 DEPLOYMENT.md - Deployment-Anleitung
- 🤝 CONTRIBUTING.md - Beitrags-Richtlinien
- 📄 LICENSE - MIT Lizenz

### Technische Details

- **Node.js**: >= 18.0.0
- **Express**: 4.18.2
- **Puppeteer**: 21.5.2 (für Web-Scraping)
- **Mongoose**: 8.0.3 (MongoDB ODM)
- **Winston**: 3.11.0 (Logging)
- **Joi**: 17.11.0 (Validierung)

---

## [Unreleased]

### Geplant

- [ ] Vollständige Implementierung aller Länder-Scraper
- [ ] Web-Frontend (Dashboard)
- [ ] GraphQL API
- [ ] WebSocket für Real-time Updates
- [ ] Erweiterte Statistiken und Diagramme
- [ ] Email-Benachrichtigungen bei neuen Trades
- [ ] Export-Funktionen (CSV, Excel, PDF)
- [ ] Historische Daten-Analyse
- [ ] Machine Learning für Trend-Erkennung
- [ ] Multi-Language Support
- [ ] API-Key-basierte Authentifizierung
- [ ] Webhook-Unterstützung

---

## Versionierung

- **MAJOR**: Inkompatible API-Änderungen
- **MINOR**: Neue Features (rückwärtskompatibel)
- **PATCH**: Bugfixes (rückwärtskompatibel)

---

[1.0.0]: https://github.com/IHR_USERNAME/trader-daten-politiker/releases/tag/v1.0.0
[Unreleased]: https://github.com/IHR_USERNAME/trader-daten-politiker/compare/v1.0.0...HEAD





