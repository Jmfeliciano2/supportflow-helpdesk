import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import request from "../services/api";

function Dashboard() {
    const navigate = useNavigate();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        try {
            setLoading(true);
            setError("");

            const data = await request("/tickets");

            console.log(
                "Resposta da API /tickets:",
                data
            );

            if (Array.isArray(data)) {
                setTickets(data);
                return;
            }

            if (Array.isArray(data?.tickets)) {
                setTickets(data.tickets);
                return;
            }

            console.error(
                "A API /tickets não retornou um array:",
                data
            );

            setTickets([]);

        } catch (error) {
            console.error(
                "Erro ao carregar chamados:",
                error
            );

            setError(
                error.message ||
                "Não foi possível carregar os chamados."
            );

            setTickets([]);

        } finally {
            setLoading(false);
        }
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    }

    // Proteção adicional.
    // Mesmo que tickets receba algo errado,
    // a página não quebra.
    const safeTickets = Array.isArray(tickets)
        ? tickets
        : [];

    // ========================================
    // ESTATÍSTICAS
    // ========================================

    const openTickets = safeTickets.filter(
        (ticket) => ticket.status === "open"
    ).length;

    const inProgressTickets = safeTickets.filter(
        (ticket) =>
            ticket.status === "in_progress"
    ).length;

    const waitingTickets = safeTickets.filter(
        (ticket) => ticket.status === "waiting"
    ).length;

    const resolvedTickets = safeTickets.filter(
        (ticket) =>
            ticket.status === "resolved"
    ).length;

    // ========================================
    // TRADUÇÕES
    // ========================================

    function translatePriority(priority) {
        const priorities = {
            low: "Baixa",
            medium: "Média",
            high: "Alta",
            critical: "Crítica",
        };

        return priorities[priority] || priority;
    }

    function translateStatus(status) {
        const statuses = {
            open: "Aberto",
            in_progress: "Em andamento",
            waiting: "Aguardando",
            resolved: "Resolvido",
        };

        return statuses[status] || status;
    }

    return (
        <div className="app">

            {/* CABEÇALHO */}

            <header className="header">

                <div className="logo">
                    Support<span>Flow</span>
                </div>

                <nav>

                    <Link to="/dashboard">
                        Dashboard
                    </Link>

                    <Link to="/chamados">
                        Chamados
                    </Link>

                    <Link
                        className="new-ticket-link"
                        to="/chamados/novo"
                    >
                        + Novo chamado
                    </Link>

                    <button
                        className="logout-button"
                        onClick={logout}
                    >
                        Sair
                    </button>

                </nav>

            </header>

            {/* CONTEÚDO */}

            <main className="container">

                {/* BOAS-VINDAS */}

                <section className="welcome">

                    <div>

                        <h1>
                            Olá, {user.name || "Usuário"}
                        </h1>

                        <p>
                            Acompanhe seus chamados de suporte.
                        </p>

                    </div>

                    <Link
                        to="/chamados/novo"
                        className="primary-link"
                    >
                        + Abrir chamado
                    </Link>

                </section>

                {/* ERRO */}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* ESTATÍSTICAS */}

                <section className="stats">

                    <div className="stat-card">
                        <span>Abertos</span>
                        <strong>
                            {openTickets}
                        </strong>
                    </div>

                    <div className="stat-card">
                        <span>
                            Em andamento
                        </span>

                        <strong>
                            {inProgressTickets}
                        </strong>
                    </div>

                    <div className="stat-card">
                        <span>
                            Aguardando
                        </span>

                        <strong>
                            {waitingTickets}
                        </strong>
                    </div>

                    <div className="stat-card">
                        <span>
                            Resolvidos
                        </span>

                        <strong>
                            {resolvedTickets}
                        </strong>
                    </div>

                    <div className="stat-card">
                        <span>Total</span>

                        <strong>
                            {safeTickets.length}
                        </strong>
                    </div>

                </section>

                {/* CHAMADOS RECENTES */}

                <section className="tickets-section">

                    <div className="section-header">

                        <h2>
                            Chamados recentes
                        </h2>

                        <Link to="/chamados">
                            Ver todos
                        </Link>

                    </div>

                    {loading ? (

                        <p>
                            Carregando chamados...
                        </p>

                    ) : safeTickets.length === 0 ? (

                        <p>
                            Você ainda não possui chamados.
                        </p>

                    ) : (

                        <div className="ticket-list">

                            {safeTickets
                                .slice(0, 5)
                                .map((ticket) => (

                                    <Link
                                        key={ticket.id}
                                        to={`/chamados/${ticket.id}`}
                                        className="ticket-row"
                                    >

                                        <div>

                                            <strong>
                                                #{ticket.id}{" "}
                                                {ticket.title}
                                            </strong>

                                            <span>
                                                {ticket.category}
                                            </span>

                                        </div>

                                        <span
                                            className={`priority ${ticket.priority}`}
                                        >
                                            {translatePriority(
                                                ticket.priority
                                            )}
                                        </span>

                                        <span
                                            className={`status ${ticket.status}`}
                                        >
                                            {translateStatus(
                                                ticket.status
                                            )}
                                        </span>

                                    </Link>

                                ))}

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default Dashboard;