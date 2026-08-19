const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const { PGlite } = require("@electric-sql/pglite");

const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
}));


app.use(bodyParser.json());

// ⭐ REAL SESSION (FIXED)
app.use(
    session({
        secret: "crewora-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000  // 1 day
        }
    })
);
const path = require("path");
const db = new PGlite(path.join(__dirname, "db", "crewora.db"));


/* ===========================================================
   LOGIN
=========================================================== */
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password)
    try {
        const result = await db.query(
            "SELECT * FROM users WHERE username = $1 AND password = $2",
            [username, password]
        );



        if (result.rows.length === 0) {
            return res.json({ success: false });
        }

        const user = result.rows[0];

        // ⭐ Save inside SESSION (not global)
        req.session.user = {
            username: user.username,
            companyName: user.company_name
        };

        res.json({
            success: true,
            companyName: user.company_name
        });
    } catch (err) {
        res.json({ success: false });
    }
});

/* ===========================================================
   CHECK SESSION
=========================================================== */
app.get("/api/user/session", (req, res) => {
    if (!req.session.user) {
        return res.json({ loggedIn: false });
    }

    res.json({
        loggedIn: true,
        username: req.session.user.username,
        companyName: req.session.user.companyName
    });
});

/* ===========================================================
   LOGOUT
=========================================================== */
app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

/* ===========================================================
    INTERNAL PAYMENTS CRUD
=========================================================== */


app.get("/api/internal-payments/details/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM internal_payments WHERE id = $1",
            [id]
        );

        res.json(result.rows[0] || null);

    } catch (err) {
        console.error("❌ ERROR FETCHING INTERNAL PAYMENT:", err);
        res.status(500).json({ error: "Failed to fetch entry" });
    }
});

app.get("/api/internal-payments/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM internal_payments WHERE company = $1 ORDER BY date DESC",
            [company]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("❌ ERROR FETCHING INTERNAL PAYMENTS:", err);
        res.status(500).json({ error: "Failed to fetch internal payments" });
    }
});


app.post("/api/internal-payments/add", async (req, res) => {
    const { id, company, date, from_acc, to_acc, amount, investor, description } = req.body;

    try {
        await db.query(
            `INSERT INTO internal_payments
             (id, company, date, from_acc, to_acc, amount, investor, description)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [id, company, date, from_acc, to_acc, amount, investor, description]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("❌ ERROR ADDING INTERNAL PAYMENT:", err);
        res.status(500).json({ error: "Failed to add internal payment" });
    }
});


app.put("/api/internal-payments/update/:id", async (req, res) => {
    const { id } = req.params;
    const { date, from_acc, to_acc, amount, investor, description } = req.body;

    try {
        await db.query(
            `UPDATE internal_payments SET
                date=$1, from_acc=$2, to_acc=$3,
                amount=$4, investor=$5, description=$6
             WHERE id=$7`,
            [date, from_acc, to_acc, amount, investor, description, id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("❌ ERROR UPDATING INTERNAL PAYMENT:", err);
        res.status(500).json({ error: "Failed to update internal payment" });
    }
});


app.delete("/api/internal-payments/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM internal_payments WHERE id = $1", [id]);

        res.json({ success: true });

    } catch (err) {
        console.error("❌ ERROR DELETING INTERNAL PAYMENT:", err);
        res.status(500).json({ error: "Failed to delete internal payment" });
    }
});



/* ===========================================================
    PAYMENT ENTRY CRUD
=========================================================== */

/* GET single payment entry by ID */
app.get("/api/payment-entry/:company/:id", async (req, res) => {
    const { company, id } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM payment_entry WHERE company = $1 AND id = $2",
            [company, id]
        );

        res.json(result.rows[0] || null);

    } catch (err) {
        console.error("❌ ERROR FETCHING PAYMENT ENTRY:", err);
        res.status(500).json({ error: "Failed to fetch payment entry" });
    }
});


/* GET all payment entries */
app.get("/api/payment-entry/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM payment_entry WHERE company = $1 ORDER BY date DESC",
            [company]
        );

        const formatted = result.rows.map(r => ({
            id: r.id,
            date: r.date,
            project: r.project,

            // ⭐ Always return something for Party
            party_name:
                r.from_name ||   // new entries
                r.from_acc ||    // older entries
                r.party ||       // investor entries
                r.to_acc ||      // internal transfer style
                "",

            amount: r.amount,
            mode: r.mode,
            capital_investor: r.capital_investor || "",
            description: r.description
        }));



        res.json(formatted);

    } catch (err) {
        console.log("❌ ERROR FETCHING PAYMENT ENTRY:", err);
        res.status(500).json({ error: "Failed to fetch payment entries" });
    }
});



/* ADD payment entry */
app.post("/api/payment-entry/add", async (req, res) => {
    const {
        id, company, date, project,
        from_type, from_name, amount, mode, description,
        capital_investor
    } = req.body;


    try {
        await db.query(
            `INSERT INTO payment_entry
     (id, company, date, project, from_type, from_name, amount, mode, description, capital_investor)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [id, company, date, project, from_type, from_name, amount, mode, description, capital_investor]
        );


        res.json({ success: true });

    } catch (err) {
        console.log("❌ ERROR ADDING PAYMENT ENTRY:", err);
        res.status(500).json({ error: "Failed to add payment entry" });
    }
});



