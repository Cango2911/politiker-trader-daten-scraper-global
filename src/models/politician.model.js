/**
 * Politiker-Datenmodell
 * Repräsentiert einen Politiker mit aggregierten Statistiken
 */
const mongoose = require('mongoose');

const politicianSchema = new mongoose.Schema({
  // Basis-Informationen
  name: {
    type: String,
    required: true,
    index: true,
  },
  
  country: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
  },
  
  // Politische Informationen
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
  
  position: {
    type: String,
    required: false,
  },
  
  // Kontakt-Informationen
  contact: {
    email: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    website: {
      type: String,
      required: false,
    },
  },
  
  // Statistiken (werden bei Abfragen berechnet)
  statistics: {
    totalTrades: {
      type: Number,
      default: 0,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    estimatedTotalValue: {
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 0,
      },
    },
    lastTradeDate: {
      type: Date,
      required: false,
    },
    averageDaysToDisclose: {
      type: Number,
      required: false,
    },
  },
  
  // Metadaten
  metadata: {
    sourceId: {
      type: String,
      required: false,
    },
    photoUrl: {
      type: String,
      required: false,
    },
    bioUrl: {
      type: String,
      required: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
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

// Compound-Indizes
politicianSchema.index({ country: 1, name: 1 }, { unique: true });
politicianSchema.index({ country: 1, party: 1 });

// Methoden
politicianSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

/**
 * Aktualisiert die Statistiken eines Politikers basierend auf seinen Trades
 */
politicianSchema.methods.updateStatistics = async function(Trade) {
  const trades = await Trade.find({ 
    'politician.name': this.name,
    country: this.country 
  });
  
  let totalValue = { min: 0, max: 0 };
  let totalDisclosureDays = 0;
  let disclosureCount = 0;
  
  this.statistics.totalTrades = trades.length;
  this.statistics.totalPurchases = trades.filter(t => t.trade.type === 'purchase').length;
  this.statistics.totalSales = trades.filter(t => t.trade.type === 'sale').length;
  
  trades.forEach(trade => {
    if (trade.trade.sizeMin) totalValue.min += trade.trade.sizeMin;
    if (trade.trade.sizeMax) totalValue.max += trade.trade.sizeMax;
    
    if (trade.dates.transaction && trade.dates.disclosure) {
      const days = (trade.dates.disclosure - trade.dates.transaction) / (1000 * 60 * 60 * 24);
      totalDisclosureDays += days;
      disclosureCount++;
    }
  });
  
  this.statistics.estimatedTotalValue = totalValue;
  
  if (disclosureCount > 0) {
    this.statistics.averageDaysToDisclose = Math.round(totalDisclosureDays / disclosureCount);
  }
  
  if (trades.length > 0) {
    this.statistics.lastTradeDate = trades.reduce((latest, trade) => {
      return trade.dates.transaction > latest ? trade.dates.transaction : latest;
    }, trades[0].dates.transaction);
  }
  
  await this.save();
};

const Politician = mongoose.model('Politician', politicianSchema);

module.exports = Politician;

