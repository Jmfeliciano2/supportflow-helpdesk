import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import request from "../services/api";
import "../admin.css";

function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const [changingUserId, setChangingUserId] =
        useState(null);

    const currentUser = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        if (!message && !error) {
            return undefined;
        }

        const timer = setTimeout(() => {
            setMessage("");
            setError("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [message, error]);

    async function loadDashboard() {
        try {
            setLoading(true);
            setError("");

            const [statsData, usersData] =
                await Promise.all([
                    request("/admin/stats"),
                    request("/admin/users"),
                ]);

            setStats(statsData);

            if (Array.isArray(usersData)) {
                setUsers(usersData);
            } else if (
                Array.isArray(usersData?.users)
            ) {
                setUsers(usersData.users);
            } else {
                setUsers([]);
            }

        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "Erro ao carregar painel."
            );
        } finally {
            setLoading(false);
        }
    }

    async function changeRole(userId, role) {
        try {
            setChangingUserId(userId);

            setError("");
            setMessage("");

            await request(
                `/admin/users/${userId}/role`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        role,
                    }),
                }
            );

            setMessage(
                "Perfil atualizado com sucesso."
            );

            await loadDashboard();

        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "Erro ao alterar perfil."
            );

        } finally {
            setChangingUserId(null);
        }
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    }

    function translateRole(role) {
        const roles = {
            user: "Usuário",
            technician: "Técnico",
            admin: "Administrador",
        };

        return roles[role] || role;
    }

    // ========================================
    // DATAS
    // ========================================

    function parseDatabaseDate(date) {
        if (!date) {
            return null;
        }

        if (date instanceof Date) {
            return date;
        }

        const value = String(date);

        if (
            /[zZ]$/.test(value) ||
            /[+-]\d{2}:\d{2}$/.test(value)
        ) {
            return new Date(value);
        }

        return new Date(
            value.replace(" ", "T") + "Z"
        );
    }

    function formatDate(date) {
        const parsedDate =
            parseDatabaseDate(date);

        if (
            !parsedDate ||
            Number.isNaN(parsedDate.getTime())
        ) {
            return "-";
        }

        return parsedDate.toLocaleString(
            "pt-BR"
        );
    }

    // ========================================
    // FORMATAR TEMPO MÉDIO
    // ========================================

    function formatResolutionTime(hours) {
        const totalHours =
            Number(hours) || 0;

        if (totalHours <= 0) {
            return "0h";
        }

        const wholeHours =
            Math.floor(totalHours);

        const minutes =
            Math.round(
                (totalHours - wholeHours) * 60
            );

        if (wholeHours === 0) {
            return `${minutes}min`;
        }

        if (minutes === 0) {
            return `${wholeHours}h`;
        }

        return `${wholeHours}h ${minutes}min`;
    }

    function calculatePercentage(value) {
        const total =
            stats?.tickets?.total || 0;

        if (total === 0) {
            return 0;
        }

        return Math.round(
            (value / total) * 100
        );
    }

    const filteredUsers = useMemo(() => {
        const safeUsers =
            Array.isArray(users)
                ? users
                : [];

        return safeUsers.filter((user) => {
            const term =
                search.toLowerCase().trim();

            const matchesSearch =
                !term ||
                user.name
                    ?.toLowerCase()
                    .includes(term) ||
                user.email
                    ?.toLowerCase()
                    .includes(term);

            const matchesRole =
                roleFilter === "all" ||
                user.role === roleFilter;

            return (
                matchesSearch &&
                matchesRole
            );
        });

    }, [users, search, roleFilter]);

    if (loading) {
        return (
            <div className="page-container">
                <p>
                    Carregando painel
                    administrativo...
                </p>
            </div>
        );
    }

    // ========================================
    // ESTATÍSTICAS
    // ========================================

    const ticketStats =
        stats?.tickets || {};

    const slaStats =
        stats?.sla || {};

    const priorityStats =
        stats?.priorities || {};

    const categoryStats =
        stats?.categories || {};

    const open =
        ticketStats.open || 0;

    const inProgress =
        ticketStats.in_progress || 0;

    const waiting =
        ticketStats.waiting || 0;

    const resolved =
        ticketStats.resolved || 0;

    const slaMet =
        slaStats.met || 0;

    const slaBreached =
        slaStats.breached || 0;

    const slaExpired =
        slaStats.expired || 0;

    const slaWarning =
        slaStats.warning || 0;

    const complianceRate =
        Number(
            slaStats.compliance_rate
        ) || 0;

    const averageResolutionHours =
        Number(
            slaStats.average_resolution_hours
        ) || 0;

    // ========================================
    // PRIORIDADES
    // ========================================

    const lowPriority =
        priorityStats.low || 0;

    const mediumPriority =
        priorityStats.medium || 0;

    const highPriority =
        priorityStats.high || 0;

    const criticalPriority =
        priorityStats.critical || 0;

    const pendingCritical =
        priorityStats.pending_critical || 0;


    // ========================================
    // CATEGORIAS
    // ========================================

    const hardwareTickets =
        categoryStats.hardware || 0;

    const softwareTickets =
        categoryStats.software || 0;

    const networkTickets =
        categoryStats.network || 0;

    const accessTickets =
        categoryStats.access || 0;

    const emailTickets =
        categoryStats.email || 0;

    const otherTickets =
        categoryStats.others || 0;

    return (
        <div className="admin-dashboard">

            <div className="page-container">

                {/* ========================================
                    CABEÇALHO
                ======================================== */}

                <header className="admin-header">

                    <div>
                        <span className="dashboard-label">
                            Administração
                        </span>

                        <h1>
                            Olá,{" "}
                            {currentUser.name ||
                                "Administrador"}
                        </h1>

                        <p>
                            Visão geral e gerenciamento
                            do SupportFlow.
                        </p>
                    </div>

                    <div className="admin-header-actions">

                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() =>
                                navigate("/tecnico")
                            }
                        >
                            Gerenciar chamados
                        </button>

                        <button
                            type="button"
                            className="btn-logout"
                            onClick={logout}
                        >
                            Sair
                        </button>

                    </div>

                </header>

                {message && (
                    <div className="success-message">
                        <span className="toast-icon">✅</span>
                        <span>{message}</span>
                        <button
                            type="button"
                            className="toast-close"
                            aria-label="Fechar mensagem"
                            onClick={() => setMessage("")}
                        >
                            ×
                        </button>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        <span className="toast-icon">⚠️</span>
                        <span>{error}</span>
                        <button
                            type="button"
                            className="toast-close"
                            aria-label="Fechar mensagem"
                            onClick={() => setError("")}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* ========================================
                    VISÃO GERAL
                ======================================== */}

                <section className="admin-section">

                    <div className="admin-section-title">

                        <h2>
                            Visão geral
                        </h2>

                        <p>
                            Principais números da
                            plataforma.
                        </p>

                    </div>

                    <div className="admin-cards">

                        <div className="admin-stat-card">
                            <span>
                                Chamados
                            </span>

                            <strong>
                                {ticketStats.total || 0}
                            </strong>

                            <p>
                                Total registrado
                            </p>
                        </div>

                        <div className="admin-stat-card">
                            <span>
                                Abertos
                            </span>

                            <strong>
                                {open}
                            </strong>

                            <p>
                                Aguardando atendimento
                            </p>
                        </div>

                        <div className="admin-stat-card">
                            <span>
                                Em andamento
                            </span>

                            <strong>
                                {inProgress}
                            </strong>

                            <p>
                                Sendo atendidos
                            </p>
                        </div>

                        <div className="admin-stat-card">
                            <span>
                                Aguardando
                            </span>

                            <strong>
                                {waiting}
                            </strong>

                            <p>
                                Aguardando retorno
                            </p>
                        </div>

                        <div className="admin-stat-card">
                            <span>
                                Resolvidos
                            </span>

                            <strong>
                                {resolved}
                            </strong>

                            <p>
                                Atendimento concluído
                            </p>
                        </div>

                    </div>

                </section>

                {/* ========================================
                    INDICADORES DE SLA
                ======================================== */}

                <section className="admin-section sla-admin-section">

                    <div className="admin-section-title">

                        <h2>
                            Indicadores de SLA
                        </h2>

                        <p>
                            Desempenho dos atendimentos
                            em relação aos prazos definidos.
                        </p>

                    </div>

                    <div className="sla-admin-cards">

                        <div className="sla-admin-card sla-card-success">

                            <span>
                                SLA cumprido
                            </span>

                            <strong>
                                {slaMet}
                            </strong>

                            <p>
                                Resolvidos dentro do prazo
                            </p>

                        </div>

                        <div className="sla-admin-card sla-card-danger">

                            <span>
                                SLA violado
                            </span>

                            <strong>
                                {slaBreached}
                            </strong>

                            <p>
                                Resolvidos após o prazo
                            </p>

                        </div>

                        <div className="sla-admin-card sla-card-rate">

                            <span>
                                Taxa de cumprimento
                            </span>

                            <strong>
                                {complianceRate}%
                            </strong>

                            <p>
                                Dos chamados avaliados
                            </p>

                        </div>

                        <div className="sla-admin-card">

                            <span>
                                Tempo médio
                            </span>

                            <strong>
                                {formatResolutionTime(
                                    averageResolutionHours
                                )}
                            </strong>

                            <p>
                                Tempo médio de resolução
                            </p>

                        </div>

                        <div className="sla-admin-card sla-card-warning">

                            <span>
                                SLA em atenção
                            </span>

                            <strong>
                                {slaWarning}
                            </strong>

                            <p>
                                Vencem nas próximas 4 horas
                            </p>

                        </div>

                        <div className="sla-admin-card sla-card-danger">

                            <span>
                                SLA vencido
                            </span>

                            <strong>
                                {slaExpired}
                            </strong>

                            <p>
                                Chamados ainda não resolvidos
                            </p>

                        </div>

                    </div>

                    {/* ========================================
                        BARRA DE CUMPRIMENTO
                    ======================================== */}

                    <div className="sla-compliance-card">

                        <div className="sla-compliance-header">

                            <div>
                                <strong>
                                    Cumprimento do SLA
                                </strong>

                                <span>
                                    Chamados resolvidos
                                    dentro do prazo
                                </span>
                            </div>

                            <strong className="sla-compliance-number">
                                {complianceRate}%
                            </strong>

                        </div>

                        <div className="sla-compliance-track">

                            <div
                                className="sla-compliance-fill"
                                style={{
                                    width:
                                        `${Math.min(
                                            complianceRate,
                                            100
                                        )}%`,
                                }}
                            />

                        </div>

                    </div>

                </section>

                {/* ========================================
                    DISTRIBUIÇÃO
                ======================================== */}

                <section className="admin-chart-card">

                    <div className="admin-section-title">

                        <h2>
                            Distribuição dos chamados
                        </h2>

                        <p>
                            Percentual de chamados por
                            status.
                        </p>

                    </div>

                    <div className="status-chart">

                        <StatusBar
                            label="Abertos"
                            value={open}
                            percentage={
                                calculatePercentage(
                                    open
                                )
                            }
                            type="open"
                        />

                        <StatusBar
                            label="Em andamento"
                            value={inProgress}
                            percentage={
                                calculatePercentage(
                                    inProgress
                                )
                            }
                            type="progress"
                        />

                        <StatusBar
                            label="Aguardando"
                            value={waiting}
                            percentage={
                                calculatePercentage(
                                    waiting
                                )
                            }
                            type="waiting"
                        />

                        <StatusBar
                            label="Resolvidos"
                            value={resolved}
                            percentage={
                                calculatePercentage(
                                    resolved
                                )
                            }
                            type="resolved"
                        />

                    </div>

                </section>

                {/* ========================================
    RELATÓRIOS
======================================== */}

                <section className="admin-reports-grid">

                    {/* PRIORIDADES */}

                    <div className="admin-chart-card">

                        <div className="admin-section-title">

                            <h2>
                                Chamados por prioridade
                            </h2>

                            <p>
                                Distribuição dos chamados
                                conforme o nível de urgência.
                            </p>

                        </div>

                        <div className="status-chart">

                            <StatusBar
                                label="Baixa"
                                value={lowPriority}
                                percentage={
                                    calculatePercentage(
                                        lowPriority
                                    )
                                }
                                type="low"
                            />

                            <StatusBar
                                label="Média"
                                value={mediumPriority}
                                percentage={
                                    calculatePercentage(
                                        mediumPriority
                                    )
                                }
                                type="medium"
                            />

                            <StatusBar
                                label="Alta"
                                value={highPriority}
                                percentage={
                                    calculatePercentage(
                                        highPriority
                                    )
                                }
                                type="high"
                            />

                            <StatusBar
                                label="Crítica"
                                value={criticalPriority}
                                percentage={
                                    calculatePercentage(
                                        criticalPriority
                                    )
                                }
                                type="critical"
                            />

                        </div>

                        <div className="critical-summary">

                            <span>
                                Chamados críticos pendentes
                            </span>

                            <strong>
                                {pendingCritical}
                            </strong>

                        </div>

                    </div>


                    {/* CATEGORIAS */}

                    <div className="admin-chart-card">

                        <div className="admin-section-title">

                            <h2>
                                Chamados por categoria
                            </h2>

                            <p>
                                Áreas que mais geram
                                solicitações de suporte.
                            </p>

                        </div>

                        <div className="status-chart">

                            <StatusBar
                                label="Hardware"
                                value={hardwareTickets}
                                percentage={
                                    calculatePercentage(
                                        hardwareTickets
                                    )
                                }
                                type="category"
                            />

                            <StatusBar
                                label="Software"
                                value={softwareTickets}
                                percentage={
                                    calculatePercentage(
                                        softwareTickets
                                    )
                                }
                                type="category"
                            />

                            <StatusBar
                                label="Rede"
                                value={networkTickets}
                                percentage={
                                    calculatePercentage(
                                        networkTickets
                                    )
                                }
                                type="category"
                            />

                            <StatusBar
                                label="Acesso"
                                value={accessTickets}
                                percentage={
                                    calculatePercentage(
                                        accessTickets
                                    )
                                }
                                type="category"
                            />

                            <StatusBar
                                label="E-mail"
                                value={emailTickets}
                                percentage={
                                    calculatePercentage(
                                        emailTickets
                                    )
                                }
                                type="category"
                            />

                            <StatusBar
                                label="Outros"
                                value={otherTickets}
                                percentage={
                                    calculatePercentage(
                                        otherTickets
                                    )
                                }
                                type="category"
                            />

                        </div>

                    </div>

                </section>




                {/* ========================================
                    CONTAS
                ======================================== */}

                <section className="admin-section">

                    <div className="admin-section-title">

                        <h2>
                            Contas do sistema
                        </h2>

                        <p>
                            Distribuição dos usuários
                            por perfil.
                        </p>

                    </div>

                    <div className="admin-cards user-stats">

                        <div className="admin-stat-card">

                            <span>
                                Total de contas
                            </span>

                            <strong>
                                {stats?.users?.total || 0}
                            </strong>

                        </div>

                        <div className="admin-stat-card">

                            <span>
                                Usuários
                            </span>

                            <strong>
                                {stats?.users?.normal || 0}
                            </strong>

                        </div>

                        <div className="admin-stat-card">

                            <span>
                                Técnicos
                            </span>

                            <strong>
                                {stats?.users
                                    ?.technicians || 0}
                            </strong>

                        </div>

                        <div className="admin-stat-card">

                            <span>
                                Administradores
                            </span>

                            <strong>
                                {stats?.users?.admins || 0}
                            </strong>

                        </div>

                    </div>

                </section>

                {/* ========================================
                    GERENCIAMENTO DE USUÁRIOS
                ======================================== */}

                <section className="admin-users-card">

                    <div className="admin-users-header">

                        <div>

                            <h2>
                                Gerenciar usuários
                            </h2>

                            <p>
                                Consulte contas e altere
                                níveis de acesso.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="btn-refresh"
                            onClick={loadDashboard}
                        >
                            Atualizar
                        </button>

                    </div>

                    {/* FILTROS */}

                    <div className="admin-filters">

                        <div>

                            <label>
                                Buscar usuário
                            </label>

                            <input
                                type="text"
                                placeholder="Nome ou e-mail..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                        <div>

                            <label>
                                Perfil
                            </label>

                            <select
                                value={roleFilter}
                                onChange={(event) =>
                                    setRoleFilter(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="all">
                                    Todos
                                </option>

                                <option value="user">
                                    Usuários
                                </option>

                                <option value="technician">
                                    Técnicos
                                </option>

                                <option value="admin">
                                    Administradores
                                </option>

                            </select>

                        </div>

                    </div>

                    {/* TABELA */}

                    <div className="table-container">

                        <table className="tickets-table">

                            <thead>

                                <tr>
                                    <th>Nome</th>
                                    <th>E-mail</th>
                                    <th>Perfil</th>
                                    <th>Cadastro</th>
                                    <th>
                                        Alterar perfil
                                    </th>
                                </tr>

                            </thead>

                            <tbody>

                                {filteredUsers.map(
                                    (user) => (

                                        <tr key={user.id}>

                                            <td>

                                                <strong>
                                                    {user.name}
                                                </strong>

                                                {user.id ===
                                                    currentUser.id && (

                                                        <span className="you-badge">
                                                            Você
                                                        </span>

                                                    )}

                                            </td>

                                            <td>
                                                {user.email}
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `role-badge role-${user.role}`
                                                    }
                                                >
                                                    {translateRole(
                                                        user.role
                                                    )}
                                                </span>

                                            </td>

                                            <td>
                                                {formatDate(
                                                    user.created_at
                                                )}
                                            </td>

                                            <td>

                                                {user.id ===
                                                    currentUser.id ? (

                                                    <span className="own-account">
                                                        Sua conta
                                                    </span>

                                                ) : (

                                                    <select
                                                        className="role-select"
                                                        value={
                                                            user.role
                                                        }
                                                        disabled={
                                                            changingUserId ===
                                                            user.id
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            changeRole(
                                                                user.id,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >

                                                        <option value="user">
                                                            Usuário
                                                        </option>

                                                        <option value="technician">
                                                            Técnico
                                                        </option>

                                                        <option value="admin">
                                                            Administrador
                                                        </option>

                                                    </select>

                                                )}

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                    {filteredUsers.length === 0 && (

                        <div className="empty-tickets">
                            Nenhum usuário encontrado.
                        </div>

                    )}

                </section>

            </div>

        </div>
    );
}

// ========================================
// BARRA DE STATUS
// ========================================

function StatusBar({
    label,
    value,
    percentage,
    type,
}) {
    return (
        <div className="status-chart-item">

            <div className="status-chart-header">

                <span>
                    {label}
                </span>

                <strong>
                    {value} ({percentage}%)
                </strong>

            </div>

            <div className="status-chart-track">

                <div
                    className={
                        `status-chart-fill status-chart-${type}`
                    }
                    style={{
                        width:
                            `${percentage}%`,
                    }}
                />

            </div>

        </div>
    );
}

export default AdminDashboard;