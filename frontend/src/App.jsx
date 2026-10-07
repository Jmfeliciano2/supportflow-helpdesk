import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

// ========================================
// COMPONENTES DE PROTEÇÃO
// ========================================

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

// ========================================
// PÁGINAS PÚBLICAS
// ========================================

import Login from "./pages/Login";
import Register from "./pages/Register";

// ========================================
// PÁGINAS DO USUÁRIO
// ========================================

import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import NewTicket from "./pages/NewTicket";
import TicketDetails from "./pages/TicketDetails";

// ========================================
// PÁGINAS DO TÉCNICO
// ========================================

import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicianTicketDetails from "./pages/TechnicianTicketDetails";

// ========================================
// PÁGINAS DO ADMINISTRADOR
// ========================================

import AdminDashboard from "./pages/AdminDashboard";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* ========================================
                    ROTA INICIAL
                ======================================== */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

                {/* ========================================
                    ROTAS PÚBLICAS
                ======================================== */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/cadastro"
                    element={<Register />}
                />

                {/* ========================================
                    ROTAS PROTEGIDAS
                    QUALQUER USUÁRIO LOGADO
                ======================================== */}

                <Route
                    element={
                        <ProtectedRoute />
                    }
                >

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/chamados"
                        element={<Tickets />}
                    />

                    <Route
                        path="/chamados/novo"
                        element={<NewTicket />}
                    />

                    <Route
                        path="/chamados/:id"
                        element={<TicketDetails />}
                    />

                </Route>

                {/* ========================================
                    ROTAS DO TÉCNICO
                    technician OU admin
                ======================================== */}

                <Route
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "technician",
                                "admin",
                            ]}
                        />
                    }
                >

                    <Route
                        path="/tecnico"
                        element={
                            <TechnicianDashboard />
                        }
                    />

                    <Route
                        path="/tecnico/chamados/:id"
                        element={
                            <TechnicianTicketDetails />
                        }
                    />

                </Route>

                {/* ========================================
                    ROTAS DO ADMINISTRADOR
                    SOMENTE admin
                ======================================== */}

                <Route
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "admin",
                            ]}
                        />
                    }
                >

                    <Route
                        path="/admin"
                        element={
                            <AdminDashboard />
                        }
                    />

                </Route>

                {/* ========================================
                    ROTA 404
                ======================================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;