import React, { useEffect, useMemo, useState } from "react";
import {
    Button,
    TextField,
    MenuItem,
    Paper,
    FormControlLabel,
    Radio,
    RadioGroup,
    FormControl,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";

import SoAFullTable from "../components/SoATable";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ---------------------------------------------
   CONSTANTS
---------------------------------------------- */
const MONTHS = [
    { label: "Jan", value: 1 },
    { label: "Feb", value: 2 },
    { label: "Mar", value: 3 },
    { label: "Apr", value: 4 },
    { label: "May", value: 5 },
    { label: "Jun", value: 6 },
    { label: "Jul", value: 7 },
    { label: "Aug", value: 8 },
    { label: "Sep", value: 9 },
    { label: "Oct", value: 10 },
    { label: "Nov", value: 11 },
    { label: "Dec", value: 12 }
];

const SoA: React.FC = () => {
    const company = localStorage.getItem("companyName") || "";

    /* ---------------------------------------------
       DATA
    ---------------------------------------------- */
    const [paymentEntries, setPaymentEntries] = useState<any[]>([]);
    const [internalPayments, setInternalPayments] = useState<any[]>([]);
    const [investorEntries, setInvestorEntries] = useState<any[]>([]);
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [partyList, setPartyList] = useState<string[]>([]);
    const [currentAssetsList, setCurrentAssetsList] = useState<string[]>([]);

    /* ---------------------------------------------
       FILTER STATE
    ---------------------------------------------- */
   const [ledgerType, setLedgerType] = useState<"all" | "party" | "asset">("all");

    const [ledgerName, setLedgerName] = useState("");

    const [projectFilter, setProjectFilter] = useState("");
    const [year, setYear] = useState<number | "All">("All");
    const [monthMode, setMonthMode] = useState<"single" | "multiple">("single");
    const [singleMonth, setSingleMonth] = useState<number | "">("");
    const [fromMonth, setFromMonth] = useState<number | "">("");
    const [toMonth, setToMonth] = useState<number | "">("");

    /* ---------------------------------------------
       PDF STATE
    ---------------------------------------------- */
    const [pdfDialog, setPdfDialog] = useState(false);
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

    /* ---------------------------------------------
       LOAD PAYMENT ENTRIES
    ---------------------------------------------- */
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/payment-entry/${company}`)
            .then(r => r.json())
            .then(data => {
                setPaymentEntries(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Failed to load payment entries:", err);
                setPaymentEntries([]);
            });
    }, [company]);

    /* ---------------------------------------------
       LOAD INTERNAL PAYMENTS
    ---------------------------------------------- */
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/internal-payments/${company}`)
            .then(r => r.json())
            .then(data => {
                setInternalPayments(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Failed to load internal payments:", err);
                setInternalPayments([]);
            });
    }, [company]);

    /* ---------------------------------------------
       LOAD INVESTOR ENTRIES
    ---------------------------------------------- */
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/investors/${company}`)
            .then(r => r.json())
            .then(data => {
                setInvestorEntries(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Failed to load investor entries:", err);
                setInvestorEntries([]);
            });
    }, [company]);

    /* ---------------------------------------------
       LOAD PROJECTS
    ---------------------------------------------- */
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/projects/${company}`)
            .then(r => r.json())
            .then(data => setProjectsList(Array.isArray(data) ? data : []))
            .catch(() => setProjectsList([]));
    }, [company]);

    /* ---------------------------------------------
       LOAD PARTY MASTER
    ---------------------------------------------- */
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/others/${company}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPartyList(data.map((x: any) => x.name));
                }
            });
    }, [company]);

    /* ---------------------------------------------
       LOAD CURRENT ASSETS MASTER
    ---------------------------------------------- */
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/current-assets/${company}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCurrentAssetsList(data.map((x: any) => x.display));
                }
            });
    }, [company]);

    /* ---------------------------------------------
       TRANSFORM DATA INTO LEDGER FORMAT
    ---------------------------------------------- */
    const ledgerTransactions = useMemo(() => {
        const transactions: any[] = [];

        // ✅ Process Payment Entries
        paymentEntries.forEach(entry => {
            const partyName = entry.party_name || entry.from_name || entry.from || "";

            if (!partyName) return;

            // Build description with project and mode info
            const descParts = [];
            if (entry.description) descParts.push(entry.description);
            if (entry.project) descParts.push(`Project: ${entry.project}`);
            if (entry.mode) descParts.push(`Mode: ${entry.mode}`);

            const fullDescription = descParts.length > 0
                ? descParts.join(" | ")
                : "Payment Entry";

            // Payment Entry creates:
            // DEBIT: Party/Asset account (money going OUT)
            transactions.push({
                id: `PE-${entry.id}`,
                original_id: entry.id,
                date: entry.date,
                project: entry.project,
                party: partyName,
                account_name: partyName,
                account_type: currentAssetsList.includes(partyName) ? "asset" : "party",
                debit: Number(entry.amount || 0),
                credit: 0,
                description: fullDescription,
                mode: entry.mode
            });

            // CREDIT: Cash/Bank account entry
            const cashBankAccount = entry.mode === "Cash"
                ? currentAssetsList.find(a => /^cash\s*a\/c/i.test(a))
                : currentAssetsList.find(a => /^bank\s*a\/c/i.test(a));

            if (cashBankAccount) {
                transactions.push({
                    id: `PE-CB-${entry.id}`,
                    original_id: entry.id,
                    date: entry.date,
                    project: entry.project,
                    party: cashBankAccount,
                    account_name: cashBankAccount,
                    account_type: "asset",
                    debit: 0,
                    credit: Number(entry.amount || 0),
                    description: `Payment to ${partyName}${entry.description ? ' | ' + entry.description : ''}`,
                    mode: entry.mode
                });
            }
        });

        // ✅ Process Internal Payments
        internalPayments.forEach(transfer => {
            const fromAccount = transfer.from_acc;
            const toAccount = transfer.to_acc;

            // Build description for transfer
            const transferDesc = transfer.description
                ? `${transfer.description} | Transfer to ${toAccount}`
                : `Internal Transfer to ${toAccount}`;

            // FROM Account (CREDIT - money going out)
            transactions.push({
                id: `IP-FROM-${transfer.id}`,
                original_id: transfer.id,
                date: transfer.date,
                project: "Head Office",
                party: fromAccount,
                account_name: fromAccount,
                account_type: "asset",
                debit: 0,
                credit: Number(transfer.amount || 0),
                description: transferDesc,
                mode: "Transfer"
            });

            const receiveDesc = transfer.description
                ? `${transfer.description} | Transfer from ${fromAccount}`
                : `Internal Transfer from ${fromAccount}`;

            // TO Account (DEBIT - money coming in)
            transactions.push({
                id: `IP-TO-${transfer.id}`,
                original_id: transfer.id,
                date: transfer.date,
                project: "Head Office",
                party: toAccount,
                account_name: toAccount,
                account_type: "asset",
                debit: Number(transfer.amount || 0),
                credit: 0,
                description: receiveDesc,
                mode: "Transfer"
            });
        });

        // ✅ Process Investor Entries (Capital A/C)
        investorEntries.forEach(entry => {
            const investorName = entry.party;
            if (!investorName) return;

            // 🔑 Find matching Capital A/C name
            const capitalAccount =
                currentAssetsList.find(a =>
                    a.toLowerCase().includes(investorName.toLowerCase())
                ) || `Capital A/C - ${investorName}`;

            const desc = entry.description
                ? `Capital Investment | ${entry.description}`
                : "Capital Investment";

            transactions.push({
                id: `INV-${entry.id}`,
                original_id: entry.id,
                date: entry.date,
                project: "Head Office",
                party: capitalAccount,
                account_name: capitalAccount,
                account_type: "asset",
                debit: Number(entry.amount || 0),
                credit: 0,
                description: desc,
                mode: entry.mode
            });
        });

        return transactions;
    }, [paymentEntries, internalPayments, investorEntries, currentAssetsList]);


    /* ---------------------------------------------
       LEDGER FILTER LOGIC - SIMPLIFIED
    ---------------------------------------------- */
    const filteredRows = useMemo(() => {
        return ledgerTransactions.filter(r => {
            const d = new Date(r.date);
            if (!d.getTime()) return false;

            // Filter by ledger name - show ALL rows related to this ledger
            if (ledgerName) {
                const ledgerLower = ledgerName.toLowerCase();
                const isRelated = 
                    r.account_name?.toLowerCase() === ledgerLower ||
                    r.party?.toLowerCase() === ledgerLower ||
                    (ledgerName.includes("Cash") && r.mode === "Cash") ||
                    (ledgerName.includes("Bank") && r.mode === "Bank");
                
                if (!isRelated) return false;
            } else if (ledgerType !== "all") {
                // Only apply ledger type filter when no specific ledger is selected
                if (r.account_type !== ledgerType) return false;
            }

            // Filter by year
            if (year !== "All" && d.getFullYear() !== year) return false;

            // Filter by month
            if (monthMode === "single" && singleMonth !== "") {
                if (d.getMonth() + 1 !== Number(singleMonth)) return false;
            }

            if (monthMode === "multiple" && fromMonth && toMonth) {
                const m = d.getMonth() + 1;
                const min = Math.min(Number(fromMonth), Number(toMonth));
                const max = Math.max(Number(fromMonth), Number(toMonth));
                if (m < min || m > max) return false;
            }

            // Filter by project
            if (projectFilter && r.project !== projectFilter) return false;

            return true;
        });
    }, [
        ledgerTransactions,
        ledgerType,
        ledgerName,
        year,
        monthMode,
        singleMonth,
        fromMonth,
        toMonth,
        projectFilter
    ]);

    /* ---------------------------------------------
       RUNNING BALANCE
    ---------------------------------------------- */
    const withBalance = useMemo(() => {
        let balance = 0;

        return filteredRows
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .map(r => {
                balance += Number(r.debit || 0) - Number(r.credit || 0);
                return {
                    ...r,
                    balance,
                    drcr: balance >= 0 ? "Dr" : "Cr"
                };
            });
    }, [filteredRows]);

    /* ---------------------------------------------
       CALCULATE OPENING & CLOSING BALANCE
    ---------------------------------------------- */
    const { openingBalance, closingBalance } = useMemo(() => {
        const opening = 0;
        const closing = withBalance.length > 0
            ? withBalance[withBalance.length - 1].balance
            : 0;

        return { openingBalance: opening, closingBalance: closing };
    }, [withBalance]);

    /* ---------------------------------------------
       PDF GENERATION
    ---------------------------------------------- */
    const generatePDF = async (
        orientation: "p" | "landscape",
        preview = false
    ) => {
        const doc = new jsPDF(orientation, "pt", "a4");

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Statement of Account`, 40, 40);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Ledger: ${ledgerName || "All Ledgers"}`, 40, 60);
        doc.text(`Period: ${year === "All" ? "All Years" : year}`, 40, 75);

        // Opening Balance
        doc.text(
            `Opening Balance: ${openingBalance >= 0 ? "Dr" : "Cr"} ${Math.abs(openingBalance).toFixed(2)}`,
            40,
            90
        );

        autoTable(doc, {
            startY: 110,
            margin: { left: 40, right: 40 },
            head: [["Date", "Party/Account", "Description", "Debit", "Credit", "Balance", "Dr/Cr"]],
            body: withBalance.map(r => [
                r.date,
                r.party,
                r.description || "-",
                r.debit ? Number(r.debit).toFixed(2) : "-",
                r.credit ? Number(r.credit).toFixed(2) : "-",
                Math.abs(Number(r.balance)).toFixed(2),
                r.drcr
            ]),
            theme: "striped",
            styles: {
                fontSize: 9,
                cellPadding: 6
            },
            headStyles: {
                fillColor: [66, 66, 66],
                textColor: [255, 255, 255],
                fontStyle: "bold"
            }
        });

        // Closing Balance
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFont("helvetica", "bold");
        doc.text(
            `Closing Balance: ${closingBalance >= 0 ? "Dr" : "Cr"} ${Math.abs(closingBalance).toFixed(2)}`,
            40,
            finalY
        );

        if (preview) {
            const blob = doc.output("blob");
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
            setPdfPreviewOpen(true);
        } else {
            doc.save(`Statement_of_Account_${ledgerName || "All"}.pdf`);
        }
    };

    /* ---------------------------------------------
       UI
    ---------------------------------------------- */
    return (
        <div className="projectstatement-page">
            <div className="ps-header">
                <h1 className="ps-title">Statement of Account</h1>
            </div>

            <div className="filter-controls">
                <Paper className="ps-filter-bar" elevation={2}>
                    <TextField
                        select
                        size="small"
                        label="Year"
                        value={year}
                        onChange={e =>
                            setYear(
                                e.target.value === "All"
                                    ? "All"
                                    : Number(e.target.value)
                            )
                        }
                        sx={{ width: 120 }}
                    >
                        <MenuItem value="All">All</MenuItem>
                        {[2022, 2023, 2024, 2025, 2026].map(y => (
                            <MenuItem key={y} value={y}>
                                {y}
                            </MenuItem>
                        ))}
                    </TextField>

                    <FormControl>
                        <RadioGroup
                            row
                            value={monthMode}
                            onChange={e =>
                                setMonthMode(e.target.value as any)
                            }
                        >
                            <FormControlLabel
                                value="single"
                                control={<Radio size="small" />}
                                label="Single"
                            />
                            <FormControlLabel
                                value="multiple"
                                control={<Radio size="small" />}
                                label="Multiple"
                            />
                        </RadioGroup>
                    </FormControl>

                    {monthMode === "single" ? (
                        <TextField
                            select
                            size="small"
                            label="Month"
                            value={singleMonth}
                            onChange={e => setSingleMonth(Number(e.target.value))}
                            sx={{ width: 140 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            {MONTHS.map(m => (
                                <MenuItem key={m.value} value={m.value}>
                                    {m.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    ) : (
                        <>
                            <TextField
                                select
                                size="small"
                                label="From"
                                value={fromMonth}
                                onChange={e => setFromMonth(Number(e.target.value))}
                                sx={{ width: 120 }}
                            >
                                <MenuItem value="">Select</MenuItem>
                                {MONTHS.map(m => (
                                    <MenuItem key={m.value} value={m.value}>
                                        {m.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                size="small"
                                label="To"
                                value={toMonth}
                                onChange={e => setToMonth(Number(e.target.value))}
                                sx={{ width: 120 }}
                            >
                                <MenuItem value="">Select</MenuItem>
                                {MONTHS.map(m => (
                                    <MenuItem key={m.value} value={m.value}>
                                        {m.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </>
                    )}

                    <TextField
                        select
                        size="small"
                        label="Ledger Type"
                        value={ledgerType}
                        onChange={e => {
                            setLedgerType(e.target.value as any);
                            setLedgerName("");
                        }}
                        sx={{ width: 160 }}
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="party">Party</MenuItem>
                        <MenuItem value="asset">Current Asset</MenuItem>
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Ledger"
                        value={ledgerName}
                        onChange={e => setLedgerName(e.target.value)}
                        sx={{ width: 240 }}
                    >
                        <MenuItem value="">All Ledgers</MenuItem>
                        {(
                            ledgerType === "party"
                                ? partyList
                                : ledgerType === "asset"
                                    ? currentAssetsList
                                    : [...partyList, ...currentAssetsList]
                        ).map(l => (
                            <MenuItem key={l} value={l}>
                                {l}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Project"
                        value={projectFilter}
                        onChange={e => setProjectFilter(e.target.value)}
                        sx={{ width: 180 }}
                    >
                        <MenuItem value="">All Projects</MenuItem>
                        {projectsList.map(p => (
                            <MenuItem key={p.name} value={p.name}>
                                {p.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="contained"
                        onClick={() => setPdfDialog(true)}
                        disabled={!ledgerName}
                    >
                        PDF
                    </Button>
                </Paper>
            </div>

            {/* SUMMARY */}
            <Paper sx={{ p: 2, m: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                        <strong>Opening Balance:</strong> {openingBalance >= 0 ? "Dr" : "Cr"}{" "}
                        {Math.abs(openingBalance).toFixed(2)}
                    </div>
                    <div>
                        <strong>Closing Balance:</strong> {closingBalance >= 0 ? "Dr" : "Cr"}{" "}
                        {Math.abs(closingBalance).toFixed(2)}
                    </div>
                    <div>
                        <strong>Total Transactions:</strong> {withBalance.length}
                    </div>
                </div>
            </Paper>

            <SoAFullTable rows={withBalance} />

            {/* PDF DIALOG */}
            <Dialog open={pdfDialog} onClose={() => setPdfDialog(false)}>
                <DialogTitle>Select PDF Orientation</DialogTitle>
                <DialogContent>
                    <Button
                        fullWidth
                        sx={{ mb: 2 }}
                        variant="contained"
                        onClick={() => {
                            setPdfDialog(false);
                            generatePDF("p", true);
                        }}
                    >
                        Portrait
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={() => {
                            setPdfDialog(false);
                            generatePDF("landscape", true);
                        }}
                    >
                        Landscape
                    </Button>
                </DialogContent>
            </Dialog>

            <Dialog
                open={pdfPreviewOpen}
                onClose={() => setPdfPreviewOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>PDF Preview</DialogTitle>
                <DialogContent sx={{ height: "80vh" }}>
                    {pdfBlobUrl && (
                        <iframe
                            src={pdfBlobUrl}
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none"
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPdfPreviewOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default SoA;