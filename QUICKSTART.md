# 🚀 Schnellstart-Anleitung

## Voraussetzungen

- Node.js >= 18.0.0
- npm >= 9.0.0
- (Optional) MongoDB für persistente Datenspeicherung

## Installation & Start

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Anwendung starten

**Entwicklungsmodus (mit Hot Reloading):**
```bash
npm run dev
```

**Produktionsmodus:**
```bash
npm start
```

Die API läuft nun auf: **http://localhost:3000**

## Erste Schritte

### 1. API-Status prüfen

```bash
curl http://localhost:3000/health
```

### 2. Verfügbare Länder anzeigen

```bash
curl http://localhost:3000/api/countries
```

### 3. Daten für USA scrapen

```bash
curl -X POST http://localhost:3000/api/countries/usa/scrape \
  -H "Content-Type: application/json" \
  -d '{"pages": 1}'
```

**⚠️ Wichtig:** Der erste Scrape-Vorgang kann einige Minuten dauern!

### 4. Trades anzeigen

```bash
curl http://localhost:3000/api/trades
```

### 5. Nach Land filtern

```bash
curl "http://localhost:3000/api/trades?country=usa"
```

### 6. Nach Ticker filtern

```bash
curl http://localhost:3000/api/trades/ticker/AAPL
```

## Docker-Start (Alternative)

### Mit Docker Compose

```bash
# Container bauen und starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Container stoppen
docker-compose down
```

Die API ist dann verfügbar auf: **http://localhost:3000**
MongoDB Express (DB-Admin): **http://localhost:8081**

## API-Dokumentation

Vollständige API-Dokumentation: http://localhost:3000/docs

## Wichtige Endpoints

| Endpoint | Beschreibung |
|----------|--------------|
| `GET /` | API-Übersicht |
| `GET /health` | Health-Check |
| `GET /docs` | API-Dokumentation |
| `GET /api/trades` | Alle Trades |
| `GET /api/politicians` | Alle Politiker |
| `GET /api/countries` | Alle Länder |
| `POST /api/countries/:code/scrape` | Daten scrapen |
| `GET /api/stats` | Statistiken |

## Konfiguration

Alle Einstellungen können in der `.env`-Datei angepasst werden.

Wichtige Optionen:
- `PORT` - Server-Port
- `CACHE_ENABLED` - Caching aktivieren/deaktivieren
- `MONGODB_URI` - MongoDB-Verbindungsstring (optional)
- `ENABLE_*_SCRAPER` - Einzelne Länder-Scraper aktivieren/deaktivieren

## Problembehandlung

### MongoDB nicht verfügbar
Die Anwendung funktioniert auch ohne MongoDB im In-Memory-Modus. Daten werden dann nur temporär gespeichert.

### Puppeteer-Fehler
Falls Puppeteer nicht startet:
```bash
# Auf macOS
npm rebuild puppeteer

# Docker nutzen (empfohlen)
docker-compose up
```

### Port bereits belegt
Ändern Sie den Port in der `.env`-Datei:
```
PORT=3001
```

## Weiterentwicklung

Die meisten Länder-Scraper sind derzeit Vorlagen und benötigen länderspezifische Implementierungen basierend auf den jeweiligen Datenquellen.

Vollständig/Erweitert implementiert:
- ✅ USA (Capitol Trades) - **Voll funktionsfähig**
- ✅ UK (Parliament Register & TheyWorkForYou) - **Erweitert**
- ✅ Russland (State Duma & Declarator) - **Erweitert**

Framework vorhanden für:
- 🔧 Deutschland, Frankreich, Italien, Spanien
- 🔧 China, Japan, Indien, Südkorea, Indonesien
- 🔧 Nigeria, Südafrika, Ägypten, Kenia, Ghana
- 🔧 Türkei

## Support

Bei Fragen siehe README.md oder öffnen Sie ein Issue im Repository.

