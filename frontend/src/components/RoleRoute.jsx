import { Navigate, Outlet } from "react-router-dom";

function RoleRoute({ allowedRoles }) {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");

    if (!token || !userString) {
        return <Navigate to="/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(userString);
    } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return <Navigate to="/login" replace />;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

export default RoleRoute;