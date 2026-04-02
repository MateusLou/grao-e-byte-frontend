# Plano de Estudo V2 — Grao & Byte (Completo)
## Para apresentacao do Hackathon Insper Jr

Voce nao precisa saber programar tudo do zero.
Precisa entender O QUE cada parte faz, POR QUE existe, e COMO se conectam.

Este material cobre o projeto INTEIRO — inclusive Vendas, Dashboard, Metas, Logs e Cardapio.

---

## FASE 1 — Visao Geral da Arquitetura

### 1.1 O que e MERN Stack?

```
M  =  MongoDB    →  Banco de dados (onde os dados ficam salvos na nuvem)
E  =  Express    →  Framework do servidor (recebe pedidos e devolve respostas)
R  =  React      →  Biblioteca do frontend (o que o usuario ve na tela)
N  =  Node.js    →  Ambiente que roda JavaScript fora do navegador
```

**Analogia — cafeteria:**
- MongoDB = caderno de anotacoes onde o dono registra tudo (estoque, pedidos, vendas)
- Express = garcom que ouve o pedido do cliente e vai buscar na cozinha
- React = balcao/vitrine onde o cliente ve o menu e faz pedidos
- Node.js = o predio da cafeteria onde tudo acontece

**Pergunta que podem fazer:**
- "Por que MERN?" → JavaScript em todas as camadas (frontend e backend), o que simplifica o aprendizado e o desenvolvimento. MongoDB e flexivel para prototipacao rapida. React cria interfaces dinamicas sem recarregar a pagina.

### 1.2 Como o projeto esta organizado?

```
grao-e-byte/
├── backend/                         ← SERVIDOR (API)
│   ├── server.js                    ← Ponto de entrada, conecta ao banco
│   ├── seed.js                      ← Popula banco com dados de teste
│   ├── .env                         ← Variaveis secretas
│   │
│   ├── models/                      ← Formato dos dados no banco (6 modelos)
│   │   ├── User.js                  ← Usuario (com role: gerente/funcionario)
│   │   ├── Product.js               ← Produto do catalogo
│   │   ├── Movimentacao.js          ← Entrada/saida de estoque
│   │   ├── Venda.js                 ← Pedido (com itens e status)
│   │   ├── Log.js                   ← Registro de auditoria
│   │   └── Meta.js                  ← Meta de vendas (diaria/semanal)
│   │
│   ├── routes/                      ← Endpoints da API (8 grupos)
│   │   ├── auth.js                  ← Login, registro, gerenciar equipe
│   │   ├── products.js              ← CRUD de produtos + calculo de estoque
│   │   ├── movimentacoes.js         ← Registrar entradas e saidas
│   │   ├── vendas.js                ← Criar pedidos, mudar status
│   │   ├── dashboard.js             ← Dados agregados para o painel
│   │   ├── metas.js                 ← CRUD de metas de vendas
│   │   ├── logs.js                  ← Historico de acoes
│   │   └── cardapio.js              ← Menu publico (sem login)
│   │
│   ├── middleware/
│   │   ├── auth.js                  ← Verificacao de token JWT
│   │   └── requireGerente.js        ← Protege rotas exclusivas do gerente
│   │
│   └── helpers/
│       └── logHelper.js             ← Funcao para gravar logs automaticamente
│
└── frontend/                        ← INTERFACE (o que o usuario ve)
    ├── vite.config.js               ← Proxy /api → backend
    └── src/
        ├── main.jsx                 ← Entrada do React
        ├── App.jsx                  ← Definicao de rotas (11 rotas)
        ├── App.css                  ← Todos os estilos
        │
        ├── components/              ← Pecas reutilizaveis
        │   ├── Layout.jsx           ← Sidebar + area de conteudo
        │   ├── Header.jsx           ← Cabecalho
        │   ├── ProductCard.jsx      ← Card de produto
        │   ├── ConfirmModal.jsx     ← Modal de confirmacao
        │   ├── Toast.jsx            ← Notificacoes
        │   └── dashboard/           ← 7 sub-componentes do painel
        │       ├── ResumoFinanceiro.jsx
        │       ├── StatusPedidos.jsx
        │       ├── EstoqueCritico.jsx
        │       ├── TopVendidos.jsx
        │       ├── MetasDoDia.jsx
        │       ├── UltimasVendas.jsx
        │       └── GraficoPorHora.jsx
        │
        ├── pages/                   ← Paginas completas (9 paginas)
        │   ├── Login.jsx
        │   ├── Dashboard.jsx        ← Painel de analytics
        │   ├── Products.jsx         ← Lista de produtos
        │   ├── ProductForm.jsx      ← Formulario criar/editar
        │   ├── Vendas.jsx           ← Gestao de pedidos
        │   ├── Movimentacoes.jsx    ← Historico de movimentacoes
        │   ├── Funcionarios.jsx     ← Gestao de equipe
        │   ├── AlertasEstoque.jsx   ← Alertas de estoque critico
        │   └── Cardapio.jsx         ← Menu publico
        │
        └── helpers/
            └── exportUtils.js       ← Exportar relatorios (PDF/Excel)
```

