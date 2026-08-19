import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import "../styles/Income.css"; // reused style box

interface ProjectRecord {
    id: number;
    name: string;
    client: string;
    status: string;
    category: string;
    salesman: string;
    date: string;
}

interface IncomeRecord {
    id: string;
    category: string;
    amount: number;
    date: string;
    client?: string;
    project?: string;
}

interface ExpenseRecord {
    id: string;
    category: string;
    amount: number;
    date: string;
    client?: string;
    project?: string;
}

const ProjectDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState<ProjectRecord | null>(null);
    const [income, setIncome] = useState<IncomeRecord[]>([]);
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

    const company = localStorage.getItem("companyName") || "";

    const cap = (str: any = "") =>
        String(str)
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id || !company) return;

        // 1️⃣ Fetch project list and find specific project
        const pRes = await fetch(`http://127.0.0.1:5000/api/projects/${company}`);
        const allProjects = await pRes.json();
        const selected = allProjects.find((p: any) => p.id == id);
        setProject(selected || null);

        if (!selected) return;

        // 2️⃣ Fetch all income
        const iRes = await fetch(`http://127.0.0.1:5000/api/income/${company}`);
        const allIncome = await iRes.json();
        setIncome(allIncome.filter((i: any) => i.project === selected.name));

        // 3️⃣ Fetch all expenses
        const eRes = await fetch(`http://127.0.0.1:5000/api/expenses/${company}`);
        const allExpenses = await eRes.json();
        setExpenses(allExpenses.filter((e: any) => e.project === selected.name));
    };

    if (!project) return <h2 style={{ padding: 20 }}>Loading...</h2>;

    const totalIncome = income.reduce((t, i) => t + Number(i.amount), 0);
    const totalExpenses = expenses.reduce((t, e) => t + Number(e.amount), 0);

    return (
        <div className="income-page">
            <div className="page-header compact-header">
                <h1 className="page-title">Project Details</h1>

                <Button variant="contained" color="error" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
            </div>

            <div className="content-box"
                style={{
                    background: "white",
                    padding: "30px",
                    borderRadius: "12px",
                    boxShadow: "0px 3px 12px rgba(0,0,0,0.10)",
                    marginTop: "10px",
                    minHeight: "100vh",
                    fontFamily: "Montserrat, sans-serif",
                }}
            >
                <h2 style={{ marginBottom: "15px" }}>
                    {cap(project.name)}
                </h2>

                <p><strong>Client:</strong> {cap(project.client)}</p>
                <p><strong>Salesman:</strong> {cap(project.salesman)}</p>
                <p><strong>Status:</strong> {cap(project.status)}</p>
                <p><strong>Category:</strong> {cap(project.category)}</p>
                <p><strong>Date:</strong> {project.date}</p>

                <br />

                <p><strong>Total Income:</strong> SAR{totalIncome}</p>
                <p><strong>Total Expenses:</strong> SAR{totalExpenses}</p>
                <p><strong>Net Balance:</strong> SAR{totalIncome - totalExpenses}</p>

                <br />

                <h3>Income Records</h3>
                {income.length === 0 ? (
                    <p>No income for this project.</p>
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

                <h3>Expense Records</h3>
                {expenses.length === 0 ? (
                    <p>No expenses for this project.</p>
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

export default ProjectDetailsPage;
