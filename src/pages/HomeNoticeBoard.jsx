import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../service/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Bell, ChevronRight, X, ExternalLink, Pause, Play, AlertTriangle, CalendarDays } from 'lucide-react';
import './HomeNoticeBoard.css';

const URGENT_RE = /^\s*(?:🚨\s*)?\[EMERGENCY\/URGENT\]\s*/i;
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const toDateObj = (timestamp) => {
    if (!timestamp) return null;
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return Number.isNaN(d.getTime()) ? null : d;
};

export default function AnnouncementsBoard() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewItem, setPreviewItem] = useState(null);
    const [userPaused, setUserPaused] = useState(false);

    const sectionRef = useRef(null);
    const scrollRef = useRef(null);
    const userPausedRef = useRef(false);
    const hoverRef = useRef(false);
    const modalOpenRef = useRef(false);
    const inViewRef = useRef(true);
    const touchTimerRef = useRef(null);

    useEffect(() => { userPausedRef.current = userPaused; }, [userPaused]);
    useEffect(() => { modalOpenRef.current = Boolean(previewItem); }, [previewItem]);

    /* ---------- data ---------- */
    useEffect(() => {
        const announcementsQuery = query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            announcementsQuery,
            (snapshot) => {
                setAnnouncements(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching announcements: ', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    /* ---------- modal: lock scroll + Escape to close ---------- */
    useEffect(() => {
        if (!previewItem) return undefined;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => { if (e.key === 'Escape') setPreviewItem(null); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [previewItem]);

    /* ---------- gentle auto-scroll (pauses on hover / touch / modal / button) ---------- */
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return undefined;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        let rafId;
        let lastTime = null;
        let dwellUntil = 0;
        const pixelsPerSecond = 24;

        const step = (time) => {
            if (lastTime === null) lastTime = time;
            const delta = Math.min(time - lastTime, 64);
            lastTime = time;

            const canRun = !userPausedRef.current && !hoverRef.current && !modalOpenRef.current && inViewRef.current;
            if (canRun && el.scrollHeight > el.clientHeight + 2 && time >= dwellUntil) {
                el.scrollTop += (pixelsPerSecond * delta) / 1000;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
                    dwellUntil = time + 1600;
                    el.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
            rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafId);
    }, [announcements]);

    useEffect(() => {
        const node = sectionRef.current;
        if (!node || typeof IntersectionObserver === 'undefined') return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => { inViewRef.current = entry.isIntersecting; },
            { threshold: 0 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    useEffect(() => () => clearTimeout(touchTimerRef.current), []);

    /* ---------- helpers ---------- */
    const handleTouchStart = () => {
        clearTimeout(touchTimerRef.current);
        hoverRef.current = true;
    };
    const handleTouchEnd = () => {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = setTimeout(() => { hoverRef.current = false; }, 2500);
    };

    const formatFullDate = (timestamp) => {
        const d = toDateObj(timestamp);
        if (!d) return 'Recent';
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const dateParts = (timestamp) => {
        const d = toDateObj(timestamp);
        if (!d) return { day: '•', month: 'New', year: '' };
        return {
            day: String(d.getDate()).padStart(2, '0'),
            month: d.toLocaleDateString('en-US', { month: 'short' }),
            year: String(d.getFullYear()),
        };
    };

    const isNew = (item) => {
        const d = toDateObj(item.createdAt);
        return d ? Date.now() - d.getTime() < NEW_WINDOW_MS : false;
    };

    const isUrgent = (item) => URGENT_RE.test(item?.content || '') || /^\s*🚨/.test(item?.content || '');
    const cleanText = (item) => (item?.content || '').replace(URGENT_RE, '').replace(/^\s*🚨\s*/, '').trim();

    // Supports announcements created before the link feature was added.
    const hasNoticeLink = (item) =>
        Boolean(item?.linkUrl && item?.linkText && /^https?:\/\//i.test(item.linkUrl));

    const openItem = (item) => setPreviewItem(item);

    const onRowKey = (e, item) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openItem(item);
        }
    };

    /* ---------- render ---------- */
    return (
        <section className="nb-root" ref={sectionRef} aria-label="Notice board">
            <div className="nb-toolbar">
                <span className="nb-count">
                    <Bell size={14} />
                    {loading ? 'Loading…' : `${announcements.length} ${announcements.length === 1 ? 'circular' : 'circulars'}`}
                </span>

                {announcements.length > 3 && (
                    <button
                        type="button"
                        className="nb-pause"
                        onClick={() => setUserPaused((p) => !p)}
                        aria-pressed={userPaused}
                        aria-label={userPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
                    >
                        {userPaused ? <Play size={13} /> : <Pause size={13} />}
                        {userPaused ? 'Resume' : 'Pause'}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="nb-skeletons" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="nb-skel">
                            <span className="nb-skel-box" />
                            <span className="nb-skel-lines"><i /><i /></span>
                        </div>
                    ))}
                </div>
            ) : announcements.length === 0 ? (
                <div className="nb-empty">
                    <span className="nb-empty-ico"><Bell size={22} /></span>
                    <strong>All caught up</strong>
                    <p>No new announcements at this time. Please check back later.</p>
                </div>
            ) : (
                <div
                    className="nb-scroll"
                    ref={scrollRef}
                    onMouseEnter={() => { hoverRef.current = true; }}
                    onMouseLeave={() => { hoverRef.current = false; }}
                    onFocus={() => { hoverRef.current = true; }}
                    onBlur={() => { hoverRef.current = false; }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <ul className="nb-list">
                        {announcements.map((item) => {
                            const urgent = isUrgent(item);
                            const parts = dateParts(item.createdAt);
                            return (
                                <li key={item.id}>
                                    <div
                                        className={`nb-item ${urgent ? 'is-urgent' : ''}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openItem(item)}
                                        onKeyDown={(e) => onRowKey(e, item)}
                                    >
                                        <span className="nb-date" aria-label={formatFullDate(item.createdAt)}>
                                            {urgent ? (
                                                <AlertTriangle size={20} />
                                            ) : (
                                                <>
                                                    <b>{parts.day}</b>
                                                    <small>{parts.month}</small>
                                                </>
                                            )}
                                        </span>

                                        <div className="nb-body">
                                            <div className="nb-tags">
                                                {urgent && <span className="nb-tag urgent">Urgent</span>}
                                                {!urgent && isNew(item) && <span className="nb-tag fresh">New</span>}
                                                {urgent && <span className="nb-when">{parts.month} {parts.day}</span>}
                                            </div>
                                            <p className="nb-text">{cleanText(item)}</p>

                                            {hasNoticeLink(item) && (
                                                <a
                                                    href={item.linkUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="nb-link"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title={`Open ${item.linkText}`}
                                                >
                                                    <span>{item.linkText}</span>
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>

                                        <span className="nb-go" aria-hidden="true"><ChevronRight size={18} /></span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {previewItem && createPortal(
                <div className="nb-overlay" onClick={() => setPreviewItem(null)}>
                    <div
                        className={`nb-modal ${isUrgent(previewItem) ? 'is-urgent' : ''}`}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Official Notice"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="nb-modal-close"
                            onClick={() => setPreviewItem(null)}
                            aria-label="Close preview"
                            autoFocus
                        >
                            <X size={18} />
                        </button>

                        <div className="nb-modal-head">
                            <span className="nb-modal-ico">
                                {isUrgent(previewItem) ? <AlertTriangle size={20} /> : <Bell size={20} />}
                            </span>
                            <div>
                                <span className="nb-modal-kicker">
                                    {isUrgent(previewItem) ? 'Urgent Notice' : 'Official Notice'}
                                </span>
                                <span className="nb-modal-date">
                                    <CalendarDays size={13} />
                                    {formatFullDate(previewItem.createdAt)}
                                </span>
                            </div>
                        </div>

                        <p className="nb-modal-content">{cleanText(previewItem)}</p>

                        {hasNoticeLink(previewItem) && (
                            <a
                                href={previewItem.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="nb-modal-link"
                            >
                                <span>{previewItem.linkText}</span>
                                <ExternalLink size={16} />
                            </a>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </section>
    );
}