const Log = require('../models/Log');

async function registrarLog({ acao, entidade, entidadeId, entidadeNome, userId, detalhes }) {
  try {
    await Log.create({ acao, entidade, entidadeId, entidadeNome, userId, detalhes });
  } catch (err) {
    console.error('Erro ao registrar log:', err.message);
  }
}

module.exports = { registrarLog };
