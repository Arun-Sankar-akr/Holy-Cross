import React, { useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Gift,
    MapPin,
    Search,
    Sparkles,
    X,
} from 'lucide-react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './HolidayList.css';

const GOVERNMENT_HOLIDAYS_2026 = [
    { id: 'gov-01', date: '2026-01-01', occasion: "New Year's Day", type: 'Public Holiday', category: 'Government' },
    { id: 'gov-02', date: '2026-01-15', occasion: 'Pongal', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-03', date: '2026-01-16', occasion: 'Thiruvalluvar Day', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-04', date: '2026-01-17', occasion: 'Uzhavar Thirunal', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-05', date: '2026-01-26', occasion: 'Republic Day', type: 'National Holiday', category: 'Government' },
    { id: 'gov-06', date: '2026-02-01', occasion: 'Thai Poosam', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-07', date: '2026-03-19', occasion: "Telugu New Year's Day", type: 'Public Holiday', category: 'Government' },
    { id: 'gov-08', date: '2026-03-21', occasion: 'Ramzan (Id-ul-Fitr)', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-09', date: '2026-03-31', occasion: 'Mahaveer Jayanthi', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-10', date: '2026-04-01', occasion: 'Annual Closing of Accounts — Commercial & Co-operative Banks', type: 'Bank Holiday', category: 'Government' },
    { id: 'gov-11', date: '2026-04-03', occasion: 'Good Friday', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-12', date: '2026-04-14', occasion: "Tamil New Year's Day / Dr. B.R. Ambedkar's Birthday", type: 'Public Holiday', category: 'Government' },
    { id: 'gov-13', date: '2026-04-23', occasion: 'Tamil Nadu Legislative Assembly Election — Poll Day', type: 'Special Public Holiday', category: 'Government' },
    { id: 'gov-14', date: '2026-05-01', occasion: 'May Day', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-15', date: '2026-05-28', occasion: 'Bakrid (Id-ul-Zuha)', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-16', date: '2026-06-26', occasion: 'Muharram (Yaom-E-Shahadath)', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-17', date: '2026-08-15', occasion: 'Independence Day', type: 'National Holiday', category: 'Government' },
    { id: 'gov-18', date: '2026-08-26', occasion: 'Milad-un-Nabi', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-19', date: '2026-09-04', occasion: 'Krishna Jayanthi', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-20', date: '2026-09-14', occasion: 'Vinayakar Chathurthi', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-21', date: '2026-10-02', occasion: 'Gandhi Jayanthi', type: 'National Holiday', category: 'Government' },
    { id: 'gov-22', date: '2026-10-19', occasion: 'Ayutha Pooja', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-23', date: '2026-10-20', occasion: 'Vijaya Dasami', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-24', date: '2026-11-08', occasion: 'Deepavali', type: 'Public Holiday', category: 'Government' },
    { id: 'gov-25', date: '2026-12-25', occasion: 'Christmas', type: 'Public Holiday', category: 'Government' },
];

const PRIVATE_HOLIDAYS_2026 = [
    { id: 'pri-01', date: '2026-01-01', occasion: "New Year's Day", type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-02', date: '2026-01-14', occasion: 'Bhogi', type: 'Institutional Observance', category: 'Private / Institution' },
    { id: 'pri-03', date: '2026-01-15', occasion: 'Pongal', type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-04', date: '2026-01-16', occasion: 'Thiruvalluvar Day / Mattu Pongal', type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-05', date: '2026-01-17', occasion: 'Uzhavar Thirunal', type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-06', date: '2026-01-26', occasion: 'Republic Day', type: 'National Holiday', category: 'Private / Institution' },
    { id: 'pri-07', date: '2026-02-01', occasion: 'Thai Poosam', type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-08', date: '2026-03-19', occasion: "Telugu New Year's Day", type: 'Regional Observance', category: 'Private / Institution' },
    { id: 'pri-09', date: '2026-03-21', occasion: 'Ramzan (Id-ul-Fitr)', type: 'Festival Holiday', category: 'Private / Institution' },
    { id: 'pri-10', date: '2026-03-31', occasion: 'Mahaveer Jayanthi', type: 'Festival Holiday', category: 'Private / Institution' },
    { id: 'pri-11', date: '2026-04-03', occasion: 'Good Friday', type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-12', date: '2026-04-14', occasion: "Tamil New Year's Day / Ambedkar Jayanthi", type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-13', date: '2026-05-01', occasion: 'May Day / Labour Day', type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-14', date: '2026-05-28', occasion: 'Bakrid', type: 'Festival Holiday', category: 'Private / Institution' },
    { id: 'pri-15', date: '2026-06-26', occasion: 'Muharram', type: 'Festival Holiday', category: 'Private / Institution' },
    { id: 'pri-16', date: '2026-08-15', occasion: 'Independence Day', type: 'National Holiday', category: 'Private / Institution' },
    { id: 'pri-17', date: '2026-08-26', occasion: 'Milad-un-Nabi', type: 'Festival Holiday', category: 'Private / Institution' },
    { id: 'pri-18', date: '2026-09-04', occasion: 'Krishna Jayanthi', type: 'Festival Holiday', category: 'Private / Institution' },
    { id: 'pri-19', date: '2026-09-14', occasion: 'Vinayakar Chathurthi', type: 'Festival Holiday', category: 'Private / Institution' },
    { id: 'pri-20', date: '2026-10-02', occasion: 'Gandhi Jayanthi', type: 'National Holiday', category: 'Private / Institution' },
    { id: 'pri-21', date: '2026-10-19', occasion: 'Ayutha Pooja / Saraswathi Pooja', type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-22', date: '2026-10-20', occasion: 'Vijaya Dasami', type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-23', date: '2026-11-08', occasion: 'Deepavali', type: 'Common Private', category: 'Private / Institution' },
    { id: 'pri-24', date: '2026-12-25', occasion: 'Christmas Day', type: 'Common Private', category: 'Private / Institution' },
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const formatYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatDate = (value) => {
    if (!value) return '';
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const getDayName = (value) => {
    if (!value) return '';
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long' });
};

const sameDay = (a, b) => Boolean(a && b && formatYMD(a) === formatYMD(b));

export default function HolidaysList() {
    const [holidays, setHolidays] = useState([...GOVERNMENT_HOLIDAYS_2026, ...PRIVATE_HOLIDAYS_2026]);
    const [viewDate, setViewDate] = useState(new Date(2026, 0, 1));
    const [selectedDate, setSelectedDate] = useState(null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [firebaseError, setFirebaseError] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'holidays'),
            (snapshot) => {
                const firebaseData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    category: doc.data().category || 'Custom'
                }));

                const map = new Map();

                [...GOVERNMENT_HOLIDAYS_2026, ...PRIVATE_HOLIDAYS_2026, ...firebaseData]
                    .forEach((item) => {
                        if (!item.date) return;
                        const key = `${item.date}-${String(item.occasion || '').toLowerCase()}`;
                        map.set(key, {
                            ...item,
                            day: item.day || getDayName(item.date)
                        });
                    });

                setHolidays(Array.from(map.values()));
                setFirebaseError(false);
            },
            () => setFirebaseError(true)
        );

        return () => unsubscribe();
    }, []);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const filteredHolidays = useMemo(() => {
        const q = search.trim().toLowerCase();

        return holidays
            .filter((item) => {
                if (activeFilter === 'Government' && item.category !== 'Government') return false;
                if (activeFilter === 'Private' && item.category !== 'Private / Institution') return false;
                if (!q) return true;

                return [
                    item.occasion,
                    item.type,
                    item.category,
                    item.date,
                    getDayName(item.date)
                ].some((value) => String(value || '').toLowerCase().includes(q));
            })
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [holidays, activeFilter, search]);

    const visibleHolidays = useMemo(() => {
        if (selectedDate) {
            const date = formatYMD(selectedDate);
            return filteredHolidays.filter((item) => item.date === date);
        }

        return filteredHolidays.filter((item) => {
            const [y, m] = item.date.split('-').map(Number);
            return y === year && m - 1 === month;
        });
    }, [filteredHolidays, selectedDate, year, month]);

    const monthHolidays = holidays.filter((item) => {
        const [y, m] = item.date.split('-').map(Number);
        return y === year && m - 1 === month;
    });

    const governmentCount = holidays.filter((item) => item.category === 'Government').length;
    const privateCount = holidays.filter((item) => item.category === 'Private / Institution').length;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const moveMonth = (amount) => {
        setSelectedDate(null);
        setViewDate(new Date(year, month + amount, 1));
    };

    const handleDateClick = (day) => {
        const clicked = new Date(year, month, day);
        setSelectedDate((current) => (current && sameDay(current, clicked) ? null : clicked));
    };

    const resetView = () => {
        setSelectedDate(null);
        setSearch('');
        setActiveFilter('All');
    };

    const years = [2025, 2026, 2027];

    return (
        <section className="holidays-container">
            <div className="holiday-hero">
                <div className="hero-orb orb-one" />
                <div className="hero-orb orb-two" />

                <div className="hero-copy">
                    <span className="eyebrow">
                        <Sparkles size={14} /> TAMIL NADU • 2026
                    </span>
                    <h1>Tamil Nadu Holiday Calendar</h1>
                    <p>
                        Government public holidays plus a separate private / institutional
                        view — designed for schools, staff and administration.
                    </p>
                </div>

                <div className="hero-icon">
                    <CalendarDays size={34} />
                    <span>2026</span>
                </div>
            </div>

            <div className="holiday-stats">
                <div className="stat-card">
                    <div className="stat-icon government"><MapPin size={18} /></div>
                    <div>
                        <strong>{governmentCount}</strong>
                        <span>Government entries</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon private"><Gift size={18} /></div>
                    <div>
                        <strong>{privateCount}</strong>
                        <span>Private / institution</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon month"><CalendarDays size={18} /></div>
                    <div>
                        <strong>{monthHolidays.length}</strong>
                        <span>{MONTHS[month]} holidays</span>
                    </div>
                </div>
            </div>

            <div className="holiday-toolbar">
                <div className="filter-pills">
                    {[
                        ['All', 'All Holidays'],
                        ['Government', 'Government'],
                        ['Private', 'Private / Institution']
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            className={`filter-pill ${activeFilter === value ? 'active' : ''}`}
                            onClick={() => {
                                setActiveFilter(value);
                                setSelectedDate(null);
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="holiday-search">
                    <Search size={17} />
                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setSelectedDate(null);
                        }}
                        placeholder="Search holiday, festival or date..."
                        aria-label="Search holidays"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} aria-label="Clear search">
                            <X size={15} />
                        </button>
                    )}
                </div>
            </div>

            {firebaseError && (
                <div className="firebase-note">
                    <span>Offline-safe calendar</span>
                    <p>Custom Firestore holidays could not be loaded, so the built-in 2026 calendar is being shown.</p>
                </div>
            )}

            <div className="holidays-layout">
                <aside className="calendar-card">
                    <div className="calendar-top">
                        <div>
                            <span>Holiday planner</span>
                            <h2>{MONTHS[month]}</h2>
                        </div>

                        <div className="calendar-actions">
                            <button onClick={() => moveMonth(-1)} aria-label="Previous month">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => moveMonth(1)} aria-label="Next month">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="select-row">
                        <select
                            value={month}
                            onChange={(e) => {
                                setSelectedDate(null);
                                setViewDate(new Date(year, Number(e.target.value), 1));
                            }}
                        >
                            {MONTHS.map((name, index) => (
                                <option key={name} value={index}>{name}</option>
                            ))}
                        </select>

                        <select
                            value={year}
                            onChange={(e) => {
                                setSelectedDate(null);
                                setViewDate(new Date(Number(e.target.value), month, 1));
                            }}
                        >
                            {years.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="weekdays-grid">
                        {WEEKDAYS.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
                    </div>

                    <div className="days-grid">
                        {Array.from({ length: firstDayIndex }).map((_, index) => (
                            <span key={`empty-${index}`} className="day-cell empty" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, index) => {
                            const day = index + 1;
                            const date = new Date(year, month, day);
                            const dateString = formatYMD(date);
                            const dayHolidays = holidays.filter((item) => item.date === dateString);
                            const selected = sameDay(selectedDate, date);
                            const today = sameDay(new Date(), date);

                            return (
                                <button
                                    key={day}
                                    className={`day-cell ${today ? 'today' : ''} ${selected ? 'selected' : ''} ${dayHolidays.length ? 'has-holiday' : ''}`}
                                    onClick={() => handleDateClick(day)}
                                    title={dayHolidays.map((item) => item.occasion).join(' • ')}
                                >
                                    <span>{day}</span>
                                    {dayHolidays.length > 0 && (
                                        <i className="day-dot-wrap">
                                            {dayHolidays.slice(0, 3).map((item) => (
                                                <b
                                                    key={item.id}
                                                    className={item.category === 'Government' ? 'gov-dot' : 'private-dot'}
                                                />
                                            ))}
                                        </i>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="calendar-legend">
                        <span><i className="gov-dot" /> Government</span>
                        <span><i className="private-dot" /> Private / Institution</span>
                    </div>
                </aside>

                <main className="holidays-card">
                    <div className="list-head">
                        <div>
                            <span className="list-kicker">
                                {selectedDate ? 'Selected date' : `${MONTHS[month]} ${year}`}
                            </span>
                            <h2>
                                {selectedDate
                                    ? formatDate(formatYMD(selectedDate))
                                    : `${visibleHolidays.length} holiday${visibleHolidays.length === 1 ? '' : 's'}`}
                            </h2>
                        </div>

                        {selectedDate && (
                            <button className="clear-selection" onClick={() => setSelectedDate(null)}>
                                View month <X size={15} />
                            </button>
                        )}
                    </div>

                    <div className="holiday-list">
                        {visibleHolidays.length === 0 ? (
                            <div className="empty-state">
                                <CalendarDays size={30} />
                                <h3>No holidays found</h3>
                                <p>Try another month, category or search term.</p>
                                <button onClick={resetView}>Reset filters</button>
                            </div>
                        ) : (
                            visibleHolidays.map((item) => {
                                const isGovernment = item.category === 'Government';

                                return (
                                    <button
                                        className="holiday-item"
                                        key={`${item.id}-${item.date}`}
                                        onClick={() => {
                                            const [y, m, d] = item.date.split('-').map(Number);
                                            setViewDate(new Date(y, m - 1, 1));
                                            setSelectedDate(new Date(y, m - 1, d));
                                        }}
                                    >
                                        <div className={`date-tile ${isGovernment ? 'gov' : 'private'}`}>
                                            <strong>{item.date.slice(-2)}</strong>
                                            <span>{MONTHS[Number(item.date.slice(5, 7)) - 1].slice(0, 3)}</span>
                                        </div>

                                        <div className="holiday-info">
                                            <div className="holiday-name-row">
                                                <h3>{item.occasion}</h3>
                                                <span className={`category-badge ${isGovernment ? 'government' : 'private'}`}>
                                                    {isGovernment ? 'Government' : 'Private / Institution'}
                                                </span>
                                            </div>
                                            <p>
                                                {item.day || getDayName(item.date)}
                                                <span>•</span>
                                                {item.type || 'Holiday'}
                                            </p>
                                        </div>

                                        <ChevronRight className="item-arrow" size={18} />
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="holiday-disclaimer">
                        <div className="disclaimer-icon"><Sparkles size={16} /></div>
                        <div>
                            <strong>About private holidays</strong>
                            <p>
                                Private schools and companies do not have one identical holiday
                                calendar. Their festival / vacation days can differ by institution
                                and applicable employment rules. This section is therefore labelled
                                “Private / Institution” rather than presented as a universal legal list.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </section>
    );
}