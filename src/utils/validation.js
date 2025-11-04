/**
 * Joi-Validierungsschemas für API-Requests
 */
const Joi = require('joi');

/**
 * Schema für Trade-Query-Parameter
 */
const tradeQuerySchema = Joi.object({
  country: Joi.string().lowercase(),
  politician: Joi.string(),
  ticker: Joi.string().uppercase(),
  tradeSize: Joi.string(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  forceRefresh: Joi.boolean().default(false),
  sortBy: Joi.string().valid('date', 'size', 'politician', 'ticker').default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

/**
 * Schema für Politiker-Query-Parameter
 */
const politicianQuerySchema = Joi.object({
  country: Joi.string().lowercase(),
  name: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

/**
 * Schema für Länder-Code-Parameter
 */
const countryCodeSchema = Joi.object({
  countryCode: Joi.string().lowercase().required(),
});

/**
 * Schema für Ticker-Parameter
 */
const tickerSchema = Joi.object({
  ticker: Joi.string().uppercase().required(),
});

/**
 * Schema für Trade-Size-Parameter
 */
const tradeSizeSchema = Joi.object({
  tradeSize: Joi.string().required(),
});

/**
 * Schema für Konfigurations-Update
 */
const configUpdateSchema = Joi.object({
  cache: Joi.object({
    enabled: Joi.boolean(),
    ttl: Joi.number().integer().min(60),
  }),
  scraper: Joi.object({
    maxRetries: Joi.number().integer().min(0).max(10),
    retryDelayMs: Joi.number().integer().min(100),
  }),
  rateLimit: Joi.object({
    windowMs: Joi.number().integer().min(1000),
    maxRequests: Joi.number().integer().min(1),
  }),
});

/**
 * Schema für Scrape-Request
 */
const scrapeRequestSchema = Joi.object({
  pages: Joi.number().integer().min(1).max(10).default(1),
  forceRefresh: Joi.boolean().default(false),
});

/**
 * Validiert Request-Daten gegen ein Schema
 * @param {Object} data - Zu validierende Daten
 * @param {Joi.Schema} schema - Joi-Schema
 * @returns {Object} - Validierte Daten
 * @throws {Error} - Validierungsfehler
 */
function validate(data, schema) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Validierungsfehler: ${errorMessage}`);
  }

  return value;
}

module.exports = {
  tradeQuerySchema,
  politicianQuerySchema,
  countryCodeSchema,
  tickerSchema,
  tradeSizeSchema,
  configUpdateSchema,
  scrapeRequestSchema,
  validate,
};

