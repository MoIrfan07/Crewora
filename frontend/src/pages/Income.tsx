import React, { useEffect, useMemo, useState } from "react";
import type { GridSortModel } from "@mui/x-data-grid";

import AppTable from "../components/AppTable";
import {
    Button,
    IconButton,
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

import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

import "../styles/income.css";

interface IncomeItem {
    id: string;
    from: { type: string; name: string };
    client?: string;
    project?: string;
    description: string;
    category: string;
    amount: number;
    date: string;
}

interface Person {
    id: string;
    name: string;
    contact?: string;
    type?: string;
}

const Income: React.FC = () => {
    /* -------------------- STATES -------------------- */
    const [income, setIncome] = useState<IncomeItem[]>([]);
    const [salesmen, setSalesmen] = useState<Person[]>([]);
    const [investors, setInvestors] = useState<Person[]>([]);
    const [clientsList, setClientsList] = useState<any[]>([]);
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [others, setOthers] = useState<Person[]>([]);

    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [filterColumn, setFilterColumn] = useState("All");
    const [filterValue, setFilterValue] = useState("");
    const [sortModel, setSortModel] = useState<GridSortModel>([]);


    /* Date Range */
    const [range, setRange] = useState<any>({
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2100, 0, 1),
        key: "selection",
    });
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    /* Add/Edit Modal */
    const [isOpen, setIsOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [fromType, setFromType] = useState("");
    const [fromName, setFromName] = useState("");
    const [client, setClient] = useState("");
    const [project, setProject] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState("");

    const [categories, setCategories] = useState<string[]>([
        "Project Income",
        "Manpower Income",
        "Commission",
        "Investment",
    ]);

    const [newCategory, setNewCategory] = useState("");
    const [addNewCategoryMode, setAddNewCategoryMode] = useState(false);

    /* Add New Type Dialog */
    const [addTypeDialogOpen, setAddTypeDialogOpen] = useState(false);
    const [newTypeValue, setNewTypeValue] = useState("");
    const [newTypePersonName, setNewTypePersonName] = useState("");
    const [newTypePersonContact, setNewTypePersonContact] = useState("");

    const company = localStorage.getItem("companyName") || "";

    const capitalizeWords = (str = "") =>
        str
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    /* ===========================================================
       LOAD ALL DATA FROM BACKEND
    ============================================================ */
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/income/${company}`)
            .then(res => res.json())
            .then(setIncome)
            .catch(() => setIncome([]));

        fetch(`http://127.0.0.1:5000/api/salesmen/${company}`)
            .then(res => res.json())
            .then(setSalesmen);

        fetch(`http://127.0.0.1:5000/api/investors/${company}`)
            .then(res => res.json())
            .then(setInvestors);

        fetch(`http://127.0.0.1:5000/api/clients/${company}`)
            .then(res => res.json())
            .then(setClientsList);

        fetch(`http://127.0.0.1:5000/api/projects/${company}`)
            .then(res => res.json())
            .then(setProjectsList);

        fetch(`http://127.0.0.1:5000/api/others/${company}`)
            .then(res => res.json())
            .then(setOthers);
    }, [company]);

    /* ===========================================================
       ADD INCOME (POST)
    ============================================================ */
    const addIncome = () => {
        if (!fromType || !fromName || !category || !amount || !date)
            return alert("Fill all required fields");

        const payload = {
            id: Date.now().toString(),
            company,
            from: { type: fromType, name: fromName },
            client,
            project,
            description,
            category,
            amount: Number(amount),
            date,
        };

        fetch("http://127.0.0.1:5000/api/income/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then(() => {
                setIncome((prev) => [...prev, payload]);
                resetForm();
            });
    };

    /* ===========================================================
       UPDATE INCOME (PUT)
    ============================================================ */
    const updateIncome = () => {
        if (!editingId) return;

        const payload = {
            from: { type: fromType, name: fromName },
            client,
            project,
            description,
            category,
            amount: Number(amount),
            date,
        };

        fetch(`http://127.0.0.1:5000/api/income/update/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then(() => {
                setIncome((prev) =>
                    prev.map((i) => (i.id === editingId ? { id: editingId, ...payload } : i))
                );
                resetForm();
            });
    };

    /* ===========================================================
       DELETE INCOME (DELETE)
    ============================================================ */
    const deleteIncome = (id: string) => {
        if (!window.confirm("Delete this Income?")) return;
        fetch(`http://127.0.0.1:5000/api/income/delete/${id}`, {
            method: "DELETE",
        }).then(() => {
            setIncome((prev) => prev.filter((i) => i.id !== id));
        });
    };

    /* RESET FORM */
    const resetForm = () => {
        setIsOpen(false);
        setEditMode(false);
        setEditingId(null);
        setFromType("");
        setFromName("");
        setClient("");
        setProject("");
        setDescription("");
        setCategory("");
        setAmount("");
        setDate("");
    };


    // add salesman/investor dialog
    const [addPersonDialogOpen, setAddPersonDialogOpen] = useState(false);
    const [addPersonType, setAddPersonType] = useState<"salesman" | "investor" | "">("");
    const [personName, setPersonName] = useState("");
    const [personContact, setPersonContact] = useState("");

    // add person for custom type
    const [addTypePersonDialogOpen, setAddTypePersonDialogOpen] = useState(false);
    const [newTypePersonName2, setNewTypePersonName2] = useState("");
    const [newTypePersonContact2, setNewTypePersonContact2] = useState("");


    const openAddPersonDialog = (type: "salesman" | "investor") => {
        setAddPersonType(type);
        setPersonName("");
        setPersonContact("");
        setAddPersonDialogOpen(true);
    };

    const saveNewPerson = async () => {
        if (!personName.trim()) return alert("Enter a name");

        const payload = {
            id: Date.now().toString(),
            company,
            name: capitalizeWords(personName),
            contact: personContact,
        };

        try {
            if (addPersonType === "salesman") {
                await fetch("http://127.0.0.1:5000/api/salesmen/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                setSalesmen((p) => [...p, payload]);
            } else {
                await fetch("http://127.0.0.1:5000/api/investors/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                setInvestors((p) => [...p, payload]);
            }

            setFromName(payload.name);
            setFromType(addPersonType);

            setAddPersonDialogOpen(false);
        } catch {
            alert("Error saving person");
        }
    };


    // SAVE CUSTOM TYPE PERSON
    const saveNewTypePerson = async () => {
        if (!newTypePersonName2.trim()) return alert("Enter name");

        const payload = {
            id: Date.now().toString(),
            company,
            type: capitalizeWords(fromType),
            name: capitalizeWords(newTypePersonName2),
            contact: newTypePersonContact2,
        };

        await fetch("http://127.0.0.1:5000/api/others/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        setOthers((p) => [...p, payload]);
        setFromName(payload.name);

        setAddTypePersonDialogOpen(false);
    };

    /* ===========================================================
       FILTERING
    ============================================================ */
    const filterOptions = useMemo(() => {
        switch (filterColumn) {
            case "from":
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
                return Array.from(new Set(income.map((r) => String(r.amount))));
            default:
                return [];
        }
    }, [filterColumn, income]);

    const filteredRows = useMemo(() => {
        return income
            .filter((row) => {
                if (filterColumn === "All" || !filterValue) return true;

                if (filterColumn === "from") {
                    const display = `${capitalizeWords(row.from.type)}: ${capitalizeWords(row.from.name)}`;
                    return display === filterValue;
                }

                return String((row as any)[filterColumn]) === filterValue;
            })
            .filter((row) => {
                if (!search) return true;

                const hay = [
                    `${row.from.type} ${row.from.name}`,
                    row.client,
                    row.project,
                    row.category,
                    row.amount,
                    row.date,
                    row.description,
                ]
                    .join(" ")
                    .toLowerCase();

                return hay.includes(search.toLowerCase());
            })
            .filter((row) => {
                const d = new Date(row.date).getTime();
                return d >= range.startDate.getTime() && d <= range.endDate.getTime();
            });
    }, [income, filterColumn, filterValue, search, range]);

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
    /* -------------------- PDF -------------------- */
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
            doc.text("Income Report", 40, 140);

            const columnsForPDF = ["Category", "From", "Client", "Project", "Amount", "Date"];

            const rows = sortedRows.map((r) => [
                r.category,
                `${capitalizeWords(r.from.type)}: ${capitalizeWords(r.from.name)}`,
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

            doc.save("income_report.pdf");
        } catch (err) {
            console.error(err);
            alert("PDF generation failed.");
        }
    };


    /* ===========================================================
       TABLE COLUMNS
    ============================================================ */
    const columns = [
        { field: "category", headerName: "Category", flex: 1 },
        {
            field: "from",
            headerName: "From",
            flex: 1,
            renderCell: (params: any) => (
                <span>
                    {`${capitalizeWords(params.row.from.type)}: ${capitalizeWords(params.row.from.name)}`}
                </span>
            ),
        },
        { field: "client", headerName: "Client", flex: 1 },
        { field: "project", headerName: "Project", flex: 1 },
        { field: "amount", headerName: "Amount", flex: 1 },
        { field: "date", headerName: "Date", flex: 1 },
        { field: "description", headerName: "Description", flex: 1 },
        {
            field: "actions",
            headerName: "Actions",
            flex: 0.7,
            renderCell: (params: any) => (
                <div style={{ display: "flex", gap: 8 }}>
                    <IconButton onClick={() => navigate(`/income/details/${params.row.id}`)}>
                        <FiEye size={18} />
                    </IconButton>

                    <IconButton
                        onClick={() => {
                            const row = params.row;

                            setEditMode(true);
                            setEditingId(row.id);

                            setFromType(row.from.type);
                            setFromName(row.from.name);
                            setClient(row.client || "");
                            setProject(row.project || "");
                            setDescription(row.description || "");
                            setCategory(row.category);
                            setAmount(row.amount.toString());
                            setDate(row.date);

                            setIsOpen(true);
                        }}
                    >
                        <FiEdit size={18} />
                    </IconButton>

                    <IconButton onClick={() => deleteIncome(params.row.id)}>
                        <FiTrash2 size={18} />
                    </IconButton>
                </div>
            ),
        },
    ];

    return (
        <div className="income-page">
            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Income</h1>

                <div className="header-controls">
                    {/* FILTER COLUMN */}
                    <TextField
                        select
                        size="small"
                        value={filterColumn}
                        onChange={(e) => {
                            setFilterColumn(e.target.value);
                            setFilterValue("");
                        }}
                        sx={{ width: 120 }}
                    >
                        <MenuItem value="All">All</MenuItem>
                        <MenuItem value="from">From</MenuItem>
                        <MenuItem value="client">Client</MenuItem>
                        <MenuItem value="project">Project</MenuItem>
                        <MenuItem value="category">Category</MenuItem>
                        <MenuItem value="amount">Amount</MenuItem>
                    </TextField>

                    {/* FILTER VALUE */}
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

                    {/* DATE RANGE */}
                    <div
                        className="date-picker"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                    >
                        <CalendarMonthIcon style={{ fontSize: 18 }} />
                        {`${format(range.startDate, "dd MMM, yyyy")} – ${format(
                            range.endDate,
                            "dd MMM, yyyy"
                        )}`}
                    </div>

                    <Popover
                        open={open}
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
                        }}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <AppTable
                rows={filteredRows}
                columns={columns}
                pageSize={25}
                height={520}
                sortModel={sortModel}
                onSortModelChange={(model) => setSortModel([...model])}
            />

            {/* ADD/EDIT INCOME MODAL */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogTitle>{editMode ? "Edit Income" : "Add Income"}</DialogTitle>

                <DialogContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        width: 420,
                    }}
                >
                    {/* CATEGORY */}
                    {!addNewCategoryMode ? (
                        <>
                            <TextField
                                label="Category"
                                select
                                fullWidth
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <MenuItem value="">Select Category</MenuItem>
                                {categories.map((c, i) => (
                                    <MenuItem key={i} value={c}>
                                        {c}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Button
                                variant="outlined"
                                onClick={() => setAddNewCategoryMode(true)}
                            >
                                + Add Category
                            </Button>
                        </>
                    ) : (
                        <>
                            <TextField
                                label="New Category"
                                fullWidth
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                            />

                            <div style={{ display: "flex", gap: 10 }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                        if (!newCategory.trim()) return;
                                        const formatted = capitalizeWords(newCategory);
                                        setCategories((p) => [...p, formatted]);
                                        setCategory(formatted);
                                        setAddNewCategoryMode(false);
                                        setNewCategory("");
                                    }}
                                    sx={{ width: "50%" }}
                                >
                                    Save
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => setAddNewCategoryMode(false)}
                                    sx={{ width: "50%" }}
                                >

                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}

                    {/* FROM TYPE */}
                    <TextField
                        label="From Type"
                        select
                        fullWidth
                        value={fromType}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (v === "__add_type") {
                                setAddTypeDialogOpen(true);
                            } else {
                                setFromType(v);
                                setFromName("");
                            }
                        }}
                    >
                        <MenuItem value="">Select Type</MenuItem>
                        <MenuItem value="salesman">Salesman</MenuItem>
                        <MenuItem value="investor">Investor</MenuItem>

                        {Array.from(new Set(others.map((o) => o.type))).map((t, i) => (
                            <MenuItem key={i} value={t}>
                                {t}
                            </MenuItem>
                        ))}

                        <MenuItem value="__add_type">+ Add New Type</MenuItem>
                    </TextField>

                    {/* NAME BASED ON TYPE */}
                    {fromType === "salesman" && (
                        <TextField
                            label="Select Salesman"
                            select
                            fullWidth
                            value={fromName}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === "__add_salesman") openAddPersonDialog("salesman");
                                else setFromName(v);
                            }}
                        >
                            <MenuItem value="">Select</MenuItem>
                            {salesmen.map((s) => (
                                <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                            ))}
                            <MenuItem value="__add_salesman">+ Add New Salesman</MenuItem>
                        </TextField>
                    )}

                    {fromType === "investor" && (
                        <TextField
                            label="Select Investor"
                            select
                            fullWidth
                            value={fromName}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === "__add_investor") openAddPersonDialog("investor");
                                else setFromName(v);
                            }}
                        >
                            <MenuItem value="">Select</MenuItem>
                            {investors.map((inv) => (
                                <MenuItem key={inv.id} value={inv.name}>{inv.name}</MenuItem>
                            ))}
                            <MenuItem value="__add_investor">+ Add New Investor</MenuItem>
                        </TextField>
                    )}




                    {fromType &&
                        fromType !== "salesman" &&
                        fromType !== "investor" && (
                            <TextField
                                label={`Select ${fromType} Person`}
                                select
                                fullWidth
                                value={fromName}
                                onChange={(e) => setFromName(e.target.value)}
                            >
                                <MenuItem value="">Select</MenuItem>
                                {others
                                    .filter((o) =>
                                        (o.type ?? "").toLowerCase() === fromType.toLowerCase()
                                    )
                                    .map((p) => (
                                        <MenuItem key={p.id} value={p.name}>
                                            {p.name}
                                        </MenuItem>
                                    ))}

                            </TextField>
                        )}

                    {/* CLIENT */}
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
                        {clientsList.map((c: any) => (
                            <MenuItem key={c.id} value={c.name}>
                                {c.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* PROJECT */}
                    <TextField
                        label="Project (optional)"
                        select
                        fullWidth
                        value={project}
                        onChange={(e) => setProject(e.target.value)}
                    >
                        <MenuItem value="">Select Project</MenuItem>
                        {projectsList
                            .filter((p) => !client || p.client === client)
                            .map((p) => (
                                <MenuItem key={p.id} value={p.name}>
                                    {p.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    {/* DESCRIPTION */}
                    <TextField
                        label="Description (optional)"
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    {/* AMOUNT */}
                    <TextField
                        label="Amount"
                        type="number"
                        fullWidth
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    {/* DATE */}
                    <TextField
                        label="Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </DialogContent>

                <DialogActions sx={{ pr: 2 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={editMode ? updateIncome : addIncome}
                    >
                        {editMode ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>


            {/* ADD NEW TYPE (OTHERS) */}
            <Dialog
                open={addTypeDialogOpen}
                onClose={() => setAddTypeDialogOpen(false)}
            >
                <DialogTitle>Add New Type</DialogTitle>

                <DialogContent
                    sx={{ display: "flex", flexDirection: "column", gap: 2, width: 420 }}
                >
                    <TextField
                        label="Type (Vendor, Partner...)"
                        fullWidth
                        value={newTypeValue}
                        onChange={(e) => setNewTypeValue(e.target.value)}
                    />

                    <TextField
                        label="Name"
                        fullWidth
                        value={newTypePersonName}
                        onChange={(e) => setNewTypePersonName(e.target.value)}
                    />

                    <TextField
                        label="Contact"
                        fullWidth
                        value={newTypePersonContact}
                        onChange={(e) => setNewTypePersonContact(e.target.value)}
                    />
                </DialogContent>

                <DialogActions sx={{ pr: 2 }}>
                    <Button
                        color="error"
                        onClick={() => setAddTypeDialogOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                            const type = capitalizeWords(newTypeValue);
                            const entry: Person = {
                                id: Date.now().toString(),
                                type,
                                name: newTypePersonName,
                                contact: newTypePersonContact,
                            };

                            fetch("http://127.0.0.1:5000/api/others/add", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    id: entry.id,
                                    company,
                                    type: entry.type,
                                    name: entry.name,
                                    contact: entry.contact,
                                }),
                            }).then(() => {
                                setOthers((p) => [...p, entry]);
                                setFromType(type);
                                setFromName(entry.name);
                                setAddTypeDialogOpen(false);
                            });
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
            {/* ADD NEW SALESMAN / INVESTOR DIALOG */}
            <Dialog open={addPersonDialogOpen} onClose={() => setAddPersonDialogOpen(false)}>
                <DialogTitle>{addPersonType === "salesman" ? "Add Salesman" : "Add Investor"}</DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, width: 420 }}>
                    <TextField fullWidth label="Full Name" value={personName} onChange={(e) => setPersonName(e.target.value)} />
                    <TextField fullWidth label="Contact (optional)" value={personContact} onChange={(e) => setPersonContact(e.target.value)} />
                </DialogContent>

                <DialogActions sx={{ pr: 2 }}>
                    <Button color="error" onClick={() => setAddPersonDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="success" onClick={saveNewPerson}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* ADD CUSTOM TYPE PERSON */}
            <Dialog open={addTypePersonDialogOpen} onClose={() => setAddTypePersonDialogOpen(false)}>
                <DialogTitle>Add New {fromType} Person</DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, width: 420 }}>
                    <TextField fullWidth label="Full Name" value={newTypePersonName2} onChange={(e) => setNewTypePersonName2(e.target.value)} />
                    <TextField fullWidth label="Contact" value={newTypePersonContact2} onChange={(e) => setNewTypePersonContact2(e.target.value)} />
                </DialogContent>

                <DialogActions sx={{ pr: 2 }}>
                    <Button color="error" onClick={() => setAddTypePersonDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="success" onClick={saveNewTypePerson}>Save</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Income;