### 1.3 Fluxo geral de uma acao

```
USUARIO            FRONTEND (React)         BACKEND (Express)        BANCO (MongoDB)
  |                      |                        |                       |
  |-- clica botao ------>|                        |                       |
  |                      |-- fetch /api/... ----->|                       |
  |                      |                        |-- middleware auth --->|
  |                      |                        |-- Mongoose query ---->|
  |                      |                        |<---- dados ----------|
  |                      |<--- JSON response -----|                       |
  |<-- tela atualiza ----|                        |                       |
```

---

## FASE 2 — Backend (Servidor + Banco)

### 2.1 Os 6 Modelos do MongoDB

Cada modelo define a ESTRUTURA de um tipo de dado no banco. Pense como um formulario em branco — define quais campos existem.

```
USUARIO (User)              PRODUTO (Product)           MOVIMENTACAO
┌─────────────────┐          ┌─────────────────┐         ┌──────────────────┐
│ nome             │          │ nome             │         │ produtoId (ref)  │
│ email (unico)    │          │ descricao        │         │ userId (ref)     │
│ senha (hash)     │          │ preco            │         │ tipo (entrada/   │
│ role (gerente/   │          │ categoria        │         │       saida)     │
│       funcionario)│         │ ativo (sim/nao)  │         │ origem (manual/  │
└─────────────────┘          │ tags []           │         │  venda/cancelam.)│
                              │ posicao (ordem)  │         │ quantidade       │
                              └─────────────────┘         │ data             │
                                                           └──────────────────┘

VENDA                        LOG                          META
┌─────────────────┐          ┌─────────────────┐         ┌──────────────────┐
│ itens [          │          │ acao (criar,     │         │ tipo (diaria/    │
│   { produtoId,   │          │   editar, venda  │         │       semanal)   │
│     nome,        │          │   excluir...)    │         │ metrica (fatura- │
│     quantidade,  │          │ entidade (produto│         │   mento/pedidos) │
│     precoUnit }  │          │   venda, meta..) │         │ valor (alvo)     │
│ ]                │          │ entidadeId       │         │ inicioVigencia   │
│ total            │          │ entidadeNome     │         │ fimVigencia      │
│ status (em_anda- │          │ userId (ref)     │         │ criadoPor (ref)  │
│  mento/pronto/   │          │ detalhes         │         │ criadoEm         │
│  finalizado/     │          │ data             │         └──────────────────┘
│  cancelado)      │          └─────────────────┘
│ userId (ref)     │
│ criadoEm         │
│ finalizadoEm     │
└─────────────────┘
```

### 2.2 Referencias (ref) e Populate

Quando a Movimentacao guarda `produtoId`, ela nao guarda o nome do produto — guarda o ID (tipo um "link"). Isso evita duplicar dados.

```
Movimentacao no banco:        Depois do .populate():
{ produtoId: "abc123" }  →    { produtoId: { nome: "Cappuccino", preco: 12 } }
```

**Por que isso e bom?** Se o nome do produto muda, nao precisa mudar em todas as movimentacoes. O link sempre aponta pro dado atualizado.

### 2.3 API REST Completa

**Verbos HTTP (as "acoes"):**
```
GET    = buscar dados        (ler)
POST   = criar dados         (escrever)
PUT    = atualizar dados     (editar tudo)
PATCH  = atualizar parcial   (editar um campo)
DELETE = remover dados       (apagar)
```

**Todas as rotas do projeto:**

