import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
    BookOpen, Calendar, Award, CheckCircle, Bell, Search, LogOut,
    Menu, X, Clock, FileText, User
} from 'lucide-react';
import './StudentDashboard.css';

export default function StudentDashboard() {
    const [activeTab, setActiveTab] = useState('schedule');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [studentData, setStudentData] = useState({ name: 'Student', grade: '', section: '', rollNo: '' });
    const [timetableList, setTimetableList] = useState([]);

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

    // 1. Load Session Data from LocalStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('studentUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setStudentData({
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

    // Normalize strings for fail-safe comparison
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

    // Normalize time formats (e.g., "09.00-09.45" -> "09000945")
    const cleanTime = (str) => {
        if (!str) return '';
        return str.toString().toLowerCase().replace(/\s*(am|pm)\s*/g, '').replace(/[^0-9]/g, '');
    };

    // 2. Real-time Listeners
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

    // 3. Filter Schedule for Logged-In Student
    const studentSchedule = timetableList.filter(item => {
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

    const stats = [
        { title: 'Attendance Rate', value: '94%', icon: CheckCircle },
        { title: 'Current GPA', value: '3.8 / 4.0', icon: Award },
        { title: 'Scheduled Sessions', value: `${studentSchedule.length} Classes`, icon: BookOpen },
        { title: 'Pending Tasks', value: '2 Due', icon: FileText },
    ];

    return (
        <div className="staff-style-dashboard">
            <div className="staff-mobile-toggle-bar">
                <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    <span>Student Portal Menu</span>
                </button>
            </div>

            <div className="staff-layout-grid">
                <aside className={`staff-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    <div className="staff-user-profile font-bold">
                        <div className="staff-avatar-ring"><User size={20} /></div>
                        <div className="staff-user-info">
                            <h4>{studentData.name}</h4>
                            <p>{studentData.grade} {studentData.section ? `— Section ${studentData.section}` : ''} • #{studentData.rollNo}</p>
                        </div>
                    </div>

                    <nav className="staff-nav-list">
                        <button className={`staff-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                            <BookOpen size={18} /><span>Overview</span>
                        </button>
                        <button className={`staff-nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
                            <Calendar size={18} /><span>Timetable</span>
                        </button>
                    </nav>

                    <div className="staff-sidebar-footer">
                        <button className="staff-signout-btn" onClick={handleLogout}>
                            <LogOut size={16} /><span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                <div className="staff-main-workspace">
                    <header className="staff-top-header">
                        <div className="staff-search-input-group">
                            <Search size={16} className="search-icon" />
                            <input type="text" placeholder="Search records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                    </header>

                    <div className="staff-content-container">
                        {activeTab === 'overview' && (
                            <>
                                <div className="staff-welcome-card">
                                    <div>
                                        <h2>Welcome back, <span className="green-accent">{studentData.name}</span></h2>
                                        <p>Viewing profile for {studentData.grade} {studentData.section ? `(Section ${studentData.section})` : ''}</p>
                                    </div>
                                </div>

                                <div className="staff-stats-grid">
                                    {stats.map((s, idx) => (
                                        <div key={idx} className="staff-stat-box">
                                            <span className="stat-title">{s.title}</span>
                                            <h3 className="stat-val">{s.value}</h3>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'schedule' && (
                            <div className="staff-card full">
                                <div className="card-header">
                                    <h3>Weekly Timetable — {studentData.grade} {studentData.section ? `Section ${studentData.section}` : ''}</h3>
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
                                                                        <span className="slot-teacher">{match.teacherName || 'Unassigned'}</span>
                                                                        {match.roomNo && match.roomNo !== 'N/A' && (
                                                                            <span className="slot-room">({match.roomNo})</span>
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
                    </div>
                </div>
            </div>
        </div>
    );
}