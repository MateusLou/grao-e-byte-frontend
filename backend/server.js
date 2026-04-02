const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const movimentacoesRoutes = require('./routes/movimentacoes');
const logsRoutes = require('./routes/logs');
const cardapioRoutes = require('./routes/cardapio');
const vendasRoutes = require('./routes/vendas');
const metasRoutes = require('./routes/metas');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/movimentacoes', movimentacoesRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/cardapio', cardapioRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ mensagem: 'API Grao & Byte funcionando!' });
});

// Conexao com MongoDB e inicio do servidor
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Conectado ao MongoDB!');

    // Migration: garantir que o admin tenha role gerente
    const User = require('./models/User');
    await User.updateMany(
      { $or: [{ email: 'mateusgl@al.insper.edu.br' }, { email: 'mateus@gmail.com' }, { nome: 'Mateus Loureiro' }] },
      { $set: { role: 'gerente' } }
    );

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((erro) => {
    console.error('Erro ao conectar ao MongoDB:', erro.message);
  });
