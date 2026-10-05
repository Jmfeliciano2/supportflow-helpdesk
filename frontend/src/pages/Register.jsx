import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import request from "../services/api";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await request("/auth/register", {
                method: "POST",

                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            navigate("/login");

        } catch (error) {
            setError(error.message);

        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="logo">
                    Support<span>Flow</span>
                </div>

                <h1>Criar conta</h1>

                <p className="subtitle">
                    Cadastre-se para utilizar a central de suporte.
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Nome</label>

                        <input
                            type="text"
                            placeholder="Seu nome"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>E-mail</label>

                        <input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Senha</label>

                        <input
                            type="password"
                            placeholder="Crie uma senha"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />
                    </div>

                    <button
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Cadastrando..."
                            : "Criar conta"}
                    </button>

                </form>

                <p className="auth-footer">
                    Já possui uma conta?{" "}
                    <Link to="/login">
                        Entrar
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Register;