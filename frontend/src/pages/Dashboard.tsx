import React, { useEffect, useMemo, useState } from "react";
import "./../styles/dashboard.css";

import {
    LineChart, Line,
    BarChart, Bar,
    XAxis, YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    PieChart, Pie, Cell,
    AreaChart, Area
} from "recharts";

import {
    Drawer, IconButton, Button,
    FormControl, InputLabel,
    Select, MenuItem, Checkbox,
    ListItemText, Box, Divider,
    Typography, Paper, Grid
} from "@mui/material";

import FilterListIcon from "@mui/icons-material/FilterList";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

const fmt = (v: number) => "SAR " + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Dashboard: React.FC = () => {
    const company = localStorage.getItem("companyName") || "";

    /* DATA STATES */
    const [paymentEntries, setPaymentEntries] = useState<any[]>([]);
    const [receiptEntries, setReceiptEntries] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [investors, setInvestors] = useState<any[]>([]);
    const [internalPayments, setInternalPayments] = useState<any[]>([]);
    const [currentAssets, setCurrentAssets] = useState<any[]>([]);
    const [parties, setParties] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    /* FILTERS */
    const [filter, setFilter] = useState<"all" | "this_month" | "this_year" | "custom">("all");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);

    /* LOAD ALL DATA */
    useEffect(() => {
        if (!company) return;
        setLoading(true);

        Promise.all([
            fetch(`http://127.0.0.1:5000/api/payment-entry/${company}`).then(r => r.json()),
            fetch(`http://127.0.0.1:5000/api/receipt/${company}`).then(r => r.json()),
            fetch(`http://127.0.0.1:5000/api/invoices/${company}`).then(r => r.json()),
            fetch(`http://127.0.0.1:5000/api/investors/${company}`).then(r => r.json()),
            fetch(`http://127.0.0.1:5000/api/internal-payments/${company}`).then(r => r.json()),
            fetch(`http://127.0.0.1:5000/api/current-assets/${company}`).then(r => r.json()),
            fetch(`http://127.0.0.1:5000/api/others/${company}`).then(r => r.json()),
            fetch(`http://127.0.0.1:5000/api/projects/${company}`).then(r => r.json()),
        ])
            .then(([pay, rec, inv, invest, internal, assets, part, proj]) => {
                setPaymentEntries(Array.isArray(pay) ? pay : []);
                setReceiptEntries(Array.isArray(rec) ? rec : []);
                setInvoices(Array.isArray(inv) ? inv : []);
                setInvestors(Array.isArray(invest) ? invest : []);
                setInternalPayments(Array.isArray(internal) ? internal : []);
                setCurrentAssets(Array.isArray(assets) ? assets : []);
                setParties(Array.isArray(part) ? part : []);
                setProjects(Array.isArray(proj) ? proj : []);
            })
            .catch(err => console.error("Dashboard load error:", err))
            .finally(() => setLoading(false));
    }, [company]);

    /* DATE FILTER */
    const inDateRange = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;

        const now = new Date();
        if (filter === "this_month") {
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }
        if (filter === "this_year") {
            return d.getFullYear() === now.getFullYear();
        }
        if (filter === "custom") {
            if (customFrom && d < new Date(customFrom)) return false;
            if (customTo && d > new Date(customTo + " 23:59")) return false;
        }
        return true;
    };

    /* FILTERED DATA */
    const filtered = useMemo(() => ({
        payments: paymentEntries.filter(p => inDateRange(p.date)),
        receipts: receiptEntries.filter(r => inDateRange(r.date)),
        invoices: invoices.filter(i => inDateRange(i.date)),
        investors: investors.filter(i => inDateRange(i.date)),
        internalPayments: internalPayments.filter(i => inDateRange(i.date))
    }), [paymentEntries, receiptEntries, invoices, investors, internalPayments, filter, customFrom, customTo]);

    /* CALCULATIONS */
    const metrics = useMemo(() => {
        // Total Payments (Outgoing)
        const totalPayments = filtered.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // Total Receipts (Incoming)
        const totalReceipts = filtered.receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

        // Total Invoices Issued
        const totalInvoicesAmount = filtered.invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);

        // Total Investor Capital
        const totalInvestorCapital = filtered.investors.reduce((sum, i) => sum + Number(i.amount || 0), 0);

        // Helper function to normalize account names
        const normalize = (name: string = "") => {
            const n = name.toLowerCase();
            if (n.includes("cash")) return "cash";
            if (n.includes("bank")) return "bank";
            if (n.includes("capital")) return "capital";
            return null;
        };

        // Initialize balances
        let cashBalance = 0;
        let bankBalance = 0;
        let capitalBalance = 0;

        // 1) Add investor contributions to capital
        capitalBalance += totalInvestorCapital;

        // 2) Process payments (subtract from source account)
        filtered.payments.forEach(p => {
            const amt = Number(p.amount || 0);
            const mode = normalize(p.mode);

            if (mode === "cash") cashBalance -= amt;
            if (mode === "bank") bankBalance -= amt;
            if (mode === "capital") capitalBalance -= amt;
        });

        // 3) Process receipts (add to destination account)
        filtered.receipts.forEach(r => {
            const amt = Number(r.amount || 0);
            const mode = normalize(r.mode);

            if (mode === "cash") cashBalance += amt;
            if (mode === "bank") bankBalance += amt;
            if (mode === "capital") capitalBalance += amt;
        });

        // 4) Process internal payments (transfer between accounts)
        filtered.internalPayments.forEach(ip => {
            const amt = Number(ip.amount || 0);
            const from = normalize(ip.from_acc);
            const to = normalize(ip.to_acc);

            // Deduct from source
            if (from === "cash") cashBalance -= amt;
            if (from === "bank") bankBalance -= amt;
            if (from === "capital") capitalBalance -= amt;

            // Add to destination
            if (to === "cash") cashBalance += amt;
            if (to === "bank") bankBalance += amt;
            if (to === "capital") capitalBalance += amt;
        });

        // Net Cash Flow = Remaining Capital + Cash + Bank
        const netCashFlow = capitalBalance + cashBalance + bankBalance;

        // Outstanding Invoices
        const paidInvoices = filtered.receipts.reduce((map: any, r) => {
            map[r.invoice_no] = (map[r.invoice_no] || 0) + Number(r.amount || 0);
            return map;
        }, {});

        const outstandingInvoices = filtered.invoices.filter(inv => {
            const paid = paidInvoices[inv.invoice_no] || 0;
            return paid < Number(inv.amount);
        });

        const totalOutstanding = outstandingInvoices.reduce((sum, inv) => {
            const paid = paidInvoices[inv.invoice_no] || 0;
            return sum + (Number(inv.amount) - paid);
        }, 0);

        return {
            totalPayments,
            totalReceipts,
            totalInvoicesAmount,
            totalInvestorCapital,
            cashBalance,
            bankBalance,
            capitalBalance,
            netCashFlow,
            totalOutstanding,
            outstandingInvoices
        };
    }, [filtered, currentAssets]);

    /* MONTHLY TRENDS */
    const monthlyData = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(0, i).toLocaleString("default", { month: "short" }),
            payments: 0,
            receipts: 0,
            investments: 0
        }));

        filtered.payments.forEach(p => {
            const d = new Date(p.date);
            if (!isNaN(d.getTime())) {
                months[d.getMonth()].payments += Number(p.amount || 0);
            }
        });

        filtered.receipts.forEach(r => {
            const d = new Date(r.date);
            if (!isNaN(d.getTime())) {
                months[d.getMonth()].receipts += Number(r.amount || 0);
            }
        });

        filtered.investors.forEach(i => {
            const d = new Date(i.date);
            if (!isNaN(d.getTime())) {
                months[d.getMonth()].investments += Number(i.amount || 0);
            }
        });

        return months;
    }, [filtered]);

    /* PROJECT BREAKDOWN */
    const projectData = useMemo(() => {
        const map: any = {};

        filtered.payments.forEach(p => {
            if (p.project) {
                map[p.project] = (map[p.project] || 0) + Number(p.amount || 0);
            }
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a: any, b: any) => b.value - a.value)
            .slice(0, 8);
    }, [filtered.payments]);

    /* PAYMENT MODE BREAKDOWN */
    const paymentModeData = useMemo(() => {
        const cash = filtered.payments.filter(p => p.mode === "Cash").reduce((s, p) => s + Number(p.amount || 0), 0);
        const bank = filtered.payments.filter(p => p.mode === "Bank").reduce((s, p) => s + Number(p.amount || 0), 0);

        return [
            { name: "Cash", value: cash },
            { name: "Bank", value: bank }
        ];
    }, [filtered.payments]);

    /* CAPITAL ACCOUNTS */
    const capitalBreakdown = useMemo(() => {
        const capitalAccounts = currentAssets.filter(a => a.acc_type === "Capital A/C");

        return capitalAccounts.map(acc => {
            const investorName = acc.acc_name;
            const total = filtered.investors
                .filter(i => i.party === investorName)
                .reduce((sum, i) => sum + Number(i.amount || 0), 0);

            return { name: investorName, value: total };
        });
    }, [filtered.investors, currentAssets]);

    const COLORS = ["#0ea5e9", "#6366f1", "#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#8b5cf6", "#ec4899"];

    if (loading) return <div style={{ padding: 40 }}>Loading Dashboard...</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-content-wrapper">

                {/* HEADER */}
                <div className="dashboard-header-row">
                    <h1 className="dashboard-heading">Dashboard</h1>

                    <div className="filter-controls">
                        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="filter-select">
                            <option value="all">All Time</option>
                            <option value="this_month">This Month</option>
                            <option value="this_year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {filter === "custom" && (
                            <div className="custom-range">
                                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                                <span>to</span>
                                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                            </div>
                        )}

                        <button onClick={() => { setFilter("all"); setCustomFrom(""); setCustomTo(""); }} className="filter-reset">
                            Reset
                        </button>
                    </div>
                </div>

                {/* KEY METRICS - Row 1 */}
                <div className="dashboard-grid-4 mb-6">
                    <div className="dashboard-card metric-card card-hover-wrapper">
                        <div className="metric-header">
                            <h3>Total Payments</h3>
                            <TrendingDownIcon style={{ color: "#ef4444" }} />
                        </div>

                        <p className="kpi-value" style={{ color: "#ef4444" }}>
                            {fmt(metrics.totalPayments)}
                        </p>

                        <p className="metric-subtitle">
                            {filtered.payments.length} Transactions
                        </p>

                        {/* HOVER DETAILS */}
                        <div className="card-hover-details">
                            <p><strong>Cash:</strong> {fmt(
                                filtered.payments
                                    .filter(p => p.mode === "Cash")
                                    .reduce((s, p) => s + Number(p.amount || 0), 0)
                            )}</p>

                            <p><strong>Bank:</strong> {fmt(
                                filtered.payments
                                    .filter(p => p.mode === "Bank")
                                    .reduce((s, p) => s + Number(p.amount || 0), 0)
                            )}</p>
                        </div>
                    </div>

                    <div className="dashboard-card metric-card card-hover-wrapper">
                        <div className="metric-header">
                            <h3>Total Receipts</h3>
                            <TrendingUpIcon style={{ color: "#22c55e" }} />
                        </div>

                        <p className="kpi-value" style={{ color: "#22c55e" }}>
                            {fmt(metrics.totalReceipts)}
                        </p>

                        <p className="metric-subtitle">
                            {filtered.receipts.length} Transactions
                        </p>

                        <div className="card-hover-details">
                            <p><strong>Invoices Paid:</strong> {filtered.receipts.length}</p>
                            <p><strong>Avg Receipt:</strong> {fmt(
                                filtered.receipts.length
                                    ? metrics.totalReceipts / filtered.receipts.length
                                    : 0
                            )}</p>
                        </div>
                    </div>

                    <div className="dashboard-card metric-card card-hover-wrapper">
                        <h3>Net Cash Flow</h3>

                        <p
                            className="kpi-value"
                            style={{ color: metrics.netCashFlow >= 0 ? "#22c55e" : "#ef4444" }}
                        >
                            {fmt(metrics.netCashFlow)}
                        </p>

                        {/* <p className="metric-subtitle">Capital + Cash + Bank</p> */}

                        {/* 🔍 HOVER DETAILS */}
                        <div className="card-hover-details">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span>Cash Balance</span>
                                <strong>{fmt(metrics.cashBalance)}</strong>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span>Bank Balance</span>
                                <strong>{fmt(metrics.bankBalance)}</strong>
                            </div>


                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Capital Balance</span>
                                <strong>{fmt(metrics.capitalBalance)}</strong>
                            </div>
                        </div>
                    </div>


                    <div className="dashboard-card metric-card card-hover-wrapper">
                        <h3>Investor Capital</h3>

                        <p className="kpi-value" style={{ color: "#6366f1" }}>
                            {fmt(metrics.totalInvestorCapital)}
                        </p>

                        <p className="metric-subtitle">
                            {filtered.investors.length} Investments
                        </p>

                        {/* HOVER DETAILS */}
                        <div className="card-hover-details">
                            {capitalBreakdown.length === 0 ? (
                                <p>No investments found</p>
                            ) : (
                                capitalBreakdown.map((inv: any) => (
                                    <div
                                        key={inv.name}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "13px",
                                            marginBottom: 6
                                        }}
                                    >
                                        <span>{inv.name}</span>
                                        <strong>{fmt(inv.value)}</strong>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* CASH, BANK & CAPITAL - Row 2 */}
                <div className="dashboard-grid-3 mb-6">
                    <div className="dashboard-card">
                        <h3>Cash Account</h3>
                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: 32, fontWeight: "bold", color: "#22c55e", margin: 0 }}>
                                {fmt(Math.abs(metrics.cashBalance))}
                            </p>
                            <p style={{ color: "#666", marginTop: 8 }}>
                                {metrics.cashBalance >= 0 ? "Available Balance (Dr)" : "Overdrawn (Cr)"}
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Bank Account</h3>
                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: 32, fontWeight: "bold", color: "#0ea5e9", margin: 0 }}>
                                {fmt(Math.abs(metrics.bankBalance))}
                            </p>
                            <p style={{ color: "#666", marginTop: 8 }}>
                                {metrics.bankBalance >= 0 ? "Available Balance (Dr)" : "Overdrawn (Cr)"}
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-card card-hover-wrapper">
                        <h3>Capital Account</h3>

                        {/* MAIN VALUE */}
                        <p
                            style={{
                                fontSize: 32,
                                fontWeight: "bold",
                                color: "#6366f1",
                                marginTop: 10
                            }}
                        >
                            {fmt(Math.abs(metrics.capitalBalance))}
                        </p>

                        

                        {/* 🔍 HOVER DETAILS */}
                        <div className="card-hover-details">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span>Total Capital Invested</span>
                                <strong>{fmt(metrics.totalInvestorCapital)}</strong>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span>Capital Utilised</span>
                                <strong>
                                    {fmt(metrics.totalInvestorCapital - metrics.capitalBalance)}
                                </strong>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    borderTop: "1px solid rgba(255,255,255,0.2)",
                                    paddingTop: 6,
                                    marginTop: 6
                                }}
                            >
                                <span><strong>Remaining Capital</strong></span>
                                <strong>{fmt(metrics.capitalBalance)}</strong>
                            </div>
                        </div>
                    </div>

                </div>

                {/* CHARTS ROW 1 - Monthly Trends */}
                <div className="dashboard-grid-2 mb-6">
                    <div className="chart-box">
                        <h2>Monthly Cash Flow Trends</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(v) => fmt(Number(v))} />
                                <Area type="monotone" dataKey="receipts" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="investments" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="payments" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-box">
                        <h2>Payments vs Receipts</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(v) => fmt(Number(v))} />
                                <Bar dataKey="receipts" fill="#22c55e" />
                                <Bar dataKey="payments" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* PIE CHARTS ROW */}
                <div className="dashboard-grid-3 mb-6">
                    <div className="chart-box">
                        <h2>Top Projects by Spend</h2>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Tooltip formatter={(v) => fmt(Number(v))} />
                                <Pie data={projectData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
                                    {projectData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-box">
                        <h2>Payment Methods</h2>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Tooltip formatter={(v) => fmt(Number(v))} />
                                <Pie data={paymentModeData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
                                    <Cell fill="#22c55e" />
                                    <Cell fill="#0ea5e9" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-box">
                        <h2>Capital Breakdown</h2>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Tooltip formatter={(v) => fmt(Number(v))} />
                                <Pie data={capitalBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
                                    {capitalBreakdown.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* OUTSTANDING INVOICES */}
                <div className="dashboard-grid-2 mb-6">
                    <div className="dashboard-card">
                        <h3>Outstanding Invoices</h3>
                        <p className="kpi-value" style={{ color: "#f59e0b" }}>{fmt(metrics.totalOutstanding)}</p>
                        <p className="metric-subtitle">{metrics.outstandingInvoices.length} unpaid invoices</p>

                        <div style={{ marginTop: 16 }}>
                            {metrics.outstandingInvoices.slice(0, 5).map((inv: any) => (
                                <div
                                    key={inv.id}
                                    style={{
                                        padding: "8px 12px",
                                        background: "#f9fafb",
                                        marginBottom: 8,
                                        borderRadius: 6,
                                        display: "flex",
                                        justifyContent: "space-between"
                                    }}
                                >
                                    <span>
                                        <strong>{inv.invoice_no}</strong> - {inv.project}
                                    </span>
                                    <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
                                        {fmt(inv.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Recent Activity</h3>
                        <div style={{ marginTop: 16 }}>
                            <div style={{ marginBottom: 12 }}>
                                <strong>Latest Payment:</strong>
                                {filtered.payments.length > 0 && (
                                    <p style={{ margin: "4px 0", color: "#666" }}>
                                        {fmt(filtered.payments[filtered.payments.length - 1].amount)} - {filtered.payments[filtered.payments.length - 1].project}
                                    </p>
                                )}
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <strong>Latest Receipt:</strong>
                                {filtered.receipts.length > 0 && (
                                    <p style={{ margin: "4px 0", color: "#666" }}>
                                        {fmt(filtered.receipts[filtered.receipts.length - 1].amount)} - {filtered.receipts[filtered.receipts.length - 1].invoice_no}
                                    </p>
                                )}
                            </div>

                            <div>
                                <strong>Latest Investment:</strong>
                                {filtered.investors.length > 0 && (
                                    <p style={{ margin: "4px 0", color: "#666" }}>
                                        {fmt(filtered.investors[filtered.investors.length - 1].amount)} - {filtered.investors[filtered.investors.length - 1].party}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SUMMARY STATS */}
                <div className="dashboard-grid-6 mb-6">
                    <div className="dashboard-card">
                        <h3>Total Invoices</h3>
                        <p className="kpi-value">{filtered.invoices.length}</p>
                        <p className="metric-subtitle">{fmt(metrics.totalInvoicesAmount)} value</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Active Projects</h3>
                        <p className="kpi-value">{projects.length}</p>
                        <p className="metric-subtitle">Projects tracked</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Parties</h3>
                        <p className="kpi-value">{parties.length}</p>
                        <p className="metric-subtitle">Business contacts</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Internal Transfers</h3>
                        <p className="kpi-value">{filtered.internalPayments.length}</p>
                        <p className="metric-subtitle">
                            {fmt(filtered.internalPayments.reduce((s, i) => s + Number(i.amount || 0), 0))}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;