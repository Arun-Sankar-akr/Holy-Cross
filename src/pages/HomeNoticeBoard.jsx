// src/components/Home/AnnouncementsBoard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../service/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Bell, Calendar, ChevronRight, X } from 'lucide-react';
import './HomeNoticeBoard.css';

export default function AnnouncementsBoard() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewItem, setPreviewItem] = useState(null);

    const sectionRef = useRef(null);
    const scrollRef = useRef(null);
    const isPausedRef = useRef(false);

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

    // Lock background scroll while the preview modal is open
    useEffect(() => {
        if (previewItem) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [previewItem]);

    // Gentle continuous auto-scroll through the notice list
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        let rafId;
        let lastTime = null;
        const pixelsPerSecond = 28;

        const step = (time) => {
            if (lastTime === null) lastTime = time;
            const delta = time - lastTime;
            lastTime = time;

            if (!isPausedRef.current && el.scrollHeight > el.clientHeight) {
                el.scrollTop += (pixelsPerSecond * delta) / 1000;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
                    el.scrollTop = 0;
                }
            }
            rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafId);
    }, [announcements]);

    // Once the board scrolls out of view, clear the pause so it auto-scrolls again next time it's visible
    useEffect(() => {
        const node = sectionRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    isPausedRef.current = false;
                }
            },
            { threshold: 0 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const handleNoticeClick = (item) => {
        isPausedRef.current = true;
        setPreviewItem(item);
    };

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
        <section className="announcements-section" ref={sectionRef}>
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
                    <div className="announcements-grid" ref={scrollRef}>
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
                                    <button
                                        type="button"
                                        className="read-more"
                                        onClick={() => handleNoticeClick(item)}
                                    >
                                        Official Notice <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {previewItem && (
                <div className="notice-modal-overlay" onClick={() => setPreviewItem(null)}>
                    <div
                        className="notice-modal"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="notice-modal-close"
                            onClick={() => setPreviewItem(null)}
                            aria-label="Close preview"
                        >
                            <X size={18} />
                        </button>

                        <span className="notice-modal-tag">
                            <Bell size={14} /> Official Notice
                        </span>

                        <span className="date-tag notice-modal-date">
                            <Calendar size={14} />
                            {formatDate(previewItem.createdAt)}
                        </span>

                        <p className="notice-modal-content">{previewItem.content}</p>
                    </div>
                </div>
            )}
        </section>
    );
}