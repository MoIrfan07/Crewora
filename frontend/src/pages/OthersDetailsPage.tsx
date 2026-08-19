import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import "../styles/others.css";

const capitalizeWords = (str = "") =>
    str
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

const OthersDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const otherId = id || "";
    const company = localStorage.getItem("companyName") || "default_company";

    const [otherItem, setOtherItem] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [income, setIncome] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    /* ----------------------------------------------
       LOAD EVERYTHING FROM BACKEND
    ---------------------------------------------- */
    useEffect(() => {
        const loadAll = async () => {
            try {
                // 1️⃣ Fetch all "others"
                const othersRes = await fetch(`http://127.0.0.1:5000/api/others/${company}`);
                const allOthers = await othersRes.json();

                const found = allOthers.find((o: any) => String(o.id) === String(otherId));
                setOtherItem(found);

                if (!found) {
                    setLoading(false);
                    return;
                }

                // 2️⃣ Fetch all projects
                const projRes = await fetch(`http://127.0.0.1:5000/api/projects/${company}`);
                const allProjects = await projRes.json();

                setProjects(
                    allProjects.filter((p: any) => p.other === found.name)
                );

                // 3️⃣ Fetch income
                const incomeRes = await fetch(`http://127.0.0.1:5000/api/income/${company}`);
                const allIncome = await incomeRes.json();

                setIncome(allIncome.filter((i: any) => i.from?.name === found.name));

                // 4️⃣ Fetch expenses
                const expRes = await fetch(`http://127.0.0.1:5000/api/expenses/${company}`);
                const allExpenses = await expRes.json();

                setExpenses(allExpenses.filter((e: any) => e.to?.name === found.name));

            } catch (err) {
                console.error("Failed to load details", err);
            }

            setLoading(false);
        };

        loadAll();
    }, [otherId, company]);

    if (loading) return <h2 style={{ padding: "30px" }}>Loading...</h2>;
    if (!otherItem) return <h2 style={{ padding: "30px" }}>Entry Not Found</h2>;

    const totalIncome = income.reduce((t, i) => t + Number(i.amount || 0), 0);
    const totalExpense = expenses.reduce((t, e) => t + Number(e.amount || 0), 0);

    return (
        <div className="others-page" style={{ minHeight: "100vh" }}>

            <div className="page-header compact-header">
                <h1 className="page-title">Details</h1>

                <Button
                    variant="contained"
                    color="error"
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </Button>
            </div>

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
                <h2 style={{ marginBottom: "10px" }}>
                    {capitalizeWords(otherItem.name)}
                </h2>

                <p><strong>Type:</strong> {capitalizeWords(otherItem.type)}</p>
                <p><strong>Contact:</strong> {otherItem.contact}</p>

                <br />

                <p><strong>Total Projects:</strong> {projects.length}</p>
                <p><strong>Total Income:</strong> ₹{totalIncome}</p>
                <p><strong>Total Expenses:</strong> ₹{totalExpense}</p>

                <br />

                <h3>Projects</h3>
                {projects.length === 0 ? <p>No projects.</p> :
                    <ul>
                        {projects.map((p) => (
                            <li key={p.id}>{capitalizeWords(p.name)}</li>
                        ))}
                    </ul>
                }

                <br />

                <h3>Income</h3>
                {income.length === 0 ? <p>No income recorded.</p> :
                    <ul>
                        {income.map((i) => (
                            <li key={i.id}>
                                {capitalizeWords(i.category)} — ₹{i.amount}
                                {i.project ? ` — ${i.project}` : ""}
                            </li>
                        ))}
                    </ul>
                }

                <br />

                <h3>Expenses</h3>
                {expenses.length === 0 ? <p>No expenses recorded.</p> :
                    <ul>
                        {expenses.map((e) => (
                            <li key={e.id}>
                                {capitalizeWords(e.category)} — ₹{e.amount}
                                {e.project ? ` — ${e.project}` : ""}
                            </li>
                        ))}
                    </ul>
                }
            </div>
        </div>
    );
};

export default OthersDetailsPage;
