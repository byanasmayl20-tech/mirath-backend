const mongoose = require('mongoose');

const LiquidationSchema = new mongoose.Schema({
  grossEstate: { type: Number, required: true },
  funeralExpenses: { type: Number, default: 0 },
  securedDebts: { type: Number, default: 0 },
  unsecuredDebts: { type: Number, default: 0 },
  divineDebts: { type: Number, default: 0 },
  willAmount: { type: Number, default: 0 },
  netEstate: { type: Number, required: true }
});

const InheritorResultSchema = new mongoose.Schema({
  relation: { type: String, required: true },
  count: { type: Number, default: 1 },
  status: { type: String, enum: ['ENTITLED', 'BLOCKED', 'EXCLUDED'], default: 'ENTITLED' },
  prescribedShare: { type: String },
  sharesCount: { type: Number },
  finalAmount: { type: Number, required: true }
});

const CaseSchema = new mongoose.Schema({
  deceasedGender: { type: String, enum: ['male', 'female'], required: true },
  liquidationDetails: LiquidationSchema,
  inheritors: [InheritorResultSchema],
  calculationSummary: {
    originalBase: { type: Number },
    finalBase: { type: Number },
    caseType: { type: String, default: 'NORMAL' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Case', CaseSchema);
//ملف تصميم البيانات