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
    CheckCircle, XCircle, LogOut, PlusCircle, Check, X, Menu, LayoutGrid, ChevronDown, ChevronUp, UserCheck
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

    // Class-wise Directory Selection State for Fees
    const [selectedDirectoryClass, setSelectedDirectoryClass] = useState('');

    // Form States
    const [enquiryForm, setEnquiryForm] = useState({ studentName: '', parentName: '', phone: '', grade: '10th Std', notes: '' });
    const [feeForm, setFeeForm] = useState({ admissionNo: '', studentName: '', class: '', totalFee: '', paidAmount: '', term: 'Term 1' });
    const [taskForm, setTaskForm] = useState({ title: '', assignedTo: '', priority: 'Normal', deadline: '' });
    const [hallForm, setHallForm] = useState({ hallNo: '', examName: '', targetClass: '', capacity: '', invigilator: '' });

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

        return () => {
            unsubEnquiries();
            unsubFees();
            unsubLeaves();
            unsubTasks();
            unsubStaff();
            unsubStudents();
            unsubHalls();
        };
    }, []);

    // Extract unique classes dynamically from students list for class-wise directory & exams
    const uniqueClasses = Array.from(new Set(studentsList.map(s => s.className || s.grade).filter(Boolean)));

    // Filter students based on the selected class directory filter
    const filteredStudentsByClass = selectedDirectoryClass
        ? studentsList.filter(s => (s.className || s.grade) === selectedDirectoryClass)
        : [];

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

    const handleLogout = () => {
        localStorage.removeItem('officeUser');
        signOut(auth);
        navigate('/erp/office/login');
    };

    return (
        <div className="dashboard-containers">
            {/* Mobile Topbar */}
            <header className="mobile-topbar" style={{ display: 'none' }}>
                <div className="mobile-brand">
                   <img src={logo} alt="" id='logogs' /> <span>Office Management Portal</span>
                </div>
                <button className="menu-toggle-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </header>

            {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block' }} />}

            {/* Sidebar Navigation */}
            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-icon"> <img src={logo} alt=""  id='logogs'/> </div>
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

                    {/* ===== EXAM HALL ALLOCATION WITH SUBMENUS ===== */}
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
                    {/* 1. ENQUIRIES MODULE */}
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
                                        <option value="LKG">LKG / UKG</option>
                                        <option value="1st Std">1st Std - 5th Std</option>
                                        <option value="6th Std">6th Std - 8th Std</option>
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
                                        {enquiries.length === 0 ? (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No active enquiries recorded.</td></tr>
                                        ) : (
                                            enquiries.map(item => (
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
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 2. FEES MODULE WITH CLASS-WISE DIRECTORY INTEGRATION */}
                    {activeTab === 'fees' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Fee Collection & Payment Desk</h3>
                                    <p className="subtitle">Select class and pick student from the class-wise directory</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('fee_collections', {
                                    ...feeForm,
                                    balance: Number(feeForm.totalFee) - Number(feeForm.paidAmount),
                                    status: Number(feeForm.paidAmount) >= Number(feeForm.totalFee) ? 'Paid' : 'Partial'
                                }, () => {
                                    setFeeForm({ admissionNo: '', studentName: '', class: '', totalFee: '', paidAmount: '', term: 'Term 1' });
                                    setSelectedDirectoryClass('');
                                });
                            }} className="form-grid" style={{ marginBottom: '1.25rem' }}>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>1. Select Class Directory</label>
                                    <select
                                        className="custom-select full-width"
                                        value={selectedDirectoryClass}
                                        onChange={e => {
                                            setSelectedDirectoryClass(e.target.value);
                                            setFeeForm(prev => ({ ...prev, admissionNo: '', studentName: '', class: e.target.value }));
                                        }}
                                    >
                                        <option value="">-- Choose Class --</option>
                                        {uniqueClasses.map(className => (
                                            <option key={className} value={className}>{className}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>2. Select Student from Class</label>
                                    <select
                                        className="custom-select full-width"
                                        disabled={!selectedDirectoryClass}
                                        onChange={e => {
                                            const selectedId = e.target.value;
                                            if (!selectedId) return;
                                            const foundStudent = studentsList.find(s => s.id === selectedId);
                                            if (foundStudent) {
                                                setFeeForm({
                                                    ...feeForm,
                                                    admissionNo: foundStudent.admissionNo || '',
                                                    studentName: foundStudent.name || '',
                                                    class: `${foundStudent.className || foundStudent.grade || ''} ${foundStudent.sectionName ? `- ${foundStudent.sectionName}` : ''}`.trim()
                                                });
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            {selectedDirectoryClass ? `-- Select Student (${filteredStudentsByClass.length} available) --` : '-- Select a class first --'}
                                        </option>
                                        {filteredStudentsByClass.map(st => (
                                            <option key={st.id} value={st.id}>
                                                {st.name} (Adm: #{st.admissionNo}) {st.sectionName ? `[Sec: ${st.sectionName}]` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Admission No</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. ADM001" value={feeForm.admissionNo} onChange={e => setFeeForm({ ...feeForm, admissionNo: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Student Full Name</label>
                                    <input type="text" className="table-input full-width-input" placeholder="Student Name" value={feeForm.studentName} onChange={e => setFeeForm({ ...feeForm, studentName: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Class</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. 10th Std" value={feeForm.class} onChange={e => setFeeForm({ ...feeForm, class: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Term</label>
                                    <select className="custom-select full-width" value={feeForm.term} onChange={e => setFeeForm({ ...feeForm, term: e.target.value })}>
                                        <option value="Term 1">Term 1</option>
                                        <option value="Term 2">Term 2</option>
                                        <option value="Term 3">Term 3</option>
                                        <option value="Annual Full Fee">Annual Full Fee</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Total Fee (₹)</label>
                                    <input type="number" className="table-input full-width-input" placeholder="Total Amount" value={feeForm.totalFee} onChange={e => setFeeForm({ ...feeForm, totalFee: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Paid Amount (₹)</label>
                                    <input type="number" className="table-input full-width-input" placeholder="Paid Amount" value={feeForm.paidAmount} onChange={e => setFeeForm({ ...feeForm, paidAmount: e.target.value })} required />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
                                        <PlusCircle size={15} /> Record Payment & Ledger
                                    </button>
                                </div>
                            </form>

                            <h4>Fee Ledgers & Records ({feesList.length})</h4>
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Adm No</th>
                                            <th>Student Name</th>
                                            <th>Class</th>
                                            <th>Term</th>
                                            <th>Paid / Total</th>
                                            <th>Balance Due</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feesList.length === 0 ? (
                                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No fee transactions logged.</td></tr>
                                        ) : (
                                            feesList.map(item => (
                                                <tr key={item.id}>
                                                    <td><code>#{item.admissionNo}</code></td>
                                                    <td><strong>{item.studentName}</strong></td>
                                                    <td>{item.class}</td>
                                                    <td>{item.term}</td>
                                                    <td>₹{item.paidAmount} / ₹{item.totalFee}</td>
                                                    <td style={{ color: item.balance > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontWeight: 700 }}>₹{item.balance}</td>
                                                    <td>
                                                        <span className={`status-badge ${item.status === 'Paid' ? 'status-present' : 'status-absent'}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button className="delete-task-btn" onClick={() => handleDelete('fee_collections', item.id)} title="Delete Record"><X size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 3. EXAM HALL ALLOCATION - STUDENTS SUBMENU VIEW */}
                    {activeTab === 'exam-halls' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Exam Hall & Seating Allocations (Students)</h3>
                                    <p className="subtitle">Assign examination rooms and seating capacities for student groups</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('exam_hall_allocations', hallForm, () =>
                                    setHallForm({ hallNo: '', examName: '', targetClass: '', capacity: '', invigilator: '' })
                                );
                            }} className="form-grid" style={{ marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Hall / Room Number</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. Hall 101 / Block B" value={hallForm.hallNo} onChange={e => setHallForm({ ...hallForm, hallNo: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Exam Title / Subject</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. Mid-Term Mathematics" value={hallForm.examName} onChange={e => setHallForm({ ...hallForm, examName: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Target Class / Grade</label>
                                    <select className="custom-select full-width" value={hallForm.targetClass} onChange={e => setHallForm({ ...hallForm, targetClass: e.target.value })} required>
                                        <option value="">Select Target Class</option>
                                        {uniqueClasses.map(cls => (<option key={cls} value={cls}>{cls}</option>))}
                                        <option value="All Classes">All Classes Combined</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Seating Capacity</label>
                                    <input type="number" className="table-input full-width-input" placeholder="e.g. 30 seats" value={hallForm.capacity} onChange={e => setHallForm({ ...hallForm, capacity: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Assigned Invigilator</label>
                                    <select className="custom-select full-width" value={hallForm.invigilator} onChange={e => setHallForm({ ...hallForm, invigilator: e.target.value })} required>
                                        <option value="">Select Faculty Member</option>
                                        {staffList.map(stf => (<option key={stf.id} value={stf.name}>{stf.name} ({stf.department})</option>))}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
                                        <PlusCircle size={15} /> Allocate Exam Hall
                                    </button>
                                </div>
                            </form>

                            <h4>Active Student Exam Hall Allocations ({examHalls.length})</h4>
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Hall / Room</th>
                                            <th>Exam Title</th>
                                            <th>Target Class</th>
                                            <th>Capacity</th>
                                            <th>Invigilator Assigned</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {examHalls.length === 0 ? (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No exam halls allocated yet.</td></tr>
                                        ) : (
                                            examHalls.map(hall => (
                                                <tr key={hall.id}>
                                                    <td><strong>{hall.hallNo}</strong></td>
                                                    <td>{hall.examName}</td>
                                                    <td><span className="task-target-tag">{hall.targetClass}</span></td>
                                                    <td>{hall.capacity} Students</td>
                                                    <td>{hall.invigilator}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button className="delete-task-btn" onClick={() => handleDelete('exam_hall_allocations', hall.id)} title="Remove Allocation"><X size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 4. EXAM HALL ALLOCATION - STAFF SUBMENU VIEW */}
                    {activeTab === 'exam-staff' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Exam Duty & Invigilation Roster (Staff)</h3>
                                    <p className="subtitle">Overview of staff member exam duties across different examination halls</p>
                                </div>
                            </div>

                            <div className="table-responsive" style={{ marginTop: '0.75rem' }}>
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Faculty Member</th>
                                            <th>Assigned Hall</th>
                                            <th>Exam Title</th>
                                            <th>Target Class</th>
                                            <th style={{ textAlign: 'right' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {examHalls.length === 0 ? (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No staff duties assigned through hall allocations yet.</td></tr>
                                        ) : (
                                            examHalls.map(hall => (
                                                <tr key={hall.id}>
                                                    <td><strong>{hall.invigilator || 'Unassigned'}</strong></td>
                                                    <td>{hall.hallNo}</td>
                                                    <td>{hall.examName}</td>
                                                    <td><span className="task-target-tag">{hall.targetClass}</span></td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <span className="status-badge status-present">Assigned Duty</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 5. STAFF LEAVE APPROVALS */}
                    {activeTab === 'leaves' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Staff Attendance & Leave Approvals</h3>
                                    <p className="subtitle">Review casual or medical leave requests submitted by faculty</p>
                                </div>
                            </div>

                            <div className="table-responsive" style={{ marginTop: '0.75rem' }}>
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Staff Name</th>
                                            <th>Leave Type</th>
                                            <th>From Date</th>
                                            <th>To Date</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Decision Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaveRequests.length === 0 ? (
                                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No pending leave requests.</td></tr>
                                        ) : (
                                            leaveRequests.map(leave => (
                                                <tr key={leave.id}>
                                                    <td><strong>{leave.staffName}</strong></td>
                                                    <td>{leave.leaveType || 'Casual Leave'}</td>
                                                    <td>{leave.fromDate || leave.startDate || leave.from || 'N/A'}</td>
                                                    <td>{leave.toDate || leave.endDate || leave.to || 'N/A'}</td>
                                                    <td>{leave.reason}</td>
                                                    <td>
                                                        <span className={`status-badge ${leave.status === 'Approved' ? 'status-present' : leave.status === 'Rejected' ? 'status-absent' : 'status-present'}`}>
                                                            {leave.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="leave-action-btns">
                                                            <button className="btn-approve-leave" onClick={() => updateDoc(doc(db, 'staff_leaves', leave.id), { status: 'Approved' })} title="Approve Leave">
                                                                <CheckCircle size={14} /> Approve
                                                            </button>
                                                            <button className="btn-reject-leave" onClick={() => updateDoc(doc(db, 'staff_leaves', leave.id), { status: 'Rejected' })} title="Reject Leave">
                                                                <XCircle size={14} /> Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))

                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 6. INTERNAL TASK BOARD */}
                    {activeTab === 'tasks' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Internal Office Task Board</h3>
                                    <p className="subtitle">Assign administrative tasks or office operations to personnel</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handlePublish('office_tasks', { ...taskForm, status: 'Open' }, () =>
                                    setTaskForm({ title: '', assignedTo: '', priority: 'Normal', deadline: '' })
                                );
                            }} className="form-grid" style={{ marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Task Title / Objective</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. Audit fee collection receipts" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Assign To Staff</label>
                                    <select className="custom-select full-width" value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })} required>
                                        <option value="">Select Staff Member</option>
                                        {staffList.map(stf => (<option key={stf.id} value={stf.name}>{stf.name} ({stf.department})</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Priority Level</label>
                                    <select className="custom-select full-width" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                        <option value="Normal">Normal Priority</option>
                                        <option value="Urgent">Urgent Priority</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Deadline</label>
                                    <input type="date" className="table-input full-width-input" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} required />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
                                        <PlusCircle size={15} /> Assign Task
                                    </button>
                                </div>
                            </form>

                            <h4>Assigned Task Directory ({officeTasks.length})</h4>
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Task Objective</th>
                                            <th>Assigned To</th>
                                            <th>Priority</th>
                                            <th>Deadline</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {officeTasks.length === 0 ? (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No active office tasks assigned.</td></tr>
                                        ) : (
                                            officeTasks.map(task => (
                                                <tr key={task.id}>
                                                    <td><strong>{task.title}</strong></td>
                                                    <td>{task.assignedTo}</td>
                                                    <td>
                                                        <span style={{ color: task.priority === 'Urgent' ? 'var(--accent-rose)' : '#059669', fontWeight: 700 }}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td>{task.deadline}</td>
                                                    <td>
                                                        <span className={`status-badge ${task.status === 'Completed' ? 'status-present' : 'status-absent'}`}>
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                            <button className="btn-save-grade" onClick={() => updateDoc(doc(db, 'office_tasks', task.id), { status: 'Completed' })} title="Mark Completed">
                                                                <Check size={13} /> Complete
                                                            </button>
                                                            <button className="delete-task-btn" onClick={() => handleDelete('office_tasks', task.id)} title="Delete Task">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
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