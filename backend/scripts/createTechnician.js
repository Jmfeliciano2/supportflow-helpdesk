const db = require("../database/database");

const email = "tecnico@supportflow.com";

const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);

if (!user) {
    console.log("Usuário não encontrado.");
    console.log(
        "Cadastre tecnico@supportflow.com primeiro pelo sistema."
    );

    process.exit(0);
}

db.prepare(`
    UPDATE users
    SET role = 'technician'
    WHERE email = ?
`).run(email);

console.log("Usuário transformado em técnico com sucesso.");

db.close();