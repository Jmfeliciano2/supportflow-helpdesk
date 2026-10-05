import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import request from "../services/api";

function Dashboard() {
    const navigate = useNavigate();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        try {
            const data = await request("/tickets");

            setTickets(data);

        } catch (error) {
            console.error(error);

        } finally {
            setLoading(false);
        }
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    }

    const openTickets = tickets.filter(
        ticket => ticket.status === "open"
    ).length;

    const inProgressTickets = tickets.filter(
        ticket => ticket.status === "in_progress"
    ).length;

    const resolvedTickets = tickets.filter(
        ticket => ticket.status === "resolved"
    ).length;

    return (
        <div className="app">

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

            <main className="container">

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

                <section className="stats">

                    <div className="stat-card">
                        <span>Abertos</span>
                        <strong>{openTickets}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Em andamento</span>
                        <strong>{inProgressTickets}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Resolvidos</span>
                        <strong>{resolvedTickets}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Total</span>
                        <strong>{tickets.length}</strong>
                    </div>

                </section>

                <section className="tickets-section">

                    <div className="section-header">
                        <h2>Chamados recentes</h2>

                        <Link to="/chamados">
                            Ver todos
                        </Link>
                    </div>

                    {loading ? (
                        <p>Carregando...</p>
                    ) : tickets.length === 0 ? (
                        <p>
                            Você ainda não possui chamados.
                        </p>
                    ) : (
                        <div className="ticket-list">

                            {tickets.slice(0, 5).map(ticket => (

                                <Link
                                    key={ticket.id}
                                    to={`/chamados/${ticket.id}`}
                                    className="ticket-row"
                                >

                                    <div>
                                        <strong>
                                            #{ticket.id} {ticket.title}
                                        </strong>

                                        <span>
                                            {ticket.category}
                                        </span>
                                    </div>

                                    <span
                                        className={`priority ${ticket.priority}`}
                                    >
                                        {ticket.priority}
                                    </span>

                                    <span
                                        className={`status ${ticket.status}`}
                                    >
                                        {ticket.status}
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