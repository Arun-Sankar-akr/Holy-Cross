import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import {
    collection, onSnapshot, doc, updateDoc, writeBatch
} from 'firebase/firestore';
import {
    Users, Calendar, BookOpen, FileText, Bell, CheckCircle, Clock,
    LogOut, Search, Menu, X, Check, GraduationCap, ArrowLeft,
    Folder, KeyRound, Sparkles, ChevronDown
} from 'lucide-react';
import './StaffDashboard.css';

export default function StaffDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [academicMenuOpen, setAcademicMenuOpen] = useState(true);

    const [staffData, setStaffData] = useState({ name: 'Dr. R. Sharma', department: 'Senior Math Faculty' });
    const [selectedClass, setSelectedClass] = useState('10th Std');
    const [selectedSection, setSelectedSection] = useState(null);

    const [allStudents, setAllStudents] = useState([]);
    const [sectionsList, setSectionsList] = useState([]);

    const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
    const [studentMarks, setStudentMarks] = useState({});
    const [examType, setExamType] = useState('Mid-Term Assessment');
    const [marksSubmitted, setMarksSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const classList = [
        'LKG', 'UKG',
        '1st Std', '2nd Std', '3rd Std', '4th Std', '5th Std',
        '6th Std', '7th Std', '8th Std', '9th Std', '10th Std',
        '11th Std', '12th Std'
    ];

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('staffUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setStaffData({
                    name: user.name || 'Dr. R. Sharma',
                    department: user.department || 'Faculty'
                });
            } catch (err) {
                console.error("Failed to parse user data", err);
            }
        }
    }, []);

    useEffect(() => {
        const unsubStudents = onSnapshot(collection(db, 'students_records'), (snap) => {
            const fetchedStudents = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                status: d.data().status || 'present'
            }));
            setAllStudents(fetchedStudents);
        }, (error) => {
            console.error("Firestore error loading students:", error);
        });

        const unsubSections = onSnapshot(collection(db, 'class_sections'), (snap) => {
            setSectionsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error("Firestore error loading sections:", error);
        });

        return () => {
            unsubStudents();
            unsubSections();
        };
    }, []);

    const getActiveStudents = () => {
        return allStudents.filter(student => {
            if (!selectedClass) return false;
            const matchesClass = student.className &&
                student.className.toLowerCase() === selectedClass.toLowerCase();

            if (selectedSection && selectedSection.id) {
                return matchesClass && (student.sectionId === selectedSection.id || student.sectionName === selectedSection.name);
            }
            return matchesClass;
        });
    };

    const activeStudents = getActiveStudents();

    const handleLogout = () => {
        localStorage.removeItem('staffUser');
        navigate('/');
    };

    const toggleAttendance = async (studentDocId, currentStatus) => {
        const newStatus = currentStatus === 'present' ? 'absent' : 'present';

        setAllStudents(prev => prev.map(student =>
            student.id === studentDocId ? { ...student, status: newStatus } : student
        ));

        try {
            await updateDoc(doc(db, 'students_records', studentDocId), {
                status: newStatus,
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error updating attendance: ", error);
        }
    };

    const handleSubmitAttendance = async () => {
        setIsSubmitting(true);
        try {
            const batch = writeBatch(db);
            activeStudents.forEach(student => {
                const studentRef = doc(db, 'students_records', student.id);
                batch.update(studentRef, {
                    status: student.status || 'present',
                    lastAttendanceDate: new Date().toISOString()
                });
            });
            await batch.commit();
            setAttendanceSubmitted(true);
        } catch (error) {
            console.error("Batch attendance submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkChange = (studentId, value) => {
        setStudentMarks(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    const handleSubmitMarks = async () => {
        setIsSubmitting(true);
        try {
            const batch = writeBatch(db);
            Object.entries(studentMarks).forEach(([studentId, score]) => {
                const studentRef = doc(db, 'students_records', studentId);
                batch.update(studentRef, {
                    [`marks.${examType}`]: Number(score),
                    lastMarksUpdated: new Date().toISOString()
                });
            });
            await batch.commit();
            setMarksSubmitted(true);
        } catch (error) {
            console.error("Error saving marks: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = [
        { title: 'Total Classes', value: '4 Today', icon: BookOpen, color: 'indigo' },
        { title: 'Assigned Roster', value: allStudents.length.toString(), icon: Users, color: 'rose' },
        { title: 'Pending Marks', value: '2 Exams', icon: FileText, color: 'amber' },
        { title: 'Attendance Rate', value: '98%', icon: CheckCircle, color: 'emerald' },
    ];

    const todaySchedule = [
        { time: '09:00 AM - 09:45 AM', class: '10th Std', section: 'A', subject: 'Mathematics', room: 'Room 204' },
        { time: '10:00 AM - 10:45 AM', class: '9th Std', section: 'B', subject: 'Physics', room: 'Lab 2' },
        { time: '11:30 AM - 12:15 PM', class: '11th Std', section: 'A', subject: 'Mathematics', room: 'Room 301' },
        { time: '02:00 PM - 02:45 PM', class: '10th Std', section: 'B', subject: 'Mathematics', room: 'Room 205' },
    ];

    const announcements = [
        { id: 1, title: 'Term-1 Exam Marks Submission', date: 'Deadline: Aug 20, 2026', type: 'urgent' },
        { id: 2, title: 'Staff Council Meeting', date: 'Tomorrow at 03:30 PM', type: 'info' },
        { id: 3, title: 'Independence Day Event Photos Uploaded', date: 'Aug 15, 2026', type: 'normal' },
    ];

    const filteredStudents = activeStudents.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="dashboard-containers">
            {/* Mobile & Tablet Topbar Header */}
            <header className="mobile-topbar">
                <div className="mobile-brand">
                    <Sparkles size={20} />
                    <span>EduPulse</span>
                </div>
                <button
                    className="menu-toggle-btn"
                    aria-label="Toggle Sidebar"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Overlay when sidebar is open */}
            {isMobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-icon">
                        <Sparkles size={20} />
                    </div>
                    <span className="brand-titles">EduPulse</span>
                </div>

                <div className="sidebar-user">
                    <div className="user-avatar">{staffData.name.charAt(0)}</div>
                    <div className="user-info">
                        <span className="user-name">{staffData.name}</span>
                        <span className="user-role">{staffData.department}</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-links ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                    >
                        <div className="nav-links-content">
                            <BookOpen size={18} />
                            <span>Dashboard</span>
                        </div>
                    </button>

                    <div className="nav-group">
                        <button
                            className={`nav-links ${academicMenuOpen ? 'expanded' : ''}`}
                            onClick={() => setAcademicMenuOpen(!academicMenuOpen)}
                        >
                            <div className="nav-links-content">
                                <GraduationCap size={18} />
                                <span>Academic Management</span>
                            </div>
                            <ChevronDown size={16} className="chevron" />
                        </button>

                        {academicMenuOpen && (
                            <div className="sub-menu">
                                <button
                                    className={`sub-link ${activeTab === 'students' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('students'); setIsMobileMenuOpen(false); }}
                                >
                                    Student Roster
                                </button>
                                <button
                                    className={`sub-link ${activeTab === 'attendance' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('attendance'); setIsMobileMenuOpen(false); }}
                                >
                                    Attendance
                                </button>
                                <button
                                    className={`sub-link ${activeTab === 'marks' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('marks'); setIsMobileMenuOpen(false); }}
                                >
                                    Marks Entry
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className={`nav-links ${activeTab === 'schedule' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('schedule'); setIsMobileMenuOpen(false); }}
                    >
                        <div className="nav-links-content">
                            <Calendar size={18} />
                            <span>Class Schedule</span>
                        </div>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Section */}
            <main className="dashboard-main">
                <header className="dashboard-topbar">
                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search student records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="topbar-actions">
                        <div className="notification-wrapper" style={{ position: 'relative' }}>
                            <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                                <Bell size={18} />
                                <span className="notification-badge">{announcements.length}</span>
                            </button>
                            {showNotifications && (
                                <div className="notification-dropdown">
                                    <div className="dropdown-header">
                                        <h4>Notifications</h4>
                                        <span className="badge-count">{announcements.length} New</span>
                                    </div>
                                    <ul>
                                        {announcements.map((a) => (
                                            <li key={a.id} className={`notify-item ${a.type}`}>
                                                <strong>{a.title}</strong>
                                                <span>{a.date}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    {activeTab === 'overview' && (
                        <>
                            <div className="welcome-banner">
                                <h2>Welcome back, {staffData.name}! 👋</h2>
                                <p>You have 4 classes scheduled for today. Track student rosters and performance effortlessly.</p>
                            </div>

                            <div className="stats-grid">
                                {stats.map((stat, idx) => {
                                    const IconComponent = stat.icon;
                                    return (
                                        <div key={idx} className="stat-card">
                                            <div className={`stat-icon bg-${stat.color}`}>
                                                <IconComponent size={22} />
                                            </div>
                                            <div className="stat-details">
                                                <span className="stat-title">{stat.title}</span>
                                                <div className="stat-value">{stat.value}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="content-grid">
                                <div className="dash-card">
                                    <div className="card-header">
                                        <div>
                                            <h3>Today's Schedule</h3>
                                            <p className="subtitle">Classes assigned for today</p>
                                        </div>
                                        <Clock size={18} />
                                    </div>
                                    <div className="schedule-list">
                                        {todaySchedule.map((item, idx) => (
                                            <div key={idx} className="schedule-item">
                                                <div className="time-pill">{item.time}</div>
                                                <div className="class-details">
                                                    <strong>{item.class} (Sec {item.section}) — {item.subject}</strong>
                                                    <span>{item.room}</span>
                                                </div>
                                                <button
                                                    className="action-btn"
                                                    onClick={() => {
                                                        setSelectedClass(item.class);
                                                        const matchedSec = sectionsList.find(s => s.className === item.class && s.name.includes(item.section));
                                                        setSelectedSection(matchedSec || null);
                                                        setActiveTab('attendance');
                                                    }}
                                                >
                                                    Take Attendance
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="dash-card">
                                    <div className="card-header">
                                        <div>
                                            <h3>Notice Board</h3>
                                            <p className="subtitle">Latest announcements & updates</p>
                                        </div>
                                        <Bell size={18} />
                                    </div>
                                    <div className="announcement-list">
                                        {announcements.map((item) => (
                                            <div key={item.id} className={`announcement-item type-${item.type}`}>
                                                <h4>{item.title}</h4>
                                                <span>{item.date}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'students' && (
                        <div className="dash-card full-width">
                            {/* VIEW 1: SELECT CLASS */}
                            {!selectedClass && (
                                <>
                                    <div className="card-header">
                                        <div>
                                            <h3>Students Directory — Select Class</h3>
                                            <p className="subtitle">Select a class to browse corresponding sections and student rosters.</p>
                                        </div>
                                    </div>
                                    <div className="class-cards-grid">
                                        {classList.map((cls) => {
                                            const countSections = sectionsList.filter(s => s.className === cls).length;
                                            const countStudents = allStudents.filter(s => s.className === cls).length;

                                            return (
                                                <div
                                                    key={cls}
                                                    className="class-card"
                                                    onClick={() => {
                                                        setSelectedClass(cls);
                                                        setSelectedSection(null);
                                                    }}
                                                >
                                                    <div className="class-card-icon">
                                                        <GraduationCap size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: 0 }}>{cls}</h4>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {countSections} Sections • {countStudents} Students
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* VIEW 2: SELECT SECTION */}
                            {selectedClass && !selectedSection && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <button
                                            className="back-btn"
                                            onClick={() => {
                                                setSelectedClass(null);
                                                setSelectedSection(null);
                                            }}
                                        >
                                            <ArrowLeft size={16} /> Back to All Classes
                                        </button>
                                        <h3 style={{ margin: 0 }}>{selectedClass} Sections</h3>
                                    </div>

                                    {sectionsList.filter(s => s.className === selectedClass).length === 0 ? (
                                        <div>No sections registered for {selectedClass}.</div>
                                    ) : (
                                        <div className="sections-grid">
                                            {sectionsList.filter(s => s.className === selectedClass).map(sec => {
                                                const studentCount = allStudents.filter(st => st.sectionId === sec.id || (st.className === selectedClass && st.sectionName === sec.name)).length;
                                                return (
                                                    <div key={sec.id} className="section-card" onClick={() => setSelectedSection(sec)}>
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            <Folder size={22} color="var(--primary)" />
                                                            <div>
                                                                <h5 style={{ margin: 0 }}>{sec.name}</h5>
                                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                    {sec.roomNo ? `Room: ${sec.roomNo} • ` : ''}{studentCount} Students
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* VIEW 3: STUDENT ROSTER */}
                            {selectedClass && selectedSection && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <button className="back-btn" onClick={() => setSelectedSection(null)}>
                                            <ArrowLeft size={16} /> Back to Sections
                                        </button>
                                        <h3 style={{ margin: 0 }}>
                                            {selectedClass} — {selectedSection?.name} Student Directory
                                        </h3>
                                    </div>

                                    {filteredStudents.length === 0 ? (
                                        <div>No student records in this section.</div>
                                    ) : (
                                        <div>
                                            {filteredStudents.map(st => (
                                                <div key={st.id} className="student-detail-card">
                                                    <div className="student-card-content">
                                                        <img
                                                            src={st.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop'}
                                                            alt={st.name}
                                                            className="student-avatar"
                                                        />
                                                        <div>
                                                            <div className="student-header-row">
                                                                <h5 style={{ margin: 0 }}>{st.name}</h5>
                                                                {st.bloodGroup && <span className="blood-badge">{st.bloodGroup}</span>}
                                                            </div>
                                                            <p className="student-meta">
                                                                <strong>Adm No:</strong> <code>{st.admissionNo}</code> | <strong>Status:</strong> <span className={`status-badge status-${st.status || 'present'}`}>{(st.status || 'present').toUpperCase()}</span>
                                                            </p>
                                                            <p className="student-meta">
                                                                <strong>DOB:</strong> {st.dob || 'N/A'} | <strong>Parent:</strong> {st.guardianName} ({st.phone})
                                                            </p>
                                                            <div className="student-credentials-box">
                                                                <KeyRound size={14} />
                                                                <span>ERP Login: User ID: <strong>{st.admissionNo}</strong> | Password: <strong>{st.dob}</strong></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Mark Attendance</h3>
                                    <p className="subtitle">Synchronized live status for {selectedClass} {selectedSection ? `(${selectedSection.name})` : ''}</p>
                                </div>
                                <select
                                    className="custom-select"
                                    value={selectedClass || ''}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value);
                                        setSelectedSection(null);
                                        setAttendanceSubmitted(false);
                                    }}
                                >
                                    {classList.map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </div>

                            {attendanceSubmitted && (
                                <div style={{ color: 'var(--primary)', padding: '8px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Check size={18} /> Attendance submitted successfully!
                                </div>
                            )}

                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Admission No</th>
                                            <th>Student Name</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem' }}>
                                                    No student records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStudents.map((student) => (
                                                <tr key={student.id}>
                                                    <td>#{student.admissionNo || student.id.slice(0, 6)}</td>
                                                    <td>{student.name}</td>
                                                    <td>
                                                        <span className={`status-badge status-${student.status || 'present'}`}>
                                                            {(student.status || 'present').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button
                                                            className={`toggle-btn ${student.status || 'present'}`}
                                                            onClick={() => toggleAttendance(student.id, student.status || 'present')}
                                                        >
                                                            Mark {student.status === 'present' ? 'Absent' : 'Present'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="card-footer">
                                <button className="btn-primary" onClick={handleSubmitAttendance} disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'marks' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Enter Examination Marks</h3>
                                    <p className="subtitle">Syncing scores for {selectedClass}</p>
                                </div>
                            </div>

                            {marksSubmitted && (
                                <div style={{ color: 'var(--primary)', padding: '8px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Check size={18} /> Marks saved successfully!
                                </div>
                            )}

                            <div className="form-grid">
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>Select Class</label>
                                    <select
                                        className="custom-select full-width"
                                        value={selectedClass || ''}
                                        onChange={(e) => {
                                            setSelectedClass(e.target.value);
                                            setSelectedSection(null);
                                        }}
                                    >
                                        {classList.map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>Exam Type</label>
                                    <select className="custom-select full-width" value={examType} onChange={(e) => setExamType(e.target.value)}>
                                        <option value="Mid-Term Assessment">Mid-Term Assessment</option>
                                        <option value="Final Examination">Final Examination</option>
                                        <option value="Class Unit Test">Class Unit Test</option>
                                    </select>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Admission No</th>
                                            <th>Student Name</th>
                                            <th>Max Marks</th>
                                            <th>Marks Obtained</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem' }}>
                                                    No students available.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStudents.map((student) => (
                                                <tr key={student.id}>
                                                    <td>#{student.admissionNo || student.id.slice(0, 6)}</td>
                                                    <td>{student.name}</td>
                                                    <td>100</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className="table-input"
                                                            placeholder="0-100"
                                                            value={studentMarks[student.id] ?? (student.marks?.[examType] ?? '')}
                                                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="card-footer">
                                <button className="btn-primary" onClick={handleSubmitMarks} disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save & Publish Marks'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Weekly Timetable</h3>
                                    <p className="subtitle">Overview of your routine classes</p>
                                </div>
                            </div>
                            <div className="timetable-grid">
                                {todaySchedule.map((item, idx) => (
                                    <div key={idx} className="timetable-card">
                                        <div className="time-pill" style={{ marginBottom: '8px', display: 'inline-block' }}>
                                            {item.time}
                                        </div>
                                        <h4 style={{ margin: '0 0 4px 0' }}>{item.subject}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Class: {item.class} (Sec {item.section}) | {item.room}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}