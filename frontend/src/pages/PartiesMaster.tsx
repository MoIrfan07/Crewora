import React, { useState, useEffect } from "react";
import AppTable from "../components/AppTable";
import ActionMenu from "../components/ActionMenu";

import {
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import "../styles/others.css";

interface OtherItem {
    id: number;
    name: string;
}

const PartiesMaster: React.FC = () => {
    const [others, setOthers] = useState<OtherItem[]>([]);
    const [search, setSearch] = useState("");

    const [isOpen, setIsOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [name, setName] = useState("");
    const [editId, setEditId] = useState<number | null>(null);

    const company = localStorage.getItem("companyName") || "default_company";
    const navigate = useNavigate();

    /* ---------------- LOAD DATA ---------------- */
    useEffect(() => {
        loadOthers();
    }, [company]);

    const loadOthers = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/others/${company}`);
            const json = await res.json();
            setOthers(Array.isArray(json) ? json : []);
        } catch (err) {
            console.error("Failed to load Parties:", err);
            setOthers([]);
        }
    };



    /* ---------------- ADD / UPDATE ---------------- */
    const saveEntry = async () => {
        if (!name.trim()) return alert("Name is required!");

        const payload = {
            company,
            type: "Party",   // backend requires this field
            name,
            contact: ""      // backend requires this field
        };

        if (editMode && editId !== null) {
            // UPDATE
            await fetch(`http://127.0.0.1:5000/api/others/update/${editId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            // ADD
            await fetch("http://127.0.0.1:5000/api/others/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: Date.now(),
                    ...payload
                })
            });
        }

        resetForm();
        loadOthers();
    };

    const resetForm = () => {
        setName("");
        setEditMode(false);
        setEditId(null);
        setIsOpen(false);
    };

    /* ---------------- DELETE ---------------- */
    const deleteOther = async (id: number) => {
        if (!window.confirm("Delete this entry?")) return;

        await fetch(`http://127.0.0.1:5000/api/others/delete/${id}`, {
            method: "DELETE"
        });

        loadOthers();
    };

    /* ---------------- EDIT ---------------- */
    const startEdit = (row: OtherItem) => {
        setEditMode(true);
        setEditId(row.id);
        setName(row.name);
        setIsOpen(true);
    };

    /* ---------------- SEARCH FILTER ---------------- */
    const filteredRows = others.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    /* ---------------- COLUMNS ---------------- */
    const columns = [
        { field: "name", headerName: "Name", flex: 1 },
        {
            field: "actions",
            headerName: "",
            width: 2,
            render: (row: any) => (
                <ActionMenu
                    onView={() => navigate(`/parties/details/${row.id}`)}
                    onEdit={() => startEdit(row)}
                    onDelete={() => deleteOther(row.id)}
                />
            )
        }
    ];

    return (
        <div className="others-page">

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Parties</h1>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            setEditMode(false);
                            setEditId(null);
                            setName("");
                            setIsOpen(true);
                        }}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <AppTable rows={filteredRows} columns={columns} pageSize={25} height={520} />

            {/* MODAL */}
            <Dialog open={isOpen} onClose={resetForm}>
                <DialogTitle className="popup-header">
                    {editMode ? "Edit Entry" : "Add Entry"}
                </DialogTitle>

                <DialogContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        width: 400
                    }}
                >
                    <TextField
                        label="Name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </DialogContent>

                <DialogActions sx={{ pr: 3 }}>
                    <Button color="error" onClick={resetForm}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="success" onClick={saveEntry}>
                        {editMode ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default PartiesMaster;
