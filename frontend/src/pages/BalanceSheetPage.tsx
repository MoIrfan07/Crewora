// pages/BalanceSheetPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

import BalanceSheetSoATable from "../components/BalanceSheetTable";
import "../styles/BalanceSheet.css";

const MONTHS = [
    { label: "Jan", value: 1 }, { label: "Feb", value: 2 }, { label: "Mar", value: 3 },
    { label: "Apr", value: 4 }, { label: "May", value: 5 }, { label: "Jun", value: 6 },
    { label: "Jul", value: 7 }, { label: "Aug", value: 8 }, { label: "Sep", value: 9 },
    { label: "Oct", value: 10 }, { label: "Nov", value: 11 }, { label: "Dec", value: 12 }
];

const company = localStorage.getItem("companyName") || "";
console.log("COMPANY:", company);

const BalanceSheetPage: React.FC = () => {
    const [soa, setSoa] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [income, setIncome] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [internalPayments, setInternalPayments] = useState<any[]>([]);

    // NEW 💠
    const [investorEntries, setInvestorEntries] = useState<any[]>([]);
    const [capitalAccounts, setCapitalAccounts] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    // FILTERS
    const [projectFilter, setProjectFilter] = useState("");
    const [year, setYear] = useState<number | "All">("All");
    const [monthMode, setMonthMode] = useState<"single" | "multiple">("single");
    const [singleMonth, setSingleMonth] = useState<number | "">("");
    const [fromMonth, setFromMonth] = useState<number | "">("");
    const [toMonth, setToMonth] = useState<number | "">("");
    const [search, setSearch] = useState("");

    /* ---------------------------------------------
       LOAD ALL DATA
    ---------------------------------------------- */
    useEffect(() => {
        if (!company) return;
        setLoading(true);

        (async () => {
            try {
                const [
                    soaRes,
                    payRes,
                    recRes,
                    projRes,
                    invRes,
                    currAssetsRes,
                    invoiceRes
                ] = await Promise.all([
                    fetch(`http://127.0.0.1:5000/api/soa/${company}`),
                    fetch(`http://127.0.0.1:5000/api/payment-entry/${company}`),
                    fetch(`http://127.0.0.1:5000/api/receipt/${company}`),
                    fetch(`http://127.0.0.1:5000/api/projects/${company}`),

                    fetch(`http://127.0.0.1:5000/api/investors/${company}`),
                    fetch(`http://127.0.0.1:5000/api/current-assets/${company}`),

                    fetch(`http://127.0.0.1:5000/api/invoices/${company}`)
                ]);


                const soaJson = await soaRes.json().catch(() => ({}));
                setSoa(Array.isArray(soaJson.soa) ? soaJson.soa : []);
                const internalPayRes = await fetch(`http://127.0.0.1:5000/api/internal-payments/${company}`);
                setInternalPayments(await internalPayRes.json().catch(() => []));

                setPayments(await payRes.json().catch(() => []));
                setReceipts(await recRes.json().catch(() => []));


                setProjectsList(await projRes.json().catch(() => []));

                // NEW 💠
                setInvestorEntries(await invRes.json().catch(() => []));
                const ca = await currAssetsRes.json().catch(() => []);
                setCapitalAccounts(ca.filter((a: any) => a.acc_type === "Capital A/C"));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);



    /* ---------------------------------------------
       DATE FILTER LOGIC
    ---------------------------------------------- */
    const inDateWindow = (dateStr?: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (!d.getTime()) return false;

        if (year !== "All" && d.getFullYear() !== year) return false;

        if (monthMode === "single" && singleMonth !== "") {
            if (d.getMonth() + 1 !== Number(singleMonth)) return false;
        }

        if (monthMode === "multiple" && fromMonth && toMonth) {
            const m = d.getMonth() + 1;
            const min = Math.min(Number(fromMonth), Number(toMonth));
            const max = Math.max(Number(fromMonth), Number(toMonth));
            if (m < min || m > max) return false;
        }

        return true;
    };

    /* ---------------------------------------------
       FILTERED ARRAYS
    ---------------------------------------------- */
    const filteredSoa = useMemo(() =>
        soa.filter(r =>
            (!projectFilter || r.project === projectFilter) &&
            inDateWindow(r.date) &&
            (`${r.party} ${r.description}`.toLowerCase().includes(search.toLowerCase()))
        ),
        [soa, projectFilter, year, monthMode, singleMonth, fromMonth, toMonth, search]
    );

    const filteredPayments = useMemo(() =>
        payments.filter(p => inDateWindow(p.date)), [payments, year, monthMode, singleMonth, fromMonth, toMonth]);

    const filteredReceipts = useMemo(() =>
        receipts.filter(r => inDateWindow(r.date)), [receipts, year, monthMode, singleMonth, fromMonth, toMonth]);

    const filteredExpenses = useMemo(() =>
        expenses.filter(e => inDateWindow(e.date)), [expenses, year, monthMode, singleMonth, fromMonth, toMonth]);

    const filteredInvestors = useMemo(() =>
        investorEntries.filter(i => inDateWindow(i.date)), [investorEntries, year, monthMode, singleMonth, fromMonth, toMonth]);

    /* ---------------------------------------------
       FINAL BALANCE SHEET LOGIC
    ---------------------------------------------- */
    const filteredInternalPayments = useMemo(() =>
        internalPayments.filter(i => inDateWindow(i.date)),
        [internalPayments, year, monthMode, singleMonth, fromMonth, toMonth]
    );

    const grouped = useMemo(() => {
        let cashTotal = 0;
        let bankTotal = 0;
        let capitalTotal = 0;

        /* ===========================================================
           NORMALIZE ACCOUNT NAME → cash / bank / capital
        =========================================================== */
        const normalize = (name: string = "") => {
            const n = name.toLowerCase();

            if (n.includes("cash")) return "cash";
            if (n.includes("bank")) return "bank";

            // detect any investor capital account (dynamic)
            if (capitalAccounts.some(acc => n.includes(acc.acc_name.toLowerCase())))
                return "capital";

            if (n.includes("capital")) return "capital";

            return null;
        };

        /* ===========================================================
           1) INVESTOR CONTRIBUTIONS ALWAYS INCREASE CAPITAL
        =========================================================== */
        filteredInvestors.forEach(inv => {
            const amt = Number(inv.amount || 0);
            capitalTotal += amt;
        });

        /* ===========================================================
           2) SOA MERGED ENTRIES: Debit → add, Credit → subtract
        =========================================================== */
        filteredSoa.forEach(r => {
            const partyType = normalize(r.party);
            const net = Number(r.debit || 0) - Number(r.credit || 0);

            if (partyType === "cash") cashTotal += net;
            if (partyType === "bank") bankTotal += net;
            if (partyType === "capital" && r.source !== "investor") {
                capitalTotal += net;
            }
        });

        /* ===========================================================
           3) PAYMENT ENTRIES (Normal + Head Office)
        =========================================================== */

        const creditorMap: any = {};

        filteredPayments.forEach(p => {
            const amt = Number(p.amount || 0);
            if (!amt) return;

            const from = normalize(p.mode);
            const to = normalize(p.party || p.from_name || "");
            const isHeadOffice = p.project === "Head Office";

            // Deduct from FROM account
            if (from === "cash") cashTotal -= amt;
            if (from === "bank") bankTotal -= amt;
            if (from === "capital") capitalTotal -= amt;

            // Add TO account
            if (to === "cash") cashTotal += amt;
            if (to === "bank") bankTotal += amt;
            if (to === "capital") capitalTotal += amt;

            // Creditors only for NON-head-office projects
            if (!isHeadOffice && to === null) {
                const partyName =
                    p.party ||
                    p.party_name ||
                    p.from_name ||
                    p.from ||
                    p.to ||
                    p.to_acc ||
                    "Unknown";

                const key = partyName.toLowerCase();

                creditorMap[key] = (creditorMap[key] || 0) + amt;

            }
        });

        /* ===========================================================
           4) RECEIPT ENTRIES → Add to Cash/Bank
        =========================================================== */
        filteredReceipts.forEach(r => {
            const amt = Number(r.amount || 0);
            if (!amt) return;

            const mode = normalize(r.mode);

            if (mode === "cash") cashTotal += amt;
            if (mode === "bank") bankTotal += amt;
        });

        /* ===========================================================
           5) INTERNAL PAYMENTS (⭐ NEW ⭐)
           Capital <-> Cash <-> Bank transfers
        =========================================================== */
        filteredInternalPayments.forEach(ip => {
            const amt = Number(ip.amount || 0);
            if (!amt) return;

            const from = normalize(ip.from_acc);
            const to = normalize(ip.to_acc);

            // Deduct FROM
            if (from === "cash") cashTotal -= amt;
            if (from === "bank") bankTotal -= amt;
            if (from === "capital") capitalTotal -= amt;

            // Add TO
            if (to === "cash") cashTotal += amt;
            if (to === "bank") bankTotal += amt;
            if (to === "capital") capitalTotal += amt;
        });

        /* ===========================================================
           6) TAXES (unchanged)
        =========================================================== */
        const taxKeywords = ["vat", "tax", "zakat"];
        let taxTotal = 0;

        filteredExpenses.forEach(e => {
            if (taxKeywords.some(k => (e.category || "").toLowerCase().includes(k))) {
                taxTotal += Number(e.amount || 0);
            }
        });

        /* ===========================================================
           7) DEBTORS (Include Project + Invoice No)
        =========================================================== */
        const debtorMap: any = {};

        filteredReceipts
            .filter(r => r.project !== "Head Office")
            .forEach(r => {
                const project = r.project || "";
                const invoice =
                    r.invoice_no ||
                    r.inv_no ||
                    r.invoice ||
                    "";

                const key = `${project}__${invoice}`;

                debtorMap[key] = (debtorMap[key] || 0) + Number(r.amount || 0);
            });

        const sundryDebtors = Object.entries(debtorMap).map(([key, amount]) => {
            const [name, project, invoice] = key.split("__");

            return {
                name,
                project,
                invoice,
                amount
            };
        });

        const totalDebtors = sundryDebtors.reduce((s, x) => s + x.amount, 0);


        /* ===========================================================
           8) CREDITORS
        =========================================================== */
        const sundryCreditors = Object.entries(creditorMap)
            .map(([name, amount]) => ({ name, amount }));

        const totalCreditors = sundryCreditors.reduce((s, x) => s + x.amount, 0);

        /* ===========================================================
           9) CAPITAL SUMMARY (STATIC INVESTMENTS ONLY)
        =========================================================== */
        const capitalRows = capitalAccounts.map(acc => {
            const accName = acc.acc_name.toLowerCase();

            let total = 0;

            // 1) INVESTOR CONTRIBUTIONS → ALWAYS ADD
            total += filteredInvestors
                .filter(i => (i.party || "").toLowerCase() === accName)
                .reduce((sum, i) => sum + Number(i.amount || 0), 0);

            // 2) INTERNAL PAYMENTS → AFFECT CAPITAL A/C DIRECTLY
            filteredInternalPayments.forEach(ip => {
                const amt = Number(ip.amount || 0);
                if (!amt) return;

                const from = (ip.from_acc || "").toLowerCase();
                const to = (ip.to_acc || "").toLowerCase();

                // If money is taken FROM this capital account → subtract
                if (from.includes(accName)) total -= amt;

                // If money is sent TO this capital account → add
                if (to.includes(accName)) total += amt;
            });

            return {
                name: acc.acc_name,
                amount: total
            };
        });

        /* ===========================================================
           10) CALCULATE NET PROFIT
           Net Profit = Total Credit - Total Debit
           If positive: it goes on the debit side to balance
           If negative (loss): it goes on the credit side
        =========================================================== */
        const totalDebit = totalDebtors + cashTotal + bankTotal + capitalTotal;
        const totalCredit = totalCreditors + taxTotal;

        const netProfit = totalCredit - totalDebit;
        const netProfitAmount = Math.abs(netProfit);

        /* ===========================================================
           RETURN STRUCTURE
        =========================================================== */
        return {
            sections: [
                {
                    key: "debtors",
                    title: "SUNDRY DEBTORS",
                    rows: sundryDebtors.map(d => ({
                        name: `${d.name} (${d.project}) – INV: ${d.invoice}`,
                        amount: d.amount
                    })),
                    amount: totalDebtors,
                    side: "debit"
                },
                {
                    key: "creditors",
                    title: "SUNDRY CREDITORS",
                    rows: sundryCreditors.map(c => ({
                        name: c.name,
                        amount: c.amount
                    })),
                    amount: totalCreditors,
                    side: "credit"
                },
                { key: "tax", title: "DUTIES & TAXES", rows: [{ name: "Taxes", amount: taxTotal }], amount: taxTotal, side: "credit" },
                { key: "cash", title: "CASH IN HAND", rows: [{ name: "Cash A/C", amount: cashTotal }], amount: cashTotal, side: "debit" },
                { key: "bank", title: "BANK ACCOUNT", rows: [{ name: "Bank A/C", amount: bankTotal }], amount: bankTotal, side: "debit" },
                { key: "capital", title: "CAPITAL A/C", rows: capitalRows, amount: capitalTotal, side: "debit" }
            ],

            totals: {
                debit: totalDebit,
                credit: totalCredit,
                netProfit: netProfitAmount
            }
        };

    }, [
        filteredSoa,
        filteredPayments,
        filteredReceipts,
        filteredExpenses,
        filteredInvestors,
        filteredInternalPayments,
        capitalAccounts
    ]);


    if (loading) return <div style={{ padding: 20 }}>Loading…</div>;

    return (
        <div className="projectstatement-page">
            <div className="ps-header">
                <h1 className="ps-title">Balance Sheet</h1>
            </div>

            <div className="filter-controls">
                <Paper className="ps-filter-bar" elevation={2}>
                    <TextField select size="small" label="Year" value={year}
                        onChange={e => setYear(e.target.value === "All" ? "All" : Number(e.target.value))}
                        sx={{ width: 120 }}>
                        <MenuItem value="All">All</MenuItem>
                        {[2022, 2023, 2024, 2025].map(y =>
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        )}
                    </TextField>

                    <FormControl>
                        <RadioGroup row value={monthMode} onChange={e => setMonthMode(e.target.value as any)}>
                            <FormControlLabel value="single" control={<Radio size="small" />} label="Single" />
                            <FormControlLabel value="multiple" control={<Radio size="small" />} label="Multiple" />
                        </RadioGroup>
                    </FormControl>

                    {monthMode === "single" ? (
                        <TextField select size="small" label="Month" value={singleMonth}
                            onChange={e => setSingleMonth(Number(e.target.value))}
                            sx={{ width: 140 }}>
                            <MenuItem value="">All</MenuItem>
                            {MONTHS.map(m =>
                                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                            )}
                        </TextField>
                    ) : (
                        <>
                            <TextField select size="small" label="From" value={fromMonth}
                                onChange={e => setFromMonth(Number(e.target.value))}
                                sx={{ width: 100 }}>
                                <MenuItem value="">From</MenuItem>
                                {MONTHS.map(m =>
                                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                                )}
                            </TextField>

                            <TextField select size="small" label="To" value={toMonth}
                                onChange={e => setToMonth(Number(e.target.value))}
                                sx={{ width: 100 }}>
                                <MenuItem value="">To</MenuItem>
                                {MONTHS.map(m =>
                                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                                )}
                            </TextField>
                        </>
                    )}

                    <TextField select size="small" label="Project" value={projectFilter}
                        onChange={e => setProjectFilter(e.target.value)}
                        sx={{ width: 220 }}>
                        <MenuItem value="">All</MenuItem>
                        {projectsList.map((p: any) =>
                            <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
                        )}
                    </TextField>

                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        sx={{ width: 180 }}
                    />

                    <Button variant="contained" onClick={() => window.print()}>
                        PDF
                    </Button>
                </Paper>
            </div>

            <div style={{ marginTop: 12 }}>
                <BalanceSheetSoATable
                    sections={grouped.sections}
                    totals={grouped.totals}
                />
            </div>
        </div>
    );
};

export default BalanceSheetPage;