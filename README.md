# 🎫 SupportFlow - Sistema de Help Desk

Sistema Full Stack de gerenciamento de chamados de suporte técnico, desenvolvido para simular o funcionamento de uma plataforma de Help Desk utilizada em ambientes corporativos.

O SupportFlow permite que usuários abram chamados, técnicos realizem atendimentos e administradores acompanhem usuários, indicadores, prioridades, categorias e o cumprimento de SLA.

O projeto foi desenvolvido com foco no aprendizado e aplicação prática de desenvolvimento Full Stack, APIs REST, autenticação, autorização, banco de dados e regras de negócio.

---

## 📌 Sobre o projeto

O SupportFlow foi criado para centralizar solicitações de suporte técnico.

O sistema possui três tipos de acesso:

- Usuário
- Técnico
- Administrador

Cada perfil possui permissões diferentes dentro da aplicação.

### Usuário

O usuário pode:

- Criar uma conta
- Fazer login
- Abrir chamados
- Escolher categoria e prioridade
- Visualizar seus próprios chamados
- Acompanhar o status do atendimento
- Visualizar o prazo de SLA
- Enviar comentários
- Acompanhar o histórico do chamado

### Técnico

O técnico pode:

- Visualizar os chamados do sistema
- Pesquisar chamados
- Filtrar por status
- Filtrar por prioridade
- Filtrar por categoria
- Filtrar por situação do SLA
- Assumir chamados
- Alterar o status do atendimento
- Adicionar comentários
- Visualizar histórico
- Identificar chamados próximos do vencimento
- Identificar chamados com SLA vencido

### Administrador

O administrador possui acesso a:

- Dashboard administrativo
- Gerenciamento de usuários
- Alteração de perfis
- Estatísticas de chamados
- Estatísticas de usuários
- Indicadores de SLA
- Taxa de cumprimento de SLA
- Tempo médio de resolução
- Chamados por prioridade
- Chamados por categoria
- Chamados críticos pendentes
- Chamados próximos do vencimento
- Chamados com SLA vencido

---

# 🚀 Tecnologias utilizadas

## Frontend

- React
- Vite
- JavaScript
- HTML5
- CSS3
- React Router DOM
- Fetch API

## Backend

- Node.js
- Express
- JavaScript
- JWT
- bcrypt
- dotenv
- CORS

## Banco de dados

- SQLite
- better-sqlite3
- SQL

## Ferramentas

- Git
- GitHub
- Visual Studio Code
- npm

---

# 🏗️ Arquitetura do projeto

O projeto foi dividido entre frontend e backend.

```text
React
  ↓
HTTP / JSON
  ↓
API REST
  ↓
Node.js + Express
  ↓
Controllers
  ↓
SQLite
```

O frontend é responsável pela interface e interação com o usuário.

O backend contém as regras de negócio, autenticação, autorização e comunicação com o banco de dados.

---

# 📁 Estrutura do projeto

```text
supportflow-helpdesk/
│
├── backend/
│   │
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── commentController.js
│   │   ├── historyController.js
│   │   ├── technicianController.js
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
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── historyRoutes.js
│   │   ├── technicianRoutes.js
│   │   └── ticketRoutes.js
│   │
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RoleRoute.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NewTicket.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── TechnicianDashboard.jsx
│   │   │   ├── TechnicianTicketDetails.jsx
│   │   │   ├── TicketDetails.jsx
│   │   │   └── Tickets.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── admin.css
│   │   └── index.css
│   │
│   └── package.json
│
├── .gitignore
└── README.md
```

> Arquivos como `.env`, banco SQLite e `node_modules` não devem ser enviados para o repositório.

---

# 🔐 Autenticação

O SupportFlow utiliza autenticação baseada em JWT (JSON Web Token).

O fluxo funciona da seguinte forma:

```text
Usuário informa e-mail e senha
            ↓
Backend valida as credenciais
            ↓
Senha é comparada utilizando bcrypt
            ↓
Backend gera um JWT
            ↓
Frontend armazena o token
            ↓
Token é enviado nas requisições protegidas
```

As requisições autenticadas utilizam:

```http
Authorization: Bearer TOKEN
```

---

# 👥 Controle de acesso

O sistema possui três perfis:

```text
user
technician
admin
```

O backend utiliza middlewares para verificar autenticação e autorização.

Exemplo conceitual:

```javascript
authenticate
    ↓
authorize("technician", "admin")
    ↓
controller
```

Dessa forma, não é suficiente apenas esconder páginas no frontend.

