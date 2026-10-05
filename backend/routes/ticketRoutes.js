const express = require("express");

const {
    createTicket,
    listTickets,
    getTicket
} = require("../controllers/ticketController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.post("/", createTicket);

router.get("/", listTickets);

router.get("/:id", getTicket);

module.exports = router;