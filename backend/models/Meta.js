const mongoose = require('mongoose');

const metaSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['diaria', 'semanal'], required: true },
  metrica: { type: String, enum: ['faturamento', 'pedidos'], required: true },
  valor: { type: Number, required: true },
  inicioVigencia: { type: Date, required: true },
  fimVigencia: { type: Date, required: true },
  criadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  criadoEm: { type: Date, default: Date.now }
});

metaSchema.index({ inicioVigencia: 1, fimVigencia: 1 });

module.exports = mongoose.model('Meta', metaSchema);
