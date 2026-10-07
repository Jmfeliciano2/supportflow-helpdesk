const db = require("../database/database");

// ========================================
// LISTAR TODOS OS CHAMADOS
// ========================================

function listAllTickets(req, res) {
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
                tickets.due_at,
                tickets.resolved_at,
                tickets.created_by,
                tickets.assigned_to,

                creator.name AS created_by_name,
                creator.email AS created_by_email,

                technician.name AS assigned_to_name

            FROM tickets

            INNER JOIN users AS creator
                ON creator.id = tickets.created_by

            LEFT JOIN users AS technician
                ON technician.id = tickets.assigned_to

            ORDER BY tickets.created_at DESC
        `).all();

        return res.status(200).json(tickets);

    } catch (error) {
        console.error(
            "Erro ao listar chamados:",
            error
        );

        return res.status(500).json({
            error: "Erro ao buscar chamados.",
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

                creator.name AS created_by_name,
                creator.email AS created_by_email,

                technician.name AS assigned_to_name

            FROM tickets

            INNER JOIN users AS creator
                ON creator.id = tickets.created_by

            LEFT JOIN users AS technician
                ON technician.id = tickets.assigned_to

            WHERE tickets.id = ?
        `).get(id);

        if (!ticket) {
            return res.status(404).json({
                error: "Chamado não encontrado.",
            });
        }

        return res.status(200).json(ticket);

    } catch (error) {
        console.error(
            "Erro ao buscar chamado:",
            error
        );

        return res.status(500).json({
            error: "Erro ao buscar chamado.",
        });
    }
}

// ========================================
// ASSUMIR CHAMADO
// ========================================

