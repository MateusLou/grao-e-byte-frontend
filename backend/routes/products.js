const express = require('express');
const Product = require('../models/Product');
const Movimentacao = require('../models/Movimentacao');
const auth = require('../middleware/auth');
const requirePermissao = require('../middleware/requirePermissao');
const { registrarLog } = require('../helpers/logHelper');

const router = express.Router();

// GET /api/products/stats - Estatisticas para dashboard
router.get('/stats', auth, async (req, res) => {
  try {
    const total = await Product.countDocuments();
    const ativos = await Product.countDocuments({ ativo: true });
    const inativos = await Product.countDocuments({ ativo: { $ne: true } });

    const porCategoria = await Product.aggregate([
      { $group: { _id: '$categoria', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ total, ativos, inativos, porCategoria });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar estatisticas' });
  }
});

// GET /api/products/tags - Todas as tags unicas
router.get('/tags', auth, async (req, res) => {
  try {
    const tags = await Product.distinct('tags');
    res.json(tags);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar tags' });
  }
});

// DELETE /api/products/tags/:tagName - Remover tag de todos os produtos
router.delete('/tags/:tagName', auth, requirePermissao('novo_produto'), async (req, res) => {
  try {
    const tag = decodeURIComponent(req.params.tagName);
    const result = await Product.updateMany(
      { tags: tag },
      { $pull: { tags: tag } }
    );
    registrarLog({ acao: 'excluir', entidade: 'tag', entidadeNome: tag, userId: req.userId, detalhes: `Removida de ${result.modifiedCount} produto(s)` });
    res.json({ mensagem: `Tag "${tag}" removida de ${result.modifiedCount} produto(s)` });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover tag' });
  }
});

// PUT /api/products/reorder - Reordenar produtos
router.put('/reorder', auth, requirePermissao('novo_produto'), async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ erro: 'Lista de items invalida' });
    }

    const ops = items.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { posicao: item.posicao } }
      }
    }));

    await Product.bulkWrite(ops);
    res.json({ mensagem: 'Ordem atualizada' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao reordenar produtos' });
  }
});

// GET /api/products - Listar todos os produtos (com estoque calculado)
router.get('/', auth, async (req, res) => {
  try {
    const produtos = await Product.find().sort({ posicao: 1, nome: 1 });

    const estoques = await Movimentacao.aggregate([
      {
        $group: {
          _id: '$produtoId',
          entradas: { $sum: { $cond: [{ $eq: ['$tipo', 'entrada'] }, '$quantidade', 0] } },
          saidas: { $sum: { $cond: [{ $eq: ['$tipo', 'saida'] }, '$quantidade', 0] } }
        }
      }
    ]);

    const vendasStats = await Movimentacao.aggregate([
      { $match: { tipo: 'saida' } },
      {
        $group: {
          _id: '$produtoId',
          totalSaidas: { $sum: '$quantidade' },
          primeiraSaida: { $min: '$data' }
        }
      }
    ]);

    const estoqueMap = {};
    estoques.forEach((e) => {
      estoqueMap[e._id.toString()] = e.entradas - e.saidas;
    });

    const vendasMap = {};
    vendasStats.forEach((v) => {
      const dias = Math.max(1, Math.ceil((Date.now() - new Date(v.primeiraSaida).getTime()) / (1000 * 60 * 60 * 24)));
      vendasMap[v._id.toString()] = Math.round((v.totalSaidas / dias) * 10) / 10;
    });

    const resultado = produtos.map((p) => ({
      ...p.toObject(),
      estoque: estoqueMap[p._id.toString()] || 0,
      vendaMediaDiaria: vendasMap[p._id.toString()] || 0
    }));

    res.json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
});

// GET /api/products/:id - Buscar produto por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const produto = await Product.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto nao encontrado' });
    }
    res.json(produto);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar produto' });
  }
});

// POST /api/products - Criar novo produto
router.post('/', auth, requirePermissao('novo_produto'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, tags } = req.body;
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return res.status(400).json({ erro: 'Nome eh obrigatorio' });
    }
    if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
      return res.status(400).json({ erro: 'Descricao eh obrigatoria' });
    }
    if (typeof preco !== 'number' || preco <= 0 || !isFinite(preco)) {
      return res.status(400).json({ erro: 'Preco deve ser um numero positivo' });
    }
    const produto = await Product.create({ nome, descricao, preco, categoria, tags: tags || [] });
    registrarLog({ acao: 'criar', entidade: 'produto', entidadeId: produto._id, entidadeNome: produto.nome, userId: req.userId, detalhes: `Categoria: ${categoria}` });
    res.status(201).json(produto);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
});

// PUT /api/products/:id - Atualizar produto
router.put('/:id', auth, requirePermissao('novo_produto'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, ativo, tags } = req.body;
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return res.status(400).json({ erro: 'Nome eh obrigatorio' });
    }
    if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
      return res.status(400).json({ erro: 'Descricao eh obrigatoria' });
    }
    if (typeof preco !== 'number' || preco <= 0 || !isFinite(preco)) {
      return res.status(400).json({ erro: 'Preco deve ser um numero positivo' });
    }
    const updateData = { nome, descricao, preco, categoria };
    if (ativo !== undefined) updateData.ativo = ativo;
    if (tags !== undefined) updateData.tags = tags;

    const produto = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!produto) {
      return res.status(404).json({ erro: 'Produto nao encontrado' });
    }
    registrarLog({ acao: 'editar', entidade: 'produto', entidadeId: produto._id, entidadeNome: produto.nome, userId: req.userId });
    res.json(produto);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
});

// PATCH /api/products/:id/toggle - Toggle ativo/inativo
router.patch('/:id/toggle', auth, requirePermissao('novo_produto'), async (req, res) => {
  try {
    const produto = await Product.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto nao encontrado' });
    }
    produto.ativo = !produto.ativo;
    await produto.save();
    registrarLog({ acao: 'toggle_ativo', entidade: 'produto', entidadeId: produto._id, entidadeNome: produto.nome, userId: req.userId, detalhes: `Status: ${produto.ativo ? 'ativo' : 'inativo'}` });
    res.json(produto);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao alterar status do produto' });
  }
});

// DELETE /api/products/:id - Soft-delete (desativa produto, preserva historico)
router.delete('/:id', auth, requirePermissao('novo_produto'), async (req, res) => {
  try {
    const produto = await Product.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto nao encontrado' });
    }
    produto.ativo = false;
    await produto.save();
    registrarLog({ acao: 'excluir', entidade: 'produto', entidadeId: produto._id, entidadeNome: produto.nome, userId: req.userId });
    res.json({ mensagem: 'Produto desativado com sucesso' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover produto' });
  }
});

module.exports = router;
