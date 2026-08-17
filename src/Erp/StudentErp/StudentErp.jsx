import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
    GraduationCap,
    Lock,
    ArrowRight,
    ShieldCheck,
    BookOpen,
    Calendar,
    Award,
    CheckCircle,
    Bell,
    Search,
    LogOut,
    Menu,
    X,
    Clock,
    FileText,
    Download,
    TrendingUp,
    User
} from 'lucide-react';
import './ErpPages.css';
import './StudentDashboard.css';

export default function StudentErp() {
    const navigate = useNavigate();

    // Login Form State
    const [credentials, setCredentials] = useState({ registerNo: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [studentData, setStudentData] = useState(null);

    // Dashboard Internal State
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);

    // Check for existing session on initial render
    useEffect(() => {
        const storedUser = localStorage.getItem('studentUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setStudentData(user);
                setIsLoggedIn(true);
            } catch (err) {
                console.error("Failed to restore session", err);
            }
        }
    }, []);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Query Firestore for student matching Admission No
            const studentsRef = collection(db, 'students_records');
            const q = query(studentsRef, where('admissionNo', '==', credentials.registerNo.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('No student record found with this Admission / Register Number.');
                setLoading(false);
                return;
            }

            const studentDoc = querySnapshot.docs[0];
            const rawData = { id: studentDoc.id, ...studentDoc.data() };

            // Password verification against DOB
            if (rawData.dob === credentials.password.trim()) {
                const sessionData = {
                    name: rawData.name || 'Student Name',
                    grade: `${rawData.className || 'Class'} - ${rawData.sectionName || 'Sec'}`,
                    rollNo: rawData.admissionNo || credentials.registerNo,
                    photo: rawData.photo || null,
                    guardianName: rawData.guardianName || 'N/A',
                    phone: rawData.phone || 'N/A',
                    dob: rawData.dob || 'N/A',
                    address: rawData.address || ''
                };

                // Save to localStorage & update state
                localStorage.setItem('studentUser', JSON.stringify(sessionData));
                setStudentData(sessionData);
                setIsLoggedIn(true);

                // Optional: Navigate to dedicated dashboard route if using standalone routing
                // navigate('/dashboard');
            } else {
                setError('Invalid password or Date of Birth. Please try again.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('studentUser');
        setIsLoggedIn(false);
        setStudentData(null);
        setCredentials({ registerNo: '', password: '' });
        navigate('/');
    };

    // --- DASHBOARD METRICS DATA ---
    const stats = [
        { title: 'Attendance Rate', value: '94%', icon: CheckCircle, badge: '+2.4%' },
        { title: 'Current GPA', value: '3.8 / 4.0', icon: Award, badge: 'Top 5%' },
        { title: 'Today\'s Classes', value: '4 Sessions', icon: BookOpen, badge: 'On Time' },
        { title: 'Pending Tasks', value: '2 Due', icon: FileText, badge: 'High Priority' },
    ];

    const todaySchedule = [
        { time: '09:00 - 09:45 AM', subject: 'Mathematics', teacher: 'Dr. R. Sharma', room: 'Room 204' },
        { time: '10:00 - 10:45 AM', subject: 'Physics', teacher: 'Prof. A. Verma', room: 'Lab 2' },
        { time: '11:30 - 12:15 PM', subject: 'English Literature', teacher: 'Mrs. S. Gupta', room: 'Room 102' },
        { time: '02:00 - 02:45 PM', subject: 'Computer Science', teacher: 'Mr. K. Nair', room: 'Lab 1' },
    ];

    const subjectGrades = [
        { subject: 'Mathematics', score: '92 / 100', grade: 'A+', status: 'Passed' },
        { subject: 'Physics', score: '88 / 100', grade: 'A', status: 'Passed' },
        { subject: 'English Literature', score: '79 / 100', grade: 'B+', status: 'Passed' },
        { subject: 'Computer Science', score: '95 / 100', grade: 'A+', status: 'Passed' },
    ];

    const announcements = [
        { id: 1, title: 'Term-1 Exam Schedule Published', date: 'Aug 14, 2026', tag: 'Urgent' },
        { id: 2, title: 'Sports Day Practice Starts Tomorrow', date: 'Aug 15, 2026', tag: 'Event' },
        { id: 3, title: 'Library Book Return Reminder', date: 'Aug 18, 2026', tag: 'Notice' },
    ];

    // --- VIEW 1: AUTHENTICATED STUDENT DASHBOARD ---
    if (isLoggedIn && studentData) {
        return (
            <div className="staff-style-dashboard">
                {/* Mobile Navigation Toggle Bar */}
                <div className="staff-mobile-toggle-bar">
                    <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        <span>Student Portal Menu</span>
                    </button>
                </div>

                {/* Mobile Overlay */}
                {isMobileMenuOpen && (
                    <div className="staff-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
                )}

                {/* Main Layout Grid */}
                <div className="staff-layout-grid">
                    {/* Left Sidebar */}
                    <aside className={`staff-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                        <div className="staff-user-profile font-bold">
                            <div className="staff-avatar-ring">
                                {studentData.photo ? (
                                    <img
                                        src={studentData.photo}
                                        alt={studentData.name}
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                            <div className="staff-user-info">
                                <h4>{studentData.name}</h4>
                                <p>{studentData.grade} • #{studentData.rollNo}</p>
                            </div>
                        </div>

                        <div className="staff-sidebar-label">MAIN NAVIGATION</div>

                        <nav className="staff-nav-list">
                            <button
                                className={`staff-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                            >
                                <BookOpen size={18} />
                                <span>Overview</span>
                            </button>
                            <button
                                className={`staff-nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('attendance'); setIsMobileMenuOpen(false); }}
                            >
                                <CheckCircle size={18} />
                                <span>Attendance</span>
                            </button>
                            <button
                                className={`staff-nav-item ${activeTab === 'grades' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('grades'); setIsMobileMenuOpen(false); }}
                            >
                                <Award size={18} />
                                <span>Grades & Report</span>
                            </button>
                            <button
                                className={`staff-nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('schedule'); setIsMobileMenuOpen(false); }}
                            >
                                <Calendar size={18} />
                                <span>Timetable</span>
                            </button>
                        </nav>

                        <div className="staff-sidebar-footer">
                            <button className="staff-signout-btn" onClick={handleLogout}>
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </aside>

                    {/* Main Workspace Area */}
                    <div className="staff-main-workspace">
                        {/* Top Action Header */}
                        <header className="staff-top-header">
                            <div className="staff-search-input-group">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search records, subjects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="staff-top-actions">
                                <div className="notif-wrapper">
                                    <button className="staff-icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                                        <Bell size={18} />
                                        <span className="notif-badge"></span>
                                    </button>
                                    {showNotifications && (
                                        <div className="staff-notif-menu">
                                            <div className="notif-header">
                                                <span>Notifications</span>
                                                <span className="count-tag">{announcements.length} New</span>
                                            </div>
                                            <div className="notif-items">
                                                {announcements.map((a) => (
                                                    <div key={a.id} className="notif-item">
                                                        <div className="notif-title">{a.title}</div>
                                                        <div className="notif-date">{a.date}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* Workspace Tab Contents */}
                        <div className="staff-content-container">
                            {activeTab === 'overview' && (
                                <>
                                    <div className="staff-welcome-card">
                                        <div>
                                            <h2>Welcome back, <span className="green-accent">{studentData.name}</span></h2>
                                            <p>You have 4 scheduled classes today. Term 1 grades have been updated.</p>
                                        </div>
                                        <div className="staff-pill font-mono">
                                            <TrendingUp size={16} /> Status: Active
                                        </div>
                                    </div>

                                    <div className="staff-stats-grid">
                                        {stats.map((s, idx) => {
                                            const IconComp = s.icon;
                                            return (
                                                <div key={idx} className="staff-stat-box">
                                                    <div className="stat-head">
                                                        <div className="stat-icon-bg">
                                                            <IconComp size={18} />
                                                        </div>
                                                        <span className="stat-tag">{s.badge}</span>
                                                    </div>
                                                    <div className="stat-body">
                                                        <span className="stat-title">{s.title}</span>
                                                        <h3 className="stat-val">{s.value}</h3>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="staff-two-col-grid">
                                        <div className="staff-card">
                                            <div className="card-header">
                                                <h3>Today's Schedule</h3>
                                                <Clock size={16} className="muted-icon" />
                                            </div>
                                            <div className="card-list">
                                                {todaySchedule.map((item, idx) => (
                                                    <div key={idx} className="card-list-item">
                                                        <span className="staff-time-pill">{item.time}</span>
                                                        <div>
                                                            <strong>{item.subject}</strong>
                                                            <p>{item.teacher} • {item.room}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="staff-card">
                                            <div className="card-header">
                                                <h3>Notice Board</h3>
                                                <Bell size={16} className="muted-icon" />
                                            </div>
                                            <div className="card-list">
                                                {announcements.map((item) => (
                                                    <div key={item.id} className="card-list-item notice">
                                                        <div className="notice-head">
                                                            <span className="notice-type-pill">{item.tag}</span>
                                                            <span className="notice-time">{item.date}</span>
                                                        </div>
                                                        <h4>{item.title}</h4>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'attendance' && (
                                <div className="staff-card full">
                                    <div className="card-header">
                                        <h3>Attendance History</h3>
                                        <span className="staff-pill font-mono">Overall Rate: 94%</span>
                                    </div>
                                    <div className="staff-table-wrapper">
                                        <table className="staff-data-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Total Classes</th>
                                                    <th>Attended</th>
                                                    <th>Attendance Score</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="font-bold">Mathematics</td>
                                                    <td>30</td>
                                                    <td>29</td>
                                                    <td><span className="staff-status-badge">96.6%</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="font-bold">Physics</td>
                                                    <td>25</td>
                                                    <td>23</td>
                                                    <td><span className="staff-status-badge">92.0%</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="font-bold">English Literature</td>
                                                    <td>20</td>
                                                    <td>19</td>
                                                    <td><span className="staff-status-badge">95.0%</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="font-bold">Computer Science</td>
                                                    <td>20</td>
                                                    <td>18</td>
                                                    <td><span className="staff-status-badge">90.0%</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'grades' && (
                                <div className="staff-card full">
                                    <div className="card-header">
                                        <h3>Academic Gradebook</h3>
                                        <button className="staff-btn-primary" onClick={() => alert("Downloading Report...")}>
                                            <Download size={15} /> Export Report
                                        </button>
                                    </div>
                                    <div className="staff-table-wrapper">
                                        <table className="staff-data-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Score</th>
                                                    <th>Grade</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subjectGrades.map((g, idx) => (
                                                    <tr key={idx}>
                                                        <td className="font-bold">{g.subject}</td>
                                                        <td>{g.score}</td>
                                                        <td className="font-mono green-accent font-bold">{g.grade}</td>
                                                        <td><span className="staff-status-badge">{g.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'schedule' && (
                                <div className="staff-card full">
                                    <div className="card-header">
                                        <h3>Weekly Timetable</h3>
                                    </div>
                                    <div className="staff-schedule-grid">
                                        {todaySchedule.map((item, idx) => (
                                            <div key={idx} className="staff-schedule-box">
                                                <span className="staff-time-pill">{item.time}</span>
                                                <h4>{item.subject}</h4>
                                                <div className="schedule-details">
                                                    <p><strong>Instructor:</strong> {item.teacher}</p>
                                                    <p><strong>Room:</strong> {item.room}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW 2: LOGIN FORM ---
    return (
        <div className="erp-page-container">
            <div className="erp-card">
                <div className="erp-header student-theme">
                    <div className="erp-badge">Student Portal</div>
                    <h2>Student & Parent ERP</h2>
                    <p>View exam results, progress reports, attendance, and fee details.</p>
                </div>

                <form className="erp-form" onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ color: '#d9534f', backgroundColor: '#fdf7f7', border: '1px solid #d9534f', padding: '10px', borderRadius: '6px', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="registerNo">Roll Number / Admission No.</label>
                        <div className="input-wrapper">
                            <GraduationCap size={18} className="input-icon" />
                            <input
                                type="text"
                                id="registerNo"
                                name="registerNo"
                                placeholder="Enter Admission No"
                                value={credentials.registerNo}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password / DOB (YYYY-MM-DD)</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter Date of Birth"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <a href="#forgot" className="forgot-link">Forgot Credentials?</a>
                    </div>

                    <button type="submit" className="erp-btn student-btn" disabled={loading}>
                        <span>{loading ? 'Authenticating...' : 'Login to Student Portal'}</span>
                        <ArrowRight size={18} />
                    </button>
                </form>

                <div className="erp-footer">
                    <ShieldCheck size={16} />
                    <span>For assistance, contact the school administrative office</span>
                </div>
            </div>
        </div>
    );
}