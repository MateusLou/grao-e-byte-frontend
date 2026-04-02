# Plano de Estudo — Grao & Byte
## Para Q&A do Hackathon Insper Jr

Voce nao precisa saber programar tudo do zero.
Precisa entender O QUE cada parte faz, POR QUE existe, e COMO se conectam.

---

## FASE 1 — Entender a Arquitetura (o "mapa" do projeto)

### 1.1 O que e MERN Stack?

O projeto usa 4 tecnologias que juntas formam o "MERN":

```
M  =  MongoDB    →  Banco de dados (onde os dados ficam salvos)
E  =  Express    →  Framework do servidor (recebe e responde requisicoes)
R  =  React      →  Biblioteca do frontend (o que o usuario ve na tela)
N  =  Node.js    →  Ambiente que roda JavaScript fora do navegador
```

**Analogia simples:**
- MongoDB = armario onde voce guarda fichas de produtos
- Express = balconista que recebe pedidos e devolve respostas
- React = vitrine da loja que mostra tudo bonito pro cliente
- Node.js = o predio inteiro onde o balconista trabalha

**Pergunta que podem fazer:**
- "Por que voce escolheu MERN?" → Porque e uma stack moderna que usa JavaScript em todas as camadas (frontend e backend), simplificando o desenvolvimento. MongoDB e flexivel para dados que podem mudar de estrutura (NoSQL). React permite criar interfaces dinamicas sem recarregar a pagina.

### 1.2 Como o projeto esta organizado?

```
grao-e-byte/
├── backend/                  ← SERVIDOR (API)
│   ├── server.js             ← Ponto de entrada, conecta ao banco
│   ├── models/               ← Formato dos dados no banco
│   │   ├── User.js           ← Modelo de usuario
│   │   ├── Product.js        ← Modelo de produto
│   │   └── Movimentacao.js   ← Modelo de movimentacao de estoque
│   ├── routes/               ← Endpoints da API (o que o servidor responde)
│   │   ├── auth.js           ← Login, registro, listar/deletar funcionarios
│   │   ├── products.js       ← CRUD de produtos + calculo de estoque
│   │   └── movimentacoes.js  ← Registrar entradas e saidas
│   ├── middleware/
│   │   └── auth.js           ← Verificacao de token JWT
│   ├── seed.js               ← Script para popular banco com dados de teste
│   └── .env                  ← Variaveis secretas (senha do banco, chave JWT)
│
└── frontend/                 ← INTERFACE (o que o usuario ve)
    ├── src/
    │   ├── main.jsx          ← Ponto de entrada do React
    │   ├── App.jsx           ← Definicao de todas as rotas/paginas
    │   ├── App.css           ← Todos os estilos visuais
    │   ├── components/       ← Pecas reutilizaveis
    │   │   ├── Layout.jsx    ← Sidebar + area de conteudo
    │   │   └── ProductCard.jsx ← Card individual de produto
    │   └── pages/            ← Paginas completas
    │       ├── Login.jsx
    │       ├── Products.jsx
    │       ├── ProductForm.jsx
    │       ├── Movimentacoes.jsx
    │       ├── Funcionarios.jsx
    │       └── AlertasEstoque.jsx
    └── vite.config.js        ← Configuracao do servidor de desenvolvimento
```

**Pergunta que podem fazer:**
- "Por que separar backend e frontend?" → Sao responsabilidades diferentes. O backend cuida dos dados e regras de negocio, o frontend cuida da interface. Isso permite que cada parte evolua independentemente e facilita a manutencao.

---

## FASE 2 — Entender o Backend (servidor + banco)

### 2.1 MongoDB e Mongoose

**O que e MongoDB?**
Banco de dados NoSQL. Em vez de tabelas com linhas e colunas (como Excel), ele guarda "documentos" em formato JSON.

**O que e Mongoose?**
Biblioteca que facilita trabalhar com MongoDB em Node.js. Ela define "schemas" — o formato que cada documento deve ter.

**Os 3 modelos do projeto:**

```
USUARIO (User)           PRODUTO (Product)         MOVIMENTACAO (Movimentacao)
┌──────────────┐          ┌──────────────┐          ┌──────────────────┐
│ nome         │          │ nome         │          │ produtoId (ref)  │
│ email        │          │ descricao    │          │ userId (ref)     │
│ senha (hash) │          │ preco        │          │ tipo (entrada/   │
└──────────────┘          │ categoria    │          │       saida)     │
                          └──────────────┘          │ quantidade       │
                                                    │ data             │
                                                    └──────────────────┘
```

**Conceito chave — Referencia (ref):**
A Movimentacao nao guarda o nome do produto nem do usuario. Ela guarda o ID deles (tipo um "link"). Isso e uma REFERENCIA. Quando precisamos do nome, usamos `.populate()` pra buscar.

