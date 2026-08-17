import React from 'react';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import './AlumniMeets.css';

export default function AlumniMeets() {
    const meetEvents = [
        {
            title: 'Annual Grand Alumni Reunion 2026',
            date: '28 Dec 2026',
            time: '10:00 AM – 4:00 PM',
            location: 'Main School Auditorium & Lawns',
            status: 'Upcoming',
            description: 'Join us for a day of nostalgia, networking, interactive panels, and musical evening.'
        },
        {
            title: 'Silver Jubilee Batch Meet (Batch of 2000)',
            date: '15 Aug 2026',
            time: '2:00 PM – 7:00 PM',
            location: 'Campus Conference Hall',
            status: 'Completed',
            description: 'Special felicitation for the 2000 batch celebrating 25 years of graduation.'
        }
    ];

    return (
        <div className="alumni-container">
            <div className="page-header">
                <h2><Users size={28} /> Alumni Meets & Events</h2>
                <p>Gatherings, reunions, and networking forums for former students</p>
            </div>

            <div className="meets-list">
                {meetEvents.map((evt, idx) => (
                    <div key={idx} className="meet-card">
                        <div className="meet-card-header">
                            <h3>{evt.title}</h3>
                            <span className={`status-tag status-${evt.status.toLowerCase()}`}>{evt.status}</span>
                        </div>

                        <div className="meet-details-grid">
                            <div><Calendar size={15} /> <strong>Date:</strong> {evt.date}</div>
                            <div><Clock size={15} /> <strong>Time:</strong> {evt.time}</div>
                            <div className="full-width"><MapPin size={15} /> <strong>Venue:</strong> {evt.location}</div>
                        </div>

                        <p className="meet-desc">{evt.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}