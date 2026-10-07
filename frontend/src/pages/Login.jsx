import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import request from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const data = await request("/auth/login", {
                method: "POST",

                body: JSON.stringify({
                    email,
                    password
                })
            });

            localStorage.setItem("token", data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            // DECIDE PARA ONDE O USUÁRIO VAI
if (data.user.role === "admin") {

    navigate("/admin");

} else if (
    data.user.role === "technician"
) {

    navigate("/tecnico");

} else {

    navigate("/dashboard");

}

    if (data.user.role === "admin") {
    navigate("/admin");
} else if (data.user.role === "technician") {
    navigate("/tecnico");
} else {
    navigate("/dashboard");
}

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

                <h1>Bem-vindo</h1>

                <p className="subtitle">
                    Entre para acessar a central de suporte.
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

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
                            placeholder="Sua senha"
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
                        {loading ? "Entrando..." : "Entrar"}
                    </button>

                </form>

                <p className="auth-footer">
                    Não possui uma conta?{" "}
                    <Link to="/cadastro">
                        Criar conta
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Login;