const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "supportflow.db");

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        title TEXT NOT NULL,
        description TEXT NOT NULL,

        category TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'open',

        created_by INTEGER NOT NULL,
        assigned_to INTEGER,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (created_by)
            REFERENCES users(id),

        FOREIGN KEY (assigned_to)
            REFERENCES users(id)
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (ticket_id)
            REFERENCES tickets(id)
            ON DELETE CASCADE,

        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER,
        action TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (ticket_id)
            REFERENCES tickets(id)
            ON DELETE CASCADE,

        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE SET NULL
    )
`);

// ========================================
// MIGRAÇÃO - SLA DOS CHAMADOS
// ========================================

const ticketColumns = db
    .prepare("PRAGMA table_info(tickets)")
    .all();

const hasDueAt = ticketColumns.some(
    (column) => column.name === "due_at"
);

if (!hasDueAt) {
    db.prepare(`
        ALTER TABLE tickets
        ADD COLUMN due_at DATETIME
    `).run();

    console.log(
        "Coluna due_at adicionada à tabela tickets."
    );
}

// ========================================
// MIGRAÇÃO - resolved_at
// ========================================

const updatedTicketColumns =
    db.prepare(
        "PRAGMA table_info(tickets)"
    ).all();

const hasResolvedAt =
    updatedTicketColumns.some(
        (column) =>
            column.name === "resolved_at"
    );

if (!hasResolvedAt) {
    db.prepare(`
        ALTER TABLE tickets
        ADD COLUMN resolved_at DATETIME
    `).run();

    console.log(
        "Coluna resolved_at adicionada à tabela tickets."
    );
}
console.log("Banco de dados conectado com sucesso.");

module.exports = db;