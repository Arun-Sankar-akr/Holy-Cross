import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../service/firebase';
import { signOut } from 'firebase/auth';
import logo from "../../assets/logo.png"
import {
    collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import {
    Users, DollarSign, Calendar, ClipboardList, UserPlus,
    CheckCircle, XCircle, LogOut, PlusCircle, Check, X, Menu, LayoutGrid, ChevronDown, ChevronUp, UserCheck, ArrowLeft, GraduationCap, CheckSquare
} from 'lucide-react';
import './OfficeDashboard.css';

export default function OfficeDashboard() {
    const [activeTab, setActiveTab] = useState('enquiries');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sidebar Submenu Open/Close Toggle State for Exam Halls
    const [isExamMenuOpen, setIsExamMenuOpen] = useState(true);

    // Real-time Data States
    const [enquiries, setEnquiries] = useState([]);
    const [feesList, setFeesList] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [officeTasks, setOfficeTasks] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [studentsList, setStudentsList] = useState([]);
    const [examHalls, setExamHalls] = useState([]);
    const [staffExamHalls, setStaffExamHalls] = useState([]);

    // Fee Navigation & Drill-Down States
    const [feeViewMode, setFeeViewMode] = useState('classes'); // 'classes' | 'sections' | 'students-fee'
    const [selectedFeeClass, setSelectedFeeClass] = useState(null);
    const [selectedFeeSection, setSelectedFeeSection] = useState(null);

    // Form States
    const [enquiryForm, setEnquiryForm] = useState({ studentName: '', parentName: '', phone: '', grade: '10th Std', notes: '' });
    const [feeForm, setFeeForm] = useState({ admissionNo: '', studentName: '', class: '', totalFee: '', paidAmount: '', term: 'Term 1' });
    const [taskForm, setTaskForm] = useState({ title: '', assignedTo: '', priority: 'Normal', deadline: '' });
    const [hallForm, setHallForm] = useState({ hallNo: '', examName: '', targetClass: '', capacity: '', invigilator: '' });
    const [staffHallForm, setStaffHallForm] = useState({ hallNo: '', examName: '', staffName: '', dutyTime: '' });

    // Exam Hall Allocation - Student/Staff workflow
    const [examStudentClass, setExamStudentClass] = useState('');
    const [examStudentSection, setExamStudentSection] = useState('');
    const [selectedExamStudents, setSelectedExamStudents] = useState([]);
    const [examHallNo, setExamHallNo] = useState('');
    const [examName, setExamName] = useState('');
    const [examCapacity, setExamCapacity] = useState('');
    const [selectedExamStaff, setSelectedExamStaff] = useState('');
    const [selectedStaffHall, setSelectedStaffHall] = useState('');
    const [staffDutyTime, setStaffDutyTime] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const unsubEnquiries = onSnapshot(collection(db, 'office_enquiries'), snap =>
            setEnquiries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubFees = onSnapshot(collection(db, 'fee_collections'), snap =>
            setFeesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubLeaves = onSnapshot(collection(db, 'staff_leaves'), snap =>
            setLeaveRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubTasks = onSnapshot(collection(db, 'office_tasks'), snap =>
            setOfficeTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubStaff = onSnapshot(collection(db, 'staff_members'), snap =>
            setStaffList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubStudents = onSnapshot(collection(db, 'students_records'), snap =>
            setStudentsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubHalls = onSnapshot(collection(db, 'exam_hall_allocations'), snap =>
            setExamHalls(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubStaffHalls = onSnapshot(collection(db, 'staff_exam_halls'), snap =>
            setStaffExamHalls(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );

        return () => {
            unsubEnquiries();
            unsubFees();
            unsubLeaves();
            unsubTasks();
            unsubStaff();
            unsubStudents();
            unsubHalls();
            unsubStaffHalls();
        };
    }, []);

    // Extract unique classes dynamically from students list
    const uniqueClasses = Array.from(new Set(studentsList.map(s => s.className || s.grade).filter(Boolean)));

    const examSections = Array.from(new Set(
        studentsList
            .filter(s => (s.className || s.grade) === examStudentClass)
            .map(s => s.sectionName || s.section)
            .filter(Boolean)
    ));

    const examClassStudents = studentsList.filter(s => {
        const cls = s.className || s.grade;
        const sec = s.sectionName || s.section;
        return cls === examStudentClass && (!examStudentSection || sec === examStudentSection);
    });

    const selectedExamStudentRecords = examClassStudents.filter(s => selectedExamStudents.includes(s.id));

    const selectedStaffHallRecord = examHalls.find(h => h.id === selectedStaffHall);
    const staffHallStudents = selectedStaffHallRecord?.studentList || [];

    const toggleExamStudent = (studentId) => {
        setSelectedExamStudents(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    const toggleAllExamStudents = () => {
        const ids = examClassStudents.map(s => s.id);
        const allSelected = ids.length > 0 && ids.every(id => selectedExamStudents.includes(id));
        setSelectedExamStudents(prev => allSelected
            ? prev.filter(id => !ids.includes(id))
            : Array.from(new Set([...prev, ...ids]))
        );
    };

    const handleStudentHallAllocation = async (e) => {
        e.preventDefault();
        if (!examStudentClass || !examStudentSection || selectedExamStudentRecords.length === 0 || !examHallNo.trim()) {
            alert('Please select class, section, at least one student and enter a hall number.');
            return;
        }

        try {
            // Assign seat numbers in the same order the students are selected.
            // Seat numbers are scoped to this hall allocation and start from 1.
            const studentList = selectedExamStudentRecords.map((s, index) => ({
                id: s.id,
                name: s.name || 'Student',
                admissionNo: s.admissionNo || '',
                className: s.className || s.grade || examStudentClass,
                sectionName: s.sectionName || s.section || examStudentSection,
                seatNo: index + 1
            }));

            await addDoc(collection(db, 'exam_hall_allocations'), {
                hallNo: examHallNo.trim(),
                examName: examName.trim() || 'Examination',
                targetClass: examStudentClass,
                targetSection: examStudentSection,
                studentCount: studentList.length,
                capacity: Number(examCapacity) || studentList.length,
                studentIds: studentList.map(s => s.id),
                studentList,
                createdAt: serverTimestamp()
            });

            setSelectedExamStudents([]);
            setExamHallNo('');
            setExamCapacity('');
            alert('Students assigned to the exam hall successfully.');
        } catch (error) {
            console.error('Error assigning students to hall:', error);
            alert('Failed to assign students to the examination hall.');
        }
    };

    const handleStaffHallAssignment = async (e) => {
        e.preventDefault();
        if (!selectedExamStaff || !selectedStaffHall) {
            alert('Please select a staff member and an allocated hall.');
            return;
        }

        const staff = staffList.find(s => s.id === selectedExamStaff);
        if (!staff) return;

        try {
            await addDoc(collection(db, 'staff_exam_halls'), {
                hallNo: selectedStaffHallRecord.hallNo,
                examName: selectedStaffHallRecord.examName || examName || 'Examination',
                staffId: staff.id,
                staffName: staff.name || staff.staffName || 'Staff',
                dutyTime: staffDutyTime || 'Exam Duty',
                studentCount: staffHallStudents.length || selectedStaffHallRecord.studentCount || 0,
                studentIds: selectedStaffHallRecord.studentIds || [],
                studentList: staffHallStudents,
                targetClass: selectedStaffHallRecord.targetClass || '',
                targetSection: selectedStaffHallRecord.targetSection || '',
                hallAllocationId: selectedStaffHall,
                createdAt: serverTimestamp()
            });

            setSelectedExamStaff('');
            setSelectedStaffHall('');
            setStaffDutyTime('');
            alert('Staff invigilation duty assigned successfully.');
        } catch (error) {
            console.error('Error assigning staff duty:', error);
            alert('Failed to assign staff duty.');
        }
    };

    const handlePublish = async (collectionName, data, resetFn) => {
        try {
            await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: serverTimestamp()
            });
            if (resetFn) resetFn();
        } catch (error) {
            console.error("Error writing document: ", error);
        }
    };

    const handleDelete = async (collectionName, id) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                await deleteDoc(doc(db, collectionName, id));
            } catch (error) {
                console.error("Error deleting document: ", error);
            }
        }
    };

    const handleUpdateLeaveStatus = async (id, status) => {
        try {
            await updateDoc(doc(db, 'staff_leaves', id), { status });
        } catch (error) {
            console.error("Error updating leave status: ", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('officeUser');
        signOut(auth);
        navigate('/erp/office/login');
    };

    return (
        <div className="dashboard-containers">
            {/* Mobile Navigation Bar */}
            <div className="mobile-topbar">
                <div className="mobile-brand">
                    <img src={logo} alt="School logo" />
                    <span>Front-Office Desk</span>
                </div>
                <button
                    className="menu-toggle-btn"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle navigation"
                >
                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <button
                    className="mobile-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close navigation"
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-icon"> <img src={logo} alt="" id='logogs'/> </div>
                    <span className="brand-titles">Front-Office Desk</span>
                </div>

                <div className="sidebar-user">
                    <div className="user-avatar" style={{ background: '#059669' }}>O</div>
                    <div className="user-info">
                        <span className="user-name">Office Executive</span>
                        <span className="user-role">Front-Desk Admin</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button className={`nav-links ${activeTab === 'enquiries' ? 'active' : ''}`} onClick={() => { setActiveTab('enquiries'); setIsMobileMenuOpen(false); }}>
                        <div className="nav-links-content"><UserPlus size={18} /><span>Enquiries & Visitors</span></div>
                    </button>
                    <button className={`nav-links ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => { setActiveTab('fees'); setIsMobileMenuOpen(false); }}>
                        <div className="nav-links-content"><DollarSign size={18} /><span>Fee Dues & Receipts</span></div>
                    </button>

                    {/* Exam Hall Allocation with Submenus */}
                    <div className="sidebar-submenu-group" style={{ marginBottom: '10px' }}>
                        <button
                            className="nav-links submenu-parent-btn"
                            onClick={() => setIsExamMenuOpen(!isExamMenuOpen)}
                            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5, 150, 105, 0.04)', border: 'none', cursor: 'pointer' }}
                        >
                            <div className="nav-links-content">
                                <LayoutGrid size={18} />
                                <span style={{ fontWeight: 600 }}>Exam Hall Allocation</span>
                            </div>
                            {isExamMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isExamMenuOpen && (
                            <div className="submenu-children" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '1.25rem', gap: '4px', marginTop: '6px' }}>
                                <button className={`nav-links ${activeTab === 'exam-halls' ? 'active' : ''}`} onClick={() => { setActiveTab('exam-halls'); setIsMobileMenuOpen(false); }}>
                                    <div className="nav-links-content"><Users size={16} /><span>Aloocate</span></div>
                                </button>
                            </div>
                        )}
                    </div>

                    <button className={`nav-links ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => { setActiveTab('leaves'); setIsMobileMenuOpen(false); }}>
                        <div className="nav-links-content"><Calendar size={18} /><span>Staff Leave Approvals</span></div>
                    </button>
                    <button className={`nav-links ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => { setActiveTab('tasks'); setIsMobileMenuOpen(false); }}>
                        <div className="nav-links-content"><ClipboardList size={18} /><span>Internal Task Board</span></div>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={16} /><span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Workspace Area */}
            <main className="dashboard-main">
                <header className="dashboard-topbar">
                    <div className="academic-badge">Academic Year 2026 - 2027</div>
                    <div className="topbar-actions">
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Authorized Front-Desk Workspace</span>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* ENQUIRIES MODULE */}
                    {activeTab === 'enquiries' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Front-Office Walk-in & Admission Enquiries</h3>
                                    <p className="subtitle">Log and track prospective student inquiries</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('office_enquiries', enquiryForm, () =>
                                    setEnquiryForm({ studentName: '', parentName: '', phone: '', grade: '10th Std', notes: '' })
                                );
                            }} className="form-grid" style={{ marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Student Name</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. Rahul Sharma" value={enquiryForm.studentName} onChange={e => setEnquiryForm({ ...enquiryForm, studentName: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Parent / Guardian Name</label>
                                    <input type="text" className="table-input full-width-input" placeholder="Parent Name" value={enquiryForm.parentName} onChange={e => setEnquiryForm({ ...enquiryForm, parentName: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Phone Number</label>
                                    <input type="text" className="table-input full-width-input" placeholder="Contact Number" value={enquiryForm.phone} onChange={e => setEnquiryForm({ ...enquiryForm, phone: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Target Grade / Class</label>
                                    <select className="custom-select full-width" value={enquiryForm.grade} onChange={e => setEnquiryForm({ ...enquiryForm, grade: e.target.value })}>
                                        <option value="9th Std">9th Std</option>
                                        <option value="10th Std">10th Std</option>
                                        <option value="11th Std">11th Std</option>
                                        <option value="12th Std">12th Std</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Remarks / Notes</label>
                                    <textarea rows="2" className="custom-textarea" placeholder="Enquiry details..." value={enquiryForm.notes} onChange={e => setEnquiryForm({ ...enquiryForm, notes: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
                                        <PlusCircle size={15} /> Log New Enquiry Entry
                                    </button>
                                </div>
                            </form>

                            <h4>Active Enquiries Directory ({enquiries.length})</h4>
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Parent</th>
                                            <th>Phone</th>
                                            <th>Grade Interested</th>
                                            <th>Notes</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enquiries.map(item => (
                                            <tr key={item.id}>
                                                <td><strong>{item.studentName}</strong></td>
                                                <td>{item.parentName}</td>
                                                <td>{item.phone}</td>
                                                <td><span className="task-target-tag">{item.grade}</span></td>
                                                <td>{item.notes || 'N/A'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="delete-task-btn" onClick={() => handleDelete('office_enquiries', item.id)} title="Delete Entry"><X size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* FEES MODULE WITH DRILL-DOWN & SET FEES */}
                    {activeTab === 'fees' && (
                        <div className="dash-card full-width">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3>Fee Collection & Class Directory</h3>
                                    <p className="subtitle">
                                        {feeViewMode === 'classes' && "Select a class to view its sections and students"}
                                        {feeViewMode === 'sections' && `Class: ${selectedFeeClass} — Choose a Section`}
                                        {feeViewMode === 'students-fee' && `Class: ${selectedFeeClass} (${selectedFeeSection}) — Select Student or Assign Fee`}
                                    </p>
                                </div>
                                {feeViewMode !== 'classes' && (
                                    <button 
                                        className="btn-primary" 
                                        style={{ background: '#64748b', padding: '6px 12px', fontSize: '0.8rem' }}
                                        onClick={() => {
                                            if (feeViewMode === 'students-fee') setFeeViewMode('sections');
                                            else if (feeViewMode === 'sections') { setFeeViewMode('classes'); setSelectedFeeClass(null); }
                                        }}
                                    >
                                        <ArrowLeft size={14} /> Back
                                    </button>
                                )}
                            </div>

                            {/* VIEW MODE 1: CLASSES */}
                            {feeViewMode === 'classes' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                    {uniqueClasses.map(clsName => {
                                        const classStudents = studentsList.filter(s => (s.className || s.grade) === clsName);
                                        const sections = Array.from(new Set(classStudents.map(s => s.sectionName || 'General').filter(Boolean)));
                                        return (
                                            <div 
                                                key={clsName} 
                                                onClick={() => { setSelectedFeeClass(clsName); setFeeViewMode('sections'); }}
                                                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                                            >
                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#059669' }}></div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                    <div style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', padding: '8px', borderRadius: '8px' }}>
                                                        <GraduationCap size={20} />
                                                    </div>
                                                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>{clsName}</h4>
                                                </div>
                                                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0' }}>{sections.length} Sections • {classStudents.length} Students</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* VIEW MODE 2: SECTIONS */}
                            {feeViewMode === 'sections' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                    {(() => {
                                        const classStudents = studentsList.filter(s => (s.className || s.grade) === selectedFeeClass);
                                        const sectionsMap = {};
                                        classStudents.forEach(s => {
                                            const sec = s.sectionName || 'General';
                                            if (!sectionsMap[sec]) sectionsMap[sec] = [];
                                            sectionsMap[sec].push(s);
                                        });

                                        return Object.entries(sectionsMap).map(([secName, secStudents]) => (
                                            <div 
                                                key={secName} 
                                                onClick={() => { setSelectedFeeSection(secName); setFeeViewMode('students-fee'); }}
                                                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                                            >
                                                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#1e293b' }}>Section: {secName}</h4>
                                                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>{secStudents.length} Students Enrolled</p>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}

                            {/* VIEW MODE 3: STUDENTS & FEE ASSIGNMENT FORM */}
                            {feeViewMode === 'students-fee' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <h4 style={{ margin: 0 }}>Students in {selectedFeeClass} - Section {selectedFeeSection}</h4>
                                    </div>

                                    <div className="table-responsive" style={{ marginBottom: '2rem' }}>
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Adm No</th>
                                                    <th>Student Name</th>
                                                    <th>Parent Phone</th>
                                                    <th style={{ textAlign: 'right' }}>Set Fee for Student</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentsList
                                                    .filter(s => (s.className || s.grade) === selectedFeeClass && (s.sectionName || 'General') === selectedFeeSection)
                                                    .map(st => (
                                                        <tr key={st.id}>
                                                            <td><code>#{st.admissionNo || 'N/A'}</code></td>
                                                            <td><strong>{st.name}</strong></td>
                                                            <td>{st.phone || st.parentPhone || 'N/A'}</td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <button 
                                                                    className="btn-save-grade" 
                                                                    onClick={() => {
                                                                        setFeeForm({
                                                                            admissionNo: st.admissionNo || '',
                                                                            studentName: st.name || '',
                                                                            class: `${selectedFeeClass} - ${selectedFeeSection}`,
                                                                            totalFee: '',
                                                                            paidAmount: '0',
                                                                            term: 'Term 1'
                                                                        });
                                                                    }}
                                                                >
                                                                    Select & Set Fee
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Set Fee Entry Form */}
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        handlePublish('fee_collections', {
                                            ...feeForm,
                                            balance: Number(feeForm.totalFee) - Number(feeForm.paidAmount),
                                            status: Number(feeForm.paidAmount) >= Number(feeForm.totalFee) ? 'Paid' : 'Pending'
                                        }, () => {
                                            setFeeForm({ admissionNo: '', studentName: '', class: '', totalFee: '', paidAmount: '', term: 'Term 1' });
                                            alert("Fee dues assigned successfully! Student dashboard alert triggered.");
                                        });
                                    }} className="form-grid" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                                        <h4 style={{ gridColumn: '1 / -1', margin: '0 0 5px 0' }}>Set Dues for: <span style={{ color: '#059669' }}>{feeForm.studentName || 'None Selected'}</span></h4>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Admission No</label>
                                            <input type="text" className="table-input full-width-input" value={feeForm.admissionNo} onChange={e => setFeeForm({ ...feeForm, admissionNo: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Student Name</label>
                                            <input type="text" className="table-input full-width-input" value={feeForm.studentName} onChange={e => setFeeForm({ ...feeForm, studentName: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Term</label>
                                            <select className="custom-select full-width" value={feeForm.term} onChange={e => setFeeForm({ ...feeForm, term: e.target.value })}>
                                                <option value="Term 1">Term 1</option>
                                                <option value="Term 2">Term 2</option>
                                                <option value="Annual">Annual Full Fee</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Total Fee Amount (₹)</label>
                                            <input type="number" className="table-input full-width-input" placeholder="Total Amount" value={feeForm.totalFee} onChange={e => setFeeForm({ ...feeForm, totalFee: e.target.value })} required />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
                                                <PlusCircle size={15} /> Publish Fee Dues to Student
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Fee Collections Master List & Quick Mark Paid */}
                            <h4>Fee Ledgers & Records ({feesList.length})</h4>
                            <div className="table-responsive" style={{ marginBottom: '2rem' }}>
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Adm No</th>
                                            <th>Student Name</th>
                                            <th>Term</th>
                                            <th>Total / Paid</th>
                                            <th>Balance</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feesList.map(item => (
                                            <tr key={item.id}>
                                                <td><code>#{item.admissionNo}</code></td>
                                                <td><strong>{item.studentName}</strong></td>
                                                <td>{item.term}</td>
                                                <td>₹{item.totalFee} / ₹{item.paidAmount}</td>
                                                <td style={{ color: item.balance > 0 ? 'red' : 'green', fontWeight: 700 }}>₹{item.balance}</td>
                                                <td>
                                                    <span className={`status-badge ${item.status === 'Paid' ? 'status-present' : 'status-absent'}`}>
                                                        {item.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {item.status !== 'Paid' && (
                                                        <button 
                                                            className="btn-save-grade" 
                                                            onClick={async () => {
                                                                await updateDoc(doc(db, 'fee_collections', item.id), { 
                                                                    paidAmount: item.totalFee, 
                                                                    balance: 0, 
                                                                    status: 'Paid' 
                                                                });
                                                                alert("Marked as Paid! Receipt generated for student.");
                                                            }}
                                                        >
                                                            <Check size={13} /> Mark Paid & Send Receipt
                                                        </button>
                                                    )}
                                                    <button className="delete-task-btn" onClick={() => handleDelete('fee_collections', item.id)} title="Delete"><X size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* EXAM HALL ALLOCATION MODULE */}
                    {activeTab === 'exam-halls' && (
                        <div className="exam-allocation-page">
                            <div className="dash-card full-width exam-allocation-hero">
                                <div className="card-header">
                                    <div>
                                        <span className="exam-module-kicker">EXAMINATION MANAGEMENT</span>
                                        <h3>Exam Hall Allocation</h3>
                                        <p className="subtitle">First allocate students to a hall, then assign the invigilating staff to the same hall. All allocations are synchronized in Firestore.</p>
                                    </div>
                                    <div className="exam-live-badge"><CheckCircle size={15} /> Live Sync</div>
                                </div>
                            </div>

                            <div className="exam-allocation-grid">
                                {/* STUDENT ALLOCATION */}
                                <div className="dash-card exam-allocation-card">
                                    <div className="exam-card-title">
                                        <div className="exam-title-icon students"><GraduationCap size={19} /></div>
                                        <div>
                                            <h3>Students</h3>
                                            <p>Select Class → Section → Students → Hall No</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleStudentHallAllocation}>
                                        <div className="exam-form-grid">
                                            <div className="exam-field">
                                                <label>Select Class</label>
                                                <select value={examStudentClass} onChange={e => {
                                                    setExamStudentClass(e.target.value);
                                                    setExamStudentSection('');
                                                    setSelectedExamStudents([]);
                                                }} required>
                                                    <option value="">Select Class</option>
                                                    {uniqueClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                                </select>
                                            </div>

                                            <div className="exam-field">
                                                <label>Select Section</label>
                                                <select value={examStudentSection} onChange={e => {
                                                    setExamStudentSection(e.target.value);
                                                    setSelectedExamStudents([]);
                                                }} disabled={!examStudentClass} required>
                                                    <option value="">Select Section</option>
                                                    {examSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                                                </select>
                                            </div>

                                            <div className="exam-field">
                                                <label>Exam Name</label>
                                                <input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. 1st Mid-Term Exam" />
                                            </div>

                                            <div className="exam-field">
                                                <label>Hall No</label>
                                                <input value={examHallNo} onChange={e => setExamHallNo(e.target.value)} placeholder="e.g. Hall 101" required />
                                            </div>

                                            <div className="exam-field">
                                                <label>Hall Capacity</label>
                                                <input type="number" min="1" value={examCapacity} onChange={e => setExamCapacity(e.target.value)} placeholder="Optional" />
                                            </div>
                                        </div>

                                        <div className="exam-student-selector">
                                            <div className="exam-selector-head">
                                                <div>
                                                    <strong>Select Students</strong>
                                                    <span>{examClassStudents.length} available</span>
                                                </div>
                                                <div className="exam-selected-count">{selectedExamStudents.length} Selected</div>
                                            </div>

                                            {!examStudentClass || !examStudentSection ? (
                                                <div className="exam-empty-state"><Users size={22} /><span>Select a class and section to load students.</span></div>
                                            ) : examClassStudents.length === 0 ? (
                                                <div className="exam-empty-state"><Users size={22} /><span>No students found for this class and section.</span></div>
                                            ) : (
                                                <>
                                                    <label className="exam-select-all">
                                                        <input type="checkbox" checked={examClassStudents.length > 0 && examClassStudents.every(s => selectedExamStudents.includes(s.id))} onChange={toggleAllExamStudents} />
                                                        Select All Students
                                                    </label>
                                                    <div className="exam-student-list">
                                                        {examClassStudents.map(student => (
                                                            <label className={`exam-student-row ${selectedExamStudents.includes(student.id) ? 'selected' : ''}`} key={student.id}>
                                                                <input type="checkbox" checked={selectedExamStudents.includes(student.id)} onChange={() => toggleExamStudent(student.id)} />
                                                                <span className="exam-student-avatar">{(student.name || 'S').charAt(0).toUpperCase()}</span>
                                                                <span className="exam-student-info">
                                                                    <strong>{student.name || 'Student'}</strong>
                                                                    <small>#{student.admissionNo || student.id.slice(0, 7)}</small>
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="exam-allocation-summary">
                                            <div><span>No. of Students</span><strong>{selectedExamStudents.length}</strong></div>
                                            <div><span>Class / Section</span><strong>{examStudentClass || '—'} / {examStudentSection || '—'}</strong></div>
                                            <div><span>Hall No</span><strong>{examHallNo || '—'}</strong></div>
                                        </div>

                                        <button type="submit" className="exam-primary-btn" disabled={!selectedExamStudents.length}>
                                            <CheckSquare size={16} /> Assign Students to Hall
                                        </button>
                                    </form>

                                    <div className="exam-existing-section">
                                        <div className="exam-section-heading"><strong>Allocated Halls</strong><span>{examHalls.length}</span></div>
                                        <div className="exam-allocation-table-wrap">
                                            <table className="custom-table exam-allocation-table">
                                                <thead><tr><th>Hall</th><th>Class / Section</th><th>Students</th><th>Seat Nos.</th><th>Exam</th><th></th></tr></thead>
                                                <tbody>
                                                    {examHalls.length === 0 ? <tr><td colSpan="6" className="exam-table-empty">No student hall allocations yet.</td></tr> : examHalls.map(item => (
                                                        <tr key={item.id}>
                                                            <td><strong>{item.hallNo}</strong></td>
                                                            <td><span className="task-target-tag">{item.targetClass || '—'} / {item.targetSection || '—'}</span></td>
                                                            <td><span className="exam-count-badge">{item.studentCount || item.studentIds?.length || 0}</span></td>
                                                            <td><span className="exam-seat-range">{Array.isArray(item.studentList) && item.studentList.length ? `1–${item.studentList.length}` : '—'}</span></td>
                                                            <td>{item.examName || 'Examination'}</td>
                                                            <td><button className="delete-task-btn" onClick={() => handleDelete('exam_hall_allocations', item.id)} title="Delete"><X size={14} /></button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* STAFF ALLOCATION */}
                                <div className="dash-card exam-allocation-card">
                                    <div className="exam-card-title">
                                        <div className="exam-title-icon staff"><UserCheck size={19} /></div>
                                        <div>
                                            <h3>Staff</h3>
                                            <p>Select Staff → Hall → Student List → Assign</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleStaffHallAssignment}>
                                        <div className="exam-form-grid">
                                            <div className="exam-field exam-field-wide">
                                                <label>Select Staff</label>
                                                <select value={selectedExamStaff} onChange={e => setSelectedExamStaff(e.target.value)} required>
                                                    <option value="">Select Staff Member</option>
                                                    {staffList.map(staff => <option key={staff.id} value={staff.id}>{staff.name || staff.staffName || 'Staff'}{staff.department ? ` — ${staff.department}` : ''}</option>)}
                                                </select>
                                            </div>

                                            <div className="exam-field exam-field-wide">
                                                <label>Hall No</label>
                                                <select value={selectedStaffHall} onChange={e => setSelectedStaffHall(e.target.value)} required>
                                                    <option value="">Select Allocated Hall</option>
                                                    {examHalls.map(hall => <option key={hall.id} value={hall.id}>{hall.hallNo} — {hall.targetClass || ''} {hall.targetSection ? `/ ${hall.targetSection}` : ''} — {hall.studentCount || hall.studentIds?.length || 0} Students</option>)}
                                                </select>
                                            </div>

                                            <div className="exam-field exam-field-wide">
                                                <label>Duty Time / Slot</label>
                                                <input value={staffDutyTime} onChange={e => setStaffDutyTime(e.target.value)} placeholder="e.g. 09:30 AM - 12:30 PM" />
                                            </div>
                                        </div>

                                        <div className="exam-staff-preview">
                                            <div className="exam-selector-head">
                                                <div>
                                                    <strong>List Students</strong>
                                                    <span>{selectedStaffHallRecord ? `${selectedStaffHallRecord.targetClass || ''} ${selectedStaffHallRecord.targetSection ? `/ ${selectedStaffHallRecord.targetSection}` : ''}` : 'Select a hall'}</span>
                                                </div>
                                                <div className="exam-selected-count">{staffHallStudents.length || selectedStaffHallRecord?.studentCount || 0} Students</div>
                                            </div>

                                            {!selectedStaffHallRecord ? (
                                                <div className="exam-empty-state"><LayoutGrid size={22} /><span>Select an allocated hall to see its student list.</span></div>
                                            ) : staffHallStudents.length === 0 ? (
                                                <div className="exam-empty-state"><Users size={22} /><span>This hall has no student list stored.</span></div>
                                            ) : (
                                                <div className="exam-staff-student-list">
                                                    {staffHallStudents.map((student, idx) => (
                                                        <div className="exam-staff-student-row" key={student.id || idx}>
                                                            <span className="exam-student-number">{idx + 1}</span>
                                                            <span><strong>{student.name}</strong><small>#{student.admissionNo || 'N/A'}</small></span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="exam-allocation-summary staff-summary">
                                            <div><span>Staff</span><strong>{staffList.find(s => s.id === selectedExamStaff)?.name || '—'}</strong></div>
                                            <div><span>No. of Students</span><strong>{staffHallStudents.length || selectedStaffHallRecord?.studentCount || 0}</strong></div>
                                            <div><span>Hall No</span><strong>{selectedStaffHallRecord?.hallNo || '—'}</strong></div>
                                        </div>

                                        <button type="submit" className="exam-primary-btn staff-btn" disabled={!selectedExamStaff || !selectedStaffHall}>
                                            <UserCheck size={16} /> Assign Invigilation Duty
                                        </button>
                                    </form>

                                    <div className="exam-existing-section">
                                        <div className="exam-section-heading"><strong>Assigned Staff Duties</strong><span>{staffExamHalls.length}</span></div>
                                        <div className="exam-allocation-table-wrap">
                                            <table className="custom-table exam-allocation-table">
                                                <thead><tr><th>Staff</th><th>Hall</th><th>Students</th><th>Duty Time</th><th></th></tr></thead>
                                                <tbody>
                                                    {staffExamHalls.length === 0 ? <tr><td colSpan="5" className="exam-table-empty">No staff duties assigned yet.</td></tr> : staffExamHalls.map(item => (
                                                        <tr key={item.id}>
                                                            <td><strong>{item.staffName}</strong></td>
                                                            <td>{item.hallNo}</td>
                                                            <td><span className="exam-count-badge">{item.studentCount || item.studentIds?.length || 0}</span></td>
                                                            <td><span className="task-target-tag">{item.dutyTime || 'Exam Duty'}</span></td>
                                                            <td><button className="delete-task-btn" onClick={() => handleDelete('staff_exam_halls', item.id)} title="Delete"><X size={14} /></button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STAFF LEAVE APPROVALS */}
                    {activeTab === 'leaves' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Staff Leave Applications & Approvals</h3>
                                    <p className="subtitle">Review and approve or reject staff leave requests</p>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Staff Name</th>
                                            <th>Leave Type</th>
                                            <th>From - To</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaveRequests.length === 0 ? (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>No pending leave requests.</td></tr>
                                        ) : (
                                            leaveRequests.map(leave => (
                                                <tr key={leave.id}>
                                                    <td><strong>{leave.staffName || 'Faculty Member'}</strong></td>
                                                    <td>{leave.leaveType || 'Casual Leave'}</td>
                                                    <td>{leave.fromDate} to {leave.toDate}</td>
                                                    <td>{leave.reason || 'Personal'}</td>
                                                    <td>
                                                        <span className={`status-badge ${leave.status === 'Approved' ? 'status-present' : leave.status === 'Rejected' ? 'status-absent' : ''}`}>
                                                            {leave.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                        <button className="btn-save-grade" onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')} style={{ background: '#059669', padding: '4px 8px' }}>
                                                            <Check size={12} /> Approve
                                                        </button>
                                                        <button className="btn-save-grade" onClick={() => handleUpdateLeaveStatus(leave.id, 'Rejected')} style={{ background: '#dc2626', padding: '4px 8px' }}>
                                                            <X size={12} /> Reject
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* INTERNAL TASK BOARD */}
                    {activeTab === 'tasks' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Front Office Internal Task Board</h3>
                                    <p className="subtitle">Manage daily front-desk administrative tasks</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('office_tasks', taskForm, () =>
                                    setTaskForm({ title: '', assignedTo: '', priority: 'Normal', deadline: '' })
                                );
                            }} className="form-grid" style={{ marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Task Title</label>
                                    <input type="text" className="table-input full-width-input" placeholder="Task description..." value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Assigned To</label>
                                    <input type="text" className="table-input full-width-input" placeholder="Staff Name" value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Priority</label>
                                    <select className="custom-select full-width" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                        <option value="Normal">Normal</option>
                                        <option value="High">High Priority</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Deadline</label>
                                    <input type="date" className="table-input full-width-input" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} required />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
                                        <PlusCircle size={15} /> Add Task
                                    </button>
                                </div>
                            </form>

                            <h4>Active Office Tasks ({officeTasks.length})</h4>
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Task Title</th>
                                            <th>Assigned To</th>
                                            <th>Priority</th>
                                            <th>Deadline</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {officeTasks.map(item => (
                                            <tr key={item.id}>
                                                <td><strong>{item.title}</strong></td>
                                                <td>{item.assignedTo}</td>
                                                <td><span className="task-target-tag">{item.priority}</span></td>
                                                <td>{item.deadline}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="delete-task-btn" onClick={() => handleDelete('office_tasks', item.id)} title="Delete Task"><X size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}