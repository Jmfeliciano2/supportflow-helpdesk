const express = require("express");

const authenticate = require(
    "../middleware/authMiddleware"
);

const {
    listHistory,
} = require(
    "../controllers/historyController"
);

const router = express.Router();

router.use(authenticate);

router.get(
    "/tickets/:id/history",
    listHistory
);

module.exports = router;