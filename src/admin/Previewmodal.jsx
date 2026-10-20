import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../service/firebase';
import {
    X, Edit2, KeyRound, Mail, Phone, MapPin, GraduationCap,
    Award, TrendingUp, Users, CalendarCheck, Wallet, ClipboardCheck, User,
    Minus, Maximize2, Minimize2, GripVertical
} from 'lucide-react';
import './Previewmodal.css';

const EXAM_TYPES = [
    '1st Mid-Term exam',
    'Quarterly Exam',
    '2nd Mid-Term exam',
    'Halferly Exam',
    '3rd Mid-Term exam',
    'Annual Exam',
    'Class Unit Test'
];

const SUBJECTS = [
    'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
    'English', 'Tamil', 'Social Science', 'Computer Science'
];

const getGradeLabel = (score) => {
    const n = Number(score);
    if (n >= 90) return { label: 'A+', tone: 'grade-excellent' };
    if (n >= 75) return { label: 'A', tone: 'grade-good' };
    if (n >= 60) return { label: 'B', tone: 'grade-good' };
    if (n >= 45) return { label: 'C', tone: 'grade-average' };
    if (n >= 35) return { label: 'D', tone: 'grade-average' };
    return { label: 'F', tone: 'grade-poor' };
};

const cleanStr = (v) => String(v || '').trim().toLowerCase();

const belongsToStudent = (record, student) => {
    if (!record || !student) return false;
    if (record.studentId && student.id && record.studentId === student.id) return true;
    const admNo = cleanStr(student.admissionNo || student.rollNumber);
    if (admNo && cleanStr(record.admissionNo) === admNo) return true;
    const name = cleanStr(student.name);
    if (name && cleanStr(record.studentName) === name) return true;
    return false;
};

