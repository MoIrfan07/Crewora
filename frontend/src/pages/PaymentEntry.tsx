// ---------------------------------------------------------
// PAYMENT ENTRY PAGE WITH CAPITAL A/C (PER INVESTOR)
// Capital A/C modes appear ONLY when project = "Head Office"
// Party dropdown: Parties + Current Assets (excluding any starting with "Capital")
// Investor appears only in: Head Office + Capital
// ---------------------------------------------------------
import React, { useEffect, useMemo, useState } from "react";
import type { GridSortModel } from "@mui/x-data-grid";
import AppTable from "../components/AppTable";
import ActionMenu from "../components/ActionMenu";

import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Popover,
    Autocomplete,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeFilter from "../components/DateRangeFilter";
import dayjs from "dayjs";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import "../styles/income.css";


// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------
interface PaymentItem {
    id: string;
    date: string;
    project: string;
    amount: number;
    mode: string;
    description: string;

    party_name: string;
    capital_investor?: string;
}


// ---------------------------------------------------------
// NORMALIZER - FIXED TO HANDLE MULTIPLE FIELD NAMES
// ---------------------------------------------------------
const normalizePayment = (r: any): PaymentItem => {
    return {
        id: r.id?.toString() || Date.now().toString(),
        date: r.date || "",
        project: r.project || "",
        amount: Number(r.amount || 0),
        mode: r.mode || "",
        description: r.description || "",
        // ✅ Try multiple possible field names from backend
        party_name: r.party_name || r.from_name || r.from || "",
        capital_investor: r.capital_investor || "",
    };
};