/* UPDATE payment entry */
app.put("/api/payment-entry/update/:id", async (req, res) => {
    const { id } = req.params;
    const {
        date, project, from_type, from_name, amount, mode, description,
        capital_investor
    } = req.body;

    try {
        await db.query(
            `UPDATE payment_entry SET
        date=$1, project=$2,
        from_type=$3, from_name=$4,
        amount=$5, mode=$6, description=$7,
        capital_investor=$8
     WHERE id=$9`,
            [date, project, from_type, from_name, amount, mode, description, capital_investor, id]
        );


        res.json({ success: true });

    } catch (err) {
        console.log("❌ ERROR UPDATING PAYMENT ENTRY:", err);
        res.status(500).json({ error: "Failed to update payment entry" });
    }
});



/* DELETE payment entry */
app.delete("/api/payment-entry/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM payment_entry WHERE id = $1", [id]);
        res.json({ success: true });

    } catch (err) {
        console.log("❌ ERROR DELETING PAYMENT ENTRY:", err);
        res.status(500).json({ error: "Failed to delete payment entry" });
    }
});



/* ===========================================================
    INVOICES CRUD
=========================================================== */

app.get("/api/invoices/:company/:id", async (req, res) => {
    const { company, id } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM invoices WHERE company = $1 AND id = $2",
            [company, id]
        );

        res.json(result.rows[0] || null);

    } catch (err) {
        console.error("❌ ERROR FETCHING INVOICE:", err);
        res.status(500).json({ error: "Failed to fetch invoice" });
    }
});

app.get("/api/invoices/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM invoices WHERE company = $1 ORDER BY date DESC",
            [company]
        );

        const formatted = result.rows.map(r => ({
            id: r.id,
            invoice_no: r.invoice_no,
            project: r.project,
            amount: r.amount,
            date: r.date,
            description: r.description
        }));

        res.json(formatted);

    } catch (err) {
        console.error("❌ ERROR FETCHING INVOICES:", err);
        res.status(500).json({ error: "Failed to fetch invoices" });
    }
});


