# Grao & Byte

Sistema completo de gestao de estoque e vendas para negocios do ramo alimenticio, desenvolvido para o **Hackathon Insper Jr 2026**.

## Sobre o Projeto

O Grao & Byte e uma aplicacao web full-stack que cobre todo o ciclo operacional de uma cafeteria ou negocio alimenticio: controle de estoque, ponto de venda (PDV), dashboard gerencial com KPIs em tempo real, gestao de equipe, metas de vendas e auditoria completa de acoes. O sistema possui um cardapio publico acessivel por QR Code para clientes.

## Funcionalidades

### Para Todos os Usuarios
- Login com autenticacao JWT
- Catalogo de produtos com filtros por categoria, busca e tags
- Ponto de venda (PDV) com carrinho e controle de estoque em tempo real
- Gestao de pedidos ativos (em andamento, pronto, finalizado, cancelado)
- Historico de vendas

### Para Gerentes
- **Dashboard** com KPIs: faturamento (hoje vs ontem vs semana passada), ticket medio, pedidos, estoque critico, top 5 vendidos, grafico de vendas por hora, ultimas vendas
- **Metas de vendas** diarias e semanais (faturamento e quantidade de pedidos) com CRUD inline e barras de progresso
- **Gestao de produtos**: criar, editar, ativar/desativar, reordenar via drag-and-drop, deletar tags globalmente
- **Alertas de estoque critico** (estoque <= media diaria de saidas)
- **Movimentacoes**: historico completo de entradas e saidas com filtros
- **Gestao de equipe**: cadastro de funcionarios com controle de permissoes por aba
- **Exportacao** de dados em CSV e PDF
- **QR Code** do cardapio publico gerado automaticamente
- **Auditoria completa**: log de todas as acoes do sistema

### Cardapio Publico
- Acessivel sem login via URL ou QR Code
- Exibe apenas produtos ativos com estoque disponivel
- Agrupado por categoria com tags coloridas

## Tecnologias

### Backend
| Tecnologia | Versao | Funcao |
|-----------|--------|--------|
| Node.js | 18+ | Runtime JavaScript |
| Express | 4.21 | Framework HTTP e rotas REST |
| MongoDB Atlas | 7.0 | Banco de dados NoSQL na nuvem |
| Mongoose | 8.8 | ODM para modelagem de dados |
| JWT | 9.0 | Autenticacao stateless via tokens |
| bcryptjs | 2.4 | Hash seguro de senhas |

### Frontend
| Tecnologia | Versao | Funcao |
|-----------|--------|--------|
| React | 18.3 | Biblioteca de UI com hooks |
| React Router | 6.27 | Navegacao SPA e rotas protegidas |
| Vite | 5.4 | Build tool com HMR e proxy de desenvolvimento |
| CSS puro | - | Estilizacao responsiva sem frameworks |

## Arquitetura

