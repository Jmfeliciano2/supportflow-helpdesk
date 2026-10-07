const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./database/database");

// ROTAS
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const technicianRoutes = require("./routes/technicianRoutes");
const commentRoutes = require("./routes/commentRoutes");
const historyRoutes = require("./routes/historyRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ========================================
// MIDDLEWARES GERAIS
// ========================================

app.use(cors());

app.use(express.json());


// ========================================
// ROTA PÚBLICA DE TESTE
// IMPORTANTE: fica antes das outras rotas
// ========================================

app.get("/api/health", (req, res) => {
    return res.status(200).json({
        status: "ok",
        message: "API do SupportFlow funcionando!",
    });
});


// ========================================
// AUTENTICAÇÃO
// ========================================

app.use(
    "/api/auth",
    authRoutes
);


// ========================================
// CHAMADOS DO USUÁRIO
// ========================================

app.use(
    "/api/tickets",
    ticketRoutes
);


// ========================================
// ÁREA DO TÉCNICO
// ========================================

app.use(
    "/api/technician",
    technicianRoutes
);


// ========================================
// ÁREA ADMINISTRATIVA
// ========================================

app.use(
    "/api/admin",
    adminRoutes
);


// ========================================
// COMENTÁRIOS
// ========================================

app.use(
    "/api",
    commentRoutes
);


// ========================================
// HISTÓRICO
// ========================================

app.use(
    "/api",
    historyRoutes
);


// ========================================
// ROTA NÃO ENCONTRADA
// ========================================

app.use((req, res) => {
    return res.status(404).json({
        error: "Rota não encontrada.",
    });
});


// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Servidor rodando em http://localhost:${PORT}`
    );
});