app.post("/api/invoices/add", async (req, res) => {
    const { id, company, invoice_no, project, amount, date, description } = req.body;

    try {
        await db.query(
            `INSERT INTO invoices (id, company, invoice_no, project, amount, date, description)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [id, company, invoice_no, project, amount, date, description]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("❌ ERROR ADDING INVOICE:", err);
        res.status(500).json({ error: "Failed to add invoice" });
    }
});



app.put("/api/invoices/update/:id", async (req, res) => {
    const { id } = req.params;
    const { invoice_no, project, amount, date, description } = req.body;

    try {
        await db.query(
            `UPDATE invoices SET
                invoice_no=$1, project=$2, amount=$3,
                date=$4, description=$5
             WHERE id=$6`,
            [invoice_no, project, amount, date, description, id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("❌ ERROR UPDATING INVOICE:", err);
        res.status(500).json({ error: "Failed to update invoice" });
    }
});



app.delete("/api/invoices/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM invoices WHERE id = $1", [id]);
        res.json({ success: true });

    } catch (err) {
        console.error("❌ ERROR DELETING INVOICE:", err);
        res.status(500).json({ error: "Failed to delete invoice" });
    }
});

/* ===========================================================
    RECEIPT ENTRY CRUD
=========================================================== */


app.get("/api/receipt/:company/:id", async (req, res) => {
    const { company, id } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM receipt WHERE company = $1 AND id = $2",
            [company, id]
        );

        res.json(result.rows[0] || null);

    } catch (err) {
        console.error("❌ ERROR FETCHING RECEIPT:", err);
        res.status(500).json({ error: "Failed to fetch receipt" });
    }
});


/* ===========================================================
    RECEIPT CRUD
=========================================================== */

// GET all receipts
app.get("/api/receipt/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM receipt WHERE company = $1 ORDER BY date DESC",
            [company]
        );

        const formatted = result.rows.map(r => ({
            id: r.id,
            project: r.project,
            invoice_no: r.invoice_no,
            amount: r.amount,
            mode: r.mode,
            date: r.date,
            description: r.description
        }));

        res.json(formatted);

    } catch (err) {
        console.error("❌ ERROR FETCHING RECEIPTS:", err);
        res.status(500).json({ error: "Failed to fetch receipts" });
    }
});



app.post("/api/receipt/add", async (req, res) => {
    const {
        id, company, project,
        invoice_no, amount, mode, date, description
    } = req.body;

    try {
        await db.query(
            `INSERT INTO receipt
            (id, company, project, invoice_no, amount, mode, date, description)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [id, company, project, invoice_no, amount, mode, date, description]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("❌ ERROR ADDING RECEIPT:", err);
        res.status(500).json({ error: "Failed to add receipt" });
    }
});


app.put("/api/receipt/update/:id", async (req, res) => {
    const { id } = req.params;
    const { project, invoice_no, amount, mode, date, description } = req.body;

    try {
        await db.query(
            `UPDATE receipt SET
                project=$1, invoice_no=$2, amount=$3,
                mode=$4, date=$5, description=$6
             WHERE id=$7`,
            [project, invoice_no, amount, mode, date, description, id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("❌ ERROR UPDATING RECEIPT:", err);
        res.status(500).json({ error: "Failed to update receipt" });
    }
});

app.delete("/api/receipt/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM receipt WHERE id = $1", [id]);
        res.json({ success: true });

    } catch (err) {
        console.error("❌ ERROR DELETING RECEIPT:", err);
        res.status(500).json({ error: "Failed to delete receipt" });
    }
});


/* ===========================================================
   SALESMEN CRUD  (Name, Iqama, Mobile, Nationality)
=========================================================== */

app.get("/api/salesmen/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM salesmen WHERE company = $1 ORDER BY name ASC",
            [company]
        );
        res.json(result.rows);

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch salesmen" });
    }
});