```
AUTENTICACAO (/api/auth):
POST   /registro              → Criar conta nova
POST   /login                 → Fazer login (recebe token JWT)
GET    /funcionarios          → Listar equipe (gerente)
DELETE /funcionarios/:id      → Remover funcionario (gerente)

PRODUTOS (/api/products):
GET    /                      → Listar todos (com estoque calculado)
GET    /:id                   → Buscar produto especifico
POST   /                      → Criar produto (gerente)
PUT    /:id                   → Atualizar produto (gerente)
DELETE /:id                   → Remover produto (gerente)

MOVIMENTACOES (/api/movimentacoes):
POST   /                      → Registrar entrada ou saida
GET    /                      → Listar todas (gerente)
GET    /:produtoId             → Historico de um produto

VENDAS (/api/vendas):
POST   /                      → Criar nova venda (com validacao de estoque)
GET    /                      → Listar vendas recentes
GET    /:id                   → Detalhe de uma venda
PATCH  /:id/status            → Mudar status (em_andamento → pronto → finalizado)

DASHBOARD (/api/dashboard):
GET    /                      → Todos os dados do painel (9 consultas)

METAS (/api/metas):
GET    /                      → Listar metas
POST   /                      → Criar meta (gerente)
PUT    /:id                   → Atualizar meta (gerente)
DELETE /:id                   → Remover meta (gerente)

LOGS (/api/logs):
GET    /                      → Historico de acoes (gerente)

CARDAPIO (/api/cardapio):
GET    /                      → Menu publico (SEM autenticacao!)
```

**Pergunta que podem fazer:**
- "Por que o cardapio nao exige login?" → E a unica rota publica. Simula um menu digital que qualquer cliente pode acessar sem precisar de conta. Mostra apenas produtos ativos com estoque disponivel.

### 2.4 Autenticacao com JWT

**Fluxo:**

```
1. Usuario digita email + senha
2. Frontend envia POST /api/auth/login
3. Backend busca usuario no MongoDB
4. Compara senha com bcrypt.compare() (hash irreversivel)
5. Se correto: gera token JWT assinado com chave secreta (expira em 24h)
6. Devolve { token, nome, role } pro frontend
7. Frontend salva no localStorage
8. Toda proxima requisicao envia: Authorization: Bearer <token>
9. Middleware auth.js verifica o token antes de deixar passar
```

**Conceitos-chave:**
- **bcrypt**: nunca salva a senha real. Salva uma versao "embaralhada" (hash). Mesmo olhando o banco, ninguem descobre a senha.
- **JWT**: como um cracha digital com nome, ID e cargo. O servidor assina ele — se alguem tentar alterar, a assinatura invalida.
- **Middleware**: funcao que intercepta a requisicao ANTES de chegar na rota. Tipo um seguranca na porta.

### 2.5 Roles e Middleware requireGerente

O sistema tem DOIS niveis de acesso:

```
FUNCIONARIO                          GERENTE
├── Ver produtos                      ├── Tudo que o funcionario faz
├── Registrar entrada/saida           ├── Criar/editar/excluir produtos
├── Criar vendas                      ├── Gerenciar equipe
├── Mudar status de venda             ├── Ver movimentacoes de todos
└── Ver cardapio                      ├── Criar/editar metas
                                      ├── Ver logs de auditoria
                                      └── Acessar dashboard completo
```

**Como funciona no backend:**

```
Requisicao chega
    │
    ▼
middleware auth.js → Verifica token JWT, extrai userId e userRole
    │
    ▼
middleware requireGerente.js → Se role != 'gerente', bloqueia com erro 403
    │
    ▼
Rota executa normalmente
```

**Pergunta que podem fazer:**
- "A protecao e so visual?" → Nao. No backend, o middleware `requireGerente` verifica o campo `role` do usuario no banco. Mesmo que alguem tente acessar a rota diretamente (sem o frontend), o servidor bloqueia. A protecao no frontend (esconder botoes) e apenas para melhorar a experiencia do usuario.

### 2.6 Aggregation Pipelines

Sao "pipelines de fabrica" no MongoDB — os dados entram crus e saem transformados.

