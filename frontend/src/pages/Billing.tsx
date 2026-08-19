/* --- FULL BILLING PAGE WITH ADD NEW CATEGORY + GLOBAL SEARCH --- */

import React, { useEffect, useState } from "react";
import AppTable from "../components/AppTable";

import {
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem
} from "@mui/material";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import "../styles/billing.css";

interface Bill {
    id: number;
    billNo: string;
    customer: string;
    category: string;
    amount: number;
    date: string;
}

const Billing: React.FC = () => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [billNo, setBillNo] = useState("");
    const [customer, setCustomer] = useState("");
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState("");

    /* CATEGORY LIST */
    const [categories, setCategories] = useState<string[]>([
        "Retail",
        "Wholesale",
        "Service",
        "Maintenance",
        "Other"
    ]);

    const [newCategory, setNewCategory] = useState("");
    const [addNewCategoryMode, setAddNewCategoryMode] = useState(false);

    const company = localStorage.getItem("companyName") || "default_company";
    const storageKey = `bills_${company}`;

    /* Load bills */
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) setBills(JSON.parse(saved));
    }, [storageKey]);

    /* Save bills automatically */
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(bills));
    }, [bills]);

    /* Add bill */
    const addBill = () => {
        if (!billNo || !customer || !category || !amount || !date) {
            alert("All fields required!");
            return;
        }

        const newBill: Bill = {
            id: Date.now(),
            billNo,
            customer,
            category,
            amount: Number(amount),
            date,
        };

        setBills([...bills, newBill]);
        setBillNo("");
        setCustomer("");
        setCategory("");
        setAmount("");
        setDate("");
        setShowModal(false);
    };

    /* Delete bill */
    const deleteBill = (id: number) => {
        setBills(bills.filter((b) => b.id !== id));
    };

    /* Save new category */
    const saveNewCategory = () => {
        if (!newCategory.trim()) return;
        setCategories([...categories, newCategory]);
        setCategory(newCategory);
        setNewCategory("");
        setAddNewCategoryMode(false);
    };

    /* 🔍 Search ANY FIELD */
    const filteredRows = bills.filter((b) =>
        Object.values(b)
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    /* TABLE COLUMNS */
    const columns = [
        { field: "billNo", headerName: "Bill No", flex: 1 },
        { field: "customer", headerName: "Customer", flex: 1 },
        { field: "category", headerName: "Category", flex: 1 },
        { field: "amount", headerName: "Amount", flex: 1 },
        { field: "date", headerName: "Date", flex: 1 },
        {
            field: "actions",
            headerName: "Actions",
            flex: 0.6,
            sortable: false,
            renderCell: (params: any) => (
                <div style={{ display: "flex", gap: "6px" }}>
                    <IconButton><FiEye size={18} /></IconButton>
                    <IconButton><FiEdit size={18} /></IconButton>
                    <IconButton onClick={() => deleteBill(params.row.id)}>
                        <FiTrash2 size={18} />
                    </IconButton>
                </div>
            )
        }
    ];

    return (
        <div className="billing-container">

            {/* HEADER */}
            <div className="billing-header">
                <h1 className="billing-title">Billing</h1>

                <div style={{ display: "flex", gap: "12px" }}>
                    <TextField
                        size="small"
                        placeholder="Search bills..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => setShowModal(true)}
                    >
                        Add Bill
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <AppTable
                rows={filteredRows}
                columns={columns}
                pageSize={5}
                height={520}
            />

            {/* MODAL */}
            <Dialog open={showModal} onClose={() => setShowModal(false)}>
                <DialogTitle className="popup-header">Add Bill</DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, width: 420 }}>

                    <TextField
                        label="Bill Number"
                        value={billNo}
                        onChange={(e) => setBillNo(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: Boolean(billNo) }}
                        sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                    />

                    <TextField
                        label="Customer Name"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: Boolean(customer) }}
                        sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                    />

                    {/* CATEGORY WITH ADD NEW */}
                    {!addNewCategoryMode ? (
                        <>
                            <TextField
                                label="Category"
                                select
                                fullWidth
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                InputLabelProps={{ shrink: Boolean(category) }}
                                sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                            >
                                <MenuItem value="">Select Category</MenuItem>
                                {categories.map((cat, index) => (
                                    <MenuItem key={index} value={cat}>
                                        {cat}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Button variant="outlined" onClick={() => setAddNewCategoryMode(true)}>
                                + Add New Category
                            </Button>
                        </>
                    ) : (
                        <>
                            <TextField
                                label="New Category"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: Boolean(newCategory) }}
                                sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                            />

                            <Button variant="contained" color="success" onClick={saveNewCategory}>
                                Save Category
                            </Button>
                        </>
                    )}

                    <TextField
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: Boolean(amount) }}
                        sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                    />

                    <TextField
                        label="Date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                    />
                </DialogContent>

                <DialogActions sx={{ pr: 3 }}>
                    <Button color="error" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button color="success" variant="contained" onClick={addBill}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default Billing;