app.post("/api/salesmen/add", async (req, res) => {
    const { id, company, name, iqama, mobile, nationality } = req.body;

    try {
        await db.query(
            `INSERT INTO salesmen (id, company, name, iqama, mobile, nationality)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [id, company, name, iqama, mobile, nationality]
        );

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: "Failed to add salesman" });
    }
});

app.put("/api/salesmen/update/:id", async (req, res) => {
    const { id } = req.params;
    const { name, iqama, mobile, nationality } = req.body;

    try {
        await db.query(
            `UPDATE salesmen
             SET name=$1, iqama=$2, mobile=$3, nationality=$4
             WHERE id=$5`,
            [name, iqama, mobile, nationality, id]
        );

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: "Failed to update salesman" });
    }
});

app.delete("/api/salesmen/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM salesmen WHERE id = $1", [id]);
        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: "Failed to delete salesman" });
    }
});

app.get("/api/salesmen/details/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM salesmen WHERE id = $1",
            [id]
        );
        res.json(result.rows[0] || null);

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch salesman" });
    }
});



/* ===========================================================
    CLIENTS CRUD  (Needed for Projects Page)
=========================================================== */

app.post("/api/clients/add", async (req, res) => {
    const { id, company, name, contact } = req.body;

    try {
        await db.query(
            `INSERT INTO clients (id, company, name, contact) VALUES ($1,$2,$3,$4)`,
            [id, company, name, contact]
        );

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: "Failed to add client" });
    }
});

app.put("/api/clients/update/:id", async (req, res) => {
    const { id } = req.params;
    const { name, contact } = req.body;

    try {
        await db.query(
            `UPDATE clients
             SET name = $1, contact = $2
             WHERE id = $3`,
            [name, contact, id]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to update client" });
    }
});

app.delete("/api/clients/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            "DELETE FROM clients WHERE id = $1",
            [id]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to delete client" });
    }
});

app.get("/api/clients/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM clients WHERE company = $1 ORDER BY name ASC",
            [company]
        );
        res.json(result.rows);

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch clients" });
    }
});

/* ===========================================================
    INVESTOR ENTRIES CRUD  (Date, Party, Amount, Mode, Description)
=========================================================== */

/* Get all investor entries */
app.get("/api/investors/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM investor_entries WHERE company = $1 ORDER BY date DESC",
            [company]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("❌ Failed to fetch investor entries", err);
        res.status(500).json({ error: "Failed to fetch investor entries" });
    }
});

/* Add investor entry */
app.post("/api/investors/add", async (req, res) => {
    const { id, company, date, party, amount, mode, description } = req.body;

    try {
        await db.query(
            `INSERT INTO investor_entries (id, company, date, party, amount, mode, description)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [id, company, date, party, amount, mode, description]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("❌ Failed to add investor entry", err);
        res.status(500).json({ error: "Failed to add investor entry" });
    }
});

/* Update investor entry */
app.put("/api/investors/update/:id", async (req, res) => {
    const { id } = req.params;
    const { date, party, amount, mode, description } = req.body;

    try {
        await db.query(
            `UPDATE investor_entries
             SET date=$1, party=$2, amount=$3, mode=$4, description=$5
             WHERE id=$6`,
            [date, party, amount, mode, description, id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("❌ Failed to update investor entry", err);
        res.status(500).json({ error: "Failed to update investor entry" });
    }
});

/* Delete investor entry */
app.delete("/api/investors/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM investor_entries WHERE id = $1", [id]);
        res.json({ success: true });

    } catch (err) {
        console.error("❌ Failed to delete investor entry", err);
        res.status(500).json({ error: "Failed to delete investor entry" });
    }
});

/* Get single entry for details page */
app.get("/api/investors/details/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM investor_entries WHERE id = $1",
            [id]
        );

        res.json(result.rows[0] || null);

    } catch (err) {
        console.error("❌ Failed to fetch investor entry", err);
        res.status(500).json({ error: "Failed to fetch investor entry" });
    }
});

/* ===========================================================
    OTHERS CRUD (Vendors / Suppliers / Partners / Workers / Other)
=========================================================== */

/* Get all 'others' */
app.get("/api/others/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM others WHERE company = $1 ORDER BY type ASC, name ASC",
            [company]
        );

        res.json(result.rows);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch others" });
    }
});

