const db = require("../database/database");

// ========================================
// DASHBOARD / ESTATÍSTICAS
// ========================================

function getDashboardStats(req, res) {
    try {
        // ========================================
        // USUÁRIOS
        // ========================================

        const totalUsers = db.prepare(`
            SELECT COUNT(*) AS total
            FROM users
        `).get();

        const normalUsers = db.prepare(`
            SELECT COUNT(*) AS total
            FROM users
            WHERE role = 'user'
        `).get();

        const technicians = db.prepare(`
            SELECT COUNT(*) AS total
            FROM users
            WHERE role = 'technician'
        `).get();

        const admins = db.prepare(`
            SELECT COUNT(*) AS total
            FROM users
            WHERE role = 'admin'
        `).get();

        // ========================================
        // CHAMADOS
        // ========================================

        const totalTickets = db.prepare(`
            SELECT COUNT(*) AS total
            FROM tickets
        `).get();

        const openTickets = db.prepare(`
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE status = 'open'
        `).get();

        const inProgressTickets = db.prepare(`
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE status = 'in_progress'
        `).get();

        const waitingTickets = db.prepare(`
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE status = 'waiting'
        `).get();

        const resolvedTickets = db.prepare(`
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE status = 'resolved'
        `).get();

        // ========================================
        // SLA - CHAMADOS RESOLVIDOS
        // ========================================

        /*
            resolved_at e CURRENT_TIMESTAMP do SQLite
            representam UTC.

            due_at é armazenado em ISO UTC.

            Para evitar comparar textos em formatos
            diferentes, usamos julianday().
        */

        const slaMet = db.prepare(`
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE
                status = 'resolved'
                AND resolved_at IS NOT NULL
                AND due_at IS NOT NULL
                AND julianday(resolved_at)
                    <= julianday(due_at)
        `).get();

        const slaBreached = db.prepare(`
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE
                status = 'resolved'
                AND resolved_at IS NOT NULL
                AND due_at IS NOT NULL
                AND julianday(resolved_at)
                    > julianday(due_at)
        `).get();

        // ========================================
        // SLA - CHAMADOS AINDA NÃO RESOLVIDOS
        // ========================================

        const currentSlaExpired = db.prepare(`
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE
                status != 'resolved'
                AND due_at IS NOT NULL
                AND julianday('now')
                    > julianday(due_at)
        `).get();

        /*
            Em atenção:
            ainda não venceu, mas faltam
            no máximo 4 horas.
        */

        const currentSlaWarning = db.prepare(`
            SELECT COUNT(*) AS total
            FROM tickets
            WHERE
                status != 'resolved'
                AND due_at IS NOT NULL
                AND julianday(due_at)
                    > julianday('now')
                AND (
                    julianday(due_at)
                    - julianday('now')
                ) * 24 <= 4
        `).get();

        // ========================================
        // TAXA DE CUMPRIMENTO
        // ========================================

        const finishedWithSla =
            slaMet.total +
            slaBreached.total;

        let complianceRate = 0;

        if (finishedWithSla > 0) {
            complianceRate =
                (
                    slaMet.total /
                    finishedWithSla
                ) * 100;
        }

        complianceRate =
            Number(
                complianceRate.toFixed(1)
            );

        // ========================================
        // TEMPO MÉDIO DE RESOLUÇÃO
        // ========================================

        /*
            Resultado retornado em horas.

            Exemplo:
            6.5 = 6 horas e 30 minutos.
        */

        const averageResolution =
            db.prepare(`
                SELECT
                    AVG(
                        (
                            julianday(resolved_at)
                            -
                            julianday(created_at)
                        ) * 24
                    ) AS hours

                FROM tickets

                WHERE
                    status = 'resolved'
                    AND resolved_at IS NOT NULL
                    AND created_at IS NOT NULL
            `).get();

        let averageResolutionHours =
            averageResolution.hours;

        if (
            averageResolutionHours === null ||
            averageResolutionHours === undefined
        ) {
            averageResolutionHours = 0;
        }

        averageResolutionHours =
            Number(
                averageResolutionHours.toFixed(2)
            );

        // ========================================
        // RETORNO
        // ========================================


        // ========================================
// ESTATÍSTICAS POR PRIORIDADE
// ========================================

const lowPriority = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE priority = 'low'
`).get();

const mediumPriority = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE priority = 'medium'
`).get();

const highPriority = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE priority = 'high'
`).get();

const criticalPriority = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE priority = 'critical'
`).get();

const pendingCritical = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE
        priority = 'critical'
        AND status != 'resolved'
`).get();


// ========================================
// ESTATÍSTICAS POR CATEGORIA
// ========================================

const hardwareTickets = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE category = 'Hardware'
`).get();

