const db = require(
    "../database/database"
);

const email =
    "admin@supportflow.com";

const user = db.prepare(`
    SELECT *
    FROM users
    WHERE email = ?
`).get(email);

if (!user) {
    console.log("");
    console.log(
        "Usuário administrador ainda não existe."
    );

    console.log(
        "Cadastre primeiro pelo site:"
    );

    console.log(
        "Nome: Administrador"
    );

    console.log(
        "E-mail: admin@supportflow.com"
    );

    console.log(
        "Depois execute este script novamente."
    );

    db.close();

    process.exit(0);
}

db.prepare(`
    UPDATE users
    SET role = 'admin'
    WHERE email = ?
`).run(email);

console.log("");
console.log(
    "Administrador criado com sucesso!"
);

console.log(
    `Nome: ${user.name}`
);

console.log(
    `E-mail: ${user.email}`
);

console.log(
    "Role: admin"
);

db.close();