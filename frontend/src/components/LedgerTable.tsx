import React, { useMemo } from "react";
import "./../styles/LedgerTable.css";

interface LedgerTableProps {
    credits: any[];
    debits: any[];
    creditTotal: number;
    debitTotal: number;
}

const LedgerTable: React.FC<LedgerTableProps> = ({
    credits,
    debits,
    creditTotal,
    debitTotal,
}) => {

    const ZS_PERCENT = 0.055; // 5.5% Zakat + Sponsor

    /** ----------------------------------------
     * ONLY ZAKAT EXPENSES (NO VAT)
     * ---------------------------------------- */
    const creditExpanded = useMemo(() => {
        let rows: any[] = [];

        // Add main credit rows
        rows.push(...credits.map(r => ({ ...r, type: "main" })));

        // Add Zakat & Sponsor 5.5% for each debit entry
        debits.forEach((r) => {
            const amount = Number(r.amount);

            rows.push({
                id: r.id + "-zs",
                from_name: "Zakat & Sponsor (5.5%)",
                amount: amount * ZS_PERCENT,
                type: "zakat",
            });
        });

        return rows;
    }, [credits, debits]);

    /** ----------------------------------------
     * TOTALS
     * ---------------------------------------- */
    const zakatTotal = creditExpanded
        .filter((r) => r.type === "zakat")
        .reduce((s, r) => s + r.amount, 0);

    const finalCreditTotal = creditTotal + zakatTotal;

    const profit = debitTotal - finalCreditTotal;

    return (
        <div className="ledger-container">

            {/* LEFT - RECEIVED */}
            <div className="ledger-card">
                <div className="ledger-header">
                    <h3>Received Amount</h3>
                </div>

                <div className="ledger-table-wrapper full-height">
                    <table className="ledger-table">
                        <thead>
                            <tr>
                                <th className="deb-cred-header">Debit - Details</th>
                                <th className="align-right">Amount</th>
                            </tr>
                        </thead>

                        <tbody>
                            {debits.map((r) => (
                                <tr key={r.id}>
                                    <td>
                                        <strong>
                                            {r.project}
                                            {r.invoice_no ? ` (${r.invoice_no})` : ""}
                                        </strong>
                                    </td>
                                    <td className="align-right">
                                        {Number(r.amount).toFixed(2)}
                                    </td>
                                </tr>
                            ))}

                            {/* TOTAL */}
                            <tr className="ledger-total-row">
                                <td>FINAL TOTAL</td>
                                <td className="align-right">{debitTotal.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RIGHT - PAID */}
            <div className="ledger-card">
                <div className="ledger-header">
                    <h3>Paid Amount</h3>
                </div>

                <div className="ledger-table-wrapper full-height">
                    <table className="ledger-table">
                        <thead>
                            <tr>
                                <th className="deb-cred-header">Credit - Details</th>
                                <th className="align-right">Amount</th>
                            </tr>
                        </thead>

                        <tbody>
                            {creditExpanded.map((r) => (
                                <tr key={r.id} className={r.type !== "main" ? "child-row" : ""}>
                                    <td>
                                        <strong>
                                            {r.from_name}
                                            {r.description ? ` - ${r.description}` : ""}
                                            {r.mode ? ` - ${r.mode}` : ""}
                                        </strong>
                                    </td>
                                    <td className="align-right">
                                        {Number(r.amount).toFixed(2)}
                                    </td>
                                </tr>
                            ))}


                            {/* MAIN TOTAL */}
                            <tr className="ledger-total-row">
                                <td>FINAL TOTAL</td>
                                <td className="align-right">
                                    {finalCreditTotal.toFixed(2)}
                                </td>
                            </tr>

                            {/* PROFIT */}
                            <tr className="ledger-total-row">
                                <td>PROFIT</td>
                                <td className="align-right">
                                    {profit.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default LedgerTable;
