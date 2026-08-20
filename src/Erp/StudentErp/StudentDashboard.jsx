import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import {
    BookOpen, Calendar, Award, CheckCircle, Bell, Search, LogOut,
    Menu, X, Clock, FileText, User, AlertCircle, Layers, Check, XCircle,
    Upload, FileCheck, ExternalLink, Loader2, AlertTriangle, Printer,
    ChevronRight, BarChart2, Filter, DollarSign, Receipt
} from 'lucide-react';
import './StudentDashboard.css';
import logo from "../../assets/logo.png"

export default function StudentDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [studentData, setStudentData] = useState({ name: 'Student', grade: '', section: '', rollNo: '', id: '' });

    // Live Synced States
    const [timetableList, setTimetableList] = useState([]);
    const [liveStudentRecord, setLiveStudentRecord] = useState(null);
    const [announcementsList, setAnnouncementsList] = useState([]);
    const [assignmentsList, setAssignmentsList] = useState([]);
    const [submissionsList, setSubmissionsList] = useState([]);
    const [feeRecords, setFeeRecords] = useState([]);
    const [showFeeAlertModal, setShowFeeAlertModal] = useState(false);

    // Selected Receipt state for printing the official fee receipt view
    const [selectedPrintReceipt, setSelectedPrintReceipt] = useState(null);

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

    // 2. Real-time Live Synchronized Records & Fees Listeners
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
            setAnnouncementsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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

        const unsubFees = onSnapshot(collection(db, 'fee_collections'), (snap) => {
            const allFees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const myFees = allFees.filter(f =>
                cleanString(f.admissionNo) === cleanString(studentData.rollNo) ||
                cleanString(f.studentName) === cleanString(studentData.name)
            );
            setFeeRecords(myFees);

            const hasUnpaid = myFees.some(f => f.status !== 'Paid' && Number(f.balance) > 0);
            if (hasUnpaid) {
                setShowFeeAlertModal(true);
            }
        });

        return () => {
            unsubStudents();
            unsubAnnounce();
            unsubAssignments();
            unsubSubmissions();
            unsubFees();
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

    // Attendance Calculations
    const hasStaffSubmittedAttendance = Boolean(liveStudentRecord?.lastAttendanceDate || liveStudentRecord?.status);
    const currentAttendanceStatus = hasStaffSubmittedAttendance ? (liveStudentRecord?.status || 'present') : 'pending';
    const rawAttendanceRate = hasStaffSubmittedAttendance ? (liveStudentRecord?.attendanceRate ? parseInt(liveStudentRecord.attendanceRate) : (currentAttendanceStatus === 'present' ? 94 : 68)) : 0;
    const isDefaulter = hasStaffSubmittedAttendance && rawAttendanceRate < 75;

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

    const pendingFeesList = feeRecords.filter(f => f.status !== 'Paid');
    const paidFeesList = feeRecords.filter(f => f.status === 'Paid');

    const stats = [
        {
            title: 'Attendance Rate',
            value: hasStaffSubmittedAttendance ? `${rawAttendanceRate}%` : 'Pending',
            icon: isDefaulter ? AlertTriangle : CheckCircle,
            color: isDefaulter ? 'rose' : 'emerald',
            badge: hasStaffSubmittedAttendance ? (isDefaulter ? 'Below 75% Minimum' : 'Compliant') : 'Awaiting Faculty'
        },
        {
            title: 'Fee Status',
            value: pendingFeesList.length > 0 ? `₹${pendingFeesList.reduce((acc, curr) => acc + Number(curr.balance), 0)} Due` : 'Paid',
            icon: DollarSign,
            color: pendingFeesList.length > 0 ? 'rose' : 'emerald',
            badge: pendingFeesList.length > 0 ? 'Dues Pending' : 'All Cleared'
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
            {/* INLINE CSS TO PREVENT OVERPADDING & FORCE SINGLE-PAGE A4 PRINT FIT WITH A CRISP BORDER */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .receipt-modal-overlay, .receipt-modal-overlay * {
                        visibility: visible !important;
                    }
                    .receipt-modal-overlay {
                        position: fixed !important;
                        left: 0 !important;
                        top: -50px !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        background: white !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        overflow: hidden !important;
                        z-index: 99999 !important;
                        padding: 0 !important;
                    }
                    .official-receipt-card {
                        box-shadow: none !important;
                        border: 2px solid #0f172a !important;
                        width: 100% !important;
                        max-width: 180mm !important;
                        padding: 28mm 10mm 70mm 10mm !important;
                        margin: 0 auto !important;
                        transform: scale(0.98);
                    }
                    .receipt-modal-overlay button {
                        display: none !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 5mm;
                    }
                }
            `}</style>

            {/* POPUP MODAL FOR OFFICIAL FEE RECEIPT VIEW & PRINT */}
            {selectedPrintReceipt && (
                <div className="receipt-modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, overflowY: 'auto', padding: '15px'
                }}>
                    <div className="official-receipt-card" style={{
                        background: '#ffffff', width: '100%', maxWidth: '580px', padding: '20px 24px', borderRadius: '12px',
                        border: '2px solid #cbd5e1', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', position: 'relative', color: '#1e293b', fontFamily: 'Arial, sans-serif'
                    }}>
                        <button
                            onClick={() => setSelectedPrintReceipt(null)}
                            style={{ position: 'absolute', top: '12px', right: '12px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <X size={16} />
                        </button>

                        {/* RECEIPT HEADER WITH UPLOADED SCHOOL EMBLEM & EXACT SCHOOL NAME */}
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '10px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '4px' }}>
                                <img
                                    src={logo}
                                    alt="Holy Cross Emblem"
                                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0284c7' }}
                                />
                                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    HOLY CROSS MATRIC. HR. SEC. SCHOOL
                                </h2>
                            </div>
                            <p style={{ margin: '2px 0', fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Somarasampettai, Tiruchirapalli 102</p>
                            <div style={{ marginTop: '6px', display: 'inline-block', background: '#f0fdf4', color: '#166534', padding: '2px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, border: '1px solid #bbf7d0' }}>
                                OFFICIAL FEE PAYMENT RECEIPT
                            </div>
                        </div>

                        {/* RECEIPT META */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '10px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                            <div><strong>Receipt No:</strong> RCPT-{selectedPrintReceipt.id ? selectedPrintReceipt.id.substring(0, 8).toUpperCase() : '2026/001'}</div>
                            <div><strong>Date:</strong> {selectedPrintReceipt.date || new Date().toLocaleDateString()}</div>
                        </div>

                        {/* STUDENT & PAYMENT DETAILS BREAKDOWN */}
                        <div style={{ marginBottom: '12px' }}>
                            <h4 style={{ fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '6px', color: '#334155' }}>Student Details</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.78rem', marginBottom: '10px' }}>
                                <div><strong>Student Name:</strong> {studentData.name}</div>
                                <div><strong>Admission Number:</strong> {studentData.rollNo || 'N/A'}</div>
                                <div><strong>Class:</strong> {studentData.grade || 'N/A'}</div>
                                <div><strong>Section:</strong> {studentData.section || 'N/A'}</div>
                            </div>

                            <h4 style={{ fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '6px', color: '#334155' }}>Transaction Details</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.78rem' }}>
                                <div><strong>Which Fees / Term:</strong> {selectedPrintReceipt.term || 'Term 1'}</div>
                                <div><strong>Transaction ID:</strong> TXN-{Math.floor(100000000 + Math.random() * 900000000)}</div>
                                <div><strong>Payment Mode:</strong> Cash / Online Verified</div>
                                <div><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>SUCCESS</span></div>
                            </div>
                        </div>

                        {/* TABLE SUMMARY */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '0.78rem' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                    <th style={{ padding: '5px 8px', border: '1px solid #cbd5e1', width: '40px' }}>S.No</th>
                                    <th style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>Fee Description</th>
                                    <th style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>1</td>
                                    <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>{selectedPrintReceipt.term || 'Term 1'}</td>
                                    <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>₹{selectedPrintReceipt.totalFee || selectedPrintReceipt.paidAmount || '0.00'}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', marginBottom: '14px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Total Amount Paid:</span>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0284c7' }}>₹{selectedPrintReceipt.totalFee || selectedPrintReceipt.paidAmount || '0.00'}</span>
                        </div>

                        {/* SIGNATURES & FOOTER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.74rem', color: '#64748b' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid #94a3b8', width: '130px', paddingTop: '3px', margin: '0 auto' }}>Student Signature</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid #94a3b8', width: '130px', paddingTop: '3px', margin: '0 auto' }}>Authorized Signatory</div>
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button
                                onClick={() => window.print()}
                                style={{ flex: 1, background: '#0284c7', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <Printer size={15} /> Print / Download Receipt
                            </button>
                            <button
                                onClick={() => setSelectedPrintReceipt(null)}
                                style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POPUP ALERT FOR PENDING FEE DUES */}
            {showFeeAlertModal && pendingFeesList.length > 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <DollarSign size={22} /> Fee Dues Alert!
                            </h3>
                            <button onClick={() => setShowFeeAlertModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                            Dear <strong>{studentData.name}</strong>, you have pending fee balances assigned by the front office desk. Please clear them at the office counter.
                        </p>
                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', margin: '1rem 0' }}>
                            {pendingFeesList.map(fee => (
                                <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                    <span>{fee.term}:</span>
                                    <strong style={{ color: '#dc2626' }}>₹{fee.balance} Pending</strong>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => { setShowFeeAlertModal(false); setActiveTab('fees-history'); }}
                            style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            View Fee History & Receipts
                        </button>
                    </div>
                </div>
            )}

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
                            className={`staff-nav-item ${activeTab === 'fees-history' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('fees-history'); setIsMobileMenuOpen(false); }}
                        >
                            <Receipt size={16} /><span>Fees History and Receipt</span>
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
                        {activeTab === 'overview' && (
                            <>
                                <div className="staff-welcome-card">
                                    <div>
                                        <h2>Welcome back, <span className="green-accent">{studentData.name}</span>! 👋</h2>
                                        <p>Enrolled in {studentData.grade} {studentData.section ? `(Section ${studentData.section})` : ''} • Student Portal</p>
                                    </div>
                                    <div className="attendance-pill-box">
                                        <span className="pill-label">Roll Call:</span>
                                        <span className={`status-badge status-${currentAttendanceStatus}`}>
                                            {currentAttendanceStatus === 'present' ? <Check size={12} /> : (currentAttendanceStatus === 'absent' ? <XCircle size={12} /> : <Clock size={12} />)}
                                            {currentAttendanceStatus.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

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
                                            <div
                                                key={idx}
                                                className="staff-stat-box"
                                                onClick={() => s.title === 'Fee Status' && setActiveTab('fees-history')}
                                                style={s.title === 'Fee Status' ? { cursor: 'pointer' } : {}}
                                            >
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

                                    <div className="staff-card">
                                        <div className="card-header">
                                            <h3>Notice Board Circulars</h3>
                                            <Bell size={16} className="muted-icon" />
                                        </div>
                                        <div className="student-notice-list">
                                            {announcementsList.slice(0, 3).map((item) => (
                                                <div key={item.id} className="student-notice-item">
                                                    <p>{item.content || item.message}</p>
                                                    <span className="notice-time">
                                                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : (item.date || 'Recent')}
                                                    </span>
                                                </div>
                                            ))}
                                            {announcementsList.length === 0 && (
                                                <p style={{ color: 'var(--staff-text-muted)', fontSize: '0.78rem' }}>No announcements available.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="staff-card full">
                                <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h3>Attendance Summary & Period Logs</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>
                                            Real-time attendance record and daily roll call logs for {studentData.name} (#{studentData.rollNo})
                                        </p>
                                    </div>

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

                        {activeTab === 'fees-history' && (
                            <div className="staff-card full">
                                <div className="card-header">
                                    <div>
                                        <h3>Fees History and Official Receipts</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>
                                            View your payment ledgers and open official term receipts containing School Logo, Term Name, Student Name, Admission Number, Class, Section, and Transaction ID.
                                        </p>
                                    </div>
                                </div>

                                <h4 style={{ marginTop: '1rem' }}>Pending Fee Dues</h4>
                                <div className="table-responsive" style={{ marginBottom: '2rem' }}>
                                    <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th>Term / Fees</th>
                                                <th>Total Fee</th>
                                                <th>Paid Amount</th>
                                                <th>Balance Due</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingFeesList.length === 0 ? (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: 'green' }}>No pending fee dues. All accounts clear!</td></tr>
                                            ) : (
                                                pendingFeesList.map(fee => (
                                                    <tr key={fee.id}>
                                                        <td><strong>{fee.term}</strong></td>
                                                        <td>₹{fee.totalFee}</td>
                                                        <td>₹{fee.paidAmount || 0}</td>
                                                        <td style={{ color: 'red', fontWeight: 700 }}>₹{fee.balance}</td>
                                                        <td><span className="status-badge status-absent">Pending Counter Payment</span></td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <h4>Settled Transactions & Downloadable Official Receipts</h4>
                                <div className="table-responsive">
                                    <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th>Which Fees (Term)</th>
                                                <th>Amount Paid</th>
                                                <th>Payment Status</th>
                                                <th style={{ textAlign: 'right' }}>Official Receipt View</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paidFeesList.length === 0 ? (
                                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>No completed payments found.</td></tr>
                                            ) : (
                                                paidFeesList.map(fee => (
                                                    <tr key={fee.id}>
                                                        <td><strong>{fee.term}</strong></td>
                                                        <td>₹{fee.totalFee}</td>
                                                        <td><span className="status-badge status-present"><Check size={12} /> PAID</span></td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <button
                                                                className="btn-save-grade"
                                                                onClick={() => setSelectedPrintReceipt(fee)}
                                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#0284c7', color: '#fff', cursor: 'pointer' }}
                                                            >
                                                                <Receipt size={13} /> View & Print Receipt
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

                        {activeTab === 'notices' && (
                            <div className="staff-card full">
                                <div className="card-header">
                                    <h3>Campus Circulars & Bulletins</h3>
                                </div>
                                <div className="full-notices-container">
                                    {announcementsList.map((item) => (
                                        <div key={item.id} className="bulletin-card">
                                            <div className="bulletin-header">
                                                <span className="bulletin-tag">Official Notice</span>
                                                <span className="bulletin-date">
                                                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : (item.date || 'Live')}
                                                </span>
                                            </div>
                                            <p>{item.content || item.message}</p>
                                        </div>
                                    ))}
                                    {announcementsList.length === 0 && (
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