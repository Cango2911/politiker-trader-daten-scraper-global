/**
 * Trade-Datenmodell
 * Repräsentiert einen einzelnen Aktienhandel eines Politikers
 */
const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  // Eindeutige ID aus der Quelle
  sourceId: {
    type: String,
    required: false,
    index: true,
  },
  
  // Land des Politikers
  country: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
  },
  
  // Politiker-Informationen
  politician: {
    name: {
      type: String,
      required: true,
      index: true,
    },
    party: {
      type: String,
      required: false,
    },
    chamber: {
      type: String,
      required: false,
    },
    district: {
      type: String,
      required: false,
    },
  },
  
  // Handels-Informationen
  trade: {
    type: {
      type: String,
      required: true,
      enum: ['purchase', 'sale', 'exchange', 'other'],
      index: true,
    },
    ticker: {
      type: String,
      required: false,
      uppercase: true,
      index: true,
    },
    assetName: {
      type: String,
      required: false,
    },
    assetType: {
      type: String,
      required: false,
      enum: ['stock', 'bond', 'option', 'mutual_fund', 'cryptocurrency', 'other'],
    },
    size: {
      type: String,
      required: false,
      index: true,
    },
    sizeMin: {
      type: Number,
      required: false,
    },
    sizeMax: {
      type: Number,
      required: false,
    },
    price: {
      type: Number,
      required: false,
    },
  },
  
  // Datums-Informationen
  dates: {
    transaction: {
      type: Date,
      required: true,
      index: true,
    },
    disclosure: {
      type: Date,
      required: false,
    },
    filed: {
      type: Date,
      required: false,
    },
  },
  
  // Metadaten
  metadata: {
    source: {
      type: String,
      required: true,
    },
    sourceUrl: {
      type: String,
      required: false,
    },
    documentId: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  
  // Zeitstempel
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound-Indizes für häufige Queries
tradeSchema.index({ country: 1, 'dates.transaction': -1 });
tradeSchema.index({ 'politician.name': 1, 'dates.transaction': -1 });
tradeSchema.index({ 'trade.ticker': 1, 'dates.transaction': -1 });
tradeSchema.index({ 'trade.type': 1, country: 1 });

// Virtuelle Felder
tradeSchema.virtual('daysToDisclose').get(function() {
  if (this.dates.transaction && this.dates.disclosure) {
    const diff = this.dates.disclosure - this.dates.transaction;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Methoden
tradeSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

const Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade;

