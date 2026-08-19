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

import { useNavigate } from "react-router-dom";
import "../styles/Projects.css";

interface Project {
    id: number;
    name: string;
    client: string;
    salesman: string;
    status: string;
    category: string;
}

const Projects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [search, setSearch] = useState("");

    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [client, setClient] = useState("");
    const [salesman, setSalesman] = useState("");
    const [status, setStatus] = useState("");
    const [category, setCategory] = useState("");

    const [editId, setEditId] = useState<number | null>(null);

    const [salesmenList, setSalesmenList] = useState<any[]>([]);
    const [clientsList, setClientsList] = useState<any[]>([]);

    const navigate = useNavigate();
    const company = localStorage.getItem("companyName") || "default";

    const categories = ["Construction", "Maintenance", "Supply", "Manpower", "Consulting"];
    const safeArray = (v: any) => (Array.isArray(v) ? v : []);

    /* ---------------- LOAD DATA ---------------- */
    const loadProjects = async () => {
        const res = await fetch(`http://127.0.0.1:5000/api/projects/${company}`);
        return safeArray(await res.json());
    };

    const loadSalesmen = async () => {
        const res = await fetch(`http://127.0.0.1:5000/api/salesmen/${company}`);
        return safeArray(await res.json());
    };

    const loadClients = async () => {
        const res = await fetch(`http://127.0.0.1:5000/api/clients/${company}`);
        return safeArray(await res.json());
    };

    const fetchData = async () => {
        const p = await loadProjects();
        const s = await loadSalesmen();
        const c = await loadClients();

        setProjects(p);
        setSalesmenList(s);
        setClientsList(c);
    };

    useEffect(() => {
        fetchData();
    }, []);


    /* ---------------- EDIT ---------------- */
    const handleEdit = (row: Project) => {
        setEditId(row.id);
        setName(row.name);
        setClient(row.client);
        setSalesman(row.salesman);
        setStatus(row.status);
        setCategory(row.category);
        setIsOpen(true);
    };

    /* ---------------- SAVE ---------------- */
    const saveProject = async () => {
        if (!name || !client || !salesman || !status) {
            alert("All required fields must be filled!");
            return;
        }

        if (editId) {
            await fetch(`http://127.0.0.1:5000/api/projects/update/${editId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    client,
                    salesman,
                    status,
                    category
                })
            });
        } else {
            await fetch("http://127.0.0.1:5000/api/projects/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: Date.now(),
                    company,
                    name,
                    client,
                    salesman,
                    status,
                    category
                })
            });
        }

        setIsOpen(false);
        setEditId(null);
        fetchData();
    };


    /* ---------------- DELETE ---------------- */
    const deleteProject = async (id: number) => {
        if (!window.confirm("Delete this project?")) return;

        await fetch(`http://127.0.0.1:5000/api/projects/delete/${id}`, {
            method: "DELETE"
        });

        fetchData();
    };


    /* ---------------- SEARCH ---------------- */
    const filteredRows = projects.filter((p) =>
        Object.values(p).join(" ").toLowerCase().includes(search.toLowerCase())
    );


    /* ---------------- TABLE COLUMNS ---------------- */
    const columns = [
        { field: "name", headerName: "Project Name", flex: 1 },
        { field: "client", headerName: "Client", flex: 1 },
        { field: "salesman", headerName: "Salesman", flex: 1 },
        { field: "status", headerName: "Status", flex: 1 },

        {
            field: "actions",
            headerName: "",
            width: 2,
            render: (row: any) => (
                <ActionMenu
                    onView={() => navigate(`/project/details/${row.id}`)}
                    onEdit={() => handleEdit(row)}
                    onDelete={() => deleteProject(row.id)}
                />
            )
        }
    ];


    return (
        <div className="projects-page">

            {/* HEADER */}
            <div className="page-header compact-header">
                <h1 className="page-title">Projects</h1>

                <div style={{ display: "flex", gap: 12 }}>
                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Button variant="contained" color="error" onClick={() => setIsOpen(true)}>
                        Add
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <AppTable rows={filteredRows} columns={columns} pageSize={25} height={520} />

            {/* MODAL */}
            <Dialog open={isOpen} onClose={() => { setIsOpen(false); setEditId(null); }} maxWidth={false}
                PaperProps={{
                    sx: {
                        width: "900px",
                        paddingBottom: "20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }
                }}
            >
                <DialogTitle>{editId ? "Edit Project" : "Add Project"}</DialogTitle>

                <DialogContent className="payment-dialog-grid wide-dialog">

                    <TextField
                        label="Project Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        sx={{ width: 360 }}
                    />

                    <Autocomplete
                        options={clientsList.map((c: any) => c.name)}
                        value={client}
                        onChange={(_, v) => setClient(v || "")}
                        renderInput={(params) => <TextField {...params} label="Client" />}
                        sx={{ width: 360 }}
                    />

                    <Autocomplete
                        options={salesmenList.map((s: any) => s.name)}
                        value={salesman}
                        onChange={(_, v) => setSalesman(v || "")}
                        renderInput={(params) => <TextField {...params} label="Salesman" />}
                        sx={{ width: 360 }}
                    />

                    <TextField
                        label="Status"
                        select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        sx={{ width: 360 }}
                    >
                        <MenuItem value="">Select</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Ongoing">Ongoing</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                    </TextField>

                    <TextField
                        label="Project Type (Optional)"
                        select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        sx={{ width: "100%" }}
                    >
                        <MenuItem value="">Select</MenuItem>
                        {categories.map((c, idx) => (
                            <MenuItem key={idx} value={c}>{c}</MenuItem>
                        ))}
                    </TextField>

                </DialogContent>

                <DialogActions sx={{ pr: 2 }}>
                    <Button color="error" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="success" onClick={saveProject}>
                        {editId ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default Projects;
