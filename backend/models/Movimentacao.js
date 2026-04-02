const mongoose = require('mongoose');

const movimentacaoSchema = new mongoose.Schema({
  produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tipo: { type: String, enum: ['entrada', 'saida'], required: true },
  quantidade: { type: Number, required: true, min: 1 },
  data: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Movimentacao', movimentacaoSchema);