/* Add entry */
app.post("/api/others/add", async (req, res) => {
    const { id, company, type, name, contact } = req.body;

    try {
        await db.query(
            `INSERT INTO others (id, company, type, name, contact)
             VALUES ($1,$2,$3,$4,$5)`,
            [id, company, type, name, contact]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to add entry" });
    }
});

/* Update entry */
app.put("/api/others/update/:id", async (req, res) => {
    const { id } = req.params;
    const { type, name, contact } = req.body;

    try {
        await db.query(
            `UPDATE others
             SET type=$1, name=$2, contact=$3
             WHERE id=$4`,
            [type, name, contact, id]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to update entry" });
    }
});

/* Delete entry */
app.delete("/api/others/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM others WHERE id = $1", [id]);
        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to delete entry" });
    }
});


/* ===========================================================
    CURRENT ASSETS CRUD
=========================================================== */

/* Get all current asset accounts */
app.get("/api/current-assets/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM current_assets WHERE company = $1 ORDER BY display ASC",
            [company]
        );
        res.json(result.rows);

    } catch (err) {
        console.error("❌ Failed to fetch current assets:", err);
        res.status(500).json({ error: "Failed to fetch current assets" });
    }
});

/* Add account */
app.post("/api/current-assets/add", async (req, res) => {
    const { id, company, acc_type, acc_name, display } = req.body;

    try {
        await db.query(
            `INSERT INTO current_assets (id, company, acc_type, acc_name, display)
             VALUES ($1,$2,$3,$4,$5)`,
            [id, company, acc_type, acc_name, display]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("❌ Failed to add current asset:", err);
        res.status(500).json({ error: "Failed to add current asset" });
    }
});

/* Update account */
app.put("/api/current-assets/update/:id", async (req, res) => {
    const { id } = req.params;
    const { acc_type, acc_name, display } = req.body;

    try {
        await db.query(
            `UPDATE current_assets
             SET acc_type=$1, acc_name=$2, display=$3
             WHERE id=$4`,
            [acc_type, acc_name, display, id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("❌ Failed to update current asset:", err);
        res.status(500).json({ error: "Failed to update current asset" });
    }
});

/* Delete account */
app.delete("/api/current-assets/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM current_assets WHERE id = $1", [id]);
        res.json({ success: true });

    } catch (err) {
        console.error("❌ Failed to delete current asset:", err);
        res.status(500).json({ error: "Failed to delete current asset" });
    }
});


/* ===========================================================
    SOA CRUD  (Statement of Account)
=========================================================== */


app.get("/api/soa/:company/:id", async (req, res) => {
    const { company, id } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM soa_entries WHERE company = $1 AND id = $2",
            [company, id]
        );

        res.json(result.rows[0] || null);
    } catch (err) {
        console.error("❌ Failed to fetch SOA entry:", err);
        res.status(500).json({ error: "Failed to fetch entry" });
    }
});

/* ===========================================================
   SOA (Merged Statement of Account)
=========================================================== */
// --- Replace your existing app.get("/api/soa/:company", ...) with this block ---
/* ===========================================================
   CLEAN SOA MERGED API (NO ZAKAT, NO WRITE APIS)
=========================================================== */

