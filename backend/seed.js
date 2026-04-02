require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const Movimentacao = require('./models/Movimentacao');
const User = require('./models/User');
const Venda = require('./models/Venda');
const Meta = require('./models/Meta');

const funcionarios = [
  { nome: 'Ana Costa', email: 'ana.costa@graobyte.com', senha: 'senha123' },
  { nome: 'Pedro Santos', email: 'pedro.santos@graobyte.com', senha: 'senha123' },
  { nome: 'Julia Lima', email: 'julia.lima@graobyte.com', senha: 'senha123' }
];

const produtos = [
  {
    nome: 'Café Arábica Premium',
    descricao: 'Grãos torrados de alta qualidade, origem Minas Gerais. Pacote de 1kg.',
    preco: 48.90,
    categoria: 'Graos'
  },
  {
    nome: 'Café Robusta Forte',
    descricao: 'Grãos torrados com torra escura, sabor intenso e encorpado. Pacote de 1kg.',
    preco: 32.50,
    categoria: 'Graos'
  },
  {
    nome: 'Café Descafeinado',
    descricao: 'Grãos descafeinados por processo natural suíço. Pacote de 500g.',
    preco: 38.90,
    categoria: 'Graos'
  },
  {
    nome: 'Blend Especial da Casa',
    descricao: 'Mistura exclusiva de arábica e robusta, perfil equilibrado. Pacote de 1kg.',
    preco: 55.00,
    categoria: 'Graos'
  },
  {
    nome: 'Leite Integral',
    descricao: 'Caixa de leite UHT integral, 1 litro. Essencial para cappuccinos e lattes.',
    preco: 5.90,
    categoria: 'Insumos'
  },
  {
    nome: 'Leite de Amêndoas',
    descricao: 'Bebida vegetal de amêndoas sem açúcar, 1 litro. Opção para intolerantes.',
    preco: 12.90,
    categoria: 'Insumos'
  },
  {
    nome: 'Xarope de Caramelo',
    descricao: 'Xarope para drinks e cafés especiais. Garrafa de 750ml.',
    preco: 28.50,
    categoria: 'Insumos'
  },
  {
    nome: 'Chocolate em Pó 50%',
    descricao: 'Chocolate em pó meio amargo para mochas e chocolates quentes. Lata de 500g.',
    preco: 22.00,
    categoria: 'Insumos'
  },
  {
    nome: 'Chantilly Spray',
    descricao: 'Creme chantilly em spray para finalização de bebidas. Lata de 250g.',
    preco: 14.90,
    categoria: 'Insumos'
  },
  {
    nome: 'Pão de Queijo Congelado',
    descricao: 'Pacote com 20 unidades de pão de queijo mineiro pré-assado.',
    preco: 18.90,
    categoria: 'Alimentos'
  },
  {
    nome: 'Croissant Congelado',
    descricao: 'Pacote com 10 croissants de manteiga prontos para assar.',
    preco: 24.50,
    categoria: 'Alimentos'
  },
  {
    nome: 'Brownie Pronto',
    descricao: 'Caixa com 12 brownies de chocolate embalados individualmente.',
    preco: 36.00,
    categoria: 'Alimentos'
  },
  {
    nome: 'Copo Descartável 300ml',
    descricao: 'Pacote com 100 copos descartáveis com tampa, parede dupla.',
    preco: 42.00,
    categoria: 'Descartaveis'
  },
  {
    nome: 'Guardanapo de Papel',
    descricao: 'Pacote com 500 guardanapos de papel folha dupla.',
    preco: 15.90,
    categoria: 'Descartaveis'
  }
];

function diasAtras(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(Math.floor(Math.random() * 12) + 7, Math.floor(Math.random() * 60));
  return d;
}

