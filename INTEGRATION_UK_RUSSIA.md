# 🇬🇧🇷🇺 UK & Russland Integration

## Übersicht

UK und Russland wurden erfolgreich zum globalen Politiker-Trading-Daten Scraper hinzugefügt.

## 🇬🇧 United Kingdom

### Implementierungsstand: ✅ Erweitert

### Datenquellen

1. **UK Parliament Register of Members' Financial Interests** (Offiziell)
   - URL: https://www.parliament.uk/mps-lords-and-offices/standards-and-financial-interests/
   - Typ: Web-Scraping
   - Inhalt: Strukturiertes Register aller Finanzinteressen von MPs

2. **TheyWorkForYou** (Alternative)
   - URL: https://www.theyworkforyou.com/
   - Typ: API (benötigt API-Key)
   - Inhalt: Öffentliche Daten über UK MPs

### Verfügbare Daten

UK MPs müssen folgende Finanzinteressen offenlegen:

1. **Kategorie 1**: Beschäftigung und Einkünfte
2. **Kategorie 2**: Schenkungen über £300
3. **Kategorie 3**: Reisen außerhalb UK über £300
4. **Kategorie 4**: Landbesitz über £100,000
5. **Kategorie 5**: Aktien und Wertpapiere über 15% eines Unternehmens ⭐ **Relevant für Trading**
6. Weitere Kategorien für andere Interessen

### Scraper-Features

- ✅ Extraktion von MPs-Liste
- ✅ Navigation zu MP-Profilen
- ✅ Parsing von Finanzinteressen
- ✅ Filterung nach Wertpapieren und Aktien
- ✅ UK-Datumsformat (DD/MM/YYYY)
- ✅ Ticker-Extraktion aus Beschreibungen
- ✅ Partei-Informationen

### Verwendung

```bash
# UK-Daten scrapen
curl -X POST http://localhost:3000/api/countries/uk/scrape \
  -H "Content-Type: application/json" \
  -d '{"pages": 1}'

# UK-Trades abrufen
curl "http://localhost:3000/api/trades?country=uk"

# UK-Politiker abrufen
curl "http://localhost:3000/api/countries/uk/politicians"
```

### Beispiel-Response

```json
{
  "country": "uk",
  "politician": {
    "name": "John Smith MP",
    "party": "Conservative",
    "chamber": "House of Commons"
  },
  "trade": {
    "type": "other",
    "ticker": "LSEG",
    "assetName": "London Stock Exchange Group shares",
    "assetType": "stock",
    "size": "15-20%"
  },
  "dates": {
    "transaction": "2024-01-15",
    "disclosure": "2024-02-01"
  }
}
```

### Besonderheiten

- **Registrierung zeigt Besitz, nicht Transaktionen**: UK-Register zeigt hauptsächlich bestehenden Besitz
- **Prozentuale Angaben**: Oft als % des Unternehmens angegeben
- **Regelmäßige Updates**: Register wird regelmäßig aktualisiert
- **PDF-Dokumente**: Vollständige Register oft als PDF verfügbar

### Zukünftige Verbesserungen

- [ ] TheyWorkForYou API-Key Integration
- [ ] PDF-Parser für vollständige Register-Downloads
- [ ] Mapping von Firmennamen zu LSE-Ticker-Symbolen
- [ ] Historische Daten-Integration
- [ ] Lords-Register (House of Lords) integrieren

---

## 🇷🇺 Russland

### Implementierungsstand: ✅ Erweitert

### Datenquellen

1. **State Duma** (Offiziell)
   - URL: http://duma.gov.ru/
   - Typ: Web-Scraping
   - Inhalt: Offizielle Duma-Abgeordneten-Profile

2. **Declarator.org** (Unabhängig) ⭐ **Empfohlen**
   - URL: https://declarator.org/
   - Typ: Web-Scraping
   - Inhalt: Unabhängige Datenbank russischer Beamten-Deklarationen

### Verfügbare Daten

Russische Duma-Mitglieder müssen jährlich folgendes deklarieren:

1. **Einkommen** - Eigene und Familienmitglieder
2. **Immobilien** - Eigentum und Nutzungsrechte
3. **Fahrzeuge** - PKW, Yachten, etc.
4. **Wertpapiere und Aktien** ⭐ **Relevant für Trading**
5. **Bankkonten und Einlagen**
6. **Bargeld** - Über bestimmtem Schwellenwert

### Scraper-Features

- ✅ Declarator.org Integration
- ✅ Extraktion von Beamten-Liste
- ✅ Parsing von Vermögensdeklarationen
- ✅ Filterung nach Wertpapieren und Aktien
- ✅ Russisches Datumsformat (DD.MM.YYYY)
- ✅ Russische Firmennamen-Erkennung
- ✅ MOEX-Ticker-Mapping (Gazprom, Lukoil, Sberbank, etc.)
- ✅ Kyrillische Schrift-Unterstützung

### Verwendung

```bash
# Russland-Daten scrapen
curl -X POST http://localhost:3000/api/countries/russia/scrape \
  -H "Content-Type: application/json" \
  -d '{"pages": 1}'

# Russland-Trades abrufen
curl "http://localhost:3000/api/trades?country=russia"

# Russische Politiker abrufen
curl "http://localhost:3000/api/countries/russia/politicians"
```

### Beispiel-Response

```json
{
  "country": "russia",
  "politician": {
    "name": "Иван Петров",
    "party": null,
    "chamber": "State Duma"
  },
  "trade": {
    "type": "other",
    "ticker": "GAZP",
    "assetName": "ПАО «Газпром» обыкновенные акции",
    "assetType": "stock",
    "size": "1,500,000 ₽"
  },
  "dates": {
    "transaction": "2024-01-01",
    "disclosure": "2024-01-01"
  },
  "metadata": {
    "source": "Declarator",
    "notes": "Asset Type: Ценные бумаги"
  }
}
```

