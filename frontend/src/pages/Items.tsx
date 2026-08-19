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
import "../styles/expenses.css"; // SAME STYLING

interface Item {
    id: number;
    name: string;
    category: string;
    price: number;
    unit: string;
}

const Items: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [search, setSearch] = useState("");

    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [unit, setUnit] = useState("");

    const company = localStorage.getItem("companyName") || "default";
    const storageKey = `items_${company}`;

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) setItems(JSON.parse(saved));
    }, [storageKey]);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(items));
    }, [items]);

    const addItem = () => {
        if (!name || !category || !price || !unit) {
            alert("All fields are required!");
            return;
        }

        const newItem: Item = {
            id: Date.now(),
            name,
            category,
            price: Number(price),
            unit,
        };

        setItems([...items, newItem]);

        setName("");
        setCategory("");
        setPrice("");
        setUnit("");

        setIsOpen(false);
    };

    const filteredRows = items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { field: "name", headerName: "Item Name", flex: 1 },
        { field: "category", headerName: "Category", flex: 1 },
        { field: "price", headerName: "Price", flex: 1 },
        { field: "unit", headerName: "Unit", flex: 1 },
    ];

    return (
        <div className="expenses-page">

            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Items</h1>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <TextField
                        size="small"
                        placeholder="Search Items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Button variant="contained" color="error" onClick={() => setIsOpen(true)}>
                        Add Item
                    </Button>
                </div>
            </div>

            {/* Table */}
            <AppTable
                rows={filteredRows}
                columns={columns}
                pageSize={25}
                height={520}
            />

            {/* Add Item Modal */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogTitle className="popup-header">Add Item</DialogTitle>

                <DialogContent
                    sx={{ display: "flex", flexDirection: "column", gap: 2, width: 400 }}
                >

                    <TextField
                        label="Item Name"
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
                        label="Category"
                        select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: Boolean(category) }}
                        sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                    >
                        <MenuItem value="">Select Category</MenuItem>
                        <MenuItem value="Material">Material</MenuItem>
                        <MenuItem value="Product">Product</MenuItem>
                        <MenuItem value="Service">Service</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                    </TextField>

                    <TextField
                        label="Price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: Boolean(price) }}
                        sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                    />

                    <TextField
                        label="Unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: Boolean(unit) }}
                        sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                    />

                </DialogContent>

                <DialogActions sx={{ pr: 3 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button color="success" variant="contained" onClick={addItem}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default Items;
