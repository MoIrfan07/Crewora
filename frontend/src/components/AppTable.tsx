import React, { useState, useMemo } from "react";
import "../styles/AppTable.css";

interface Column {
    field: string;
    headerName: string;
    width?: number;
    render?: (row: any) => React.ReactNode;
}

interface AppTableProps {
    rows: any[];
    columns: Column[];
    pageSize?: number;
}

const AppTable: React.FC<AppTableProps> = ({
    rows,
    columns,
    pageSize = 25,
}) => {

    const [page, setPage] = useState(0);
    const [sortField, setSortField] = useState("");
    const [sortAsc, setSortAsc] = useState(true);

    // Sorting logic
    const sortedRows = useMemo(() => {
        if (!sortField) return rows;

        return [...rows].sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });
    }, [rows, sortField, sortAsc]);

    // Pagination logic
    const paginatedRows = useMemo(() => {
        const start = page * pageSize;
        return sortedRows.slice(start, start + pageSize);
    }, [sortedRows, page, pageSize]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    };

    return (
        <div className="table-wrapper">

            <table className="app-table">
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th
                                key={col.field}
                                style={{ width: col.width || 160 }}
                                onClick={() => handleSort(col.field)}
                            >
                                {col.headerName}
                                {sortField === col.field && (sortAsc ? " ▲" : " ▼")}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {paginatedRows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "even-row" : "odd-row"}>
                            {columns.map(col => (
                                <td key={col.field}>
                                    {col.render ? col.render(row) : (row[col.field] ?? "")}

                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="pagination">
                <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                >
                    Prev
                </button>

                <span>Page {page + 1}</span>

                <button
                    disabled={(page + 1) * pageSize >= rows.length}
                    onClick={() => setPage(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default AppTable;
