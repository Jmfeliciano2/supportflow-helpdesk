import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import request from "../services/api";


function TechnicianDashboard() {

    const navigate = useNavigate();

    // ========================================
    // ESTADOS
    // ========================================

    const [tickets, setTickets] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("all");

    const [
        priorityFilter,
        setPriorityFilter,
    ] = useState("all");

    const [
        categoryFilter,
        setCategoryFilter,
    ] = useState("all");

    const [
        slaFilter,
        setSlaFilter,
    ] = useState("all");


    // ========================================
    // USUÁRIO LOGADO
    // ========================================

    const user = JSON.parse(
        localStorage.getItem("user") ||
        "{}"
    );


    // ========================================
    // CARREGAR AO ABRIR
    // ========================================

    useEffect(() => {
        loadTickets();
    }, []);


    // ========================================
    // CARREGAR CHAMADOS
    // ========================================

    async function loadTickets() {

        try {

            setLoading(true);
            setError("");

            const data =
                await request(
                    "/technician/tickets"
                );


            // Garante que tickets
            // sempre seja um array

            if (Array.isArray(data)) {

                setTickets(data);

            } else if (
                Array.isArray(
                    data?.tickets
                )
            ) {

                setTickets(
                    data.tickets
                );

            } else {

                console.error(
                    "Formato inesperado:",
                    data
                );

                setTickets([]);
            }

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Erro ao carregar chamados."
            );

            setTickets([]);

        } finally {

            setLoading(false);
        }
    }


    // ========================================
    // LOGOUT
    // ========================================

    function logout() {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        navigate("/login");
    }


    // ========================================
    // TRADUÇÃO DE STATUS
    // ========================================

    function translateStatus(status) {

        const statuses = {

            open:
                "Aberto",

            in_progress:
                "Em andamento",

            waiting:
                "Aguardando",

            resolved:
                "Resolvido",
        };

        return (
            statuses[status] ||
            status
        );
    }


    // ========================================
    // TRADUÇÃO DE PRIORIDADE
    // ========================================

    function translatePriority(
        priority
    ) {

        const priorities = {

            low:
                "Baixa",

            medium:
                "Média",

            high:
                "Alta",

            critical:
                "Crítica",
        };

        return (
            priorities[priority] ||
            priority
        );
    }


    // ========================================
    // DATAS / UTC
    // ========================================

    function parseDatabaseDate(date) {

        if (!date) {
            return null;
        }

        if (date instanceof Date) {
            return date;
        }

        const value =
            String(date);


        /*
         * ISO com timezone
         *
         * Exemplo:
         * 2026-10-07T22:35:21.000Z
         */

        if (
            /[zZ]$/.test(value) ||
            /[+-]\d{2}:\d{2}$/.test(
                value
            )
        ) {

            return new Date(
                value
            );
        }


        /*
         * SQLite CURRENT_TIMESTAMP
         *
         * Exemplo:
         * 2026-10-07 14:35:21
         *
         * O SQLite armazena esse
         * horário em UTC.
         */

        const utcDate =
            value.replace(
                " ",
                "T"
            ) + "Z";


        return new Date(
            utcDate
        );
    }


    function formatDate(date) {

        const parsedDate =
            parseDatabaseDate(
                date
            );


        if (
            !parsedDate ||
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {

            return "-";
        }


        return (
            parsedDate
                .toLocaleString(
                    "pt-BR"
                )
        );
    }


    // ========================================
    // SLA
    // ========================================

    function getSlaInfo(ticket) {

        // Sem prazo configurado

        if (!ticket?.due_at) {

            return {

                type:
                    "neutral",

                text:
                    "Sem prazo",

                className:
                    "sla-neutral",

                remaining:
                    Infinity,
            };
        }


        // Chamado resolvido

        if (
            ticket.status ===
            "resolved"
        ) {

            return {

                type:
                    "resolved",

                text:
                    "Resolvido",

                className:
                    "sla-resolved",

                remaining:
                    Infinity,
            };
        }


        const dueDate =
            parseDatabaseDate(
                ticket.due_at
            );


        if (
            !dueDate ||
            Number.isNaN(
                dueDate.getTime()
            )
        ) {

            return {

                type:
                    "neutral",

                text:
                    "Prazo inválido",

                className:
                    "sla-neutral",

                remaining:
                    Infinity,
            };
        }


        const now =
            new Date();


        const difference =
            dueDate.getTime() -
            now.getTime();


        // ====================================
        // SLA VENCIDO
        // ====================================

        if (difference <= 0) {

            const expiredHours =
                Math.ceil(
                    Math.abs(
                        difference
                    ) /
                    (
                        1000 *
                        60 *
                        60
                    )
                );


            return {

                type:
                    "expired",

                text:
                    expiredHours === 1

                        ? "Vencido há 1h"

                        : `Vencido há ${expiredHours}h`,

                className:
                    "sla-expired",

                remaining:
                    difference,
            };
        }


        const hoursRemaining =
            Math.ceil(
                difference /
                (
                    1000 *
                    60 *
                    60
                )
            );


        // ====================================
        // SLA EM ATENÇÃO
        // Até 4 horas para vencer
        // ====================================

        if (
            hoursRemaining <= 4
        ) {

            return {

                type:
                    "warning",

                text:
                    hoursRemaining === 1

                        ? "1h restante"

                        : `${hoursRemaining}h restantes`,

                className:
                    "sla-warning",

                remaining:
                    difference,
            };
        }


        // ====================================
        // SLA NORMAL
        // ====================================

        return {

            type:
                "ok",

            text:
                `${hoursRemaining}h restantes`,

            className:
                "sla-ok",

            remaining:
                difference,
        };
    }


    // ========================================
    // GARANTIR ARRAY
    // ========================================

    const safeTickets =
        Array.isArray(tickets)

            ? tickets

            : [];


    // ========================================
    // CONTADORES
    // ========================================

    const totalTickets =
        safeTickets.length;


    const openTickets =
        safeTickets.filter(
            (ticket) =>
                ticket.status ===
                "open"
        ).length;


    const inProgressTickets =
        safeTickets.filter(
            (ticket) =>
                ticket.status ===
                "in_progress"
        ).length;


    const waitingTickets =
        safeTickets.filter(
            (ticket) =>
                ticket.status ===
                "waiting"
        ).length;


    const resolvedTickets =
        safeTickets.filter(
            (ticket) =>
                ticket.status ===
                "resolved"
        ).length;


    // ========================================
    // SLA VENCIDO
    // ========================================

    const expiredSlaTickets =
        safeTickets.filter(
            (ticket) =>
                getSlaInfo(
                    ticket
                ).type ===
                "expired"
        ).length;


    // ========================================
    // SLA EM ATENÇÃO
    // ========================================

    const warningSlaTickets =
        safeTickets.filter(
            (ticket) =>
                getSlaInfo(
                    ticket
                ).type ===
                "warning"
        ).length;


    // ========================================
    // FILTROS + ORDENAÇÃO
    // ========================================

    const filteredTickets =
        useMemo(() => {

            const filtered =
                safeTickets.filter(
                    (ticket) => {

                        // ====================
                        // BUSCA
                        // ====================

                        const searchValue =
                            search
                                .toLowerCase()
                                .trim();


                        const requester =
                            ticket
                                .created_by_name ||

                            ticket
                                .creator_name ||

                            "";


                        const matchesSearch =

                            !searchValue ||

                            ticket.title
                                ?.toLowerCase()
                                .includes(
                                    searchValue
                                ) ||

                            requester
                                .toLowerCase()
                                .includes(
                                    searchValue
                                ) ||

                            String(
                                ticket.id
                            ).includes(
                                searchValue
                            );


                        // ====================
                        // STATUS
                        // ====================

                        const matchesStatus =

                            statusFilter ===
                                "all" ||

                            ticket.status ===
                                statusFilter;


                        // ====================
                        // PRIORIDADE
                        // ====================

                        const matchesPriority =

                            priorityFilter ===
                                "all" ||

                            ticket.priority ===
                                priorityFilter;


                        // ====================
                        // CATEGORIA
                        // ====================

                        const matchesCategory =

                            categoryFilter ===
                                "all" ||

                            ticket.category ===
                                categoryFilter;


                        // ====================
                        // SLA
                        // ====================

                        const sla =
                            getSlaInfo(
                                ticket
                            );


                        const matchesSla =

                            slaFilter ===
                                "all" ||

                            sla.type ===
                                slaFilter;


                        return (

                            matchesSearch &&

                            matchesStatus &&

                            matchesPriority &&

                            matchesCategory &&

                            matchesSla
                        );
                    }
                );


            /*
             * ORDENAÇÃO
             *
             * 1 - SLA vencido
             * 2 - SLA em atenção
             * 3 - Dentro do prazo
             * 4 - Sem prazo
             * 5 - Resolvidos
             */

            return filtered.sort(
                (a, b) => {

                    const slaA =
                        getSlaInfo(a);

                    const slaB =
                        getSlaInfo(b);


                    const order = {

                        expired:
                            0,

                        warning:
                            1,

                        ok:
                            2,

                        neutral:
                            3,

                        resolved:
                            4,
                    };


                    if (
                        order[slaA.type] !==
                        order[slaB.type]
                    ) {

                        return (

                            order[slaA.type] -
                            order[slaB.type]
                        );
                    }


                    return (

                        slaA.remaining -
                        slaB.remaining
                    );
                }
            );

        }, [

            tickets,

            search,

            statusFilter,

            priorityFilter,

            categoryFilter,

            slaFilter,
        ]);


    // ========================================
    // LIMPAR FILTROS
    // ========================================

    function clearFilters() {

        setSearch("");

        setStatusFilter(
            "all"
        );

        setPriorityFilter(
            "all"
        );

        setCategoryFilter(
            "all"
        );

        setSlaFilter(
            "all"
        );
    }


    // ========================================
    // VERIFICAR FILTROS ATIVOS
    // ========================================

    const hasActiveFilters =

        search.trim() !== "" ||

        statusFilter !==
            "all" ||

        priorityFilter !==
            "all" ||

        categoryFilter !==
            "all" ||

        slaFilter !==
            "all";


    // ========================================
    // LOADING
    // ========================================

    if (loading) {

        return (

            <div className="page-container">

                <p>
                    Carregando chamados...
                </p>

            </div>
        );
    }


    // ========================================
    // INTERFACE
    // ========================================

    return (

        <div className="technician-dashboard">

            <div className="page-container">


                {/* ========================================
                    CABEÇALHO
                ======================================== */}

                <header className="technician-header">

                    <div>

                        <span className="dashboard-label">
                            Painel técnico
                        </span>

                        <h1>

                            Olá,{" "}

                            {user.name ||
                                "Técnico"}

                        </h1>

                        <p>
                            Gerencie os chamados
                            enviados pelos usuários.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="btn-logout"
                        onClick={logout}
                    >
                        Sair
                    </button>

                </header>


                {/* ========================================
                    ERRO
                ======================================== */}

                {error && (

                    <div className="error-message">

                        {error}

                    </div>
                )}


                {/* ========================================
                    CARDS
                ======================================== */}

                <section className="dashboard-cards technician-cards">


                    {/* TOTAL */}

                    <div className="dashboard-card">

                        <span>
                            Total
                        </span>

                        <strong>
                            {totalTickets}
                        </strong>

                        <p>
                            Todos os chamados
                        </p>

                    </div>


                    {/* ABERTOS */}

                    <div className="dashboard-card">

                        <span>
                            Abertos
                        </span>

                        <strong>
                            {openTickets}
                        </strong>

                        <p>
                            Aguardando atendimento
                        </p>

                    </div>


                    {/* EM ANDAMENTO */}

                    <div className="dashboard-card">

                        <span>
                            Em andamento
                        </span>

                        <strong>
                            {inProgressTickets}
                        </strong>

                        <p>
                            Sendo atendidos
                        </p>

                    </div>


                    {/* AGUARDANDO */}

                    <div className="dashboard-card">

                        <span>
                            Aguardando
                        </span>

                        <strong>
                            {waitingTickets}
                        </strong>

                        <p>
                            Aguardando usuário
                        </p>

                    </div>


                    {/* RESOLVIDOS */}

                    <div className="dashboard-card">

                        <span>
                            Resolvidos
                        </span>

                        <strong>
                            {resolvedTickets}
                        </strong>

                        <p>
                            Atendimento concluído
                        </p>

                    </div>


                    {/* SLA EM ATENÇÃO */}

                    <div
                        className="
                            dashboard-card
                            sla-warning-card
                        "
                    >

                        <span>
                            SLA em atenção
                        </span>

                        <strong>
                            {warningSlaTickets}
                        </strong>

                        <p>
                            Até 4h para vencer
                        </p>

                    </div>


                    {/* SLA VENCIDO */}

                    <div
                        className="
                            dashboard-card
                            sla-expired-card
                        "
                    >

                        <span>
                            SLA vencido
                        </span>

                        <strong>
                            {expiredSlaTickets}
                        </strong>

                        <p>
                            Requer atenção
                        </p>

                    </div>

                </section>


                {/* ========================================
                    ÁREA DOS CHAMADOS
                ======================================== */}

                <section className="tickets-section">


                    <div className="tickets-section-header">

                        <div>

                            <h2>
                                Chamados
                            </h2>

                            <p>
                                Visualize e gerencie
                                os chamados cadastrados.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="btn-refresh"
                            onClick={
                                loadTickets
                            }
                        >
                            Atualizar
                        </button>

                    </div>


                    {/* ========================================
                        FILTROS
                    ======================================== */}

                    <div className="ticket-filters">


                        {/* BUSCA */}

                        <div className="ticket-search">

                            <label htmlFor="ticket-search">
                                Buscar
                            </label>

                            <input
                                id="ticket-search"
                                type="text"
                                value={search}
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="ID, título ou solicitante..."
                            />

                        </div>


                        {/* STATUS */}

                        <div className="ticket-filter">

                            <label htmlFor="status-filter">
                                Status
                            </label>

                            <select
                                id="status-filter"
                                value={
                                    statusFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setStatusFilter(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            >

                                <option value="all">
                                    Todos
                                </option>

                                <option value="open">
                                    Aberto
                                </option>

                                <option value="in_progress">
                                    Em andamento
                                </option>

                                <option value="waiting">
                                    Aguardando
                                </option>

                                <option value="resolved">
                                    Resolvido
                                </option>

                            </select>

                        </div>


                        {/* PRIORIDADE */}

                        <div className="ticket-filter">

                            <label htmlFor="priority-filter">
                                Prioridade
                            </label>

                            <select
                                id="priority-filter"
                                value={
                                    priorityFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setPriorityFilter(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            >

                                <option value="all">
                                    Todas
                                </option>

                                <option value="low">
                                    Baixa
                                </option>

                                <option value="medium">
                                    Média
                                </option>

                                <option value="high">
                                    Alta
                                </option>

                                <option value="critical">
                                    Crítica
                                </option>

                            </select>

                        </div>


                        {/* CATEGORIA */}

                        <div className="ticket-filter">

                            <label htmlFor="category-filter">
                                Categoria
                            </label>

                            <select
                                id="category-filter"
                                value={
                                    categoryFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryFilter(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            >

                                <option value="all">
                                    Todas
                                </option>

                                <option value="Hardware">
                                    Hardware
                                </option>

                                <option value="Software">
                                    Software
                                </option>

                                <option value="Rede">
                                    Rede
                                </option>

                                <option value="Acesso">
                                    Acesso
                                </option>

                                <option value="Email">
                                    E-mail
                                </option>

                                <option value="Outros">
                                    Outros
                                </option>

                            </select>

                        </div>


                        {/* SLA */}

                        <div className="ticket-filter">

                            <label htmlFor="sla-filter">
                                SLA
                            </label>

                            <select
                                id="sla-filter"
                                value={
                                    slaFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSlaFilter(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            >

                                <option value="all">
                                    Todos
                                </option>

                                <option value="expired">
                                    Vencidos
                                </option>

                                <option value="warning">
                                    Próximos de vencer
                                </option>

                                <option value="ok">
                                    Dentro do prazo
                                </option>

                                <option value="resolved">
                                    Resolvidos
                                </option>

                            </select>

                        </div>

                    </div>


                    {/* ========================================
                        RESULTADO DOS FILTROS
                    ======================================== */}

                    <div className="tickets-result-info">

                        <span>

                            {filteredTickets.length}{" "}

                            {filteredTickets.length === 1

                                ? "chamado encontrado"

                                : "chamados encontrados"
                            }


                            {hasActiveFilters && (

                                <>
                                    {" "}de{" "}
                                    {totalTickets}
                                </>

                            )}

                        </span>


                        {hasActiveFilters && (

                            <button
                                type="button"
                                className="btn-clear-filters"
                                onClick={
                                    clearFilters
                                }
                            >
                                Limpar filtros
                            </button>

                        )}

                    </div>


                    {/* ========================================
                        TABELA
                    ======================================== */}

                    {filteredTickets.length === 0 ? (

                        <div className="empty-tickets">

                            <h3>
                                Nenhum chamado encontrado
                            </h3>

                            <p>
                                Tente alterar os filtros
                                ou a pesquisa.
                            </p>

                            {hasActiveFilters && (

                                <button
                                    type="button"
                                    className="btn-clear-filters"
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    Limpar filtros
                                </button>

                            )}

                        </div>

                    ) : (

                        <div className="table-container">

                            <table className="tickets-table">

                                <thead>

                                    <tr>

                                        <th>
                                            ID
                                        </th>

                                        <th>
                                            Título
                                        </th>

                                        <th>
                                            Solicitante
                                        </th>

                                        <th>
                                            Categoria
                                        </th>

                                        <th>
                                            Prioridade
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            SLA
                                        </th>

                                        <th>
                                            Técnico
                                        </th>

                                        <th>
                                            Criado em
                                        </th>

                                        <th>
                                            Ação
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredTickets.map(
                                        (ticket) => {

                                            const sla =
                                                getSlaInfo(
                                                    ticket
                                                );


                                            return (

                                                <tr
                                                    key={
                                                        ticket.id
                                                    }
                                                    className={
                                                        sla.type ===
                                                        "expired"

                                                            ? "ticket-sla-expired-row"

                                                            : sla.type ===
                                                              "warning"

                                                            ? "ticket-sla-warning-row"

                                                            : ""
                                                    }
                                                >


                                                    {/* ID */}

                                                    <td>
                                                        #{ticket.id}
                                                    </td>


                                                    {/* TÍTULO */}

                                                    <td>

                                                        <strong>
                                                            {ticket.title}
                                                        </strong>

                                                    </td>


                                                    {/* SOLICITANTE */}

                                                    <td>

                                                        {
                                                            ticket
                                                                .created_by_name ||

                                                            ticket
                                                                .creator_name ||

                                                            "-"
                                                        }

                                                    </td>


                                                    {/* CATEGORIA */}

                                                    <td>
                                                        {
                                                            ticket.category ||
                                                            "-"
                                                        }
                                                    </td>


                                                    {/* PRIORIDADE */}

                                                    <td>

                                                        <span
                                                            className={
                                                                `priority priority-${ticket.priority}`
                                                            }
                                                        >

                                                            {
                                                                translatePriority(
                                                                    ticket.priority
                                                                )
                                                            }

                                                        </span>

                                                    </td>


                                                    {/* STATUS */}

                                                    <td>

                                                        <span
                                                            className={
                                                                `status status-${ticket.status}`
                                                            }
                                                        >

                                                            {
                                                                translateStatus(
                                                                    ticket.status
                                                                )
                                                            }

                                                        </span>

                                                    </td>


                                                    {/* SLA */}

                                                    <td>

                                                        <div className="technician-sla-cell">

                                                            <span
                                                                className={
                                                                    `sla-badge ${sla.className}`
                                                                }
                                                            >

                                                                {
                                                                    sla.text
                                                                }

                                                            </span>


                                                            {
                                                                ticket.due_at &&
                                                                (

                                                                    <small>

                                                                        até{" "}

                                                                        {
                                                                            formatDate(
                                                                                ticket.due_at
                                                                            )
                                                                        }

                                                                    </small>

                                                                )
                                                            }

                                                        </div>

                                                    </td>


                                                    {/* TÉCNICO */}

                                                    <td>

                                                        {
                                                            ticket
                                                                .assigned_to_name ||

                                                            ticket
                                                                .technician_name ||

                                                            "Não atribuído"
                                                        }

                                                    </td>


                                                    {/* DATA */}

                                                    <td>

                                                        {
                                                            formatDate(
                                                                ticket.created_at
                                                            )
                                                        }

                                                    </td>


                                                    {/* AÇÃO */}

                                                    <td>

                                                        <Link
                                                            to={
                                                                `/tecnico/chamados/${ticket.id}`
                                                            }
                                                            className="ticket-view-link"
                                                        >
                                                            Visualizar
                                                        </Link>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </div>

        </div>
    );
}


export default TechnicianDashboard;