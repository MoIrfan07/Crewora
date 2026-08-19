import React, { useState } from "react";
import "../styles/BalanceSheet.css";
const currency = (v: any) => {
    const num = Number(v);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};


const BalanceSheetTable = ({ sections, totals }) => {

    const [openMap, setOpenMap] = useState(() =>
        sections.reduce((acc, s) => ((acc[s.key] = false), acc), {})
    );

    const toggle = (key: string) =>
        setOpenMap(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <table className="bs-table">
            <thead className="bs-table-header">
                <tr>
                    <th style={{ width: 50 }}></th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Debit</th>
                    <th>Credit</th>
                </tr>
            </thead>

            <tbody>
                {sections.map((sec, sectionIndex) => {
                    const isOpen = openMap[sec.key];

                    const mainClass = sectionIndex % 2 === 0 ? "main-even" : "main-odd";

                    return (
                        <React.Fragment key={sec.key}>

                            {/* MAIN SECTION ROW */}
                            <tr className={`bs-section-header ${mainClass}`}>
                                <td>
                                    <button className="exp-btn" onClick={() => toggle(sec.key)}>
                                        {isOpen ? "−" : "+"}
                                    </button>
                                </td>
                                <td><b>{sec.title}</b></td>
                                <td>{currency(sec.amount)}</td>
                                <td>{sec.side === "debit" ? currency(sec.amount) : ""}</td>
                                <td>{sec.side === "credit" ? currency(sec.amount) : ""}</td>
                            </tr>

                            {/* CHILD ROWS */}
                            {isOpen &&
                                (sec.rows.length > 0 ? (
                                    sec.rows.map((r, idx) => {
                                        const rowClass = idx % 2 === 0 ? "child-even" : "child-odd";
                                        return (
                                            <tr key={sec.key + idx} className={rowClass}>
                                                <td></td>
                                                <td>{r.name}</td>
                                                <td></td>
                                                <td>{sec.side === "debit" ? currency(r.amount) : ""}</td>
                                                <td>{sec.side === "credit" ? currency(r.amount) : ""}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr className="child-even">
                                        <td></td>
                                        <td>--</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                ))}
                        </React.Fragment>
                    );
                })}

                {/* GRAND TOTAL */}
                <tr className="summary-row">
                    <td colSpan={3}><b>Grand Total</b></td>
                    <td><b>{currency(totals.debit)}</b></td>
                    <td><b>{currency(totals.credit)}</b></td>
                </tr>

                {/* NET PROFIT */}
                <tr className="closing-row">
                    <td colSpan={3}><b>Net Profit</b></td>
                    <td colSpan={2}><b>{currency(totals.netProfit)}</b></td>
                </tr>
            </tbody>
        </table>
    );
};

export default BalanceSheetTable;
