import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import "../styles/expenses.css";

interface ExpenseItem {
    id: string;
    to: { type: string; name: string };
    client?: string;
    project?: string;
    description?: string;
    category: string;
    amount: number;
    date: string;
}

const ExpenseDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [expense, setExpense] = useState<ExpenseItem | null>(null);
    const company = localStorage.getItem("companyName") || "";

    const capitalizeWords = (str: any = "") =>
        String(str)
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    /* ---------------------- FETCH EXPENSE BY ID ---------------------- */
    useEffect(() => {
        if (!company || !id) return;

        fetch(`http://127.0.0.1:5000/api/expenses/${company}/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (!data) return setExpense(null);

                setExpense({
                    id: data.id,
                    to: { type: data.to_type, name: data.to_name },
                    client: data.client,
                    project: data.project,
                    description: data.description,
                    category: data.category,
                    amount: data.amount,
                    date: data.date,
                });
            })
            .catch(() => setExpense(null));
    }, [company, id]);

    return (
        <div className="expenses-page">

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Expense Details</h1>

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
                    marginTop: "10px",
                    minHeight: "450px",
                    fontFamily: "Verdana",
                }}
            >
                {!expense ? (
                    <h2 style={{ color: "red" }}>Expense Record Not Found</h2>
                ) : (
                    <>
                        <h2
                            style={{
                                marginBottom: "15px",
                                fontWeight: "bold",
                                fontSize: "20px",
                            }}
                        >
                            {expense.category} – ₹{expense.amount}
                        </h2>

                        <p>
                            <strong>To: </strong>
                            {`${capitalizeWords(expense.to.type)}: ${capitalizeWords(expense.to.name)}`}
                        </p>

                        <p>
                            <strong>Client: </strong>
                            {expense.client ? capitalizeWords(expense.client) : "N/A"}
                        </p>

                        <p>
                            <strong>Project: </strong>
                            {expense.project ? capitalizeWords(expense.project) : "N/A"}
                        </p>

                        <p>
                            <strong>Description: </strong>
                            {expense.description
                                ? capitalizeWords(expense.description)
                                : "N/A"}
                        </p>

                        <p>
                            <strong>Amount: </strong>₹{expense.amount}
                        </p>

                        <p>
                            <strong>Date: </strong>{expense.date}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default ExpenseDetailsPage;
