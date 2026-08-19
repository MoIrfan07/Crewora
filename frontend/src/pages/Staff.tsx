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

interface Staff {
    id: number;
    name: string;
    address: string;
    contact: string;
    role: string;
}

const StaffPage: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [search, setSearch] = useState("");

    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [contact, setContact] = useState("");
    const [role, setRole] = useState("");

    const company = localStorage.getItem("companyName") || "default";
    const storageKey = `staff_${company}`;

    // Default Roles
    const [roles, setRoles] = useState<string[]>([
        "Supervisor",
        "Manager",
        "Field Worker",
        "Support Staff"
    ]);

    const [newRole, setNewRole] = useState("");
    const [addNewRoleMode, setAddNewRoleMode] = useState(false);

    /* LOAD STAFF */
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) setStaff(JSON.parse(saved));
    }, [storageKey]);

    /* SAVE STAFF */
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(staff));
    }, [staff]);

    const addStaff = () => {
        if (!name || !address || !contact || !role) {
            alert("All fields are required!");
            return;
        }

        const entry: Staff = {
            id: Date.now(),
            name,
            address,
            contact,
            role,
        };

        setStaff([...staff, entry]);
        setName("");
        setAddress("");
        setContact("");
        setRole("");
        setIsOpen(false);
    };

    const saveNewRole = () => {
        if (!newRole.trim()) return;
        setRoles([...roles, newRole]);
        setRole(newRole);
        setNewRole("");
        setAddNewRoleMode(false);
    };

    /* SEARCH ANY FIELD */
    const filteredRows = staff.filter((s) =>
        Object.values(s)
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    /* TABLE COLUMNS */
    const columns = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "address", headerName: "Address", flex: 1 },
        { field: "contact", headerName: "Contact", flex: 1 },
        { field: "role", headerName: "Role", flex: 1 }
    ];

    return (
        <div className="expenses-page">

            {/* HEADER */}
            <div className="page-header">
                <h1 className="page-title">Staff</h1>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <TextField
                        size="small"
                        placeholder="Search Staff..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Button variant="contained" color="error" onClick={() => setIsOpen(true)}>
                        Add Staff
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <AppTable
                rows={filteredRows}
                columns={columns}
                pageSize={25}
                height={520}
            />

            {/* MODAL */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogTitle className="popup-header">Add Staff</DialogTitle>

                <DialogContent
                    sx={{ display: "flex", flexDirection: "column", gap: 2, width: 400 }}
                >

                    <TextField
                        label="Full Name"
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
                        label="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: Boolean(address) }}
                        sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                    />

                    <TextField
                        label="Contact Number"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: Boolean(contact) }}
                        sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                    />

                    {/* ROLE SELECTION */}
                    {!addNewRoleMode ? (
                        <>
                            <TextField
                                label="Role"
                                select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: Boolean(role) }}
                                sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                            >
                                <MenuItem value="">Select Role</MenuItem>
                                {roles.map((r, index) => (
                                    <MenuItem key={index} value={r}>{r}</MenuItem>
                                ))}
                            </TextField>

                            <Button variant="outlined" onClick={() => setAddNewRoleMode(true)}>
                                + Add New Role
                            </Button>
                        </>
                    ) : (
                        <>
                            <TextField
                                label="New Role"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: Boolean(newRole) }}
                                sx={{ "& .MuiInputLabel-root": { top: "10px" } }}
                            />

                            <Button variant="contained" color="success" onClick={saveNewRole}>
                                Save Role
                            </Button>
                        </>
                    )}

                </DialogContent>

                <DialogActions sx={{ pr: 3 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button color="success" variant="contained" onClick={addStaff}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default StaffPage;
