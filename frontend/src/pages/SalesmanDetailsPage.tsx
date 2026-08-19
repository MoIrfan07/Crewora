import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/salesmen.css";
import { Button } from "@mui/material";

interface IncomeItem {
    id: number;
    from: { type: string; name: string };
    category: string;
    amount: number;
    date: string;
}

interface ExpenseItem {
    id: number;
    to: { type: string; name: string };
    category: string;
    amount: number;
    date: string;
}

interface ProjectItem {
    id: number;
    name: string;
    salesman: string;
}

const SalesmanDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const salesmanId = Number(id);
    const company = localStorage.getItem("companyName") || "default_company";

    const [salesman, setSalesman] = useState<any>(null);
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [income, setIncome] = useState<IncomeItem[]>([]);
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

    const capitalizeWords = (str = "") =>
        str
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    /* Load all details */
    // useEffect(() => {
    //     const allSalesmen = JSON.parse(localStorage.getItem(`salesmen_${company}`) || "[]");
    //     const allIncome = JSON.parse(localStorage.getItem(`income_${company}`) || "[]");
    //     const allExpenses = JSON.parse(localStorage.getItem(`expenses_${company}`) || "[]");
    //     const allProjects = JSON.parse(localStorage.getItem(`projects_${company}`) || "[]");

    //     const s = allSalesmen.find((x: any) => x.id === salesmanId);
    //     setSalesman(s);

    //     setProjects(allProjects.filter((p: any) => p.salesman === s?.name));

    //     setIncome(allIncome.filter((i: any) => i.from?.name === s?.name));

    //     setExpenses(allExpenses.filter((e: any) => e.to?.name === s?.name));
    // }, [salesmanId]);


    useEffect(() => {
        loadData();
    }, [salesmanId]);

    const loadData = async () => {
        // 1. salesman info
        const sRes = await fetch(`http://127.0.0.1:5000/api/salesmen/details/${salesmanId}`);
        const sData = await sRes.json();
        setSalesman(sData);

        if (!sData) return;

        // 2. projects
        const pRes = await fetch(`http://127.0.0.1:5000/api/salesmen/projects/${company}/${sData.name}`);
        setProjects(await pRes.json());

        // 3. income
        const iRes = await fetch(`http://127.0.0.1:5000/api/salesmen/income/${company}/${sData.name}`);
        setIncome(await iRes.json());

        // 4. expenses
        const eRes = await fetch(`http://127.0.0.1:5000/api/salesmen/expenses/${company}/${sData.name}`);
        setExpenses(await eRes.json());
    };


    if (!salesman) return <h2>Loading...</h2>;

    const totalIncome = income.reduce((t, i) => t + Number(i.amount), 0);
    const totalExpense = expenses.reduce((t, e) => t + Number(e.amount), 0);

    return (
        <div className="salesmen-page" style={{ overflowY: "auto", height: "100vh" }}>

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Salesman Details</h1>

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
                {/* NAME & CONTACT */}
                <h2 style={{ marginBottom: "10px" }}>{capitalizeWords(salesman.name)}</h2>
                <p><strong>Contact:</strong> {salesman.contact}</p>

                <br />

                {/* STATS */}
                <p><strong>Total Projects:</strong> {projects.length}</p>
                <p><strong>Total Income:</strong> SAR{totalIncome}</p>
                <p><strong>Total Expenses:</strong> SAR{totalExpense}</p>

                <br />

                {/* PROJECTS LIST */}
                <h3>Projects</h3>
                {projects.length === 0 ? (
                    <p>No projects found.</p>
                ) : (
                    <ul>
                        {projects.map((p) => (
                            <li key={p.id}>{p.name}</li>
                        ))}
                    </ul>
                )}

                <br />

                {/* INCOME LIST */}
                <h3>Income Entries</h3>
                {income.length === 0 ? (
                    <p>No income recorded.</p>
                ) : (
                    <ul>
                        {income.map((i) => (
                            <li key={i.id}>
                                {i.category} — SAR{i.amount} ({i.date})
                            </li>
                        ))}
                    </ul>
                )}

                <br />

                {/* EXPENSE LIST */}
                <h3>Expenses</h3>
                {expenses.length === 0 ? (
                    <p>No expenses.</p>
                ) : (
                    <ul>
                        {expenses.map((e) => (
                            <li key={e.id}>
                                {e.category} — SAR{e.amount} ({e.date})
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SalesmanDetailsPage;
