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
    Autocomplete
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import "../styles/salesmen.css";

interface Salesman {
    id: string;
    name: string;
    iqama: string;
    mobile: string;
    nationality: string;
}

const nationalityList = [
    "India", "Pakistan", "Bangladesh", "Nepal", "Sri Lanka",
    "Philippines", "Egypt", "Sudan", "Indonesia", "Yemen",
    "Kenya", "Ethiopia", "Jordan", "Saudi Arabia", "UAE",
    "Qatar", "Turkey", "Nigeria", "Oman"
];

const Salesmen: React.FC = () => {
    const [salesmen, setSalesmen] = useState<Salesman[]>([]);
    const [search, setSearch] = useState("");

    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [iqama, setIqama] = useState("");
    const [mobile, setMobile] = useState("");
    const [nationality, setNationality] = useState("");

    const company = localStorage.getItem("companyName") || "default_company";
    const navigate = useNavigate();

    /* ---------------- LOAD SALESMEN ---------------- */
    const loadSalesmen = async () => {
        const res = await fetch(`http://127.0.0.1:5000/api/salesmen/${company}`);
        const data = await res.json();
        setSalesmen(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadSalesmen();
    }, []);


    /* ---------------- SAVE ---------------- */
    const saveSalesman = async () => {
        if (!name || !iqama || !mobile || !nationality) {
            alert("All fields required!");
            return;
        }

        if (editingId) {
            await fetch(`http://127.0.0.1:5000/api/salesmen/update/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, iqama, mobile, nationality })
            });
        } else {
            await fetch("http://127.0.0.1:5000/api/salesmen/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: String(Date.now()),
                    company,
                    name,
                    iqama,
                    mobile,
                    nationality
                })
            });
        }

        resetForm();
        loadSalesmen();
    };


    /* ---------------- DELETE ---------------- */
    const deleteSalesman = async (id: string) => {
        if (!window.confirm("Delete this Salesman?")) return;

        await fetch(`http://127.0.0.1:5000/api/salesmen/delete/${id}`, {
            method: "DELETE"
        });

        loadSalesmen();
    };


    /* ---------------- RESET FORM ---------------- */
    const resetForm = () => {
        setIsOpen(false);
        setEditingId(null);
        setName("");
        setIqama("");
        setMobile("");
        setNationality("");
    };


    /* ---------------- SEARCH ---------------- */
    const filteredRows = salesmen.filter((s) =>
        JSON.stringify(s).toLowerCase().includes(search.toLowerCase())
    );


    /* ---------------- TABLE COLUMNS ---------------- */
    const columns = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "iqama", headerName: "Iqama No.", flex: 1 },
        { field: "mobile", headerName: "Mobile No.", flex: 1 },
        { field: "nationality", headerName: "Nationality", flex: 1 },
        {
            field: "actions",
            headerName: "",
            width: 2,
            render: (row: any) => (
                <ActionMenu
                    onView={() => navigate(`/salesmen/details/${row.id}`)}
                    onEdit={() => {
                        setEditingId(row.id);
                        setName(row.name);
                        setIqama(row.iqama);
                        setMobile(row.mobile);
                        setNationality(row.nationality);
                        setIsOpen(true);
                    }}
                    onDelete={() => deleteSalesman(row.id)}
                />
            )
        }
    ];


    return (
        <div className="salesmen-page">

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Salesmen</h1>

                <div style={{ display: "flex", gap: "12px" }}>
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
                            resetForm();
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
            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogTitle>{editingId ? "Edit Salesman" : "Add Salesman"}</DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, width: 420 }}>

                    <TextField
                        label="Full Name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <TextField
                        label="Iqama No."
                        fullWidth
                        value={iqama}
                        onChange={(e) => setIqama(e.target.value)}
                    />

                    <TextField
                        label="Mobile No."
                        fullWidth
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                    />

                    <Autocomplete
                        options={nationalityList}
                        value={nationality}
                        onChange={(_, v) => setNationality(v || "")}
                        renderInput={(params) => (
                            <TextField {...params} label="Nationality" />
                        )}
                    />

                </DialogContent>

                <DialogActions sx={{ pr: 3 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>

                    <Button variant="contained" color="success" onClick={saveSalesman}>
                        {editingId ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default Salesmen;