O backend também verifica se o usuário realmente possui permissão para executar determinada operação.

---

# 🔒 Segurança

Algumas medidas aplicadas no projeto:

- Senhas armazenadas utilizando hash com bcrypt
- Autenticação com JWT
- Rotas protegidas
- Controle de acesso baseado em perfil
- Validação de dados recebidos
- Proteção de operações administrativas
- Separação entre autenticação e autorização
- Uso de parâmetros em consultas SQL
- Variáveis sensíveis armazenadas em `.env`
- `.env` ignorado pelo Git

---

# 🎫 Sistema de chamados

Cada chamado possui informações como:

```text
ID
Título
Descrição
Categoria
Prioridade
Status
Usuário responsável pela criação
Técnico responsável
Data de criação
Data de atualização
Prazo do SLA
Data de resolução
```

---

# 🗂️ Categorias

As categorias disponíveis são:

- Hardware
- Software
- Rede
- Acesso
- E-mail
- Outros

---

# ⚡ Prioridades

O sistema possui quatro níveis de prioridade:

| Prioridade | SLA |
|---|---:|
| Baixa | 72 horas |
| Média | 48 horas |
| Alta | 24 horas |
| Crítica | 8 horas |

---

# ⏱️ Controle de SLA

Quando um chamado é criado, o backend calcula automaticamente seu prazo de atendimento.

Exemplo:

```text
Prioridade crítica

Criado às 11:00
       +
SLA de 8 horas
       =
Prazo às 19:00
```

O prazo é armazenado no campo:

```text
due_at
```

Quando o chamado é resolvido, o sistema registra:

```text
resolved_at
```

Isso permite comparar:

```text
resolved_at <= due_at
```

para identificar um SLA cumprido.

Ou:

```text
resolved_at > due_at
```

para identificar uma violação de SLA.

---

# 🚦 Indicadores de SLA

O sistema classifica chamados em situações como:

### Dentro do prazo

Chamado ainda possui tempo suficiente para atendimento.

### Em atenção

Chamado possui até 4 horas restantes antes do vencimento.

### Vencido

O prazo de SLA já foi ultrapassado.

### Resolvido

O atendimento foi finalizado.

O painel técnico prioriza automaticamente chamados mais urgentes.

```text
1. SLA vencido
2. SLA próximo do vencimento
3. Dentro do prazo
4. Sem prazo
5. Resolvido
```

---

# 📊 Dashboard técnico

O painel técnico possui:

- Total de chamados
- Chamados abertos
- Chamados em andamento
- Chamados aguardando
- Chamados resolvidos
- SLA em atenção
- SLA vencido

Também possui filtros combinados por:

```text
Busca
+
Status
+
Prioridade
+
Categoria
+
SLA
```

O técnico também pode limpar todos os filtros de uma vez.

---

# 📈 Dashboard administrativo

O administrador possui uma visão geral do funcionamento do Help Desk.

Entre os indicadores disponíveis estão:

- Total de usuários
- Total de chamados
- Chamados abertos
- Chamados em andamento
- Chamados aguardando
- Chamados resolvidos
- SLA cumprido
- SLA violado
- Taxa de cumprimento
- Tempo médio de resolução
- SLA em atenção
- SLA vencido
- Distribuição por prioridade
- Distribuição por categoria
- Chamados críticos pendentes

---

# 💬 Comentários

Usuários e equipe de suporte podem utilizar comentários dentro dos chamados.

As permissões são controladas pelo backend.

Um técnico não pode responder livremente a qualquer chamado sem respeitar as regras de atribuição implementadas no sistema.

---

# 🕒 Histórico de alterações

O sistema registra eventos importantes relacionados aos chamados.

Exemplos:

```text
Chamado criado
Técnico atribuído
Status alterado
```

O histórico permite acompanhar a evolução do atendimento.

---

# 🌎 Tratamento de datas e UTC

Durante o desenvolvimento também foi implementado tratamento de datas entre SQLite, backend e navegador.

Datas armazenadas em UTC são interpretadas corretamente pelo frontend antes de serem apresentadas ao usuário.

Exemplo:

```text
Banco / UTC
        ↓
Conversão da data
        ↓
JavaScript Date
        ↓
toLocaleString("pt-BR")
        ↓
Data apresentada ao usuário
```

Isso evita diferenças incorretas no cálculo e exibição do SLA.

---

# 🔌 Principais endpoints da API

## Autenticação

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Chamados

```http
POST /api/tickets
GET  /api/tickets
GET  /api/tickets/:id
```

