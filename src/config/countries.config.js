/**
 * Konfiguration für alle unterstützten Länder und deren Datenquellen
 */

const countries = {
  // 🇺🇸 USA
  usa: {
    code: 'usa',
    name: 'United States',
    region: 'North America',
    enabled: process.env.ENABLE_USA_SCRAPER !== 'false',
    sources: [
      {
        name: 'Capitol Trades',
        url: 'https://www.capitoltrades.com/trades',
        type: 'web',
        description: 'Stock trades by US Congress members',
      }
    ],
    scraperClass: 'UsaScraper',
  },
  
  // 🇪🇺 EUROPA TOP 5
  germany: {
    code: 'germany',
    name: 'Deutschland',
    region: 'Europe',
    enabled: process.env.ENABLE_GERMANY_SCRAPER !== 'false',
    sources: [
      {
        name: 'Bundestag Abgeordnete',
        url: 'https://www.bundestag.de/abgeordnete',
        type: 'web',
        description: 'Bundestag members financial disclosures',
      }
    ],
    scraperClass: 'GermanyScraper',
  },
  
  uk: {
    code: 'uk',
    name: 'United Kingdom',
    region: 'Europe',
    enabled: process.env.ENABLE_UK_SCRAPER !== 'false',
    sources: [
      {
        name: 'UK Parliament Register',
        url: 'https://www.parliament.uk/mps-lords-and-offices/standards-and-financial-interests/parliamentary-commissioner-for-standards/registers-of-interests/register-of-members-financial-interests/',
        type: 'web',
        description: 'UK Parliament Register of Members\' Financial Interests',
      },
      {
        name: 'TheyWorkForYou',
        url: 'https://www.theyworkforyou.com/',
        type: 'web',
        description: 'Alternative source for UK MP data',
      }
    ],
    scraperClass: 'UkScraper',
  },
  
  france: {
    code: 'france',
    name: 'France',
    region: 'Europe',
    enabled: process.env.ENABLE_FRANCE_SCRAPER !== 'false',
    sources: [
      {
        name: 'Assemblée Nationale',
        url: 'https://www2.assemblee-nationale.fr/deputies/list/alphabetical-order',
        type: 'web',
        description: 'French National Assembly member disclosures',
      }
    ],
    scraperClass: 'FranceScraper',
  },
  
  italy: {
    code: 'italy',
    name: 'Italy',
    region: 'Europe',
    enabled: process.env.ENABLE_ITALY_SCRAPER !== 'false',
    sources: [
      {
        name: 'Camera dei Deputati',
        url: 'https://www.camera.it/leg19/1',
        type: 'web',
        description: 'Italian Chamber of Deputies member disclosures',
      }
    ],
    scraperClass: 'ItalyScraper',
  },
  
  spain: {
    code: 'spain',
    name: 'Spain',
    region: 'Europe',
    enabled: process.env.ENABLE_SPAIN_SCRAPER !== 'false',
    sources: [
      {
        name: 'Congreso de los Diputados',
        url: 'https://www.congreso.es/busqueda-de-diputados',
        type: 'web',
        description: 'Spanish Congress member disclosures',
      }
    ],
    scraperClass: 'SpainScraper',
  },
  
  // 🇷🇺 RUSSLAND
  russia: {
    code: 'russia',
    name: 'Russia',
    region: 'Europe/Asia',
    enabled: process.env.ENABLE_RUSSIA_SCRAPER !== 'false',
    sources: [
      {
        name: 'State Duma',
        url: 'http://duma.gov.ru/en/',
        type: 'web',
        description: 'Russian State Duma member declarations',
      },
      {
        name: 'Declarator',
        url: 'https://declarator.org/',
        type: 'web',
        description: 'Independent database of Russian officials\' declarations',
      }
    ],
    scraperClass: 'RussiaScraper',
  },
  
  // 🌏 ASIEN TOP 5
  china: {
    code: 'china',
    name: 'China',
    region: 'Asia',
    enabled: process.env.ENABLE_CHINA_SCRAPER !== 'false',
    sources: [
      {
        name: 'NPC Disclosures',
        url: 'http://www.npc.gov.cn/',
        type: 'web',
        description: 'National People\'s Congress disclosures (limited public data)',
      }
    ],
    scraperClass: 'ChinaScraper',
  },
  
  japan: {
    code: 'japan',
    name: 'Japan',
    region: 'Asia',
    enabled: process.env.ENABLE_JAPAN_SCRAPER !== 'false',
    sources: [
      {
        name: 'House of Representatives',
        url: 'https://www.shugiin.go.jp/internet/index.nsf/html/index.htm',
        type: 'web',
        description: 'Japanese Diet member asset disclosures',
      }
    ],
    scraperClass: 'JapanScraper',
  },
  
  india: {
    code: 'india',
    name: 'India',
    region: 'Asia',
    enabled: process.env.ENABLE_INDIA_SCRAPER !== 'false',
    sources: [
      {
        name: 'Lok Sabha',
        url: 'https://loksabha.nic.in/',
        type: 'web',
        description: 'Indian Parliament member assets and liabilities',
      }
    ],
    scraperClass: 'IndiaScraper',
  },
  
  southKorea: {
    code: 'southKorea',
    name: 'South Korea',
    region: 'Asia',
    enabled: process.env.ENABLE_SOUTH_KOREA_SCRAPER !== 'false',
    sources: [
      {
        name: 'National Assembly',
        url: 'https://www.assembly.go.kr/portal/main/main.do',
        type: 'web',
        description: 'Korean National Assembly member disclosures',
      }
    ],
    scraperClass: 'SouthKoreaScraper',
  },
  
  indonesia: {
    code: 'indonesia',
    name: 'Indonesia',
    region: 'Asia',
    enabled: process.env.ENABLE_INDONESIA_SCRAPER !== 'false',
    sources: [
      {
        name: 'DPR RI',
        url: 'https://www.dpr.go.id/',
        type: 'web',
        description: 'Indonesian House of Representatives member data',
      }
    ],
    scraperClass: 'IndonesiaScraper',
  },
  
  // 🌍 AFRIKA TOP 5
  nigeria: {
    code: 'nigeria',
    name: 'Nigeria',
    region: 'Africa',
    enabled: process.env.ENABLE_NIGERIA_SCRAPER !== 'false',
    sources: [
      {
        name: 'National Assembly',
        url: 'https://nass.gov.ng/',
        type: 'web',
        description: 'Nigerian National Assembly member disclosures',
      }
    ],
    scraperClass: 'NigeriaScraper',
  },
  
  southAfrica: {
    code: 'southAfrica',
    name: 'South Africa',
    region: 'Africa',
    enabled: process.env.ENABLE_SOUTH_AFRICA_SCRAPER !== 'false',
    sources: [
      {
        name: 'Parliament of South Africa',
        url: 'https://www.parliament.gov.za/',
        type: 'web',
        description: 'South African Parliament member interests',
      }
    ],
    scraperClass: 'SouthAfricaScraper',
  },
  
  egypt: {
    code: 'egypt',
    name: 'Egypt',
    region: 'Africa',
    enabled: process.env.ENABLE_EGYPT_SCRAPER !== 'false',
    sources: [
      {
        name: 'House of Representatives',
        url: 'https://www.parliament.gov.eg/',
        type: 'web',
        description: 'Egyptian Parliament member information',
      }
    ],
    scraperClass: 'EgyptScraper',
  },
  
  kenya: {
    code: 'kenya',
    name: 'Kenya',
    region: 'Africa',
    enabled: process.env.ENABLE_KENYA_SCRAPER !== 'false',
    sources: [
      {
        name: 'Parliament of Kenya',
        url: 'http://www.parliament.go.ke/',
        type: 'web',
        description: 'Kenyan Parliament member declarations',
      }
    ],
    scraperClass: 'KenyaScraper',
  },
  
  ghana: {
    code: 'ghana',
    name: 'Ghana',
    region: 'Africa',
    enabled: process.env.ENABLE_GHANA_SCRAPER !== 'false',
    sources: [
      {
        name: 'Parliament of Ghana',
        url: 'https://www.parliament.gh/',
        type: 'web',
        description: 'Ghanaian Parliament member disclosures',
      }
    ],
    scraperClass: 'GhanaScraper',
  },
  
  // 🇹🇷 TÜRKEI
  turkey: {
    code: 'turkey',
    name: 'Türkiye',
    region: 'Middle East',
    enabled: process.env.ENABLE_TURKEY_SCRAPER !== 'false',
    sources: [
      {
        name: 'TBMM',
        url: 'https://www.tbmm.gov.tr/',
        type: 'web',
        description: 'Turkish Grand National Assembly member information',
      }
    ],
    scraperClass: 'TurkeyScraper',
  },
};

/**
 * Gibt alle aktivierten Länder zurück
 */
function getEnabledCountries() {
  return Object.entries(countries)
    .filter(([_, config]) => config.enabled)
    .reduce((acc, [key, config]) => {
      acc[key] = config;
      return acc;
    }, {});
}

/**
 * Gibt Länder nach Region zurück
 */
function getCountriesByRegion(region) {
  return Object.entries(countries)
    .filter(([_, config]) => config.region === region && config.enabled)
    .reduce((acc, [key, config]) => {
      acc[key] = config;
      return acc;
    }, {});
}

/**
 * Gibt ein Land nach Code zurück
 */
function getCountryByCode(code) {
  return countries[code] || null;
}

/**
 * Gibt alle Regionen zurück
 */
function getRegions() {
  return [...new Set(Object.values(countries).map(c => c.region))];
}

module.exports = {
  countries,
  getEnabledCountries,
  getCountriesByRegion,
  getCountryByCode,
  getRegions,
};
