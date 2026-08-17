import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './AcademicCalendar.css';

export default function AcademicCalendar() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'academic_calendar'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(data);
        });
        return () => unsubscribe();
    }, []);

    // Group events by month dynamically
    const groupedCalendar = events.reduce((acc, item) => {
        const monthGroup = acc.find(g => g.month === item.month);
        if (monthGroup) {
            monthGroup.events.push(item);
        } else {
            acc.push({ month: item.month, events: [item] });
        }
        return acc;
    }, []);

    return (
        <div className="academic-container">
            <div className="page-header">
                <h2><Calendar size={28} /> Academic Calendar</h2>
                <p>Key academic schedules, examinations, and institutional events</p>
            </div>

            {groupedCalendar.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>No calendar events published yet.</p>
            ) : (
                <div className="calendar-grid">
                    {groupedCalendar.map((monthGroup, idx) => (
                        <div key={idx} className="month-card">
                            <h3 className="month-title">{monthGroup.month}</h3>
                            <div className="event-list">
                                {monthGroup.events.map((evt) => (
                                    <div key={evt.id} className="event-item">
                                        <div className="event-date-box">
                                            <span className="event-date">{evt.date}</span>
                                            <span className="event-day">{evt.day}</span>
                                        </div>
                                        <div className="event-details">
                                            <h4>{evt.title}</h4>
                                            <span className={`category-tag tag-${evt.category.toLowerCase()}`}>{evt.category}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}