app.get("/api/soa/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const soaQuery = `
        SELECT 
            id::text,
            date,
            doc_no,
            party,
            project,
            COALESCE(description, '') AS description,
            COALESCE(debit, 0) AS debit,
            COALESCE(credit, 0) AS credit,
            source
        FROM (

          -- INVOICES (DEBIT)
          SELECT 
            id,
            date,
            invoice_no AS doc_no,
            project AS party,
            project,
            description,
            amount AS debit,
            0 AS credit,
            'invoice' AS source
          FROM invoices
          WHERE company = $1

          UNION ALL

          -- PAYMENTS (CREDIT)
          SELECT 
            id,
            date,
            NULL AS doc_no,
            from_name AS party,
            project,
            description,
            0 AS debit,
            amount AS credit,
            'payment_entry' AS source
          FROM payment_entry
          WHERE company = $1

          UNION ALL

          -- RECEIPTS (CREDIT)
          SELECT 
            id,
            date,
            invoice_no AS doc_no,
            project AS party,
            project,
            description,
            0 AS debit,
            amount AS credit,
            'receipt' AS source
          FROM receipt
          WHERE company = $1

          UNION ALL

          -- INVESTORS (DEBIT)
         
SELECT
    id,
    date,
    NULL AS doc_no,
    party,
    '' AS project,        -- 🔥 FIX: investor_entries has NO project field
    description,
    amount AS debit,
    0 AS credit,
    'investor' AS source
FROM investor_entries
WHERE company = $1


        ) AS combined
        ORDER BY date ASC, id ASC;
        `;

        const soaRes = await db.query(soaQuery, [company]);


        /* Load reference lists */
        const projects = (await db.query(
            "SELECT id, name FROM projects WHERE company=$1 ORDER BY name ASC",
            [company]
        )).rows;

        const investors = (await db.query(
            "SELECT id, party, amount FROM investor_entries WHERE company=$1",
            [company]
        )).rows;

        const clients = (await db.query(
            "SELECT id, name FROM clients WHERE company=$1",
            [company]
        )).rows;

        const others = (await db.query(
            "SELECT id, name FROM others WHERE company=$1",
            [company]
        )).rows;

        const salesmen = (await db.query(
            "SELECT id, name FROM salesmen WHERE company=$1",
            [company]
        )).rows;

        /* Unique party list */
        const parties = [...new Set([
            ...clients.map(c => c.name),
            ...others.map(o => o.name),
            ...salesmen.map(s => s.name),
            ...investors.map(i => i.party)
        ])];

        res.json({
            soa: soaRes.rows,
            projects,
            investors,
            parties
        });

    } catch (err) {
        console.error("❌ SOA COMBINED ERROR:", err);
        res.status(500).json({ error: "Failed to generate merged SOA payload" });
    }
});



/* ===========================================================
    PROJECTS CRUD — DATE REMOVED
=========================================================== */

/* Get single project */
app.get("/api/projects/details/:company/:id", async (req, res) => {
    const { company, id } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM projects WHERE company = $1 AND id = $2",
            [company, id]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error("❌ ERROR FETCHING PROJECT:", err);
        res.status(500).json({ error: "Failed to fetch project" });
    }
});

/* Get all projects */
app.get("/api/projects/:company", async (req, res) => {
    const { company } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM projects WHERE company = $1 ORDER BY name ASC",
            [company]
        );

        res.json(
            result.rows.map(p => ({
                id: p.id,
                name: p.name,
                client: p.client,
                salesman: p.salesman,
                status: p.status,
                category: p.category
            }))
        );

    } catch (err) {
        console.error("❌ ERROR FETCHING PROJECTS:", err);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});

/* Add project */
app.post("/api/projects/add", async (req, res) => {
    const { id, company, name, client, salesman, status, category } = req.body;

    try {
        await db.query(
            `INSERT INTO projects (
                id, company, name, client, salesman, status, category
            ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [id, company, name, client, salesman, status, category]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("❌ ERROR ADDING PROJECT:", err);
        res.status(500).json({ error: "Failed to add project" });
    }
});

/* Update project */
app.put("/api/projects/update/:id", async (req, res) => {
    const { id } = req.params;
    const { name, client, salesman, status, category } = req.body;

    try {
        await db.query(
            `UPDATE projects SET
                name=$1,
                client=$2,
                salesman=$3,
                status=$4,
                category=$5
             WHERE id=$6`,
            [name, client, salesman, status, category, id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("❌ ERROR UPDATING PROJECT:", err);
        res.status(500).json({ error: "Failed to update project" });
    }
});

/* Delete project */
app.delete("/api/projects/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM projects WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ ERROR DELETING PROJECT:", err);
        res.status(500).json({ error: "Failed to delete project" });
    }
});


/* ===========================================================
    START SERVER
=========================================================== */
app.listen(5000, () => {
    console.log("Backend running at http://127.0.0.1:5000");
});


