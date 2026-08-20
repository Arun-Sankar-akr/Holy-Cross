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
                                    <div className="nav-links-content"><Users size={16} /><span>Students</span></div>
                                </button>
                                <button className={`nav-links ${activeTab === 'exam-staff' ? 'active' : ''}`} onClick={() => { setActiveTab('exam-staff'); setIsMobileMenuOpen(false); }}>
                                    <div className="nav-links-content"><UserCheck size={16} /><span>Staff</span></div>
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

                    {/* EXAM HALLS MODULE - STUDENTS */}
                    {activeTab === 'exam-halls' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Exam Hall Allocation - Students</h3>
                                    <p className="subtitle">Assign students to specific examination seating arrangements</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('exam_hall_allocations', hallForm, () =>
                                    setHallForm({ hallNo: '', examName: '', targetClass: '', capacity: '', invigilator: '' })
                                );
                            }} className="form-grid" style={{ marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Hall No / Room</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. Hall 101" value={hallForm.hallNo} onChange={e => setHallForm({ ...hallForm, hallNo: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Exam Name</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. Mid Term Exam" value={hallForm.examName} onChange={e => setHallForm({ ...hallForm, examName: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Target Class</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. 10th Std" value={hallForm.targetClass} onChange={e => setHallForm({ ...hallForm, targetClass: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Capacity</label>
                                    <input type="number" className="table-input full-width-input" placeholder="e.g. 30" value={hallForm.capacity} onChange={e => setHallForm({ ...hallForm, capacity: e.target.value })} required />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Invigilator Assigned</label>
                                    <input type="text" className="table-input full-width-input" placeholder="Faculty Name" value={hallForm.invigilator} onChange={e => setHallForm({ ...hallForm, invigilator: e.target.value })} required />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
                                        <PlusCircle size={15} /> Save Student Hall Allocation
                                    </button>
                                </div>
                            </form>

                            <h4>Allocated Examination Rooms ({examHalls.length})</h4>
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Hall No</th>
                                            <th>Exam Name</th>
                                            <th>Class</th>
                                            <th>Capacity</th>
                                            <th>Invigilator</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {examHalls.map(item => (
                                            <tr key={item.id}>
                                                <td><strong>{item.hallNo}</strong></td>
                                                <td>{item.examName}</td>
                                                <td><span className="task-target-tag">{item.targetClass}</span></td>
                                                <td>{item.capacity} Seats</td>
                                                <td>{item.invigilator}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="delete-task-btn" onClick={() => handleDelete('exam_hall_allocations', item.id)} title="Delete"><X size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* EXAM HALLS MODULE - STAFF */}
                    {activeTab === 'exam-staff' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Exam Hall Allocation - Staff Duties</h3>
                                    <p className="subtitle">Assign faculty invigilation duties across exam halls</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('staff_exam_halls', staffHallForm, () =>
                                    setStaffHallForm({ hallNo: '', examName: '', staffName: '', dutyTime: '' })
                                );
                            }} className="form-grid" style={{ marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Hall No / Room</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. Hall 101" value={staffHallForm.hallNo} onChange={e => setStaffHallForm({ ...staffHallForm, hallNo: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Exam Name</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. Mid Term Exam" value={staffHallForm.examName} onChange={e => setStaffHallForm({ ...staffHallForm, examName: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Staff Member</label>
                                    <input type="text" className="table-input full-width-input" placeholder="Faculty Name" value={staffHallForm.staffName} onChange={e => setStaffHallForm({ ...staffHallForm, staffName: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Duty Time / Slot</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. 09:30 AM - 12:30 PM" value={staffHallForm.dutyTime} onChange={e => setStaffHallForm({ ...staffHallForm, dutyTime: e.target.value })} required />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
                                        <PlusCircle size={15} /> Assign Staff Duty
                                    </button>
                                </div>
                            </form>

                            <h4>Assigned Staff Invigilation Duties ({staffExamHalls.length})</h4>
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Hall No</th>
                                            <th>Exam Name</th>
                                            <th>Staff Member</th>
                                            <th>Duty Time</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffExamHalls.map(item => (
                                            <tr key={item.id}>
                                                <td><strong>{item.hallNo}</strong></td>
                                                <td>{item.examName}</td>
                                                <td>{item.staffName}</td>
                                                <td><span className="task-target-tag">{item.dutyTime}</span></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="delete-task-btn" onClick={() => handleDelete('staff_exam_halls', item.id)} title="Delete"><X size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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