```
grao-e-byte/
  backend/
    server.js                # Entrada, conexao MongoDB, middlewares
    models/                  # Schemas Mongoose
      User.js                #   Usuarios (nome, email, senha, role, permissoes)
      Product.js             #   Produtos (nome, descricao, preco, categoria, tags)
      Venda.js               #   Vendas (itens, total, status, timestamps)
      Movimentacao.js        #   Movimentacoes de estoque (entrada/saida)
      Meta.js                #   Metas de vendas (diaria/semanal)
      Log.js                 #   Auditoria (acao, entidade, usuario, data)
    routes/                  # Endpoints da API
      auth.js                #   Registro, login, gestao de funcionarios
      products.js            #   CRUD produtos, tags, reordenacao
      vendas.js              #   Criar vendas, listar, atualizar status
      movimentacoes.js       #   Registrar e consultar movimentacoes
      dashboard.js           #   Agregacoes para KPIs e metricas
      metas.js               #   CRUD de metas de vendas
      logs.js                #   Consulta de historico de auditoria
      cardapio.js            #   Endpoint publico (sem autenticacao)
    middleware/              # Middlewares de seguranca
      auth.js                #   Verificacao de JWT
      requireGerente.js      #   Bloqueio por role
      requirePermissao.js    #   Controle granular de permissoes
    helpers/
      logHelper.js           #   Funcao centralizada de registro de auditoria
    seed.js                  # Dados de exemplo para desenvolvimento
  frontend/
    src/
      main.jsx               # Entrada React (Router + ToastProvider)
      App.jsx                # Definicao de rotas
      App.css                # Estilos globais responsivos
      pages/                 # Paginas da aplicacao
        Login.jsx            #   Tela de login
        Dashboard.jsx        #   Dashboard gerencial com 7 sub-componentes
        Products.jsx         #   Catalogo com filtros, ordenacao, exportacao
        ProductForm.jsx      #   Formulario de criar/editar produto
        Vendas.jsx           #   PDV com carrinho, pedidos ativos, historico
        Movimentacoes.jsx    #   Historico de movimentacoes (gerente)
        AlertasEstoque.jsx   #   Produtos com estoque critico
        Funcionarios.jsx     #   Gestao de equipe (gerente)
        Cardapio.jsx         #   Cardapio publico (sem login)
      components/            # Componentes reutilizaveis
        Layout.jsx           #   Sidebar + conteudo + hamburger mobile
        ProductCard.jsx      #   Card de produto
        Toast.jsx            #   Notificacoes via Context API
        ConfirmModal.jsx     #   Modal de confirmacao
        LoadingSpinner.jsx   #   Indicador de carregamento
        dashboard/           #   Sub-componentes do Dashboard
      helpers/               # Utilitarios
        validacao.js         #   Validacao de formularios
        permissoes.js        #   Controle de acesso no frontend
        exportUtils.js       #   Exportacao CSV e PDF
```

## Como Rodar

### Pre-requisitos
- Node.js 18+
- Conta no MongoDB Atlas (ou MongoDB local)

### 1. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Criar arquivo .env (veja secao Variaveis de Ambiente)

# Popular banco com dados de exemplo (opcional)
npm run seed

# Iniciar em desenvolvimento (com hot-reload)
npm run dev

# OU iniciar em producao
npm start
```

O backend inicia na porta `3001`.

### 2. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar em desenvolvimento (com HMR)
npm run dev

# OU build para producao
npm run build
```

O frontend inicia em `http://localhost:5173` e redireciona chamadas `/api` para o backend automaticamente.

## Variaveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/grao-e-byte
JWT_SECRET=sua_chave_secreta_segura
PORT=3001
```

Variaveis opcionais para producao:

```env
NODE_ENV=production
ADMIN_EMAIL=email_do_gerente@exemplo.com
FRONTEND_URL=https://seu-app.onrender.com
```

## Rotas da API

### Autenticacao (`/api/auth`)
| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/login` | - | Login (retorna JWT + dados) |
| POST | `/registro` | Gerente | Registrar funcionario |
| GET | `/funcionarios` | Gerente | Listar funcionarios |
| DELETE | `/funcionarios/:id` | Gerente | Remover funcionario |
| PUT | `/funcionarios/:id/permissoes` | Gerente | Atualizar permissoes |

### Produtos (`/api/products`)
| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/` | JWT | Listar produtos com estoque calculado |
| GET | `/stats` | JWT | Estatisticas por categoria |
| GET | `/tags` | JWT | Tags unicas |
| DELETE | `/tags/:tagName` | Gerente | Remover tag de todos os produtos |
| POST | `/` | Gerente | Criar produto |
| PUT | `/:id` | Gerente | Atualizar produto |
| PATCH | `/:id/toggle` | Gerente | Ativar/desativar |
| DELETE | `/:id` | Gerente | Excluir produto |
| PUT | `/reorder` | Gerente | Reordenar (drag-and-drop) |

### Vendas (`/api/vendas`)
| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/` | JWT | Criar venda (com transacao MongoDB) |
| GET | `/` | JWT | Listar ultimas 50 vendas |
| GET | `/:id` | JWT | Detalhes de uma venda |
| PATCH | `/:id/status` | JWT | Atualizar status |