**Calculo de estoque:**
```
Movimentacoes do produto "Cappuccino":
  entrada: 50
  entrada: 30
  saida: 20
  saida: 15

Pipeline:
  1. Agrupar por produtoId
  2. Somar entradas = 80
  3. Somar saidas = 35
  4. Estoque = 80 - 35 = 45
```

**No Dashboard — 9 consultas rodando em PARALELO:**
```
Promise.all([
  1. Faturamento de HOJE
  2. Faturamento de ONTEM           → Permite comparacao temporal
  3. Faturamento da SEMANA PASSADA  → "Vendemos mais ou menos que semana passada?"
  4. Status dos pedidos (quantos em andamento, quantos prontos)
  5. Estoque critico (produtos que acabam em menos de 1 dia)
  6. Top 5 produtos mais vendidos hoje
  7. Metas ativas com progresso
  8. Ultimas 15 vendas
  9. Movimento por hora (grafico)
])
```

**Pergunta que podem fazer:**
- "Por que Promise.all?" → As 9 consultas sao independentes (nenhuma depende do resultado da outra). Rodando em paralelo, o dashboard carrega MUITO mais rapido do que se fizesse uma de cada vez (sequencial).
- "O que e aggregation pipeline?" → E como uma linha de montagem: os dados entram, passam por etapas (filtrar, agrupar, calcular), e saem transformados. O banco faz o calculo pesado, nao o servidor.

### 2.7 Sistema de Logs (Trilha de Auditoria)

Toda acao importante grava um registro automaticamente:

```
Acoes registradas:
  criar, editar, excluir      → Produtos
  toggle_ativo                 → Ativar/desativar produto
  entrada, saida               → Movimentacoes de estoque
  registro, remover_funcionario → Gestao de equipe
  venda, cancelar_venda        → Operacoes de venda
  meta                         → Gestao de metas
```

**Cada log grava:**
```
{
  acao: "venda",
  entidade: "venda",
  entidadeNome: "Venda #a1b2c3",
  userId: "quem fez",
  detalhes: "3 itens - R$45.90",
  data: "quando aconteceu"
}
```

**Pergunta que podem fazer:**
- "Para que servem os logs?" → Rastreabilidade. O gerente pode ver exatamente quem fez o que e quando. Se um produto sumiu do estoque, da pra rastrear quem registrou a saida. Em negocio real, isso e essencial para auditoria e controle.
- "O log e gravado automaticamente?" → Sim. Toda rota chama a funcao `registrarLog()` quando faz algo relevante. O codigo do log fica centralizado no helper `logHelper.js` — nao precisa repetir em cada rota.

---

## FASE 3 — Frontend (React)

### 3.1 Conceitos Base

| Conceito | O que e | Exemplo no projeto |
|----------|---------|-------------------|
| **Componente** | Peca reutilizavel da interface | ProductCard, Toast, ConfirmModal |
| **Props** | Dados que o pai passa pro filho | Products passa `produto` pro ProductCard |
| **State (useState)** | Dado que muda e redesenha a tela | `[produtos, setProdutos]` — lista de produtos |
| **useEffect** | Codigo que roda quando a pagina abre | Carregar produtos do servidor |
| **fetch** | Funcao que faz requisicao HTTP | `fetch('/api/products')` |

### 3.2 Todas as Rotas (paginas)

```
/login              → Pagina de login
/dashboard          → Painel com KPIs, graficos e alertas
/products           → Lista de produtos com filtro por categoria
/products/novo      → Formulario para criar produto
/products/editar/:id → Formulario para editar produto
/vendas             → Gestao de pedidos (criar, mudar status)
/movimentacoes      → Historico de movimentacoes (gerente)
/funcionarios       → Gerenciar equipe (gerente)
/alertas            → Produtos com estoque critico
/cardapio           → Menu publico (acessivel sem login)
/*                  → Qualquer outra URL redireciona para /login
```

### 3.3 Dashboard — 7 Sub-componentes

O Dashboard e a pagina mais complexa. Em vez de ter TODO o codigo em um arquivo so, foi dividido em 7 componentes especializados:

```
Dashboard.jsx (pagina principal)
    │
    ├── ResumoFinanceiro.jsx     → KPIs: faturamento, pedidos, ticket medio
    │                               Compara com ontem e semana passada
    │                               (setas verdes = cresceu, vermelhas = caiu)
    │
    ├── StatusPedidos.jsx        → Quantos pedidos em andamento vs prontos
    │
    ├── EstoqueCritico.jsx       → Lista produtos que acabam em menos de 1 dia
    │
    ├── TopVendidos.jsx          → Top 5 produtos mais vendidos hoje
    │
    ├── MetasDoDia.jsx           → Barra de progresso das metas ativas
    │                               (ex: "R$500 de R$1000 = 50%")
    │
    ├── UltimasVendas.jsx        → Tabela com as 15 vendas mais recentes
    │
    └── GraficoPorHora.jsx       → Distribuicao de pedidos por hora do dia
```

**Pergunta que podem fazer:**
- "Por que dividir o dashboard em sub-componentes?" → Organizacao e manutencao. Cada componente tem UMA responsabilidade. Se preciso mudar como o estoque critico e exibido, mexo so no `EstoqueCritico.jsx`, sem risco de quebrar o resumo financeiro. Isso e o principio de "separacao de responsabilidades" (Separation of Concerns).

### 3.4 Fluxo de Vendas

```
1. Funcionario abre /vendas
2. Seleciona produtos e quantidades
3. Sistema valida se tem estoque suficiente
4. Clica "Finalizar Venda"
5. Backend cria a Venda + movimentacoes de saida automaticas
6. Pedido aparece com status "Em andamento"

FLUXO DE STATUS:
  em_andamento  →  pronto  →  finalizado
       │
       └──────→ cancelado (estoque e devolvido!)

7. Se cancelado: o sistema AUTOMATICAMENTE cria movimentacoes
   de entrada para devolver o estoque de cada item
```

**Pergunta que podem fazer:**
- "O que acontece se cancela uma venda?" → O sistema cria movimentacoes de ENTRADA automaticas para devolver o estoque. Como o estoque e calculado pela soma de entradas menos saidas, ao criar novas entradas, o estoque volta ao valor correto. Isso e automatico — o usuario so clica "Cancelar".
- "E se nao tiver estoque suficiente?" → O backend verifica o estoque de cada item ANTES de criar a venda. Se qualquer produto nao tiver estoque suficiente, a venda inteira e recusada com mensagem de erro.

### 3.5 Cardapio Publico

```
Cardapio (publico, SEM login)
    │
    ├── Busca produtos ativos no banco
    ├── Calcula estoque de cada um
    ├── Filtra: so mostra quem tem estoque > 0
    └── Exibe: nome, descricao, preco, categoria, tags
```

**Diferenca do sistema interno:**
- Cardapio: so leitura, sem login, so produtos disponiveis
- Sistema: CRUD completo, com login, mostra todos os produtos

### 3.6 Comunicacao Frontend ↔ Backend

```javascript
// Como o frontend fala com o backend:
const response = await fetch('/api/products', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
```

**Proxy do Vite:** O frontend roda na porta 5173, o backend na 3001. O Vite intercepta qualquer requisicao `/api` e redireciona para o backend. Assim o codigo do frontend usa caminhos simples (`/api/products`) sem precisar saber a porta do servidor.

---

## FASE 4 — Decisoes de Design

### 4.1 Estoque calculado (nao armazenado)

| Abordagem | Problema |
|-----------|----------|
| Campo `estoque` no produto | Se um registro falha, o numero fica errado pra sempre |
| Calculado por movimentacoes | Sempre correto, rastreavel, auditavel |

### 4.2 Fluxo de status com estorno automatico

| Decisao | Justificativa |
|---------|--------------|
| Venda cancelada restaura estoque | Consistencia automatica — sem intervencao manual |
| Status "finalizado" grava timestamp | Permite calcular tempo medio de preparo no futuro |
| Venda finalizada/cancelada nao pode mudar | Evita erros — pedido entregue nao pode voltar |

### 4.3 Dashboard com Promise.all

| Abordagem | Tempo (exemplo) |
|-----------|----------------|
| 9 consultas sequenciais | ~900ms (100ms cada) |
| 9 consultas em paralelo | ~100ms (todas ao mesmo tempo) |

Resultado: dashboard carrega ate 9x mais rapido.

### 4.4 Metas com vigencia temporal

Cada meta tem data de inicio e fim. O sistema automaticamente:
- Mostra no dashboard apenas metas cuja vigencia inclui o momento atual
- Calcula progresso baseado nas vendas dentro do periodo da meta