function assignTicket(req, res) {
    try {
        const { id } = req.params;

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
        // JÁ POSSUI OUTRO TÉCNICO
        // ========================================

        if (
            ticket.assigned_to &&
            ticket.assigned_to !== req.user.id
        ) {
            return res.status(409).json({
                error:
                    "Este chamado já possui um técnico responsável.",
            });
        }

        // ========================================
        // JÁ ESTÁ ATRIBUÍDO AO MESMO TÉCNICO
        // ========================================

        if (
            ticket.assigned_to ===
            req.user.id
        ) {
            return res.status(200).json({
                message:
                    "Este chamado já está atribuído a você.",
            });
        }

        // ========================================
        // ATRIBUIR CHAMADO
        // ========================================

        db.prepare(`
            UPDATE tickets
            SET
                assigned_to = ?,
                status = 'in_progress',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            req.user.id,
            id
        );

        // ========================================
        // HISTÓRICO - ATRIBUIÇÃO
        // ========================================

        db.prepare(`
            INSERT INTO ticket_history (
                ticket_id,
                user_id,
                action
            )
            VALUES (?, ?, ?)
        `).run(
            id,
            req.user.id,
            "ticket_assigned"
        );

        // ========================================
        // HISTÓRICO - STATUS
        // ========================================

        if (
            ticket.status !==
            "in_progress"
        ) {
            db.prepare(`
                INSERT INTO ticket_history (
                    ticket_id,
                    user_id,
                    action,
                    old_value,
                    new_value
                )
                VALUES (?, ?, ?, ?, ?)
            `).run(
                id,
                req.user.id,
                "status_changed",
                ticket.status,
                "in_progress"
            );
        }

        // ========================================
        // BUSCAR ATUALIZADO
        // ========================================

        const updatedTicket =
            db.prepare(`
                SELECT
                    tickets.*,

                    creator.name
                        AS created_by_name,

                    creator.email
                        AS created_by_email,

                    technician.name
                        AS assigned_to_name

                FROM tickets

                INNER JOIN users AS creator
                    ON creator.id =
                        tickets.created_by

                LEFT JOIN users AS technician
                    ON technician.id =
                        tickets.assigned_to

                WHERE tickets.id = ?
            `).get(id);

        return res.status(200).json({
            message:
                "Chamado atribuído com sucesso.",

            ticket: updatedTicket,
        });

    } catch (error) {
        console.error(
            "Erro ao atribuir chamado:",
            error
        );

        return res.status(500).json({
            error:
                "Erro ao atribuir chamado.",
        });
    }
}

// ========================================
// ALTERAR STATUS
// ========================================

function updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "open",
            "in_progress",
            "waiting",
            "resolved",
        ];

        // ========================================
        // VALIDAR STATUS
        // ========================================

        if (!status) {
            return res.status(400).json({
                error:
                    "Informe o status.",
            });
        }

        if (
            !allowedStatuses.includes(
                status
            )
        ) {
            return res.status(400).json({
                error:
                    "Status inválido.",
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
                error:
                    "Chamado não encontrado.",
            });
        }

        // ========================================
        // VERIFICAR RESPONSÁVEL
        // ========================================

        /*
            ADMIN:
            Pode alterar qualquer chamado.

            TECHNICIAN:
            Só pode alterar chamados
            atribuídos a ele.
        */

        if (
            req.user.role ===
                "technician" &&
            ticket.assigned_to !==
                req.user.id
        ) {
            return res.status(403).json({
                error:
                    "Você precisa ser o técnico responsável para alterar o status deste chamado.",
            });
        }

        // ========================================
        // EVITAR ALTERAÇÃO DESNECESSÁRIA
        // ========================================

        if (
            ticket.status === status
        ) {
            return res.status(200).json({
                message:
                    "O chamado já possui este status.",

                ticket,
            });
        }

        // ========================================
        // RESOLVIDO
        // ========================================

        /*
            Se o novo status for "resolved",
            salvamos o momento da resolução.

            CURRENT_TIMESTAMP no SQLite
            utiliza UTC, assim como nossas
            outras datas.
        */

        if (status === "resolved") {

            db.prepare(`
                UPDATE tickets
                SET
                    status = ?,
                    resolved_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                status,
                id
            );

        } else {

            /*
                Se o chamado estava resolvido
                e foi reaberto, removemos
                resolved_at.

                Isso permite que uma nova
                resolução seja registrada.
            */

            db.prepare(`
                UPDATE tickets
                SET
                    status = ?,
                    resolved_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                status,
                id
            );
        }

        // ========================================
        // REGISTRAR HISTÓRICO
        // ========================================

        db.prepare(`
            INSERT INTO ticket_history (
                ticket_id,
                user_id,
                action,
                old_value,
                new_value
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            id,
            req.user.id,
            "status_changed",
            ticket.status,
            status
        );

        // ========================================
        // BUSCAR CHAMADO ATUALIZADO
        // ========================================

        const updatedTicket =
            db.prepare(`
                SELECT
                    tickets.*,

                    creator.name
                        AS created_by_name,

                    creator.email
                        AS created_by_email,

                    technician.name
                        AS assigned_to_name

                FROM tickets

                INNER JOIN users AS creator
                    ON creator.id =
                        tickets.created_by

                LEFT JOIN users AS technician
                    ON technician.id =
                        tickets.assigned_to

                WHERE tickets.id = ?
            `).get(id);

        // ========================================
        // CALCULAR RESULTADO DO SLA
        // ========================================

        let slaStatus = null;

        if (
            updatedTicket.status ===
                "resolved" &&
            updatedTicket.resolved_at &&
            updatedTicket.due_at
        ) {
            const resolvedDate =
                parseSQLiteDate(
                    updatedTicket.resolved_at
                );

            const dueDate =
                parseDatabaseDate(
                    updatedTicket.due_at
                );

            if (
                resolvedDate &&
                dueDate
            ) {
                slaStatus =
                    resolvedDate.getTime() <=
                    dueDate.getTime()
                        ? "met"
                        : "breached";
            }
        }

        return res.status(200).json({
            message:
                "Status atualizado com sucesso.",

            ticket: updatedTicket,

            sla_status: slaStatus,
        });

    } catch (error) {
        console.error(
            "Erro ao atualizar status:",
            error
        );

        return res.status(500).json({
            error:
                "Erro ao atualizar status.",
        });
    }
}

// ========================================
// FUNÇÕES AUXILIARES DE DATA
// ========================================

function parseSQLiteDate(value) {
    if (!value) {
        return null;
    }

    /*
        SQLite:
        2026-10-07 14:35:21

        CURRENT_TIMESTAMP representa UTC.
    */

    const date =
        new Date(
            value.replace(
                " ",
                "T"
            ) + "Z"
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
}

function parseDatabaseDate(value) {
    if (!value) {
        return null;
    }

    /*
        due_at novo:

        2026-10-07T22:35:21.000Z
    */

    if (
        /[zZ]$/.test(value) ||
        /[+-]\d{2}:\d{2}$/.test(value)
    ) {
        const date =
            new Date(value);

        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;
    }

    /*
        Compatibilidade com registros antigos
        que não possuem informação de timezone.
    */

    const date =
        new Date(
            value.replace(
                " ",
                "T"
            ) + "Z"
        );

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}

// ========================================
// EXPORTAÇÕES
// ========================================

module.exports = {
    listAllTickets,
    getTicket,
    assignTicket,
    updateStatus,
};