**Pergunta que podem fazer:**
- "Como o estoque e calculado?" → O produto NAO tem campo de estoque. O estoque e calculado somando todas as entradas e subtraindo todas as saidas daquele produto. Isso e feito com uma "aggregation pipeline" do MongoDB — basicamente um calculo que o banco faz antes de devolver os dados.
- "Por que nao guardar o estoque direto no produto?" → Porque ficaria inconsistente. Se alguem registra uma entrada mas o campo de estoque nao atualiza (bug, queda de internet), os dados ficam errados. Calculando a partir das movimentacoes, sempre temos o valor correto.

### 2.2 API REST e Rotas

**O que e uma API REST?**
E uma forma padronizada de comunicacao entre frontend e backend usando HTTP.

**Verbos HTTP (os "acoes"):**
```
GET    = buscar dados        (ler)
POST   = criar dados         (escrever)
PUT    = atualizar dados     (editar)
DELETE = remover dados       (apagar)
```

**Todas as rotas do projeto:**

```
AUTENTICACAO:
POST   /api/auth/registro           → Criar conta nova
POST   /api/auth/login              → Fazer login (recebe token JWT)
GET    /api/auth/funcionarios       → Listar todos os usuarios
DELETE /api/auth/funcionarios/:id   → Remover funcionario

PRODUTOS:
GET    /api/products                → Listar todos (com estoque calculado)
GET    /api/products/:id            → Buscar um produto especifico
POST   /api/products                → Criar produto novo
PUT    /api/products/:id            → Atualizar produto
DELETE /api/products/:id            → Remover produto + suas movimentacoes

MOVIMENTACOES:
POST   /api/movimentacoes           → Registrar entrada ou saida
GET    /api/movimentacoes           → Listar todas (com dados do user e produto)
GET    /api/movimentacoes/:produtoId → Historico de um produto
```

**Pergunta que podem fazer:**
- "O que e o :id na rota?" → E um parametro dinamico. Quando o frontend quer editar o produto X, ele faz PUT /api/products/abc123, onde abc123 e o ID unico daquele produto no MongoDB.

### 2.3 Autenticacao com JWT

**O que e JWT (JSON Web Token)?**
E um "cartao de acesso" digital. Quando o usuario faz login, o servidor gera um token e devolve pro frontend. Depois disso, toda requisicao do frontend envia esse token no cabecalho para provar que ta logado.

**Fluxo completo:**

```
1. Usuario digita email + senha no frontend
2. Frontend envia POST /api/auth/login com { email, senha }
3. Backend busca usuario no MongoDB
4. Backend compara senha com bcrypt.compare()
5. Se correto: gera token JWT assinado com chave secreta
6. Devolve { token, nome } pro frontend
7. Frontend salva token e nome no localStorage do navegador
8. Toda proxima requisicao envia: Authorization: Bearer <token>
9. Middleware auth.js verifica o token antes de deixar passar
```

**Conceitos importantes:**
- **bcrypt**: nao salva a senha real no banco. Salva uma versao "embaralhada" (hash). Na hora de comparar, embaralha o que o usuario digitou e ve se bate.
- **localStorage**: armazenamento do navegador que persiste mesmo fechando a aba.
- **Middleware**: funcao que roda ANTES da rota. O auth.js intercepta a requisicao, verifica o token, e so deixa passar se for valido.

**Pergunta que podem fazer:**
- "O sistema e seguro?" → Usa JWT com expiracao de 24h, senhas com hash bcrypt (nao sao guardadas em texto), e middleware que protege todas as rotas. Para producao, adicionariamos HTTPS e refresh tokens.

### 2.4 Aggregation Pipeline (calculo de estoque)

Este e o conceito mais tecnico do backend. Entenda a logica:

```javascript
// Etapa 1: Agrupar movimentacoes por produto
$group: {
  _id: '$produtoId',
  entradas: soma de quantidade onde tipo = 'entrada',
  saidas: soma de quantidade onde tipo = 'saida'
}

// Resultado: para cada produto, temos total de entradas e saidas
// Estoque = entradas - saidas
```

**Para a media de vendas diarias:**
```
1. Filtrar apenas movimentacoes do tipo 'saida'
2. Agrupar por produto: soma total + data da primeira venda
3. Calcular: dias = (hoje - primeira venda)
4. Media = total vendido / dias
```

**Pergunta que podem fazer:**
- "O que e aggregation pipeline?" → E uma sequencia de operacoes que o MongoDB executa nos dados antes de devolver. Funciona como um pipeline de fabrica: os dados entram, passam por etapas (filtrar, agrupar, calcular), e saem transformados.

---

## FASE 3 — Entender o Frontend (React)

### 3.1 Conceitos Base do React