### 4.5 Cardapio publico separado

| Decisao | Justificativa |
|---------|--------------|
| Rota sem autenticacao | Cliente nao precisa criar conta pra ver o menu |
| Filtra estoque > 0 | Nao mostra produto que nao tem pra vender |
| Dados limitados | Nao expoe informacoes internas (estoque exato, custo) |

### 4.6 Logs como trilha de auditoria

| Decisao | Justificativa |
|---------|--------------|
| Log centralizado (logHelper) | Codigo DRY — nao repete em cada rota |
| Grava QUEM, O QUE e QUANDO | Rastreabilidade total |
| Acesso restrito a gerente | Funcionario nao precisa ver historico de acoes |

### 4.7 Alerta baseado em velocidade de vendas

```
10 unidades em estoque...
  Se vende 2/dia → dura 5 dias (OK)
  Se vende 15/dia → nao dura 1 dia (CRITICO!)
```

O alerta e inteligente — nao usa um numero fixo. Compara estoque com a media diaria de saidas.

---

## FASE 5 — Perguntas e Respostas

### Sobre Arquitetura

**P: Explique o fluxo completo de uma venda.**
R: O funcionario seleciona produtos na pagina de Vendas → o frontend envia POST /api/vendas com os itens → o backend verifica o estoque de cada produto usando aggregation → se tiver estoque, cria o documento Venda + cria movimentacoes de saida automaticamente → registra no log → devolve a venda criada → o frontend atualiza a tela. Se o pedido for cancelado depois, o backend cria movimentacoes de entrada para devolver o estoque.

**P: O que acontece se dois funcionarios vendem o mesmo produto ao mesmo tempo?**
R: O backend valida o estoque antes de cada venda individualmente. Se o primeiro pedido esgota o estoque, o segundo recebe erro "Estoque insuficiente". Para producao com alto volume, adicionariamos transacoes atomicas no MongoDB.

**P: Por que o dashboard tem tantas consultas?**
R: Cada secao do painel precisa de dados diferentes — KPIs financeiros, status de pedidos, alertas, ranking, metas. Usamos Promise.all para rodar todas em paralelo, o que e muito mais rapido que fazer uma de cada vez.

### Sobre Banco de Dados

**P: Por que MongoDB e nao SQL?**
R: MongoDB e flexivel pra prototipacao rapida — nao precisamos definir tabelas rigidas. Os dados (produtos, movimentacoes, vendas) se encaixam bem em documentos JSON. Pra um hackathon, velocidade de desenvolvimento e prioridade.

**P: Onde o banco esta hospedado?**
R: No MongoDB Atlas, servico em nuvem da MongoDB. A string de conexao esta no arquivo .env (variavel de ambiente, nao fica exposta no codigo).

**P: Como a Venda se conecta com o Produto?**
R: A Venda guarda um array de itens, e cada item tem um `produtoId` que referencia o modelo Product. Quando criamos a venda, buscamos o preco atual do produto no banco pra garantir que o valor esta correto.

### Sobre Seguranca

**P: A senha e guardada em texto?**
R: Nao. Usamos bcrypt para fazer hash. E irreversivel — nem olhando o banco da pra descobrir a senha original.

**P: O que impede acesso sem login?**
R: O middleware auth.js. Toda rota (exceto login, registro e cardapio) passa por ele. Extrai o token JWT do header, verifica se e valido e nao expirado.

**P: E se alguem tentar acessar uma rota de gerente sendo funcionario?**
R: O middleware requireGerente verifica o campo `role` do usuario. Se nao for "gerente", retorna erro 403 (Proibido). Isso acontece no BACKEND — nao depende do frontend esconder o botao.

### Sobre o Negocio

**P: O que e uma movimentacao?**
R: Registro de entrada (produto chegou) ou saida (produto vendido/usado). Grava: qual produto, quem registrou, tipo, quantidade e data. O estoque e a SOMA de todas as movimentacoes.

**P: O que sao as metas?**
R: Objetivos que o gerente define — podem ser de faturamento ou numero de pedidos, diarias ou semanais. O sistema calcula o progresso automaticamente comparando as vendas do periodo com o valor da meta. Aparece como barra de progresso no dashboard.

