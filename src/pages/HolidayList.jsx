import React, { useState, useEffect } from 'react';
import { Sun, Gift, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './HolidayList.css';

// Pre-defined manual Government Public Holidays list
const MANUAL_GOVT_HOLIDAYS = [
    { id: 'm-1', date: '2026-01-26', day: 'Monday', occasion: 'Republic Day', type: 'National Holiday' },
    { id: 'm-2', date: '2026-03-03', day: 'Tuesday', occasion: 'Holi', type: 'Gazetted Holiday' },
    { id: 'm-3', date: '2026-03-21', day: 'Saturday', occasion: 'Id-ul-Fitr', type: 'Gazetted Holiday' },
    { id: 'm-4', date: '2026-04-03', day: 'Friday', occasion: 'Good Friday', type: 'Gazetted Holiday' },
    { id: 'm-5', date: '2026-04-14', day: 'Tuesday', occasion: 'Ambedkar Jayanti', type: 'Government Holiday' },
    { id: 'm-6', date: '2026-05-01', day: 'Friday', occasion: 'May Day / Labor Day', type: 'Government Holiday' },
    { id: 'm-7', date: '2026-05-27', day: 'Wednesday', occasion: 'Bakrid / Id-ul-Zuha', type: 'Gazetted Holiday' },
    { id: 'm-8', date: '2026-08-15', day: 'Saturday', occasion: 'Independence Day', type: 'National Holiday' },
    { id: 'm-9', date: '2026-08-26', day: 'Wednesday', occasion: 'Milad-un-Nabi', type: 'Gazetted Holiday' },
    { id: 'm-10', date: '2026-10-02', day: 'Friday', occasion: 'Mahatma Gandhi Jayanti', type: 'National Holiday' },
    { id: 'm-11', date: '2026-10-20', day: 'Tuesday', occasion: 'Dussehra / Vijayadashami', type: 'Gazetted Holiday' },
    { id: 'm-12', date: '2026-11-08', day: 'Sunday', occasion: 'Diwali / Deepavali', type: 'Gazetted Holiday' },
    { id: 'm-13', date: '2026-11-24', day: 'Tuesday', occasion: 'Guru Nanak Jayanti', type: 'Gazetted Holiday' },
    { id: 'm-14', date: '2026-12-25', day: 'Friday', occasion: 'Christmas Day', type: 'National Holiday' }
];

export default function HolidaysList() {
    const [holidays, setHolidays] = useState(MANUAL_GOVT_HOLIDAYS);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'holidays'), (snapshot) => {
            const dbData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Combine manual local government holidays with live Firestore entries (removing duplicates)
            const combinedMap = new Map();
            [...MANUAL_GOVT_HOLIDAYS, ...dbData].forEach(item => {
                if (item.date) combinedMap.set(`${item.date}-${item.occasion}`, item);
            });
            
            setHolidays(Array.from(combinedMap.values()));
        });
        return () => unsubscribe();
    }, []);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const handleMonthChange = (e) => {
        setViewDate(new Date(year, parseInt(e.target.value), 1));
    };

    const handleYearChange = (e) => {
        setViewDate(new Date(parseInt(e.target.value), month, 1));
    };

    // Helper to format date object to YYYY-MM-DD local format
    const formatToYMD = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Match calendar day with holiday dataset
    const getHolidaysForDay = (day) => {
        const targetStr = formatToYMD(new Date(year, month, day));
        return holidays.filter(h => h.date === targetStr);
    };

    const handleDateClick = (day) => {
        const clicked = new Date(year, month, day);
        if (selectedDate && isSameDay(clicked, selectedDate)) {
            setSelectedDate(null);
        } else {
            setSelectedDate(clicked);
        }
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return (
            d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear()
        );
    };

    // Filter table content based on selection or active year/month view
    const displayedHolidays = selectedDate
        ? holidays.filter(h => h.date === formatToYMD(selectedDate))
        : holidays.filter(h => {
            if (!h.date) return false;
            const d = new Date(h.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const yearOptions = Array.from({ length: 11 }, (_, i) => 2020 + i);

    return (
        <div className="holidays-container">
            <header className="page-header">
                <h2><Sun size={26} /> List of Government Holidays</h2>
                <p>Official list of public, national, and gazetted holidays</p>
            </header>

            <div className="holidays-layout">
                {/* Compact Interactive Calendar with Year/Month Selection */}
                <div className="calendar-card compact">
                    <div className="calendar-controls">
                        <select className="select-dropdown" value={month} onChange={handleMonthChange}>
                            {monthNames.map((name, index) => (
                                <option key={name} value={index}>{name}</option>
                            ))}
                        </select>

                        <select className="select-dropdown" value={year} onChange={handleYearChange}>
                            {yearOptions.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="calendar-header">
                        <button onClick={handlePrevMonth} className="nav-btn" title="Previous Month">
                            <ChevronLeft size={16} />
                        </button>
                        <h3>{monthNames[month]} {year}</h3>
                        <button onClick={handleNextMonth} className="nav-btn" title="Next Month">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="weekdays-grid">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                            <div key={idx} className="weekday-cell">{d}</div>
                        ))}
                    </div>

                    <div className="days-grid">
                        {Array.from({ length: firstDayIndex }).map((_, i) => (
                            <div key={`empty-${i}`} className="day-cell empty"></div>
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const currentDate = new Date(year, month, dayNum);
                            const dayHolidays = getHolidaysForDay(dayNum);
                            const isToday = isSameDay(currentDate, new Date());
                            const isSelected = selectedDate && isSameDay(currentDate, selectedDate);

                            return (
                                <button
                                    key={dayNum}
                                    onClick={() => handleDateClick(dayNum)}
                                    className={`day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayHolidays.length ? 'has-holiday' : ''}`}
                                >
                                    <span className="day-number">{dayNum}</span>
                                    {dayHolidays.length > 0 && (
                                        <div className="holiday-dots">
                                            {dayHolidays.map((_, idx) => (
                                                <span key={idx} className="dot holiday-dot"></span>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Government Holidays Table View */}
                <div className="holidays-card">
                    <div className="table-header-bar">
                        <h3>
                            <CalendarIcon size={16} />
                            {selectedDate
                                ? `Holidays on ${selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                : `Holidays for ${monthNames[month]} ${year}`}
                        </h3>
                        {selectedDate && (
                            <button className="clear-btn" onClick={() => setSelectedDate(null)}>
                                View Month
                            </button>
                        )}
                    </div>

                    {displayedHolidays.length === 0 ? (
                        <p className="no-holidays">No government holidays scheduled for this period.</p>
                    ) : (
                        <table className="holidays-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Day</th>
                                    <th>Occasion</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedHolidays.map((item) => {
                                    const isRowSelected = item.date && selectedDate && isSameDay(new Date(item.date), selectedDate);
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`holiday-row ${isRowSelected ? 'row-active' : ''}`}
                                            onClick={() => item.date && setSelectedDate(new Date(item.date))}
                                        >
                                            <td className="holiday-date">{item.date}</td>
                                            <td className="holiday-day">{item.day}</td>
                                            <td className="holiday-occasion">
                                                <Gift size={15} className="holiday-icon" />
                                                {item.occasion}
                                            </td>
                                            <td>
                                                <span className={`holiday-type ${item.type?.toLowerCase().includes('national') ? 'national' : ''}`}>
                                                    {item.type || 'Government'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}