function authorize(...roles) {
    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                error: "Usuário não autenticado."
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Você não possui permissão para esta ação."
            });
        }

        next();
    };
}

module.exports = authorize;