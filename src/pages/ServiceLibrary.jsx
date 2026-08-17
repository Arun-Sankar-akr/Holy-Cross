// ServiceLibrary.jsx
import React from 'react';
import { BookOpen, Clock, Search, Layers } from 'lucide-react';
import './ServiceLibrary.css';

export default function ServiceLibrary() {
    const stats = [
        { label: 'Total Books', value: '15,000+' },
        { label: 'Digital Journals', value: '500+' },
        { label: 'Reading Capacity', value: '120 Seats' },
        { label: 'Daily Newspapers', value: '12 Titles' },
    ];

    return (
        <div className="amenity-container">
            <div className="page-header">
                <h2><BookOpen size={28} /> Campus Library</h2>
                <p>A comprehensive resource hub empowering academic research and learning</p>
            </div>

            <div className="stats-grid">
                {stats.map((item, idx) => (
                    <div key={idx} className="stat-card">
                        <h3>{item.value}</h3>
                        <p>{item.label}</p>
                    </div>
                ))}
            </div>

            <div className="amenity-card">
                <h3>Library Facilities & Guidelines</h3>
                <ul className="amenity-list">
                    <li><Clock size={18} /> <strong>Operating Hours:</strong> Monday to Saturday: 8:00 AM – 5:00 PM</li>
                    <li><Search size={18} /> <strong>OPAC Search:</strong> Fully automated digital cataloging system for quick book location</li>
                    <li><Layers size={18} /> <strong>E-Resource Lab:</strong> High-speed internet terminals reserved for research and e-books</li>
                    <li><BookOpen size={18} /> <strong>Borrowing Limit:</strong> Students can borrow up to 3 books for a duration of 14 days</li>
                </ul>
            </div>
        </div>
    );
}