const express = require('express');
const Meta = require('../models/Meta');
const auth = require('../middleware/auth');
const requireGerente = require('../middleware/requireGerente');

const router = express.Router();

// GET /api/metas - Listar todas as metas
router.get('/', auth, async (req, res) => {
  try {
    const metas = await Meta.find().sort({ criadoEm: -1 });
    res.json(metas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar metas' });
  }
});

// POST /api/metas - Criar meta
router.post('/', auth, requireGerente, async (req, res) => {
  try {
    const { tipo, metrica, valor, inicioVigencia, fimVigencia } = req.body;
    const meta = await Meta.create({
      tipo,
      metrica,
      valor,
      inicioVigencia,
      fimVigencia,
      criadoPor: req.userId
    });
    res.status(201).json(meta);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar meta' });
  }
});

// PUT /api/metas/:id - Atualizar meta
router.put('/:id', auth, requireGerente, async (req, res) => {
  try {
    const { tipo, metrica, valor, inicioVigencia, fimVigencia } = req.body;
    const meta = await Meta.findByIdAndUpdate(
      req.params.id,
      { tipo, metrica, valor, inicioVigencia, fimVigencia },
      { new: true }
    );
    if (!meta) {
      return res.status(404).json({ erro: 'Meta nao encontrada' });
    }
    res.json(meta);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar meta' });
  }
});

// DELETE /api/metas/:id - Remover meta
router.delete('/:id', auth, requireGerente, async (req, res) => {
  try {
    const meta = await Meta.findByIdAndDelete(req.params.id);
    if (!meta) {
      return res.status(404).json({ erro: 'Meta nao encontrada' });
    }
    res.json({ mensagem: 'Meta removida' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover meta' });
  }
});

module.exports = router;
