const db = require("../database/database");

// ========================================
// LISTAR COMENTÁRIOS DO CHAMADO
// ========================================

function listComments(req, res) {
    try {
        const { id } = req.params;

        // Buscar chamado
        const ticket = db
            .prepare(`
                SELECT *
                FROM tickets
                WHERE id = ?
            `)
            .get(id);

        if (!ticket) {
            return res.status(404).json({
                error: "Chamado não encontrado.",
            });
        }

        // Usuário comum só pode visualizar
        // comentários dos próprios chamados
        if (
            req.user.role === "user" &&
            ticket.created_by !== req.user.id
        ) {
            return res.status(403).json({
                error:
                    "Você não possui permissão para visualizar este chamado.",
            });
        }

        // Buscar comentários
        const comments = db
            .prepare(`
                SELECT
                    ticket_comments.id,
                    ticket_comments.ticket_id,
                    ticket_comments.user_id,
                    ticket_comments.message,
                    ticket_comments.created_at,

                    users.name AS user_name,
                    users.email AS user_email,
                    users.role AS user_role

                FROM ticket_comments

                INNER JOIN users
                    ON users.id = ticket_comments.user_id

                WHERE ticket_comments.ticket_id = ?

                ORDER BY
                    ticket_comments.created_at ASC,
                    ticket_comments.id ASC
            `)
            .all(id);

        return res.status(200).json({
            comments,
        });
    } catch (error) {
        console.error(
            "Erro ao listar comentários:",
            error
        );

        return res.status(500).json({
            error:
                "Erro interno ao listar comentários.",
        });
    }
}

// ========================================
// CRIAR COMENTÁRIO
// ========================================

function createComment(req, res) {
    try {
        const { id } = req.params;
        const { message } = req.body;

        // ========================================
        // VALIDAR MENSAGEM
        // ========================================

        if (
            !message ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                error: "Digite uma mensagem.",
            });
        }

        const cleanMessage = message.trim();

        if (cleanMessage.length > 1000) {
            return res.status(400).json({
                error:
                    "A mensagem deve possuir no máximo 1000 caracteres.",
            });
        }

        // ========================================
        // BUSCAR CHAMADO
        // ========================================

        const ticket = db
            .prepare(`
                SELECT *
                FROM tickets
                WHERE id = ?
            `)
            .get(id);

        if (!ticket) {
            return res.status(404).json({
                error: "Chamado não encontrado.",
            });
        }

        // ========================================
        // REGRA DO USUÁRIO
        // ========================================

        // Usuário comum só pode responder
        // o próprio chamado.

        if (
            req.user.role === "user" &&
            ticket.created_by !== req.user.id
        ) {
            return res.status(403).json({
                error:
                    "Você não possui permissão para responder este chamado.",
            });
        }

        // ========================================
        // REGRA DO TÉCNICO
        // ========================================

        // O técnico precisa assumir o chamado
        // antes de enviar mensagens.

        if (
            req.user.role === "technician" &&
            ticket.assigned_to !== req.user.id
        ) {
            return res.status(403).json({
                error:
                    "Você precisa assumir o chamado antes de responder.",
            });
        }

        // ========================================
        // ADMIN
        // ========================================

        // O administrador não entra na condição
        // acima, portanto pode responder qualquer
        // chamado.

        // ========================================
        // SALVAR COMENTÁRIO
        // ========================================

        const result = db
            .prepare(`
                INSERT INTO ticket_comments (
                    ticket_id,
                    user_id,
                    message
                )
                VALUES (?, ?, ?)
            `)
            .run(
                id,
                req.user.id,
                cleanMessage
            );

        // ========================================
        // BUSCAR COMENTÁRIO CRIADO
        // ========================================

        const comment = db
            .prepare(`
                SELECT
                    ticket_comments.id,
                    ticket_comments.ticket_id,
                    ticket_comments.user_id,
                    ticket_comments.message,
                    ticket_comments.created_at,

                    users.name AS user_name,
                    users.email AS user_email,
                    users.role AS user_role

                FROM ticket_comments

                INNER JOIN users
                    ON users.id = ticket_comments.user_id

                WHERE ticket_comments.id = ?
            `)
            .get(result.lastInsertRowid);

        return res.status(201).json({
            message:
                "Mensagem enviada com sucesso.",
            comment,
        });
    } catch (error) {
        console.error(
            "Erro ao criar comentário:",
            error
        );

        return res.status(500).json({
            error:
                "Erro interno ao enviar mensagem.",
        });
    }
}

module.exports = {
    listComments,
    createComment,
};