import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import {
    BookOpen, Calendar, Award, CheckCircle, Bell, Search, LogOut,
    Menu, X, Clock, FileText, User, AlertCircle, Layers, Check, XCircle,
    Upload, FileCheck, ExternalLink, Loader2, AlertTriangle, Printer,
    ChevronRight, BarChart2, Filter
} from 'lucide-react';
import './StudentDashboard.css';

export default function StudentDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [studentData, setStudentData] = useState({ name: 'Student', grade: '', section: '', rollNo: '', id: '' });

    // Live Synced States
    const [timetableList, setTimetableList] = useState([]);
    const [liveStudentRecord, setLiveStudentRecord] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [assignmentsList, setAssignmentsList] = useState([]);
    const [submissionsList, setSubmissionsList] = useState([]);

    // Attendance Table Filters
    const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
    const [attendanceDateFilter, setAttendanceDateFilter] = useState('');

    // PDF Upload States
    const [uploadingTaskId, setUploadingTaskId] = useState(null);
    const [pdfBase64Map, setPdfBase64Map] = useState({});
    const [isCompressing, setIsCompressing] = useState(false);

    // Subject/Exam filter on Marks tab
    const [selectedExamView, setSelectedExamView] = useState('All');

    const navigate = useNavigate();

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const timeSlots = [
        '09:00 - 09:45 AM',
        '09:45 - 10:20 AM',
        '10:20 - 11:00 AM',
        '11:15 - 11:50 AM',
        '11:50 AM - 12:30 PM',
        '01:00 - 01:45 PM',
        '01:45 - 02:20 PM',
        '02:20 - 02:40 PM',
        '02:50 - 03:30 PM',
        '03:30 - 04:10 PM'
    ];

    const examList = [
        '1st Mid-Term exam',
        'Quarterly Exam',
        '2nd Mid-Term exam',
        'Halferly Exam',
        '3rd Mid-Term exam',
        'Annual Exam',
        'Class Unit Test'
    ];

    useEffect(() => {
        const storedUser = localStorage.getItem('studentUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setStudentData({
                    id: user.id || user.uid || '',
                    name: user.name || 'Student Name',
                    grade: user.grade || user.className || '',
                    section: user.section || user.sectionName || '',
                    rollNo: user.rollNo || user.admissionNo || ''
                });
            } catch (err) {
                console.error("Failed to parse user session", err);
            }
        }
    }, []);

    const cleanString = (str) => {
        if (!str) return '';
        return str
            .toString()
            .toLowerCase()
            .replace(/\bsection\b/g, '')
            .replace(/\bstd\b/g, '')
            .replace(/\bclass\b/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();
    };

    const cleanTime = (str) => {
        if (!str) return '';
        return str.toString().toLowerCase().replace(/\s*(am|pm)\s*/g, '').replace(/[^0-9]/g, '');
    };

    // Client-Side PDF Compressor (Max 500 KB Limit)
    const handlePdfUpload = (taskId, file) => {
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            alert('Invalid file format! Please upload only standard PDF documents.');
            return;
        }

        setIsCompressing(true);
        setUploadingTaskId(taskId);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let base64String = e.target.result;
                const maxCharLimit = 680000;

                if (file.size > 500 * 1024) {
                    const binary = atob(base64String.split(',')[1]);
                    let cleanedBinary = binary.replace(/\/Metadata\s+\d+\s+\d+\s+R/g, '');
                    cleanedBinary = cleanedBinary.replace(/\/PieceInfo\s+<<.*?>>/gs, '');

                    base64String = `data:application/pdf;base64,${btoa(cleanedBinary)}`;

                    if (base64String.length > maxCharLimit) {
                        alert('PDF file is too large to compress under 500 KB. Please reduce pages or compress image layers.');
                        setIsCompressing(false);
                        setUploadingTaskId(null);
                        return;
                    }
                }

                setPdfBase64Map(prev => ({
                    ...prev,
                    [taskId]: {
                        fileName: file.name,
                        fileSize: (file.size / 1024).toFixed(1) + ' KB',
                        data: base64String
                    }
                }));
            } catch (err) {
                console.error("PDF processing error:", err);
                alert("Could not process PDF file. Please try another document.");
            } finally {
                setIsCompressing(false);
                setUploadingTaskId(null);
            }
        };

        reader.readAsDataURL(file);
    };

    const handleSubmitAssignmentPdf = async (taskId, taskTitle) => {
        const fileObj = pdfBase64Map[taskId];
        if (!fileObj || !fileObj.data) {
            alert('Please select a PDF to upload first.');
            return;
        }

        try {
            await addDoc(collection(db, 'assignment_submissions'), {
                taskId: taskId,
                taskTitle: taskTitle,
                studentId: studentData.id,
                studentName: studentData.name,
                admissionNo: studentData.rollNo,
                className: studentData.grade,
                sectionName: studentData.section,
                pdfData: fileObj.data,
                fileName: fileObj.fileName,
                fileSize: fileObj.fileSize,
                submittedAt: serverTimestamp()
            });

            alert('Assignment PDF turned in successfully!');
            setPdfBase64Map(prev => {
                const copy = { ...prev };
                delete copy[taskId];
                return copy;
            });
        } catch (error) {
            console.error("Error submitting assignment PDF:", error);
            alert("Submission failed. Check network connection.");
        }
    };

    // 1. Timetable listener
    useEffect(() => {
        const parseFirestoreDoc = (doc) => {
            const data = doc.data();
            const parsed = [];

            const docClass = data.className || data.class || data.grade || '';
            const docSection = data.sectionName || data.section || '';
            const gridData = data.grid || data.schedule || data.matrix || data.timetable || data.days;

            if (gridData && typeof gridData === 'object' && !Array.isArray(gridData)) {
                Object.keys(gridData).forEach(day => {
                    const daySlots = gridData[day];
                    if (Array.isArray(daySlots)) {
                        daySlots.forEach((slot, idx) => {
                            if (slot && (slot.subject || slot.subjectName)) {
                                parsed.push({
                                    id: `${doc.id}_${day}_${idx}`,
                                    className: docClass,
                                    sectionName: docSection,
                                    day: day,
                                    timeSlot: slot.timeSlot || slot.time || slot.period || 'N/A',
                                    subject: slot.subject || slot.subjectName || 'N/A',
                                    teacherName: slot.teacherName || slot.teacher || slot.staff || 'N/A',
                                    roomNo: slot.roomNo || slot.room || 'N/A'
                                });
                            }
                        });
                    }
                });
            } else if (Array.isArray(data.slots)) {
                data.slots.forEach((slot, idx) => {
                    parsed.push({
                        id: `${doc.id}_${idx}`,
                        className: docClass,
                        sectionName: docSection,
                        day: slot.day || data.day || 'Monday',
                        timeSlot: slot.timeSlot || slot.time || 'N/A',
                        subject: slot.subject || slot.subjectName || 'N/A',
                        teacherName: slot.teacherName || slot.teacher || 'N/A',
                        roomNo: slot.roomNo || slot.room || 'N/A'
                    });
                });
            } else if (data.subject || data.subjectName) {
                parsed.push({
                    id: doc.id,
                    className: docClass,
                    sectionName: docSection,
                    day: data.day || 'Monday',
                    timeSlot: data.timeSlot || data.time || 'N/A',
                    subject: data.subject || data.subjectName,
                    teacherName: data.teacherName || data.teacher || 'N/A',
                    roomNo: data.roomNo || data.room || 'N/A'
                });
            }

            return parsed;
        };

        let dbList1 = [];
        let dbList2 = [];

        const unsub1 = onSnapshot(collection(db, 'student_timetables'), (snap) => {
            dbList1 = snap.docs.flatMap(doc => parseFirestoreDoc(doc));
            setTimetableList([...dbList1, ...dbList2]);
        });

        const unsub2 = onSnapshot(collection(db, 'timetables'), (snap) => {
            dbList2 = snap.docs.flatMap(doc => parseFirestoreDoc(doc));
            setTimetableList([...dbList1, ...dbList2]);
        });

        return () => {
            unsub1();
            unsub2();
        };
    }, []);

    // 2. Real-time Live Synchronized Records
    useEffect(() => {
        const unsubStudents = onSnapshot(collection(db, 'students_records'), (snap) => {
            const current = snap.docs.find(doc => {
                const data = doc.data();
                const rollMatch = cleanString(data.admissionNo) === cleanString(studentData.rollNo);
                const nameMatch = cleanString(data.name) === cleanString(studentData.name);
                return rollMatch || nameMatch || doc.id === studentData.id;
            });

            if (current) {
                setLiveStudentRecord({ id: current.id, ...current.data() });
            }
        });

        const unsubAnnounce = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snap) => {
            setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubAssignments = onSnapshot(collection(db, 'class_assignments'), (snap) => {
            setAssignmentsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubSubmissions = onSnapshot(collection(db, 'assignment_submissions'), (snap) => {
            const mySubmissions = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(sub => cleanString(sub.admissionNo) === cleanString(studentData.rollNo) || sub.studentId === studentData.id);
            setSubmissionsList(mySubmissions);
        });

        return () => {
            unsubStudents();
            unsubAnnounce();
            unsubAssignments();
            unsubSubmissions();
        };
    }, [studentData]);

    const studentSchedule = timetableList.filter(item => {
        const itemClass = cleanString(item.className);
        const studentClass = cleanString(studentData.grade);
        const itemSec = cleanString(item.sectionName);
        const studentSec = cleanString(studentData.section);

        const isClassMatch = !itemClass || !studentClass || itemClass === studentClass || itemClass.includes(studentClass) || studentClass.includes(itemClass);
        const isSecMatch = !itemSec || !studentSec || itemSec === studentSec || itemSec.includes(studentSec) || studentSec.includes(itemSec);

        return isClassMatch && isSecMatch;
    });

    const studentAssignments = assignmentsList.filter(item => {
        const itemClass = cleanString(item.className);
        const studentClass = cleanString(studentData.grade);
        const itemSec = cleanString(item.sectionName);
        const studentSec = cleanString(studentData.section);

        const isClassMatch = !itemClass || !studentClass || itemClass === studentClass || itemClass.includes(studentClass) || studentClass.includes(itemClass);
        const isSecMatch = !itemSec || !studentSec || itemSec === studentSec || itemSec.includes(studentSec) || studentSec.includes(itemSec);

        return isClassMatch && isSecMatch;
    });

    const handleLogout = () => {
        localStorage.removeItem('studentUser');
        navigate('/erp/student');
    };

    // Marks Calculations
    const publishedMarksObj = liveStudentRecord?.publishedMarks || liveStudentRecord?.marks || {};
    const marksEntries = Object.entries(publishedMarksObj).map(([key, val]) => {
        const score = typeof val === 'object' && val !== null ? val.score : Number(val);
        const subject = typeof val === 'object' && val?.subject ? val.subject : (key.includes('-') ? key.split('-')[1].trim() : 'General');
        const examName = typeof val === 'object' && val?.examType ? val.examType : (key.includes('-') ? key.split('-')[0].trim() : key);
        return {
            key,
            examName,
            subject,
            score: isNaN(score) ? 0 : score
        };
    });

    const filteredMarksEntries = selectedExamView === 'All' 
        ? marksEntries 
        : marksEntries.filter(m => cleanString(m.examName) === cleanString(selectedExamView));

    const totalScore = marksEntries.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = marksEntries.length > 0 ? (totalScore / marksEntries.length).toFixed(1) : 'N/A';

    // Attendance Calculations (Gatekeeping: Show only if staff submitted)
    const hasStaffSubmittedAttendance = Boolean(liveStudentRecord?.lastAttendanceDate || liveStudentRecord?.status);
    const currentAttendanceStatus = hasStaffSubmittedAttendance ? (liveStudentRecord?.status || 'present') : 'pending';
    const rawAttendanceRate = hasStaffSubmittedAttendance ? (liveStudentRecord?.attendanceRate ? parseInt(liveStudentRecord.attendanceRate) : (currentAttendanceStatus === 'present' ? 94 : 68)) : 0;
    const isDefaulter = hasStaffSubmittedAttendance && rawAttendanceRate < 75;

    // Detailed attendance log records from staff submission
    const attendanceLogs = hasStaffSubmittedAttendance ? [
        {
            id: 1,
            date: liveStudentRecord?.lastAttendanceDate || 'Today',
            period: liveStudentRecord?.lastAttendancePeriod || 'Period 1 (09:00 - 09:45 AM)',
            subject: 'General / Class Roll Call',
            teacherName: 'Faculty Advisor',
            status: liveStudentRecord?.status || 'present'
        }
    ] : [];

    const filteredAttendanceLogs = attendanceLogs.filter(log => {
        const matchesStatus = attendanceStatusFilter === 'all' || log.status === attendanceStatusFilter;
        const matchesDate = !attendanceDateFilter || log.date === attendanceDateFilter;
        return matchesStatus && matchesDate;
    });

    const stats = [
        { 
            title: 'Attendance Rate', 
            value: hasStaffSubmittedAttendance ? `${rawAttendanceRate}%` : 'Pending', 
            icon: isDefaulter ? AlertTriangle : CheckCircle,
            color: isDefaulter ? 'rose' : 'emerald',
            badge: hasStaffSubmittedAttendance ? (isDefaulter ? 'Below 75% Minimum' : 'Compliant') : 'Awaiting Faculty'
        },
        { 
            title: 'Coursework & PDFs', 
            value: `${studentAssignments.length} Tasks`, 
            icon: Layers, 
            color: 'amber',
            badge: `${submissionsList.length} Turned In` 
        },
        { 
            title: 'Published Exam Scores', 
            value: averageScore !== 'N/A' ? `${averageScore}%` : 'Pending', 
            icon: Award, 
            color: 'indigo',
            badge: `${marksEntries.length} Subjects` 
        },
        { 
            title: 'Class Routine', 
            value: `${studentSchedule.length} Sessions`, 
            icon: BookOpen, 
            color: 'cyan',
            badge: 'Live Matrix' 
        },
    ];

    const printTimetable = () => {
        window.print();
    };

    return (
        <div className="staff-style-dashboard">
            <div className="staff-mobile-toggle-bar">
                <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    <span>Student Portal</span>
                </button>
                <div className="portal-status-pill">
                    <span className={`status-dot ${currentAttendanceStatus}`} />
                    {currentAttendanceStatus.toUpperCase()} {hasStaffSubmittedAttendance ? `(${rawAttendanceRate}%)` : ''}
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="staff-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            <div className="staff-layout-grid">
                <aside className={`staff-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    <div className="staff-user-profile font-bold">
                        <div className="staff-avatar-ring">
                            {liveStudentRecord?.photo ? (
                                <img src={liveStudentRecord.photo} alt="Avatar" className="student-profile-img" />
                            ) : (
                                <User size={18} />
                            )}
                        </div>
                        <div className="staff-user-info">
                            <h4>{studentData.name}</h4>
                            <p>{studentData.grade} {studentData.section ? `• Sec ${studentData.section}` : ''}</p>
                            <span className="roll-no-tag">ID: #{studentData.rollNo || 'N/A'}</span>
                        </div>
                    </div>

                    <nav className="staff-nav-list">
                        <button 
                            className={`staff-nav-item ${activeTab === 'overview' ? 'active' : ''}`} 
                            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                        >
                            <BookOpen size={16} /><span>Dashboard Overview</span>
                        </button>
                        <button 
                            className={`staff-nav-item ${activeTab === 'attendance' ? 'active' : ''}`} 
                            onClick={() => { setActiveTab('attendance'); setIsMobileMenuOpen(false); }}
                        >
                            <BarChart2 size={16} /><span>Attendance Record</span>
                        </button>
                        <button 
                            className={`staff-nav-item ${activeTab === 'assignments' ? 'active' : ''}`} 
                            onClick={() => { setActiveTab('assignments'); setIsMobileMenuOpen(false); }}
                        >
                            <Layers size={16} /><span>PDF Tasks & Uploads</span>
                        </button>
                        <button 
                            className={`staff-nav-item ${activeTab === 'schedule' ? 'active' : ''}`} 
                            onClick={() => { setActiveTab('schedule'); setIsMobileMenuOpen(false); }}
                        >
                            <Calendar size={16} /><span>Class Routine Table</span>
                        </button>
                        <button 
                            className={`staff-nav-item ${activeTab === 'marks' ? 'active' : ''}`} 
                            onClick={() => { setActiveTab('marks'); setIsMobileMenuOpen(false); }}
                        >
                            <Award size={16} /><span>Examination Marks</span>
                        </button>
                        <button 
                            className={`staff-nav-item ${activeTab === 'submissions' ? 'active' : ''}`} 
                            onClick={() => { setActiveTab('submissions'); setIsMobileMenuOpen(false); }}
                        >
                            <FileCheck size={16} /><span>Submission History</span>
                        </button>
                        <button 
                            className={`staff-nav-item ${activeTab === 'notices' ? 'active' : ''}`} 
                            onClick={() => { setActiveTab('notices'); setIsMobileMenuOpen(false); }}
                        >
                            <Bell size={16} /><span>School Bulletins</span>
                        </button>
                    </nav>

                    <div className="staff-sidebar-footer">
                        <button className="staff-signout-btn" onClick={handleLogout}>
                            <LogOut size={15} /><span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                <div className="staff-main-workspace">
                    <header className="staff-top-header">
                        <div className="staff-search-input-group">
                            <Search size={15} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search courses or assignments..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                        </div>

                        <div className="topbar-actions">
                            <div className="sync-badge">
                                <span className="sync-dot" /> Live Portal Sync
                            </div>
                        </div>
                    </header>

                    <div className="staff-content-container">
                        {/* =========================================================
                            1. OVERVIEW WITH ATTENDANCE COMPLIANCE BAR
                            ========================================================= */}
                        {activeTab === 'overview' && (
                            <>
                                <div className="staff-welcome-card">
                                    <div>
                                        <h2>Welcome back, <span className="green-accent">{studentData.name}</span>! 👋</h2>
                                        <p>Enrolled in {studentData.grade} {studentData.section ? `(Section ${studentData.section})` : ''} • Somarasampettai Campus</p>
                                    </div>
                                    <div className="attendance-pill-box">
                                        <span className="pill-label">Roll Call:</span>
                                        <span className={`status-badge status-${currentAttendanceStatus}`}>
                                            {currentAttendanceStatus === 'present' ? <Check size={12} /> : (currentAttendanceStatus === 'absent' ? <XCircle size={12} /> : <Clock size={12} />)}
                                            {currentAttendanceStatus.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Attendance Threshold Bar */}
                                {isDefaulter && (
                                    <div className="attendance-warning-banner">
                                        <div className="warning-content">
                                            <AlertTriangle size={20} color="var(--accent-rose)" />
                                            <div>
                                                <strong>Attendance Below 75% Threshold ({rawAttendanceRate}%)</strong>
                                                <p>Your current attendance is below minimum institutional requirements. Please connect with your class advisor.</p>
                                            </div>
                                        </div>
                                        <div className="attendance-progress-track">
                                            <div 
                                                className="attendance-progress-fill alert" 
                                                style={{ width: `${rawAttendanceRate}%` }} 
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="staff-stats-grid">
                                    {stats.map((s, idx) => {
                                        const IconComp = s.icon;
                                        return (
                                            <div key={idx} className="staff-stat-box">
                                                <div className="stat-head">
                                                    <div className={`stat-icon-bg bg-${s.color}`}>
                                                        <IconComp size={18} />
                                                    </div>
                                                    <span className="stat-tag">{s.badge}</span>
                                                </div>
                                                <div>
                                                    <span className="stat-title">{s.title}</span>
                                                    <h3 className="stat-val">{s.value}</h3>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="student-two-col-grid">
                                    {/* Active Coursework */}
                                    <div className="staff-card">
                                        <div className="card-header">
                                            <h3>Active Coursework</h3>
                                            <Layers size={16} className="muted-icon" />
                                        </div>
                                        {studentAssignments.length === 0 ? (
                                            <div className="empty-sub-card">
                                                <CheckCircle size={24} color="var(--accent-emerald)" />
                                                <p>All caught up! No active tasks assigned for your class.</p>
                                            </div>
                                        ) : (
                                            <div className="student-tasks-list">
                                                {studentAssignments.slice(0, 3).map(task => {
                                                    const isSubmitted = submissionsList.some(sub => sub.taskId === task.id);
                                                    return (
                                                        <div key={task.id} className="student-task-item">
                                                            <div className="task-top-flex">
                                                                <span className={`task-badge badge-${task.type.toLowerCase().replace(/\s+/g, '')}`}>
                                                                    {task.type}
                                                                </span>
                                                                {isSubmitted ? (
                                                                    <span className="submitted-pill"><FileCheck size={12} /> Submitted</span>
                                                                ) : (
                                                                    <span className="due-date-pill">Due: {task.dueDate}</span>
                                                                )}
                                                            </div>
                                                            <h5>{task.title}</h5>
                                                            <span className="task-sub">{task.subject} • Faculty: {task.staffName}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Notice Bulletins */}
                                    <div className="staff-card">
                                        <div className="card-header">
                                            <h3>Notice Board Circulars</h3>
                                            <Bell size={16} className="muted-icon" />
                                        </div>
                                        <div className="student-notice-list">
                                            {announcements.slice(0, 3).map((item) => (
                                                <div key={item.id} className="student-notice-item">
                                                    <p>{item.content}</p>
                                                    <span className="notice-time">
                                                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}
                                                    </span>
                                                </div>
                                            ))}
                                            {announcements.length === 0 && (
                                                <p style={{ color: 'var(--staff-text-muted)', fontSize: '0.78rem' }}>No announcements available.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* =========================================================
                            2. ATTENDANCE RECORD TAB (GATEKEEPING + STYLED TABLE)
                            ========================================================= */}
                        {activeTab === 'attendance' && (
                            <div className="staff-card full">
                                <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h3>Attendance Summary & Period Logs</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>
                                            Real-time attendance record and daily roll call logs for {studentData.name} (#{studentData.rollNo})
                                        </p>
                                    </div>

                                    {/* Filters Bar */}
                                    {hasStaffSubmittedAttendance && (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Filter size={14} color="var(--staff-text-muted)" />
                                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--staff-text-muted)' }}>Filters:</span>
                                            </div>
                                            
                                            <input
                                                type="date"
                                                className="custom-select"
                                                value={attendanceDateFilter}
                                                onChange={(e) => setAttendanceDateFilter(e.target.value)}
                                                title="Filter by Date"
                                                style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                                            />

                                            <select
                                                className="custom-select"
                                                value={attendanceStatusFilter}
                                                onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                                                style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                                            >
                                                <option value="all">All Statuses</option>
                                                <option value="present">Present Only</option>
                                                <option value="absent">Absent Only</option>
                                            </select>

                                            {(attendanceDateFilter || attendanceStatusFilter !== 'all') && (
                                                <button
                                                    onClick={() => { setAttendanceDateFilter(''); setAttendanceStatusFilter('all'); }}
                                                    style={{ background: 'none', border: 'none', color: 'var(--staff-primary)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {!hasStaffSubmittedAttendance ? (
                                    <div className="empty-sub-card" style={{ padding: '3rem 1rem' }}>
                                        <Clock size={36} color="var(--staff-text-muted)" />
                                        <h4>Attendance Pending Faculty Submission</h4>
                                        <p>Your class advisor or faculty has not submitted or published attendance records for today yet. Please check back later.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="staff-stats-grid" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
                                            <div className="staff-stat-box">
                                                <span className="stat-title">Overall Percentage</span>
                                                <h3 className="stat-val" style={{ color: isDefaulter ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                                                    {rawAttendanceRate}%
                                                </h3>
                                                <span style={{ fontSize: '0.68rem', color: 'var(--staff-text-muted)' }}>
                                                    {isDefaulter ? 'Below 75% minimum requirement' : 'Meets standards'}
                                                </span>
                                            </div>
                                            <div className="staff-stat-box">
                                                <span className="stat-title">Current Status</span>
                                                <h3 className="stat-val">
                                                    <span className={`status-badge status-${currentAttendanceStatus}`} style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
                                                        {currentAttendanceStatus.toUpperCase()}
                                                    </span>
                                                </h3>
                                                <span style={{ fontSize: '0.68rem', color: 'var(--staff-text-muted)' }}>Latest faculty roll call</span>
                                            </div>
                                            <div className="staff-stat-box">
                                                <span className="stat-title">Total Logs Recorded</span>
                                                <h3 className="stat-val" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                                                    {attendanceLogs.length} Periods
                                                </h3>
                                                <span style={{ fontSize: '0.68rem', color: 'var(--staff-text-muted)' }}>Filtered: {filteredAttendanceLogs.length} rows</span>
                                            </div>
                                        </div>

                                        <h4 style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.5rem' }}>Period-by-Period Roll Call Logs</h4>
                                        
                                        <div className="table-responsive" style={{ borderRadius: 'var(--staff-radius)', border: '1px solid var(--staff-border)' }}>
                                            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--staff-text-muted)' }}>DATE</th>
                                                        <th style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--staff-text-muted)' }}>PERIOD / TIME</th>
                                                        <th style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--staff-text-muted)' }}>SUBJECT</th>
                                                        <th style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--staff-text-muted)' }}>TEACHER NAME</th>
                                                        <th style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--staff-text-muted)' }}>STATUS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredAttendanceLogs.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--staff-text-muted)' }}>
                                                                No attendance logs found matching the selected filters.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredAttendanceLogs.map((log) => (
                                                            <tr key={log.id} style={{ borderBottom: '1px solid var(--staff-border)' }}>
                                                                <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}>{log.date}</td>
                                                                <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}>
                                                                    <span className="task-target-tag">{log.period}</span>
                                                                </td>
                                                                <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}>
                                                                    <span className="topic-badge">{log.subject}</span>
                                                                </td>
                                                                <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.8rem', color: 'var(--staff-text-muted)' }}>{log.teacherName}</td>
                                                                <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}>
                                                                    <span className={`status-badge status-${log.status}`}>
                                                                        {log.status === 'present' ? <Check size={11} /> : <XCircle size={11} />}
                                                                        {log.status.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* =========================================================
                            3. PDF TASKS & UPLOADS
                            ========================================================= */}
                        {activeTab === 'assignments' && (
                            <div className="staff-card full">
                                <div className="card-header">
                                    <div>
                                        <h3>Coursework & PDF Document Submissions</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>
                                            Assigned specifically to {studentData.grade} {studentData.section ? `(Section ${studentData.section})` : ''} • Auto-compressed to &le; 500 KB
                                        </p>
                                    </div>
                                </div>

                                {studentAssignments.length === 0 ? (
                                    <div className="empty-sub-card">
                                        <Layers size={32} color="var(--staff-primary)" />
                                        <h4>No Tasks Assigned</h4>
                                        <p>Your teachers have not assigned any coursework or tests for your section yet.</p>
                                    </div>
                                ) : (
                                    <div className="student-assignments-grid">
                                        {studentAssignments.map(task => {
                                            const submission = submissionsList.find(sub => sub.taskId === task.id);
                                            const selectedFile = pdfBase64Map[task.id];

                                            return (
                                                <div key={task.id} className="assignment-display-card">
                                                    <div className="assignment-badge-row">
                                                        <span className={`task-badge badge-${task.type.toLowerCase().replace(/\s+/g, '')}`}>
                                                            {task.type}
                                                        </span>
                                                        <span className="due-date-pill">Due: {task.dueDate}</span>
                                                    </div>

                                                    <h4>{task.title}</h4>

                                                    <div className="assignment-meta-details">
                                                        <span><strong>Subject:</strong> {task.subject}</span>
                                                        <span><strong>Faculty:</strong> {task.staffName || 'Teacher'}</span>
                                                    </div>

                                                    {task.description && (
                                                        <p className="assignment-body-desc">{task.description}</p>
                                                    )}

                                                    <div className="pdf-upload-wrapper">
                                                        {submission ? (
                                                            <div className="submission-completed-box">
                                                                <div className="submission-file-meta">
                                                                    <FileCheck size={16} color="var(--accent-emerald)" />
                                                                    <div>
                                                                        <strong>{submission.fileName || 'Assignment.pdf'}</strong>
                                                                        <span style={{ fontSize: '0.68rem', display: 'block', color: 'var(--staff-text-muted)' }}>
                                                                            {submission.obtainedMarks !== undefined ? `Graded: ${submission.obtainedMarks}/100` : 'Submitted (Pending Review)'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href={submission.pdfData}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="view-pdf-link"
                                                                >
                                                                    <ExternalLink size={13} /> Preview PDF
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <div className="upload-action-box">
                                                                <label className="pdf-file-label">
                                                                    <Upload size={14} />
                                                                    <span>{selectedFile ? selectedFile.fileName : 'Upload Assignment PDF (Auto-compressed to 500KB)'}</span>
                                                                    <input
                                                                        type="file"
                                                                        accept="application/pdf"
                                                                        onChange={(e) => handlePdfUpload(task.id, e.target.files[0])}
                                                                        disabled={isCompressing}
                                                                        style={{ display: 'none' }}
                                                                    />
                                                                </label>

                                                                {isCompressing && uploadingTaskId === task.id && (
                                                                    <div className="compressing-pill">
                                                                        <Loader2 size={12} className="spin-icon" /> Compressing PDF &lt; 500KB...
                                                                    </div>
                                                                )}

                                                                {selectedFile && (
                                                                    <div className="pdf-ready-row">
                                                                        <span className="pdf-ready-tag">
                                                                            Ready: {selectedFile.fileSize}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            className="submit-pdf-btn"
                                                                            onClick={() => handleSubmitAssignmentPdf(task.id, task.title)}
                                                                        >
                                                                            <Check size={14} /> Turn In PDF
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========================================================
                            4. CLASS ROUTINE / TIMETABLE
                            ========================================================= */}
                        {activeTab === 'schedule' && (
                            <div className="staff-card full">
                                <div className="card-header">
                                    <div>
                                        <h3>Class Timetable — {studentData.grade} {studentData.section ? `Section ${studentData.section}` : ''}</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>
                                            Synchronized live with administrator and faculty allocations
                                        </p>
                                    </div>
                                    <button className="print-schedule-btn" onClick={printTimetable}>
                                        <Printer size={14} /> Print / Export Timetable
                                    </button>
                                </div>

                                <div className="student-timetable-wrapper">
                                    <table className="student-timetable-table">
                                        <thead>
                                            <tr>
                                                <th className="day-col-header">Day</th>
                                                {timeSlots.map((slot) => (
                                                    <th key={slot}>{slot}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {weekDays.map((day) => (
                                                <tr key={day}>
                                                    <td className="day-name-cell"><strong>{day}</strong></td>
                                                    {timeSlots.map((slot) => {
                                                        const match = studentSchedule.find((item) => {
                                                            const isDayMatch = cleanString(item.day) === cleanString(day);
                                                            const isTimeMatch = cleanTime(item.timeSlot) === cleanTime(slot) ||
                                                                cleanTime(item.timeSlot).includes(cleanTime(slot)) ||
                                                                cleanTime(slot).includes(cleanTime(item.timeSlot));
                                                            return isDayMatch && isTimeMatch;
                                                        });

                                                        return (
                                                            <td key={slot} className="slot-td">
                                                                {match && (
                                                                    <div className="student-slot-card">
                                                                        <span className="slot-subject">{match.subject}</span>
                                                                        <span className="slot-teacher">{match.teacherName || 'Faculty'}</span>
                                                                        {match.roomNo && match.roomNo !== 'N/A' && (
                                                                            <span className="slot-room">Rm: {match.roomNo}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* =========================================================
                            5. EXAMINATION MARKS (Subject-Wise & Term Filter)
                            ========================================================= */}
                        {activeTab === 'marks' && (
                            <div className="staff-card full">
                                <div className="card-header">
                                    <div>
                                        <h3>Academic Progress & Assessment Marks</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>
                                            Published Report Card for {studentData.name} (#{studentData.rollNo})
                                        </p>
                                    </div>
                                    <div className="exam-filter-group">
                                        <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--staff-text-muted)' }}>Filter Exam:</label>
                                        <select 
                                            className="custom-select"
                                            value={selectedExamView}
                                            onChange={(e) => setSelectedExamView(e.target.value)}
                                        >
                                            <option value="All">All Examinations</option>
                                            {examList.map(exam => (
                                                <option key={exam} value={exam}>{exam}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {filteredMarksEntries.length === 0 ? (
                                    <div className="empty-sub-card">
                                        <Award size={32} color="var(--staff-primary)" />
                                        <h4>No Marks Published For This Filter</h4>
                                        <p>Scores will appear here once your faculty publishes evaluation marks.</p>
                                    </div>
                                ) : (
                                    <div className="marks-table-wrapper">
                                        <table className="custom-marks-table">
                                            <thead>
                                                <tr>
                                                    <th>Exam Term</th>
                                                    <th>Subject</th>
                                                    <th>Max Marks</th>
                                                    <th>Score Obtained</th>
                                                    <th>Performance Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredMarksEntries.map((item, idx) => {
                                                    const numScore = Number(item.score);
                                                    let grade = 'A+';
                                                    let gradeClass = 'grade-a-plus';
                                                    if (numScore < 40) { grade = 'Needs Improvement'; gradeClass = 'grade-fail'; }
                                                    else if (numScore < 60) { grade = 'B'; gradeClass = 'grade-b'; }
                                                    else if (numScore < 80) { grade = 'A'; gradeClass = 'grade-a'; }

                                                    return (
                                                        <tr key={idx}>
                                                            <td><strong style={{ color: 'var(--staff-primary)' }}>{item.examName}</strong></td>
                                                            <td><span className="topic-badge">{item.subject}</span></td>
                                                            <td>100</td>
                                                            <td><span className="table-score-badge">{numScore} / 100</span></td>
                                                            <td><span className={`grade-badge ${gradeClass}`}>{grade}</span></td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========================================================
                            6. SUBMISSION HISTORY TAB
                            ========================================================= */}
                        {activeTab === 'submissions' && (
                            <div className="staff-card full">
                                <div className="card-header">
                                    <div>
                                        <h3>Turned-In PDF Submissions History</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>
                                            Record of your uploaded files and faculty grading status
                                        </p>
                                    </div>
                                </div>

                                {submissionsList.length === 0 ? (
                                    <div className="empty-sub-card">
                                        <FileCheck size={32} color="var(--staff-text-muted)" />
                                        <h4>No Turned-In Assignments</h4>
                                        <p>You haven't uploaded any PDF coursework yet. Visit the Tasks tab to submit assignments.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Assignment Title</th>
                                                    <th>Submitted Document</th>
                                                    <th>Submission Date</th>
                                                    <th>Review Status</th>
                                                    <th>Score / Marks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {submissionsList.map((sub) => (
                                                    <tr key={sub.id}>
                                                        <td><strong>{sub.taskTitle || 'Coursework'}</strong></td>
                                                        <td>
                                                            <a href={sub.pdfData} target="_blank" rel="noreferrer" className="pdf-preview-link">
                                                                <ExternalLink size={12} /> {sub.fileName || 'Assignment.pdf'} ({sub.fileSize || '< 500 KB'})
                                                            </a>
                                                        </td>
                                                        <td style={{ fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>
                                                            {sub.submittedAt?.toDate ? sub.submittedAt.toDate().toLocaleString() : 'Recent'}
                                                        </td>
                                                        <td>
                                                            {sub.obtainedMarks !== undefined ? (
                                                                <span className="status-badge status-present">
                                                                    <Check size={11} /> GRADED
                                                                </span>
                                                            ) : (
                                                                <span className="status-badge status-absent">
                                                                    <Clock size={11} /> IN REVIEW
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {sub.obtainedMarks !== undefined ? (
                                                                <strong style={{ color: 'var(--staff-primary)', fontSize: '0.9rem' }}>
                                                                    {sub.obtainedMarks} / 100
                                                                </strong>
                                                            ) : (
                                                                <span style={{ color: 'var(--staff-text-muted)', fontSize: '0.75rem' }}>Pending</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========================================================
                            7. NOTICES & CIRCULARS
                            ========================================================= */}
                        {activeTab === 'notices' && (
                            <div className="staff-card full">
                                <div className="card-header">
                                    <h3>Campus Circulars & Bulletins</h3>
                                </div>
                                <div className="full-notices-container">
                                    {announcements.map((item) => (
                                        <div key={item.id} className="bulletin-card">
                                            <div className="bulletin-header">
                                                <span className="bulletin-tag">Official Notice</span>
                                                <span className="bulletin-date">
                                                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Live'}
                                                </span>
                                            </div>
                                            <p>{item.content}</p>
                                        </div>
                                    ))}
                                    {announcements.length === 0 && (
                                        <div className="empty-sub-card">
                                            <Bell size={28} />
                                            <p>No circulars posted at this time.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}