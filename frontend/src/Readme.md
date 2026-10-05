# 🎫 SupportFlow - Sistema de Help Desk

O **SupportFlow** é uma aplicação web Full Stack para gerenciamento de chamados de suporte técnico.

O projeto está sendo desenvolvido com o objetivo de colocar em prática conceitos de desenvolvimento Front-End e Back-End, como criação de APIs REST, autenticação de usuários, banco de dados, rotas protegidas e integração entre React e Node.js.

## 🚀 Tecnologias

### Front-End

- React
- Vite
- JavaScript
- React Router DOM
- HTML5
- CSS3
- Fetch API

### Back-End

- Node.js
- Express
- SQLite
- better-sqlite3
- JSON Web Token (JWT)
- bcrypt
- CORS
- dotenv
- Nodemon

## 📁 Estrutura do projeto

```text
Helpdesk/
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── ticketController.js
│   │
│   ├── database/
│   │   └── database.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── ticketRoutes.js
│   │
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── index.css
│   │
│   └── package.json
│
└── README.md
```

## ✨ Funcionalidades implementadas

- Cadastro de usuários
- Login de usuários
- Criptografia de senhas com bcrypt
- Autenticação utilizando JWT
- Rotas protegidas
- Persistência de dados com SQLite
- Criação de chamados
- Listagem de chamados do usuário
- Visualização dos detalhes de um chamado
- Dashboard com informações dos chamados
- Integração entre React e API Node.js
- Layout responsivo

## 🔐 Autenticação

O sistema utiliza **JSON Web Token (JWT)** para autenticação.

Após realizar login, a API gera um token que é utilizado nas requisições para acessar recursos protegidos.

As senhas não são armazenadas diretamente no banco de dados. Antes do armazenamento, são processadas utilizando **bcrypt**.

## 🎫 Chamados

Cada chamado possui informações como:

- Título
- Descrição
- Categoria
- Prioridade
- Status
- Usuário responsável pela criação
- Data de criação
- Data de atualização

Prioridades disponíveis:

- Baixa
- Média
- Alta
- Crítica

## 🔄 Fluxo da aplicação

```text
React
  ↓
Fetch API
  ↓
Express / Node.js
  ↓
JWT Middleware
  ↓
Controllers
  ↓
SQLite
```

## 🛠️ Como executar o projeto

### 1. Clone o repositório

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta:

```bash
cd Helpdesk
```

### 2. Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env`:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta
```

Execute:

```bash
npm run dev
```

O backend será executado em:

```text
http://localhost:3000
```

### 3. Front-End

Abra outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra no navegador o endereço informado pelo Vite.

Normalmente:

```text
http://localhost:5173
```

## 📌 Endpoints

### Autenticação

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Chamados

```text
POST /api/tickets
GET  /api/tickets
GET  /api/tickets/:id
```

As rotas de chamados exigem autenticação.

## 🗺️ Próximas funcionalidades

O projeto continua em desenvolvimento. Algumas funcionalidades planejadas:

- Painel de técnico
- Painel administrativo
- Diferentes níveis de acesso
- Atribuição de chamados aos técnicos
- Alteração de status dos chamados
- Comentários entre usuário e suporte
- Histórico do chamado
- Filtros e pesquisa
- Métricas no dashboard
- Melhorias de segurança
- Deploy do Front-End e Back-End

## 🎯 Objetivo do projeto

O SupportFlow foi criado como projeto de estudo e portfólio para aplicar conhecimentos de Engenharia de Software e desenvolvimento Full Stack.

O projeto trabalha conceitos como:

- Desenvolvimento Front-End
- Desenvolvimento Back-End
- APIs REST
- Banco de dados
- Autenticação
- Autorização
- Segurança de senhas
- Arquitetura cliente-servidor
- Organização de projetos
- Controle de versão com Git e GitHub

## 👨‍💻 Autor

**João Matheus**

Estudante de Engenharia de Software.