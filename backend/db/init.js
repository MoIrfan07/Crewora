const { PGlite } = require("@electric-sql/pglite");
const path = require("path");

// Detect packaged Electron
const isPackaged = process.env.ELECTRON_PACKAGED === "1";

// Correct DB path
const dbPath = isPackaged
    ? path.join(process.env.RESOURCES_PATH, "backend", "db", "crewora.db")
    : path.join(__dirname, "crewora.db");

// Create DB instance
const db = new PGlite(dbPath);

async function setup() {

    console.log("[init] Initializing database at:", dbPath);

    /* ---------------- USERS TABLE ---------------- */
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            company_name TEXT NOT NULL
        );
    `);

    const users = [
        { username: "crewora", password: "12345", company: "crewora" },
        { username: "elite avenue", password: "12345", company: "elite avenue" },
        { username: "Test1", password: "12345", company: "Test1" },
        { username: "Test2", password: "12345", company: "Test2" }
    ];

    for (const u of users) {
        const updateResult = await db.query(
            `UPDATE users 
             SET password = $1, company_name = $2 
             WHERE username = $3 
             RETURNING *`,
            [u.password, u.company, u.username]
        );

        if (updateResult.rows.length === 0) {
            await db.query(
                `INSERT INTO users (id, username, password, company_name)
                 VALUES ($1, $2, $3, $4)`,
                [Date.now().toString(), u.username, u.password, u.company]
            );
        }
    }

    /* ---------------- PAYMENT ENTRY ---------------- */
    await db.query(`
        CREATE TABLE IF NOT EXISTS payment_entry (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            date TEXT NOT NULL,
            project TEXT NOT NULL,
            from_type TEXT NOT NULL,
            from_name TEXT NOT NULL,
            amount REAL NOT NULL,
            mode TEXT NOT NULL,
            description TEXT,
            capital_investor TEXT
        );
    `);
    /* ---------------- INTERNAL PAYMENTS ---------------- */
    await db.query(`
    CREATE TABLE IF NOT EXISTS internal_payments (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        date TEXT NOT NULL,
        from_acc TEXT NOT NULL,
        to_acc TEXT NOT NULL,
        amount REAL NOT NULL,
        investor TEXT,
        description TEXT
    );
`);


    /* ---------------- INVOICES ---------------- */
    await db.query(`
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            invoice_no TEXT NOT NULL,
            project TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            description TEXT
        );
    `);

    /* ---------------- RECEIPT ---------------- */
    await db.query(`
        CREATE TABLE IF NOT EXISTS receipt (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            project TEXT NOT NULL,
            invoice_no TEXT NOT NULL,
            amount REAL NOT NULL,
            mode TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT
        );
    `);


    /* ---------------- SALESMEN ---------------- */
    await db.query(`
    CREATE TABLE IF NOT EXISTS salesmen (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        name TEXT NOT NULL,
        iqama TEXT,
        mobile TEXT,
        nationality TEXT
    );
`);




    /* ---------------- INVESTOR ENTRIES ---------------- */
    await db.query(`
    CREATE TABLE IF NOT EXISTS investor_entries (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        date TEXT NOT NULL,
        party TEXT NOT NULL,
        amount REAL NOT NULL,
        mode TEXT NOT NULL,
        description TEXT
    );
`);

    /* ---------------- CLIENTS ---------------- */
    await db.query(`
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            name TEXT NOT NULL,
            contact TEXT
        );
    `);

    /* ---------------- OTHERS ---------------- */
    await db.query(`
        CREATE TABLE IF NOT EXISTS others (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            contact TEXT
        );
    `);


    /* ---------------- CURRENT ASSETS ---------------- */
    await db.query(`
    CREATE TABLE IF NOT EXISTS current_assets (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        acc_type TEXT NOT NULL,
        acc_name TEXT,
        display TEXT NOT NULL
    );
`);

    /* ---------------- SOA ---------------- */

    await db.query(`
    CREATE TABLE IF NOT EXISTS soa_entries (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        date TEXT NOT NULL,
        doc_no TEXT,
        party TEXT,
        description TEXT,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0
    );
`);


    /* ---------------- PROJECTS (NO DATE) ---------------- */
    await db.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            name TEXT NOT NULL,
            client TEXT NOT NULL,
            salesman TEXT NOT NULL,
            status TEXT NOT NULL,
            category TEXT
        );
    `);

    console.log("[init] Database initialized successfully ✔");
}

setup().catch(err => {
    console.error("[init] ERROR:", err);
});