export default function StudentPreviewModal({ student, sectionName, className, onClose, onEdit }) {

    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [feeRecords, setFeeRecords] = useState([]);
    const [classAssignments, setClassAssignments] = useState([]);
    const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
    const [activeTab, setActiveTab] = useState('marks');

    const studentId = student?.id;

    // ---------------- Window state: normal | maximized | minimized ----------------
    const MINI_W = 300;
    const MINI_H = 64;
    const [mode, setMode] = useState('normal');
    const [miniPos, setMiniPos] = useState(null);
    const [dragging, setDragging] = useState(false);
    const dragOffset = useRef(null);

    const clampMini = (x, y) => ({
        x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - Math.min(MINI_W, window.innerWidth - 16) - 8)),
        y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - MINI_H - 8))
    });

    const minimize = () => {
        // remember the last spot; first time it docks to the bottom-right corner
        setMiniPos((p) => clampMini(
            p ? p.x : window.innerWidth - MINI_W - 20,
            p ? p.y : window.innerHeight - MINI_H - 20
        ));
        setMode('minimized');
    };
    const toggleMaximize = () => setMode((m) => (m === 'maximized' ? 'normal' : 'maximized'));
    const restore = () => setMode('normal');

    // keep the minimized window on screen if the browser is resized
    useEffect(() => {
        if (mode !== 'minimized') return undefined;
        const onResize = () => setMiniPos((p) => (p ? clampMini(p.x, p.y) : p));
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const onMiniPointerDown = (e) => {
        if (e.target.closest('button')) return;
        const pos = miniPos || { x: 0, y: 0 };
        dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
    };
    const onMiniPointerMove = (e) => {
        if (!dragOffset.current) return;
        setMiniPos(clampMini(e.clientX - dragOffset.current.dx, e.clientY - dragOffset.current.dy));
    };
    const onMiniPointerUp = (e) => {
        if (!dragOffset.current) return;
        dragOffset.current = null;
        setDragging(false);
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    };
    // keyboard users can move the minimized window with the arrow keys
    const onMiniKeyDown = (e) => {
        const step = e.shiftKey ? 60 : 20;
        const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (e.target === e.currentTarget && moves[e.key]) {
            e.preventDefault();
            const [mx, my] = moves[e.key];
            setMiniPos((p) => clampMini((p?.x || 0) + mx, (p?.y || 0) + my));
        } else if (e.target === e.currentTarget && e.key === 'Enter') {
            restore();
        }
    };

    useEffect(() => {
        if (!studentId) return undefined;

        const unsubAttendance = onSnapshot(collection(db, 'attendance_records'), (snap) => {
            const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setAttendanceRecords(all.filter((r) => belongsToStudent(r, student)));
        });

        const unsubFees = onSnapshot(collection(db, 'fee_records'), (snap) => {
            const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setFeeRecords(all.filter((r) => belongsToStudent(r, student)));
        });

        const unsubAssignments = onSnapshot(collection(db, 'class_assignments'), (snap) => {
            setClassAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        const unsubSubmissions = onSnapshot(collection(db, 'assignment_submissions'), (snap) => {
            const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setAssignmentSubmissions(all.filter((r) => belongsToStudent(r, student)));
        });

        return () => {
            unsubAttendance();
            unsubFees();
            unsubAssignments();
            unsubSubmissions();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, student?.admissionNo, student?.name]);

    if (!student) return null;

    // ---------------- Academic stats (existing) ----------------
    const marks = student.marks || {};
    const marksDraft = student.marksDraft || {};

    const publishedEntries = Object.entries(marks);
    const totalPublished = publishedEntries.length;
    const overallAverage = totalPublished
        ? publishedEntries.reduce((sum, [, v]) => sum + Number(v || 0), 0) / totalPublished
        : null;

    const subjectAverages = SUBJECTS.map((subject) => {
        const scores = EXAM_TYPES
            .map((exam) => marks[`${exam} - ${subject}`])
            .filter((v) => v !== undefined)
            .map(Number);
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        return { subject, avg, count: scores.length };
    }).filter((s) => s.count > 0);

    const bestSubject = subjectAverages.length
        ? subjectAverages.reduce((best, cur) => (cur.avg > best.avg ? cur : best))
        : null;

    const pendingPublishCount = Object.keys(marksDraft).filter(
        (key) => marks[key] === undefined
    ).length;

    const examTypesWithData = EXAM_TYPES.filter((exam) =>
        SUBJECTS.some((subject) => marks[`${exam} - ${subject}`] !== undefined)
    );

    const subjectsWithData = SUBJECTS.filter((subject) =>
        EXAM_TYPES.some((exam) => marks[`${exam} - ${subject}`] !== undefined)
    );

    // ---------------- Attendance stats ----------------
    const totalAttendanceLogged = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
    const absentCount = totalAttendanceLogged - presentCount;
    const attendanceRate = totalAttendanceLogged
        ? Math.round((presentCount / totalAttendanceLogged) * 100)
        : null;

    const recentAttendance = [...attendanceRecords]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 8);

    // ---------------- Fee stats ----------------
    const feeTotals = feeRecords.reduce(
        (acc, f) => ({
            total: acc.total + (Number(f.totalFee) || 0),
            paid: acc.paid + (Number(f.paid) || 0),
            due: acc.due + (Number(f.due) || 0)
        }),
        { total: 0, paid: 0, due: 0 }
    );
    const feeStatus = feeRecords.length === 0
        ? null
        : feeTotals.due <= 0
            ? 'Paid'
            : feeTotals.paid > 0
                ? 'Partial'
                : 'Pending';

    // ---------------- Assignment stats ----------------
    const studentClass = className || student.className || '';
    const studentSection = sectionName || student.sectionName || '';
    const relevantAssignments = classAssignments.filter((a) => {
        const classMatches = !a.className || cleanStr(a.className) === cleanStr(studentClass);
        const sectionMatches = !a.sectionName || !studentSection || cleanStr(a.sectionName) === cleanStr(studentSection);
        return classMatches && sectionMatches;
    });
    const submittedTaskIds = new Set(assignmentSubmissions.map((s) => s.taskId));
    const totalAssignments = relevantAssignments.length;
    const submittedAssignments = relevantAssignments.filter((a) => submittedTaskIds.has(a.id)).length;
    const pendingAssignments = totalAssignments - submittedAssignments;

    const photoSrc = student.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop';
    const isActive = (student.status || 'Active').toLowerCase() === 'active';
    const classLabel = `${className || student.className || 'N/A'}${sectionName ? ` • Sec ${sectionName}` : ''}`;
    const feeTone = feeStatus === 'Paid' ? 'good' : feeStatus === 'Partial' ? 'warn' : feeStatus === 'Pending' ? 'bad' : '';

    const tabs = [
        { id: 'marks', label: 'Marks', icon: Award, count: subjectsWithData.length },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck, count: totalAttendanceLogged },
        { id: 'fees', label: 'Fees', icon: Wallet, count: feeRecords.length },
        { id: 'tasks', label: 'Tasks', icon: ClipboardCheck, count: totalAssignments },
        { id: 'profile', label: 'Profile', icon: User, count: 0 }
    ];

    if (mode === 'minimized') {
        const pos = miniPos || { x: 20, y: 20 };
        return createPortal(
            <div
                className={`pm-mini ${dragging ? 'is-dragging' : ''}`}
                style={{ left: pos.x, top: pos.y }}
                role="dialog"
                aria-label={`${student.name} preview (minimized). Drag or use arrow keys to move, Enter to restore.`}
                tabIndex={0}
                onPointerDown={onMiniPointerDown}
                onPointerMove={onMiniPointerMove}
                onPointerUp={onMiniPointerUp}
                onPointerCancel={onMiniPointerUp}
                onKeyDown={onMiniKeyDown}
                onDoubleClick={(e) => { if (!e.target.closest('button')) restore(); }}
            >
                <GripVertical size={16} className="pm-mini-grip" aria-hidden="true" />
                <img src={photoSrc} alt="" className="pm-mini-avatar" draggable={false} />
                <div className="pm-mini-text">
                    <strong>{student.name}</strong>
                    <span>{classLabel}</span>
                </div>
                <button type="button" className="pm-icon-btn" onClick={restore} title="Restore preview" aria-label="Restore preview">
                    <Maximize2 size={13} />
                </button>
                <button type="button" className="pm-icon-btn pm-close" onClick={onClose} title="Close preview" aria-label="Close preview">
                    <X size={15} />
                </button>
            </div>,
            document.body
        );
    }

    const isMax = mode === 'maximized';

    return createPortal(
        <div className={`pm-backdrop ${isMax ? 'is-max' : ''}`} onClick={isMax ? undefined : onClose}>
            <div
                className={`pm-modal ${isMax ? 'is-max' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label={`${student.name} preview`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ---------- Header ---------- */}
                <header className="pm-header" onDoubleClick={(e) => { if (!e.target.closest('button')) toggleMaximize(); }}>
                    <img src={photoSrc} alt={student.name} className="pm-avatar" />
                    <div className="pm-identity">
                        <h3>{student.name}</h3>
                        <p className="pm-class">
                            <GraduationCap size={12} /> {classLabel}
                        </p>
                        <div className="pm-badges">
                            {student.bloodGroup && <span className="pm-badge pm-badge-blood">{student.bloodGroup}</span>}
                            <span className={`pm-badge ${isActive ? 'pm-badge-ok' : 'pm-badge-off'}`}>
                                {student.status || 'Active'}
                            </span>
                            {student.admissionNo && <span className="pm-badge pm-badge-muted">#{student.admissionNo}</span>}
                        </div>
                    </div>
                    <div className="pm-header-actions">
                        {onEdit && (
                            <button type="button" className="pm-icon-btn" onClick={() => onEdit(student)} title="Edit student record">
                                <Edit2 size={14} />
                            </button>
                        )}
                        <button type="button" className="pm-icon-btn" onClick={minimize} title="Minimize" aria-label="Minimize preview">
                            <Minus size={15} />
                        </button>
                        <button
                            type="button"
                            className="pm-icon-btn"
                            onClick={toggleMaximize}
                            title={isMax ? 'Restore size' : 'Maximize'}
                            aria-label={isMax ? 'Restore preview size' : 'Maximize preview'}
                        >
                            {isMax ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                        </button>
                        <button type="button" className="pm-icon-btn pm-close" onClick={onClose} title="Close preview" aria-label="Close preview">
                            <X size={16} />
                        </button>
                    </div>
                </header>

                {/* ---------- KPI strip ---------- */}
                <section className="pm-kpis">
                    <div className="pm-kpi pm-kpi-indigo">
                        <span className="pm-kpi-label"><TrendingUp size={11} /> Average</span>
                        <strong>{overallAverage !== null ? `${overallAverage.toFixed(1)}%` : '—'}</strong>
                        <em>{bestSubject ? `Best: ${bestSubject.subject}` : 'No marks yet'}</em>
                    </div>
                    <div className="pm-kpi pm-kpi-sky">
                        <span className="pm-kpi-label"><CalendarCheck size={11} /> Attendance</span>
                        <strong>{attendanceRate !== null ? `${attendanceRate}%` : '—'}</strong>
                        <em>{totalAttendanceLogged ? `${presentCount}/${totalAttendanceLogged} present` : 'No records'}</em>
                    </div>
                    <div className={`pm-kpi pm-kpi-amber ${feeTone ? `tone-${feeTone}` : ''}`}>
                        <span className="pm-kpi-label"><Wallet size={11} /> Fees</span>
                        <strong>{feeStatus || '—'}</strong>
                        <em>{feeStatus ? `Due ₹${feeTotals.due.toLocaleString()}` : 'No records'}</em>
                    </div>
                    <div className="pm-kpi pm-kpi-emerald">
                        <span className="pm-kpi-label"><ClipboardCheck size={11} /> Tasks</span>
                        <strong>{totalAssignments ? `${submittedAssignments}/${totalAssignments}` : '—'}</strong>
                        <em>{totalAssignments ? `${pendingAssignments} pending` : 'None assigned'}</em>
                    </div>
                </section>

                {/* ---------- Tabs ---------- */}
                <nav className="pm-tabs" role="tablist">
                    {tabs.map(({ id, label, icon: Icon, count }) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === id}
                            className={`pm-tab ${activeTab === id ? 'active' : ''}`}
                            onClick={() => setActiveTab(id)}
                        >
                            <Icon size={13} />
                            <span>{label}</span>
                            {count > 0 && <b>{count}</b>}
                        </button>
                    ))}
                </nav>

                {/* ---------- Panel ---------- */}
                <div className="pm-panel" role="tabpanel">
                    {activeTab === 'marks' && (
                        examTypesWithData.length === 0 ? (
                            <div className="pm-empty">No published marks recorded yet.</div>
                        ) : (
                            <>
                                <div className="pm-table-wrap">
                                    <table className="pm-table">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                {examTypesWithData.map((exam) => (
                                                    <th key={exam}>{exam.replace(/ exam$/i, '')}</th>
                                                ))}
                                                <th>Avg</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subjectsWithData.map((subject) => {
                                                const rowScores = examTypesWithData
                                                    .map((exam) => marks[`${exam} - ${subject}`])
                                                    .filter((v) => v !== undefined)
                                                    .map(Number);
                                                const rowAvg = rowScores.length
                                                    ? rowScores.reduce((a, b) => a + b, 0) / rowScores.length
                                                    : null;
                                                return (
                                                    <tr key={subject}>
                                                        <td><strong>{subject}</strong></td>
                                                        {examTypesWithData.map((exam) => {
                                                            const score = marks[`${exam} - ${subject}`];
                                                            return (
                                                                <td key={exam}>
                                                                    {score !== undefined ? (
                                                                        <span className={`pm-chip ${getGradeLabel(score).tone}`}>{score}</span>
                                                                    ) : (
                                                                        <span className="pm-dash">—</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                        <td>{rowAvg !== null ? <strong>{rowAvg.toFixed(1)}</strong> : '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="pm-note">
                                    {totalPublished} published score{totalPublished === 1 ? '' : 's'}
                                    {pendingPublishCount > 0 ? ` • ${pendingPublishCount} awaiting publish` : ''}
                                </p>
                            </>
                        )
                    )}

                    {activeTab === 'attendance' && (
                        recentAttendance.length === 0 ? (
                            <div className="pm-empty">No attendance records found yet.</div>
                        ) : (
                            <>
                                <div className="pm-table-wrap">
                                    <table className="pm-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Period</th>
                                                <th>Subject</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentAttendance.map((r) => (
                                                <tr key={r.id}>
                                                    <td>{r.date || 'N/A'}</td>
                                                    <td>{r.period || 'N/A'}</td>
                                                    <td>{r.subject || 'N/A'}</td>
                                                    <td>
                                                        <span className={`pm-chip ${r.status === 'present' ? 'grade-excellent' : 'grade-poor'}`}>
                                                            {(r.status || 'N/A').toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="pm-note">
                                    Latest {recentAttendance.length} of {totalAttendanceLogged} sessions • {presentCount} present, {absentCount} absent
                                </p>
                            </>
                        )
                    )}

                    {activeTab === 'fees' && (
                        feeRecords.length === 0 ? (
                            <div className="pm-empty">No fee records found yet.</div>
                        ) : (
                            <div className="pm-table-wrap">
                                <table className="pm-table">
                                    <thead>
                                        <tr>
                                            <th>Total</th>
                                            <th>Paid</th>
                                            <th>Due</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feeRecords.map((f) => (
                                            <tr key={f.id}>
                                                <td>₹{Number(f.totalFee || 0).toLocaleString()}</td>
                                                <td>₹{Number(f.paid || 0).toLocaleString()}</td>
                                                <td>₹{Number(f.due || 0).toLocaleString()}</td>
                                                <td>
                                                    <span className={`pm-chip ${f.status === 'Paid' ? 'grade-excellent' : f.status === 'Partial' ? 'grade-average' : 'grade-poor'}`}>
                                                        {f.status || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {activeTab === 'tasks' && (
                        totalAssignments === 0 ? (
                            <div className="pm-empty">No assignments recorded for this class yet.</div>
                        ) : (
                            <>
                                <div className="pm-table-wrap">
                                    <table className="pm-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Subject</th>
                                                <th>Due</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {relevantAssignments.map((a) => {
                                                const isSubmitted = submittedTaskIds.has(a.id);
                                                return (
                                                    <tr key={a.id}>
                                                        <td><strong>{a.title || 'Untitled'}</strong></td>
                                                        <td>{a.subject || 'N/A'}</td>
                                                        <td>{a.dueDate || 'N/A'}</td>
                                                        <td>
                                                            <span className={`pm-chip ${isSubmitted ? 'grade-excellent' : 'grade-poor'}`}>
                                                                {isSubmitted ? 'DONE' : 'PENDING'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="pm-note">{submittedAssignments} submitted, {pendingAssignments} pending</p>
                            </>
                        )
                    )}

                    {activeTab === 'profile' && (
                        <div className="pm-profile">
                            <div className="pm-info-grid">
                                <div className="pm-info"><span>Adm No</span><b>{student.admissionNo || 'N/A'}</b></div>
                                <div className="pm-info"><span>Roll No</span><b>{student.rollNumber || 'N/A'}</b></div>
                                <div className="pm-info"><span>Gender</span><b>{student.gender || 'N/A'}</b></div>
                                <div className="pm-info"><span>DOB</span><b>{student.dob || 'N/A'}</b></div>
                                <div className="pm-info"><span>Adm Date</span><b>{student.admissionDate || 'N/A'}</b></div>
                                <div className="pm-info"><span>Class</span><b>{classLabel}</b></div>
                            </div>

                            <div className="pm-contact">
                                <p><Users size={13} /> {student.guardianName || 'N/A'} <em>({student.relationship || 'Guardian'})</em></p>
                                <p><Phone size={13} /> {student.phone || 'N/A'}{student.parentPhone ? ` / ${student.parentPhone}` : ''}</p>
                                {student.email && <p><Mail size={13} /> {student.email}</p>}
                                {student.address && <p><MapPin size={13} /> {student.address}</p>}
                            </div>

                            <div className="pm-credentials">
                                <KeyRound size={13} />
                                <span>ERP Login — User: <strong>{student.admissionNo}</strong> • Pass: <strong>{student.dob}</strong></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}