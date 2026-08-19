import React, { useState, useEffect, useMemo } from "react";
import AppTable from "../components/AppTable";
import ActionMenu from "../components/ActionMenu";
import MenuIcon from "@mui/icons-material/Menu";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import {
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Autocomplete,
    Popover
} from "@mui/material";

import DateRangeFilter from "../components/DateRangeFilter";
import type { GridSortModel } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { format } from "date-fns";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import "../styles/Investors.css";

interface InvestorEntry {
    id: string;
    date: string;
    party: string;
    amount: number;
    mode: string;
    description?: string;
}

const modeOptions = ["Cash", "Bank"];

const Investors: React.FC = () => {
    const [entries, setEntries] = useState<InvestorEntry[]>([]);
    const [search, setSearch] = useState("");

    const [sortModel, setSortModel] = useState<GridSortModel>([]);
    const [pdfDialog, setPdfDialog] = useState(false);
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState("");
    const [party, setParty] = useState("");
    const [amount, setAmount] = useState("");
    const [mode, setMode] = useState("");
    const [description, setDescription] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [partyOptions, setPartyOptions] = useState<string[]>([]);

    const navigate = useNavigate();
    const company = localStorage.getItem("companyName") || "default_company";

    /* ---------------- DATE RANGE ---------------- */
    const [range, setRange] = useState<any>({
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2100, 0, 1),
    });
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    /* ---------------- FILTER PANEL ---------------- */
    const [showFilters, setShowFilters] = useState(false);
    const [filterParty, setFilterParty] = useState("");
    const [filterMode, setFilterMode] = useState("");
    const [filterMin, setFilterMin] = useState("");
    const [filterMax, setFilterMax] = useState("");

    /* LOAD PARTY OPTIONS */
    const loadParties = async () => {
        const currentAssets = await fetch(
            `http://127.0.0.1:5000/api/current-assets/${company}`
        ).then(r => r.json());

        // Filter only Capital A/C
        const capitalInvestors = currentAssets
            .filter((a: any) => a.acc_type === "Capital A/C")
            .map((a: any) => a.acc_name)    // Only the name "Rafeez"
            .filter(Boolean);

        setPartyOptions([...new Set(capitalInvestors)]);
    };


    /* LOAD ENTRIES */
    const loadEntries = async () => {
        const data = await fetch(`http://127.0.0.1:5000/api/investors/${company}`).then(r => r.json());
        setEntries(data);
    };

    useEffect(() => {
        loadEntries();
        loadParties();
    }, []);

    /* SAVE ENTRY */
    const saveEntry = async () => {
        if (!date || !party || !amount || !mode) {
            alert("All fields except description are required!");
            return;
        }

        if (editingId) {
            await fetch(`http://127.0.0.1:5000/api/investors/update/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date, party, amount, mode, description }),
            });
        } else {
            await fetch("http://127.0.0.1:5000/api/investors/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: Date.now().toString(),
                    company,
                    date,
                    party,
                    amount,
                    mode,
                    description,
                }),
            });
        }

        resetForm();
        loadEntries();
    };

    /* DELETE */
    const deleteEntry = async (id: string) => {
        if (!window.confirm("Delete this entry?")) return;

        await fetch(`http://127.0.0.1:5000/api/investors/delete/${id}`, {
            method: "DELETE",
        });

        loadEntries();
    };

    const resetForm = () => {
        setIsOpen(false);
        setEditingId(null);
        setDate("");
        setParty("");
        setAmount("");
        setMode("");
        setDescription("");
    };

    /* ---------------- FILTER + SEARCH + DATE ---------------- */
    const filteredRows = useMemo(() => {
        return entries
            .filter(r => !filterParty || r.party === filterParty)
            .filter(r => !filterMode || r.mode === filterMode)
            .filter(r => (filterMin ? r.amount >= Number(filterMin) : true))
            .filter(r => (filterMax ? r.amount <= Number(filterMax) : true))
            .filter(r =>
                `${r.date} ${r.party} ${r.amount} ${r.mode} ${r.description}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
            )
            .filter(r => {
                const d = new Date(r.date).getTime();
                return (
                    d >= new Date(range.startDate).getTime() &&
                    d <= new Date(range.endDate).getTime()
                );
            });
    }, [entries, search, filterParty, filterMode, filterMin, filterMax, range]);

    /* ---------------- APPLY SORTING (Same as PaymentEntry) ---------------- */
    const applySorting = (rows: any[]) => {
        if (!sortModel || sortModel.length === 0) return rows;

        const { field, sort } = sortModel[0];
        if (!field || !sort) return rows;

        return [...rows].sort((a, b) => {
            let v1 = a[field];
            let v2 = b[field];

            if (!isNaN(Number(v1)) && !isNaN(Number(v2))) {
                v1 = Number(v1);
                v2 = Number(v2);
            }

            if (v1 < v2) return sort === "asc" ? -1 : 1;
            if (v1 > v2) return sort === "asc" ? 1 : -1;
            return 0;
        });
    };

    /* ---------------- PDF ---------------- */
    const generatePortraitPDF = async (preview = false) => {
        try {
            const doc = new jsPDF("p", "pt", "a4");
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();

            const sortedRows = applySorting(filteredRows);

            const img = new Image();
            img.src = "/Elite_Avenue_LH2_page-0001.jpg";

            await new Promise<void>((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });

            try {
                doc.addImage(img, "JPEG", 0, 0, pw, ph);
            } catch { }

            doc.setFontSize(14);
            doc.text("Investor Entries", 20, 140);

            const columns = ["Date", "Party", "Description", "Amount", "Mode"];
            const rows = sortedRows.map(r => [
                r.date,
                r.party,
                r.description || "-",
                r.amount.toString(),
                r.mode,

            ]);

            autoTable(doc, {
                head: [columns],
                body: rows,
                startY: 160,
                margin: { left: 20, right: 20 },
                theme: "grid"
            });

            if (preview) {
                const blob = doc.output("blob");
                const url = URL.createObjectURL(blob);
                setPdfBlobUrl(url);
                setPdfPreviewOpen(true);
            } else {
                doc.save("Investor Entries (Portrait).pdf");
            }
        } catch (err) {
            console.error(err);
            alert("Portrait PDF generation failed.");
        }
    };


    const generateLandscapePDF = async (preview = false) => {
        try {
            const doc = new jsPDF("landscape", "pt", "a4");
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();

            const sortedRows = applySorting(filteredRows);

            const img = new Image();
            img.src = "/Elite Avenue  LH LS.jpg";

            await new Promise<void>((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });

            try {
                doc.addImage(img, "JPEG", 0, 0, pw, ph);
            } catch { }

            doc.setFontSize(14);
            doc.text("Investor Entries", 20, 120);

            const columns = ["Date", "Party", "Description", "Amount", "Mode"];
            const rows = sortedRows.map(r => [
                r.date,
                r.party,
                r.description || "-",
                r.amount.toString(),
                r.mode,
                
            ]);

            autoTable(doc, {
                head: [columns],
                body: rows,
                startY: 140,
                margin: { left: 20, right: 20 },
                theme: "grid"
            });

            if (preview) {
                const blob = doc.output("blob");
                const url = URL.createObjectURL(blob);
                setPdfBlobUrl(url);
                setPdfPreviewOpen(true);
            } else {
                doc.save("Investor Entries (Landscape).pdf");
            }
        } catch (err) {
            console.error(err);
            alert("Landscape PDF generation failed.");
        }
    };


    /* ---------------- COLUMNS ---------------- */
    const columns = [
        { field: "date", headerName: "Date", flex: 1 },
        { field: "party", headerName: "Party", flex: 1 },
        { field: "amount", headerName: "Amount", flex: 1 },
        { field: "mode", headerName: "Mode", flex: 1 },
        {
            field: "actions",
            headerName: "",
            width: 2,
            render: (rowData: any) => (
                <ActionMenu
                    row={rowData}

                    /* ✅ VIEW — navigate to investor details page */
                    onView={() => navigate(`/investors/details/${rowData.id}`)}

                    /* ✅ EDIT — load row data into modal */
                    onEdit={() => {
                        setEditingId(rowData.id);
                        setDate(rowData.date);
                        setParty(rowData.party);
                        setAmount(String(rowData.amount));
                        setMode(rowData.mode);
                        setDescription(rowData.description || "");
                        setIsOpen(true);
                    }}

                    /* ❌ DELETE */
                    onDelete={() => deleteEntry(rowData.id)}
                />
            )
        }
    ];

    return (
        <div className="investors-page">
            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Investor Entries</h1>

                <div className="header-controls">
                    <Button variant="outlined" onClick={() => setShowFilters(!showFilters)}>
                        Filters
                    </Button>

                    {/* DATE RANGE */}
                    <div className="date-picker" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <CalendarMonthIcon style={{ fontSize: 18 }} />
                        {`${format(range.startDate, "dd MMM yyyy")} — ${format(
                            range.endDate,
                            "dd MMM yyyy"
                        )}`}
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


                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            resetForm();
                            setIsOpen(true);
                        }}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {/* FILTER PANEL */}
            {showFilters && (
                <div className="filter-panel">
                    <TextField
                        select
                        size="small"
                        label="Party"
                        value={filterParty}
                        onChange={(e) => setFilterParty(e.target.value)}
                        sx={{ width: 260 }}
                    >
                        <MenuItem value="">All</MenuItem>
                        {partyOptions.map((p) => (
                            <MenuItem key={p} value={p}>
                                {p}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Mode"
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                        sx={{ width: 160 }}
                    >
                        <MenuItem value="">All</MenuItem>
                        {modeOptions.map((m) => (
                            <MenuItem key={m} value={m}>
                                {m}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        size="small"
                        label="Min Amount"
                        type="number"
                        value={filterMin}
                        onChange={(e) => setFilterMin(e.target.value)}
                        sx={{ width: 120 }}
                    />

                    <TextField
                        size="small"
                        label="Max Amount"
                        type="number"
                        value={filterMax}
                        onChange={(e) => setFilterMax(e.target.value)}
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
                onSortModelChange={(model) => setSortModel([...model])}
            />

            {/* ADD/EDIT MODAL */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogTitle>{editingId ? "Edit Entry" : "Add Entry"}</DialogTitle>

                <DialogContent
                    sx={{ display: "flex", flexDirection: "column", gap: 2, width: 420 }}
                >
                    <TextField
                        type="date"
                        label="Date"
                        value={date}
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => setDate(e.target.value)}
                    />

                    <Autocomplete
                        options={partyOptions}
                        value={partyOptions.includes(party) ? party : ""}
                        getOptionLabel={(opt) => (opt ? opt.toString() : "")}
                        onChange={(_, val) => setParty(val || "")}
                        renderInput={(params) => (
                            <TextField {...params} label="Party" />
                        )}
                    />


                    <TextField
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    <TextField
                        label="Mode"
                        select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                    >
                        {modeOptions.map((m) => (
                            <MenuItem key={m} value={m}>
                                {m}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Description (Optional)"
                        multiline
                        minRows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </DialogContent>

                <DialogActions sx={{ pr: 3 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="success" onClick={saveEntry}>
                        {editingId ? "Update" : "Save"}
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
                            a.download = "Investor Entries.pdf";
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

export default Investors;
