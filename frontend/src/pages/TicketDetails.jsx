import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import request from "../services/api";

function TicketDetails() {
    const { id } = useParams();

    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadPage();
    }, [id]);

    // ========================================
    // GARANTIR QUE COMENTÁRIOS SEJAM ARRAY
    // ========================================

    function normalizeComments(data) {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.comments)) {
            return data.comments;
        }

        return [];
    }

    // ========================================
    // CARREGAR CHAMADO
    // ========================================

    async function loadPage() {
        try {
            setLoading(true);
            setError("");

            const [ticketData, commentsData] =
                await Promise.all([
                    request(`/tickets/${id}`),
                    request(`/tickets/${id}/comments`),
                ]);

            // ========================================
            // CHAMADO
            // ========================================

            if (ticketData?.ticket) {
                setTicket(ticketData.ticket);
            } else {
                setTicket(ticketData);
            }

            // ========================================
            // COMENTÁRIOS
            // ========================================

            setComments(
                normalizeComments(commentsData)
            );
        } catch (error) {
            console.error(
                "Erro ao carregar chamado:",
                error
            );

            setError(
                error.message ||
                    "Não foi possível carregar o chamado."
            );
        } finally {
            setLoading(false);
        }
    }

    // ========================================
    // ENVIAR MENSAGEM
    // ========================================

    async function sendMessage(event) {
        event.preventDefault();

        const cleanMessage = newMessage.trim();

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
            setError("");
            setSuccess("");

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

            // ========================================
            // RECARREGAR COMENTÁRIOS
            // ========================================

            const updatedComments =
                await request(
                    `/tickets/${id}/comments`
                );

            setComments(
                normalizeComments(
                    updatedComments
                )
            );

            setSuccess(
                "Mensagem enviada com sucesso."
            );
        } catch (error) {
            console.error(
                "Erro ao enviar mensagem:",
                error
            );

            setError(
                error.message ||
                    "Não foi possível enviar a mensagem."
            );
        } finally {
            setSending(false);
        }
    }

    // ========================================
    // TRADUZIR STATUS
    // ========================================

    function translateStatus(status) {
        const statuses = {
            open: "Aberto",
            in_progress: "Em andamento",
            waiting: "Aguardando",
            resolved: "Resolvido",
        };

        return statuses[status] || status;
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
    // FORMATAR DATA
    // ========================================

    function parseDatabaseDate(date) {
    if (!date) {
        return null;
    }

    // Datas ISO que já possuem timezone:
    // 2026-10-07T22:35:21.000Z
    if (
        date.includes("T") &&
        (
            date.endsWith("Z") ||
            /[+-]\d{2}:\d{2}$/.test(date)
        )
    ) {
        return new Date(date);
    }

    // Datas geradas pelo SQLite CURRENT_TIMESTAMP:
    // 2026-10-07 14:35:21
    //
    // CURRENT_TIMESTAMP é UTC.
    // Adicionamos T e Z para informar isso ao JavaScript.
    const utcDate = date
        .replace(" ", "T") + "Z";

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
    // CALCULAR SITUAÇÃO DO SLA
    // ========================================

    function getSlaInfo() {
        // Chamado sem prazo
        if (!ticket?.due_at) {
            return {
                text: "Prazo não definido",
                className: "sla-neutral",
            };
        }

        // Chamado resolvido
        if (ticket.status === "resolved") {
            return {
                text: "Chamado resolvido",
                className: "sla-resolved",
            };
        }

        /*
         * O backend agora salva due_at
         * em formato ISO UTC.
         *
         * Exemplo:
         *
         * 2026-10-07T22:30:00.000Z
         *
         * O "Z" informa ao JavaScript
         * que a data está em UTC.
         *
         * new Date() fará a conversão
         * automaticamente para o horário
         * local do navegador.
         */

       const dueDate =
            parseDatabaseDate(ticket.due_at);

        const now =
            new Date();

        // ========================================
        // DATA INVÁLIDA
        // ========================================

        if (
            Number.isNaN(
                dueDate.getTime()
            )
        ) {
            return {
                text: "Prazo inválido",
                className: "sla-neutral",
            };
        }

        // ========================================
        // DIFERENÇA ENTRE PRAZO E AGORA
        // ========================================

        const difference =
            dueDate.getTime() -
            now.getTime();

        // ========================================
        // SLA VENCIDO
        // ========================================

        if (difference <= 0) {
            const expiredMilliseconds =
                Math.abs(difference);

            const expiredHours =
                Math.ceil(
                    expiredMilliseconds /
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

        // ========================================
        // PRÓXIMO DO VENCIMENTO
        // 4 HORAS OU MENOS
        // ========================================

        if (hoursRemaining <= 4) {
            return {
                text:
                    hoursRemaining === 1
                        ? "1h restante"
                        : `${hoursRemaining}h restantes`,

                className: "sla-warning",
            };
        }

        // ========================================
        // SLA NORMAL
        // ========================================

        return {
            text:
                `${hoursRemaining}h restantes`,

            className: "sla-ok",
        };
    }

    // ========================================
    // CARREGANDO
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
    // ERRO AO CARREGAR CHAMADO
    // ========================================

    if (error && !ticket) {
        return (
            <div className="page-container">

                <div className="error-message">
                    {error}
                </div>

                <Link
                    to="/chamados"
                    className="back-link"
                >
                    ← Voltar para meus chamados
                </Link>

            </div>
        );
    }

    // ========================================
    // CHAMADO NÃO ENCONTRADO
    // ========================================

    if (!ticket) {
        return (
            <div className="page-container">
                <p>
                    Chamado não encontrado.
                </p>
            </div>
        );
    }

    // ========================================
    // INFORMAÇÕES DO SLA
    // ========================================

    const slaInfo =
        getSlaInfo();

    // ========================================
    // INTERFACE
    // ========================================

    return (
        <div className="ticket-details-page">

            <div className="ticket-details-container">

                {/* VOLTAR */}

                <Link
                    to="/chamados"
                    className="back-link"
                >
                    ← Voltar para meus chamados
                </Link>

                {/* ========================================
                    CABEÇALHO
                ======================================== */}

                <div className="ticket-details-title">

                    <div>

                        <span className="ticket-number">
                            Chamado #{ticket.id}
                        </span>

                        <h1>
                            {ticket.title}
                        </h1>

                    </div>

                    <span
                        className={
                            `status status-${ticket.status}`
                        }
                    >
                        {translateStatus(
                            ticket.status
                        )}
                    </span>

                </div>

                {/* ========================================
                    MENSAGENS
                ======================================== */}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}

                {/* ========================================
                    CONTEÚDO
                ======================================== */}

                <div className="ticket-details-content">

                    <div>

                        {/* ========================================
                            INFORMAÇÕES PRINCIPAIS
                        ======================================== */}

                        <main className="ticket-content-card">

                            <div className="ticket-requester">

                                <h2>
                                    Solicitante
                                </h2>

                                <p>
                                    {ticket.created_by_name ||
                                        ticket.creator_name ||
                                        "Usuário"}
                                </p>

                            </div>

                            <div className="ticket-divider" />

                            <div>

                                <h2>
                                    Descrição do problema
                                </h2>

                                <p className="ticket-description">
                                    {ticket.description}
                                </p>

                            </div>

                        </main>

                        {/* ========================================
                            COMENTÁRIOS
                        ======================================== */}

                        <section className="comments-card">

                            <div className="comments-header">

                                <div>

                                    <h2>
                                        Histórico do chamado
                                    </h2>

                                    <p>
                                        Converse com o técnico responsável.
                                    </p>

                                </div>

                                <span className="comments-count">

                                    {comments.length}{" "}

                                    {comments.length === 1
                                        ? "mensagem"
                                        : "mensagens"}

                                </span>

                            </div>

                            {/* LISTA DE COMENTÁRIOS */}

                            <div className="comments-list">

                                {comments.length === 0 ? (

                                    <div className="no-comments">

                                        <p>
                                            Ainda não há mensagens neste chamado.
                                        </p>

                                    </div>

                                ) : (

                                    comments.map(
                                        (comment) => (

                                            <div
                                                key={comment.id}

                                                className={`comment ${
                                                    comment.user_role ===
                                                        "technician" ||
                                                    comment.user_role ===
                                                        "admin"
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

                                        )
                                    )

                                )}

                            </div>

                            {/* ========================================
                                NOVA MENSAGEM
                            ======================================== */}

                            <form
                                className="comment-form"
                                onSubmit={sendMessage}
                            >

                                <label htmlFor="ticket-message">
                                    Nova mensagem
                                </label>

                                <textarea
                                    id="ticket-message"
                                    value={newMessage}

                                    onChange={(event) => {
                                        setNewMessage(
                                            event.target.value
                                        );

                                        setSuccess("");
                                    }}

                                    placeholder="Digite sua mensagem..."

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
                                            : "Enviar mensagem"}

                                    </button>

                                </div>

                            </form>

                        </section>

                    </div>

                    {/* ========================================
                        SIDEBAR
                    ======================================== */}

                    <aside className="ticket-details-sidebar">

                        <div className="ticket-information-card">

                            <h3>
                                Informações
                            </h3>

                            {/* CATEGORIA */}

                            <div className="ticket-information-item">

                                <span>
                                    Categoria
                                </span>

                                <strong>
                                    {ticket.category}
                                </strong>

                            </div>

                            {/* PRIORIDADE */}

                            <div className="ticket-information-item">

                                <span>
                                    Prioridade
                                </span>

                                <strong>
                                    {translatePriority(
                                        ticket.priority
                                    )}
                                </strong>

                            </div>

                            {/* ========================================
                                PRAZO DO SLA
                            ======================================== */}

                            <div className="ticket-information-item">

                                <span>
                                    Prazo do SLA
                                </span>

                                <strong>
                                    {ticket.due_at
                                        ? formatDate(
                                              ticket.due_at
                                          )
                                        : "Não definido"}
                                </strong>

                            </div>

                            {/* ========================================
                                SITUAÇÃO DO SLA
                            ======================================== */}

                            <div className="ticket-information-item">

                                <span>
                                    Situação do SLA
                                </span>

                                <strong
                                    className={
                                        `sla-badge ${slaInfo.className}`
                                    }
                                >
                                    {slaInfo.text}
                                </strong>

                            </div>

                            {/* STATUS */}

                            <div className="ticket-information-item">

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {translateStatus(
                                        ticket.status
                                    )}
                                </strong>

                            </div>

                            {/* TÉCNICO */}

                            <div className="ticket-information-item">

                                <span>
                                    Técnico responsável
                                </span>

                                <strong>
                                    {ticket.assigned_to_name ||
                                        ticket.technician_name ||
                                        "Ainda não atribuído"}
                                </strong>

                            </div>

                            {/* DATA DE CRIAÇÃO */}

                            <div className="ticket-information-item">

                                <span>
                                    Criado em
                                </span>

                                <strong>
                                    {formatDate(
                                        ticket.created_at
                                    )}
                                </strong>

                            </div>

                            {/* ÚLTIMA ATUALIZAÇÃO */}

                            {ticket.updated_at && (

                                <div className="ticket-information-item">

                                    <span>
                                        Atualizado em
                                    </span>

                                    <strong>
                                        {formatDate(
                                            ticket.updated_at
                                        )}
                                    </strong>

                                </div>

                            )}

                        </div>

                    </aside>

                </div>

            </div>

        </div>
    );
}

export default TicketDetails;