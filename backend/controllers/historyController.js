const db = require("../database/database");

// ========================================
// LISTAR HISTÓRICO DO CHAMADO
// ========================================

function listHistory(req, res) {
    try {
        const { id } = req.params;

        // Verifica se o chamado existe
        const ticket = db.prepare(`
            SELECT *
            FROM tickets
            WHERE id = ?
        `).get(id);

        if (!ticket) {
            return res.status(404).json({
                error: "Chamado não encontrado.",
            });
        }

        // Usuário comum só pode acessar
        // o histórico dos próprios chamados
        if (
            req.user.role === "user" &&
            ticket.created_by !== req.user.id
        ) {
            return res.status(403).json({
                error: "Você não possui acesso a este chamado.",
            });
        }

        // Busca o histórico
        const history = db.prepare(`
            SELECT
                ticket_history.id,
                ticket_history.ticket_id,
                ticket_history.action,
                ticket_history.old_value,
                ticket_history.new_value,
                ticket_history.created_at,

                users.id AS user_id,
                users.name AS user_name,
                users.role AS user_role

            FROM ticket_history

            LEFT JOIN users
                ON users.id = ticket_history.user_id

            WHERE ticket_history.ticket_id = ?

            ORDER BY
                ticket_history.created_at ASC,
                ticket_history.id ASC
        `).all(id);

        return res.status(200).json(history);

    } catch (error) {
        console.error(
            "Erro ao buscar histórico:",
            error
        );

        return res.status(500).json({
            error: "Erro ao buscar histórico do chamado.",
        });
    }
}

module.exports = {
    listHistory,
};