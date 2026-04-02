const mongoose = require('mongoose');

const itemVendaSchema = new mongoose.Schema({
  produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  nome: { type: String, required: true },
  quantidade: { type: Number, required: true, min: 1 },
  precoUnit: { type: Number, required: true }
}, { _id: false });

const vendaSchema = new mongoose.Schema({
  itens: { type: [itemVendaSchema], required: true },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['em_andamento', 'pronto', 'finalizado', 'cancelado'],
    default: 'em_andamento'
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  criadoEm: { type: Date, default: Date.now },
  finalizadoEm: { type: Date }
});

vendaSchema.index({ criadoEm: -1 });
vendaSchema.index({ status: 1 });

module.exports = mongoose.model('Venda', vendaSchema);
