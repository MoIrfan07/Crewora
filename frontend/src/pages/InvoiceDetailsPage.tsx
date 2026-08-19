import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "../styles/salesmen.css"; // same styling as payment entry details

interface InvoiceItem {
    id: string;
    invoice_no: string;
    project: string;
    amount: number;
    date: string;
    description: string;
}

const InvoiceDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const company = localStorage.getItem("companyName") || "";

    const [invoice, setInvoice] = useState<InvoiceItem | null>(null);

    const capitalize = (s = "") =>
        s
            .toLowerCase()
            .split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    /* -------------------------------------------------
       LOAD INVOICE
    ------------------------------------------------- */
    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/invoices/${company}/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setInvoice({
                        id: data.id,
                        invoice_no: data.invoice_no,
                        project: data.project,
                        amount: data.amount,
                        date: data.date,
                        description: data.description || "",
                    });
                }
            });
    }, [id, company]);


    if (!invoice) return <h2>Loading...</h2>;


    /* -------------------------------------------------
       PDF GENERATION
    ------------------------------------------------- */
    const generatePDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Invoice Details", 20, 30);

        autoTable(doc, {
            head: [["Field", "Value"]],
            body: [
                ["Invoice ID", invoice.id],
                ["Invoice No", invoice.invoice_no],
                ["Project", invoice.project],
                ["Amount", "₹ " + invoice.amount],
                ["Date", invoice.date],
                ["Description", invoice.description || "-"],
            ],
            startY: 50,
            margin: { left: 20, right: 20 },
            theme: "grid",
        });

        doc.save(`Invoice_${invoice.id}.pdf`);
    };


    return (
        <div className="salesmen-page" style={{ overflowY: "auto", height: "100vh" }}>

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Invoice Details</h1>

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
                    {capitalize(invoice.invoice_no)}
                </h2>

                {/* <p><strong>Invoice ID:</strong> {invoice.id}</p> */}
                <p><strong>Invoice No:</strong> {invoice.invoice_no}</p>
                <p><strong>Project:</strong> {invoice.project}</p>
                <p><strong>Amount:</strong> ₹{invoice.amount}</p>
                <p><strong>Date:</strong> {invoice.date}</p>
                <p><strong>Description:</strong> {invoice.description || "-"}</p>
            </div>
        </div>
    );
};

export default InvoiceDetailsPage;
