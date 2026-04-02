const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/cardapio - Cardapio publico (sem autenticacao)
router.get('/', async (req, res) => {
  try {
    const produtos = await Product.find(
      { ativo: { $ne: false } },
      'nome descricao preco categoria tags'
    ).sort({ categoria: 1, posicao: 1, nome: 1 });

    res.json(produtos);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar cardapio' });
  }
});

module.exports = router;
