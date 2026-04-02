const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String, required: true },
  preco: { type: Number, required: true },
  categoria: { type: String, default: 'Outros' },
  ativo: { type: Boolean, default: true },
  tags: [{ type: String }],
  posicao: { type: Number, default: 0 }
});

module.exports = mongoose.model('Product', productSchema);
