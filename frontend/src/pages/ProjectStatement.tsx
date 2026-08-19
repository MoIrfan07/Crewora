// src/pages/ProjectStatement.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { GridSortModel } from "@mui/x-data-grid";

import {
    Button,
    TextField,
    MenuItem,
    Popover,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormControl,
    Paper,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeFilter from "../components/DateRangeFilter";
import dayjs from "dayjs";
import { format } from "date-fns";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

import LedgerTable from "../components/LedgerTable";
import "../styles/projectstatement.css";

interface PaymentItem {
    id: string;
    date: string;
    project: string;
    from_type?: string;
    from_name?: string;
    amount: number;
    mode?: string;
    description?: string;
}

interface ReceiptItem {
    id: string;
    date: string;
    project: string;
    invoice_no: string;
    amount: number;
    mode?: string;
    description?: string;
}

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
    { label: "Dec", value: 12 },
];

const ProjectStatement: React.FC = () => {
    const navigate = useNavigate();
    const company = localStorage.getItem("companyName") || "";

    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [pdfDialog, setPdfDialog] = useState(false);
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

    const [year, setYear] = useState<number | "All">("All");
    const [singleMonth, setSingleMonth] = useState<number | "">("");
    const [fromMonth, setFromMonth] = useState<number | "">("");
    const [toMonth, setToMonth] = useState<number | "">("");
    const [projectFilter, setProjectFilter] = useState<string>("");
    const [search, setSearch] = useState("");

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [range, setRange] = useState<any>({
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2100, 0, 1),
    });

    const [sortModel, setSortModel] = useState<GridSortModel>([]);
    const [monthMode, setMonthMode] = useState<"single" | "multiple">("single");

    /* LOAD DATA */
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/payment-entry/${company}`)
            .then((r) => r.json())
            .then((d) => setPayments(Array.isArray(d) ? d : []))
            .catch(() => setPayments([]));

        fetch(`http://127.0.0.1:5000/api/invoices/${company}`)
            .then((r) => r.json())
            .then((d) => setReceipts(Array.isArray(d) ? d : []))
            .catch(() => setReceipts([]));

        fetch(`http://127.0.0.1:5000/api/projects/${company}`)
            .then((r) => r.json())
            .then((d) => setProjectsList(Array.isArray(d) ? d : []))
            .catch(() => setProjectsList([]));
    }, [company]);

    const capitalize = (s = "") =>
        s
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join(" ");

    /* YEAR OPTIONS */
    const years = useMemo(() => {
        const ys = new Set<number>();
        [...payments, ...receipts].forEach((r) => {
            const dt = new Date(r.date);
            if (!isNaN(dt.getTime())) ys.add(dt.getFullYear());
        });
        const arr = Array.from(ys).sort((a, b) => b - a);
        return arr.length ? arr : [new Date().getFullYear()];
    }, [payments, receipts]);

    /* FILTER DATE */
    const inSelectedYearMonth = (dateStr?: string) => {
        if (!dateStr) return false;

        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;

        if (year !== "All" && d.getFullYear() !== year) return false;

        if (monthMode === "single" && singleMonth !== "") {
            if (d.getMonth() + 1 !== Number(singleMonth)) return false;
        }

        if (monthMode === "multiple" && fromMonth !== "" && toMonth !== "") {
            const m = d.getMonth() + 1;
            const start = Math.min(Number(fromMonth), Number(toMonth));
            const end = Math.max(Number(fromMonth), Number(toMonth));
            if (m < start || m > end) return false;
        }

        const t = d.getTime();
        if (t < new Date(range.startDate).getTime()) return false;
        if (t > new Date(range.endDate).getTime()) return false;

        return true;
    };

    const DATA_SHOWN = projectFilter.trim() !== "";

    /* FILTERED LISTS */
    const filteredCredits = useMemo(() => {
        if (!DATA_SHOWN) return [];
        return payments
            .filter((p) => p.project === projectFilter)
            .filter((p) => inSelectedYearMonth(p.date))
            .filter((p) => {
                const hay = `${p.from_name} ${p.description} ${p.mode} ${p.project} ${p.amount}`
                    .toLowerCase();
                return hay.includes(search.toLowerCase());
            });
    }, [payments, projectFilter, year, monthMode, singleMonth, fromMonth, toMonth, search, range]);

    const filteredDebits = useMemo(() => {
        if (!DATA_SHOWN) return [];
        return receipts
            .filter((r) => r.project === projectFilter)
            .filter((r) => inSelectedYearMonth(r.date))
            .filter((r) => {
                const hay = `${r.project} ${r.invoice_no} ${r.amount} ${r.description}`.toLowerCase();
                return hay.includes(search.toLowerCase());
            });
    }, [receipts, projectFilter, year, monthMode, singleMonth, fromMonth, toMonth, search, range]);

    /* TOTALS */
    const totalCredit = filteredCredits.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalDebit = filteredDebits.reduce((s, r) => s + Number(r.amount || 0), 0);
    const balance = totalDebit - totalCredit;

    /* TABLE COLUMNS */
    const creditColumns = [
        {
            field: "from_name",
            headerName: "Credit - Details",
            flex: 1,
            renderCell: (params: any) => {
                const r = params.row;
                return (
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.3 }}>
                        <strong>
                            {capitalize(r.from_name || "")}
                            {r.description ? ` ${r.description}` : ""}
                            {r.mode ? ` - ${r.mode}` : ""}
                            {r.project ? ` - ${r.project}` : ""}
                        </strong>
                    </div>
                );
            },
        },
        {
            field: "amount",
            headerName: "Amount",
            flex: 0.3,
            type: "number",
            align: "right",
            headerAlign: "right",
            valueFormatter: (params: any) =>
                Number(params?.value || 0).toFixed(2),
        },
    ];




    const debitColumns = [
        {
            field: "project",
            headerName: "Debit - Details",
            flex: 1,
            renderCell: (params: any) => {
                const r: ReceiptItem = params.row;
                return (
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.3 }}>
                        <strong>{r.project}
                            {r.invoice_no ? ` (${r.invoice_no})` : ""}</strong>
                    </div>
                );
            },
        },
        {
            field: "amount",
            headerName: "Amount",
            flex: 0.3,
            type: "number",
            align: "right",
            headerAlign: "right",
            valueFormatter: (params: any) =>
                Number(params?.value || 0).toFixed(2),
        },
    ];

    

    /* PDF GENERATE */
    const generatePortraitPDF = async (preview = false) => {
        try {
            const doc = new jsPDF("p", "pt", "a4");
            const pw = doc.internal.pageSize.getWidth();

            const img = new Image();
            img.src = "/Elite_Avenue_LH2_page-0001.jpg";

            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });

            try {
                const aspectRatio = img.height / img.width;
                const scaledHeight = pw * aspectRatio;

                doc.addImage(img, "JPEG", 0, 0, pw, scaledHeight);

            } catch { }

            doc.setFontSize(12);
            doc.text("Project Statement", 20, 150);

            /* CREDIT + DEBIT TABLES */
            const topY = 160;
            const leftX = 20;
            const usable = pw - 80;
            const half = usable / 2;

            const leftBody = filteredDebits.map(r => [
                `${r.project} (${r.invoice_no || ""})`,
                Number(r.amount).toFixed(2)
            ]);

            autoTable(doc, {
                startY: topY,
                margin: { left: leftX },
                tableWidth: half - 10,
                head: [["Project", "Amount"]],
                body: leftBody,
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 5 }
            });

            const rightBody = filteredCredits.map(r => [
                `${capitalize(r.from_name || "")} - ${r.description || ""} - ${r.mode || ""}`,
                Number(r.amount).toFixed(2)
            ]);

            autoTable(doc, {
                startY: topY,
                margin: { left: leftX + half + 10 },
                tableWidth: half - 10,
                head: [["Party", "Amount"]],
                body: rightBody,
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 4 }
            });


            if (preview) {
                const blob = doc.output("blob");
                const url = URL.createObjectURL(blob);
                setPdfBlobUrl(url);
                setPdfPreviewOpen(true);
            } else {
                doc.save("Project_Statement (Portrait).pdf");
            }
        } catch (err) {
            console.error(err);
            alert("Portrait PDF failed.");
        }
    };


    const generateLandscapePDF = async (preview = false) => {
        try {
            const doc = new jsPDF("landscape", "pt", "a4");
            const pw = doc.internal.pageSize.getWidth();

            const img = new Image();
            img.src = "/Elite Avenue  LH LS.jpg"; // Landscape letterhead

            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });

            try {
                const aspectRatio = img.height / img.width;
                const scaledHeight = pw * aspectRatio;

                doc.addImage(img, "JPEG", 0, 0, pw, scaledHeight);

            } catch { }

            doc.setFontSize(12);
            doc.text("Project Statement", 20, 150);

            const leftX = 20;
            const topY = 160;
            const usable = pw - 80;
            const half = usable / 2;

            const leftBody = filteredDebits.map(r => [
                `${r.project} (${r.invoice_no || ""})`,
                Number(r.amount).toFixed(2)
            ]);

            autoTable(doc, {
                startY: topY,
                margin: { left: leftX },
                tableWidth: half - 10,
                head: [["Project", "Amount"]],
                body: leftBody,
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 4 }
            });

            const rightBody = filteredCredits.map(r => [
                `${capitalize(r.from_name || "")} - ${r.description || ""} - ${r.mode || ""}`,
                Number(r.amount).toFixed(2)
            ]);

            autoTable(doc, {
                startY: topY,
                margin: { left: leftX + half + 10 },
                tableWidth: half - 10,
                head: [["Party", "Amount"]],
                body: rightBody,
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 5 }
            });

            if (preview) {
                const blob = doc.output("blob");
                const url = URL.createObjectURL(blob);
                setPdfBlobUrl(url);
                setPdfPreviewOpen(true);
            } else {
                doc.save("Project_Statement (Landscape).pdf");
            }
        } catch (err) {
            console.error(err);
            alert("Landscape PDF failed.");
        }
    };


    const onMonthModeChange = (e: any) => {
        setMonthMode(e.target.value);
        setSingleMonth("");
        setFromMonth("");
        setToMonth("");
    };

    return (
        <div className="projectstatement-page">

            {/* TITLE */}
            <div className="ps-header">
                <h1 className="ps-title">Project Statement</h1>
            </div>

            {/* FILTER CONTROLS */}
            <div className="filter-controls">
                <Paper className="ps-filter-bar" elevation={2}>

                    {/* YEAR */}
                    <TextField
                        select
                        size="small"
                        label="Year"
                        value={year}
                        onChange={(e) => setYear(e.target.value === "All" ? "All" : Number(e.target.value))}
                        sx={{ width: 120 }}
                    >
                        <MenuItem value="All">All</MenuItem>
                        {years.map((y) => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </TextField>

                    {/* MONTH MODE */}
                    <FormControl>
                        <RadioGroup row value={monthMode} onChange={onMonthModeChange}>
                            <FormControlLabel value="single" control={<Radio size="small" />} label="Single Month" />
                            <FormControlLabel value="multiple" control={<Radio size="small" />} label="Multiple" />
                        </RadioGroup>
                    </FormControl>

                    {/* SINGLE MONTH */}
                    {monthMode === "single" && (
                        <TextField
                            select
                            size="small"
                            label="Month"
                            value={singleMonth}
                            onChange={(e) => setSingleMonth(Number(e.target.value))}
                            sx={{ width: 140 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            {MONTHS.map((m) => (
                                <MenuItem key={m.value} value={m.value}>
                                    {m.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    {/* MULTIPLE MONTHS */}
                    {monthMode === "multiple" && (
                        <>
                            <TextField
                                select
                                size="small"
                                label="From"
                                value={fromMonth}
                                onChange={(e) => setFromMonth(Number(e.target.value))}
                                sx={{ width: 100 }}
                            >
                                <MenuItem value="">From</MenuItem>
                                {MONTHS.map((m) => (
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
                                onChange={(e) => setToMonth(Number(e.target.value))}
                                sx={{ width: 100 }}
                            >
                                <MenuItem value="">To</MenuItem>
                                {MONTHS.map((m) => (
                                    <MenuItem key={m.value} value={m.value}>
                                        {m.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </>
                    )}

                    {/* PROJECT SELECTOR */}
                    <TextField
                        select
                        size="small"
                        label="Project"
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        sx={{ width: 240 }}
                    >
                        <MenuItem value="">Select Project</MenuItem>
                        {projectsList.map((p) => (
                            <MenuItem key={p.id} value={p.name}>
                                {p.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* DATE RANGE */}
                    {/* <Box
                    className="ps-date-picker"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                    <CalendarMonthIcon fontSize="small" />
                    <span>
                        {`${format(range.startDate, "dd MMM yyyy")} — ${format(range.endDate, "dd MMM yyyy")}`}
                    </span>
                </Box>

                <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={() => setAnchorEl(null)}
                >
                    <DateRangeFilter
                        value={[dayjs(range.startDate), dayjs(range.endDate)]}
                        onChange={(val: any) => {
                            setRange({ startDate: val[0].toDate(), endDate: val[1].toDate() });
                            setAnchorEl(null);
                        }}
                    />
                </Popover> */}

                    {/* SEARCH */}
                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: 150 }}
                    />

                    {/* BUTTONS */}
                    <Button variant="contained" color="primary" onClick={() => setPdfDialog(true)}>
                        PDF
                    </Button>


                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                            setYear("All");
                            setMonthMode("single");
                            setSingleMonth("");
                            setFromMonth("");
                            setToMonth("");
                            setProjectFilter("");
                            setSearch("");
                            setRange({
                                startDate: new Date(2000, 0, 1),
                                endDate: new Date(2100, 0, 1),
                            });
                        }}
                    >
                        Reset
                    </Button>
                </Paper>
            </div>
            <Dialog open={pdfDialog} onClose={() => setPdfDialog(false)}>
                <DialogTitle>Select PDF Orientation</DialogTitle>

                <DialogContent dividers sx={{ width: 350 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{ mb: 2 }}
                        onClick={() => {
                            setPdfDialog(false);
                            generatePortraitPDF(true);
                        }}
                    >
                        Portrait PDF
                    </Button>

                    <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={() => {
                            setPdfDialog(false);
                            generateLandscapePDF(true);
                        }}
                    >
                        Landscape PDF
                    </Button>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setPdfDialog(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={pdfPreviewOpen}
                onClose={() => setPdfPreviewOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>PDF Preview</DialogTitle>

                <DialogContent dividers sx={{ height: "80vh" }}>
                    {pdfBlobUrl && (
                        <iframe
                            src={pdfBlobUrl}
                            style={{ width: "100%", height: "100%", border: "none" }}
                        />
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setPdfPreviewOpen(false)}>Close</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                            const a = document.createElement("a");
                            a.href = pdfBlobUrl!;
                            a.download = "Project Statement.pdf";
                            a.click();
                        }}
                    >
                        Download PDF
                    </Button>
                </DialogActions>
            </Dialog>



            {/* LEDGER TABLE */}
            {
                DATA_SHOWN ? (
                    <Box sx={{ width: "100%" }}>
                        <LedgerTable
                            credits={filteredCredits}
                            debits={filteredDebits}
                            creditColumns={creditColumns}
                            debitColumns={debitColumns}
                            creditTotal={totalCredit}
                            debitTotal={totalDebit}
                            height={520}
                            sortModel={sortModel}
                            onSortModelChange={(m) => setSortModel([...m])}
                        />

                        {/* <div className="ps-totals">
                            <div><strong>Total Credit:</strong> {totalCredit.toFixed(2)}</div>
                            <div><strong>Total Debit:</strong> {totalDebit.toFixed(2)}</div>
                            <div><strong>Balance:</strong> {balance.toFixed(2)}</div>
                        </div> */}
                    </Box>
                ) : (
                    <div style={{ padding: 40, color: "#666" }}>
                        <strong>No project selected.</strong> Select a project to load the ledger.
                    </div>
                )
            }
        </div >
        
    );
};

export default ProjectStatement;
