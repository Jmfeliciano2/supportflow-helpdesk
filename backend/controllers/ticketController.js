const db = require("../database/database");


// ========================================
// CRIAR CHAMADO
// ========================================

function createTicket(req, res) {
    try {
        const {
            title,
            description,
            category,
            priority
        } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({
                error: "Título, descrição e categoria são obrigatórios."
            });
        }

        const allowedPriorities = [
            "low",
            "medium",
            "high",
            "critical"
        ];

        const ticketPriority = priority || "medium";

        if (!allowedPriorities.includes(ticketPriority)) {
            return res.status(400).json({
                error: "Prioridade inválida."
            });
        }

        const result = db.prepare(`
            INSERT INTO tickets (
                title,
                description,
                category,
                priority,
                created_by
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            title,
            description,
            category,
            ticketPriority,
            req.user.id
        );

        const ticket = db.prepare(`
            SELECT *
            FROM tickets
            WHERE id = ?
        `).get(result.lastInsertRowid);

        return res.status(201).json({
            message: "Chamado criado com sucesso.",
            ticket
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro interno do servidor."
        });
    }
}


// ========================================
// LISTAR CHAMADOS
// ========================================

function listTickets(req, res) {
    try {
        const tickets = db.prepare(`
            SELECT
                tickets.id,
                tickets.title,
                tickets.description,
                tickets.category,
                tickets.priority,
                tickets.status,
                tickets.created_at,
                tickets.updated_at,
                users.name AS created_by_name
            FROM tickets
            INNER JOIN users
                ON users.id = tickets.created_by
            WHERE tickets.created_by = ?
            ORDER BY tickets.created_at DESC
        `).all(req.user.id);

        return res.status(200).json(tickets);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro interno do servidor."
        });
    }
}


// ========================================
// BUSCAR UM CHAMADO
// ========================================

function getTicket(req, res) {
    try {
        const { id } = req.params;

        const ticket = db.prepare(`
            SELECT
                tickets.*,
                users.name AS created_by_name
            FROM tickets
            INNER JOIN users
                ON users.id = tickets.created_by
            WHERE tickets.id = ?
            AND tickets.created_by = ?
        `).get(id, req.user.id);

        if (!ticket) {
            return res.status(404).json({
                error: "Chamado não encontrado."
            });
        }

        return res.status(200).json(ticket);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro interno do servidor."
        });
    }
}


module.exports = {
    createTicket,
    listTickets,
    getTicket
};