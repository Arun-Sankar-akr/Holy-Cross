import { db, auth } from '../service/firebase';
import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection, onSnapshot, deleteDoc, doc, addDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import {
    Calendar, Shield, Award, Image as ImageIcon, Sun, Bell,
    PlusCircle, Trash2, LogOut, Radio, ChevronDown, Users, GraduationCap,
    Edit2, Check, X, ArrowLeft, Folder, UserCheck, KeyRound, Clock, Menu, PanelLeftClose, PanelLeftOpen, User
} from 'lucide-react';
import AdminLogin from '../admin/AdminLogin';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('calendar');

    // Collapsible states for sidebar dropdowns
    const [updatesOpen, setUpdatesOpen] = useState(true);
    const [erpOpen, setErpOpen] = useState(true);
    const [timetableOpen, setTimetableOpen] = useState(true);

    // Mobile Navigation Drawer State & Desktop Sidebar Toggle State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Real-time Firestore state
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [administrators, setAdministrators] = useState([]);
    const [toppers, setToppers] = useState([]);
    const [galleryItems, setGalleryItems] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [staffList, setStaffList] = useState([]);

    // Student Timetable Interactive Drill-down States
    const [staffTimetables, setStaffTimetables] = useState([]);
    const [studentTimetables, setStudentTimetables] = useState([]);
    const [selectedClassTT, setSelectedClassTT] = useState(null);
    const [selectedSectionTT, setSelectedSectionTT] = useState(null);

    // Staff Timetable Interactive Drill-down States
    const [selectedStaffTT, setSelectedStaffTT] = useState(null);
    const [selectedStaffDayTT, setSelectedStaffDayTT] = useState(null);

    // Students ERP State
    const [sectionsList, setSectionsList] = useState([]);
    const [studentsList, setStudentsList] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);

    // Form inputs state
    const [calendarForm, setCalendarForm] = useState({ month: '', date: '', day: '', title: '', category: 'General' });
    const [adminForm, setAdminForm] = useState({ name: '', role: '', qualification: '', message: '', email: '', phone: '' });
    const [topperForm, setTopperForm] = useState({ rank: 1, name: '', class: '', percentage: '' });
    const [galleryForm, setGalleryForm] = useState({ title: '', category: 'Campus', image: '', description: '' });
    const [holidayForm, setHolidayForm] = useState({ date: '', day: '', occasion: '', type: 'National Holiday' });
    const [noticeText, setNoticeText] = useState('');

    // Staff Form & Update States
    const [staffForm, setStaffForm] = useState({ name: '', staffId: '', password: '', department: '', email: '' });
    const [editingStaffId, setEditingStaffId] = useState(null);
    const [updatedStaffName, setUpdatedStaffName] = useState('');

    // Section CRUD States
    const [sectionForm, setSectionForm] = useState({ name: '', roomNo: '' });
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [editSectionForm, setEditSectionForm] = useState({ name: '', roomNo: '' });

    const sidebarRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (isMobileMenuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    // Extended Student CRUD States
    const initialStudentForm = {
        admissionNo: '', admissionDate: '', name: '', dob: '', photo: '', bloodGroup: '', guardianName: '', phone: '', address: ''
    };
    const [studentForm, setStudentForm] = useState(initialStudentForm);
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [editStudentForm, setEditStudentForm] = useState(initialStudentForm);

    // Timetable Form States
    const initialStudentTimetableForm = {
        className: '', sectionName: '', day: 'Monday', timeSlot: '', subject: '', teacherName: '', roomNo: ''
    };
    const [studentTimetableForm, setStudentTimetableForm] = useState(initialStudentTimetableForm);

    const initialStaffTimetableForm = {
        staffId: '', staffName: '', day: 'Monday', timeSlot: '', subject: '', className: '', roomNo: ''
    };
    const [staffTimetableForm, setStaffTimetableForm] = useState(initialStaffTimetableForm);

    const classList = [
        'LKG', 'UKG',
        '1st Std', '2nd Std', '3rd Std', '4th Std', '5th Std',
        '6th Std', '7th Std', '8th Std', '9th Std', '10th Std',
        '11th Std', '12th Std'
    ];

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

    const handleTabClick = (tabKey, extraCallback) => {
        setActiveTab(tabKey);
        setIsMobileMenuOpen(false);
        if (extraCallback) extraCallback();
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;

        const unsubCalendar = onSnapshot(collection(db, 'academic_calendar'), snap =>
            setCalendarEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubAdmins = onSnapshot(collection(db, 'administrators'), snap =>
            setAdministrators(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubToppers = onSnapshot(collection(db, 'exam_toppers'), snap =>
            setToppers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubGallery = onSnapshot(collection(db, 'gallery'), snap =>
            setGalleryItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubHolidays = onSnapshot(collection(db, 'holidays'), snap =>
            setHolidays(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), snap =>
            setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubStaff = onSnapshot(collection(db, 'staff_members'), snap =>
            setStaffList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubSections = onSnapshot(collection(db, 'class_sections'), snap =>
            setSectionsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubStudents = onSnapshot(collection(db, 'students_records'), snap =>
            setStudentsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubStaffTT = onSnapshot(collection(db, 'staff_timetables'), snap =>
            setStaffTimetables(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubStudentTT = onSnapshot(collection(db, 'student_timetables'), snap =>
            setStudentTimetables(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );

        return () => {
            unsubCalendar();
            unsubAdmins();
            unsubToppers();
            unsubGallery();
            unsubHolidays();
            unsubAnnouncements();
            unsubStaff();
            unsubSections();
            unsubStudents();
            unsubStaffTT();
            unsubStudentTT();
        };
    }, [user]);

    const handlePublish = async (collectionName, data, resetFn) => {
        try {
            await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: serverTimestamp()
            });
            if (resetFn) resetFn();
        } catch (error) {
            console.error("Error publishing document: ", error);
        }
    };

    const handleDelete = async (collectionName, id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteDoc(doc(db, collectionName, id));
            } catch (error) {
                console.error("Error deleting document: ", error);
            }
        }
    };

    const handleUpdateStaffName = async (id) => {
        if (!updatedStaffName.trim()) return;
        try {
            await updateDoc(doc(db, 'staff_members', id), { name: updatedStaffName.trim() });
            setEditingStaffId(null);
            setUpdatedStaffName('');
        } catch (error) {
            console.error("Error updating staff name: ", error);
        }
    };

    const handleAddSection = async (e) => {
        e.preventDefault();
        if (!sectionForm.name.trim()) return;
        await handlePublish('class_sections', {
            className: selectedClass,
            name: sectionForm.name.trim(),
            roomNo: sectionForm.roomNo.trim()
        }, () => setSectionForm({ name: '', roomNo: '' }));
    };

    const handleUpdateSection = async (id) => {
        try {
            await updateDoc(doc(db, 'class_sections', id), {
                name: editSectionForm.name,
                roomNo: editSectionForm.roomNo
            });
            setEditingSectionId(null);
        } catch (error) {
            console.error("Error updating section: ", error);
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (window.confirm('Deleting this section will remove it permanently. Continue?')) {
            try {
                await deleteDoc(doc(db, 'class_sections', sectionId));
                if (selectedSection?.id === sectionId) setSelectedSection(null);
            } catch (error) {
                console.error("Error deleting section: ", error);
            }
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (!studentForm.name.trim() || !studentForm.admissionNo.trim()) return;
        await handlePublish('students_records', {
            className: selectedClass,
            sectionId: selectedSection.id,
            sectionName: selectedSection.name,
            admissionNo: studentForm.admissionNo.trim(),
            admissionDate: studentForm.admissionDate,
            name: studentForm.name.trim(),
            dob: studentForm.dob,
            photo: studentForm.photo.trim(),
            bloodGroup: studentForm.bloodGroup.trim(),
            guardianName: studentForm.guardianName.trim(),
            phone: studentForm.phone.trim(),
            address: studentForm.address.trim()
        }, () => setStudentForm(initialStudentForm));
    };

    const handleUpdateStudent = async (id) => {
        try {
            await updateDoc(doc(db, 'students_records', id), {
                admissionNo: editStudentForm.admissionNo,
                admissionDate: editStudentForm.admissionDate,
                name: editStudentForm.name,
                dob: editStudentForm.dob,
                photo: editStudentForm.photo,
                bloodGroup: editStudentForm.bloodGroup,
                guardianName: editStudentForm.guardianName,
                phone: editStudentForm.phone,
                address: editStudentForm.address
            });
            setEditingStudentId(null);
        } catch (error) {
            console.error("Error updating student record: ", error);
        }
    };

    const handleAddStaffTimetable = async (e) => {
        e.preventDefault();
        if (!staffTimetableForm.staffId || !staffTimetableForm.subject || !staffTimetableForm.timeSlot) return;

        const selectedStaff = staffList.find(s => s.staffId === staffTimetableForm.staffId);
        const resolvedStaffName = selectedStaff ? selectedStaff.name : staffTimetableForm.staffName;

        await handlePublish('staff_timetables', {
            staffId: staffTimetableForm.staffId,
            staffName: resolvedStaffName,
            day: staffTimetableForm.day,
            timeSlot: staffTimetableForm.timeSlot.trim(),
            subject: staffTimetableForm.subject.trim(),
            className: staffTimetableForm.className.trim(),
            roomNo: staffTimetableForm.roomNo.trim()
        }, () => setStaffTimetableForm(initialStaffTimetableForm));
    };

    const handleAddStudentTimetable = async (e) => {
        e.preventDefault();
        if (!studentTimetableForm.className || !studentTimetableForm.subject || !studentTimetableForm.timeSlot) return;

        const rawSection = studentTimetableForm.sectionName.trim();
        const formattedSection = rawSection.toLowerCase().startsWith('section')
            ? rawSection
            : `Section ${rawSection}`;

        await handlePublish('student_timetables', {
            className: studentTimetableForm.className.trim(),
            sectionName: formattedSection,
            day: studentTimetableForm.day,
            timeSlot: studentTimetableForm.timeSlot.trim(),
            subject: studentTimetableForm.subject.trim(),
            teacherName: studentTimetableForm.teacherName.trim(),
            roomNo: studentTimetableForm.roomNo.trim()
        }, () => setStudentTimetableForm(initialStudentTimetableForm));
    };

    if (authLoading) {
        return <div style={{ textAlign: 'center', padding: '60px' }}>Checking Authorization...</div>;
    }

    if (!user) {
        return <AdminLogin />;
    }

    return (
        <>
            {/* Mobile Top Header */}
            <header className="mobile-header">
                <div className="mobile-header-title">
                    <div className="admin-seal" style={{ width: 30, height: 30, fontSize: '0.85rem' }}>AC</div>
                    <h3>Admin Panel</h3>
                </div>
                <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </header>

            {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

            <div className={`admin-containers ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`} ref={sidebarRef}>
                    <div>
                        <div className="sidebar-brand">
                            <div className="admin-seal">AC</div>
                            <div>
                                <h2>Admin Control</h2>
                                <p>Dashboard</p>
                            </div>
                        </div>

                        <nav className="admin-tabs">
                            {/* UPDATES TAB */}
                            <button type="button" className={`admin-tab parent-tab ${updatesOpen ? 'expanded' : ''}`} onClick={() => setUpdatesOpen(!updatesOpen)}>
                                <div className="tab-label"><Radio size={16} /><span>Updates</span></div>
                                <ChevronDown size={14} className={`chevron-icon ${updatesOpen ? 'rotated' : ''}`} />
                            </button>
                            {updatesOpen && (
                                <div className="submenu-container">
                                    <button type="button" className={`admin-tab child-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => handleTabClick('calendar')}>
                                        <Calendar size={15} /> Academic Calendar
                                    </button>
                                    <button type="button" className={`admin-tab child-tab ${activeTab === 'admins' ? 'active' : ''}`} onClick={() => handleTabClick('admins')}>
                                        <Shield size={15} /> Administrators
                                    </button>
                                    <button type="button" className={`admin-tab child-tab ${activeTab === 'toppers' ? 'active' : ''}`} onClick={() => handleTabClick('toppers')}>
                                        <Award size={15} /> Exam Toppers
                                    </button>
                                    <button type="button" className={`admin-tab child-tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => handleTabClick('gallery')}>
                                        <ImageIcon size={15} /> Photo Gallery
                                    </button>
                                    <button type="button" className={`admin-tab child-tab ${activeTab === 'holidays' ? 'active' : ''}`} onClick={() => handleTabClick('holidays')}>
                                        <Sun size={15} /> School Holidays
                                    </button>
                                    <button type="button" className={`admin-tab child-tab ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => handleTabClick('announcements')}>
                                        <Bell size={15} /> Announcements
                                    </button>
                                </div>
                            )}

                            {/* ERP MANAGEMENT TAB */}
                            <button type="button" className={`admin-tab parent-tab ${erpOpen ? 'expanded' : ''}`} onClick={() => setErpOpen(!erpOpen)}>
                                <div className="tab-label"><Users size={16} /><span>ERP Management</span></div>
                                <ChevronDown size={14} className={`chevron-icon ${erpOpen ? 'rotated' : ''}`} />
                            </button>
                            {erpOpen && (
                                <div className="submenu-container">
                                    <button type="button" className={`admin-tab child-tab ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => handleTabClick('staff')}>
                                        <Users size={15} /> Staff Directory
                                    </button>
                                    <button type="button" className={`admin-tab child-tab ${activeTab === 'students' ? 'active' : ''}`} onClick={() => handleTabClick('students', () => { setSelectedClass(null); setSelectedSection(null); })}>
                                        <GraduationCap size={15} /> Students ERP
                                    </button>
                                </div>
                            )}

                            {/* TIMETABLE TAB */}
                            <button type="button" className={`admin-tab parent-tab ${timetableOpen ? 'expanded' : ''}`} onClick={() => setTimetableOpen(!timetableOpen)}>
                                <div className="tab-label"><Clock size={16} /><span>Timetables</span></div>
                                <ChevronDown size={14} className={`chevron-icon ${timetableOpen ? 'rotated' : ''}`} />
                            </button>
                            {timetableOpen && (
                                <div className="submenu-container">
                                    <button type="button" className={`admin-tab child-tab ${activeTab === 'student_timetable' ? 'active' : ''}`} onClick={() => handleTabClick('student_timetable', () => { setSelectedClassTT(null); setSelectedSectionTT(null); })}>
                                        <Clock size={15} /> Student Schedule
                                    </button>
                                    <button type="button" className={`admin-tab child-tab ${activeTab === 'staff_timetable' ? 'active' : ''}`} onClick={() => handleTabClick('staff_timetable', () => { setSelectedStaffTT(null); setSelectedStaffDayTT(null); })}>
                                        <Clock size={15} /> Staff Schedule
                                    </button>
                                </div>
                            )}
                        </nav>
                    </div>

                    <div className="sidebar-footer">
                        <div className="user-profile-info">
                            <span className="user-label">Logged in as</span>
                            <strong className="user-email">{user.email}</strong>
                        </div>
                        <button className="logout-btn" onClick={() => signOut(auth)}>
                            <LogOut size={14} /> Log Out
                        </button>
                    </div>
                </aside>

                <main className="admin-main-content">
                    <button className="sidebar-toggle-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                        {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                        <span>{isSidebarCollapsed ? 'Show' : 'Hide'}</span>
                    </button>

                    {/* ACADEMIC CALENDAR */}
                    {activeTab === 'calendar' && (
                        <div className="applications-management-card">
                            <h3>Publish Academic Calendar Event</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('academic_calendar', calendarForm, () =>
                                    setCalendarForm({ month: '', date: '', day: '', title: '', category: 'General' })
                                );
                            }}>
                                <div>
                                    <input type="text" placeholder="Month (e.g., June 2026)" value={calendarForm.month} onChange={e => setCalendarForm({ ...calendarForm, month: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Date (e.g., 02)" value={calendarForm.date} onChange={e => setCalendarForm({ ...calendarForm, date: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Day (e.g., Mon)" value={calendarForm.day} onChange={e => setCalendarForm({ ...calendarForm, day: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Event Title" value={calendarForm.title} onChange={e => setCalendarForm({ ...calendarForm, title: e.target.value })} required />
                                </div>
                                <div>
                                    <select value={calendarForm.category} onChange={e => setCalendarForm({ ...calendarForm, category: e.target.value })}>
                                        <option value="General">General</option>
                                        <option value="Exam">Exam</option>
                                        <option value="Meeting">Meeting</option>
                                        <option value="Event">Event</option>
                                    </select>
                                </div>
                                <button type="submit" className="add-notice-btn"><PlusCircle size={15} /> Publish Event</button>
                            </form>

                            <h4>Published Calendar Events <span className="count-badge">{calendarEvents.length}</span></h4>
                            {calendarEvents.length === 0 ? <div className="empty-state">No calendar events published yet.</div> : (
                                <ul>
                                    {calendarEvents.map(item => (
                                        <li key={item.id}>
                                            <span><strong>{item.month}</strong>: {item.title} ({item.date} {item.day})</span>
                                            <button onClick={() => handleDelete('academic_calendar', item.id)}><Trash2 size={14} /></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* ADMINISTRATORS */}
                    {activeTab === 'admins' && (
                        <div className="applications-management-card">
                            <h3>Publish Administrator Profile</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('administrators', adminForm, () =>
                                    setAdminForm({ name: '', role: '', qualification: '', message: '', email: '', phone: '' })
                                );
                            }}>
                                <div>
                                    <input type="text" placeholder="Full Name" value={adminForm.name} onChange={e => setAdminForm({ ...adminForm, name: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Role / Position" value={adminForm.role} onChange={e => setAdminForm({ ...adminForm, role: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Qualifications" value={adminForm.qualification} onChange={e => setAdminForm({ ...adminForm, qualification: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="email" placeholder="Email Address" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Phone Number" value={adminForm.phone} onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })} required />
                                </div>
                                <textarea placeholder="Administrator's Message" value={adminForm.message} onChange={e => setAdminForm({ ...adminForm, message: e.target.value })} required />
                                <button type="submit" className="add-notice-btn"><PlusCircle size={15} /> Publish Administrator</button>
                            </form>

                            <h4>Published Administrators <span className="count-badge">{administrators.length}</span></h4>
                            {administrators.length === 0 ? <div className="empty-state">No administrators published yet.</div> : (
                                <ul>
                                    {administrators.map(item => (
                                        <li key={item.id}>
                                            <span><strong>{item.name}</strong> - {item.role}</span>
                                            <button onClick={() => handleDelete('administrators', item.id)}><Trash2 size={14} /></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* TOPPERS */}
                    {activeTab === 'toppers' && (
                        <div className="applications-management-card">
                            <h3>Publish Academic Topper</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('exam_toppers', topperForm, () =>
                                    setTopperForm({ rank: 1, name: '', class: '', percentage: '' })
                                );
                            }}>
                                <div>
                                    <select value={topperForm.rank} onChange={e => setTopperForm({ ...topperForm, rank: Number(e.target.value) })}>
                                        <option value={1}>Rank 1 (Gold)</option>
                                        <option value={2}>Rank 2 (Silver)</option>
                                        <option value={3}>Rank 3 (Bronze)</option>
                                    </select>
                                </div>
                                <div>
                                    <input type="text" placeholder="Student Name" value={topperForm.name} onChange={e => setTopperForm({ ...topperForm, name: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Class / Stream" value={topperForm.class} onChange={e => setTopperForm({ ...topperForm, class: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Percentage (e.g., 98.6%)" value={topperForm.percentage} onChange={e => setTopperForm({ ...topperForm, percentage: e.target.value })} required />
                                </div>
                                <button type="submit" className="add-notice-btn"><PlusCircle size={15} /> Publish Topper</button>
                            </form>

                            <h4>Published Toppers <span className="count-badge">{toppers.length}</span></h4>
                            {toppers.length === 0 ? <div className="empty-state">No toppers published yet.</div> : (
                                <ul>
                                    {toppers.map(item => (
                                        <li key={item.id}>
                                            <span>Rank {item.rank}: <strong>{item.name}</strong> - {item.percentage}</span>
                                            <button onClick={() => handleDelete('exam_toppers', item.id)}><Trash2 size={14} /></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* GALLERY */}
                    {activeTab === 'gallery' && (
                        <div className="applications-management-card">
                            <h3>Publish Gallery Photo</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('gallery', galleryForm, () =>
                                    setGalleryForm({ title: '', category: 'Campus', image: '', description: '' })
                                );
                            }}>
                                <div>
                                    <input type="text" placeholder="Photo Title" value={galleryForm.title} onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })} required />
                                </div>
                                <div>
                                    <select value={galleryForm.category} onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value })}>
                                        <option value="Campus">Campus</option>
                                        <option value="Events">Events</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Academics">Academics</option>
                                    </select>
                                </div>
                                <div>
                                    <input type="url" placeholder="Image URL (Hosted Link or Unsplash)" value={galleryForm.image} onChange={e => setGalleryForm({ ...galleryForm, image: e.target.value })} required />
                                </div>
                                <textarea placeholder="Description" value={galleryForm.description} onChange={e => setGalleryForm({ ...galleryForm, description: e.target.value })} required />
                                <button type="submit" className="add-notice-btn"><PlusCircle size={15} /> Publish Gallery Photo</button>
                            </form>

                            <h4>Published Gallery Photos <span className="count-badge">{galleryItems.length}</span></h4>
                            {galleryItems.length === 0 ? <div className="empty-state">No gallery photos published yet.</div> : (
                                <ul>
                                    {galleryItems.map(item => (
                                        <li key={item.id}>
                                            <span><strong>{item.title}</strong> ({item.category})</span>
                                            <button onClick={() => handleDelete('gallery', item.id)}><Trash2 size={14} /></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* HOLIDAYS */}
                    {activeTab === 'holidays' && (
                        <div className="applications-management-card">
                            <h3>Publish Holiday</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('holidays', holidayForm, () =>
                                    setHolidayForm({ date: '', day: '', occasion: '', type: 'National Holiday' })
                                );
                            }}>
                                <div>
                                    <input type="text" placeholder="Date (e.g., 15 Aug 2026)" value={holidayForm.date} onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Day (e.g., Friday)" value={holidayForm.day} onChange={e => setHolidayForm({ ...holidayForm, day: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Occasion / Holiday Name" value={holidayForm.occasion} onChange={e => setHolidayForm({ ...holidayForm, occasion: e.target.value })} required />
                                </div>
                                <div>
                                    <select value={holidayForm.type} onChange={e => setHolidayForm({ ...holidayForm, type: e.target.value })}>
                                        <option value="National Holiday">National Holiday</option>
                                        <option value="Festival">Festival</option>
                                    </select>
                                </div>
                                <button type="submit" className="add-notice-btn"><PlusCircle size={15} /> Publish Holiday</button>
                            </form>

                            <h4>Published Holidays <span className="count-badge">{holidays.length}</span></h4>
                            {holidays.length === 0 ? <div className="empty-state">No holidays published yet.</div> : (
                                <ul>
                                    {holidays.map(item => (
                                        <li key={item.id}>
                                            <span>{item.date} ({item.day}): <strong>{item.occasion}</strong></span>
                                            <button onClick={() => handleDelete('holidays', item.id)}><Trash2 size={14} /></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* ANNOUNCEMENTS */}
                    {activeTab === 'announcements' && (
                        <div className="applications-management-card">
                            <h3>Publish Announcement</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('announcements', { content: noticeText }, () => setNoticeText(''));
                            }}>
                                <textarea rows="3" placeholder="Enter notice content..." value={noticeText} onChange={e => setNoticeText(e.target.value)} required />
                                <button type="submit" className="add-notice-btn"><PlusCircle size={15} /> Publish Announcement</button>
                            </form>

                            <h4>Published Announcements <span className="count-badge">{announcements.length}</span></h4>
                            {announcements.length === 0 ? <div className="empty-state">No announcements published yet.</div> : (
                                <ul>
                                    {announcements.map(item => (
                                        <li key={item.id}>
                                            <span>{item.content}</span>
                                            <button onClick={() => handleDelete('announcements', item.id)}><Trash2 size={14} /></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* STAFF DIRECTORY */}
                    {activeTab === 'staff' && (
                        <div className="applications-management-card">
                            <h3>Add Staff & Credentials</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('staff_members', staffForm, () =>
                                    setStaffForm({ name: '', staffId: '', password: '', department: '', email: '' })
                                );
                            }}>
                                <div>
                                    <input type="text" placeholder="Staff Full Name" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Staff ID (e.g., STF2026)" value={staffForm.staffId} onChange={e => setStaffForm({ ...staffForm, staffId: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="password" placeholder="Portal Password" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="text" placeholder="Department / Subject" value={staffForm.department} onChange={e => setStaffForm({ ...staffForm, department: e.target.value })} required />
                                </div>
                                <div>
                                    <input type="email" placeholder="Official Email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} required />
                                </div>
                                <button type="submit" className="add-notice-btn"><PlusCircle size={15} /> Add Staff Account</button>
                            </form>

                            <h4>Staff Directory <span className="count-badge">{staffList.length}</span></h4>
                            {staffList.length === 0 ? <div className="empty-state">No staff members registered yet.</div> : (
                                <ul>
                                    {staffList.map(member => (
                                        <li key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {editingStaffId === member.id ? (
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexGrow: 1 }}>
                                                    <input
                                                        type="text"
                                                        value={updatedStaffName}
                                                        onChange={(e) => setUpdatedStaffName(e.target.value)}
                                                        placeholder="New Staff Name"
                                                        style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                    />
                                                    <button onClick={() => handleUpdateStaffName(member.id)} title="Save"><Check size={14} color="#059669" /></button>
                                                    <button onClick={() => setEditingStaffId(null)} title="Cancel"><X size={14} color="#e11d48" /></button>
                                                </div>
                                            ) : (
                                                <span>
                                                    <strong>{member.name}</strong> ({member.department}) — ID: <code>{member.staffId}</code> | Pass: <code>{member.password}</code>
                                                </span>
                                            )}

                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {editingStaffId !== member.id && (
                                                    <button onClick={() => {
                                                        setEditingStaffId(member.id);
                                                        setUpdatedStaffName(member.name);
                                                    }} title="Update Name">
                                                        <Edit2 size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete('staff_members', member.id)} title="Delete Staff">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* STUDENTS ERP */}
                    {activeTab === 'students' && (
                        <div className="applications-management-card">
                            {!selectedClass && (
                                <>
                                    <h3>Students Directory — Classes</h3>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.8rem' }}>
                                        Select a class to manage its sections and student records.
                                    </p>
                                    <div className="class-cards-grid">
                                        {classList.map((cls) => {
                                            const countSections = sectionsList.filter(s => s.className === cls).length;
                                            const countStudents = studentsList.filter(s => s.className === cls).length;

                                            return (
                                                <div key={cls} className="class-card" onClick={() => setSelectedClass(cls)}>
                                                    <div className="class-card-icon"><GraduationCap size={20} /></div>
                                                    <div className="class-card-content">
                                                        <h4>{cls}</h4>
                                                        <span>{countSections} Sections • {countStudents} Students</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {selectedClass && !selectedSection && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <button className="back-btn" onClick={() => setSelectedClass(null)}>
                                            <ArrowLeft size={15} /> Back to Classes
                                        </button>
                                        <h3 style={{ margin: 0 }}>{selectedClass} Sections</h3>
                                    </div>

                                    <form onSubmit={handleAddSection}>
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Section Name (e.g., Section A)"
                                                value={sectionForm.name}
                                                onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Room No / Hall (e.g., Room 104)"
                                                value={sectionForm.roomNo}
                                                onChange={e => setSectionForm({ ...sectionForm, roomNo: e.target.value })}
                                            />
                                        </div>
                                        <button type="submit" className="add-notice-btn"><PlusCircle size={15} /> Add Section</button>
                                    </form>

                                    <h4>Available Sections <span className="count-badge">{sectionsList.filter(s => s.className === selectedClass).length}</span></h4>

                                    {sectionsList.filter(s => s.className === selectedClass).length === 0 ? (
                                        <div className="empty-state">No sections created for {selectedClass} yet. Add a section above.</div>
                                    ) : (
                                        <div className="sections-grid">
                                            {sectionsList.filter(s => s.className === selectedClass).map(sec => {
                                                const studentCount = studentsList.filter(st => st.sectionId === sec.id).length;
                                                return (
                                                    <div key={sec.id} className="section-card">
                                                        {editingSectionId === sec.id ? (
                                                            <div className="edit-form-box">
                                                                <input
                                                                    type="text"
                                                                    value={editSectionForm.name}
                                                                    onChange={e => setEditSectionForm({ ...editSectionForm, name: e.target.value })}
                                                                    placeholder="Section Name"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={editSectionForm.roomNo}
                                                                    onChange={e => setEditSectionForm({ ...editSectionForm, roomNo: e.target.value })}
                                                                    placeholder="Room No"
                                                                />
                                                                <div className="edit-actions">
                                                                    <button onClick={() => handleUpdateSection(sec.id)} className="save-btn"><Check size={14} /></button>
                                                                    <button onClick={() => setEditingSectionId(null)} className="cancel-btn"><X size={14} /></button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="section-card-body" onClick={() => setSelectedSection(sec)}>
                                                                    <Folder size={18} className="section-folder-icon" />
                                                                    <div>
                                                                        <h5>{sec.name}</h5>
                                                                        <p>{sec.roomNo ? `Room: ${sec.roomNo} • ` : ''}{studentCount} Students</p>
                                                                    </div>
                                                                </div>
                                                                <div className="section-card-actions">
                                                                    <button onClick={() => {
                                                                        setEditingSectionId(sec.id);
                                                                        setEditSectionForm({ name: sec.name, roomNo: sec.roomNo || '' });
                                                                    }} title="Edit Section"><Edit2 size={14} /></button>
                                                                    <button onClick={() => handleDeleteSection(sec.id)} title="Delete Section"><Trash2 size={14} /></button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedClass && selectedSection && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <button className="back-btn" onClick={() => setSelectedSection(null)}>
                                            <ArrowLeft size={15} /> Back to Sections
                                        </button>
                                        <h3 style={{ margin: 0 }}>
                                            {selectedClass} — {selectedSection.name} Admission
                                        </h3>
                                    </div>

                                    <form onSubmit={handleAddStudent} className="student-admission-form">
                                        <div className="form-section-title">Admission & Credentials</div>
                                        <div className="student-form-grid">
                                            <div>
                                                <label>Admission No (User ID)</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. ADM2026-001"
                                                    value={studentForm.admissionNo}
                                                    onChange={e => setStudentForm({ ...studentForm, admissionNo: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label>Admission Date</label>
                                                <input
                                                    type="date"
                                                    value={studentForm.admissionDate}
                                                    onChange={e => setStudentForm({ ...studentForm, admissionDate: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-section-title">Personal Details</div>
                                        <div className="student-form-grid">
                                            <div>
                                                <label>Student Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Rahul Sharma"
                                                    value={studentForm.name}
                                                    onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label>DOB (Password)</label>
                                                <input
                                                    type="date"
                                                    value={studentForm.dob}
                                                    onChange={e => setStudentForm({ ...studentForm, dob: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label>Blood Group</label>
                                                <select
                                                    value={studentForm.bloodGroup}
                                                    onChange={e => setStudentForm({ ...studentForm, bloodGroup: e.target.value })}
                                                >
                                                    <option value="">Select Blood Group</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B-">B-</option>
                                                    <option value="O+">O+</option>
                                                    <option value="O-">O-</option>
                                                    <option value="AB+">AB+</option>
                                                    <option value="AB-">AB-</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label>Photo URL</label>
                                                <input
                                                    type="url"
                                                    placeholder="https://..."
                                                    value={studentForm.photo}
                                                    onChange={e => setStudentForm({ ...studentForm, photo: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-section-title">Parent & Contact</div>
                                        <div className="student-form-grid">
                                            <div>
                                                <label>Guardian Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Parent's Name"
                                                    value={studentForm.guardianName}
                                                    onChange={e => setStudentForm({ ...studentForm, guardianName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label>Phone Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="Contact Number"
                                                    value={studentForm.phone}
                                                    onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '4px', width: '100%' }}>
                                            <label>Address</label>
                                            <textarea
                                                rows="2"
                                                placeholder="Home Address..."
                                                value={studentForm.address}
                                                onChange={e => setStudentForm({ ...studentForm, address: e.target.value })}
                                            />
                                        </div>

                                        <button type="submit" className="add-notice-btn" style={{ marginTop: '8px' }}>
                                            <UserCheck size={15} /> Enroll & Generate Credentials
                                        </button>
                                    </form>

                                    <h4>Enrolled Students Directory <span className="count-badge">{studentsList.filter(st => st.sectionId === selectedSection.id).length}</span></h4>

                                    {studentsList.filter(st => st.sectionId === selectedSection.id).length === 0 ? (
                                        <div className="empty-state">No student records enrolled in this section yet.</div>
                                    ) : (
                                        <div className="student-cards-list">
                                            {studentsList.filter(st => st.sectionId === selectedSection.id).map(st => (
                                                <div key={st.id} className="student-detail-card">
                                                    {editingStudentId === st.id ? (
                                                        <div className="student-edit-mode">
                                                            <div className="student-form-grid">
                                                                <input type="text" value={editStudentForm.name} onChange={e => setEditStudentForm({ ...editStudentForm, name: e.target.value })} placeholder="Student Name" />
                                                                <input type="text" value={editStudentForm.admissionNo} onChange={e => setEditStudentForm({ ...editStudentForm, admissionNo: e.target.value })} placeholder="Admission No" />
                                                                <input type="date" value={editStudentForm.dob} onChange={e => setEditStudentForm({ ...editStudentForm, dob: e.target.value })} placeholder="DOB" />
                                                                <input type="text" value={editStudentForm.guardianName} onChange={e => setEditStudentForm({ ...editStudentForm, guardianName: e.target.value })} placeholder="Guardian" />
                                                                <input type="text" value={editStudentForm.phone} onChange={e => setEditStudentForm({ ...editStudentForm, phone: e.target.value })} placeholder="Phone" />
                                                                <input type="text" value={editStudentForm.bloodGroup} onChange={e => setEditStudentForm({ ...editStudentForm, bloodGroup: e.target.value })} placeholder="Blood Group" />
                                                            </div>
                                                            <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                                                                <button onClick={() => handleUpdateStudent(st.id)} className="save-btn"><Check size={14} /> Save</button>
                                                                <button onClick={() => setEditingStudentId(null)} className="cancel-btn"><X size={14} /> Cancel</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="student-card-content">
                                                            <img
                                                                src={st.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                                                                alt={st.name}
                                                                className="student-avatar"
                                                            />
                                                            <div className="student-info">
                                                                <div className="student-header-row">
                                                                    <h5>{st.name}</h5>
                                                                    {st.bloodGroup && <span className="blood-badge">{st.bloodGroup}</span>}
                                                                </div>
                                                                <p className="student-meta">
                                                                    <strong>Adm No:</strong> <code>{st.admissionNo}</code> | <strong>Adm Date:</strong> {st.admissionDate || 'N/A'}
                                                                </p>
                                                                <p className="student-meta">
                                                                    <strong>DOB:</strong> {st.dob || 'N/A'} | <strong>Parent:</strong> {st.guardianName} ({st.phone})
                                                                </p>
                                                                {st.address && <p className="student-address"><strong>Address:</strong> {st.address}</p>}

                                                                <div className="student-credentials-box">
                                                                    <KeyRound size={12} />
                                                                    <span>ERP Login: User: <strong>{st.admissionNo}</strong> | Pass: <strong>{st.dob}</strong></span>
                                                                </div>
                                                            </div>

                                                            <div className="student-card-actions">
                                                                <button onClick={() => {
                                                                    setEditingStudentId(st.id);
                                                                    setEditStudentForm({ ...st });
                                                                }} title="Edit Record"><Edit2 size={14} /></button>
                                                                <button onClick={() => handleDelete('students_records', st.id)} title="Delete Record"><Trash2 size={14} /></button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* STUDENT TIMETABLE TAB */}
                    {activeTab === 'student_timetable' && (
                        <div className="applications-management-card">
                            {/* Student Directory — Class Timetables Section (Top) */}
                            <h3 style={{ marginBottom: '14px' }}>Student Directory — Class Timetables</h3>

                            {(selectedClassTT || selectedSectionTT) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
                                    <button
                                        onClick={() => { setSelectedClassTT(null); setSelectedSectionTT(null); }}
                                        style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                                    >
                                        All Classes
                                    </button>
                                    {selectedClassTT && (
                                        <>
                                            <span style={{ color: '#94a3b8' }}>/</span>
                                            <button
                                                onClick={() => setSelectedSectionTT(null)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: selectedSectionTT ? '#4f46e5' : '#0f172a',
                                                    cursor: selectedSectionTT ? 'pointer' : 'default',
                                                    padding: 0,
                                                    fontWeight: 600
                                                }}
                                            >
                                                {selectedClassTT}
                                            </button>
                                        </>
                                    )}
                                    {selectedSectionTT && (
                                        <>
                                            <span style={{ color: '#94a3b8' }}>/</span>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                                {selectedSectionTT.startsWith('Section') ? selectedSectionTT : `Section ${selectedSectionTT}`}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}

                            {!selectedClassTT && (
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '-4px', marginBottom: '12px' }}>
                                        Select a class to manage its section timetables.
                                    </p>
                                    <div className="class-cards-grid">
                                        {classList.map(cls => {
                                            const classSections = sectionsList.filter(s => s.className === cls);
                                            const totalSlots = studentTimetables.filter(tt => tt.className === cls).length;

                                            return (
                                                <div key={cls} className="class-card" onClick={() => setSelectedClassTT(cls)}>
                                                    <div className="class-card-icon"><GraduationCap size={20} /></div>
                                                    <div className="class-card-content">
                                                        <h4>{cls}</h4>
                                                        <span>{classSections.length} Sections • {totalSlots} Slots</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedClassTT && !selectedSectionTT && (
                                <div>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                        Available Sections
                                        <span className="count-badge">
                                            {sectionsList.filter(s => s.className === selectedClassTT).length}
                                        </span>
                                    </h4>

                                    {sectionsList.filter(s => s.className === selectedClassTT).length === 0 ? (
                                        <div className="empty-state">No sections found for {selectedClassTT}. Create sections in Student ERP first.</div>
                                    ) : (
                                        <div className="sections-grid">
                                            {sectionsList
                                                .filter(s => s.className === selectedClassTT)
                                                .map(sec => {
                                                    const sectionSlots = studentTimetables.filter(
                                                        tt => tt.className === selectedClassTT && tt.sectionName === sec.name
                                                    ).length;

                                                    return (
                                                        <div key={sec.id} className="section-card" onClick={() => setSelectedSectionTT(sec.name)}>
                                                            <div className="section-card-body">
                                                                <Folder size={18} className="section-folder-icon" />
                                                                <div>
                                                                    <h5>Section {sec.name}</h5>
                                                                    <p>{sectionSlots} Slots</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedClassTT && selectedSectionTT && (
                                <div>
                                    <h4 style={{ marginBottom: '12px', color: '#0f172a' }}>
                                        Schedule: {selectedClassTT} - {selectedSectionTT.toLowerCase().startsWith('section') ? selectedSectionTT : `Section ${selectedSectionTT}`}
                                    </h4>

                                    <div className="timetable-grid-wrapper">
                                        <table className="timetable-grid-table">
                                            <thead>
                                                <tr>
                                                    <th>Day</th>
                                                    {timeSlots.map(slot => (
                                                        <th key={slot}>{slot}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {weekDays.map(day => (
                                                    <tr key={day}>
                                                        <td><strong>{day}</strong></td>
                                                        {timeSlots.map(slot => {
                                                            const match = studentTimetables.find(
                                                                tt => tt.className === selectedClassTT &&
                                                                    tt.sectionName === selectedSectionTT &&
                                                                    tt.day === day &&
                                                                    tt.timeSlot === slot
                                                            );
                                                            return (
                                                                <td key={slot}>
                                                                    {match ? (
                                                                        <div className="timetable-slot-cell" style={{ position: 'relative' }}>
                                                                            <span className="timetable-slot-subject">{match.subject}</span>
                                                                            <span className="timetable-slot-meta">{match.teacherName || 'Unassigned'}</span>
                                                                            {match.roomNo && <span className="timetable-slot-meta">({match.roomNo})</span>}
                                                                            <button
                                                                                onClick={() => handleDelete('student_timetables', match.id)}
                                                                                title="Delete Slot"
                                                                                style={{
                                                                                    background: 'none',
                                                                                    border: 'none',
                                                                                    color: '#e11d48',
                                                                                    cursor: 'pointer',
                                                                                    position: 'absolute',
                                                                                    top: '2px',
                                                                                    right: '2px',
                                                                                    padding: 0
                                                                                }}
                                                                            >
                                                                                <Trash2 size={11} />
                                                                            </button>
                                                                        </div>
                                                                    ) : null}
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

                            {/* Add Student Class Schedule Slot Section (Bottom) */}
                            <h3 style={{ marginTop: '28px', marginBottom: '10px' }}>Add Student Class Schedule Slot</h3>
                            <form onSubmit={handleAddStudentTimetable} className="student-admission-form">
                                <div>
                                    <label>Class</label>
                                    <select
                                        value={studentTimetableForm.className}
                                        onChange={e => setStudentTimetableForm({
                                            ...studentTimetableForm,
                                            className: e.target.value,
                                            sectionName: ''
                                        })}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classList.map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Section Name</label>
                                    <select
                                        value={studentTimetableForm.sectionName}
                                        onChange={e => setStudentTimetableForm({ ...studentTimetableForm, sectionName: e.target.value })}
                                        disabled={!studentTimetableForm.className}
                                    >
                                        <option value="">Select Section</option>
                                        {sectionsList
                                            .filter(sec => sec.className === studentTimetableForm.className)
                                            .map(sec => (
                                                <option key={sec.id} value={sec.name}>{sec.name}</option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Day of Week</label>
                                    <select
                                        value={studentTimetableForm.day}
                                        onChange={e => setStudentTimetableForm({ ...studentTimetableForm, day: e.target.value })}
                                        required
                                    >
                                        {weekDays.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Time Slot</label>
                                    <select
                                        value={studentTimetableForm.timeSlot}
                                        onChange={e => setStudentTimetableForm({ ...studentTimetableForm, timeSlot: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Time Slot</option>
                                        {timeSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Subject</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Mathematics"
                                        value={studentTimetableForm.subject}
                                        onChange={e => setStudentTimetableForm({ ...studentTimetableForm, subject: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Teacher Name</label>
                                    <select
                                        value={studentTimetableForm.teacherName}
                                        onChange={e => setStudentTimetableForm({ ...studentTimetableForm, teacherName: e.target.value })}
                                    >
                                        <option value="">Select Teacher</option>
                                        {staffList.map(stf => (
                                            <option key={stf.id} value={stf.name}>{stf.name} ({stf.department || 'Staff'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Room / Lab No</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Room 102"
                                        value={studentTimetableForm.roomNo}
                                        onChange={e => setStudentTimetableForm({ ...studentTimetableForm, roomNo: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="add-notice-btn">
                                    <PlusCircle size={15} /> Add Student Schedule Slot
                                </button>
                            </form>
                        </div>
                    )}

                    {/* STAFF TIMETABLE TAB */}
                    {activeTab === 'staff_timetable' && (
                        <div className="applications-management-card">
                            {/* Staff Directory — Work Timetables Section (Top) */}
                            <h3 style={{ marginBottom: '14px' }}>Staff Directory — Work Timetables</h3>

                            {(selectedStaffTT || selectedStaffDayTT) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
                                    <button
                                        onClick={() => { setSelectedStaffTT(null); setSelectedStaffDayTT(null); }}
                                        style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                                    >
                                        All Staff
                                    </button>
                                    {selectedStaffTT && (
                                        <>
                                            <span style={{ color: '#94a3b8' }}>/</span>
                                            <button
                                                onClick={() => setSelectedStaffDayTT(null)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: selectedStaffDayTT ? '#059669' : '#0f172a',
                                                    cursor: selectedStaffDayTT ? 'pointer' : 'default',
                                                    padding: 0,
                                                    fontWeight: 600
                                                }}
                                            >
                                                {selectedStaffTT.name}
                                            </button>
                                        </>
                                    )}
                                    {selectedStaffDayTT && (
                                        <>
                                            <span style={{ color: '#94a3b8' }}>/</span>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedStaffDayTT}</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {!selectedStaffTT && (
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '-4px', marginBottom: '12px' }}>
                                        Select a staff member to view their schedule breakdown.
                                    </p>
                                    {staffList.length === 0 ? (
                                        <div className="empty-state">No staff members found in the directory.</div>
                                    ) : (
                                        <div className="class-cards-grid">
                                            {staffList.map(stf => {
                                                const totalSlots = staffTimetables.filter(tt => tt.staffId === stf.staffId || tt.staffName === stf.name).length;

                                                return (
                                                    <div key={stf.id} className="class-card" onClick={() => setSelectedStaffTT(stf)}>
                                                        <div className="class-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                                                            <User size={20} />
                                                        </div>
                                                        <div className="class-card-content">
                                                            <h4>{stf.name}</h4>
                                                            <span>{stf.department || 'General'} • {totalSlots} Slots</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedStaffTT && !selectedStaffDayTT && (
                                <div>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                        Days Schedule for {selectedStaffTT.name}
                                    </h4>
                                    <div className="class-cards-grid">
                                        {weekDays.map(day => {
                                            const daySlots = staffTimetables.filter(
                                                tt => (tt.staffId === selectedStaffTT.staffId || tt.staffName === selectedStaffTT.name) && tt.day === day
                                            ).length;

                                            return (
                                                <div key={day} className="class-card" onClick={() => setSelectedStaffDayTT(day)}>
                                                    <div className="class-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div className="class-card-content">
                                                        <h4>{day}</h4>
                                                        <span>{daySlots} Work Slots</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedStaffTT && selectedStaffDayTT && (
                                <div>
                                    <h4 style={{ marginBottom: '12px', color: '#0f172a' }}>
                                        Schedule: {selectedStaffTT.name} — {selectedStaffDayTT}
                                    </h4>

                                    {staffTimetables.filter(
                                        tt => (tt.staffId === selectedStaffTT.staffId || tt.staffName === selectedStaffTT.name) && tt.day === selectedStaffDayTT
                                    ).length === 0 ? (
                                        <div className="empty-state">No schedule slots assigned for {selectedStaffTT.name} on {selectedStaffDayTT}.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {staffTimetables
                                                .filter(tt => (tt.staffId === selectedStaffTT.staffId || tt.staffName === selectedStaffTT.name) && tt.day === selectedStaffDayTT)
                                                .map(item => (
                                                    <div
                                                        key={item.id}
                                                        style={{
                                                            background: '#fff',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            padding: '8px 12px',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                                {item.timeSlot}
                                                            </span>
                                                            <div>
                                                                <strong style={{ color: '#0f172a', fontSize: '0.82rem' }}>{item.subject}</strong>
                                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                                                    Class: {item.className || 'General'} • Room: {item.roomNo || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete('staff_timetables', item.id)}
                                                            title="Delete Slot"
                                                            style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Add Staff Work Schedule Slot Section (Bottom) */}
                            <h3 style={{ marginTop: '28px', marginBottom: '10px' }}>Add Staff Work Schedule Slot</h3>
                            <form onSubmit={handleAddStaffTimetable} className="student-admission-form">
                                <div>
                                    <label>Staff Member</label>
                                    <select
                                        value={staffTimetableForm.staffId}
                                        onChange={e => {
                                            const selected = staffList.find(s => s.staffId === e.target.value);
                                            setStaffTimetableForm({
                                                ...staffTimetableForm,
                                                staffId: e.target.value,
                                                staffName: selected ? selected.name : ''
                                            });
                                        }}
                                        required
                                    >
                                        <option value="">Select Staff Member</option>
                                        {staffList.map(stf => (
                                            <option key={stf.id} value={stf.staffId}>
                                                {stf.name} ({stf.staffId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Day of Week</label>
                                    <select
                                        value={staffTimetableForm.day}
                                        onChange={e => setStaffTimetableForm({ ...staffTimetableForm, day: e.target.value })}
                                        required
                                    >
                                        {weekDays.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Time Slot</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 10:00 - 10:45 AM"
                                        value={staffTimetableForm.timeSlot}
                                        onChange={e => setStaffTimetableForm({ ...staffTimetableForm, timeSlot: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Subject / Activity</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Physics Lab"
                                        value={staffTimetableForm.subject}
                                        onChange={e => setStaffTimetableForm({ ...staffTimetableForm, subject: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Assigned Class</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 10th Std - Sec A"
                                        value={staffTimetableForm.className}
                                        onChange={e => setStaffTimetableForm({ ...staffTimetableForm, className: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>Room / Lab No</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Lab 2"
                                        value={staffTimetableForm.roomNo}
                                        onChange={e => setStaffTimetableForm({ ...staffTimetableForm, roomNo: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="add-notice-btn">
                                    <PlusCircle size={15} /> Add Staff Schedule Slot
                                </button>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}