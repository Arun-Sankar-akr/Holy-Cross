import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Calendar,
    Award,
    CheckCircle,
    Bell,
    Search,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Clock,
    FileText,
    Download,
    TrendingUp,
    User
} from 'lucide-react';
import './StudentDashboard.css';

export default function StudentDashboard() {
    const [activeTab, setActiveTab] = useState('grades');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [studentData, setStudentData] = useState({ name: 'Aarav Smith', grade: 'Class X - A', rollNo: '101' });

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('studentUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setStudentData({
                    name: user.name || 'Aarav Smith',
                    grade: user.grade || 'Class X - A',
                    rollNo: user.rollNo || '101'
                });
            } catch (err) {
                console.error("Failed to parse user data", err);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('studentUser');
        navigate('/');
    };

    const stats = [
        { title: 'Attendance Rate', value: '94%', icon: CheckCircle, badge: '+2.4%', color: 'emerald' },
        { title: 'Current GPA', value: '3.8 / 4.0', icon: Award, badge: 'Top 5%', color: 'teal' },
        { title: 'Today\'s Classes', value: '4 Sessions', icon: BookOpen, badge: 'On Time', color: 'green' },
        { title: 'Pending Tasks', value: '2 Due', icon: FileText, badge: 'High Priority', color: 'amber' },
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
        { id: 1, title: 'Term-1 Exam Schedule Published', date: 'Aug 14, 2026', tag: 'Urgent', color: 'amber' },
        { id: 2, title: 'Sports Day Practice Starts Tomorrow', date: 'Aug 15, 2026', tag: 'Event', color: 'emerald' },
        { id: 3, title: 'Library Book Return Reminder', date: 'Aug 18, 2026', tag: 'Notice', color: 'teal' },
    ];

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

            {/* Main Inner Layout Grid */}
            <div className="staff-layout-grid">
                {/* Left Sidebar */}
                <aside className={`staff-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    <div className="staff-user-profile font-bold">
                        <div className="staff-avatar-ring">
                            <User size={20} />
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

                {/* Main Content Workspace */}
                <div className="staff-main-workspace">
                    {/* Top Action Bar */}
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

                    {/* Content View Container */}
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