// ---------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------
const PaymentEntry: React.FC = () => {
    const navigate = useNavigate();

    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [parties, setParties] = useState<string[]>([]);
    const [assets, setAssets] = useState<string[]>([]);
    const [investors, setInvestors] = useState<string[]>([]);
    const investorList = [...new Set(investors)].map(name => ({ label: name }));

    const company = localStorage.getItem("companyName") || "";

    // FORM STATES
    const [isOpen, setIsOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [project, setProject] = useState("");
    const [date, setDate] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [mode, setMode] = useState("");

    const [selectedParty, setSelectedParty] = useState("");
    const [selectedInvestor, setSelectedInvestor] = useState("");

    // ---------------------------------------------------------
    // LOAD DATA
    // ---------------------------------------------------------
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/payment-entry/${company}`)
            .then(res => res.json())
            .then(data => {
                console.log("Raw payment data:", data); // ✅ DEBUG
                setPayments(Array.isArray(data) ? data.map(normalizePayment) : []);
            })
            .catch(err => console.error("Failed to load payments:", err));

        fetch(`http://127.0.0.1:5000/api/projects/${company}`)
            .then(res => res.json())
            .then(setProjectsList)
            .catch(err => console.error("Failed to load projects:", err));

        fetch(`http://127.0.0.1:5000/api/others/${company}`)
            .then(res => res.json())
            .then(data => setParties(data.map((p: any) => p.name)))
            .catch(err => console.error("Failed to load parties:", err));

        fetch(`http://127.0.0.1:5000/api/current-assets/${company}`)
            .then(res => res.json())
            .then(data => {
                const assetNames = data.map((a: any) => a.display).filter((name: string) => !!name);
                setAssets(assetNames);
            })
            .catch(err => console.error("Failed to load assets:", err));

        fetch(`http://127.0.0.1:5000/api/investors/${company}`)
            .then(res => res.json())
            .then(data => setInvestors(data.map((i: any) => i.party)))
            .catch(err => console.error("Failed to load investors:", err));

    }, [company]);


    // ---------------------------------------------------------
    // HIDE HEAD OFFICE FROM PROJECT SELECTION
    // ---------------------------------------------------------
    const filteredProjects = useMemo(() => {
        return projectsList
            .map(p => p.name)
            .filter(name => name !== "Head Office");
    }, [projectsList]);


    // ---------------------------------------------------------
    // PARTY DROPDOWN MERGED LIST
    // ---------------------------------------------------------
    const partyList = useMemo(() => {
        if (!project) return [];

        let list: string[] = [...parties, ...assets.filter(a => !/^capital/i.test(a))];

        return [...new Set(list)].map(label => ({ label }));
    }, [parties, assets, project]);


    // ---------------------------------------------------------
    // RESET FORM
    // ---------------------------------------------------------
    const resetForm = () => {
        setIsOpen(false);
        setEditMode(false);
        setEditingId(null);

        setProject("");
        setDate("");
        setAmount("");
        setMode("");
        setDescription("");
        setSelectedParty("");
        setSelectedInvestor("");
    };


    // ---------------------------------------------------------
    // ADD PAYMENT - FIXED TO USE CONSISTENT FIELD NAME
    // ---------------------------------------------------------
    const addPayment = () => {
        if (!date || !project || !amount || !mode)
            return alert("Please fill all required fields.");

        if (!selectedParty)
            return alert("Please select a Party.");

        const payload = {
            id: Date.now().toString(),
            company,
            date,
            project,
            amount: Number(amount),
            mode,
            description,
            party_name: selectedParty,  // ✅ Use party_name consistently
            from_name: selectedParty,    // ✅ Also send as from_name for backend compatibility
            capital_investor: "",
            from_type: "party"
        };

        fetch("http://127.0.0.1:5000/api/payment-entry/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(data => {
                console.log("Add response:", data); // ✅ DEBUG
                setPayments(prev => [...prev, normalizePayment({ ...payload, ...data })]);
                resetForm();
            })
            .catch(err => console.error("Failed to add payment:", err));
    };


    // ---------------------------------------------------------
    // UPDATE PAYMENT - FIXED TO USE CONSISTENT FIELD NAME
    // ---------------------------------------------------------
    const updatePayment = () => {
        if (!editingId) return;

        if (!selectedParty) return alert("Please select a Party.");

        const payload: any = {
            date,
            project,
            amount: Number(amount),
            mode,
            description,
            party_name: selectedParty,  // ✅ Use party_name consistently
            from_name: selectedParty,    // ✅ Also send as from_name for backend compatibility
            capital_investor: "",
            from_type: "party",
        };

        fetch(`http://127.0.0.1:5000/api/payment-entry/update/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(data => {
                console.log("Update response:", data); // ✅ DEBUG
                setPayments(prev =>
                    prev.map(row =>
                        row.id === editingId
                            ? normalizePayment({ ...payload, id: editingId })
                            : row
                    )
                );
                resetForm();
            })
            .catch(err => console.error("Failed to update payment:", err));
    };


    // ---------------------------------------------------------
    // DELETE PAYMENT
    // ---------------------------------------------------------
    const deletePayment = (id: string) => {
        if (!window.confirm("Delete this entry?")) return;

        fetch(`http://127.0.0.1:5000/api/payment-entry/delete/${id}`, {
            method: "DELETE"
        }).then(() =>
            setPayments(prev => prev.filter(p => p.id !== id))
        );
    };


    // ---------------------------------------------------------
    // FILTERING + SEARCH
    // ---------------------------------------------------------
    const [search, setSearch] = useState("");
    const [sortModel, setSortModel] = useState<GridSortModel>([]);
    const [showFilters, setShowFilters] = useState(false);

    const [filterProject, setFilterProject] = useState("");
    const [filterMode, setFilterMode] = useState("");

    const [range, setRange] = useState<any>({
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2100, 0, 1),
    });

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const filteredRows = useMemo(() => {
        return payments
            .filter(r => (!filterProject ? true : r.project === filterProject))
            .filter(r => (!filterMode ? true : r.mode === filterMode))
            .filter(r =>
                JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
            )
            .map(r => ({
                ...r,
                // ✅ Use party_name directly since it's normalized
                display_party: r.party_name || ""
            }));
    }, [payments, search, filterProject, filterMode]);




    // ---------------------------------------------------------
    // MODE OPTIONS
    // ---------------------------------------------------------
    const modeOptions = ["Cash", "Bank"];


    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------
    return (
        <div className="income-page">

            <div className="page-header compact-header">
                <h1 className="page-title">Payment Entry</h1>

                <div className="header-controls">
                    <Button variant="outlined" onClick={() => setShowFilters(!showFilters)}>
                        Filters
                    </Button>

                    {/* DATE RANGE */}
                    <div
                        className="date-picker"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                    >
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
                            onChange={val => {
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
                        label="Project"
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        sx={{ width: 260 }}
                    >
                        <MenuItem value="">All</MenuItem>
                        {filteredProjects.map(p => (
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
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Bank">Bank</MenuItem>
                    </TextField>
                </div>
            )}

            {/* TABLE */}
            <AppTable
                rows={filteredRows}
                columns={[
                    { field: "date", headerName: "Date", flex: 1 },
                    { field: "project", headerName: "Project", flex: 1 },
                    { field: "display_party", headerName: "Party", flex: 1 },
                    { field: "amount", headerName: "Amount", flex: 1 },
                    { field: "mode", headerName: "Mode", flex: 1 },
                    {
                        field: "actions",
                        headerName: "",
                        width: 2,
                        render: (row: any) => (
                            <ActionMenu
                                onView={() => navigate(`/payment-entry/details/${row.id}`)}
                                onEdit={() => {
                                    setEditMode(true);
                                    setEditingId(row.id);

                                    setDate(row.date);
                                    setProject(row.project);
                                    setAmount(String(row.amount));
                                    setMode(row.mode);
                                    setDescription(row.description);

                                    setSelectedParty(row.party_name || "");
                                    setSelectedInvestor(row.capital_investor || "");

                                    setIsOpen(true);
                                }}
                                onDelete={() => deletePayment(row.id)}
                            />
                        ),
                    },
                ]}
                pageSize={25}
                sortModel={sortModel}
                onSortModelChange={m => setSortModel([...m])}
            />

            {/* FORM DIALOG */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="md">
                <DialogTitle>{editMode ? "Edit Payment Entry" : "Add Payment Entry"}</DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

                    <TextField
                        label="Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />

                    {/* PROJECT DROPDOWN WITHOUT HEAD OFFICE */}
                    <Autocomplete
                        options={filteredProjects}
                        getOptionLabel={(opt) => opt || ""}
                        value={project}
                        onChange={(_, v) => setProject(v || "")}
                        renderInput={(params) => <TextField {...params} label="Project" />}
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
                        <MenuItem value="">Select Mode</MenuItem>
                        {modeOptions.map(m => (
                            <MenuItem key={m} value={m}>{m}</MenuItem>
                        ))}
                    </TextField>

                    {/* PARTY FIELD */}
                    <Autocomplete
                        options={partyList}
                        getOptionLabel={(opt) => opt?.label || ""}
                        value={partyList.find(x => x.label === selectedParty) || null}
                        onChange={(_, v) => setSelectedParty(v?.label || "")}
                        renderInput={(params) => <TextField {...params} label="Party" />}
                    />

                    <TextField
                        label="Description"
                        multiline
                        minRows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={editMode ? updatePayment : addPayment}
                    >
                        {editMode ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default PaymentEntry;