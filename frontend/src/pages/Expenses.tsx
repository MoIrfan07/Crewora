// src/pages/Expenses.tsx
import React, { useEffect, useMemo, useState } from "react";
import AppTable from "../components/AppTable";
import {
    IconButton,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Popover,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeFilter from "../components/DateRangeFilter";
import dayjs from "dayjs";
import { format } from "date-fns";

import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { GridSortModel } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import "../styles/expenses.css";

interface ExpenseItem {
    id: number | string;
    to: { type: string; name: string };
    client?: string;
    project?: string;
    category: string;
    amount: number;
    date: string;
    description?: string;
}

interface Person {
    id: number | string;
    name: string;
    contact?: string;
    type?: string; // for others entries
}

const Expenses: React.FC = () => {
    /* -------------------- STATES -------------------- */
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [salesmen, setSalesmen] = useState<Person[]>([]);
    const [investors, setInvestors] = useState<Person[]>([]);
    const [clientsList, setClientsList] = useState<any[]>([]);
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [others, setOthers] = useState<Person[]>([]);

    const [search, setSearch] = useState("");
    const [filterColumn, setFilterColumn] = useState<string>("All");
    const [filterValue, setFilterValue] = useState<string>("");
    const navigate = useNavigate();

    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | string | null>(null);

    /* Date range */
    const [range, setRange] = useState<any>({
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2100, 0, 1),
        key: "selection",
    });
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    /* ADD MODAL */
    const [isOpen, setIsOpen] = useState(false);
    const [toType, setToType] = useState("");
    const [toName, setToName] = useState("");
    const [client, setClient] = useState("");
    const [project, setProject] = useState("");
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");

    const [categories, setCategories] = useState<string[]>([
        "Office Expense",
        "Travel",
        "Food",
        "Salary",
        "Maintenance",
        "Other",
    ]);

    const [newCategory, setNewCategory] = useState("");
    const [addNewCategoryMode, setAddNewCategoryMode] = useState(false);

    /* Add-person dialog */
    const [addPersonDialogOpen, setAddPersonDialogOpen] = useState(false);
    const [addPersonType, setAddPersonType] = useState<"salesman" | "investor" | "">("");
    const [personName, setPersonName] = useState("");
    const [personContact, setPersonContact] = useState("");

    /* Add-other-type dialog */
    const [addTypeDialogOpen, setAddTypeDialogOpen] = useState(false);
    const [newTypeValue, setNewTypeValue] = useState("");
    const [newTypePersonName, setNewTypePersonName] = useState("");
    const [newTypePersonContact, setNewTypePersonContact] = useState("");

    /* Company (kept as read from login flow) */
    const company = localStorage.getItem("companyName") || "default_company";

    /* -------------------- LOAD from backend -------------------- */
    const safeArray = (v: any) => (Array.isArray(v) ? v : []);

    const loadExpenses = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/expenses/${encodeURIComponent(company)}`);
            if (!res.ok) throw new Error("Failed fetching expenses");
            const data = await res.json();
            setExpenses(safeArray(data));
        } catch (err) {
            console.error("LOAD EXPENSES ERROR:", err);
            alert("Could not load expenses from backend");
        }
    };

    const loadSalesmen = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/salesmen/${encodeURIComponent(company)}`);
            if (!res.ok) throw new Error("Failed fetching salesmen");
            setSalesmen(safeArray(await res.json()));
        } catch (err) {
            console.error("LOAD SALESMEN ERROR:", err);
        }
    };

    const loadInvestors = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/investors/${encodeURIComponent(company)}`);
            if (!res.ok) throw new Error("Failed fetching investors");
            setInvestors(safeArray(await res.json()));
        } catch (err) {
            console.error("LOAD INVESTORS ERROR:", err);
        }
    };

    const loadClients = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/clients/${encodeURIComponent(company)}`);
            if (!res.ok) throw new Error("Failed fetching clients");
            setClientsList(safeArray(await res.json()));
        } catch (err) {
            console.error("LOAD CLIENTS ERROR:", err);
        }
    };

    const loadProjects = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/projects/${encodeURIComponent(company)}`);
            if (!res.ok) throw new Error("Failed fetching projects");
            setProjectsList(safeArray(await res.json()));
        } catch (err) {
            console.error("LOAD PROJECTS ERROR:", err);
        }
    };

    const loadOthers = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/others/${encodeURIComponent(company)}`);
            if (!res.ok) throw new Error("Failed fetching others");
            setOthers(safeArray(await res.json()));
        } catch (err) {
            console.error("LOAD OTHERS ERROR:", err);
        }
    };

    useEffect(() => {
        // load everything from backend on mount
        loadExpenses();
        loadSalesmen();
        loadInvestors();
        loadClients();
        loadProjects();
        loadOthers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [company]);

    /* -------------------- HELPERS -------------------- */
    const capitalizeWords = (str = "") =>
        str
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    const [sortModel, setSortModel] = useState<GridSortModel>([]);

    const applySorting = (rows: any[]) => {
        if (!sortModel || sortModel.length === 0) return rows;

        const { field, sort } = sortModel[0];
        if (!field || !sort) return rows;

        return [...rows].sort((a, b) => {
            let v1 = a[field];
            let v2 = b[field];

            // Special handling for "to"
            if (field === "to") {
                v1 = `${a.to.type} ${a.to.name}`;
                v2 = `${b.to.type} ${b.to.name}`;
            }

            if (!isNaN(Number(v1)) && !isNaN(Number(v2))) {
                v1 = Number(v1);
                v2 = Number(v2);
            }

            if (v1 < v2) return sort === "asc" ? -1 : 1;
            if (v1 > v2) return sort === "asc" ? 1 : -1;
            return 0;
        });
    };

    /* -------------------- ADD / UPDATE / DELETE EXPENSE (backend) -------------------- */

    const updateExpense = async () => {
        if (!toType || !toName || !category || !amount || !date) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/expenses/update/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: { type: toType, name: toName },
                    client,
                    project,
                    category,
                    amount: Number(amount),
                    date,
                    description,
                }),
            });

            if (!res.ok) throw new Error("Update failed");
            setIsOpen(false);
            setEditMode(false);
            setEditingId(null);

            setToType("");
            setToName("");
            setClient("");
            setProject("");
            setCategory("");
            setAmount("");
            setDate("");
            setDescription("");

            await loadExpenses();
        } catch (err) {
            console.error("UPDATE EXPENSE ERROR:", err);
            alert("Failed to update expense");
        }
    };

    const addExpense = async () => {
        if (!toType || !toName || !category || !amount || !date) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            const payload = {
                id: Date.now().toString(),
                company,
                to: { type: toType, name: toName },
                client,
                project,
                category,
                amount: Number(amount),
                date,
                description: description || "",
            };

            const res = await fetch("http://127.0.0.1:5000/api/expenses/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Add expense failed");

            setIsOpen(false);
            // reset fields
            setToType("");
            setToName("");
            setClient("");
            setProject("");
            setCategory("");
            setAmount("");
            setDate("");
            setDescription("");

            await loadExpenses();
        } catch (err) {
            console.error("ADD EXPENSE ERROR:", err);
            alert("Failed to add expense");
        }
    };

    const deleteExpense = async (id: number | string) => {
        if (!window.confirm("Delete this Expense?")) return;
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/expenses/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            await loadExpenses();
        } catch (err) {
            console.error("DELETE EXPENSE ERROR:", err);
            alert("Failed to delete expense");
        }
    };

    /* -------------------- PERSONS / OTHERS CRUD (backend) -------------------- */

    // open add-person dialog
    const openAddPersonDialog = (type: "salesman" | "investor") => {
        setAddPersonType(type);
        setPersonName("");
        setPersonContact("");
        setAddPersonDialogOpen(true);
    };

    const saveNewPerson = async () => {
        const nameTrim = personName.trim();
        if (!nameTrim) {
            alert("Please enter name");
            return;
        }

        const id = Date.now().toString();
        const payload = { id, company, name: capitalizeWords(nameTrim), contact: personContact.trim() };

        try {
            if (addPersonType === "salesman") {
                const res = await fetch("http://127.0.0.1:5000/api/salesmen/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Failed to add salesman");
                await loadSalesmen();
                setToType("salesman");
                setToName(capitalizeWords(nameTrim));
            } else if (addPersonType === "investor") {
                const res = await fetch("http://127.0.0.1:5000/api/investors/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Failed to add investor");
                await loadInvestors();
                setToType("investor");
                setToName(capitalizeWords(nameTrim));
            }

            setAddPersonDialogOpen(false);
            setAddPersonType("");
            setPersonName("");
            setPersonContact("");
        } catch (err) {
            console.error("SAVE NEW PERSON ERROR:", err);
            alert("Could not save person");
        }
    };

    /* Add new custom type and person (others) */
    const openAddTypeDialog = () => {
        setNewTypeValue("");
        setNewTypePersonName("");
        setNewTypePersonContact("");
        setAddTypeDialogOpen(true);
    };

    const saveNewType = async () => {
        const t = newTypeValue.trim();
        const n = newTypePersonName.trim();
        if (!t || !n) {
            alert("Type and Name are required");
            return;
        }

        const payload = {
            id: Date.now().toString(),
            company,
            type: capitalizeWords(t),
            name: capitalizeWords(n),
            contact: newTypePersonContact.trim(),
        };

        try {
            const res = await fetch("http://127.0.0.1:5000/api/others/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to add other type");
            await loadOthers();

            setToType(capitalizeWords(t));
            setToName(capitalizeWords(n));

            setAddTypeDialogOpen(false);
            setNewTypeValue("");
            setNewTypePersonName("");
            setNewTypePersonContact("");
        } catch (err) {
            console.error("SAVE NEW TYPE ERROR:", err);
            alert("Could not save new type/person");
        }
    };

    /* -------------------- FILTER + SORT + PDF (client side) -------------------- */

    const filterOptions = useMemo(() => {
        switch (filterColumn) {
            case "to":
                return [
                    ...salesmen.map((s) => `Salesman: ${s.name}`),
                    ...investors.map((i) => `Investor: ${i.name}`),
                    ...others.map((o) => `${o.type}: ${o.name}`),
                ];
            case "client":
                return clientsList.map((c) => c.name);
            case "project":
                return projectsList.map((p) => p.name);
            case "category":
                return categories;
            case "amount":
                return Array.from(new Set(expenses.map((r) => r.amount.toString())));
            case "date":
                return Array.from(new Set(expenses.map((r) => r.date)));
            default:
                return [];
        }
    }, [filterColumn, expenses, salesmen, investors, clientsList, projectsList, categories, others]);

    const filteredRows = useMemo(() => {
        return expenses
            .filter((row) => {
                if (filterColumn === "All" || !filterValue) return true;
                if (filterColumn === "to") {
                    const display = `${row.to.type.charAt(0).toUpperCase() + row.to.type.slice(1)}: ${row.to.name}`;
                    return display === filterValue;
                }
                const val = (row as any)[filterColumn];
                return String(val) === filterValue;
            })
            .filter((row) => {
                if (!search) return true;
                const hay = [
                    `${row.to.type} ${row.to.name}`,
                    row.client,
                    row.project,
                    row.category,
                    row.amount,
                    row.date,
                    row.description || "",
                ]
                    .join(" ")
                    .toLowerCase();
                return hay.includes(search.toLowerCase());
            })
            .filter((row) => {
                const d = new Date(row.date).getTime();
                return d >= range.startDate.getTime() && d <= range.endDate.getTime();
            });
    }, [expenses, filterColumn, filterValue, search, range]);

    const generatePDF = async () => {
        try {
            const doc = new jsPDF("p", "pt", "a4");
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();

            const sortedRows = applySorting(filteredRows);

            const img = new Image();
            img.src = "/Elite_Avenue_LH2_page-0001.jpg";
            await new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
            });

            try {
                doc.addImage(img, "JPEG", 0, 0, pw, ph);
            } catch { }

            doc.setFontSize(16);
            doc.text("Expenses Report", 40, 140);

            const columnsForPDF = ["Category", "To", "Client", "Project", "Amount", "Date"];

            const rows = sortedRows.map((r) => [
                r.category,
                `${capitalizeWords(r.to.type)}: ${capitalizeWords(r.to.name)}`,
                r.client || "N/A",
                r.project || "N/A",
                r.amount?.toString() || "0",
                r.date,
            ]);

            autoTable(doc, {
                head: [columnsForPDF],
                body: rows,
                startY: 160,
                margin: { left: 40, right: 40 },
                theme: "grid",
                headStyles: {
                    fillColor: [0, 102, 153],
                    textColor: [255, 255, 255],
                },
                styles: {
                    fillColor: false,
                    textColor: [0, 0, 0],
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                },
            });

            doc.save("expenses_report.pdf");
        } catch (err) {
            console.error(err);
            alert("PDF generation failed.");
        }
    };

    /* -------------------- TABLE COLUMNS -------------------- */
    const tableColumns = [
        { field: "category", headerName: "Category", flex: 1 },
        {
            field: "to",
            headerName: "To",
            flex: 1,
            renderCell: (params: any) => (
                <span>{`${capitalizeWords(params.row.to.type)}: ${capitalizeWords(params.row.to.name)}`}</span>
            ),
        },
        { field: "client", headerName: "Client", flex: 1 },
        { field: "project", headerName: "Project", flex: 1 },
        { field: "amount", headerName: "Amount", flex: 1 },
        { field: "date", headerName: "Date", flex: 1 },
        { field: "description", headerName: "Description", flex: 1.4 },
        {
            field: "actions",
            headerName: "Actions",
            flex: 0.5,
            renderCell: (params: any) => (
                <div style={{ display: "flex", gap: "6px" }}>
                    <IconButton onClick={() => navigate(`/expenses/details/${params.row.id}`)}>
                        <FiEye size={18} />
                    </IconButton>

                    <IconButton
                        onClick={() => {
                            const row = params.row;
                            setEditMode(true);
                            setEditingId(row.id);

                            setToType(row.to.type);
                            setToName(row.to.name);
                            setClient(row.client || "");
                            setProject(row.project || "");
                            setCategory(row.category);
                            setAmount(row.amount.toString());
                            setDate(row.date);
                            setDescription(row.description || "");

                            setIsOpen(true);
                        }}
                    >
                        <FiEdit size={18} />
                    </IconButton>

                    <IconButton onClick={() => deleteExpense(params.row.id)}>
                        <FiTrash2 size={18} />
                    </IconButton>
                </div>
            ),
        },
    ];

    /* Build unique list of types for To Type select: Salesman, Investor, then distinct others types */
    const otherTypes = useMemo(() => {
        const setTypes = new Set<string>();
        others.forEach((o) => {
            if (o.type) setTypes.add(capitalizeWords(o.type));
        });
        return Array.from(setTypes);
    }, [others]);

    /* Persons for a selected type (when type is custom) */
    const personsForSelectedType = useMemo(() => {
        if (!toType) return [];
        const t = toType.toLowerCase();
        if (t === "salesman") return salesmen;
        if (t === "investor") return investors;
        return others.filter((o) => (o.type || "").toLowerCase() === t);
    }, [toType, salesmen, investors, others]);

    /* -------------------- JSX -------------------- */
    return (
        <div className="expenses-page">
            <div className="page-header compact-header">
                <h1 className="page-title">Expenses</h1>

                <div className="header-controls">
                    <TextField
                        select
                        size="small"
                        value={filterColumn}
                        onChange={(e) => {
                            setFilterColumn(e.target.value);
                            setFilterValue("");
                        }}
                        sx={{ width: 100 }}
                    >
                        <MenuItem value="All">All</MenuItem>
                        <MenuItem value="to">To</MenuItem>
                        <MenuItem value="client">Client</MenuItem>
                        <MenuItem value="project">Project</MenuItem>
                        <MenuItem value="category">Category</MenuItem>
                        <MenuItem value="amount">Amount</MenuItem>
                    </TextField>

                    {filterColumn !== "All" && (
                        <TextField
                            select
                            size="small"
                            sx={{ width: 160 }}
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {filterOptions.map((opt, i) => (
                                <MenuItem key={i} value={opt}>
                                    {opt}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    <div className="date-picker" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <CalendarMonthIcon style={{ fontSize: 18 }} />
                        {`${format(range.startDate, "dd MMM, yyyy")} – ${format(range.endDate, "dd MMM, yyyy")}`}
                    </div>

                    <Popover
                        open={open}
                        anchorEl={anchorEl}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        PaperProps={{
                            sx: {
                                borderRadius: "14px",
                                boxShadow: "0 6px 22px rgba(0,0,0,0.13)",
                                padding: 0,
                            },
                        }}
                    >
                        <DateRangeFilter
                            value={[dayjs(range.startDate), dayjs(range.endDate)]}
                            onChange={(val) => {
                                setRange({
                                    startDate: val[0].toDate(),
                                    endDate: val[1].toDate(),
                                });
                                setAnchorEl(null); // close after select
                            }}
                        />
                    </Popover>

                    <TextField size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 140 }} />

                    <Button variant="outlined" onClick={generatePDF}>
                        PDF
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            setEditMode(false);
                            setEditingId(null);
                            setIsOpen(true);
                            // reset form
                            setToType("");
                            setToName("");
                            setClient("");
                            setProject("");
                            setCategory("");
                            setAmount("");
                            setDate("");
                            setDescription("");
                        }}
                    >
                        Add
                    </Button>
                </div>
            </div>

            <AppTable rows={filteredRows} columns={tableColumns} pageSize={5} height={520} sortModel={sortModel} onSortModelChange={(model) => setSortModel([...model])} />

            {/* ADD / EDIT DIALOG */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogTitle>{editMode ? "Edit Expense" : "Add Expense"}</DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, width: 420 }}>
                    {!addNewCategoryMode ? (
                        <>
                            <TextField label="Category" select fullWidth value={category} onChange={(e) => setCategory(e.target.value)}>
                                <MenuItem value="">Select Category</MenuItem>
                                {categories.map((c, i) => (
                                    <MenuItem key={i} value={c}>
                                        {c}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <Button variant="outlined" onClick={() => setAddNewCategoryMode(true)} sx={{ width: "100%" }}>
                                    + Add Category
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <TextField label="New Category" fullWidth value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                        if (!newCategory.trim()) return;
                                        const formatted = capitalizeWords(newCategory);
                                        setCategories((prev) => [...prev, formatted]);
                                        setCategory(formatted);
                                        setNewCategory("");
                                        setAddNewCategoryMode(false);
                                    }}
                                    sx={{ width: "50%" }}
                                >
                                    Save
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => {
                                        setNewCategory("");
                                        setAddNewCategoryMode(false);
                                    }}
                                    sx={{ width: "50%" }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}

                    <TextField
                        label="To Type"
                        select
                        fullWidth
                        value={toType}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (v === "__add_type") {
                                openAddTypeDialog();
                            } else {
                                setToType(v);
                                setToName("");
                            }
                        }}
                    >
                        <MenuItem value="">Select Type</MenuItem>
                        <MenuItem value="salesman">Salesman</MenuItem>
                        <MenuItem value="investor">Investor</MenuItem>

                        {otherTypes.map((t) => (
                            <MenuItem key={t} value={t}>
                                {t}
                            </MenuItem>
                        ))}

                        <MenuItem value="__add_type">+ Add New Type</MenuItem>
                    </TextField>

                    {toType === "salesman" && (
                        <TextField
                            label="Select Salesman"
                            select
                            fullWidth
                            value={toName}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === "__add_salesman") openAddPersonDialog("salesman");
                                else setToName(v);
                            }}
                        >
                            <MenuItem value="">Select Salesman</MenuItem>
                            {salesmen.map((s) => (
                                <MenuItem key={s.id} value={s.name}>
                                    {s.name}
                                </MenuItem>
                            ))}
                            <MenuItem value="__add_salesman">+ Add New Salesman</MenuItem>
                        </TextField>
                    )}

                    {toType === "investor" && (
                        <TextField
                            label="Select Investor"
                            select
                            fullWidth
                            value={toName}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === "__add_investor") openAddPersonDialog("investor");
                                else setToName(v);
                            }}
                        >
                            <MenuItem value="">Select Investor</MenuItem>
                            {investors.map((inv) => (
                                <MenuItem key={inv.id} value={inv.name}>
                                    {inv.name}
                                </MenuItem>
                            ))}
                            <MenuItem value="__add_investor">+ Add New Investor</MenuItem>
                        </TextField>
                    )}

                    {toType && toType !== "salesman" && toType !== "investor" && (
                        <TextField label={`Select ${toType} Person`} select fullWidth value={toName} onChange={(e) => setToName(e.target.value)}>
                            <MenuItem value="">Select</MenuItem>
                            {personsForSelectedType.map((p) => (
                                <MenuItem key={p.id} value={p.name}>
                                    {p.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    <TextField
                        label="Client (optional)"
                        select
                        fullWidth
                        value={client}
                        onChange={(e) => {
                            setClient(e.target.value);
                            setProject("");
                        }}
                    >
                        <MenuItem value="">Select Client</MenuItem>
                        {clientsList.map((c, i) => (
                            <MenuItem key={i} value={c.name}>
                                {c.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField label="Project (optional)" select fullWidth value={project} onChange={(e) => setProject(e.target.value)}>
                        <MenuItem value="">Select Project</MenuItem>
                        {projectsList.filter((p) => !client || p.client === client).map((p, i) => (
                            <MenuItem key={i} value={p.name}>
                                {p.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                                            label="Description (optional)"
                                            fullWidth
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                    <TextField label="Amount" type="number" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={date} onChange={(e) => setDate(e.target.value)} />
                </DialogContent>

                <DialogActions sx={{ pr: 2 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                            if (editMode) updateExpense();
                            else addExpense();
                        }}
                    >
                        {editMode ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add-person dialog */}
            <Dialog open={addPersonDialogOpen} onClose={() => setAddPersonDialogOpen(false)}>
                <DialogTitle>{addPersonType === "salesman" ? "Add Salesman" : addPersonType === "investor" ? "Add Investor" : "Add Person"}</DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, width: 420 }}>
                    <TextField label="Full Name" fullWidth value={personName} onChange={(e) => setPersonName(e.target.value)} />
                    <TextField label="Contact (optional)" fullWidth value={personContact} onChange={(e) => setPersonContact(e.target.value)} />
                </DialogContent>

                <DialogActions sx={{ pr: 2 }}>
                    <Button color="error" onClick={() => setAddPersonDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="success" onClick={() => saveNewPerson()}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Type dialog (others) */}
            <Dialog open={addTypeDialogOpen} onClose={() => setAddTypeDialogOpen(false)}>
                <DialogTitle>Add New Type</DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, width: 420 }}>
                    <TextField label="Type (e.g. Vendor, Partner)" fullWidth value={newTypeValue} onChange={(e) => setNewTypeValue(e.target.value)} />
                    <TextField label="Name" fullWidth value={newTypePersonName} onChange={(e) => setNewTypePersonName(e.target.value)} />
                    <TextField label="Contact (optional)" fullWidth value={newTypePersonContact} onChange={(e) => setNewTypePersonContact(e.target.value)} />
                </DialogContent>

                <DialogActions sx={{ pr: 2 }}>
                    <Button color="error" onClick={() => setAddTypeDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="success" onClick={() => saveNewType()}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Expenses;
