import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
    CalendarDays, Clock, BookOpen, Inbox, ArrowLeft, Download,
    GraduationCap, ChevronRight, Sparkles
} from 'lucide-react';
import './Examtimetable.css';

export default function ExamTimetableViewer() {
    const [timetables, setTimetables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState('select'); // 'select' | 'view'
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedExam, setSelectedExam] = useState('all');

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, 'exam_timetables'),
            snap => {
                setTimetables(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
            },
            err => {
                console.error('Error loading exam timetables:', err);
                setLoading(false);
            }
        );
        return () => unsub();
    }, []);

    const uniqueClasses = useMemo(
        () => Array.from(new Set(timetables.map(t => t.className).filter(Boolean))).sort(),
        [timetables]
    );

    const classSummaries = useMemo(() => {
        return uniqueClasses.map(cls => {
            const items = timetables.filter(t => t.className === cls);
            const dates = items.map(t => t.examDate).filter(Boolean).sort();
            const examNames = Array.from(new Set(items.map(t => t.examName).filter(Boolean)));
            return {
                className: cls,
                subjectCount: items.length,
                examCount: examNames.length,
                nextDate: dates[0] || null,
            };
        });
    }, [timetables, uniqueClasses]);

    const examNamesForClass = useMemo(
        () =>
            Array.from(
                new Set(
                    timetables
                        .filter(t => t.className === selectedClass)
                        .map(t => t.examName)
                        .filter(Boolean)
                )
            ),
        [timetables, selectedClass]
    );

    const classSchedule = useMemo(() => {
        return timetables
            .filter(t => t.className === selectedClass)
            .filter(t => selectedExam === 'all' || t.examName === selectedExam)
            .sort((a, b) => (a.examDate || '').localeCompare(b.examDate || ''));
    }, [timetables, selectedClass, selectedExam]);

    const formatDate = (dateStr, opts) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return isNaN(d)
            ? dateStr
            : d.toLocaleDateString('en-GB', opts || { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const openClass = cls => {
        setSelectedClass(cls);
        setSelectedExam('all');
        setStep('view');
    };

    const goBack = () => {
        setStep('select');
        setSelectedExam('all');
    };

    const handleDownload = () => {
        const rows = classSchedule
            .map(
                (item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${formatDate(item.examDate)}</td>
                    <td><span class="pill">${item.examName || 'Examination'}</span></td>
                    <td>${item.subjectCode || '—'}</td>
                    <td><strong>${item.subject || ''}</strong></td>
                    <td>${item.examTime || '09:30 AM - 12:30 PM'}</td>
                </tr>`
            )
            .join('');

        const examLabel = selectedExam === 'all' ? 'All Examinations' : selectedExam;
        const generatedOn = new Date().toLocaleDateString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>${selectedClass} - Exam Timetable</title>
                <style>
                    * { box-sizing: border-box; }
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        padding: 40px;
                        color: #1e293b;
                        background: #fff;
                    }
                    .sheet {
                        max-width: 820px;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        overflow: hidden;
                    }
                    .sheet-header {
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        color: #fff;
                        padding: 32px 36px;
                    }
                    .sheet-kicker {
                        font-size: 11px;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        opacity: 0.85;
                    }
                    .sheet-header h1 {
                        margin: 6px 0 4px;
                        font-size: 26px;
                    }
                    .sheet-header p {
                        margin: 0;
                        opacity: 0.9;
                        font-size: 13px;
                    }
                    .sheet-body { padding: 28px 36px 36px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                    th, td { padding: 12px 10px; text-align: left; font-size: 13px; }
                    thead th {
                        background: #f5f3ff;
                        color: #4338ca;
                        text-transform: uppercase;
                        font-size: 11px;
                        letter-spacing: 0.5px;
                        border-bottom: 2px solid #ddd6fe;
                    }
                    tbody tr { border-bottom: 1px solid #f1f5f9; }
                    .pill {
                        display: inline-block;
                        background: #eef2ff;
                        color: #4338ca;
                        padding: 3px 10px;
                        border-radius: 999px;
                        font-size: 11px;
                        font-weight: 600;
                    }
                    .sheet-footer {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 32px;
                        font-size: 12px;
                        color: #64748b;
                    }
                    @media print {
                        body { padding: 0; }
                        .sheet { border: none; border-radius: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="sheet">
                    <div class="sheet-header">
                        <div class="sheet-kicker">Examination Timetable</div>
                        <h1>${selectedClass}</h1>
                        <p>${examLabel} &nbsp;•&nbsp; ${classSchedule.length} subject${classSchedule.length === 1 ? '' : 's'} scheduled</p>
                    </div>
                    <div class="sheet-body">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Date</th>
                                    <th>Exam</th>
                                    <th>Subject Code</th>
                                    <th>Subject</th>
                                    <th>Timing</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                        <div class="sheet-footer">
                            <span>Generated on ${generatedOn}</span>
                            <span>Official Examination Schedule</span>
                        </div>
                    </div>
                </div>
                <script>window.onload = () => window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="etv-shell">
            {step === 'select' ? (
                <div className="etv-page etv-fade-in">
                    <div className="etv-hero">
                        <div className="etv-hero-glow" />
                        <span className="etv-hero-kicker">
                            <Sparkles size={13} /> EXAMINATION PORTAL
                        </span>
                        <h2>Select a Class</h2>
                        <p>Choose a class to view its published exam timetable</p>
                    </div>

                    {loading ? (
                        <div className="etv-empty">
                            <p>Loading classes…</p>
                        </div>
                    ) : classSummaries.length === 0 ? (
                        <div className="etv-empty">
                            <Inbox size={30} />
                            <h4>No Timetables Published Yet</h4>
                            <p>Once an exam timetable is added for a class, it will appear here.</p>
                        </div>
                    ) : (
                        <div className="etv-class-grid">
                            {classSummaries.map(c => (
                                <button
                                    key={c.className}
                                    className="etv-class-card"
                                    onClick={() => openClass(c.className)}
                                >
                                    <div className="etv-class-icon">
                                        <GraduationCap size={22} />
                                    </div>
                                    <div className="etv-class-info">
                                        <h4>{c.className}</h4>
                                        <span className="etv-class-meta">
                                            {c.subjectCount} subject{c.subjectCount === 1 ? '' : 's'} · {c.examCount} exam{c.examCount === 1 ? '' : 's'}
                                        </span>
                                       
                                    </div>
                                    <ChevronRight size={18} className="etv-class-arrow" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="etv-page etv-fade-in">
                    <div className="etv-viewhead">
                        <button className="etv-back" onClick={goBack}>
                            <ArrowLeft size={16} /> All Classes
                        </button>

                        <button
                            className="etv-download"
                            onClick={handleDownload}
                            disabled={classSchedule.length === 0}
                        >
                            <Download size={15} /> Download PDF
                        </button>
                    </div>

                    <div className="etv-hero etv-hero-compact">
                        <div className="etv-hero-glow" />
                        <span className="etv-hero-kicker">
                            <CalendarDays size={13} /> EXAM TIMETABLE
                        </span>
                        <h2>{selectedClass}</h2>
                        <p>{classSchedule.length} subject{classSchedule.length === 1 ? '' : 's'} scheduled</p>
                    </div>

                    <div className="etv-filters">
                        <div className="etv-field">
                            <label>Exam</label>
                            <select
                                className="etv-select"
                                value={selectedExam}
                                onChange={e => setSelectedExam(e.target.value)}
                            >
                                <option value="all">All Exams</option>
                                {examNamesForClass.map(exam => (
                                    <option key={exam} value={exam}>
                                        {exam}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="etv-count">
                            <strong>{classSchedule.length}</strong>
                            <span>{classSchedule.length === 1 ? 'Subject' : 'Subjects'}</span>
                        </div>
                    </div>

                    {classSchedule.length === 0 ? (
                        <div className="etv-empty">
                            <BookOpen size={28} />
                            <h4>No Schedule Found</h4>
                            <p>There's no published timetable for {selectedClass}{selectedExam !== 'all' ? ` — ${selectedExam}` : ''} yet.</p>
                        </div>
                    ) : (
                        <div className="etv-table-wrap">
                            <table className="etv-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Date</th>
                                        <th>Exam</th>
                                        <th>Subject Code</th>
                                        <th>Subject</th>
                                        <th>Timing</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classSchedule.map((item, index) => (
                                        <tr key={item.id}>
                                            <td>{index + 1}</td>
                                            <td className="etv-date">{formatDate(item.examDate)}</td>
                                            <td>
                                                <span className="etv-badge">{item.examName || 'Examination'}</span>
                                            </td>
                                            <td>
                                                <code>{item.subjectCode || '—'}</code>
                                            </td>
                                            <td>
                                                <strong>{item.subject}</strong>
                                            </td>
                                            <td className="etv-time">
                                                <Clock size={13} />
                                                {item.examTime || '09:30 AM - 12:30 PM'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}