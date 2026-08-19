import React, { useState, useEffect } from "react";
import {
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem
} from "@mui/material";
import AppTable from "../components/AppTable";
import "../styles/expenses.css"; // same design style

interface Category {
    id: number;
    name: string;
    type: string; // Expense / Income / Role / Salesman / Billing
}

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");

    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [type, setType] = useState("");

    const company = localStorage.getItem("companyName") || "default";
    const storageKey = `categories_${company}`;

    /* Load categories */
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) setCategories(JSON.parse(saved));
    }, [storageKey]);

    /* Save categories */
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(categories));
    }, [categories]);

    const addCategory = () => {
        if (!name || !type) {
            alert("All fields are required!");
            return;
        }

        const newCategory: Category = {
            id: Date.now(),
            name,
            type
        };

        setCategories([...categories, newCategory]);
        setName("");
        setType("");
        setIsOpen(false);
    };

    /* Search ANY field */
    const filteredRows = categories.filter((c) =>
        Object.values(c).join(" ").toLowerCase().includes(search.toLowerCase())
    );

    /* Table Columns */
    const columns = [
        { field: "name", headerName: "Category Name", flex: 1 },
        { field: "type", headerName: "Used For", flex: 1 },
    ];

    return (
        <div className="expenses-page">

            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Categories</h1>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <TextField
                        size="small"
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Button variant="contained" color="error" onClick={() => setIsOpen(true)}>
                        Add Category
                    </Button>
                </div>
            </div>

            {/* Table */}
            <AppTable
                rows={filteredRows}
                columns={columns}
                pageSize={5}
                height={520}
            />

            {/* Modal */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogTitle className="popup-header">Add Category</DialogTitle>

                <DialogContent
                    sx={{ display: "flex", flexDirection: "column", gap: 2, width: 400 }}
                >

                    <TextField
                        label="Category Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: Boolean(name) }}
                        sx={{
                            "& .MuiInputLabel-root": { top: "10px" },
                            "& .MuiInputBase-input": { padding: "12px 14px" }
                        }}
                    />

                    <TextField
                        label="Category Type"
                        select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: Boolean(type) }}
                        sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                    >
                        <MenuItem value="">Select Type</MenuItem>
                        <MenuItem value="Expense">Expense Category</MenuItem>
                        <MenuItem value="Income">Income Category</MenuItem>
                        <MenuItem value="Role">Staff Role</MenuItem>
                        <MenuItem value="Salesman">Salesman Category</MenuItem>
                        <MenuItem value="Billing">Billing Category</MenuItem>
                    </TextField>

                </DialogContent>

                <DialogActions sx={{ pr: 3 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button color="success" variant="contained" onClick={addCategory}>
                        Save
                    </Button>
                </DialogActions>

            </Dialog>

        </div>
    );
};

export default Categories;
