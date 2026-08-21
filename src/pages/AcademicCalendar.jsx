import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './AcademicCalendar.css';

export default function AcademicCalendar() {
    const [events, setEvents] = useState([]);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'academic_calendar'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(data);
        });
        return () => unsubscribe();
    }, []);

    // Filter events by selected category
    const filteredEvents = events.filter(evt => {
        if (selectedCategory === 'ALL') return true;
        return evt.category?.toUpperCase() === selectedCategory;
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

    // Get events matching a specific calendar day
    const getEventsForDay = (day) => {
        return filteredEvents.filter(evt => {
            if (!evt.date) return false;
            const evtDate = new Date(evt.date);
            return (
                evtDate.getDate() === day &&
                evtDate.getMonth() === month &&
                evtDate.getFullYear() === year
            );
        });
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(year, month, day);
        setSelectedDate(clickedDate);
    };

    const isSameDay = (d1, d2) => {
        return (
            d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear()
        );
    };

    const categories = ['ALL', 'EXAM', 'EVENT', 'MEETING', 'GENERAL'];

    return (
        <div className="academic-container">
            <header className="page-header">
                <h2><CalendarIcon size={26} /> Academic Calendar</h2>
                <p>Synchronized academic schedules and events</p>
            </header>

            {/* Filter Bar */}
            <div className="filter-bar">
                <span className="filter-label"><Filter size={14} /> Filter:</span>
                <div className="filter-pills">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="calendar-layout">
                {/* Compact Interactive Visual Calendar View */}
                <div className="calendar-view compact">
                    <div className="calendar-header">
                        <button onClick={handlePrevMonth} className="nav-btn"><ChevronLeft size={16} /></button>
                        <h3>{viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</h3>
                        <button onClick={handleNextMonth} className="nav-btn"><ChevronRight size={16} /></button>
                    </div>

                    <div className="weekdays-grid">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="weekday-cell">{d}</div>
                        ))}
                    </div>

                    <div className="days-grid">
                        {Array.from({ length: firstDayIndex }).map((_, i) => (
                            <div key={`empty-${i}`} className="day-cell empty"></div>
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const currentDate = new Date(year, month, dayNum);
                            const dayEvents = getEventsForDay(dayNum);
                            const isToday = isSameDay(currentDate, new Date());
                            const isSelected = isSameDay(currentDate, selectedDate);

                            return (
                                <button
                                    key={dayNum}
                                    onClick={() => handleDateClick(dayNum)}
                                    className={`day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayEvents.length ? 'has-events' : ''}`}
                                >
                                    <span className="day-number">{dayNum}</span>
                                    {dayEvents.length > 0 && (
                                        <div className="event-dots">
                                            {dayEvents.slice(0, 3).map((evt, idx) => (
                                                <span key={idx} className={`dot tag-${evt.category?.toLowerCase()}`}></span>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Event Schedule Sidebar */}
                <div className="events-sidebar">
                    <h3 className="sidebar-title">
                        Events for {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <div className="event-list">
                        {filteredEvents.length === 0 ? (
                            <p className="no-events">No scheduled events found.</p>
                        ) : (
                            filteredEvents.map((evt) => (
                                <div key={evt.id} className="event-card">
                                    <div className="event-date-badge">
                                        <span className="event-date">{evt.date ? new Date(evt.date).getDate() : evt.day}</span>
                                        <span className="event-month">{evt.month || evt.day}</span>
                                    </div>
                                    <div className="event-details">
                                        <h4>{evt.title}</h4>
                                        <span className={`category-tag tag-${evt.category?.toLowerCase()}`}>
                                            {evt.category}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}