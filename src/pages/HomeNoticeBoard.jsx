// src/components/Home/AnnouncementsBoard.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../service/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Bell, Calendar, ChevronRight } from 'lucide-react';
import './HomeNoticeBoard.css';

export default function AnnouncementsBoard() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query announcements sorted by newest first
        const announcementsQuery = query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            announcementsQuery,
            (snapshot) => {
                const noticeData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAnnouncements(noticeData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching announcements: ", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Recent';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <section className="announcements-section">
            <div className="announcements-container">
                <div className="announcements-header">
                    <div className="header-title">
                        <div className="bell-icon-wrapper">
                            <Bell size={22} />
                        </div>
                        <h2>Latest Announcements & Circulars</h2>
                    </div>
                    <span className="live-badge">Live Updates</span>
                </div>

                {loading ? (
                    <div className="announcements-loading">Loading announcements...</div>
                ) : announcements.length === 0 ? (
                    <div className="no-announcements">
                        <p>No new announcements at this time. Please check back later.</p>
                    </div>
                ) : (
                    <div className="announcements-grid">
                        {announcements.map((item) => (
                            <div key={item.id} className="announcement-card">
                                <div className="card-meta">
                                    <span className="date-tag">
                                        <Calendar size={14} />
                                        {formatDate(item.createdAt)}
                                    </span>
                                </div>
                                <p className="announcement-text">{item.content}</p>
                                <div className="card-footer">
                                    <span className="read-more">
                                        Official Notice <ChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}