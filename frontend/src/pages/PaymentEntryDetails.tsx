import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "../styles/salesmen.css";

interface PaymentItem {
    id: string;
    date: string;
    project: string;
    from: { type: string; name: string };
    amount: number;
    mode: string;
    description: string;
}

const PaymentEntryDetailsPage: React.FC = () => {

    const { id } = useParams();
    const navigate = useNavigate();
    const company = localStorage.getItem("companyName") || "";

    const [entry, setEntry] = useState<PaymentItem | null>(null);

    const capitalize = (s = "") =>
        s
            .toLowerCase()
            .split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    /* -------------------------------------------------
       LOAD PAYMENT ENTRY
    ------------------------------------------------- */
    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/payment-entry/${company}/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setEntry({
                        id: data.id,
                        date: data.date,
                        project: data.project,
                        from: { type: data.from_type, name: data.from_name },
                        amount: data.amount,
                        mode: data.mode,
                        description: data.description || "",
                    });
                }
            });
    }, [id, company]);


    if (!entry) return <h2>Loading...</h2>;


    /* -------------------------------------------------
       PDF GENERATION
    ------------------------------------------------- */
    const generatePDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Payment Entry Details", 20, 30);

        autoTable(doc, {
            head: [["Field", "Value"]],
            body: [
                ["Payment ID", entry.id],
                ["Date", entry.date],
                ["Project", entry.project],
                // ["Party Type", capitalize(entry.from.type)],
                ["Party Name", capitalize(entry.from.name)],
                ["Amount", "₹ " + entry.amount],
                ["Mode", entry.mode],
                ["Description", entry.description || "-"],
            ],
            startY: 50,
            margin: { left: 20, right: 20 },
            theme: "grid",
        });

        doc.save(`PaymentEntry_${entry.id}.pdf`);
    };


    return (
        <div className="salesmen-page" style={{ overflowY: "auto", height: "100vh" }}>

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Payment Entry Details</h1>

                <div style={{ display: "flex", gap: 10 }}>
                    <Button variant="outlined" onClick={generatePDF}>
                        Download PDF
                    </Button>

                    <Button variant="contained" color="error" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>
            </div>

            {/* CONTENT */}
            <div
                className="content-box"
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
                    {capitalize(entry.from.name)}
                </h2>

                <p><strong>Payment ID:</strong> {entry.id}</p>
                <p><strong>Date:</strong> {entry.date}</p>
                <p><strong>Project:</strong> {entry.project}</p>
                {/* <p><strong>Party Type:</strong> {capitalize(entry.from.type)}</p> */}
                <p><strong>Party Name:</strong> {capitalize(entry.from.name)}</p>
                <p><strong>Amount:</strong> SAR {entry.amount}</p>
                <p><strong>Mode:</strong> {entry.mode}</p>
                <p><strong>Description:</strong> {entry.description || "-"}</p>
            </div>
        </div>
    );
};

export default PaymentEntryDetailsPage;
