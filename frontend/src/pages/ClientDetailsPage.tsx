import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import "../styles/Clients.css";

interface IncomeItem {
    id: string;
    from: { type: string; name: string };
    client?: string;
    project?: string;
    category: string;
    amount: number;
    date: string;
}

interface ExpenseItem {
    id: string;
    to?: { type: string; name: string };
    client?: string;
    project?: string;
    category: string;
    amount: number;
    date: string;
}

interface ProjectItem {
    id: string;
    name: string;
    client?: string;
    salesman?: string;
    investor?: string;
}

const capitalizeWords = (str = "") =>
    str
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

const ClientDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const clientId = id || ""; // string ID
    const company = localStorage.getItem("companyName") || "default_company";

    const [client, setClient] = useState<any>(null);
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [income, setIncome] = useState<IncomeItem[]>([]);
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [loading, setLoading] = useState(true);

    /* ------------------------------------------------------------------
       FETCH everything from backend
    ------------------------------------------------------------------ */
    useEffect(() => {
        const loadAll = async () => {
            try {
                // 1️⃣ Fetch all clients
                const clientRes = await fetch(`http://127.0.0.1:5000/api/clients/${company}`);
                const allClients = await clientRes.json();

                const foundClient = allClients.find((x: any) => String(x.id) === String(clientId));

                setClient(foundClient);
                if (!foundClient) {
                    setLoading(false);
                    return; // no need to load more
                }

                // 2️⃣ Fetch Projects
                const projRes = await fetch(`http://127.0.0.1:5000/api/projects/${company}`);
                const allProjects = await projRes.json();

                setProjects(
                    allProjects.filter(
                        (p: any) =>
                            p.client === foundClient.name ||
                            p.clientName === foundClient.name
                    )
                );

                // 3️⃣ Fetch Income
                const incomeRes = await fetch(`http://127.0.0.1:5000/api/income/${company}`);
                const allIncome = await incomeRes.json();

                setIncome(
                    allIncome.filter(
                        (i: any) =>
                            i.client === foundClient.name ||
                            i.from?.name === foundClient.name ||
                            i.clientName === foundClient.name
                    )
                );

                // 4️⃣ Fetch Expenses
                const expenseRes = await fetch(`http://127.0.0.1:5000/api/expenses/${company}`);
                const allExpenses = await expenseRes.json();

                setExpenses(
                    allExpenses.filter(
                        (e: any) =>
                            e.client === foundClient.name ||
                            e.to?.name === foundClient.name ||
                            e.clientName === foundClient.name
                    )
                );
            } catch (err) {
                console.error("Failed to load client details", err);
            }

            setLoading(false);
        };

        loadAll();
    }, [clientId, company]);

    if (loading) return <h2 style={{ padding: 30 }}>Loading...</h2>;
    if (!client) return <h2 style={{ padding: 30 }}>Client not found</h2>;

    const totalIncome = income.reduce((t, i) => t + Number(i.amount || 0), 0);
    const totalExpense = expenses.reduce((t, e) => t + Number(e.amount || 0), 0);

    return (
        <div className="clients-page" style={{ height: "100vh", overflow: "auto" }}>
            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Client Details</h1>

                <Button
                    variant="contained"
                    color="error"
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </Button>
            </div>

            {/* CONTENT */}
            <div className="content-box"
                style={{
                    background: "white",
                    padding: "30px",
                    borderRadius: "12px",
                    boxShadow: "0px 3px 12px rgba(0,0,0,0.10)",
                    minHeight: "450px",
                    fontFamily: "Verdana",
                }}
            >
                {/* NAME */}
                <h2 style={{ marginBottom: "10px" }}>
                    {capitalizeWords(client.name)}
                </h2>

                {client.contact && (
                    <p><strong>Contact:</strong> {client.contact}</p>
                )}

                <br />

                {/* STATS */}
                <p><strong>Total Projects:</strong> {projects.length}</p>
                <p><strong>Total Income:</strong> ₹{totalIncome}</p>
                <p><strong>Total Expenses:</strong> ₹{totalExpense}</p>

                <br />

                {/* PROJECTS */}
                <h3>Projects</h3>
                {projects.length === 0 ? (
                    <p>No projects found for this client.</p>
                ) : (
                    <ul>
                        {projects.map((p) => (
                            <li key={p.id}>{capitalizeWords(p.name)}</li>
                        ))}
                    </ul>
                )}

                <br />

                {/* INCOME */}
                <h3>Income Records</h3>
                {income.length === 0 ? (
                    <p>No income recorded.</p>
                ) : (
                    <ul>
                        {income.map((i) => (
                            <li key={i.id}>
                                {capitalizeWords(i.category)} — ₹{i.amount} ({i.date})
                                {i.project && <span> — {capitalizeWords(i.project)}</span>}
                            </li>
                        ))}
                    </ul>
                )}

                <br />

                {/* EXPENSES */}
                <h3>Expenses</h3>
                {expenses.length === 0 ? (
                    <p>No expenses recorded.</p>
                ) : (
                    <ul>
                        {expenses.map((e) => (
                            <li key={e.id}>
                                {capitalizeWords(e.category)} — ₹{e.amount} ({e.date})
                                {e.project && <span> — {capitalizeWords(e.project)}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ClientDetailsPage;
