import React, { useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import weekday from "dayjs/plugin/weekday";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "../styles/customDateRangePicker.css";

dayjs.extend(weekday);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(localizedFormat);

interface Props {
    value: [Dayjs | null, Dayjs | null];
    onChange: (val: [Dayjs, Dayjs]) => void;
}

const PRESETS = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 14 days", days: 14 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 3 months", days: 90 },
    { label: "Last 6 months", days: 180 },
    { label: "Last year", days: 365 },
];

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

const weekDayShort = (i: number) => ["M", "T", "W", "T", "F", "S", "S"][i];

const DateRangeFilter: React.FC<Props> = ({ value, onChange }) => {
    const startValue = value?.[0] ?? dayjs().startOf("day");

    const [displayedMonth, setDisplayedMonth] = useState<Dayjs>(
        startValue.startOf("month")
    );

    const [selectStart, setSelectStart] = useState<Dayjs | null>(
        value?.[0] ?? null
    );
    const [selectEnd, setSelectEnd] = useState<Dayjs | null>(value?.[1] ?? null);
    const [hoverDate, setHoverDate] = useState<Dayjs | null>(null);

    const leftMonth = displayedMonth;
    const rightMonth = displayedMonth.add(1, "month");

    const startOfMonthGrid = (m: Dayjs) =>
        m.startOf("month").startOf("week").add(1, "day");

    const endOfMonthGrid = (m: Dayjs) =>
        m.endOf("month").endOf("week").add(1, "day");

    const buildMonthGrid = (m: Dayjs) => {
        const start = startOfMonthGrid(m);
        const end = endOfMonthGrid(m);
        const days: Dayjs[] = [];
        let cur = start.clone();
        while (cur.isSameOrBefore(end, "day")) {
            days.push(cur.clone());
            cur = cur.add(1, "day");
        }
        return days;
    };

    const leftGrid = useMemo(() => buildMonthGrid(leftMonth), [leftMonth]);
    const rightGrid = useMemo(() => buildMonthGrid(rightMonth), [rightMonth]);

    const inRange = (d: Dayjs) => {
        if (!selectStart || !selectEnd) {
            if (selectStart && hoverDate) {
                const a = selectStart;
                const b = hoverDate;
                return (
                    (d.isSameOrAfter(a, "day") && d.isSameOrBefore(b, "day")) ||
                    (d.isSameOrAfter(b, "day") && d.isSameOrBefore(a, "day"))
                );
            }
            return false;
        }
        return d.isSameOrAfter(selectStart, "day") && d.isSameOrBefore(selectEnd, "day");
    };

    const isStart = (d: Dayjs) => selectStart && d.isSame(selectStart, "day");
    const isEnd = (d: Dayjs) => selectEnd && d.isSame(selectEnd, "day");

    const onDayClick = (d: Dayjs) => {
        if (!selectStart && !selectEnd) {
            setSelectStart(d);
            setSelectEnd(null);
            return;
        }

        if (selectStart && !selectEnd) {
            if (d.isBefore(selectStart, "day")) {
                setSelectStart(d);
                setSelectEnd(null);
            } else {
                setSelectEnd(d);
            }
            return;
        }

        setSelectStart(d);
        setSelectEnd(null);
    };

    const onDayHover = (d: Dayjs | null) => {
        setHoverDate(d);
    };

    const prevMonth = () => setDisplayedMonth((m) => m.subtract(1, "month"));
    const nextMonth = () => setDisplayedMonth((m) => m.add(1, "month"));

    const clearRange = () => {
        setSelectStart(null);
        setSelectEnd(null);
    };

    const yearOptions = Array.from({ length: 50 }).map(
        (_, i) => dayjs().year() - 25 + i
    );

    return (
        <div className="cdrp-root">
            <div className="cdrp-panel">

                {/* LEFT PRESETS */}
                <div className="cdrp-left">
                    <div className="cdrp-left-title">Presets</div>
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            className="cdrp-preset"
                            onClick={() => {
                                const end = dayjs().endOf("day");
                                const start = dayjs().subtract(p.days - 1, "day").startOf("day");
                                setSelectStart(start);
                                setSelectEnd(end);
                                setDisplayedMonth(start.startOf("month"));
                                onChange([start, end]);
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* RIGHT CALENDARS */}
                <div className="cdrp-right">

                    {/* HEADER */}
                    <div className="cdrp-cal-header">
                        <div className="cdrp-arrow cdrp-prev" onClick={prevMonth}>
                            &lt;
                        </div>

                        {/* LEFT MONTH + YEAR */}
                        <div className="cdrp-month-ctrl">
                            <select
                                className="cdrp-select"
                                value={leftMonth.month()}
                                onChange={(e) => {
                                    const newMonth = parseInt(e.target.value);
                                    setDisplayedMonth(leftMonth.set("month", newMonth));
                                }}
                            >
                                {MONTHS.map((m, idx) => (
                                    <option key={m} value={idx}>{m}</option>
                                ))}
                            </select>

                            <select
                                className="cdrp-select"
                                value={leftMonth.year()}
                                onChange={(e) => {
                                    const newYear = parseInt(e.target.value);
                                    setDisplayedMonth(leftMonth.set("year", newYear));
                                }}
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div className="cdrp-spacer" />

                        {/* RIGHT MONTH + YEAR */}
                        <div className="cdrp-month-ctrl">
                            <select
                                className="cdrp-select"
                                value={rightMonth.month()}
                                onChange={(e) => {
                                    const newMonth = parseInt(e.target.value);
                                    const updated = rightMonth.set("month", newMonth);
                                    setDisplayedMonth(updated.subtract(1, "month"));
                                }}
                            >
                                {MONTHS.map((m, idx) => (
                                    <option key={m} value={idx}>{m}</option>
                                ))}
                            </select>

                            <select
                                className="cdrp-select"
                                value={rightMonth.year()}
                                onChange={(e) => {
                                    const newYear = parseInt(e.target.value);
                                    const updated = rightMonth.set("year", newYear);
                                    setDisplayedMonth(updated.subtract(1, "month"));
                                }}
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div className="cdrp-arrow cdrp-next" onClick={nextMonth}>
                            &gt;
                        </div>
                    </div>

                    {/* CALENDAR GRIDS */}
                    <div className="cdrp-calendars">

                        {/* LEFT GRID */}
                        <div className="cdrp-calendar">
                            <div className="cdrp-weekhead">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="cdrp-weekcell">
                                        {weekDayShort(i)}
                                    </div>
                                ))}
                            </div>

                            <div className="cdrp-grid">
                                {leftGrid.map((d) => {
                                    const disabled = d.month() !== leftMonth.month();
                                    const selected = isStart(d) || isEnd(d);
                                    const inrange = inRange(d);

                                    return (
                                        <div
                                            key={d.format("YYYY-MM-DD")}
                                            className={`cdrp-day 
                        ${disabled ? "cdrp-day--muted" : ""}
                        ${selected ? "cdrp-day--selected" : ""}
                        ${inrange ? "cdrp-day--inrange" : ""}
                      `}
                                            onClick={() => !disabled && onDayClick(d)}
                                            onMouseEnter={() => onDayHover(d)}
                                            onMouseLeave={() => onDayHover(null)}
                                        >
                                            {d.date()}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT GRID */}
                        <div className="cdrp-calendar">
                            <div className="cdrp-weekhead">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="cdrp-weekcell">
                                        {weekDayShort(i)}
                                    </div>
                                ))}
                            </div>

                            <div className="cdrp-grid">
                                {rightGrid.map((d) => {
                                    const disabled = d.month() !== rightMonth.month();
                                    const selected = isStart(d) || isEnd(d);
                                    const inrange = inRange(d);

                                    return (
                                        <div
                                            key={d.format("YYYY-MM-DD")}
                                            className={`cdrp-day 
                        ${disabled ? "cdrp-day--muted" : ""}
                        ${selected ? "cdrp-day--selected" : ""}
                        ${inrange ? "cdrp-day--inrange" : ""}
                      `}
                                            onClick={() => !disabled && onDayClick(d)}
                                            onMouseEnter={() => onDayHover(d)}
                                            onMouseLeave={() => onDayHover(null)}
                                        >
                                            {d.date()}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="cdrp-footer">
                        <button className="cdrp-btn cdrp-btn-outline" onClick={clearRange}>
                            Clear
                        </button>

                        <button
                            className="cdrp-btn cdrp-btn-apply"
                            disabled={!selectStart || !selectEnd}
                            onClick={() => {
                                if (selectStart && selectEnd) {
                                    onChange([selectStart.startOf("day"), selectEnd.endOf("day")]);
                                }
                            }}
                        >
                            OK
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DateRangeFilter;
