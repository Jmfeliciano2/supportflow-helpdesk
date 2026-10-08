import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import request from "../services/api";

const AI_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";

const validCategories = [
    "Hardware",
    "Software",
    "Rede",
    "Acesso",
    "Email",
    "Outros",
];

const validPriorities = ["low", "medium", "high", "critical"];

function normalizeCategory(value) {
    if (!value) return "";

    const normalized = value
        .toString()
        .trim()
        .toLowerCase();

    if (["hardware", "equipamento", "notebook", "pc", "monitor", "impressora", "teclado", "mouse"].includes(normalized)) {
        return "Hardware";
    }

    if (["software", "sistema", "aplicativo", "erro", "bug", "programa", "windows", "excel", "site", "app"].includes(normalized)) {
        return "Software";
    }

    if (["rede", "internet", "wifi", "wi-fi", "vpn", "lan", "conexao", "conexão", "router", "dns"].includes(normalized)) {
        return "Rede";
    }

    if (["senha", "acesso", "login", "desbloquear", "recuperar", "permissao", "permissão", "cadastro", "conta"].includes(normalized)) {
        return "Acesso";
    }

    if (["email", "e-mail", "gmail", "outlook", "hotmail", "exchange", "mensagem de email"].includes(normalized)) {
        return "Email";
    }

    return "Outros";
}

function normalizePriority(value) {
    if (!value) return "medium";

    const normalized = value.toString().trim().toLowerCase();

    if (["critica", "crítica", "critical", "urgente", "bloqueante"].includes(normalized)) {
        return "critical";
    }

    if (["alta", "high", "severo", "impacto alto"].includes(normalized)) {
        return "high";
    }

    if (["baixa", "low", "pouco impacto"].includes(normalized)) {
        return "low";
    }

    return "medium";
}

function extractJsonFromText(text) {
    if (!text) return null;

    const cleanedText = text.trim();

    try {
        const jsonStart = cleanedText.indexOf("{");
        const jsonEnd = cleanedText.lastIndexOf("}");

        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const candidate = cleanedText.slice(jsonStart, jsonEnd + 1);
            return JSON.parse(candidate);
        }
    } catch (error) {
        // Ignora parse falho e usa fallback local
    }

    const categoryMatch = cleanedText.match(/categoria\s*[:=]\s*([A-Za-zÀ-ÿ\s]+)/i);
    const priorityMatch = cleanedText.match(/prioridade\s*[:=]\s*([A-Za-zÀ-ÿ\s]+)/i);

    if (categoryMatch || priorityMatch) {
        return {
            category: categoryMatch ? normalizeCategory(categoryMatch[1]) : "",
            priority: priorityMatch ? normalizePriority(priorityMatch[1]) : "",
        };
    }

    return null;
}

function buildFallbackClassification(title, description) {
    const text = `${title} ${description}`.toLowerCase();

    const lowerText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    let category = "Outros";

    if (/(notebook|pc|monitor|impressora|teclado|mouse|hardware|cpu|gpu|ssd|hd|fonte|cabos|periferico|periférico|ram)/i.test(lowerText)) {
        category = "Hardware";
    } else if (/(software|bug|erro|aplicativo|sistema|programa|windows|excel|word|sistema|app|falha)/i.test(lowerText)) {
        category = "Software";
    } else if (/(wifi|wi-fi|internet|rede|vpn|dns|router|switch|conexao|conexão|ping|latencia|latência)/i.test(lowerText)) {
        category = "Rede";
    } else if (/(senha|acesso|login|desbloquear|reset|recuperar|permissao|permissão|conta|cadastro)/i.test(lowerText)) {
        category = "Acesso";
    } else if (/(email|e-mail|gmail|outlook|hotmail|exchange|caixa de entrada|mensagem)/i.test(lowerText)) {
        category = "Email";
    }

    let priority = "medium";

    if (/(bloqueado|inacessivel|inacessível|crítico|critico|sem acesso|nao funciona|não funciona|quebrou|fora do ar|seguranca|segurança|vulnerabilidade)/i.test(lowerText)) {
        priority = "critical";
    } else if (/(muito importante|alto impacto|urgente|grave|lentidao|lentidão|nao abre|não abre|parou)/i.test(lowerText)) {
        priority = "high";
    } else if (/(teste|ajuda|dúvida|duvida|questionamento|configuracao|configuração)/i.test(lowerText)) {
        priority = "low";
    }

    return {
        category,
        priority,
    };
}

async function classifyTicketWithAI(title, description) {
    const inputText = `${title || ""}\n${description || ""}`.trim();

    if (inputText.length < 12) {
        return null;
    }

    const fallback = buildFallbackClassification(title, description);

    if (!AI_API_KEY) {
        return fallback;
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${AI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                temperature: 0,
                messages: [
                    {
                        role: "system",
                        content:
                            "Analise o pedido de suporte e responda somente em JSON com duas chaves: category e priority. Use apenas valores aceitos: category = Hardware, Software, Rede, Acesso, Email, Outros; priority = low, medium, high, critical. Não escreva texto extra.",
                    },
                    {
                        role: "user",
                        content: `Título: ${title}\nDescrição: ${description}`,
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`AI unavailable: ${response.status}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content || "";
        const parsed = extractJsonFromText(content);

        if (!parsed) {
            return fallback;
        }

        const category = validCategories.includes(parsed.category)
            ? parsed.category
            : normalizeCategory(parsed.category || fallback.category);

        const priority = validPriorities.includes(parsed.priority)
            ? parsed.priority
            : normalizePriority(parsed.priority || fallback.priority);

        return { category, priority };
    } catch (error) {
        console.warn("IA indisponível, usando classificação local:", error);
        return fallback;
    }
}

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

    useEffect(() => {
        const text = `${form.title} ${form.description}`.trim();

        if (text.length < 12) {
            return undefined;
        }

        const timer = setTimeout(async () => {
            const suggestion = await classifyTicketWithAI(form.title, form.description);

            if (suggestion) {
                setForm((previous) => ({
                    ...previous,
                    category: suggestion.category,
                    priority: suggestion.priority,
                }));
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [form.title, form.description]);

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