## Técnico

```http
GET /api/technician/tickets
GET /api/technician/tickets/:id

PUT /api/technician/tickets/:id/assign
PUT /api/technician/tickets/:id/status
```

## Comentários

```http
GET  /api/tickets/:id/comments
POST /api/tickets/:id/comments
```

## Histórico

```http
GET /api/tickets/:id/history
```

## Administração

```http
GET /api/admin/stats
GET /api/admin/users
GET /api/admin/users/:id
PUT /api/admin/users/:id/role
```

---

# 🗄️ Banco de dados

O projeto utiliza SQLite.

As principais tabelas são:

```text
users
tickets
ticket_comments
ticket_history
```

Os relacionamentos utilizam chaves estrangeiras para manter a integridade dos dados.

Exemplo:

```text
users
  │
  ├──── tickets
  │
  ├──── ticket_comments
  │
  └──── ticket_history
```

---

# ▶️ Como executar o projeto

## 1. Clonar o repositório

```bash
git clone https://github.com/Jmfeliciano2/supportflow-helpdesk.git
```

Entre na pasta:

```bash
cd supportflow-helpdesk
```

---

## 2. Configurar o backend

Entre na pasta:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie um arquivo:

```text
.env
```

Exemplo:

```env
PORT=3000
JWT_SECRET=coloque_uma_chave_secreta_aqui
```

> Não utilize uma chave real de produção no README ou no GitHub.

Inicie o backend:

```bash
npm start
```

A API ficará disponível normalmente em:

```text
http://localhost:3000
```

Teste de saúde:

```text
GET /api/health
```

---

# 💻 Configurar o frontend

Abra outro terminal.

A partir da raiz do projeto:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Execute:

```bash
npm run dev
```

O Vite exibirá no terminal o endereço disponível para acessar a aplicação.

Exemplo:

```text
http://localhost:5173
```

A porta pode mudar caso já esteja sendo utilizada.

---

# 🧪 Testes manuais recomendados

Para validar o funcionamento da aplicação:

1. Criar uma conta
2. Fazer login
3. Criar um chamado
4. Escolher categoria
5. Escolher prioridade
6. Verificar geração do SLA
7. Acessar o chamado
8. Adicionar comentário
9. Entrar como técnico
10. Assumir o chamado
11. Alterar status
12. Testar filtros
13. Resolver o chamado
14. Conferir histórico
15. Entrar como administrador
16. Conferir estatísticas
17. Conferir indicadores de SLA
18. Testar gerenciamento de usuários
19. Fazer logout
20. Tentar acessar uma rota protegida sem autenticação

---

# 🧠 Conceitos aplicados

Durante o desenvolvimento deste projeto foram praticados conceitos como:

- Desenvolvimento Full Stack
- Componentização com React
- React Hooks
- `useState`
- `useEffect`
- `useMemo`
- Async/Await
- Fetch API
- APIs REST
- JSON
- Node.js
- Express
- Controllers
- Routes
- Middlewares
- Autenticação
- Autorização
- JWT
- Hash de senhas
- bcrypt
- SQL
- SQLite
- JOIN
- Foreign Keys
- CRUD
- Validação
- Tratamento de erros
- Regras de negócio
- Controle de SLA
- Manipulação de datas
- UTC e timezone
- Git
- GitHub

---

# 🎯 Objetivo do projeto

O principal objetivo do SupportFlow é aplicar conhecimentos de Engenharia de Software através da construção de uma aplicação Full Stack próxima de um cenário real de suporte de TI.

O projeto também foi desenvolvido como parte do meu portfólio, demonstrando conhecimentos em frontend, backend, banco de dados, autenticação, APIs e regras de negócio.

---

# 🔮 Melhorias futuras

Algumas funcionalidades que podem ser adicionadas futuramente:

- Testes automatizados
- Recuperação de senha
- Notificações por e-mail
- Upload de anexos
- Paginação de chamados
- Exportação de relatórios
- Dashboard com gráficos
- Documentação da API com Swagger/OpenAPI
- Docker
- Deploy do frontend e backend
- Migração para PostgreSQL
- Logs estruturados
- CI/CD

---

# 👨‍💻 Autor

**João Matheus**

Estudante de Engenharia de Software na FIAP.

Interesse em desenvolvimento de software, desenvolvimento Full Stack e tecnologia.

GitHub: `Jmfeliciano2`

---

## 📄 Licença

Projeto desenvolvido para fins de estudo e portfólio.
