// ---------------------------------------------------------
// INTERNAL PAYMENTS PAGE (HEAD OFFICE ONLY)
// Only Internal Transfers:
// Cash <-> Bank <-> Capital
// ---------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Autocomplete
} from "@mui/material";

import AppTable from "../components/AppTable";
import ActionMenu from "../components/ActionMenu";
import "../styles/income.css";

const InternalPayments: React.FC = () => {
    const company = localStorage.getItem("companyName") || "";

    const [payments, setPayments] = useState<any[]>([]);
    const [assets, setAssets] = useState<string[]>([]);
    const [investors, setInvestors] = useState<string[]>([]);

    const investorList = [...new Set(investors)].map(x => ({ label: x }));

    // FORM STATES
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [date, setDate] = useState("");
    const [fromAcc, setFromAcc] = useState("");
    const [toAcc, setToAcc] = useState("");
    const [investor, setInvestor] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    // ---------------------------------------------------------
    // LOAD DATA
    // ---------------------------------------------------------
    useEffect(() => {
        if (!company) return;

        fetch(`http://127.0.0.1:5000/api/current-assets/${company}`)
            .then(r => r.json())
            .then(data => setAssets(data.map((x: any) => x.display)));

        fetch(`http://127.0.0.1:5000/api/investors/${company}`)
            .then(r => r.json())
            .then(data => setInvestors(data.map((x: any) => x.party)));

        // ⭐ Load internal payments
        fetch(`http://127.0.0.1:5000/api/internal-payments/${company}`)
            .then(r => r.json())
            .then(data => setPayments(data));
    }, []);

    // ---------------------------------------------------------
    // ACCOUNT LIST
    // ---------------------------------------------------------
    const cashAcc = assets.filter(a => /^cash/i.test(a));
    const bankAcc = assets.filter(a => /^bank/i.test(a));
    const capitalAcc = assets.filter(a => /^capital/i.test(a));

    const allAccounts = [...cashAcc, ...bankAcc, ...capitalAcc];

    // To Account should not equal From Account
    const toOptions = useMemo(() => {
        return allAccounts.filter(a => a !== fromAcc);
    }, [fromAcc, allAccounts]);

    // ---------------------------------------------------------
    // RESET FORM
    // ---------------------------------------------------------
    const resetForm = () => {
        setOpen(false);
        setEditMode(false);
        setEditingId(null);

        setDate("");
        setFromAcc("");
        setToAcc("");
        setInvestor("");
        setAmount("");
        setDescription("");
    };

    // ---------------------------------------------------------
    // SAVE INTERNAL TRANSFER
    // ---------------------------------------------------------
    const saveTransfer = () => {
        if (!date || !fromAcc || !toAcc || !amount)
            return alert("Please fill required fields.");

        const payload = {
            id: editingId || Date.now().toString(),
            company,
            date,
            from_acc: fromAcc,
            to_acc: toAcc,
            amount: Number(amount),
            investor: fromAcc.includes("Capital") ? investor : "",
            description
        };

        const url = editingId
            ? `http://127.0.0.1:5000/api/internal-payments/update/${editingId}`
            : `http://127.0.0.1:5000/api/internal-payments/add`;

        fetch(url, {
            method: editingId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(() => {
            if (editingId) {
                setPayments(prev =>
                    prev.map(x => (x.id === editingId ? payload : x))
                );
            } else {
                setPayments(prev => [...prev, payload]);
            }

            resetForm();
        });
    };

    // ---------------------------------------------------------
    // DELETE
    // ---------------------------------------------------------
    const deletePayment = (id: string) => {
        if (!window.confirm("Delete this transfer?")) return;

        fetch(`http://127.0.0.1:5000/api/internal-payments/delete/${id}`, {
            method: "DELETE"
        }).then(() => {
            setPayments(prev => prev.filter(x => x.id !== id));
        });
    };

    // ---------------------------------------------------------
    // TABLE COLUMNS
    // ---------------------------------------------------------
    const columns = [
        { field: "date", headerName: "Date", flex: 1 },
        { field: "amount", headerName: "Amount", flex: 1 },
        { field: "from_acc", headerName: "From", flex: 1 },
        { field: "to_acc", headerName: "To", flex: 1 },
        { field: "investor", headerName: "Investor", flex: 1 },
        {
            field: "actions",
            headerName: "",
            width: 2,
            render: (row: any) => (
                <ActionMenu
                    onEdit={() => {
                        setEditMode(true);
                        setEditingId(row.id);

                        setDate(row.date);
                        setFromAcc(row.from_acc);
                        setToAcc(row.to_acc);
                        setInvestor(row.investor || "");
                        setAmount(String(row.amount));
                        setDescription(row.description);

                        setOpen(true);
                    }}
                    onDelete={() => deletePayment(row.id)}
                />
            )
        }
    ];

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------
    return (
        <div className="income-page">
            <div className="page-header compact-header">
                <h1 className="page-title">Internal Payments</h1>

                <Button
                    variant="contained"
                    onClick={() => {
                        resetForm();
                        setOpen(true);
                    }}
                >
                    Add Transfer
                </Button>
            </div>

            <AppTable rows={payments} columns={columns} pageSize={25} />

            {/* FORM */}
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>
                    {editMode ? "Edit Transfer" : "New Internal Transfer"}
                </DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

                    <TextField
                        type="date"
                        label="Date"
                        InputLabelProps={{ shrink: true }}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />

                    <TextField
                        select
                        label="From Account"
                        value={fromAcc}
                        onChange={e => {
                            setFromAcc(e.target.value);
                            setToAcc("");
                        }}
                    >
                        {allAccounts.map(a => (
                            <MenuItem key={a} value={a}>{a}</MenuItem>
                        ))}
                    </TextField>

                    {/* Investor field only when from = Capital A/C */}
                    {fromAcc.includes("Capital") && (
                        <Autocomplete
                            options={investorList}
                            getOptionLabel={o => o.label}
                            value={investorList.find(x => x.label === investor) || null}
                            onChange={(_, v) => setInvestor(v?.label || "")}
                            renderInput={params => (
                                <TextField {...params} label="Investor" />
                            )}
                        />
                    )}

                    <TextField
                        select
                        label="To Account"
                        value={toAcc}
                        onChange={e => setToAcc(e.target.value)}
                    >
                        {toOptions.map(a => (
                            <MenuItem key={a} value={a}>{a}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />

                    <TextField
                        label="Description"
                        multiline
                        minRows={2}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />

                </DialogContent>

                <DialogActions>
                    <Button onClick={resetForm}>Cancel</Button>
                    <Button variant="contained" onClick={saveTransfer}>
                        {editMode ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default InternalPayments;
