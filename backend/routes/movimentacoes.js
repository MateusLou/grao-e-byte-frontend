const express = require('express');
const Movimentacao = require('../models/Movimentacao');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const requireGerente = require('../middleware/requireGerente');
const { registrarLog } = require('../helpers/logHelper');

const router = express.Router();

// POST /api/movimentacoes - Registrar entrada ou saida
router.post('/', auth, async (req, res) => {
  try {
    const { produtoId, tipo, quantidade } = req.body;

    const produto = await Product.findById(produtoId);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto nao encontrado' });
    }

    if (!['entrada', 'saida'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo deve ser "entrada" ou "saida"' });
    }

    if (!quantidade || quantidade < 1) {
      return res.status(400).json({ erro: 'Quantidade deve ser pelo menos 1' });
    }

    const movimentacao = await Movimentacao.create({
      produtoId,
      tipo,
      quantidade,
      userId: req.userId
    });
    registrarLog({ acao: tipo, entidade: 'movimentacao', entidadeId: movimentacao._id, entidadeNome: produto.nome, userId: req.userId, detalhes: `${tipo} de ${quantidade} unidades` });
    res.status(201).json(movimentacao);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao registrar movimentacao' });
  }
});

// GET /api/movimentacoes - Todas as movimentacoes (painel gerente)
router.get('/', auth, requireGerente, async (req, res) => {
  try {
    const movimentacoes = await Movimentacao.find()
      .populate('produtoId', 'nome categoria')
      .populate('userId', 'nome email')
      .sort({ data: -1 })
      .limit(100);
    res.json(movimentacoes);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar movimentacoes' });
  }
});

// GET /api/movimentacoes/:produtoId - Historico de um produto
router.get('/:produtoId', auth, async (req, res) => {
  try {
    const movimentacoes = await Movimentacao.find({ produtoId: req.params.produtoId })
      .populate('userId', 'nome')
      .sort({ data: -1 });
    res.json(movimentacoes);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar movimentacoes' });
  }
});

module.exports = router;