**P: Pra que serve o log?**
R: Rastreabilidade. Se um produto sumiu, da pra ver quem registrou a saida e quando. Em negocio real, isso e essencial para auditoria, controle e resolucao de problemas.

**P: Por que o cardapio existe separado?**
R: Simula um menu digital publico. O cliente ve so o que esta disponivel (produtos ativos com estoque), sem precisar de conta. O sistema interno mostra tudo — inclusive produtos inativos e estoque zerado — porque o gerente precisa dessa visao completa.

### Sobre Evolucao

**P: O que voce faria diferente se comecasse de novo?**
R: TypeScript para mais seguranca no codigo, testes automatizados, deploy desde o inicio, e talvez um sistema de notificacoes em tempo real (WebSocket) quando um pedido muda de status.

**P: Quais os proximos passos?**
R: Deploy no Render para acesso externo, graficos historicos de vendas, notificacoes automaticas de estoque critico, integracao com sistema de pagamento, e relatorios exportaveis mais completos.

**P: O que voce aprendeu no processo?**
R: Que construir um sistema real envolve muito mais do que "fazer funcionar" — e preciso pensar em consistencia de dados (estoque por movimentacao), seguranca (JWT + roles), rastreabilidade (logs), e performance (Promise.all no dashboard). Cada decisao de design tem consequencias.

---

## FASE 6 — Glossario Completo

| Termo | O que e |
|-------|---------|
| **API** | Interface entre sistemas. O backend expoe uma API que o frontend consome |
| **REST** | Padrao de API usando verbos HTTP (GET, POST, PUT, PATCH, DELETE) |
| **CRUD** | Create, Read, Update, Delete — operacoes basicas de dados |
| **JWT** | Token de autenticacao assinado digitalmente, como um "cracha" |
| **Hash (bcrypt)** | Embaralhamento irreversivel de senha |
| **Middleware** | Funcao que intercepta requisicoes antes de chegarem na rota |
| **Schema** | Definicao da estrutura de um documento no MongoDB |
| **Aggregation** | Pipeline de operacoes que o MongoDB executa nos dados |
| **Promise.all** | Executa varias operacoes ao mesmo tempo (paralelo) |
| **Populate** | Mongoose substitui um ID referenciado pelo documento completo |
| **State (useState)** | Dados mutaveis no React que causam re-renderizacao |
| **Props** | Dados passados de componente pai para filho |
| **useEffect** | Hook do React que roda codigo quando componente aparece na tela |
| **SPA** | Single Page Application — conteudo muda sem recarregar a pagina |
| **Proxy** | Intermediario que encaminha requisicoes (Vite redireciona /api pro backend) |
| **CORS** | Politica de seguranca do navegador para requisicoes entre origens |
| **NoSQL** | Banco de dados sem tabelas fixas — usa documentos flexiveis (JSON) |
| **Role** | Papel/cargo do usuario no sistema (gerente ou funcionario) |
| **Trilha de auditoria** | Registro cronologico de todas as acoes relevantes (logs) |
| **Vigencia** | Periodo em que uma meta esta ativa (data inicio → data fim) |
| **Ticket medio** | Faturamento dividido pelo numero de pedidos |
| **Deploy** | Colocar o projeto em um servidor acessivel pela internet |
| **Estorno** | Devolver itens ao estoque quando uma venda e cancelada |
| **DRY** | "Don't Repeat Yourself" — centralizar codigo pra nao repetir |
| **Hook** | Funcao especial do React (useState, useEffect) |
| **Separation of Concerns** | Cada parte do codigo cuida de uma coisa so |

---

## Dica Final

Os avaliadores sabem que voce esta no 1o semestre e querem ver APRENDIZADO, nao perfeicao.

Quando responder, use suas proprias palavras:
- "A gente decidiu fazer assim porque..."
- "O problema que isso resolve e..."
- "Se eu fosse refazer, mudaria..."
- "Uma coisa que aprendi foi..."

**Nao tente parecer que sabe tudo.** Se nao souber algo, diga: "Isso eu ainda nao me aprofundei, mas entendo que..." — honestidade impressiona mais que respostas decoradas.

**Foque nas DECISOES, nao no codigo.** O avaliador quer saber POR QUE voce fez de certo jeito, nao como escreveu cada linha. Entenda os "porques" deste material e voce estara preparado.
