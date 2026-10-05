const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database/database");

// ========================================
// CADASTRO
// ========================================

function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Nome, e-mail e senha são obrigatórios."
            });
        }

        const existingUser = db
            .prepare("SELECT id FROM users WHERE email = ?")
            .get(email);

        if (existingUser) {
            return res.status(409).json({
                error: "Este e-mail já está cadastrado."
            });
        }

        const passwordHash = bcrypt.hashSync(password, 10);

        const result = db.prepare(`
            INSERT INTO users (
                name,
                email,
                password_hash
            )
            VALUES (?, ?, ?)
        `).run(
            name,
            email,
            passwordHash
        );

        return res.status(201).json({
            message: "Usuário cadastrado com sucesso.",
            user: {
                id: result.lastInsertRowid,
                name,
                email,
                role: "user"
            }
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Erro interno do servidor."
        });
    }
}


// ========================================
// LOGIN
// ========================================

function login(req, res) {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "E-mail e senha são obrigatórios."
            });
        }

        const user = db
            .prepare("SELECT * FROM users WHERE email = ?")
            .get(email);

        if (!user) {
            return res.status(401).json({
                error: "E-mail ou senha inválidos."
            });
        }

        const validPassword = bcrypt.compareSync(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                error: "E-mail ou senha inválidos."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        return res.status(200).json({
            message: "Login realizado com sucesso.",

            token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Erro interno do servidor."
        });
    }
}


// ========================================
// USUÁRIO LOGADO
// ========================================

function me(req, res) {
    try {

        const user = db.prepare(`
            SELECT
                id,
                name,
                email,
                role,
                created_at
            FROM users
            WHERE id = ?
        `).get(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: "Usuário não encontrado."
            });
        }

        return res.status(200).json(user);

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Erro interno do servidor."
        });
    }
}


// ========================================
// EXPORTA AS FUNÇÕES
// ========================================

module.exports = {
    register,
    login,
    me
};