async function run() {
  const acao = process.argv[2];

  if (!acao || !['seed', 'clear'].includes(acao)) {
    console.log('Uso: node seed.js [seed|clear]');
    console.log('  seed  - Popula o banco com produtos de exemplo');
    console.log('  clear - Remove todos os produtos e movimentacoes do banco');
    process.exit(0);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB.');

    if (acao === 'seed') {
      await Product.deleteMany({});
      await Movimentacao.deleteMany({});
      await Venda.deleteMany({});
      await Meta.deleteMany({});

      let gerente = await User.findOne({ email: 'mateusgl@al.insper.edu.br' });
      if (!gerente) gerente = await User.findOne();

      const userIds = [];
      if (gerente) userIds.push(gerente._id);

      for (const func of funcionarios) {
        let user = await User.findOne({ email: func.email });
        if (!user) {
          const senhaHash = await bcrypt.hash(func.senha, 10);
          user = await User.create({ nome: func.nome, email: func.email, senha: senhaHash });
        }
        userIds.push(user._id);
      }

      console.log(`${userIds.length} usuarios prontos.`);

      const produtosCriados = await Product.insertMany(produtos);
      console.log(`${produtosCriados.length} produtos inseridos.`);

      const movimentacoes = [];

      for (const produto of produtosCriados) {
        movimentacoes.push({
          produtoId: produto._id,
          userId: userIds[0],
          tipo: 'entrada',
          quantidade: 200 + Math.floor(Math.random() * 300),
          data: diasAtras(7)
        });

        for (let dia = 6; dia >= 0; dia--) {
          const numVendas = 1 + Math.floor(Math.random() * 3);
          for (let v = 0; v < numVendas; v++) {
            const funcIndex = 1 + Math.floor(Math.random() * (userIds.length - 1));
            movimentacoes.push({
              produtoId: produto._id,
              userId: userIds[funcIndex] || userIds[0],
              tipo: 'saida',
              quantidade: 1 + Math.floor(Math.random() * 8),
              data: diasAtras(dia)
            });
          }
        }

        if (Math.random() > 0.4) {
          movimentacoes.push({
            produtoId: produto._id,
            userId: userIds[0],
            tipo: 'entrada',
            quantidade: 50 + Math.floor(Math.random() * 100),
            data: diasAtras(3)
          });
        }
      }

      await Movimentacao.insertMany(movimentacoes);
      console.log(`${movimentacoes.length} movimentacoes inseridas.`);

      // Gerar vendas de exemplo nos ultimos 7 dias
      const vendas = [];
      const statusOpcoes = ['finalizado', 'finalizado', 'finalizado', 'pronto', 'em_andamento'];

      for (let dia = 6; dia >= 0; dia--) {
        const numVendasDia = 5 + Math.floor(Math.random() * 8);
        for (let v = 0; v < numVendasDia; v++) {
          const numItens = 1 + Math.floor(Math.random() * 3);
          const itens = [];
          const produtosUsados = new Set();

          for (let i = 0; i < numItens; i++) {
            let prodIdx;
            do {
              prodIdx = Math.floor(Math.random() * produtosCriados.length);
            } while (produtosUsados.has(prodIdx) && produtosUsados.size < produtosCriados.length);
            produtosUsados.add(prodIdx);

            const prod = produtosCriados[prodIdx];
            const qty = 1 + Math.floor(Math.random() * 4);
            itens.push({
              produtoId: prod._id,
              nome: prod.nome,
              quantidade: qty,
              precoUnit: prod.preco
            });
          }

          const total = itens.reduce((sum, it) => sum + it.quantidade * it.precoUnit, 0);
          const dataVenda = new Date();
          dataVenda.setDate(dataVenda.getDate() - dia);
          dataVenda.setHours(7 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

          const status = dia === 0 ? statusOpcoes[Math.floor(Math.random() * statusOpcoes.length)] : 'finalizado';
          const funcIndex = Math.floor(Math.random() * userIds.length);

          vendas.push({
            itens,
            total: Math.round(total * 100) / 100,
            status,
            userId: userIds[funcIndex],
            criadoEm: dataVenda,
            finalizadoEm: status === 'finalizado' ? new Date(dataVenda.getTime() + 10 * 60000) : undefined
          });
        }
      }

      await Venda.insertMany(vendas);
      console.log(`${vendas.length} vendas inseridas.`);

      // Criar metas de exemplo
      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);
      const fimHoje = new Date(inicioHoje);
      fimHoje.setHours(23, 59, 59, 999);

      const inicioSemana = new Date(inicioHoje);
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);

      await Meta.insertMany([
        {
          tipo: 'diaria',
          metrica: 'faturamento',
          valor: 500,
          inicioVigencia: inicioHoje,
          fimVigencia: fimHoje,
          criadoPor: userIds[0]
        },
        {
          tipo: 'semanal',
          metrica: 'pedidos',
          valor: 50,
          inicioVigencia: inicioSemana,
          fimVigencia: fimSemana,
          criadoPor: userIds[0]
        }
      ]);
      console.log('2 metas inseridas.');
    } else {
      const resProd = await Product.deleteMany({});
      const resMov = await Movimentacao.deleteMany({});
      const resVendas = await Venda.deleteMany({});
      const resMetas = await Meta.deleteMany({});
      const resFuncs = await User.deleteMany({
        email: { $in: funcionarios.map((f) => f.email) }
      });
      console.log(`${resProd.deletedCount} produtos, ${resMov.deletedCount} movimentacoes, ${resVendas.deletedCount} vendas, ${resMetas.deletedCount} metas e ${resFuncs.deletedCount} funcionarios removidos.`);
    }
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB.');
  }
}

run();
