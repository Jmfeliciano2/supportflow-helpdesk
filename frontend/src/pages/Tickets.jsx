import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import request from "../services/api";

function Tickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        try {
            setLoading(true);
            setError("");

            const data = await request("/tickets");

            // Aceita tanto [ ... ] quanto { tickets: [ ... ] }
            setTickets(data.tickets || data || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
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

    function translatePriority(priority) {
        const priorities = {
            low: "Baixa",
            medium: "Média",
            high: "Alta",
            critical: "Crítica",
        };

        return priorities[priority] || priority;
    }

    function formatDate(date) {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("pt-BR");
    }

    return (
        <div className="my-tickets-page">
            <div className="my-tickets-container">

                <div className="my-tickets-top">
                    <div>
                        <Link
                            to="/dashboard"
                            className="back-link"
                        >
                            ← Voltar para o dashboard
                        </Link>

                        <h1>Meus chamados</h1>

                        <p>
                            Acompanhe os chamados que você abriu.
                        </p>
                    </div>

                    <Link
                        to="/chamados/novo"
                        className="btn-new-ticket"
                    >
                        + Novo chamado
                    </Link>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="tickets-loading">
                        Carregando chamados...
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="tickets-empty">

                        <h2>Nenhum chamado encontrado</h2>

                        <p>
                            Você ainda não abriu nenhum chamado.
                        </p>

                        <Link
                            to="/chamados/novo"
                            className="btn-new-ticket"
                        >
                            Abrir primeiro chamado
                        </Link>

                    </div>
                ) : (
                    <div className="my-tickets-card">

                        <div className="my-tickets-table-wrapper">

                            <table className="my-tickets-table">

                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Título</th>
                                        <th>Categoria</th>
                                        <th>Prioridade</th>
                                        <th>Status</th>
                                        <th>Data</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id}>

                                            <td>
                                                #{ticket.id}
                                            </td>

                                            <td className="ticket-title-cell">
                                                {ticket.title}
                                            </td>

                                            <td>
                                                {ticket.category}
                                            </td>

                                            <td>
                                                <span
                                                    className={`priority priority-${ticket.priority}`}
                                                >
                                                    {translatePriority(
                                                        ticket.priority
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`status status-${ticket.status}`}
                                                >
                                                    {translateStatus(
                                                        ticket.status
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(
                                                    ticket.created_at
                                                )}
                                            </td>

                                            <td>
                                                <Link
                                                    to={`/chamados/${ticket.id}`}
                                                    className="ticket-view-link"
                                                >
                                                    Visualizar
                                                </Link>
                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}

export default Tickets;