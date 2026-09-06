import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../service/firebase';
import {
    X, Edit2, KeyRound, Mail, Phone, MapPin, GraduationCap,
    Award, TrendingUp, ClipboardList, Users, Sparkles,
    CalendarCheck, Wallet, ClipboardCheck
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

    const studentId = student?.id;

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

    return (
        <div className="sp-backdrop" onClick={onClose}>
            <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
                <button className="sp-close-btn" onClick={onClose} title="Close Preview">
                    <X size={18} />
                </button>

                {/* SIDEBAR — Student Details */}
                <aside className="sp-sidebar">
                    <div className="sp-sidebar-top">
                        <img
                            src={student.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop'}
                            alt={student.name}
                            className="sp-avatar"
                        />
                        <h3>{student.name}</h3>
                        <div className="sp-badges">
                            {student.bloodGroup && <span className="blood-badge">{student.bloodGroup}</span>}
                            <span className={`status-pill ${(student.status || 'Active').toLowerCase() === 'active' ? 'status-present' : 'status-absent'}`}>
                                {student.status || 'Active'}
                            </span>
                        </div>
                        <p className="sp-class-line">
                            <GraduationCap size={13} /> {className || student.className || 'N/A'}{sectionName ? ` — Section ${sectionName}` : ''}
                        </p>
                    </div>

                    <div className="sp-sidebar-section">
                        <span className="sp-sidebar-label">Identity</span>
                        <p><strong>Adm No:</strong> <code>{student.admissionNo || 'N/A'}</code></p>
                        <p><strong>Roll No:</strong> {student.rollNumber || 'N/A'}</p>
                        <p><strong>Gender:</strong> {student.gender || 'N/A'}</p>
                        <p><strong>Adm Date:</strong> {student.admissionDate || 'N/A'}</p>
                        <p><strong>DOB:</strong> {student.dob || 'N/A'}</p>
                    </div>

                    <div className="sp-sidebar-section">
                        <span className="sp-sidebar-label">Guardian & Contact</span>
                        <p><Users size={13} /> {student.guardianName || 'N/A'} <em>({student.relationship || 'Guardian'})</em></p>
                        <p><Phone size={13} /> {student.phone || 'N/A'}{student.parentPhone ? ` / ${student.parentPhone}` : ''}</p>
                        {student.email && <p><Mail size={13} /> {student.email}</p>}
                        {student.address && <p className="sp-address"><MapPin size={13} /> {student.address}</p>}
                    </div>

                    <div className="sp-credentials-box">
                        <KeyRound size={14} />
                        <span>ERP Login — User: <strong>{student.admissionNo}</strong> | Pass: <strong>{student.dob}</strong></span>
                    </div>

                    {onEdit && (
                        <button className="sp-edit-btn" onClick={() => onEdit(student)}>
                            <Edit2 size={14} /> Edit Student Record
                        </button>
                    )}
                </aside>

                {/* MAIN — Stats + Academic Progress + Attendance + Fees + Assignments */}
                <main className="sp-main">
                    <div className="sp-main-heading">
                        <h3>Student Overview</h3>
                        <p>Full record summary — academics, attendance, fees and assignments — for {student.name}.</p>
                    </div>

                    <div className="sp-stats-grid">
                        <div className="sp-stat-card indigo">
                            <div className="sp-stat-icon"><TrendingUp size={20} /></div>
                            <div>
                                <span>Overall Average</span>
                                <h4>{overallAverage !== null ? `${overallAverage.toFixed(1)}%` : '—'}</h4>
                            </div>
                        </div>
                        <div className="sp-stat-card emerald">
                            <div className="sp-stat-icon"><Award size={20} /></div>
                            <div>
                                <span>Best Subject</span>
                                <h4>{bestSubject ? bestSubject.subject : '—'}</h4>
                            </div>
                        </div>
                        <div className="sp-stat-card amber">
                            <div className="sp-stat-icon"><ClipboardList size={20} /></div>
                            <div>
                                <span>Exams Recorded</span>
                                <h4>{totalPublished}</h4>
                            </div>
                        </div>
                        <div className="sp-stat-card rose">
                            <div className="sp-stat-icon"><Sparkles size={20} /></div>
                            <div>
                                <span>Pending Publish</span>
                                <h4>{pendingPublishCount}</h4>
                            </div>
                        </div>
                        <div className="sp-stat-card sky">
                            <div className="sp-stat-icon"><CalendarCheck size={20} /></div>
                            <div>
                                <span>Attendance Rate</span>
                                <h4>{attendanceRate !== null ? `${attendanceRate}%` : '—'}</h4>
                            </div>
                        </div>
                        <div className="sp-stat-card amber">
                            <div className="sp-stat-icon"><Wallet size={20} /></div>
                            <div>
                                <span>Fee Status</span>
                                <h4>{feeStatus || '—'}</h4>
                            </div>
                        </div>
                        <div className="sp-stat-card emerald">
                            <div className="sp-stat-icon"><ClipboardCheck size={20} /></div>
                            <div>
                                <span>Assignments Done</span>
                                <h4>{totalAssignments ? `${submittedAssignments}/${totalAssignments}` : '—'}</h4>
                            </div>
                        </div>
                        <div className="sp-stat-card rose">
                            <div className="sp-stat-icon"><Users size={20} /></div>
                            <div>
                                <span>Classes Present</span>
                                <h4>{totalAttendanceLogged ? `${presentCount}/${totalAttendanceLogged}` : '—'}</h4>
                            </div>
                        </div>
                    </div>

                    <div className="sp-progress-section">
                        <h4>Academic Progress</h4>
                        {examTypesWithData.length === 0 ? (
                            <div className="empty-state">No published marks recorded for this student yet.</div>
                        ) : (
                            <div className="table-responsive sp-progress-table-wrap">
                                <table className="custom-table sp-progress-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            {examTypesWithData.map((exam) => (
                                                <th key={exam}>{exam}</th>
                                            ))}
                                            <th>Average</th>
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
                                                                    <span className={`sp-grade-chip ${getGradeLabel(score).tone}`}>
                                                                        {score}
                                                                    </span>
                                                                ) : (
                                                                    <span className="sp-no-score">—</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td>
                                                        {rowAvg !== null ? (
                                                            <strong>{rowAvg.toFixed(1)}</strong>
                                                        ) : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="sp-progress-section">
                        <h4>Attendance Log</h4>
                        {recentAttendance.length === 0 ? (
                            <div className="empty-state">No attendance records found for this student yet.</div>
                        ) : (
                            <div className="table-responsive sp-progress-table-wrap">
                                <table className="custom-table sp-progress-table">
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
                                                    <span className={`sp-grade-chip ${r.status === 'present' ? 'grade-excellent' : 'grade-poor'}`}>
                                                        {(r.status || 'N/A').toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {totalAttendanceLogged > 0 && (
                            <p className="sp-no-score" style={{ marginTop: '8px', fontSize: '0.75rem' }}>
                                Showing latest {recentAttendance.length} of {totalAttendanceLogged} logged sessions
                                ({presentCount} present, {absentCount} absent).
                            </p>
                        )}
                    </div>

                    <div className="sp-progress-section">
                        <h4>Fee Records</h4>
                        {feeRecords.length === 0 ? (
                            <div className="empty-state">No fee records found for this student yet.</div>
                        ) : (
                            <div className="table-responsive sp-progress-table-wrap">
                                <table className="custom-table sp-progress-table">
                                    <thead>
                                        <tr>
                                            <th>Total Fee</th>
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
                                                    <span className={`sp-grade-chip ${f.status === 'Paid' ? 'grade-excellent' : f.status === 'Partial' ? 'grade-average' : 'grade-poor'}`}>
                                                        {f.status || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="sp-progress-section">
                        <h4>Assignment Submissions</h4>
                        {totalAssignments === 0 ? (
                            <div className="empty-state">No assignments recorded for this student's class yet.</div>
                        ) : (
                            <div className="table-responsive sp-progress-table-wrap">
                                <table className="custom-table sp-progress-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Subject</th>
                                            <th>Due Date</th>
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
                                                        <span className={`sp-grade-chip ${isSubmitted ? 'grade-excellent' : 'grade-poor'}`}>
                                                            {isSubmitted ? 'SUBMITTED' : 'PENDING'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {totalAssignments > 0 && (
                            <p className="sp-no-score" style={{ marginTop: '8px', fontSize: '0.75rem' }}>
                                {submittedAssignments} submitted, {pendingAssignments} pending.
                            </p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}