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
            priority,
        } = req.body;

        // ========================================
        // CAMPOS OBRIGATÓRIOS
        // ========================================

        if (
            !title ||
            !description ||
            !category ||
            !priority
        ) {
            return res.status(400).json({
                error:
                    "Título, descrição, categoria e prioridade são obrigatórios.",
            });
        }

        // ========================================
        // VALIDAÇÃO DO TÍTULO
        // ========================================

        const cleanTitle = title.trim();

        if (cleanTitle.length < 3) {
            return res.status(400).json({
                error:
                    "O título deve possuir pelo menos 3 caracteres.",
            });
        }

        if (cleanTitle.length > 120) {
            return res.status(400).json({
                error:
                    "O título deve possuir no máximo 120 caracteres.",
            });
        }

        // ========================================
        // VALIDAÇÃO DA DESCRIÇÃO
        // ========================================

        const cleanDescription = description.trim();

        if (cleanDescription.length < 10) {
            return res.status(400).json({
                error:
                    "A descrição deve possuir pelo menos 10 caracteres.",
            });
        }

        if (cleanDescription.length > 3000) {
            return res.status(400).json({
                error:
                    "A descrição deve possuir no máximo 3000 caracteres.",
            });
        }

        // ========================================
        // VALIDAR CATEGORIA
        // ========================================

        const allowedCategories = [
            "Hardware",
            "Software",
            "Rede",
            "Acesso",
            "Email",
            "Outros",
        ];

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                error: "Categoria inválida.",
            });
        }

        // ========================================
        // VALIDAR PRIORIDADE
        // ========================================

        const allowedPriorities = [
            "low",
            "medium",
            "high",
            "critical",
        ];

        if (!allowedPriorities.includes(priority)) {
            return res.status(400).json({
                error: "Prioridade inválida.",
            });
        }

        // ========================================
        // CALCULAR SLA
        // ========================================

        const slaHours = {
            low: 72,
            medium: 48,
            high: 24,
            critical: 8,
        };

        /*
         * Trabalhamos internamente com UTC.
         *
         * Exemplo:
         *
         * Horário local:
         * 11:21 em São Paulo
         *
         * UTC:
         * 14:21Z
         *
         * SLA crítico:
         * +8 horas
         *
         * UTC:
         * 22:21Z
         *
         * Ao chegar no navegador:
         * 19:21 em São Paulo
         *
         * Portanto, o prazo continua sendo
         * exatamente 8 horas.
         */

        const now = new Date();

        const dueDate = new Date(
            now.getTime() +
                slaHours[priority] *
                    60 *
                    60 *
                    1000
        );

        /*
         * IMPORTANTE:
         *
         * Não removemos o "Z".
         *
         * Ele informa ao JavaScript que
         * a data está armazenada em UTC.
         */

        const dueAt = dueDate.toISOString();

        // ========================================
        // CRIAR CHAMADO
        // ========================================

        const result = db
            .prepare(`
                INSERT INTO tickets (
                    title,
                    description,
                    category,
                    priority,
                    status,
                    created_by,
                    due_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            .run(
                cleanTitle,
                cleanDescription,
                category,
                priority,
                "open",
                req.user.id,
                dueAt
            );

        const ticketId =
            result.lastInsertRowid;

        // ========================================
        // REGISTRAR NO HISTÓRICO
        // ========================================

        db.prepare(`
            INSERT INTO ticket_history (
                ticket_id,
                user_id,
                action
            )
            VALUES (?, ?, ?)
        `).run(
            ticketId,
            req.user.id,
            "ticket_created"
        );

        // ========================================
        // BUSCAR CHAMADO CRIADO
        // ========================================

        const ticket = db
            .prepare(`
                SELECT
                    tickets.*,

                    users.name AS creator_name,
                    users.email AS creator_email

                FROM tickets

                LEFT JOIN users
                    ON users.id = tickets.created_by

                WHERE tickets.id = ?
            `)
            .get(ticketId);

        return res.status(201).json({
            message:
                "Chamado criado com sucesso.",
            ticket,
        });

    } catch (error) {
        console.error(
            "Erro ao criar chamado:",
            error
        );

        return res.status(500).json({
            error:
                "Erro interno ao criar chamado.",
        });
    }
}

// ========================================
// LISTAR CHAMADOS DO USUÁRIO
// ========================================

function listTickets(req, res) {
    try {
        const tickets = db
            .prepare(`
                SELECT
                    tickets.*,

                    creator.name AS creator_name,

                    technician.name AS technician_name

                FROM tickets

                LEFT JOIN users AS creator
                    ON creator.id = tickets.created_by

                LEFT JOIN users AS technician
                    ON technician.id = tickets.assigned_to

                WHERE tickets.created_by = ?

                ORDER BY tickets.created_at DESC
            `)
            .all(req.user.id);

        return res.status(200).json({
            tickets,
        });

    } catch (error) {
        console.error(
            "Erro ao listar chamados:",
            error
        );

        return res.status(500).json({
            error:
                "Erro interno ao listar chamados.",
        });
    }
}

// ========================================
// BUSCAR UM CHAMADO
// ========================================

function getTicket(req, res) {
    try {
        const { id } = req.params;

        const ticket = db
            .prepare(`
                SELECT
                    tickets.*,

                    creator.name AS creator_name,
                    creator.email AS creator_email,

                    technician.name AS technician_name,
                    technician.email AS technician_email

                FROM tickets

                LEFT JOIN users AS creator
                    ON creator.id = tickets.created_by

                LEFT JOIN users AS technician
                    ON technician.id = tickets.assigned_to

                WHERE tickets.id = ?
            `)
            .get(id);

        // ========================================
        // CHAMADO NÃO EXISTE
        // ========================================

        if (!ticket) {
            return res.status(404).json({
                error:
                    "Chamado não encontrado.",
            });
        }

        // ========================================
        // USUÁRIO SÓ PODE VER O PRÓPRIO CHAMADO
        // ========================================

        if (
            req.user.role === "user" &&
            ticket.created_by !== req.user.id
        ) {
            return res.status(403).json({
                error:
                    "Você não possui permissão para visualizar este chamado.",
            });
        }

        return res.status(200).json({
            ticket,
        });

    } catch (error) {
        console.error(
            "Erro ao buscar chamado:",
            error
        );

        return res.status(500).json({
            error:
                "Erro interno ao buscar chamado.",
        });
    }
}

// ========================================
// EXPORTAÇÕES
// ========================================

module.exports = {
    createTicket,
    listTickets,
    getTicket,
};