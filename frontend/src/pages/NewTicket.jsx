import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import request from "../services/api";

function NewTicket() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
        priority: "medium",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        if (
            !form.title.trim() ||
            !form.description.trim() ||
            !form.category
        ) {
            setError("Preencha todos os campos obrigatórios.");
            return;
        }

        try {
            setLoading(true);

            const data = await request("/tickets", {
                method: "POST",
                body: JSON.stringify(form),
            });

            navigate(`/chamados/${data.ticket.id}`);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="new-ticket-page">

            <div className="new-ticket-container">

                <Link
                    to="/dashboard"
                    className="back-link"
                >
                    ← Voltar para o dashboard
                </Link>

                <div className="new-ticket-header">
                    <h1>Novo chamado</h1>

                    <p>
                        Descreva o problema para que nossa equipe
                        possa ajudá-lo.
                    </p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form
                    className="new-ticket-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">
                        <label htmlFor="title">
                            Título do chamado *
                        </label>

                        <input
                            id="title"
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Ex: Notebook não conecta ao Wi-Fi"
                            maxLength="100"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            Descrição *
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Explique o problema com o máximo de detalhes possível..."
                            rows="7"
                        />
                    </div>

                    <div className="form-row">

                        <div className="form-group">
                            <label htmlFor="category">
                                Categoria *
                            </label>

                            <select
                                id="category"
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                            >
                                <option value="">
                                    Selecione uma categoria
                                </option>

                                <option value="Hardware">
                                    Hardware
                                </option>

                                <option value="Software">
                                    Software
                                </option>

                                <option value="Rede">
                                    Rede / Internet
                                </option>

                                <option value="Acesso">
                                    Acesso / Senha
                                </option>

                                <option value="Email">
                                    E-mail
                                </option>

                                <option value="Outros">
                                    Outros
                                </option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="priority">
                                Prioridade
                            </label>

                            <select
                                id="priority"
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                            >
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

                    </div>

                    <div className="form-actions">

                        <Link
                            to="/dashboard"
                            className="btn-cancel"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            className="btn-create-ticket"
                            disabled={loading}
                        >
                            {loading
                                ? "Criando..."
                                : "Criar chamado"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default NewTicket;