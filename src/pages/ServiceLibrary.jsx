import React from 'react';
import { BookOpen, Clock, Search, Layers, LibraryBig } from 'lucide-react';
import './ServiceLibrary.css';

import libraryHero from '../assets/bg5.png';
import libraryShelves from '../assets/library.png';
import libraryReading from '../assets/library1.png';

export default function ServiceLibrary() {
    const stats = [
        { label: 'Total Books', value: '15,000+' },
        { label: 'Digital Journals', value: '500+' },
        { label: 'Reading Capacity', value: '120 Seats' },
        { label: 'Daily Newspapers', value: '12 Titles' },
    ];

    const gallery = [
        { img: libraryShelves, caption: 'Book Stacks' },
        { img: libraryReading, caption: 'Reading Hall' },
    ];

    return (
        <div className="library-page">
            <section className="library-hero" style={{ backgroundImage: `url(${libraryHero})` }}>
                <div className="library-hero-content">
                    <div className="library-eyebrow"><LibraryBig size={14} /> Knowledge Centre</div>
                    <h2><BookOpen size={34} /> Campus Library</h2>
                    <p>A comprehensive resource hub empowering academic research and learning.</p>
                </div>
            </section>

            <section className="library-stats">
                {stats.map((item, idx) => (
                    <article key={idx} className="library-stat">
                        <h3>{item.value}</h3>
                        <p>{item.label}</p>
                    </article>
                ))}
            </section>

            <section className="library-gallery">
                {gallery.map((item, idx) => (
                    <div key={idx} className="library-gallery-item">
                        <img src={item.img} alt={item.caption} />
                        <span>{item.caption}</span>
                    </div>
                ))}
            </section>

            <section className="library-info">
                <div className="library-info-title">
                    <div className="library-info-icon"><BookOpen size={21} /></div>
                    <h3>Library Facilities & Guidelines</h3>
                </div>
                <ul className="library-list">
                    <li><Clock size={19} /><div><strong>Operating Hours:</strong> Monday to Saturday: 8:00 AM – 5:00 PM</div></li>
                    <li><Search size={19} /><div><strong>OPAC Search:</strong> Fully automated digital cataloging system for quick book location</div></li>
                    <li><Layers size={19} /><div><strong>E-Resource Lab:</strong> High-speed internet terminals reserved for research and e-books</div></li>
                    <li><BookOpen size={19} /><div><strong>Borrowing Limit:</strong> Students can borrow up to 3 books for a duration of 14 days</div></li>
                </ul>
            </section>
        </div>
    );
}