**Componentes:**
Pecas reutilizaveis da interface. Ex: `ProductCard` e um componente usado varias vezes na pagina de Produtos.

**Props:**
Dados que um componente pai passa pro filho. Ex: Products.jsx passa `produto` e `onMovimentacao` pro ProductCard.

**State (useState):**
Dados que podem mudar e fazem a tela atualizar. Ex: `const [produtos, setProdutos] = useState([])` — quando `setProdutos` e chamado com novos dados, o React redesenha a lista.

**useEffect:**
Codigo que roda quando o componente aparece na tela. Ex: carregar a lista de produtos do servidor quando a pagina abre.

**Exemplo simplificado do fluxo:**

```
1. Usuario abre /products
2. useEffect roda → faz GET /api/products
3. Servidor devolve array de produtos
4. setProdutos(data) → React redesenha a tela
5. Para cada produto, renderiza um <ProductCard>
6. Usuario clica "+Entrada" → setMovTipo('entrada')
7. Usuario digita quantidade → setQuantidade(valor)
8. Usuario clica "OK" → POST /api/movimentacoes
9. Sucesso → carregarProdutos() roda de novo
10. Tela atualiza com novo estoque
```

### 3.2 Roteamento (React Router)

```jsx
<Routes>
  <Route path="/login"              → pagina de Login
  <Route path="/products"           → lista de Produtos
  <Route path="/products/novo"      → formulario de criacao
  <Route path="/products/editar/:id"→ formulario de edicao
  <Route path="/movimentacoes"      → painel do gerente
  <Route path="/funcionarios"       → gestao de equipe
  <Route path="/alertas"            → alertas de estoque
  <Route path="*"                   → redireciona pro login
</Routes>
```

**O que e SPA (Single Page Application)?**
O navegador carrega UMA pagina HTML e o React troca o conteudo sem recarregar. O React Router gerencia qual componente mostrar baseado na URL.

### 3.3 Controle de Acesso no Frontend

```javascript
const isGerente = nomeUsuario === 'Mateus Loureiro';
```

**O que e protegido:**
- Sidebar: links de Movimentacoes, Alertas e Equipe so aparecem pro gerente
- Novo Produto: botao e rota so acessiveis pelo gerente
- ProductForm: botao de excluir so aparece no modo edicao para gerente
- Paginas de gerente: redirecionam usuarios comuns para /products

**Pergunta que podem fazer:**
- "Essa protecao e segura?" → No frontend, e apenas visual (esconde botoes). A protecao REAL deveria estar no backend com roles de usuario. Para o escopo do hackathon, funciona, mas em producao adicionariamos um campo 'role' no modelo User e verificacao no middleware.

### 3.4 Comunicacao Frontend ↔ Backend

**fetch API:**
```javascript
// Como o frontend fala com o backend:
const response = await fetch('/api/products', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
```

**Proxy do Vite:**
O frontend roda na porta 5173 e o backend na 3001. O Vite intercepta qualquer requisicao que comeca com `/api` e encaminha para `localhost:3001`. Assim o frontend nao precisa saber a porta do backend.

---

## FASE 4 — Entender as Decisoes de Design

### 4.1 Por que estoque por movimentacao (nao por campo)?

| Abordagem | Problema |
|-----------|----------|
| Campo `estoque` no produto | Se um registro falha, o numero fica errado pra sempre |
| Calculado por movimentacoes | Sempre correto, rastreavel, auditavel |

### 4.2 Por que categorias nos produtos?

Organiza o catalogo e permite:
- Filtro por abas na pagina de produtos
- Filtro cascata no painel do gerente (categoria → produto)
- Cores visuais diferentes por categoria

### 4.3 Por que alerta de estoque baseado em media de vendas?

Um estoque de "10 unidades" pode ser muito ou pouco dependendo de quanto voce vende por dia:
- Se vende 2/dia → 10 dura 5 dias (OK)
- Se vende 15/dia → 10 nao dura nem 1 dia (CRITICO)

Por isso comparamos estoque com venda media diaria.

### 4.4 Paleta de cores "Slate & Amber"

```
Sidebar:    #111827 (slate escuro)   → contraste profissional
Accent:     #F59E0B (amber/dourado)  → destaque quente
Background: #F9FAFB (cinza claro)    → limpo, nao cansa a vista
Sucesso:    #059669 (verde)          → entrada de estoque
Perigo:     #EF4444 (vermelho)       → alerta, exclusao
```

---

## FASE 5 — Perguntas e Respostas Mais Provaveis

### Sobre Arquitetura:

