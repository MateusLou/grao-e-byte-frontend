const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  acao: {
    type: String,
    enum: ['criar', 'editar', 'excluir', 'toggle_ativo', 'entrada', 'saida', 'registro', 'remover_funcionario', 'venda', 'cancelar_venda', 'meta'],
    required: true
  },
  entidade: {
    type: String,
    enum: ['produto', 'funcionario', 'movimentacao', 'venda', 'meta'],
    required: true
  },
  entidadeId: { type: mongoose.Schema.Types.ObjectId },
  entidadeNome: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  detalhes: { type: String },
  data: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);
