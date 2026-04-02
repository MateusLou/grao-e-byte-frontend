const express = require('express');
const Log = require('../models/Log');
const auth = require('../middleware/auth');
const requireGerente = require('../middleware/requireGerente');

const router = express.Router();

// GET /api/logs - Listar logs com filtros
router.get('/', auth, requireGerente, async (req, res) => {
  try {
    const { acao, entidade, dataInicio, dataFim } = req.query;
    const filtro = {};

    if (acao) filtro.acao = acao;
    if (entidade) filtro.entidade = entidade;

    if (dataInicio || dataFim) {
      filtro.data = {};
      if (dataInicio) {
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);
        filtro.data.$gte = inicio;
      }
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        filtro.data.$lte = fim;
      }
    }

    const logs = await Log.find(filtro)
      .populate('userId', 'nome')
      .sort({ data: -1 })
      .limit(200);

    res.json(logs);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar logs' });
  }
});

module.exports = router;
