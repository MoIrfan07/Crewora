import React, { useEffect, useMemo, useState } from "react";
import type { GridSortModel } from "@mui/x-data-grid";
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
import Autocomplete from "@mui/material/Autocomplete";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeFilter from "../components/DateRangeFilter";
import dayjs from "dayjs";
import { format } from "date-fns";

import ActionMenu from "../components/ActionMenu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

import "../styles/income.css";

interface InvoiceItem {
    id: string;             // internal id
    invoice_no: string;     // NEW FIELD
    project: string;
    amount: number;
    date: string;
    description?: string;
}

const Invoices: React.FC = () => {
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [sortModel, setSortModel] = useState<GridSortModel>([]);

    /* Filters */
    const [showFilters, setShowFilters] = useState(false);
    const [filterProject, setFilterProject] = useState("");
    const [filterAmountMin, setFilterAmountMin] = useState("");
    const [filterAmountMax, setFilterAmountMax] = useState("");

    /* Date Range */
    const [range, setRange] = useState<any>({
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2100, 0, 1),
    });
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    /* Add/Edit Modal */
    const [isOpen, setIsOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [pdfDialog, setPdfDialog] = useState(false);
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

    const [invoiceNo, setInvoiceNo] = useState("");
    const [project, setProject] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");

    /* Load data */
    const company = localStorage.getItem("companyName") || "";
    const [projectsList, setProjectsList] = useState<any[]>([]);

    const generateInvoiceNumber = () => {
        const year = new Date().getFullYear(); // 2025

        // Filter invoices of the same year
        const yearInvoices = invoices.filter(
            inv => inv.invoice_no && inv.invoice_no.startsWith(`INV-${year}-`)
        );

        // Extract numeric part
        const numbers = yearInvoices.map(inv => {
            const parts = inv.invoice_no.split("-");
            return parseInt(parts[2], 10) || 0;
        });

        const nextNumber = (Math.max(...numbers, 0) + 1)
            .toString()
            .padStart(5, "0");

        return `INV-${year}-${nextNumber}`;
    };


    useEffect(() => {
        if (!company) return;

        // Load invoices
        fetch(`http://127.0.0.1:5000/api/invoices/${company}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setInvoices(data);
                else setInvoices([]);
            })
            .catch(() => setInvoices([]));

        // Load projects
        fetch(`http://127.0.0.1:5000/api/projects/${company}`)
            .then(res => res.json())
            .then(data => setProjectsList(Array.isArray(data) ? data : []));
    }, [company]);




    /* ------------------ ADD INVOICE ------------------ */
    const addInvoice = () => {
        if (!project || !amount || !date)
            return alert("Fill all required fields");

        const autoInvoiceNo = generateInvoiceNumber();  // 👈 AUTO GENERATED HERE

        const payload = {
            id: Date.now().toString(),
            company,
            invoice_no: autoInvoiceNo,
            project,
            amount: Number(amount),
            date,
            description,
        };

        fetch("http://127.0.0.1:5000/api/invoices/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(() => {
                setInvoices(prev => [...prev, payload]);

                // Set in UI also
                setInvoiceNo(autoInvoiceNo);

                resetForm();
            });
    };

    /* ------------------ UPDATE INVOICE ------------------ */
    const updateInvoice = () => {
        if (!editingId) return;

        const payload = {
            invoice_no: invoiceNo,
            project,
            amount: Number(amount),
            date,
            description,
        };

        fetch(`http://127.0.0.1:5000/api/invoices/update/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(() => {
                setInvoices(prev =>
                    prev.map(inv =>
                        inv.id === editingId
                            ? { id: editingId, ...payload }
                            : inv
                    )
                );
                resetForm();
            });
    };

    /* ------------------ DELETE ------------------ */
    const deleteInvoice = (id: string) => {
        if (!window.confirm("Delete this Invoice?")) return;

        fetch(`http://127.0.0.1:5000/api/invoices/delete/${id}`, {
            method: "DELETE",
        }).then(() => {
            setInvoices(prev => prev.filter(i => i.id !== id));
        });
    };

    const resetForm = () => {
        setIsOpen(false);
        setEditMode(false);
        setEditingId(null);
        setInvoiceNo("");
        setProject("");
        setAmount("");
        setDate("");
        setDescription("");
    };


    /* ------------------ FILTERING ------------------ */
    const filteredRows = useMemo(() => {
        return invoices
            .filter(row => {
                if (!filterProject) return true;
                return row.project === filterProject;
            })
            .filter(row => {
                const amt = Number(row.amount);
                if (filterAmountMin && amt < Number(filterAmountMin)) return false;
                if (filterAmountMax && amt > Number(filterAmountMax)) return false;
                return true;
            })
            .filter(row => {
                if (!search) return true;
                return `${row.invoice_no} ${row.project} ${row.amount} ${row.date}`.toLowerCase()
                    .includes(search.toLowerCase());
            })
            .filter(row => {
                const d = new Date(row.date).getTime();
                return (
                    d >= new Date(range.startDate).getTime() &&
                    d <= new Date(range.endDate).getTime()
                );
            });
    }, [
        invoices,
        filterProject,
        filterAmountMin,
        filterAmountMax,
        search,
        range,
    ]);


    /* ------------------ SORTING ------------------ */
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


    /* ------------------ PDF ------------------ */
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
            doc.text("Invoices", 20, 140);

            const tableColumns = ["Invoice No", "Project", "Date", "Description", "Amount"];

            const tableRows = sortedRows.map(r => [
                r.invoice_no,
                r.project,
                r.date,
                r.description || "-",
                r.amount.toString(),

            ]);

            autoTable(doc, {
                head: [tableColumns],
                body: tableRows,
                startY: 160,
                theme: "grid",
                margin: { left: 20, right: 20 }
            });

            if (preview) {
                const blob = doc.output("blob");
                const url = URL.createObjectURL(blob);
                setPdfBlobUrl(url);
                setPdfPreviewOpen(true);
            } else {
                doc.save("Invoices (Portrait).pdf");
            }
        } catch {
            alert("Portrait PDF failed!");
        }
    };


    const generateLandscapePDF = async (preview = false) => {
        try {
            const doc = new jsPDF("landscape", "pt", "a4");
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();

            const sortedRows = applySorting(filteredRows);

            const img = new Image();
            img.src = "/Elite Avenue  LH LS.jpg"; // landscape template name must match exactly

            await new Promise<void>((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });

            try {
                doc.addImage(img, "JPEG", 0, 0, pw, ph);
            } catch { }

            doc.setFontSize(14);
            doc.text("Invoices", 20, 120);

            const tableColumns = ["Invoice No", "Project", "Date", "Description", "Amount"];

            const tableRows = sortedRows.map(r => [
                r.invoice_no,
                r.project,
                r.date,
                r.description || "-",
                r.amount.toString(),
                
            ]);

            autoTable(doc, {
                head: [tableColumns],
                body: tableRows,
                startY: 140,
                theme: "grid",
                margin: { left: 20, right: 20 }
            });

            if (preview) {
                const blob = doc.output("blob");
                const url = URL.createObjectURL(blob);
                setPdfBlobUrl(url);
                setPdfPreviewOpen(true);
            } else {
                doc.save("Invoices (Landscape).pdf");
            }
        } catch {
            alert("Landscape PDF failed!");
        }
    };



    /* ------------------ COLUMNS ------------------ */
    const columns = [
        { field: "invoice_no", headerName: "Invoice No.", flex: 1 },
        { field: "project", headerName: "Project", flex: 1 },
        { field: "date", headerName: "Date", flex: 1 },
        { field: "amount", headerName: "Amount", flex: 1 },

        {
            field: "actions",
            headerName: "",
            width: 2,
            render: (rowData: any) => (
                <ActionMenu
                    row={rowData}
                    // open invoice details page:
                    onView={() => navigate(`/invoices/details/${rowData.id}`)}

                    // edit — fills the modal and opens it
                    onEdit={() => {
                        setEditMode(true);
                        setEditingId(rowData.id);
                        setInvoiceNo(rowData.invoice_no || "");
                        setProject(rowData.project || "");
                        setAmount(String(rowData.amount || ""));
                        setDate(rowData.date || "");
                        setDescription(rowData.description || "");
                        setIsOpen(true);
                    }}

                    // delete
                    onDelete={() => deleteInvoice(rowData.id)}
                />
            ),
        }


    ];

    return (
        <div className="income-page">

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Invoices</h1>

                <div className="header-controls">
                    <Button variant="outlined" onClick={() => setShowFilters(!showFilters)}>
                        Filters
                    </Button>

                    {/* DATE RANGE */}
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

            {/* FILTER PANEL */}
            {showFilters && (
                <div className="filter-panel">

                    {/* FILTER BY PROJECT */}
                    <TextField
                        select
                        size="small"
                        label="Filter by Project"
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        sx={{ width: 500 }}
                    >
                        <MenuItem value="">All</MenuItem>
                        {projectsList.map((p: any) => (
                            <MenuItem key={p.id} value={p.name}>
                                {p.name}
                            </MenuItem>
                        ))}

                    </TextField>

                    {/* AMOUNT RANGE */}
                    <TextField
                        size="small"
                        label="Min Amount"
                        type="number"
                        value={filterAmountMin}
                        onChange={(e) => setFilterAmountMin(e.target.value)}
                        sx={{ width: 250 }}
                    />

                    <TextField
                        size="small"
                        label="Max Amount"
                        type="number"
                        value={filterAmountMax}
                        onChange={(e) => setFilterAmountMax(e.target.value)}
                        sx={{ width: 250, 
                            
                        }}
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
                onSortModelChange={m => setSortModel([...m])}
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
                        flexDirection: "column",
                        alignItems: "center",
                    },
                }}
            >
                <DialogTitle>{editMode ? "Edit Invoice" : "Add Invoice"}</DialogTitle>

                {/* SAME GRID LAYOUT AS PAYMENT ENTRY */}
                <DialogContent className="payment-dialog-grid wide-dialog">

                    {/* Invoice No */}
                    <TextField
                        label="Invoice No."
                        fullWidth
                        value={editMode ? invoiceNo : generateInvoiceNumber()}
                        disabled
                        className="pay-field"
                        sx={{ width: 360 }}
                    />

                    {/* Project */}
                    {/* Project (Searchable) */}
                    <Autocomplete
                        options={projectsList.map((p: any) => p.name)}
                        value={project}
                        onChange={(e, newValue) => setProject(newValue || "")}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Project"
                                className="pay-field"
                                sx={{ width: 360 }}
                            />
                        )}
                        fullWidth
                    />


                    {/* Amount */}
                    <TextField
                        label="Amount"
                        type="number"
                        fullWidth
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pay-field"
                        sx={{ width: 360 }}
                    />

                    {/* Date */}
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

                    {/* Description - FULL WIDTH */}
                    <TextField
                        label="Description (Optional)"
                        fullWidth
                        multiline
                        minRows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="pay-field-full"
                        sx={{ width: "100%" }}
                    />
                </DialogContent>

                <DialogActions sx={{ pr: 2 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        color="success"
                        onClick={editMode ? updateInvoice : addInvoice}
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
                            a.download = "Invoices.pdf";
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

export default Invoices;