const softwareTickets = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE category = 'Software'
`).get();

const networkTickets = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE category = 'Rede'
`).get();

const accessTickets = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE category = 'Acesso'
`).get();

const emailTickets = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE category = 'Email'
`).get();

const otherTickets = db.prepare(`
    SELECT COUNT(*) AS total
    FROM tickets
    WHERE category = 'Outros'
`).get();

        return res.status(200).json({
    users: {
        total: totalUsers.total,
        normal: normalUsers.total,
        technicians: technicians.total,
        admins: admins.total,
    },

    tickets: {
        total: totalTickets.total,
        open: openTickets.total,
        in_progress: inProgressTickets.total,
        waiting: waitingTickets.total,
        resolved: resolvedTickets.total,
    },

    sla: {
        met: slaMet.total,
        breached: slaBreached.total,
        compliance_rate: complianceRate,
        expired: currentSlaExpired.total,
        warning: currentSlaWarning.total,
        average_resolution_hours:
            averageResolutionHours,
    },

    priorities: {
        low: lowPriority.total,
        medium: mediumPriority.total,
        high: highPriority.total,
        critical: criticalPriority.total,
        pending_critical:
            pendingCritical.total,
    },

    categories: {
        hardware: hardwareTickets.total,
        software: softwareTickets.total,
        network: networkTickets.total,
        access: accessTickets.total,
        email: emailTickets.total,
        others: otherTickets.total,
    },
});
    } catch (error) {
        console.error(
            "Erro ao buscar estatísticas:",
            error
        );

        return res.status(500).json({
            error:
                "Erro ao buscar estatísticas.",
        });
    }
}


// ========================================
// LISTAR USUÁRIOS
// ========================================

function listUsers(req, res) {
    try {
        const users = db.prepare(`
            SELECT
                id,
                name,
                email,
                role,
                created_at
            FROM users
            ORDER BY created_at DESC
        `).all();

        return res.status(200).json(
            users
        );

    } catch (error) {
        console.error(
            "Erro ao listar usuários:",
            error
        );

        return res.status(500).json({
            error:
                "Erro ao buscar usuários.",
        });
    }
}


// ========================================
// BUSCAR UM USUÁRIO
// ========================================

function getUser(req, res) {
    try {
        const { id } = req.params;

        const user = db.prepare(`
            SELECT
                id,
                name,
                email,
                role,
                created_at
            FROM users
            WHERE id = ?
        `).get(id);

        if (!user) {
            return res.status(404).json({
                error:
                    "Usuário não encontrado.",
            });
        }

        return res
            .status(200)
            .json(user);

    } catch (error) {
        console.error(
            "Erro ao buscar usuário:",
            error
        );

        return res.status(500).json({
            error:
                "Erro ao buscar usuário.",
        });
    }
}


// ========================================
// ALTERAR CARGO / ROLE
// ========================================

function updateUserRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const allowedRoles = [
            "user",
            "technician",
            "admin",
        ];

        if (!role) {
            return res.status(400).json({
                error:
                    "Informe o novo perfil.",
            });
        }

        if (
            !allowedRoles.includes(role)
        ) {
            return res.status(400).json({
                error:
                    "Perfil inválido.",
            });
        }

        const user = db.prepare(`
            SELECT
                id,
                name,
                email,
                role
            FROM users
            WHERE id = ?
        `).get(id);

        if (!user) {
            return res.status(404).json({
                error:
                    "Usuário não encontrado.",
            });
        }

        /*
            Impede o administrador
            de alterar o próprio perfil.
        */

        if (
            Number(id) ===
            req.user.id
        ) {
            return res.status(400).json({
                error:
                    "Você não pode alterar o seu próprio perfil.",
            });
        }

        if (
            user.role === role
        ) {
            return res.status(200).json({
                message:
                    "O usuário já possui este perfil.",
            });
        }

        db.prepare(`
            UPDATE users
            SET role = ?
            WHERE id = ?
        `).run(
            role,
            id
        );

        const updatedUser =
            db.prepare(`
                SELECT
                    id,
                    name,
                    email,
                    role,
                    created_at
                FROM users
                WHERE id = ?
            `).get(id);

        return res.status(200).json({
            message:
                "Perfil atualizado com sucesso.",

            user:
                updatedUser,
        });

    } catch (error) {
        console.error(
            "Erro ao alterar perfil:",
            error
        );

        return res.status(500).json({
            error:
                "Erro ao alterar perfil do usuário.",
        });
    }
}


// ========================================
// EXPORTAÇÕES
// ========================================

module.exports = {
    getDashboardStats,
    listUsers,
    getUser,
    updateUserRole,
};