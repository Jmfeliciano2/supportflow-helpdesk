import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import request from "../services/api";

function TechnicianTicketDetails() {
    const { id } = useParams();

    // ========================================
    // ESTADOS
    // ========================================

    const [ticket, setTicket] = useState(null);
    const [status, setStatus] = useState("");

    const [comments, setComments] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // ========================================
    // CARREGAR DADOS
    // ========================================

    useEffect(() => {
        loadTicket();
    }, [id]);

    function normalizeComments(data) {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.comments)) {
            return data.comments;
        }

        return [];
    }

    function normalizeHistory(data) {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.history)) {
            return data.history;
        }

        return [];
    }

    async function loadTicket() {
        try {
            setLoading(true);
            setError("");

            const [
                ticketData,
                commentsData,
                historyData,
            ] = await Promise.all([
                request(`/technician/tickets/${id}`),
                request(`/tickets/${id}/comments`),
                request(`/tickets/${id}/history`),
            ]);

            const loadedTicket =
                ticketData?.ticket || ticketData;

            setTicket(loadedTicket);

            setStatus(
                loadedTicket?.status || ""
            );

            setComments(
                normalizeComments(commentsData)
            );

            setHistory(
                normalizeHistory(historyData)
            );
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Erro ao carregar chamado."
            );
        } finally {
            setLoading(false);
        }
    }

    // ========================================
    // ASSUMIR CHAMADO
    // ========================================

    async function assignTicket() {
        try {
            setAssigning(true);
            setMessage("");
            setError("");

            await request(
                `/technician/tickets/${id}/assign`,
                {
                    method: "PUT",
                }
            );

            setMessage(
                "Chamado atribuído a você com sucesso."
            );

            await loadTicket();
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Erro ao assumir chamado."
            );
        } finally {
            setAssigning(false);
        }
    }

    // ========================================
    // ATUALIZAR STATUS
    // ========================================

    async function updateStatus() {
        try {
            setUpdatingStatus(true);
            setMessage("");
            setError("");

            await request(
                `/technician/tickets/${id}/status`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        status,
                    }),
                }
            );

            setMessage(
                "Status atualizado com sucesso."
            );

            await loadTicket();
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Erro ao atualizar status."
            );
        } finally {
            setUpdatingStatus(false);
        }
    }

    // ========================================
    // ENVIAR MENSAGEM
    // ========================================

    async function sendMessage(event) {
        event.preventDefault();

        const cleanMessage =
            newMessage.trim();

        if (!cleanMessage) {
            return;
        }

        if (cleanMessage.length > 1000) {
            setError(
                "A mensagem deve possuir no máximo 1000 caracteres."
            );

            return;
        }

        try {
            setSending(true);
            setMessage("");
            setError("");

            await request(
                `/tickets/${id}/comments`,
                {
                    method: "POST",

                    body: JSON.stringify({
                        message: cleanMessage,
                    }),
                }
            );

            setNewMessage("");

            const commentsData =
                await request(
                    `/tickets/${id}/comments`
                );

            setComments(
                normalizeComments(commentsData)
            );
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Erro ao enviar mensagem."
            );
        } finally {
            setSending(false);
        }
    }

    // ========================================
    // TRADUZIR STATUS
    // ========================================

    function translateStatus(value) {
        const statuses = {
            open: "Aberto",
            in_progress: "Em andamento",
            waiting: "Aguardando usuário",
            resolved: "Resolvido",
        };

        return statuses[value] || value;
    }

    // ========================================
    // TRADUZIR PRIORIDADE
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

    // ========================================
    // DATAS / UTC
    // ========================================

    function parseDatabaseDate(date) {
        if (!date) {
            return null;
        }

        /*
         * Data ISO que já possui timezone.
         *
         * Exemplo:
         * 2026-10-07T22:35:21.000Z
         */
        if (
            date.includes("T") &&
            (
                date.endsWith("Z") ||
                /[+-]\d{2}:\d{2}$/.test(date)
            )
        ) {
            return new Date(date);
        }

        /*
         * SQLite CURRENT_TIMESTAMP retorna:
         *
         * 2026-10-07 14:35:21
         *
         * O horário representa UTC.
         * Adicionamos T e Z para informar isso
         * corretamente ao navegador.
         */

        const utcDate =
            date.replace(" ", "T") + "Z";

        return new Date(utcDate);
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
    // SLA
    // ========================================

    function getSlaInfo() {
        if (!ticket?.due_at) {
            return {
                text: "Prazo não definido",
                className: "sla-neutral",
            };
        }

        if (ticket.status === "resolved") {
            return {
                text: "Chamado resolvido",
                className: "sla-resolved",
            };
        }

        const dueDate =
            parseDatabaseDate(ticket.due_at);

        if (
            !dueDate ||
            Number.isNaN(dueDate.getTime())
        ) {
            return {
                text: "Prazo inválido",
                className: "sla-neutral",
            };
        }

        const now = new Date();

        const difference =
            dueDate.getTime() -
            now.getTime();

        // ========================================
        // SLA VENCIDO
        // ========================================

        if (difference <= 0) {
            const expiredHours =
                Math.ceil(
                    Math.abs(difference) /
                        (1000 * 60 * 60)
                );

            return {
                text:
                    expiredHours === 1
                        ? "SLA vencido há 1h"
                        : `SLA vencido há ${expiredHours}h`,

                className: "sla-expired",
            };
        }

        // ========================================
        // TEMPO RESTANTE
        // ========================================

        const hoursRemaining =
            Math.ceil(
                difference /
                    (1000 * 60 * 60)
            );

        // Até 4 horas para vencer
        if (hoursRemaining <= 4) {
            return {
                text:
                    hoursRemaining === 1
                        ? "1h restante"
                        : `${hoursRemaining}h restantes`,

                className: "sla-warning",
            };
        }

        return {
            text:
                `${hoursRemaining}h restantes`,

            className: "sla-ok",
        };
    }

    // ========================================
    // TÍTULO DA ATIVIDADE
    // ========================================

    function getHistoryTitle(item) {
        if (
            item.action ===
            "ticket_created"
        ) {
            return "Chamado criado";
        }

        if (
            item.action ===
            "ticket_assigned"
        ) {
            return "Chamado assumido";
        }

        if (
            item.action ===
            "status_changed"
        ) {
            return "Status alterado";
        }

        return "Atividade registrada";
    }

    // ========================================
    // DESCRIÇÃO DA ATIVIDADE
    // ========================================

    function getHistoryDescription(item) {
        if (
            item.action ===
            "ticket_created"
        ) {
            return `${
                item.user_name || "Usuário"
            } criou o chamado.`;
        }

        if (
            item.action ===
            "ticket_assigned"
        ) {
            return `${
                item.user_name || "Técnico"
            } assumiu o chamado.`;
        }

        if (
            item.action ===
            "status_changed"
        ) {
            return `${translateStatus(
                item.old_value
            )} → ${translateStatus(
                item.new_value
            )}`;
        }

        return "Alteração realizada no chamado.";
    }

    // ========================================
    // LOADING
    // ========================================

    if (loading) {
        return (
            <div className="page-container">
                <p>
                    Carregando chamado...
                </p>
            </div>
        );
    }

    // ========================================
    // CHAMADO NÃO ENCONTRADO
    // ========================================

    if (!ticket) {
        return (
            <div className="page-container">

                <div className="error-message">
                    {error ||
                        "Chamado não encontrado."}
                </div>

                <Link
                    to="/tecnico"
                    className="back-link"
                >
                    ← Voltar para chamados
                </Link>

            </div>
        );
    }

    const slaInfo =
        getSlaInfo();

    // ========================================
    // PÁGINA
    // ========================================

    return (
        <div className="page-container">

            {/* ========================================
                CABEÇALHO
            ======================================== */}

            <div className="ticket-details-header">

                <div>

                    <Link
                        to="/tecnico"
                        className="back-link"
                    >
                        ← Voltar para chamados
                    </Link>

                    <h1>
                        #{ticket.id} -{" "}
                        {ticket.title}
                    </h1>

                    <span
                        className={`status status-${ticket.status}`}
                    >
                        {translateStatus(
                            ticket.status
                        )}
                    </span>

                </div>

            </div>

            {/* ========================================
                SUCESSO
            ======================================== */}

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {/* ========================================
                ERRO
            ======================================== */}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* ========================================
                GRID PRINCIPAL
            ======================================== */}

            <div className="ticket-details-grid">

                {/* ========================================
                    COLUNA ESQUERDA
                ======================================== */}

                <div>

                    {/* SOLICITANTE */}

                    <div className="ticket-main-card">

                        <h2>
                            Solicitante
                        </h2>

                        <p>
                            <strong>
                                Nome:
                            </strong>{" "}

                            {ticket.created_by_name ||
                                ticket.creator_name ||
                                "Não informado"}
                        </p>

                        <p>
                            <strong>
                                E-mail:
                            </strong>{" "}

                            {ticket.created_by_email ||
                                ticket.creator_email ||
                                "Não informado"}
                        </p>

                        <hr />

                        <h2>
                            Descrição do problema
                        </h2>

                        <p className="ticket-description">
                            {ticket.description}
                        </p>

                    </div>

                    {/* ========================================
                        HISTÓRICO DE MENSAGENS
                    ======================================== */}

                    <section className="comments-card">

                        <div className="comments-header">

                            <div>

                                <h2>
                                    Histórico do chamado
                                </h2>

                                <p>
                                    Comunicação entre técnico
                                    e solicitante.
                                </p>

                            </div>

                            <span className="comments-count">

                                {comments.length}{" "}

                                {comments.length === 1
                                    ? "mensagem"
                                    : "mensagens"}

                            </span>

                        </div>

                        <div className="comments-list">

                            {comments.length === 0 ? (

                                <div className="no-comments">

                                    <p>
                                        Ainda não há mensagens
                                        neste chamado.
                                    </p>

                                </div>

                            ) : (

                                comments.map(
                                    (comment) => {

                                        const isStaff =
                                            comment.user_role ===
                                                "technician" ||
                                            comment.user_role ===
                                                "admin";

                                        return (
                                            <div
                                                key={comment.id}

                                                className={`comment ${
                                                    isStaff
                                                        ? "comment-technician"
                                                        : "comment-user"
                                                }`}
                                            >

                                                <div className="comment-header">

                                                    <div>

                                                        <strong>
                                                            {comment.user_name}
                                                        </strong>

                                                        <span className="comment-role">

                                                            {comment.user_role ===
                                                            "technician"
                                                                ? "Técnico"
                                                                : comment.user_role ===
                                                                  "admin"
                                                                ? "Administrador"
                                                                : "Solicitante"}

                                                        </span>

                                                    </div>

                                                    <time>
                                                        {formatDate(
                                                            comment.created_at
                                                        )}
                                                    </time>

                                                </div>

                                                <p>
                                                    {comment.message}
                                                </p>

                                            </div>
                                        );
                                    }
                                )

                            )}

                        </div>

                        {/* ========================================
                            FORMULÁRIO DE RESPOSTA
                        ======================================== */}

                        <form
                            className="comment-form"
                            onSubmit={sendMessage}
                        >

                            <label htmlFor="technician-message">
                                Responder ao solicitante
                            </label>

                            <textarea
                                id="technician-message"

                                value={newMessage}

                                onChange={(event) =>
                                    setNewMessage(
                                        event.target.value
                                    )
                                }

                                placeholder="Digite sua resposta..."

                                rows="4"

                                maxLength="1000"
                            />

                            <div className="comment-form-footer">

                                <span>
                                    {newMessage.length}/1000
                                </span>

                                <button
                                    type="submit"

                                    className="btn-send-message"

                                    disabled={
                                        sending ||
                                        !newMessage.trim()
                                    }
                                >
                                    {sending
                                        ? "Enviando..."
                                        : "Enviar resposta"}
                                </button>

                            </div>

                        </form>

                    </section>

                    {/* ========================================
                        HISTÓRICO DE ATIVIDADES
                    ======================================== */}

                    <section className="activity-card">

                        <div className="activity-header">

                            <div>

                                <h2>
                                    Atividades
                                </h2>

                                <p>
                                    Histórico de alterações
                                    do chamado.
                                </p>

                            </div>

                        </div>

                        {history.length === 0 ? (

                            <div className="no-activities">
                                Nenhuma atividade
                                registrada ainda.
                            </div>

                        ) : (

                            <div className="activity-timeline">

                                {history.map(
                                    (item) => (

                                        <div
                                            className="activity-item"
                                            key={item.id}
                                        >

                                            <div className="activity-marker">

                                                <div className="activity-dot" />

                                                <div className="activity-line" />

                                            </div>

                                            <div className="activity-content">

                                                <div className="activity-title">

                                                    <strong>
                                                        {getHistoryTitle(
                                                            item
                                                        )}
                                                    </strong>

                                                    <time>
                                                        {formatDate(
                                                            item.created_at
                                                        )}
                                                    </time>

                                                </div>

                                                <p>
                                                    {getHistoryDescription(
                                                        item
                                                    )}
                                                </p>

                                                {item.user_name && (

                                                    <span className="activity-user">

                                                        Por{" "}
                                                        {item.user_name}

                                                    </span>

                                                )}

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                </div>

                {/* ========================================
                    COLUNA DIREITA
                ======================================== */}

                <div className="ticket-sidebar">

                    {/* ========================================
                        INFORMAÇÕES
                    ======================================== */}

                    <div className="ticket-info-card">

                        <h3>
                            Informações
                        </h3>

                        <p>

                            <strong>
                                Categoria
                            </strong>

                            <span>
                                {ticket.category}
                            </span>

                        </p>

                        <p>

                            <strong>
                                Prioridade
                            </strong>

                            <span>
                                {translatePriority(
                                    ticket.priority
                                )}
                            </span>

                        </p>

                        {/* ========================================
                            SLA
                        ======================================== */}

                        <p>

                            <strong>
                                Prazo do SLA
                            </strong>

                            <span>
                                {ticket.due_at
                                    ? formatDate(
                                          ticket.due_at
                                      )
                                    : "Não definido"}
                            </span>

                        </p>

                        <p>

                            <strong>
                                Situação do SLA
                            </strong>

                            <span
                                className={`sla-badge ${slaInfo.className}`}
                            >
                                {slaInfo.text}
                            </span>

                        </p>

                        <p>

                            <strong>
                                Status
                            </strong>

                            <span>
                                {translateStatus(
                                    ticket.status
                                )}
                            </span>

                        </p>

                        <p>

                            <strong>
                                Técnico
                            </strong>

                            <span>
                                {ticket.assigned_to_name ||
                                    ticket.technician_name ||
                                    "Não atribuído"}
                            </span>

                        </p>

                        <p>

                            <strong>
                                Criado em
                            </strong>

                            <span>
                                {formatDate(
                                    ticket.created_at
                                )}
                            </span>

                        </p>

                        {ticket.updated_at && (

                            <p>

                                <strong>
                                    Atualizado em
                                </strong>

                                <span>
                                    {formatDate(
                                        ticket.updated_at
                                    )}
                                </span>

                            </p>

                        )}

                    </div>

                    {/* ========================================
                        ASSUMIR CHAMADO
                    ======================================== */}

                    {!ticket.assigned_to && (

                        <button
                            type="button"

                            className="btn-primary full-width"

                            onClick={assignTicket}

                            disabled={assigning}
                        >
                            {assigning
                                ? "Assumindo..."
                                : "Assumir chamado"}
                        </button>

                    )}

                    {/* ========================================
                        ALTERAR STATUS
                    ======================================== */}

                    <div className="ticket-info-card">

                        <h3>
                            Alterar status
                        </h3>

                        <select
                            value={status}

                            onChange={(event) =>
                                setStatus(
                                    event.target.value
                                )
                            }
                        >

                            <option value="open">
                                Aberto
                            </option>

                            <option value="in_progress">
                                Em andamento
                            </option>

                            <option value="waiting">
                                Aguardando usuário
                            </option>

                            <option value="resolved">
                                Resolvido
                            </option>

                        </select>

                        <button
                            type="button"

                            className="btn-primary full-width"

                            onClick={updateStatus}

                            disabled={
                                updatingStatus ||
                                status === ticket.status
                            }
                        >
                            {updatingStatus
                                ? "Atualizando..."
                                : "Atualizar status"}
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default TechnicianTicketDetails;