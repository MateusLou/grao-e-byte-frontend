const express = require('express');
const Venda = require('../models/Venda');
const Product = require('../models/Product');
const Movimentacao = require('../models/Movimentacao');
const auth = require('../middleware/auth');
const { registrarLog } = require('../helpers/logHelper');

const router = express.Router();

// POST /api/vendas - Criar nova venda
router.post('/', auth, async (req, res) => {
  try {
    const { itens } = req.body;
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: 'Itens da venda sao obrigatorios' });
    }

    const itensVenda = [];
    let total = 0;

    for (const item of itens) {
      const produto = await Product.findById(item.produtoId);
      if (!produto) {
        return res.status(404).json({ erro: `Produto ${item.produtoId} nao encontrado` });
      }
      const qty = item.quantidade || 1;

      // Validar estoque antes de permitir venda
      const entradas = await Movimentacao.aggregate([
        { $match: { produtoId: produto._id, tipo: 'entrada' } },
        { $group: { _id: null, total: { $sum: '$quantidade' } } }
      ]);
      const saidas = await Movimentacao.aggregate([
        { $match: { produtoId: produto._id, tipo: 'saida' } },
        { $group: { _id: null, total: { $sum: '$quantidade' } } }
      ]);
      const estoqueAtual = (entradas[0]?.total || 0) - (saidas[0]?.total || 0);
      if (qty > estoqueAtual) {
        return res.status(400).json({ erro: `Estoque insuficiente para "${produto.nome}". Disponivel: ${estoqueAtual}` });
      }

      const subtotal = Math.round(produto.preco * qty * 100) / 100;
      itensVenda.push({
        produtoId: produto._id,
        nome: produto.nome,
        quantidade: qty,
        precoUnit: produto.preco
      });
      total += subtotal;
    }

    const venda = await Venda.create({
      itens: itensVenda,
      total: Math.round(total * 100) / 100,
      status: 'em_andamento',
      userId: req.userId
    });

    // Criar movimentacoes de saida para cada item
    for (const item of itensVenda) {
      await Movimentacao.create({
        produtoId: item.produtoId,
        tipo: 'saida',
        quantidade: item.quantidade,
        userId: req.userId
      });
    }

    registrarLog({
      acao: 'venda',
      entidade: 'venda',
      entidadeId: venda._id,
      entidadeNome: `Venda #${venda._id.toString().slice(-6)}`,
      userId: req.userId,
      detalhes: `${itensVenda.length} itens - R$${total.toFixed(2)}`
    });

    res.status(201).json(venda);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar venda' });
  }
});

// GET /api/vendas - Listar vendas recentes
router.get('/', auth, async (req, res) => {
  try {
    const vendas = await Venda.find()
      .populate('userId', 'nome email')
      .sort({ criadoEm: -1 })
      .limit(50);
    res.json(vendas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar vendas' });
  }
});

// GET /api/vendas/:id - Detalhe de uma venda
router.get('/:id', auth, async (req, res) => {
  try {
    const venda = await Venda.findById(req.params.id).populate('userId', 'nome email');
    if (!venda) {
      return res.status(404).json({ erro: 'Venda nao encontrada' });
    }
    res.json(venda);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar venda' });
  }
});

// PATCH /api/vendas/:id/status - Atualizar status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const venda = await Venda.findById(req.params.id);
    if (!venda) {
      return res.status(404).json({ erro: 'Venda nao encontrada' });
    }

    if (venda.status === 'finalizado' || venda.status === 'cancelado') {
      return res.status(400).json({ erro: 'Venda ja finalizada ou cancelada' });
    }

    if (!['em_andamento', 'pronto', 'finalizado', 'cancelado'].includes(status)) {
      return res.status(400).json({ erro: 'Status invalido' });
    }

    // Se cancelar, criar movimentacoes de entrada compensatorias
    if (status === 'cancelado') {
      for (const item of venda.itens) {
        await Movimentacao.create({
          produtoId: item.produtoId,
          tipo: 'entrada',
          quantidade: item.quantidade,
          userId: req.userId
        });
      }
      registrarLog({
        acao: 'cancelar_venda',
        entidade: 'venda',
        entidadeId: venda._id,
        entidadeNome: `Venda #${venda._id.toString().slice(-6)}`,
        userId: req.userId,
        detalhes: `Estoque restaurado`
      });
    }

    venda.status = status;
    if (status === 'finalizado') {
      venda.finalizadoEm = new Date();
    }
    await venda.save();

    if (status === 'pronto') {
      registrarLog({
        acao: 'venda',
        entidade: 'venda',
        entidadeId: venda._id,
        entidadeNome: `Venda #${venda._id.toString().slice(-6)}`,
        userId: req.userId,
        detalhes: 'Pedido marcado como pronto'
      });
    } else if (status === 'finalizado') {
      registrarLog({
        acao: 'venda',
        entidade: 'venda',
        entidadeId: venda._id,
        entidadeNome: `Venda #${venda._id.toString().slice(-6)}`,
        userId: req.userId,
        detalhes: `Venda finalizada - R$${venda.total.toFixed(2)}`
      });
    }

    res.json(venda);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar status da venda' });
  }
});

module.exports = router;