**P: Explique o fluxo de uma requisicao, do clique ate o banco.**
R: O usuario clica em "+Entrada" no card → React chama handleMovimentacao → fetch faz POST /api/movimentacoes com token, produtoId, tipo e quantidade → Express recebe a requisicao → middleware auth.js verifica o JWT → rota cria documento no MongoDB via Mongoose → responde 201 → frontend recebe sucesso → chama carregarProdutos() → GET /api/products → backend calcula estoque via aggregation → frontend atualiza o state → React redesenha os cards com novo valor.

**P: O que acontece se o servidor cai?**
R: O frontend continua carregado (SPA), mas as requisicoes falham. O try/catch mostra mensagem de erro. Os dados estao seguros no MongoDB Atlas (nuvem). Quando o servidor volta, tudo funciona normalmente.

### Sobre Banco de Dados:

**P: Por que MongoDB e nao SQL?**
R: MongoDB e flexivel para prototipacao rapida — nao precisamos definir tabelas rigidas. Os dados do projeto (produtos, movimentacoes) se encaixam bem em documentos JSON. Para um hackathon, a velocidade de desenvolvimento e prioridade.

**P: Onde o banco esta hospedado?**
R: No MongoDB Atlas, servico em nuvem da MongoDB. O banco "grao-e-byte" esta num cluster chamado "Cluster-GraoByte". A string de conexao esta no arquivo .env do backend.

### Sobre Seguranca:

**P: A senha e guardada em texto?**
R: Nao. Usamos bcrypt para fazer hash da senha antes de salvar. O hash e irreversivel — nem olhando o banco voce descobre a senha original. Na hora do login, o bcrypt compara o hash do que foi digitado com o hash salvo.

**P: O que impede alguem de acessar sem login?**
R: O middleware auth.js. Toda rota de produtos e movimentacoes passa por ele. Ele extrai o token do header Authorization, verifica com jwt.verify(), e so deixa a requisicao prosseguir se o token for valido e nao expirado.

### Sobre o Negocio:

**P: O que e uma movimentacao?**
R: E um registro de entrada (produto chegou/foi produzido) ou saida (produto foi vendido/consumido). Cada movimentacao grava: qual produto, quem registrou, tipo (entrada/saida), quantidade e data.

**P: Como funciona o alerta de estoque?**
R: O sistema calcula a media de vendas diarias de cada produto (total de saidas dividido pelo numero de dias desde a primeira venda). Se o estoque atual for menor ou igual a essa media, o produto e marcado como CRITICO (nao aguenta 1 dia). Se for menor que 2x a media, e ATENCAO.

### Sobre Evolucao:

**P: O que voce faria diferente se comecasse de novo?**
R: Adicionaria TypeScript para mais seguranca no codigo, roles no backend (nao so no frontend), testes automatizados, e deploy desde o inicio para testar em ambiente real.

**P: Quais os proximos passos?**
R: Deploy no Render para acesso externo, adicionar graficos de vendas ao longo do tempo, notificacao automatica quando estoque fica critico, e exportacao de relatorios em PDF.

---

## FASE 6 — Glossario Rapido

| Termo | O que e |
|-------|---------|
| **API** | Interface entre sistemas. O backend expoe uma API que o frontend consome |
| **REST** | Padrao de API usando verbos HTTP (GET, POST, PUT, DELETE) |
| **JWT** | Token de autenticacao assinado digitalmente |
| **Hash** | Transformacao irreversivel de dados (usado em senhas) |
| **Middleware** | Funcao que intercepta requisicoes antes de chegarem na rota |
| **Schema** | Definicao da estrutura de um documento no MongoDB |
| **Aggregation** | Pipeline de operacoes que o MongoDB executa nos dados |
| **State** | Dados mutaveis no React que causam re-renderizacao |
| **Props** | Dados passados de componente pai para filho |
| **useEffect** | Hook do React que roda codigo quando componente monta |
| **SPA** | Single Page Application — uma pagina, conteudo muda sem recarregar |
| **Proxy** | Intermediario que encaminha requisicoes para outro servidor |
| **CRUD** | Create, Read, Update, Delete — operacoes basicas de dados |
| **CORS** | Politica de seguranca do navegador para requisicoes entre origens |
| **Populate** | Mongoose substitui um ID referenciado pelo documento completo |
| **NoSQL** | Banco sem tabelas fixas (documentos flexiveis) |
| **Hash (bcrypt)** | Embaralhamento de senha que nao pode ser desembaralhado |
| **Hook** | Funcao especial do React (useState, useEffect, useMemo) |
| **Deploy** | Colocar o projeto em um servidor acessivel pela internet |

---

## Dica Final

Os avaliadores querem ver que voce ENTENDEU, nao que voce DECOROU.
Quando responder, use suas proprias palavras. Diga coisas como:
- "A gente decidiu fazer assim porque..."
- "O problema que isso resolve e..."
- "Se eu fosse refazer, mudaria..."

Demonstre que voce pensou sobre as decisoes, nao apenas seguiu um tutorial.
