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
    MenuItem,
    Autocomplete
} from "@mui/material";

import "../styles/others.css";

const accountTypes = ["Cash A/C", "Bank A/C", "Capital A/C"];

const CurrentAssets: React.FC = () => {
    const company = localStorage.getItem("companyName") || "";

    const [rows, setRows] = useState<any[]>([]);
    const [partiesList, setPartiesList] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    const [isOpen, setIsOpen] = useState(false);
    const [editRow, setEditRow] = useState<any>(null);

    const [accType, setAccType] = useState("");
    const [accName, setAccName] = useState("");

    /* Load Party Names (for Capital A/C) */
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/others/${company}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPartiesList(data.map((x: any) => x.name));
                }
            });
    }, [company]);

    /* Load Current Assets List */
    const loadRows = () => {
        fetch(`http://127.0.0.1:5000/api/current-assets/${company}`)
            .then(res => res.json())
            .then(data => setRows(Array.isArray(data) ? data : []));
    };

    useEffect(() => {
        loadRows();
    }, [company]);

    /* Start Edit */
    const startEdit = (row: any) => {
        setEditRow(row);
        setAccType(row.acc_type);
        setAccName(row.acc_name || "");
        setIsOpen(true);
    };

    /* Save */
    const saveEntry = async () => {
        if (!accType) return alert("Select Account Type");

        if (accType === "Capital A/C" && !accName)
            return alert("Select Investor Name");

        const finalName = accType === "Capital A/C" ? accName : "";
        const display =
            accType === "Capital A/C"
                ? `${accType} – ${finalName}`
                : accType;

        if (editRow) {
            await fetch(
                `http://127.0.0.1:5000/api/current-assets/update/${editRow.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        acc_type: accType,
                        acc_name: finalName,
                        display
                    })
                }
            );
        } else {
            await fetch("http://127.0.0.1:5000/api/current-assets/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: Date.now().toString(),
                    company,
                    acc_type: accType,
                    acc_name: finalName,
                    display
                })
            });
        }

        setIsOpen(false);
        setEditRow(null);
        setAccType("");
        setAccName("");
        loadRows();
    };

    /* Delete */
    const deleteEntry = async (id: string) => {
        if (!window.confirm("Delete this account?")) return;

        await fetch(`http://127.0.0.1:5000/api/current-assets/delete/${id}`, {
            method: "DELETE"
        });

        loadRows();
    };

    /* Search Filter */
    const filteredRows = rows.filter(r =>
        r.display.toLowerCase().includes(search.toLowerCase())
    );

    /* Table Columns */
    const columns = [
        { field: "display", headerName: "Account Name", flex: 1 },
        {
            field: "actions",
            headerName: "",
            width: 2,
            render: (row: any) => (
                <ActionMenu
                    onView={() => alert(row.display)}
                    onEdit={() => startEdit(row)}
                    onDelete={() => deleteEntry(row.id)}
                />
            )
        }
    ];

    return (
        <div className="others-page">

            <div className="page-header compact-header">
                <h1 className="page-title">Current Assets</h1>

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
                            setEditRow(null);
                            setAccType("");
                            setAccName("");
                            setIsOpen(true);
                        }}
                    >
                        Add
                    </Button>
                </div>
            </div>

            <AppTable rows={filteredRows} columns={columns} pageSize={25} height={520} />

            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogTitle>{editRow ? "Edit Account" : "Add Account"}</DialogTitle>

                <DialogContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        width: 420
                    }}
                >
                    <TextField
                        label="Account Type"
                        select
                        value={accType}
                        onChange={(e) => {
                            setAccType(e.target.value);
                            if (e.target.value !== "Capital A/C") setAccName("");
                        }}
                    >
                        <MenuItem value="">Select</MenuItem>
                        {accountTypes.map((type, idx) => (
                            <MenuItem key={idx} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </TextField>

                    {accType === "Capital A/C" && (
                        <Autocomplete
                            options={partiesList}
                            value={accName}
                            onChange={(_, v) => setAccName(v || "")}
                            renderInput={(params) => (
                                <TextField {...params} label="Investor Name" />
                            )}
                        />
                    )}
                </DialogContent>

                <DialogActions sx={{ pr: 3 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="success" onClick={saveEntry}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default CurrentAssets;
