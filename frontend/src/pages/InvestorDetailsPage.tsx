import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Investors.css";
import { Button } from "@mui/material";

const InvestorDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const investorId = Number(id);
    const company = localStorage.getItem("companyName") || "default_company";

    const [investor, setInvestor] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [income, setIncome] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const capitalizeWords = (str = "") =>
        str
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    /* ----------------------------------------------------------
       FETCH INVESTOR, PROJECTS, INCOME, EXPENSES FROM BACKEND
    ----------------------------------------------------------- */
    useEffect(() => {
        const loadAll = async () => {
            try {
                // 1️⃣ Fetch investor by ID
                // 1️⃣ Fetch investor by ID
                const invRes = await fetch(
                    `http://127.0.0.1:5000/api/investors/${company}`
                );
                const allInvestors = await invRes.json();

                // FIX: compare IDs as string
                const inv = allInvestors.find((x: any) => String(x.id) === String(investorId));

                if (!inv) {
                    setInvestor(null);
                    setLoading(false);
                    return;
                }

                setInvestor(inv);

                // 2️⃣ Fetch projects assigned to this investor
                const projRes = await fetch(
                    `http://127.0.0.1:5000/api/projects/${company}`
                );
                const allProjects = await projRes.json();
                setProjects(allProjects.filter((p: any) => p.investor === inv.name));

                // 3️⃣ Fetch income "from" this investor
                const incomeRes = await fetch(
                    `http://127.0.0.1:5000/api/income/${company}`
                );
                const allIncome = await incomeRes.json();
                setIncome(allIncome.filter((i: any) => i.from?.name === inv.name));

                // 4️⃣ Fetch expenses "to" this investor
                const expRes = await fetch(
                    `http://127.0.0.1:5000/api/expenses/${company}`
                );
                const allExpenses = await expRes.json();
                setExpenses(allExpenses.filter((e: any) => e.to?.name === inv.name));

            } catch (error) {
                console.error("Failed to load investor details", error);
            }

            setLoading(false);
        };

        loadAll();
    }, [investorId, company]);

    if (loading) return <h2>Loading...</h2>;
    if (!investor) return <h2>Investor not found</h2>;

    const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return (
        <div className="investors-page" style={{ overflowY: "auto", height: "100vh" }}>

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Investor Details</h1>

                <Button
                    variant="contained"
                    color="error"
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </Button>
            </div>

            {/* CONTENT BOX */}
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
                {/* BASIC INFO */}
                <h2 style={{ marginBottom: "10px" }}>{capitalizeWords(investor.name)}</h2>

                <p><strong>Contact:</strong> {investor.contact}</p>

                <br />

                {/* SUMMARY */}
                <p><strong>Total Projects:</strong> {projects.length}</p>
                <p><strong>Total Income:</strong> ₹{totalIncome}</p>
                <p><strong>Total Expenses:</strong> ₹{totalExpense}</p>

                <br />

                {/* PROJECTS */}
                <h3>Projects</h3>
                {projects.length === 0 ? (
                    <p>No projects found.</p>
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
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default InvestorDetailsPage;