### Wichtige russische Unternehmen (Ticker-Mapping)

| Russischer Name | MOEX Ticker | Sektor |
|----------------|-------------|---------|
| Газпром | GAZP | Energie |
| Лукойл | LKOH | Energie |
| Сбербанк | SBER | Finanzen |
| Роснефть | ROSN | Energie |
| Норникель | GMKN | Bergbau |
| Газпромнефть | SIBN | Energie |
| ВТБ | VTBR | Finanzen |
| Яндекс | YNDX | Technologie |

### Besonderheiten

- **Deklarationen zeigen Vermögen**: Nicht aktive Trades, sondern jährliche Vermögensübersicht
- **Kyrillische Schrift**: Daten hauptsächlich auf Russisch
- **Politische Sensibilität**: Daten können politisch sensibel sein
- **MOEX**: Moskauer Börse (Moscow Exchange) für Ticker
- **Rubel-Werte**: Beträge in Rubel (₽)

### Zukünftige Verbesserungen

- [ ] Vollständige MOEX-Ticker-Datenbank
- [ ] Automatische Übersetzung (Russisch → Englisch)
- [ ] PDF-Parser für Deklarations-Dokumente
- [ ] Historische Vergleiche (Jahr-zu-Jahr)
- [ ] Federation Council (Föderationsrat) integrieren
- [ ] Währungsumrechnung (RUB → USD/EUR)

---

## 🚀 Schnellstart

### 1. Scraper aktivieren

In der `.env`-Datei:

```bash
ENABLE_UK_SCRAPER=true
ENABLE_RUSSIA_SCRAPER=true
```

### 2. Daten scrapen

```bash
# UK scrapen
npm run dev
curl -X POST http://localhost:3000/api/countries/uk/scrape \
  -H "Content-Type: application/json" \
  -d '{"pages": 1}'

# Russland scrapen
curl -X POST http://localhost:3000/api/countries/russia/scrape \
  -H "Content-Type: application/json" \
  -d '{"pages": 1}'
```

### 3. Daten abrufen

```bash
# Alle UK-Trades
curl "http://localhost:3000/api/trades?country=uk&limit=10"

# Alle Russland-Trades
curl "http://localhost:3000/api/trades?country=russia&limit=10"

# Vergleich beider Länder
curl "http://localhost:3000/api/countries"
```

---

## ⚠️ Wichtige Hinweise

### UK
- MPs müssen Änderungen innerhalb von **28 Tagen** registrieren
- Register ist **öffentlich zugänglich**
- Strenge Offenlegungspflichten seit **1975**
- TheyWorkForYou bietet **zusätzliche Tools** für Analyse

### Russland
- Deklarationen sind **jährlich** (meist April/Mai)
- Nicht alle Daten sind **vollständig öffentlich**
- Declarator.org ist **unabhängig** (nicht offiziell)
- Politische **Sensibilität** beachten
- **VPN** könnte für Zugriff notwendig sein

---

## 📊 Vergleich: UK vs Russland

| Aspekt | UK 🇬🇧 | Russland 🇷🇺 |
|--------|--------|--------------|
| **Frequenz** | Laufend aktualisiert | Jährlich |
| **Transparenz** | Sehr hoch | Mittel |
| **Datenformat** | Strukturiert (Web + PDF) | Verschiedene Quellen |
| **Sprache** | Englisch | Russisch (Kyrillisch) |
| **API-Zugang** | TheyWorkForYou | Keine offizielle API |
| **Historische Daten** | Verfügbar | Begrenzt |
| **Details** | Sehr detailliert | Weniger detailliert |
| **Transaktionen** | Besitz + einige Trades | Hauptsächlich Besitz |

---

## 🔗 Nützliche Links

### UK
- [UK Parliament Register](https://www.parliament.uk/mps-lords-and-offices/standards-and-financial-interests/)
- [TheyWorkForYou](https://www.theyworkforyou.com/)
- [London Stock Exchange](https://www.londonstockexchange.com/)

### Russland
- [State Duma](http://duma.gov.ru/)
- [Declarator.org](https://declarator.org/)
- [Moscow Exchange (MOEX)](https://www.moex.com/)
- [Central Bank of Russia](https://www.cbr.ru/)

---

## 🛠️ Technische Details

### UK Scraper

**Datei**: `src/services/scrapers/uk.scraper.js`

**Methoden**:
- `scrapeFromTheyWorkForYou()` - API-Zugriff
- `scrapeFromParliament()` - Web-Scraping
- `extractMPsList()` - MP-Liste extrahieren
- `extractMPFinancialInterests()` - Finanzinteressen extrahieren

### Russland Scraper

**Datei**: `src/services/scrapers/russia.scraper.js`

**Methoden**:
- `scrapeFromDeclarator()` - Declarator.org Scraping
- `scrapeFromDuma()` - State Duma Scraping
- `extractDeclaratorOfficials()` - Beamten-Liste
- `extractOfficialAssets()` - Vermögensdaten extrahieren

---

## 📝 Lizenz & Rechtliches

- Daten sind **öffentlich zugänglich**
- Respektieren Sie **robots.txt** und **Rate-Limits**
- Nur für **Bildungs- und Forschungszwecke**
- Beachten Sie lokale **Datenschutzgesetze**

---

**Stand**: November 2025  
**Version**: 1.0.0  
**Autor**: Capitol Trades Global Scraper Team

