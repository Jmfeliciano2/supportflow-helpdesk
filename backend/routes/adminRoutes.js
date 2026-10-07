const express = require("express");

const authenticate = require(
    "../middleware/authMiddleware"
);

const authorize = require(
    "../middleware/roleMiddleware"
);

const {
    getDashboardStats,
    listUsers,
    getUser,
    updateUserRole,
} = require(
    "../controllers/adminController"
);

const router = express.Router();


// ========================================
// TODAS AS ROTAS EXIGEM LOGIN
// ========================================

router.use(authenticate);


// ========================================
// TODAS AS ROTAS EXIGEM ADMIN
// ========================================

router.use(
    authorize("admin")
);


// ========================================
// DASHBOARD
// ========================================

router.get(
    "/stats",
    getDashboardStats
);


// ========================================
// USUÁRIOS
// ========================================

router.get(
    "/users",
    listUsers
);

router.get(
    "/users/:id",
    getUser
);

router.put(
    "/users/:id/role",
    updateUserRole
);


module.exports = router;