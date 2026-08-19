import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import "../styles/income.css";

interface IncomeItem {
    id: string;
    from: { type: string; name: string };
    client?: string;
    project?: string;
    description?: string;
    category: string;
    amount: number;
    date: string;
}

const IncomeDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [income, setIncome] = useState<IncomeItem | null>(null);
    const company = localStorage.getItem("companyName") || "";

    const capitalizeWords = (str: any = "") =>
        String(str)
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    /* ---------------------- FETCH INCOME BY ID ---------------------- */
    useEffect(() => {
        if (!company || !id) return;

        fetch(`http://127.0.0.1:5000/api/income/${company}/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (!data) return setIncome(null);

                setIncome({
                    id: data.id,
                    from: { type: data.from_type, name: data.from_name },
                    client: data.client,
                    project: data.project,
                    description: data.description,
                    category: data.category,
                    amount: data.amount,
                    date: data.date,
                });
            })
            .catch(() => setIncome(null));
    }, [company, id]);

    return (
        <div className="income-page">

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Income Details</h1>

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
                {!income ? (
                    <h2 style={{ color: "red" }}>Income Record Not Found</h2>
                ) : (
                    <>
                        <h2
                            style={{
                                marginBottom: "15px",
                                fontWeight: "bold",
                                fontSize: "20px",
                            }}
                        >
                            {income.category} – ₹{income.amount}
                        </h2>

                        <p>
                            <strong>From: </strong>
                            {`${capitalizeWords(income.from.type)}: ${capitalizeWords(income.from.name)}`}
                        </p>

                        <p>
                            <strong>Client: </strong>
                            {income.client ? capitalizeWords(income.client) : "N/A"}
                        </p>

                        <p>
                            <strong>Project: </strong>
                            {income.project ? capitalizeWords(income.project) : "N/A"}
                        </p>

                        <p>
                            <strong>Description: </strong>
                            {income.description ? capitalizeWords(income.description) : "N/A"}
                        </p>

                        <p>
                            <strong>Amount: </strong>₹{income.amount}
                        </p>

                        <p>
                            <strong>Date: </strong>{income.date}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default IncomeDetailsPage;