### Movimentacoes (`/api/movimentacoes`)
| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/` | JWT | Registrar entrada/saida |
| GET | `/` | Gerente | Listar movimentacoes |
| GET | `/:produtoId` | JWT | Historico de um produto |

### Dashboard (`/api/dashboard`)
| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/` | Gerente | KPIs, faturamento, estoque critico, metas, top vendidos, grafico por hora |

### Metas (`/api/metas`)
| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/` | JWT | Listar metas ativas |
| POST | `/` | Gerente | Criar meta |
| PUT | `/:id` | Gerente | Editar meta |
| DELETE | `/:id` | Gerente | Remover meta |

### Outros
| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/api/cardapio` | - | Cardapio publico (sem login) |
| GET | `/api/logs` | Gerente | Historico de auditoria com filtros |

## Controle de Acesso

O sistema possui dois niveis de acesso:

| Recurso | Gerente | Funcionario |
|---------|---------|-------------|
| Dashboard | Completo + QR Code | Sem acesso |
| Produtos | CRUD + exportacao + reordenacao | Somente visualizacao |
| Vendas (PDV) | Todas as acoes | Todas as acoes |
| Movimentacoes | Historico completo | Sem acesso |
| Alertas de Estoque | Acesso total | Sem acesso |
| Funcionarios | CRUD + permissoes | Sem acesso |
| Metas | CRUD inline no dashboard | Sem acesso |
| Cardapio Publico | Acesso livre | Acesso livre |

Gerentes podem configurar quais abas cada funcionario pode acessar (dashboard, novo_produto, movimentacoes, alertas).

## Logica de Negocio

### Calculo de Estoque
O estoque e calculado dinamicamente (nunca armazenado diretamente):
```
estoque = SUM(entradas) - SUM(saidas)
```

### Estoque Critico
```
estoque <= media_diaria_de_saidas AND media_diaria > 0
```

### Fluxo de Vendas com Protecao contra Oversell
1. Usuario monta o carrinho com produtos disponiveis
2. Backend valida estoque dentro de uma **transacao MongoDB**
3. Venda criada com status `em_andamento`, movimentacoes de saida geradas
4. Fluxo de status: `em_andamento` → `pronto` → `finalizado`
5. Se cancelada: movimentacoes de entrada compensatorias restauram o estoque

### Seguranca
- Senhas hasheadas com bcrypt (10 salt rounds)
- JWT com expiracao de 24 horas
- RBAC (Role-Based Access Control)
- Validacao de inputs em todos os endpoints
- CORS configurado para origens especificas
- Auditoria completa de todas as acoes

## Deploy (Render)

O sistema usa deploy unificado no Render, onde o backend serve a API e o frontend buildado:

1. Crie um **Web Service** no [Render](https://render.com)
2. Conecte o repositorio
3. Configure:

| Campo | Valor |
|-------|-------|
| Build Command | `chmod +x render-build.sh && bash render-build.sh` |
| Start Command | `node server.js` |
| Environment | Node |

4. Adicione as variaveis de ambiente (`MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`)

O QR Code do cardapio aponta automaticamente para o dominio publico apos o deploy.

## Seed (Dados de Exemplo)

Para popular o banco com dados de teste:

```bash
cd backend

# Criar 14 produtos, 3 funcionarios, movimentacoes e vendas de exemplo
npm run seed

# Limpar todos os dados de teste
npm run seed:clear
```

## Equipe

Desenvolvido por **Mateus Loureiro** - Insper, 1o semestre de Engenharia de Producao.
Hackathon Insper Jr 2026.
