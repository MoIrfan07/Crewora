import React from "react";
import "./../styles/SoATable.css";

const SoAFullTable = ({ rows }: { rows: any[] }) => {

    const totalDebit = rows.reduce((sum: number, r: any) => sum + (r.debit || 0), 0);
    const totalCredit = rows.reduce((sum: number, r: any) => sum + (r.credit || 0), 0);

    // Closing balance = last row's balance
    const closingBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;

    return (
        <table className="soa-table">
            <thead className="soa-table-header">
                <tr>
                    <th>Sl. No</th>
                    <th>Date</th>
                    <th>Party/Account</th>
                    <th>Description</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                    <th>Dr/Cr</th>
                </tr>
            </thead>

            <tbody>
                {rows.map((r, index) => (
                    <tr key={r.id} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                        <td>{index + 1}</td>
                        <td>{r.date}</td>
                        <td>{r.party}</td>
                        <td style={{ fontSize: "0.9em", color: "#555" }}>
                            {r.description || "-"}
                        </td>
                        <td>{r.debit ? r.debit.toFixed(2) : ""}</td>
                        <td>{r.credit ? r.credit.toFixed(2) : ""}</td>
                        <td>{Number(r.balance).toFixed(2)}</td>
                        <td style={{
                            fontWeight: "bold",
                            color: r.drcr === "Dr" ? "#2e7d32" : "#d32f2f"
                        }}>
                            {r.drcr}
                        </td>
                    </tr>
                ))}

                {/* TOTAL ROW */}
                <tr className="summary-row">
                    <td colSpan={4} style={{ fontWeight: "bold" }}>Total</td>
                    <td style={{ fontWeight: "bold" }}>{totalDebit.toFixed(2)}</td>
                    <td style={{ fontWeight: "bold" }}>{totalCredit.toFixed(2)}</td>
                    <td colSpan={2}></td>
                </tr>

                {/* CLOSING BALANCE ROW */}
                <tr className="closing-row">
                    <td colSpan={4} style={{ fontWeight: "bold" }}>Closing Balance</td>
                    <td colSpan={2} style={{ fontWeight: "bold" }}>
                        {Number(closingBalance).toFixed(2)}
                    </td>
                    <td style={{
                        fontWeight: "bold",
                        color: closingBalance >= 0 ? "#2e7d32" : "#d32f2f"
                    }}>
                        {closingBalance >= 0 ? "Dr" : "Cr"}
                    </td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    );
};

export default SoAFullTable;