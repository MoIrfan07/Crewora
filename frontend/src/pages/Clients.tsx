import React, { useState, useEffect } from "react";
import AppTable from "../components/AppTable";
import ActionMenu from "../components/ActionMenu";

import {
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import "../styles/Clients.css";

interface Client {
    id: string;
    name: string;
    contact: string;
}

const Clients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState("");

    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const navigate = useNavigate();
    const company = localStorage.getItem("companyName") || "default_company";

    const safeArray = (v: any) => (Array.isArray(v) ? v : []);

    /* ===========================================================
       LOAD CLIENT LIST
    ============================================================ */
    const loadClients = async () => {
        const res = await fetch(`http://127.0.0.1:5000/api/clients/${company}`);
        setClients(safeArray(await res.json()));
    };

    useEffect(() => {
        loadClients();
    }, []);


    /* ===========================================================
       SAVE CLIENT (ADD / UPDATE)
    ============================================================ */
    const saveClient = async () => {
        if (!name || !contact) {
            alert("All fields required!");
            return;
        }

        try {
            if (editingId) {
                // UPDATE EXISTING CLIENT
                await fetch(`http://127.0.0.1:5000/api/clients/update/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, contact }),
                });
            } else {
                // CHECK IF NAME EXISTS
                const existingNames = clients.map((c) => c.name);
                if (existingNames.includes(name)) {
                    alert("Client name already exists!");
                    return;
                }

                // ADD NEW CLIENT
                await fetch("http://127.0.0.1:5000/api/clients/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: Date.now().toString(),
                        company,
                        name,
                        contact,
                    }),
                });
            }

            // Reset and reload
            setEditingId(null);
            setName("");
            setContact("");
            setIsOpen(false);
            loadClients();

        } catch (err) {
            console.error("Save failed:", err);
            alert("Server error!");
        }
    };


    /* ===========================================================
       DELETE CLIENT
    ============================================================ */
    const deleteClient = async (id: string) => {
        if (!window.confirm("Delete this client?")) return;

        try {
            await fetch(`http://127.0.0.1:5000/api/clients/delete/${id}`, {
                method: "DELETE",
            });

            loadClients();
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Server error!");
        }
    };


    /* ===========================================================
       SEARCH FILTER
    ============================================================ */
    const filteredRows = clients.filter((c) =>
        `${c.name} ${c.contact}`.toLowerCase().includes(search.toLowerCase())
    );


    /* ===========================================================
       TABLE COLUMNS WITH ACTIONS
    ============================================================ */
    const columns = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "contact", headerName: "Contact", flex: 1 },

        {
            field: "actions",
            headerName: "",
            width: 2,
            render: (row: any) => (
                <ActionMenu
                    onView={() => navigate(`/clients/details/${row.id}`)}
                    onEdit={() => {
                        setEditingId(row.id);
                        setName(row.name);
                        setContact(row.contact);
                        setIsOpen(true);
                    }}
                    onDelete={() => deleteClient(row.id)}
                />
            ),
        },
    ];


    /* ===========================================================
       RENDER UI
    ============================================================ */
    return (
        <div className="clients-page">
            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Clients</h1>

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
                            setEditingId(null);
                            setName("");
                            setContact("");
                            setIsOpen(true);
                        }}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <AppTable rows={filteredRows} columns={columns} pageSize={25} height={520} />

            {/* ADD / EDIT POPUP */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogTitle className="popup-header">
                    {editingId ? "Edit Client" : "Add Client"}
                </DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, width: 400 }}>
                    <TextField
                        label="Client Name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <TextField
                        label="Contact Number"
                        fullWidth
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                    />
                </DialogContent>

                <DialogActions sx={{ pr: 3 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button color="success" variant="contained" onClick={saveClient}>
                        {editingId ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Clients;
