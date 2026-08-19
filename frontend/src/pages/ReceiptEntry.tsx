import React, { useEffect, useMemo, useState } from "react";
import type { GridSortModel } from "@mui/x-data-grid";
import { Autocomplete } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AppTable from "../components/AppTable";
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Popover,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeFilter from "../components/DateRangeFilter";
import dayjs from "dayjs";
import { format } from "date-fns";

import ActionMenu from "../components/ActionMenu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

import "../styles/income.css";

interface ReceiptItem {
    id: string;
    project: string;
    invoice_no: string;
    amount: number;
    mode: string;
    date: string;
    description?: string;
}

const ReceiptEntry: React.FC = () => {
    const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [invoicesList, setInvoicesList] = useState<any[]>([]);
    const [pdfDialog, setPdfDialog] = useState(false);
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

    const navigate = useNavigate();
    const company = localStorage.getItem("companyName") || "";

    /* Form fields */
    const [isOpen, setIsOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [project, setProject] = useState("");
    const [invoiceNo, setInvoiceNo] = useState("");
    const [amount, setAmount] = useState("");
    const [mode, setMode] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");


    /* Filters */
    const [showFilters, setShowFilters] = useState(false);
    const [filterProject, setFilterProject] = useState("");
    const [filterMode, setFilterMode] = useState("");
    const [filterAmountMin, setFilterAmountMin] = useState("");
    const [filterAmountMax, setFilterAmountMax] = useState("");


    /* Search */
    const [search, setSearch] = useState("");
    const [invoiceAmountTotal, setInvoiceAmountTotal] = useState(0);
    const [invoiceRemaining, setInvoiceRemaining] = useState(0);

    /* Sorting */
    const [sortModel, setSortModel] = useState<GridSortModel>([]);

    /* Date filtering */
    const [range, setRange] = useState<any>({
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2100, 0, 1),
    });
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    /* Load backend data */
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/receipt/${company}`)
            .then(res => res.json())
            .then(data => setReceipts(Array.isArray(data) ? data : []));

        fetch(`http://127.0.0.1:5000/api/projects/${company}`)
            .then(res => res.json())
            .then(data => setProjectsList(Array.isArray(data) ? data : []));

        fetch(`http://127.0.0.1:5000/api/invoices/${company}`)
            .then(res => res.json())
            .then(data => setInvoicesList(Array.isArray(data) ? data : []));
    }, [company]);
   

    /* Add receipt */
    const addReceipt = () => {
        if (!project || !invoiceNo || !amount || !mode || !date)
            return alert("Fill all required fields");

        const payload = {
            id: Date.now().toString(),
            company,
            project,
            invoice_no: invoiceNo,
            amount: Number(amount),
            mode,
            date,
            description,
        };

        fetch("http://127.0.0.1:5000/api/receipt/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(() => {
                setReceipts(prev => [...prev, payload]);
                resetForm();
            });
    };

    /* Update receipt */
    const updateReceipt = () => {
        if (!editingId) return;

        const payload = {
            project,
            invoice_no: invoiceNo,
            amount: Number(amount),
            mode,
            date,
            description,
        };

        fetch(`http://127.0.0.1:5000/api/receipt/update/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }).then(() => {
            setReceipts(prev =>
                prev.map(r => (r.id === editingId ? { id: editingId, ...payload } : r))
            );
            resetForm();
        });
    };

    /* Delete */
    const deleteReceipt = (id: string) => {
        if (!window.confirm("Delete this record?")) return;

        fetch(`http://127.0.0.1:5000/api/receipt/delete/${id}`, {
            method: "DELETE",
        }).then(() => {
            setReceipts(prev => prev.filter(r => r.id !== id));
        });
    };

    const resetForm = () => {
        setIsOpen(false);
        setEditMode(false);
        setEditingId(null);
        setProject("");
        setInvoiceNo("");
        setAmount("");
        setMode("");
        setDate("");
        setDescription("");
    };

    const getAlreadyPaid = (invoiceNo: string) => {
        return receipts
            .filter(r => r.invoice_no === invoiceNo)
            .reduce((sum, r) => sum + Number(r.amount), 0);
    };


    /* Filtering */
    const filteredRows = useMemo(() => {
        return receipts
            // FILTER BY PROJECT
            .filter(row => {
                if (!filterProject) return true;
                return row.project === filterProject;
            })

            // FILTER BY MODE
            .filter(row => {
                if (!filterMode) return true;
                return row.mode === filterMode;
            })

            // FILTER BY AMOUNT RANGE
            .filter(row => {
                const amt = Number(row.amount);
                if (filterAmountMin && amt < Number(filterAmountMin)) return false;
                if (filterAmountMax && amt > Number(filterAmountMax)) return false;
                return true;
            })

            // SEARCH TEXT
            .filter(row => {
                if (!search) return true;
                const hay =
                    `${row.project} ${row.invoice_no} ${row.amount} ${row.mode} ${row.date}`
                        .toLowerCase();
                return hay.includes(search.toLowerCase());
            })

            // DATE RANGE
            .filter(row => {
                const d = new Date(row.date).getTime();
                return (
                    d >= new Date(range.startDate).getTime() &&
                    d <= new Date(range.endDate).getTime()
                );
            });
    }, [
        receipts,
        search,
        range,
        filterProject,
        filterMode,
        filterAmountMin,
        filterAmountMax
    ]);


    /* Sorting */
    const applySorting = (rows: any[]) => {
        if (sortModel.length === 0) return rows;

        const { field, sort } = sortModel[0];
        return [...rows].sort((a, b) => {
            const v1 = a[field];
            const v2 = b[field];
            if (v1 < v2) return sort === "asc" ? -1 : 1;
            if (v1 > v2) return sort === "asc" ? 1 : -1;
            return 0;
        });
    };

    /* PDF */
    /* ------------------ PDF (Header + Template + Sorting) ------------------ */
    const generatePortraitPDF = async (preview = false) => {
        try {
            const doc = new jsPDF("p", "pt", "a4");
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();

            const sortedRows = applySorting(filteredRows);

            const img = new Image();
            img.src = "/Elite_Avenue_LH2_page-0001.jpg"; // portrait template

            await new Promise<void>((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });

            try {
                doc.addImage(img, "JPEG", 0, 0, pw, ph);
            } catch { }

            doc.setFontSize(14);
            doc.text("Receipt Entry", 20, 140);

            const columns = ["Date", "Project", "Invoice No", "Description", "Amount", "Mode"];
            const rows = sortedRows.map(r => [
                r.date,
                r.project,
                r.invoice_no,
                r.description || "-",
                r.amount.toString(),
                r.mode,
                
            ]);

            autoTable(doc, {
                head: [columns],
                body: rows,
                startY: 160,
                margin: { left: 20, right: 20 },
                theme: "grid",
            });

            if (preview) {
                const blob = doc.output("blob");
                const url = URL.createObjectURL(blob);
                setPdfBlobUrl(url);
                setPdfPreviewOpen(true);
            } else {
                doc.save("Receipt Entry (Portrait).pdf");
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
            const ph = doc.internal.pageSize.getHeight();

            const sortedRows = applySorting(filteredRows);

            const img = new Image();
            img.src = "/Elite Avenue  LH LS.jpg"; // landscape template

            await new Promise<void>((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });

            try {
                doc.addImage(img, "JPEG", 0, 0, pw, ph);
            } catch { }

            doc.setFontSize(14);
            doc.text("Receipt Entry", 20, 120);

            const columns = ["Date", "Project", "Invoice No", "Description", "Amount", "Mode"];
            const rows = sortedRows.map(r => [
                r.date,
                r.project,
                r.invoice_no,
                r.description || "-",
                r.amount.toString(),
                r.mode,

            ]);

            autoTable(doc, {
                head: [columns],
                body: rows,
                startY: 140,
                margin: { left: 20, right: 20 },
                theme: "grid",
            });

            if (preview) {
                const blob = doc.output("blob");
                const url = URL.createObjectURL(blob);
                setPdfBlobUrl(url);
                setPdfPreviewOpen(true);
            } else {
                doc.save("Receipt Entry (Landscape).pdf");
            }
        } catch (err) {
            console.error(err);
            alert("Landscape PDF failed.");
        }
    };



    /* Columns */
    const columns = [
        { field: "date", headerName: "Date", flex: 1 },
        { field: "project", headerName: "Project", flex: 1 },
        { field: "invoice_no", headerName: "Invoice No", flex: 1 },
        { field: "amount", headerName: "Amount", flex: 1 },
        { field: "mode", headerName: "Mode", flex: 1 },
        { field: "description", headerName: "Description", flex: 1 },
        {
            field: "actions",
            headerName: "",
            width: 2,
            render: (rowData: any) => (
                <ActionMenu
                    row={rowData}

                    /* ✅ VIEW — navigate to detail page */
                    onView={() => navigate(`/receipt/details/${rowData.id}`)}

                    /* ✅ EDIT — fill modal properly */
                    onEdit={() => {
                        setEditMode(true);
                        setEditingId(rowData.id);

                        setDate(rowData.date);
                        setProject(rowData.project);
                        setInvoiceNo(rowData.invoice_no);
                        setAmount(String(rowData.amount));
                        setMode(rowData.mode);
                        setDescription(rowData.description || "");

                        setIsOpen(true);
                    }}

                    /* ❌ DELETE */
                    onDelete={() => deleteReceipt(rowData.id)}
                />
            )
        }

    ];

    return (
        <div className="income-page">
            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Receipt Entry</h1>

                <div className="header-controls">
                    <Button variant="outlined" onClick={() => setShowFilters(!showFilters)}>
                        Filters
                    </Button>

                    <div className="date-picker" onClick={e => setAnchorEl(e.currentTarget)}>
                        <CalendarMonthIcon style={{ fontSize: 18 }} />
                        {`${format(range.startDate, "dd MMM yyyy")} — ${format(range.endDate, "dd MMM yyyy")}`}
                    </div>

                    <Popover
                        open={Boolean(anchorEl)}
                        anchorEl={anchorEl}
                        onClose={() => setAnchorEl(null)}
                    >
                        <DateRangeFilter
                            value={[dayjs(range.startDate), dayjs(range.endDate)]}
                            onChange={(val) => {
                                setRange({
                                    startDate: val[0].toDate(),
                                    endDate: val[1].toDate(),
                                });
                                setAnchorEl(null);
                            }}
                        />
                    </Popover>

                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: 140 }}
                    />

                    <Button variant="outlined" onClick={() => setPdfDialog(true)}>
                        PDF
                    </Button>


                    <Button variant="contained" color="error" onClick={() => setIsOpen(true)}>
                        Add
                    </Button>
                </div>

            </div>
            {showFilters && (
                <div className="filter-panel">

                    {/* FILTER BY PROJECT */}
                    <TextField
                        select
                        size="small"
                        label="Filter by Project"
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        sx={{ width: 260 }}
                    >
                        <MenuItem value="">All</MenuItem>
                        {projectsList.map((p: any) => (
                            <MenuItem key={p.id} value={p.name}>
                                {p.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* FILTER BY MODE */}
                    <TextField
                        select
                        size="small"
                        label="Filter by Mode"
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                        sx={{ width: 180 }}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Bank">Bank</MenuItem>
                        <MenuItem value="Capital">Capital</MenuItem>
                    </TextField>

                    {/* AMOUNT RANGE */}
                    <TextField
                        size="small"
                        label="Min Amount"
                        type="number"
                        value={filterAmountMin}
                        onChange={(e) => setFilterAmountMin(e.target.value)}
                        sx={{ width: 120 }}
                    />

                    <TextField
                        size="small"
                        label="Max Amount"
                        type="number"
                        value={filterAmountMax}
                        onChange={(e) => setFilterAmountMax(e.target.value)}
                        sx={{ width: 120 }}
                    />

                </div>
            )}

            {/* TABLE */}
            <AppTable
                rows={filteredRows}
                columns={columns}
                pageSize={25}
                height={520}
                sortModel={sortModel}
                onSortModelChange={(m) => setSortModel([...m])}
            />

            {/* ADD / EDIT MODAL */}
            <Dialog
                open={isOpen}
                onClose={() => setIsOpen(false)}
                maxWidth={false}
                PaperProps={{
                    sx: {
                        width: "900px",
                        paddingBottom: "20px",
                        overflow: "visible",
                        display: "flex",
                        alignItems: "center",
                    },
                }}
            >
                <DialogTitle>{editMode ? "Edit Receipt" : "Add Receipt"}</DialogTitle>

                <DialogContent className="payment-dialog-grid wide-dialog">

                    {/* DATE */}
                    <TextField
                        label="Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="pay-field"
                        sx={{ width: 360 }}
                    />

                    {/* 🔍 SEARCHABLE PROJECT */}
                    <Autocomplete
                        options={projectsList.map((p: any) => p.name)}
                        value={project}
                        onChange={(_, val) => {
                            setProject(val || "");
                            setInvoiceNo(""); // reset invoice when project changes
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Project" className="pay-field" />
                        )}
                        sx={{ width: 360 }}
                    />

                    {/* 🔍 SEARCHABLE INVOICE – FILTERED BY PROJECT */}
                    <Autocomplete
                        options={invoicesList
                            .filter((inv: any) => inv.project === project)
                            .map((inv: any) => inv.invoice_no)
                        }
                        value={invoiceNo}
                        onChange={(_, val) => {
                            setInvoiceNo(val || "");

                            const invoice = invoicesList.find((i: any) => i.invoice_no === val);

                            if (invoice) {
                                const total = invoice.amount;

                                // NEW: calculate already paid amount
                                const paid = getAlreadyPaid(invoice.invoice_no);

                                const remaining = total - paid;

                                setInvoiceAmountTotal(total);
                                setInvoiceRemaining(remaining);

                                setAmount(""); // reset user amount input
                            } else {
                                setInvoiceAmountTotal(0);
                                setInvoiceRemaining(0);
                            }
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Invoice No." className="pay-field" />
                        )}
                        sx={{ width: 360 }}
                    />



                    {/* AMOUNT */}
                    <TextField
                        label={
                            invoiceAmountTotal
                                ? `Amount (Balance: ${invoiceRemaining})`
                                : "Amount"
                        }
                        type="number"
                        fullWidth
                        value={amount}
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            setAmount(e.target.value);

                            // Already paid receipts for this invoice
                            const paid = getAlreadyPaid(invoiceNo);

                            const remaining = invoiceAmountTotal - paid - v;

                            setInvoiceRemaining(remaining >= 0 ? remaining : 0);
                        }}
                        className="pay-field"
                        sx={{ width: 360 }}
                    />



                    {/* MODE */}
                    <TextField
                        label="Mode"
                        select
                        fullWidth
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="pay-field"
                        sx={{ width: 360 }}
                    >
                        <MenuItem value="">Select Mode</MenuItem>
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Bank">Bank</MenuItem>
                        <MenuItem value="Capital">Capital</MenuItem>
                    </TextField>

                    {/* DESCRIPTION */}
                    <TextField
                        label="Description (Optional)"
                        fullWidth
                        multiline
                        minRows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="pay-field-full"
                    />
                </DialogContent>


                <DialogActions sx={{ pr: 2 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        color="success"
                        onClick={editMode ? updateReceipt : addReceipt}
                    >
                        {editMode ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
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
                            a.download = "Receipt Entry.pdf";
                            a.click();
                        }}
                    >
                        Download PDF
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default ReceiptEntry;
