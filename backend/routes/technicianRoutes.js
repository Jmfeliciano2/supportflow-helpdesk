const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    listAllTickets,
    getTicket,
    assignTicket,
    updateStatus
} = require("../controllers/technicianController");

const router = express.Router();

router.use(authenticate);

router.use(
    authorize("technician", "admin")
);

router.get(
    "/tickets",
    listAllTickets
);

router.get(
    "/tickets/:id",
    getTicket
);

router.put(
    "/tickets/:id/assign",
    assignTicket
);

router.put(
    "/tickets/:id/status",
    updateStatus
);

module.exports = router;