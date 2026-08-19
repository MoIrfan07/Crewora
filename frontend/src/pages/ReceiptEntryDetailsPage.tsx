import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "../styles/salesmen.css"; // using same styles as PaymentEntryDetails

interface ReceiptItem {
    id: string;
    project: string;
    invoice_no: string;
    amount: number;
    mode: string;
    date: string;
    description?: string;
}

const ReceiptEntryDetailsPage: React.FC = () => {

    const { id } = useParams();
    const navigate = useNavigate();
    const company = localStorage.getItem("companyName") || "";

    const [entry, setEntry] = useState<ReceiptItem | null>(null);

    /* FORMAT TEXT */
    const cap = (s = "") =>
        s
            .toLowerCase()
            .split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    /* -------------------------------------------------
       LOAD RECEIPT ENTRY
    ------------------------------------------------- */
    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/receipt/${company}/${id}`)
            .then(res => res.json())
            .then((data) => {
                if (data) {
                    setEntry({
                        id: data.id,
                        project: data.project,
                        invoice_no: data.invoice_no,
                        amount: data.amount,
                        mode: data.mode,
                        date: data.date,
                        description: data.description || "-",
                    });
                }
            });
    }, [id, company]);


    if (!entry) return <h2>Loading...</h2>;

    /* -------------------------------------------------
       PDF EXPORT (Same Style as Payment Entry PDF)
    ------------------------------------------------- */
    const generatePDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Receipt Entry Details", 20, 30);

        autoTable(doc, {
            head: [["Field", "Value"]],
            body: [
                ["Receipt ID", entry.id],
                ["Date", entry.date],
                ["Project", entry.project],
                ["Invoice No", entry.invoice_no],
                ["Amount", "₹ " + entry.amount],
                ["Mode", entry.mode],
                ["Description", entry.description || "-"],
            ],
            startY: 50,
            margin: { left: 20, right: 20 },
            theme: "grid",
        });

        doc.save(`ReceiptEntry_${entry.id}.pdf`);
    };


    return (
        <div className="salesmen-page" style={{ overflowY: "auto", height: "100vh" }}>

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Receipt Entry Details</h1>

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
                    Receipt — {entry.invoice_no}
                </h2>

                <p><strong>Date:</strong> {entry.date}</p>
                <p><strong>Project:</strong> {entry.project}</p>
                <p><strong>Invoice No:</strong> {entry.invoice_no}</p>
                <p><strong>Amount:</strong> SAR{entry.amount}</p>
                <p><strong>Mode:</strong> {entry.mode}</p>
                <p><strong>Description:</strong> {entry.description || "-"}</p>
            </div>
        </div>
    );
};

export default ReceiptEntryDetailsPage;
