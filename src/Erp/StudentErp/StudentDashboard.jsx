import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import {
    BookOpen, Calendar, Award, CheckCircle, Bell, Search, LogOut,
    Menu, X, Clock, FileText, User, Users, Ticket, AlertCircle, Layers, Check, XCircle,
    Upload, FileCheck, ExternalLink, Loader2, AlertTriangle, Printer,
    ChevronRight, BarChart2, Filter, DollarSign, Receipt, Sun, Moon,
    Download, Sparkles, Eye, ChevronDown
} from 'lucide-react';
import './StudentDashboard.css';
import logo from "../../assets/logo.png"
import principalSignature from "../../assets/logo.png"

const HALL_TICKET_SCHOOL_NAME = "HOLY CROSS MATRIC. HR. SEC. SCHOOL";
const HALL_TICKET_SCHOOL_TAGLINE = "Somarasampettai, Tiruchirapalli - 102 (Affiliated to the State Board of School Examinations)";

export default function StudentDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedHallTicket, setSelectedHallTicket] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [examHallMenuOpen, setExamHallMenuOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [studentData, setStudentData] = useState({ name: 'Student', grade: '', section: '', rollNo: '', id: '' });

    // Live Synced States
    const [timetableList, setTimetableList] = useState([]);
    const [liveStudentRecord, setLiveStudentRecord] = useState(null);
    const [announcementsList, setAnnouncementsList] = useState([]);
    const [assignmentsList, setAssignmentsList] = useState([]);
    const [submissionsList, setSubmissionsList] = useState([]);
    const [feeRecords, setFeeRecords] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [studentExamHallAllocations, setStudentExamHallAllocations] = useState([]);
    const [hallTicketPublications, setHallTicketPublications] = useState([]);
    const [examTimetableList, setExamTimetableList] = useState([]);
    const [showFeeAlertModal, setShowFeeAlertModal] = useState(false);
    const [hallTicketMeta, setHallTicketMeta] = useState({ downloadedAt: null, ip: null });

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

    // --- FEATURE 1: Dark / Light Mode Theme Toggle State ---
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('portalTheme') === 'dark');

    // --- FEATURE 2: Header Notification Drawer Dropdown State ---
    const [showNotifDrawer, setShowNotifDrawer] = useState(false);

    // --- Unread tracking for the Notification Bell & Exam Result badge ---
    // A badge dot/count shows only for NEW items since the user last opened
    // that section. Once opened, the badge hides until fresh data arrives.
    const [lastSeenAnnouncementsCount, setLastSeenAnnouncementsCount] = useState(
        () => Number(localStorage.getItem('lastSeenAnnouncementsCount')) || 0
    );
    const [lastSeenMarksCount, setLastSeenMarksCount] = useState(
        () => Number(localStorage.getItem('lastSeenMarksCount')) || 0
    );

    // --- FEATURE 5: Interactive Quick Detail View Modal State ---
    const [detailModalContent, setDetailModalContent] = useState(null);

    // --- FEATURE 6: Personal Scheduled Reminder Popup ---
    // Stored locally in this browser. No Firebase Cloud Messaging or Cloud Functions.
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [showReminderPopup, setShowReminderPopup] = useState(false);
    const [currentReminder, setCurrentReminder] = useState(null);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderDate, setReminderDate] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [reminderNote, setReminderNote] = useState('');
    const [reminders, setReminders] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('studentReminders')) || [];
        } catch {
            return [];
        }
    });

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

    // Check scheduled reminders while the dashboard is open.
    useEffect(() => {
        const checkScheduledReminders = () => {
            try {
                const saved = JSON.parse(localStorage.getItem('studentReminders')) || [];
                const now = new Date();
                const today = [
                    now.getFullYear(),
                    String(now.getMonth() + 1).padStart(2, '0'),
                    String(now.getDate()).padStart(2, '0')
                ].join('-');
                const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                const dueReminder = saved.find(item => {
                    if (!item || item.completed || item.date !== today || !item.time) return false;
                    return item.time <= currentTime;
                });

                if (!dueReminder) return;

                const updated = saved.map(item =>
                    item.id === dueReminder.id ? { ...item, completed: true } : item
                );

                localStorage.setItem('studentReminders', JSON.stringify(updated));
                setReminders(updated);
                setCurrentReminder(dueReminder);
                setShowReminderPopup(true);
            } catch (error) {
                console.error('Reminder check failed:', error);
            }
        };

        checkScheduledReminders();
        const reminderTimer = setInterval(checkScheduledReminders, 10000);

        return () => clearInterval(reminderTimer);
    }, []);

    // Feature 1 Theme Effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('portalTheme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

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

    const saveReminder = () => {
        if (!reminderTitle.trim() || !reminderDate || !reminderTime) {
            alert('Please enter reminder title, date and time.');
            return;
        }

        const newReminder = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: reminderTitle.trim(),
            date: reminderDate,
            time: reminderTime,
            note: reminderNote.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        const updated = [...reminders, newReminder].sort((a, b) =>
            `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
        );

        localStorage.setItem('studentReminders', JSON.stringify(updated));
        setReminders(updated);
        setReminderTitle('');
        setReminderDate('');
        setReminderTime('');
        setReminderNote('');
        setShowReminderModal(false);
    };

    const deleteReminder = (id) => {
        const updated = reminders.filter(item => item.id !== id);
        localStorage.setItem('studentReminders', JSON.stringify(updated));
        setReminders(updated);
    };

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

        const unsubAttendance = onSnapshot(
            collection(db, 'attendance_records'),
            (snap) => {
                const allAttendance = snap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const myAttendance = allAttendance.filter((record) => {
                    const studentIdMatch =
                        record.studentId &&
                        liveStudentRecord?.id &&
                        record.studentId === liveStudentRecord.id;

                    const sessionIdMatch =
                        record.studentId &&
                        studentData.id &&
                        record.studentId === studentData.id;

                    const admissionMatch =
                        cleanString(record.admissionNo) ===
                        cleanString(studentData.rollNo);

                    const nameMatch =
                        cleanString(record.studentName) ===
                        cleanString(studentData.name);

                    return (
                        studentIdMatch ||
                        sessionIdMatch ||
                        admissionMatch ||
                        nameMatch
                    );
                });

                setAttendanceRecords(myAttendance);
            }
        );

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

        const unsubExamHalls = onSnapshot(collection(db, 'exam_hall_allocations'), (snap) => {
            setStudentExamHallAllocations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubHallTicketPublications = onSnapshot(collection(db, 'hall_ticket_publications'), (snap) => {
            setHallTicketPublications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubExamTimetables = onSnapshot(collection(db, 'exam_timetables'), (snap) => {
            setExamTimetableList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubStudents();
            unsubAttendance();
            unsubAnnounce();
            unsubAssignments();
            unsubSubmissions();
            unsubFees();
            unsubExamHalls();
            unsubHallTicketPublications();
            unsubExamTimetables();
        };
    }, [studentData, liveStudentRecord]);

    const studentSchedule = timetableList.filter(item => {
        const itemClass = cleanString(item.className);
        const studentClass = cleanString(studentData.grade);
        const itemSec = cleanString(item.sectionName);
        const studentSec = cleanString(studentData.section);

        const isClassMatch = !itemClass || !studentClass || itemClass === studentClass || itemClass.includes(studentClass) || studentClass.includes(itemClass);
        const isSecMatch = !itemSec || !studentSec || itemSec === studentSec || itemSec.includes(studentSec) || studentSec.includes(itemSec);

        return isClassMatch && isSecMatch;
    });

    const getMySeatNo = (item) => {
        if (!Array.isArray(item.studentList)) return null;
        const mine = item.studentList.find(st =>
            (st.id && st.id === studentData.id) ||
            (st.admissionNo && cleanString(st.admissionNo) === cleanString(studentData.rollNo)) ||
            (st.name && cleanString(st.name) === cleanString(studentData.name))
        );
        return mine?.seatNo || null;
    };

    const myExamHallAllocations = studentExamHallAllocations.filter(item => {
        const itemClass = cleanString(item.targetClass || item.className || item.grade);
        const studentClass = cleanString(studentData.grade);
        const itemSection = cleanString(item.targetSection || item.sectionName || item.section);
        const studentSection = cleanString(studentData.section);
        const classMatch = !itemClass || !studentClass || itemClass === studentClass || itemClass.includes(studentClass) || studentClass.includes(itemClass);
        const sectionMatch = !itemSection || !studentSection || itemSection === studentSection || itemSection.includes(studentSection) || studentSection.includes(itemSection);
        const studentMatch = Array.isArray(item.studentIds) && studentData.id
            ? item.studentIds.includes(studentData.id)
            : Array.isArray(item.studentList) && item.studentList.some(st =>
                (st.id && st.id === studentData.id) ||
                (st.admissionNo && cleanString(st.admissionNo) === cleanString(studentData.rollNo))
            );
        return classMatch && sectionMatch && (studentMatch || (!item.studentIds && !item.studentList));
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

    const marksTotalObtained = filteredMarksEntries.reduce((acc, curr) => acc + curr.score, 0);
    const marksTotalMax = filteredMarksEntries.length * 100;
    const marksPercentage = marksTotalMax > 0 ? ((marksTotalObtained / marksTotalMax) * 100).toFixed(1) : '0.0';
    const studentRank = liveStudentRecord?.rank || liveStudentRecord?.classRank || liveStudentRecord?.examRank || null;

    const hasNewMarks = marksEntries.length > lastSeenMarksCount;
    const unseenAnnouncementsCount = Math.max(announcementsList.length - lastSeenAnnouncementsCount, 0);

    useEffect(() => {
        if (activeTab === 'marks' && marksEntries.length > lastSeenMarksCount) {
            setLastSeenMarksCount(marksEntries.length);
            localStorage.setItem('lastSeenMarksCount', String(marksEntries.length));
        }
    }, [activeTab, marksEntries.length, lastSeenMarksCount]);

    useEffect(() => {
        if ((showNotifDrawer || activeTab === 'notices') && announcementsList.length > lastSeenAnnouncementsCount) {
            setLastSeenAnnouncementsCount(announcementsList.length);
            localStorage.setItem('lastSeenAnnouncementsCount', String(announcementsList.length));
        }
    }, [showNotifDrawer, activeTab, announcementsList.length, lastSeenAnnouncementsCount]);

    // Attendance Calculations
    const attendanceLogs = [...attendanceRecords].sort((a, b) => {
        const dateA = new Date(`${a.date || "1970-01-01"}T00:00:00`);
        const dateB = new Date(`${b.date || "1970-01-01"}T00:00:00`);
        return dateB - dateA;
    });

    const hasStaffSubmittedAttendance = attendanceLogs.length > 0;
    const latestAttendance = attendanceLogs.length > 0 ? attendanceLogs[0] : null;
    const currentAttendanceStatus = latestAttendance?.status || "pending";
    const totalWorkingDays = attendanceLogs.length;

    const presentDaysCount = attendanceLogs.filter(
        (record) => String(record.status || "").toLowerCase() === "present"
    ).length;

    const absentDaysCount = attendanceLogs.filter(
        (record) => String(record.status || "").toLowerCase() === "absent"
    ).length;

    const rawAttendanceRate = totalWorkingDays > 0
        ? Math.round((presentDaysCount / totalWorkingDays) * 100)
        : 0;

    const isDefaulter = hasStaffSubmittedAttendance && rawAttendanceRate < 75;

    const filteredAttendanceLogs = attendanceLogs.filter((log) => {
        const logStatus = String(log.status || "").toLowerCase();
        const selectedStatus = String(attendanceStatusFilter || "all").toLowerCase();
        const matchesStatus = selectedStatus === "all" || logStatus === selectedStatus;
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

    const hasFeeClearance =
        feeRecords.length > 0 &&
        feeRecords.every(f => {
            const status = String(f.status || '').trim().toLowerCase();
            return status === 'paid' || Number(f.balance ?? 0) <= 0;
        });

    const myHallTicketAllocation = myExamHallAllocations?.[0] || null;

    const myPublishedHallTickets = hallTicketPublications.filter(publication => {
        if (publication.published !== true) return false;
        const studentMatch =
            publication.studentId === studentData.id ||
            (publication.admissionNo &&
                cleanString(publication.admissionNo) === cleanString(studentData.rollNo));
        return studentMatch;
    });

    const myHallTicketPublication = myPublishedHallTickets[0] || null;
    const isHallTicketPublished = Boolean(myHallTicketPublication);

    const guardHallTicketAccess = () => {
        if (!myHallTicketAllocation) {
            alert('Exam hall allocation is not available yet. Please contact the office.');
            return false;
        }

        if (!hasFeeClearance) {
            alert('Hall Ticket is blocked because your fees are not fully paid. Please pay the pending fees or meet the office room.');
            return false;
        }

        if (!isHallTicketPublished) {
            alert('Hall Ticket has not been published by the office yet. Please contact the office.');
            return false;
        }

        return true;
    };

    const stampHallTicketMeta = () => {
        const now = new Date();
        setHallTicketMeta({ downloadedAt: now, ip: null });
        fetch('https://api.ipify.org?format=json')
            .then((res) => res.json())
            .then((data) => setHallTicketMeta((prev) => ({ ...prev, ip: data?.ip || null })))
            .catch(() => { });
    };

    const viewHallTicket = () => {
        if (!guardHallTicketAccess()) return;
        stampHallTicketMeta();
        setSelectedHallTicket(myHallTicketAllocation);
    };

    const downloadHallTicket = () => {
        if (!guardHallTicketAccess()) return;
        stampHallTicketMeta();
        setSelectedHallTicket(myHallTicketAllocation);
        setTimeout(() => window.print(), 150);
    };

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        if (activeTab === 'marks') {
            csvContent += "Exam,Subject,Max Marks,Score\n";
            filteredMarksEntries.forEach(m => {
                csvContent += `"${m.examName}","${m.subject}",100,${m.score}\n`;
            });
        } else if (activeTab === 'fees-history') {
            csvContent += "Term,Total Fee,Paid Amount,Balance,Status\n";
            feeRecords.forEach(f => {
                csvContent += `"${f.term}",${f.totalFee},${f.paidAmount || 0},${f.balance},"${f.status}"\n`;
            });
        } else {
            csvContent += "Title,Type,DueDate\n";
            studentAssignments.forEach(a => {
                csvContent += `"${a.title}","${a.type}","${a.dueDate}"\n`;
            });
        }
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${studentData.name}_${activeTab}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="staff-style-dashboard">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .receipt-modal-overlay, .receipt-modal-overlay *,
                    .hall-ticket-preview, .hall-ticket-preview * {
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
                    .receipt-modal-overlay button, .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 5mm;
                    }
                }
            `}</style>

            {detailModalContent && (
                <div className="quick-preview-overlay">
                    <div className="quick-preview-modal">
                        <div className="quick-preview-header">
                            <h3><Sparkles size={16} /> Quick View Detail</h3>
                            <button
                                type="button"
                                className="quick-preview-close"
                                onClick={() => setDetailModalContent(null)}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="quick-preview-body">
                            <p><strong>Title:</strong> {detailModalContent.title || detailModalContent.message || detailModalContent.content}</p>
                            {detailModalContent.subject && <p><strong>Subject:</strong> {detailModalContent.subject}</p>}
                            {detailModalContent.dueDate && <p><strong>Due Date:</strong> {detailModalContent.dueDate}</p>}
                            {detailModalContent.description && <p className="quick-preview-desc">{detailModalContent.description}</p>}
                        </div>
                        <button type="button" className="quick-preview-close-btn" onClick={() => setDetailModalContent(null)}>
                            Close Preview
                        </button>
                    </div>
                </div>
            )}

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

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '10px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                            <div><strong>Receipt No:</strong> RCPT-{selectedPrintReceipt.id ? selectedPrintReceipt.id.substring(0, 8).toUpperCase() : '2026/001'}</div>
                            <div><strong>Date:</strong> {selectedPrintReceipt.date || new Date().toLocaleDateString()}</div>
                        </div>

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

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.74rem', color: '#64748b' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid #94a3b8', width: '130px', paddingTop: '3px', margin: '0 auto' }}>Student Signature</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid #94a3b8', width: '130px', paddingTop: '3px', margin: '0 auto' }}>Authorized Signatory</div>
                            </div>
                        </div>

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

            {showFeeAlertModal && pendingFeesList.length > 0 && (
                <div className="fee-alert-overlay">
                    <div className="fee-alert-modal">
                        <div className="fee-alert-modal-header">
                            <h3><DollarSign size={20} /> Fee Dues Alert!</h3>
                            <button
                                type="button"
                                className="fee-alert-close-btn"
                                onClick={() => setShowFeeAlertModal(false)}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="fee-alert-desc">
                            Dear <strong>{studentData.name}</strong>, you have pending fee balances assigned by the front office desk. Please clear them at the office counter.
                        </p>
                        <div className="fee-alert-list">
                            {pendingFeesList.map(fee => (
                                <div className="fee-alert-row" key={fee.id}>
                                    <span>{fee.term}</span>
                                    <strong>₹{fee.balance} Pending</strong>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="fee-alert-cta"
                            onClick={() => { setShowFeeAlertModal(false); setActiveTab('fees-history'); }}
                        >
                            <Receipt size={15} /> View Fee History & Receipts
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

            <button className="floating-action-fab" onClick={handleExportCSV} title="Export Current View Data">
                <Download size={16} /> <span>Quick Export</span>
            </button>

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
                        <div className="staff-nav-group">
                            <button
                                type="button"
                                className={`staff-nav-item ${examHallMenuOpen ? 'expanded' : ''} ${activeTab === 'exam-halls' ? 'active' : ''}`}
                                onClick={() => setExamHallMenuOpen(prev => !prev)}
                            >
                                <Calendar size={16} />
                                <span>Exam Hall Allocation</span>
                                <ChevronDown size={14} className={`staff-nav-chevron ${examHallMenuOpen ? 'open' : ''}`} />
                            </button>
                            {examHallMenuOpen && (
                                <div className="staff-submenu">
                                    <button
                                        type="button"
                                        className={`staff-submenu-item ${activeTab === 'exam-halls' ? 'active' : ''}`}
                                        onClick={() => { setActiveTab('exam-halls'); setIsMobileMenuOpen(false); }}
                                    >
                                        <CheckCircle size={13} /> My Hall Allocation
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            className={`staff-nav-item ${activeTab === 'hall-ticket' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('hall-ticket'); setIsMobileMenuOpen(false); }}
                        >
                            <Ticket size={16} /><span>Hall Ticket</span>
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
                            <button
                                className="topbar-icon-btn"
                                onClick={() => setDarkMode(!darkMode)}
                                title="Toggle Dark/Light Mode"
                            >
                                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                            </button>

                            <button
                                className="topbar-icon-btn"
                                onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                                title="Notifications"
                            >
                                <Bell size={15} />
                                {unseenAnnouncementsCount > 0 && (
                                    <span className="notif-badge-count">{unseenAnnouncementsCount}</span>
                                )}
                            </button>

                            {showNotifDrawer && (
                                <div className="notif-drawer-dropdown">
                                    <div className="notif-drawer-header">
                                        <h4>Circular Notices</h4>
                                        <X size={14} style={{ cursor: 'pointer' }} onClick={() => setShowNotifDrawer(false)} />
                                    </div>
                                    {announcementsList.slice(0, 3).map(item => (
                                        <div
                                            key={item.id}
                                            className="notif-drawer-item"
                                            onClick={() => { setDetailModalContent(item); setShowNotifDrawer(false); }}
                                        >
                                            <p>{item.content || item.message}</p>
                                            <span>{item.date || 'Recent'}</span>
                                        </div>
                                    ))}
                                    {announcementsList.length === 0 && (
                                        <p style={{ fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>No recent announcements.</p>
                                    )}
                                </div>
                            )}

                            <button
                                className="topbar-icon-btn"
                                onClick={handleExportCSV}
                                title="Export Page Data to CSV"
                            >
                                <Download size={15} />
                            </button>

                            <div className="sync-badge">
                                <span className="sync-dot" /> Live Portal Sync
                            </div>

                            <button className="ps-header-btn ghost" onClick={() => setActiveTab('marks')}>
                                <Award size={14} /> Exam Result
                                {hasNewMarks && <span className="header-btn-notify-dot" title="New results available" />}
                            </button>
                            <button className="ps-header-btn solid" onClick={() => setActiveTab('fees-history')}>
                                <Receipt size={14} /> Fees Details
                            </button>
                        </div>
                    </header>

                    <div className="staff-content-container">
                        {activeTab === 'overview' && (
                            <>
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

                                <div className="preskool-grid">
                                    <div className="preskool-col">
                                        <div className="ps-profile-card">
                                            <div className="ps-profile-top">
                                                <div className="ps-profile-avatar">
                                                    {liveStudentRecord?.photo ? (
                                                        <img src={liveStudentRecord.photo} alt={studentData.name} />
                                                    ) : (
                                                        <User size={28} />
                                                    )}
                                                </div>
                                                <div className="ps-profile-info">
                                                    <span className="ps-profile-id">#ST{(studentData.rollNo || '00000').toString().padStart(5, '0')}</span>
                                                    <h4>{studentData.name}</h4>
                                                    <p>Class: {studentData.grade || 'N/A'} {studentData.section ? `- ${studentData.section}` : ''} &nbsp; Roll No: {studentData.rollNo || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="ps-profile-bottom">
                                                <span className="ps-quarterly-pill">
                                                    <Award size={12} /> {averageScore !== 'N/A' ? `Avg ${averageScore}%` : '1st Quarterly'}
                                                </span>
                                                <button className="ps-edit-btn" onClick={() => setActiveTab('marks')}>
                                                    <ChevronRight size={13} /> View Profile
                                                </button>
                                            </div>
                                        </div>

                                        <div className="ps-panel">
                                            <div className="ps-panel-header">
                                                <h3>Today's Class</h3>
                                                <span className="ps-panel-date">
                                                    <Calendar size={12} /> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="ps-class-list">
                                                {studentSchedule.length === 0 ? (
                                                    <div className="empty-sub-card">
                                                        <BookOpen size={22} color="var(--dash-text-muted)" />
                                                        <p>No classes scheduled for today.</p>
                                                    </div>
                                                ) : (
                                                    studentSchedule.slice(0, 4).map((cls, idx) => (
                                                        <div className="ps-class-row" key={cls.id || idx}>
                                                            <div className="ps-class-icon">
                                                                <BookOpen size={16} />
                                                            </div>
                                                            <div className="ps-class-mid">
                                                                <h5>{cls.subject}</h5>
                                                                <span><Clock size={11} /> {cls.timeSlot}</span>
                                                            </div>
                                                            <span className={`ps-class-status ${idx === 0 ? 'done' : idx === 1 ? 'progress' : 'upcoming'}`}>
                                                                {idx === 0 ? 'Completed' : idx === 1 ? 'Ongoing' : 'Upcoming'}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="ps-panel">
                                            <div className="ps-panel-header">
                                                <h3>Active Coursework</h3>
                                                <Layers size={15} className="muted-icon" />
                                            </div>
                                            {studentAssignments.length === 0 ? (
                                                <div className="empty-sub-card">
                                                    <CheckCircle size={22} color="var(--accent-emerald)" />
                                                    <p>All caught up! No active tasks assigned.</p>
                                                </div>
                                            ) : (
                                                <div className="student-tasks-list">
                                                    {studentAssignments.slice(0, 3).map(task => {
                                                        const isSubmitted = submissionsList.some(sub => sub.taskId === task.id);
                                                        return (
                                                            <div
                                                                key={task.id}
                                                                className="student-task-item"
                                                                onClick={() => setDetailModalContent(task)}
                                                            >
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
                                    </div>

                                    <div className="preskool-col">
                                        <div className="ps-panel">
                                            <div className="ps-panel-header">
                                                <h3>Attendance</h3>
                                                <span className="ps-panel-tag"><Calendar size={11} /> This Month</span>
                                            </div>

                                            <div className="ps-attendance-summary">
                                                <div>
                                                    <span className="ps-att-num">{totalWorkingDays}</span>
                                                    <span className="ps-att-label">Total Working Days</span>
                                                </div>
                                            </div>

                                            <div className="ps-att-minicards">
                                                <div className="ps-att-mini">
                                                    <span className="dot present" />
                                                    <div>
                                                        <strong>{presentDaysCount}</strong>
                                                        <p>Present</p>
                                                    </div>
                                                </div>
                                                <div className="ps-att-mini">
                                                    <span className="dot absent" />
                                                    <div>
                                                        <strong>{absentDaysCount}</strong>
                                                        <p>Absent</p>
                                                    </div>
                                                </div>
                                                <div className="ps-att-mini">
                                                    <span className="dot halfday" />
                                                    <div>
                                                        <strong>0</strong>
                                                        <p>Half Day</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="ps-ring-wrap">
                                                <svg viewBox="0 0 140 140" className="ps-ring-svg">
                                                    <circle cx="70" cy="70" r="58" fill="none" stroke="var(--dash-border)" strokeWidth="14" />
                                                    <circle
                                                        cx="70" cy="70" r="58" fill="none"
                                                        stroke={isDefaulter ? 'var(--accent-rose)' : 'var(--accent-emerald)'}
                                                        strokeWidth="14"
                                                        strokeDasharray={`${2 * Math.PI * 58}`}
                                                        strokeDashoffset={`${2 * Math.PI * 58 * (1 - rawAttendanceRate / 100)}`}
                                                        strokeLinecap="round"
                                                        transform="rotate(-90 70 70)"
                                                    />
                                                </svg>
                                                <div className="ps-ring-center">
                                                    <span>{hasStaffSubmittedAttendance ? `${rawAttendanceRate}%` : '--'}</span>
                                                    <p>Attendance</p>
                                                </div>
                                            </div>

                                            <div className="ps-ring-legend">
                                                <span><i className="dot present" />Present</span>
                                                <span><i className="dot absent" />Absent</span>
                                                <span><i className="dot halfday" />Late</span>
                                                <span><i className="dot halfday" />Half Day</span>
                                            </div>

                                            <div className="ps-last7-header">Last 7 Days</div>
                                            <div className="ps-last7-strip">
                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
                                                    const state = i < 5 ? 'present' : i === 5 ? 'absent' : 'off';
                                                    return (
                                                        <div key={i} className={`ps-day-chip ${state}`}>
                                                            {d}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="preskool-col">
                                        <div className="ps-panel">
                                            <div className="ps-panel-header">
                                                <h3>Schedules</h3>
                                                <button className="ps-add-btn" onClick={() => setShowReminderModal(true)}>+ Add New</button>
                                            </div>

                                            <div className="ps-mini-cal-head">
                                                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </div>
                                            <div className="ps-mini-cal-grid">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                                    <span key={i} className="ps-cal-dow">{d}</span>
                                                ))}
                                                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                                                    <span key={`blank-${i}`} />
                                                ))}
                                                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                                                    const dayNum = i + 1;
                                                    const isToday = dayNum === new Date().getDate();
                                                    return (
                                                        <span key={dayNum} className={`ps-cal-day ${isToday ? 'today' : ''}`}>
                                                            {dayNum}
                                                        </span>
                                                    );
                                                })}
                                            </div>

                                            <div className="ps-exams-header">Exams</div>
                                            <div className="ps-exam-list">
                                                {marksEntries.length === 0 ? (
                                                    <div className="ps-exam-item">
                                                        <div className="ps-exam-icon"><Award size={14} /></div>
                                                        <div className="ps-exam-mid">
                                                            <h5>No Exams Scheduled</h5>
                                                            <span>Check back later</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    [...new Set(marksEntries.map(m => m.examName))].slice(0, 2).map((examName, idx) => (
                                                        <div className="ps-exam-item" key={idx}>
                                                            <div className="ps-exam-icon"><Award size={14} /></div>
                                                            <div className="ps-exam-mid">
                                                                <h5>{examName}</h5>
                                                                <span>{marksEntries.filter(m => m.examName === examName).length} Subjects</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="ps-panel">
                                            <div className="ps-panel-header">
                                                <h3>Notice Board</h3>
                                                <Bell size={15} className="muted-icon" />
                                            </div>
                                            <div className="student-notice-list">
                                                {announcementsList.slice(0, 3).map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="student-notice-item"
                                                        onClick={() => setDetailModalContent(item)}
                                                    >
                                                        <p>{item.content || item.message}</p>
                                                        <span className="notice-time">
                                                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : (item.date || 'Recent')}
                                                        </span>
                                                    </div>
                                                ))}
                                                {announcementsList.length === 0 && (
                                                    <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.78rem' }}>No announcements available.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="staff-stats-grid ps-stats-row">
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

                                {filteredMarksEntries.length > 0 && (
                                    <div className="marks-summary-strip">
                                        <div className="marks-summary-box">
                                            <span className="marks-summary-label">Total Score</span>
                                            <strong className="marks-summary-value">{marksTotalObtained} / {marksTotalMax}</strong>
                                        </div>
                                        <div className="marks-summary-box">
                                            <span className="marks-summary-label">Percentage</span>
                                            <strong className="marks-summary-value">{marksPercentage}%</strong>
                                        </div>
                                        <div className="marks-summary-box">
                                            <span className="marks-summary-label">Class Rank</span>
                                            <strong className="marks-summary-value">{studentRank ? `#${studentRank}` : 'N/A'}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'exam-halls' && (
                            <div className="staff-card full">
                                <div className="card-header">
                                    <div>
                                        <h3>My Exam Hall Allocations</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>
                                            Assigned seating & examination rooms
                                        </p>
                                    </div>
                                </div>

                                {myExamHallAllocations.length === 0 ? (
                                    <div className="empty-sub-card">
                                        <Calendar size={32} color="var(--staff-primary)" />
                                        <h4>No Exam Hall Allocations Found</h4>
                                        <p>Seating arrangements have not been assigned by administration for your class yet.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Exam Name</th>
                                                    <th>Hall / Room No</th>
                                                    <th>Seat No</th>
                                                    <th>Target Class</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {myExamHallAllocations.map((alloc) => (
                                                    <tr key={alloc.id}>
                                                        <td><strong>{alloc.examName || alloc.title || 'Examination'}</strong></td>
                                                        <td><span className="topic-badge">{alloc.hallNo || alloc.roomNo || 'Hall 1'}</span></td>
                                                        <td><strong>{getMySeatNo(alloc) || alloc.seatNo || 'Unassigned'}</strong></td>
                                                        <td>{alloc.targetClass || alloc.className || studentData.grade}</td>
                                                        <td><span className="status-badge status-present">ALLOCATED</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'hall-ticket' && (
                            <div className="hall-ticket-page">
                                <style>{`
                                    .hall-ticket-page .hall-ticket-locked-card{margin-top:18px;padding:24px;border-radius:0px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.35)}
                                    .hall-ticket-page .hall-ticket-lock-icon{width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:rgba(245,158,11,.15);color:#d97706;margin-bottom:12px}
                                    .hall-ticket-page .hall-ticket-locked-card h4{margin:0 0 6px;font-size:1rem;font-weight:800}
                                    .hall-ticket-page .hall-ticket-locked-card p{margin:0;color:var(--staff-text-muted);font-size:.8rem;line-height:1.6}
                                    .hall-ticket-page .hall-ticket-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
                                    .hall-ticket-page .hall-ticket-action-btn{min-height:42px;padding:10px 16px;border:0;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-size:.78rem;font-weight:800;cursor:pointer}
                                    .hall-ticket-page .hall-ticket-action-btn.view{background:var(--staff-primary-light,#ecfdf5);color:var(--staff-primary,#059669);border:1px solid rgba(5,150,105,.2)}
                                    .hall-ticket-page .hall-ticket-action-btn.download{background:linear-gradient(135deg,#059669,#10b981);color:#fff}
                                    .hall-ticket-page .hall-ticket-action-btn.blocked{background:#f1f5f9;color:#94a3b8;border:1px solid #e2e8f0;cursor:not-allowed}
                                    .hall-ticket-page .hall-ticket-status.paid{display:inline-flex;align-items:center;gap:7px;margin-bottom:18px;padding:8px 12px;border-radius:999px;background:#dcfce7;color:#047857;font-size:.75rem;font-weight:800}
                                    .hall-ticket-page .hall-ticket-preview{margin-top:20px;border:1px solid var(--staff-border,#dbe7e2);border-radius:0px;overflow:hidden;background:#fff}
                                    .hall-ticket-page .hall-ticket-preview-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e2e8f0}
                                    .hall-ticket-page .hall-ticket-preview-header h4{margin:0;font-size:.9rem}
                                    .hall-ticket-page .hall-ticket-preview-header span{font-size:.7rem;color:#64748b}
                                    .hall-ticket-page .hall-ticket-preview-header button{width:34px;height:34px;border:1px solid #e2e8f0;border-radius:9px;background:#fff;cursor:pointer}
                                    .hall-ticket-page .hall-ticket-preview-paper{margin:20px;padding:28px;border:2px solid #0f172a;background:#fff;color:#0f172a}
                                    .hall-ticket-page .hall-ticket-preview-paper h2{text-align:center;margin:0 0 22px;font-size:1.25rem}
                                    .hall-ticket-page .hall-ticket-preview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
                                    .hall-ticket-page .hall-ticket-preview-grid p{margin:0;padding:12px;border-bottom:1px solid #e2e8f0}
                                    .hall-ticket-page .hall-ticket-preview-grid span{display:block;color:#64748b;font-size:.7rem;margin-bottom:4px}
                                    .hall-ticket-page .hall-ticket-preview-grid strong{font-size:.85rem}
                                    .hall-ticket-page .hall-ticket-authorized{margin-top:28px;font-size:.75rem;font-weight:700}
                                    @media(max-width:600px){.hall-ticket-page .hall-ticket-preview-grid{grid-template-columns:1fr}.hall-ticket-page .hall-ticket-action-btn{width:100%}}
                                `}</style>
                                <div className="card-header">
                                    <div>
                                        <h3>Exam Hall Ticket</h3>
                                        <p>View and download Hall Tickets published by the Office.</p>
                                    </div>
                                    <Ticket size={28} />
                                </div>

                                {!myHallTicketAllocation ? (
                                    <div className="empty-sub-card">
                                        <Ticket size={32} />
                                        <h4>Hall Ticket Not Available</h4>
                                        <p>Your exam hall allocation has not been published yet. Please contact the office.</p>
                                    </div>
                                ) : !hasFeeClearance ? (
                                    <div className="hall-ticket-locked-card">
                                        <div className="hall-ticket-lock-icon"><AlertTriangle size={30} /></div>
                                        <h4>Hall Ticket Blocked</h4>
                                        <p>Your fees are not fully paid. Please pay the pending fees or meet the office room.</p>
                                        <div className="hall-ticket-actions">
                                            <button type="button" className="hall-ticket-action-btn blocked" onClick={() => alert('Hall Ticket is blocked because your fees are not fully paid. Please pay the pending fees or meet the office room.')}>
                                                <Eye size={16} /> View Hall Ticket
                                            </button>
                                            <button type="button" className="hall-ticket-action-btn blocked" onClick={() => alert('Hall Ticket download is blocked because your fees are not fully paid. Please pay the pending fees or meet the office room.')}>
                                                <Download size={16} /> Download Hall Ticket
                                            </button>
                                        </div>
                                    </div>
                                ) : !isHallTicketPublished ? (
                                    <div className="hall-ticket-locked-card">
                                        <div className="hall-ticket-lock-icon"><AlertTriangle size={30} /></div>
                                        <h4>Hall Ticket Not Published Yet</h4>
                                        <p>Your fees are cleared, but the Office has not published your Hall Ticket yet. Please contact the office.</p>
                                        <div className="hall-ticket-actions">
                                            <button type="button" className="hall-ticket-action-btn blocked" onClick={() => alert('Hall Ticket has not been published by the office yet. Please contact the office.')}>
                                                <Eye size={16} /> View Hall Ticket
                                            </button>
                                            <button type="button" className="hall-ticket-action-btn blocked" onClick={() => alert('Hall Ticket has not been published by the office yet. Please contact the office.')}>
                                                <Download size={16} /> Download Hall Ticket
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="hall-ticket-card">
                                        <div className="hall-ticket-status paid">
                                            <CheckCircle size={16} /> Fees Cleared — Hall Ticket Published
                                        </div>

                                        <div className="hall-ticket-grid">
                                            <div><span>Student</span><strong>{studentData.name}</strong></div>
                                            <div><span>Admission No</span><strong>{studentData.rollNo || studentData.id || '—'}</strong></div>
                                            <div><span>Class / Section</span><strong>{studentData.grade} {studentData.section ? `/ ${studentData.section}` : ''}</strong></div>
                                            <div><span>Exam</span><strong>{myHallTicketPublication.exam || myHallTicketAllocation.examName || 'Examination'}</strong></div>
                                            <div><span>Year</span><strong>{myHallTicketPublication.year || '—'}</strong></div>
                                            <div><span>Hall No</span><strong>{myHallTicketAllocation.hallNo || myHallTicketPublication.hallNo || '—'}</strong></div>
                                            <div><span>Seat No</span><strong>{getMySeatNo(myHallTicketAllocation) || myHallTicketPublication.seatNo || '—'}</strong></div>
                                        </div>

                                        <div className="hall-ticket-actions">
                                            <button type="button" className="hall-ticket-action-btn view" onClick={viewHallTicket}>
                                                <Eye size={16} /> View Hall Ticket
                                            </button>
                                            <button type="button" className="hall-ticket-action-btn download" onClick={downloadHallTicket}>
                                                <Download size={16} /> Download Hall Ticket
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedHallTicket && isHallTicketPublished && hasFeeClearance && activeTab === 'hall-ticket' && (() => {
                                    const studentPhoto = liveStudentRecord?.photo || '';
                                    const rollNoValue = studentData.rollNo || studentData.id || '—';
                                    const examNameValue = myHallTicketPublication.exam || selectedHallTicket.examName || 'Examination';
                                    const examYearValue = myHallTicketPublication.year || '';
                                    const classValue = studentData.grade || 'Senior Secondary';
                                    const examCenterCode = myHallTicketPublication.examCenterCode || selectedHallTicket.hallNo || myHallTicketPublication.hallNo || '—';
                                    const matchedExamTimetable = examTimetableList.filter(t =>
                                        cleanString(t.className) === cleanString(classValue) &&
                                        cleanString(t.examName) === cleanString(examNameValue)
                                    );
                                    const subjectRows = matchedExamTimetable.length
                                        ? matchedExamTimetable.map(t => ({ code: t.subjectCode, name: t.subject, date: t.examDate }))
                                        : (Array.isArray(myHallTicketPublication.subjects) && myHallTicketPublication.subjects.length
                                            ? myHallTicketPublication.subjects
                                            : (Array.isArray(selectedHallTicket.subjects) ? selectedHallTicket.subjects : []));
                                    const qrData = encodeURIComponent(`Roll No: ${rollNoValue} | Name: ${studentData.name} | Exam: ${examNameValue}`);
                                    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=0&data=${qrData}`;

                                    return (
                                        <div className="hall-ticket-preview">
                                            <div className="hall-ticket-preview-header no-print">
                                                <div>
                                                    <h4>Hall Ticket Preview</h4>
                                                    <span>Official examination details</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button type="button" onClick={() => window.print()} title="Print / Download" style={{ width: 34, height: 34, border: '1px solid #e2e8f0', borderRadius: 9, background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                        <Printer size={16} />
                                                    </button>
                                                    <button type="button" onClick={() => setSelectedHallTicket(null)} aria-label="Close hall ticket preview">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div
                                                className="hall-ticket-print-paper"
                                                style={{
                                                    margin: '20px', border: '2px solid #0f172a', background: '#fff', color: '#0f172a',
                                                    fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '13px', lineHeight: 1.4
                                                }}
                                            >
                                                <div className="hall-ticket-header-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '2px solid #0f172a' }}>
                                                    <img src={logo} alt="School Logo" style={{ width: 58, height: 58, objectFit: 'contain', flexShrink: 0 }} />
                                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                                        <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1a3b8a', letterSpacing: '.2px' }}>
                                                            {HALL_TICKET_SCHOOL_NAME}
                                                        </h1>
                                                        <p style={{ margin: '3px 0 0', fontSize: '.72rem', fontStyle: 'italic', color: '#334155' }}>
                                                            {HALL_TICKET_SCHOOL_TAGLINE}
                                                        </p>
                                                    </div>
                                                    <div style={{ width: 58, flexShrink: 0 }} />
                                                </div>

                                                <div style={{ display: 'flex', background: 'linear-gradient(135deg,#1e3a5f,#0f2942)', color: '#fff' }}>
                                                    <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,.25)', fontWeight: 800, fontSize: '.82rem' }}>
                                                        Hall Ticket - Theory
                                                    </div>
                                                    <div style={{ flex: 1.6, padding: '10px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,.25)', fontWeight: 800, fontSize: '.82rem' }}>
                                                        {examNameValue}{examYearValue ? ` ${examYearValue}` : ''} Examination
                                                    </div>
                                                    <div style={{ flex: 1, padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontSize: '.82rem' }}>
                                                        {classValue}
                                                    </div>
                                                </div>

                                                <div className="hall-ticket-details-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px', flexWrap: 'wrap' }}>
                                                    <div style={{ flex: 1 }}>
                                                        {[
                                                            ['Roll No', rollNoValue],
                                                            ['Name', studentData.name],
                                                        ].map(([label, value]) => (
                                                            <div key={label} style={{ display: 'flex', marginBottom: 8, fontSize: '.85rem' }}>
                                                                <span style={{ width: 130, fontWeight: 700, flexShrink: 0 }}>{label}</span>
                                                                <span style={{ width: 14, flexShrink: 0 }}>:</span>
                                                                <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                                                        <img src={qrSrc} alt="QR Code" style={{ width: 100, height: 100, border: '1px solid #cbd5e1' }} />
                                                        <div style={{ width: 90, height: 108, border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc' }}>
                                                            {studentPhoto ? (
                                                                <img src={studentPhoto} alt={studentData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <User size={34} color="#94a3b8" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderTop: 0, fontSize: '.78rem' }}>
                                                    <div style={{ width: 150, flexShrink: 0, padding: '10px 14px', borderRight: '1px solid #cbd5e1', fontWeight: 700, background: '#f8fafc' }}>
                                                        Hall Number<br />
                                                    </div>
                                                    <div style={{ flex: 1, padding: '10px 14px' }}>
                                                        <div style={{ fontWeight: 800, marginBottom: 3 }}>{examCenterCode}</div>
                                                    </div>
                                                </div>

                                                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '18px 0 0', fontSize: '.78rem' }}>
                                                    <thead>
                                                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                                            <th style={{ padding: '8px 14px', border: '1px solid #cbd5e1' }}>Subject Code</th>
                                                            <th style={{ padding: '8px 14px', border: '1px solid #cbd5e1' }}>Subject Name</th>
                                                            <th style={{ padding: '8px 14px', border: '1px solid #cbd5e1' }}>Date of Exam</th>
                                                            <th style={{ padding: '8px 14px', border: '1px solid #cbd5e1' }}>Invigilator Signature</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {subjectRows.length > 0 ? subjectRows.map((sub, idx) => (
                                                            <tr key={idx}>
                                                                <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1' }}>{sub.code || sub.subjectCode || '—'}</td>
                                                                <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1' }}>{sub.name || sub.subjectName || '—'}</td>
                                                                <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1' }}>{sub.date || sub.examDate || '—'}</td>
                                                                <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1' }}>&nbsp;</td>
                                                            </tr>
                                                        )) : (
                                                            <tr>
                                                                <td colSpan={4} style={{ padding: '10px 14px', border: '1px solid #cbd5e1', color: '#64748b', textAlign: 'center' }}>
                                                                    Subject-wise schedule will be updated by the office shortly.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>

                                                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '18px 18px 0' }}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ width: 180, borderTop: '1px solid #0f172a', paddingTop: 4, fontSize: '.74rem', fontWeight: 700 }}>
                                                            Student Signature
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ padding: '18px' }}>
                                                    <h4 style={{ margin: '0 0 8px', fontSize: '.88rem', fontWeight: 800 }}>Important Instructions</h4>
                                                    <ol style={{ margin: 0, paddingLeft: 18, fontSize: '.74rem', color: '#334155', lineHeight: 1.7 }}>
                                                        <li>For getting entry into the examination hall, candidate must bring the original Identity Card issued by the school along with the examination hall ticket and a valid photo identity proof.</li>
                                                        <li>Carrying Mobile Phones, Cameras, bags, calculators and any other electronic gadgets etc. are not allowed in the Examination Center.</li>
                                                        <li>Theory Examination timings and reporting time will be as communicated by the office. The candidates must report minimum one hour before the commencement of the exam.</li>
                                                        <li>Candidate will not be allowed to appear in the exam if he/she reports after commencement of the exam.</li>
                                                    </ol>

                                                    <h4 style={{ margin: '16px 0 4px', fontSize: '.82rem', fontWeight: 800 }}>Disclaimer</h4>
                                                    <p style={{ margin: 0, fontSize: '.68rem', color: '#64748b' }}>
                                                        {HALL_TICKET_SCHOOL_NAME} is not responsible for any inadvertent error that may have crept in the Hall Ticket.
                                                    </p>

                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <img src={principalSignature} alt="Principal Signature" style={{ width: 140, height: 50, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                                                            <div style={{ width: 180, borderTop: '1px solid #0f172a', paddingTop: 4, fontSize: '.74rem', fontWeight: 700 }}>
                                                                <p>Fr. A. AROKIA SAHAYARAJ </p>
                                                                <span>Principal Signature</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'notices' && (
                            <div className="staff-card full">
                                <div className="card-header">
                                    <div>
                                        <h3>School Circulars & Announcements</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--staff-text-muted)' }}>
                                            Official circulars posted by school authorities
                                        </p>
                                    </div>
                                </div>

                                {announcementsList.length === 0 ? (
                                    <div className="empty-sub-card">
                                        <Bell size={32} color="var(--staff-primary)" />
                                        <h4>No Circular Notices</h4>
                                        <p>There are no active bulletins broadcast to students at this moment.</p>
                                    </div>
                                ) : (
                                    <div className="student-assignments-grid">
                                        {announcementsList.map(notice => (
                                            <div key={notice.id} className="assignment-display-card" onClick={() => setDetailModalContent(notice)}>
                                                <div className="assignment-badge-row">
                                                    <span className="task-badge badge-homework">Bulletin</span>
                                                    <span className="due-date-pill">{notice.date || 'Recent'}</span>
                                                </div>
                                                <h4>{notice.title || notice.subject || 'Announcement'}</h4>
                                                <p className="assignment-body-desc">{notice.content || notice.message}</p>
                                            </div>
                                        ))}
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
                                                            {sub.submittedAt?.toDate ? sub.submittedAt.toDate().toLocaleString() : 'Submitted'}
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge ${sub.obtainedMarks !== undefined ? 'status-present' : 'status-pending'}`}>
                                                                {sub.obtainedMarks !== undefined ? 'GRADED' : 'PENDING EVALUATION'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <strong>{sub.obtainedMarks !== undefined ? `${sub.obtainedMarks} / 100` : '--'}</strong>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SCHEDULE NEW REMINDER POPUP MODAL */}
            {showReminderModal && (
                <div className="quick-preview-overlay">
                    <div className="quick-preview-modal" style={{ maxWidth: '420px' }}>
                        <div className="quick-preview-header">
                            <h3><Calendar size={16} /> Schedule Personal Reminder</h3>
                            <button type="button" className="quick-preview-close" onClick={() => setShowReminderModal(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="quick-preview-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Reminder Title</label>
                                <input
                                    type="text"
                                    className="custom-select"
                                    placeholder="e.g. Science Project Due"
                                    value={reminderTitle}
                                    onChange={(e) => setReminderTitle(e.target.value)}
                                    style={{ width: '100%', marginTop: '4px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Date</label>
                                    <input
                                        type="date"
                                        className="custom-select"
                                        value={reminderDate}
                                        onChange={(e) => setReminderDate(e.target.value)}
                                        style={{ width: '100%', marginTop: '4px' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Time</label>
                                    <input
                                        type="time"
                                        className="custom-select"
                                        value={reminderTime}
                                        onChange={(e) => setReminderTime(e.target.value)}
                                        style={{ width: '100%', marginTop: '4px' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Optional Note</label>
                                <textarea
                                    className="custom-select"
                                    rows="3"
                                    placeholder="Add any specific instructions..."
                                    value={reminderNote}
                                    onChange={(e) => setReminderNote(e.target.value)}
                                    style={{ width: '100%', marginTop: '4px', resize: 'none' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button type="button" className="submit-pdf-btn" style={{ flex: 1 }} onClick={saveReminder}>
                                <Check size={14} /> Save Reminder
                            </button>
                            <button type="button" className="quick-preview-close-btn" style={{ marginTop: 0 }} onClick={() => setShowReminderModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ALARM POPUP NOTIFICATION FOR DUE REMINDER */}
            {showReminderPopup && currentReminder && (
                <div className="fee-alert-overlay">
                    <div className="fee-alert-modal" style={{ maxWidth: '380px', textAlign: 'center' }}>
                        <div className="fee-alert-modal-header" style={{ justifyContent: 'center' }}>
                            <h3><Bell size={20} className="spin-icon" /> Scheduled Alert!</h3>
                        </div>
                        <h4 style={{ margin: '10px 0 5px', color: 'var(--staff-primary)' }}>{currentReminder.title}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--staff-text-muted)', margin: '0 0 10px' }}>
                            Time: {currentReminder.time} ({currentReminder.date})
                        </p>
                        {currentReminder.note && (
                            <p className="quick-preview-desc" style={{ textAlign: 'left', marginBottom: '15px' }}>
                                {currentReminder.note}
                            </p>
                        )}
                        <button
                            type="button"
                            className="fee-alert-cta"
                            onClick={() => {
                                deleteReminder(currentReminder.id);
                                setShowReminderPopup(false);
                                setCurrentReminder(null);
                            }}
                        >
                            Acknowledge & Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}