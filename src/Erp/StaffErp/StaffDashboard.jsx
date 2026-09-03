import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { Html5Qrcode } from 'html5-qrcode';
import logo from "../../assets/logo.png"
import {
    collection, onSnapshot, doc, updateDoc, writeBatch, addDoc, deleteDoc, serverTimestamp, deleteField, query, where,
    setDoc, orderBy, limit, arrayUnion, arrayRemove, increment
} from 'firebase/firestore';
import {
    Users, User, Calendar, BookOpen, FileText, Bell, CheckCircle, Clock,
    LogOut, Search, Menu, X, Check, GraduationCap, ArrowLeft,
    Folder, KeyRound, Sparkles, ChevronDown, ChevronRight, ChevronLeft, PlusCircle, Trash2, Layers,
    FileCheck, ExternalLink, Award, Send, Save, AlertCircle, UserX,
    AlertTriangle, PhoneCall, BarChart2, Edit3, RotateCcw, SendHorizonal,
    LayoutGrid, ClipboardList, MessageCircle, Building2, Newspaper, Download,
    Library, PartyPopper, Moon, CalendarClock, MoreVertical,
    BookMarked, Upload, Loader2,
    PersonStanding
} from 'lucide-react';
import './StaffDashboard.css';

export default function StaffDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [academicMenuOpen, setAcademicMenuOpen] = useState(true);
    const [examHallMenuOpen, setExamHallMenuOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAiHint, setShowAiHint] = useState(false);
    const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toDateString());
    const [dayEvents, setDayEvents] = useState({});
    const [showAddEventForm, setShowAddEventForm] = useState(false);
    const [newEventForm, setNewEventForm] = useState({ title: '', time: '' });

    const [staffData, setStaffData] = useState({ staffId: '', name: 'Dr. R. Sharma', department: 'Senior Math Faculty' });

    const [staffLeaveList, setStaffLeaveList] = useState([]);
    const [leaveForm, setLeaveForm] = useState({
        leaveType: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [isLeaveSubmitting, setIsLeaveSubmitting] = useState(false);
    const [leaveActionStatus, setLeaveActionStatus] = useState('');

    const [allStaffMembers, setAllStaffMembers] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    const [myChats, setMyChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeChatInfo, setActiveChatInfo] = useState(null);
    const [activeChatMessages, setActiveChatMessages] = useState([]);
    const [chatMessageInput, setChatMessageInput] = useState('');
    const [showNewChatPicker, setShowNewChatPicker] = useState(false);
    const [chatDirectorySearch, setChatDirectorySearch] = useState('');

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestTargetStaff, setRequestTargetStaff] = useState(null);
    const [requestForm, setRequestForm] = useState({ subject: '', message: '' });
    const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);

    const [staffRoomMessages, setStaffRoomMessages] = useState([]);
    const [staffRoomInput, setStaffRoomInput] = useState('');

    const clearOldMarks = async (studentDocId) => {
        const studentRef = doc(db, 'students_records', studentDocId);

        await updateDoc(studentRef, {
            'marks.Mid-Term Assessment': deleteField(),
            'marksDraft.Mid-Term Assessment': deleteField(),
            'publishedMarks.Mid-Term Assessment': deleteField()
        });
    };

    const clearAllMarksMaps = async (studentDocId) => {
        const studentRef = doc(db, 'students_records', studentDocId);

        await updateDoc(studentRef, {
            marks: deleteField(),
            marksDraft: deleteField(),
            publishedMarks: deleteField()
        });
    };
    const [selectedClass, setSelectedClass] = useState('10th Std');
    const [selectedSection, setSelectedSection] = useState(null);

    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendancePeriod, setAttendancePeriod] = useState('');
    const [attendanceSlotId, setAttendanceSlotId] = useState('');

    const [subClassFilter, setSubClassFilter] = useState(null);
    const [subSectionFilter, setSubSectionFilter] = useState(null);
    const [submissionFilterStatus, setSubmissionFilterStatus] = useState('all');

    const [allStudents, setAllStudents] = useState([]);
    const [sectionsList, setSectionsList] = useState([]);
    const [staffTimetableList, setStaffTimetableList] = useState([]);
    const [assignmentsList, setAssignmentsList] = useState([]);
    const [submissionsList, setSubmissionsList] = useState([]);
    const [staffExamHallAllocations, setStaffExamHallAllocations] = useState([]);

    const [showHallTicketScanner, setShowHallTicketScanner] = useState(false);
    const [activeExamDuty, setActiveExamDuty] = useState(null);
    const [scannerStatus, setScannerStatus] = useState('');
    const [scannerResult, setScannerResult] = useState(null);
    const hallTicketScannerRef = useRef(null);
    const scanProcessingRef = useRef(false);
    const scanPopupTimerRef = useRef(null);

    const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
    const [studentMarks, setStudentMarks] = useState({});
    const [examType, setExamType] = useState('1st Mid-Term exam');
    const [selectedSubject, setSelectedSubject] = useState('Mathematics');
    const [marksActionStatus, setMarksActionStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialAssignmentForm = {
        title: '',
        type: 'Assignment',
        className: '10th Std',
        sectionName: '',
        subject: '',
        dueDate: '',
        description: ''
    };
    const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);
    const [editingAssignment, setEditingAssignment] = useState(null);

    const [submissionGrades, setSubmissionGrades] = useState({});
    const [gradingLoadingId, setGradingLoadingId] = useState(null);

    const [syllabusList, setSyllabusList] = useState([]);
    const initialSyllabusForm = {
        className: '10th Std',
        sectionName: '',
        subject: '',
        title: '',
        description: ''
    };
    const [syllabusForm, setSyllabusForm] = useState(initialSyllabusForm);
    const [pendingSyllabusFile, setPendingSyllabusFile] = useState(null);
    const [isSyllabusCompressing, setIsSyllabusCompressing] = useState(false);
    const [syllabusUploadStatus, setSyllabusUploadStatus] = useState('');

    const [libraryBooks, setLibraryBooks] = useState([]);
    const [libraryIssues, setLibraryIssues] = useState([]);
    const [librarySubTab, setLibrarySubTab] = useState('catalog');
    const [librarySearch, setLibrarySearch] = useState('');
    const initialBookForm = { title: '', author: '', category: '', isbn: '', totalCopies: 1 };
    const [bookForm, setBookForm] = useState(initialBookForm);
    const initialIssueForm = { bookId: '', className: '', sectionName: '', studentId: '', dueDate: '' };
    const [issueForm, setIssueForm] = useState(initialIssueForm);
    const [libraryStatus, setLibraryStatus] = useState('');

    const classList = [
        'LKG', 'UKG',
        '1st Std', '2nd Std', '3rd Std', '4th Std', '5th Std',
        '6th Std', '7th Std', '8th Std', '9th Std', '10th Std',
        '11th Std', '12th Std'
    ];

    const periodList = [
        'Period 1 (09:00 - 09:45 AM)',
        'Period 2 (09:45 - 10:20 AM)',
        'Period 3 (10:20 - 11:00 AM)',
        'Period 4 (11:15 - 11:50 AM)',
        'Period 5 (11:50 AM - 12:30 PM)',
        'Period 6 (01:00 - 01:45 PM)',
        'Period 7 (01:45 - 02:20 PM)',
        'Period 8 (02:50 - 03:30 PM)',
        'Period 9 (03:30 - 04:10 PM)'
    ];

    const timeSlotOrder = [
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

    const subjectList = [
        'Mathematics',
        'Science',
        'Physics',
        'Chemistry',
        'Biology',
        'English',
        'Tamil',
        'Social Science',
        'Computer Science',
        'General Knowledge'
    ];

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('staffUser');
        let resolvedStaffId = '';
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                resolvedStaffId = user.staffId || '';
                setStaffData({
                    staffId: user.staffId || '',
                    name: user.name || 'Dr. R. Sharma',
                    department: user.department || 'Faculty'
                });
            } catch (err) {
                console.error("Failed to parse user data", err);
            }
        }

        try {
            const storedEvents = localStorage.getItem(`staffScheduleEvents_${resolvedStaffId || 'default'}`);
            if (storedEvents) {
                setDayEvents(JSON.parse(storedEvents));
            }
        } catch (err) {
            console.error("Failed to parse saved schedule events", err);
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
        });

        const unsubSections = onSnapshot(collection(db, 'class_sections'), (snap) => {
            setSectionsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubStaffTT = onSnapshot(collection(db, 'staff_timetables'), (snap) => {
            setStaffTimetableList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubAssignments = onSnapshot(collection(db, 'class_assignments'), (snap) => {
            setAssignmentsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubSubmissions = onSnapshot(collection(db, 'assignment_submissions'), (snap) => {
            setSubmissionsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubSyllabus = onSnapshot(collection(db, 'class_syllabus'), (snap) => {
            setSyllabusList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubLibraryBooks = onSnapshot(collection(db, 'library_books'), (snap) => {
            setLibraryBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubLibraryIssues = onSnapshot(collection(db, 'library_issues'), (snap) => {
            setLibraryIssues(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubStaffExamHalls = onSnapshot(collection(db, 'staff_exam_halls'), (snap) => {
            setStaffExamHallAllocations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubLeaves = onSnapshot(collection(db, 'staff_leaves'), (snap) => {
            const leaves = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setStaffLeaveList(leaves);
        });

        const unsubStaffMembers = onSnapshot(collection(db, 'staff_members'), (snap) => {
            setAllStaffMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubStaffRoom = onSnapshot(
            query(collection(db, 'staffroom_messages'), orderBy('createdAt', 'asc'), limit(200)),
            (snap) => {
                setStaffRoomMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        );

        return () => {
            unsubStudents();
            unsubSections();
            unsubStaffTT();
            unsubAssignments();
            unsubSubmissions();
            unsubSyllabus();
            unsubLibraryBooks();
            unsubLibraryIssues();
            unsubStaffExamHalls();
            unsubLeaves();
            unsubStaffMembers();
            unsubStaffRoom();
        };
    }, []);

    useEffect(() => {
        if (!staffData.staffId) return;

        const chatsQuery = query(
            collection(db, 'staff_chats'),
            where('participants', 'array-contains', staffData.staffId)
        );

        const unsubChats = onSnapshot(chatsQuery, (snap) => {
            const chats = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(chat => !(chat.deletedFor || []).includes(staffData.staffId));
            chats.sort((a, b) => {
                const aTime = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
                const bTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
                return bTime - aTime;
            });
            setMyChats(chats);
        });

        return () => unsubChats();
    }, [staffData.staffId]);

    useEffect(() => {
        if (!activeChatId) {
            setActiveChatMessages([]);
            return;
        }

        const messagesQuery = query(
            collection(db, 'staff_chats', activeChatId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubMessages = onSnapshot(messagesQuery, (snap) => {
            setActiveChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => unsubMessages();
    }, [activeChatId]);

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

    const formatSectionTitle = (secName) => {
        if (!secName) return '';
        const trimmed = secName.trim();
        return trimmed.toLowerCase().startsWith('section') ? trimmed : `Section ${trimmed}`;
    };

    const extractTimeRange = (periodLabel) => {
        if (!periodLabel) return '';
        const match = periodLabel.match(/\(([^)]+)\)/);
        return match ? match[1].trim() : periodLabel.trim();
    };

    const mySchedule = staffTimetableList.filter(item =>
        (staffData.staffId && item.staffId === staffData.staffId) ||
        (item.staffName && item.staffName.toLowerCase() === staffData.name.toLowerCase())
    );

    const myTaughtAssignments = mySchedule
        .map(item => ({
            className: item.className || item.class || '',
            sectionName: item.sectionName || item.section || '',
            subject: item.subject || ''
        }))
        .filter(item => item.className && item.subject);

    const myTaughtClasses = [...new Set(myTaughtAssignments.map(a => a.className))];

    const getMyTaughtSectionsForClass = (cls) => {
        const names = myTaughtAssignments
            .filter(a => cleanString(a.className) === cleanString(cls))
            .map(a => a.sectionName)
            .filter(Boolean);
        return [...new Set(names)];
    };

    const getMyTaughtSubjectsForClass = (cls, sectionName) => {
        const subs = myTaughtAssignments
            .filter(a =>
                cleanString(a.className) === cleanString(cls) &&
                (!sectionName || !a.sectionName || cleanString(a.sectionName) === cleanString(sectionName))
            )
            .map(a => a.subject)
            .filter(Boolean);
        return [...new Set(subs)];
    };

    const isAssignedToTeach = (cls, sectionName, subject) =>
        myTaughtAssignments.some(a =>
            cleanString(a.className) === cleanString(cls) &&
            cleanString(a.subject) === cleanString(subject) &&
            (!a.sectionName || !sectionName || cleanString(a.sectionName) === cleanString(sectionName))
        );

    const attendanceWeekday = attendanceDate
        ? new Date(`${attendanceDate}T00:00:00`)
            .toLocaleDateString('en-US', {
                weekday: 'long'
            })
        : '';

    const normalizeTimetableSlot = (slot) => ({
        ...slot,

        timetableClass:
            slot.className ||
            slot.class ||
            '',

        timetableSection:
            slot.sectionName ||
            slot.section ||
            '',

        timetableTime:
            slot.timeSlot ||
            slot.period ||
            slot.time ||
            '',

        timetableDay:
            slot.day ||
            slot.weekday ||
            ''
    });
    const scheduledPeriodsForAttendance = mySchedule
        .map(normalizeTimetableSlot)

        .filter((slot) => {

            const sameDay =
                cleanString(slot.timetableDay) ===
                cleanString(attendanceWeekday);

            const hasClass =
                Boolean(slot.timetableClass);

            const hasSection =
                Boolean(slot.timetableSection);

            return sameDay && hasClass && hasSection;
        })

        .sort((a, b) => {

            const ai =
                timeSlotOrder.indexOf(
                    a.timetableTime
                );

            const bi =
                timeSlotOrder.indexOf(
                    b.timetableTime
                );

            return (
                (ai === -1 ? 999 : ai) -
                (bi === -1 ? 999 : bi)
            );
        });

    const scheduledPeriodKey =
        scheduledPeriodsForAttendance
            .map((slot) =>
                `${slot.id}-${slot.timetableTime}`
            )
            .join(',');

    const hasAttendanceSchedule =
        scheduledPeriodsForAttendance.length > 0;

    const selectedAttendanceSlot =
        scheduledPeriodsForAttendance.find(
            (slot) =>
                String(slot.id) ===
                String(attendanceSlotId)
        ) || null;

    useEffect(() => {

        if (
            scheduledPeriodsForAttendance.length === 0
        ) {

            setAttendanceSlotId('');
            setAttendancePeriod('');
            setAttendanceSubmitted(false);

            return;
        }

        const slotStillExists =
            scheduledPeriodsForAttendance.some(
                (slot) =>
                    String(slot.id) ===
                    String(attendanceSlotId)
            );

        if (!slotStillExists) {

            const firstSlot =
                scheduledPeriodsForAttendance[0];

            setAttendanceSlotId(
                String(firstSlot.id)
            );

            setAttendancePeriod(
                firstSlot.timetableTime
            );

            setAttendanceSubmitted(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, [
        attendanceWeekday,
        scheduledPeriodKey
    ]);

    useEffect(() => {

        if (!selectedAttendanceSlot) return;

        setAttendancePeriod(
            selectedAttendanceSlot.timetableTime
        );

        setAttendanceSubmitted(false);

    }, [
        attendanceSlotId,
        scheduledPeriodKey
    ]);
    const myExamHallDuties = staffExamHallAllocations.filter(item => {
        const assigned = cleanString(item.staffName);
        const current = cleanString(staffData.name);
        const idMatch = item.staffId && staffData.staffId ? item.staffId === staffData.staffId : false;
        return idMatch || !assigned || !current || assigned === current || assigned.includes(current) || current.includes(assigned);
    });

    const liveActiveExamDuty = activeExamDuty
        ? (myExamHallDuties.find(d => d.id === activeExamDuty.id) || activeExamDuty)
        : null;
    const scanTotalAllocated = liveActiveExamDuty
        ? (Array.isArray(liveActiveExamDuty.studentList) && liveActiveExamDuty.studentList.length > 0
            ? liveActiveExamDuty.studentList.length
            : (liveActiveExamDuty.studentIds?.length || liveActiveExamDuty.studentCount || 0))
        : 0;
    const scanVerifiedCount = liveActiveExamDuty && Array.isArray(liveActiveExamDuty.studentList)
        ? liveActiveExamDuty.studentList.filter(s => s.verificationStatus === 'Verified').length
        : 0;
    const allStudentsScanned = scanTotalAllocated > 0 && scanVerifiedCount >= scanTotalAllocated;

    const parseHallTicketQr = (rawValue) => {
        const raw = String(rawValue || '').trim();
        if (!raw) return null;
        const rollMatch = raw.match(/Roll\s*No\s*:\s*([^|]+)/i);
        const nameMatch = raw.match(/Name\s*:\s*([^|]+)/i);
        const examMatch = raw.match(/Exam\s*:\s*([^|]+)/i);
        if (rollMatch || nameMatch || examMatch) return { rollNo: rollMatch?.[1]?.trim() || '', name: nameMatch?.[1]?.trim() || '', exam: examMatch?.[1]?.trim() || '', raw };
        try { const parsed = JSON.parse(decodeURIComponent(raw)); return { rollNo: parsed.rollNo || parsed.admissionNo || '', name: parsed.name || '', exam: parsed.exam || parsed.examName || '', raw }; } catch { return { rollNo: raw, name: '', exam: '', raw }; }
    };

    const openHallTicketScanner = (duty) => {
        setActiveExamDuty(duty);
        setScannerResult(null);
        setScannerStatus('Starting camera...');
        scanProcessingRef.current = false;
        if (scanPopupTimerRef.current) { clearTimeout(scanPopupTimerRef.current); scanPopupTimerRef.current = null; }
        setShowHallTicketScanner(true);
    };
    const closeHallTicketScanner = () => {
        if (scanPopupTimerRef.current) { clearTimeout(scanPopupTimerRef.current); scanPopupTimerRef.current = null; }
        scanProcessingRef.current = false;
        setShowHallTicketScanner(false);
        setScannerStatus('');
        setScannerResult(null);
    };

    const verifyHallTicketFromQr = async (decodedText) => {
        const qr = parseHallTicketQr(decodedText);
        if (!qr || !activeExamDuty) return;
        const duty = activeExamDuty;
        const allocatedList = Array.isArray(duty.studentList) ? duty.studentList : [];
        const allocatedIds = Array.isArray(duty.studentIds) ? duty.studentIds.map(String) : [];
        const normalizedRoll = cleanString(qr.rollNo);
        const normalizedName = cleanString(qr.name);
        let matchedStudent = allocatedList.find(student => {
            const id = String(student.id || student.studentId || '');
            const admissionNo = cleanString(student.admissionNo || student.admissionNumber);
            const rollNo = cleanString(student.rollNo || student.rollNumber);
            const name = cleanString(student.name);
            return (normalizedRoll && (normalizedRoll === admissionNo || normalizedRoll === rollNo || normalizedRoll === cleanString(id))) || (!normalizedRoll && normalizedName && normalizedName === name);
        });
        if (!matchedStudent && allocatedIds.length) matchedStudent = allStudents.find(st => {
            const id = String(st.id || ''); if (!allocatedIds.includes(id)) return false;
            const admissionNo = cleanString(st.admissionNo || st.admissionNumber); const rollNo = cleanString(st.rollNo || st.rollNumber);
            return normalizedRoll && (normalizedRoll === admissionNo || normalizedRoll === rollNo || normalizedRoll === cleanString(id));
        });
        if (!matchedStudent) { setScannerResult({ ok: false, message: 'Student is NOT allocated to this exam hall.', qr }); setScannerStatus('Verification failed'); return false; }
        const studentId = String(matchedStudent.id || matchedStudent.studentId || '');
        const studentRecord = allStudents.find(st => String(st.id) === studentId) || matchedStudent;
        const now = new Date().toISOString();
        const verification = { status: 'Present', verificationStatus: 'Verified', verified: true, verifiedAt: now, verifiedBy: staffData.staffId || staffData.name, staffName: staffData.name, hallNo: duty.hallNo || '', examName: duty.examName || qr.exam || '', dutyTime: duty.dutyTime || '', allocationId: duty.id, studentId };
        try {
            if (Array.isArray(duty.studentList)) {
                const updatedStudentList = allocatedList.map(student => String(student.id || student.studentId || '') === studentId ? { ...student, ...verification } : student);
                await updateDoc(doc(db, 'staff_exam_halls', duty.id), { studentList: updatedStudentList, lastScanAt: serverTimestamp(), lastScannedStudentId: studentId, lastScannedBy: staffData.staffId || staffData.name });
            } else await updateDoc(doc(db, 'staff_exam_halls', duty.id), { lastScanAt: serverTimestamp(), lastScannedStudentId: studentId, lastScannedBy: staffData.staffId || staffData.name });
            await updateDoc(doc(db, 'students_records', studentId), { hallTicketVerification: verification, examHallStatus: 'Present', examHallVerified: true, examHallVerifiedAt: now, examHallVerifiedBy: staffData.staffId || staffData.name });
            await setDoc(doc(db, 'exam_hall_attendance', `${duty.id}_${studentId}`), { ...verification, admissionNo: studentRecord.admissionNo || studentRecord.rollNo || matchedStudent.admissionNo || '', studentName: studentRecord.name || matchedStudent.name || '', scannedQr: qr.raw, createdAt: serverTimestamp() }, { merge: true });
            setScannerResult({ ok: true, message: `${studentRecord.name || matchedStudent.name || 'Student'} — Present & Verified`, student: { ...matchedStudent, ...verification } });
            setScannerStatus('Student verified successfully');
            return true;
        } catch (error) { console.error('Hall-ticket QR verification error:', error); setScannerResult({ ok: false, message: 'Verification could not be saved. Please try again.', qr }); setScannerStatus('Save failed'); return false; }
    };

    useEffect(() => {
        if (!showHallTicketScanner) return undefined;
        if (allStudentsScanned) { setScannerStatus('All allocated students have already been verified for this hall.'); return undefined; }
        let cancelled = false; const scanner = new Html5Qrcode('hall-ticket-qr-reader'); hallTicketScannerRef.current = scanner;
        const startScanner = async () => {
            try { const cameras = await Html5Qrcode.getCameras(); if (!cameras?.length) throw new Error('No camera found'); const preferred = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[0]; if (cancelled) return;
                await scanner.start(preferred.id, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, async (decodedText) => {
                    if (scanProcessingRef.current) return;
                    scanProcessingRef.current = true;
                    setScannerStatus('Verifying student...');
                    await verifyHallTicketFromQr(decodedText);
                    if (scanPopupTimerRef.current) clearTimeout(scanPopupTimerRef.current);
                    scanPopupTimerRef.current = setTimeout(() => {
                        scanPopupTimerRef.current = null;
                        setScannerResult(null);
                        scanProcessingRef.current = false;
                        setScannerStatus('Point the camera at the next student\'s hall-ticket QR code');
                    }, 1800);
                }, () => {});
                if (!cancelled) setScannerStatus('Point the camera at the student hall-ticket QR code');
            } catch (error) { console.error('Unable to start hall-ticket QR scanner:', error); if (!cancelled) setScannerStatus('Camera unavailable. Please allow camera permission and try again.'); }
        };
        const timer = setTimeout(startScanner, 100);
        return () => {
            cancelled = true; clearTimeout(timer);
            if (scanPopupTimerRef.current) { clearTimeout(scanPopupTimerRef.current); scanPopupTimerRef.current = null; }
            const activeScanner = hallTicketScannerRef.current; hallTicketScannerRef.current = null;
            if (activeScanner) activeScanner.stop().catch(() => {}).finally(() => activeScanner.clear());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showHallTicketScanner]);

    useEffect(() => {
        if (!showHallTicketScanner || !allStudentsScanned) return;
        if (scanPopupTimerRef.current) { clearTimeout(scanPopupTimerRef.current); scanPopupTimerRef.current = null; }
        scanProcessingRef.current = false;
        setScannerResult(null);
        setScannerStatus('All allocated students have been verified for this hall.');
        const activeScanner = hallTicketScannerRef.current;
        if (activeScanner && activeScanner.isScanning) activeScanner.stop().catch(() => {});
    }, [allStudentsScanned, showHallTicketScanner]);

    const myLeaveRequests = staffLeaveList.filter(item =>
        (staffData.staffId && item.staffId === staffData.staffId) ||
        (item.staffName && item.staffName.toLowerCase() === staffData.name.toLowerCase())
    );

    const getActiveStudents = () => {
        return allStudents.filter(student => {
            if (!selectedClass) return false;

            const matchesClass =
                student.className &&
                cleanString(student.className) ===
                cleanString(selectedClass);

            if (
                selectedSection &&
                (
                    selectedSection.id ||
                    selectedSection.name
                )
            ) {

                return matchesClass && (
                    student.sectionId ===
                    selectedSection.id ||

                    cleanString(student.sectionName) ===
                    cleanString(selectedSection.name)
                );
            }

            return matchesClass;
        });
    };

    const activeStudents = getActiveStudents();

    const normalizeClassKey = (value) => {
        const raw = String(value ?? '').trim().toLowerCase();
        if (!raw) return '';
        const number = raw.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
        if (number) return `std-${number[1]}`;
        if (raw.includes('lkg')) return 'lkg';
        if (raw.includes('ukg')) return 'ukg';
        return raw.replace(/[^a-z0-9]/g, '');
    };

    const normalizeSectionKey = (value) => {
        const raw = String(value ?? '').trim().toLowerCase();
        if (!raw || raw === 'n/a' || raw === 'na' || raw === 'null' || raw === 'undefined') return '';
        const withoutPrefix = raw
            .replace(/^section\s*/i, '')
            .replace(/^sec\.?\s*/i, '')
            .trim();
        const letter = withoutPrefix.match(/\b([a-z])\b/i);
        return letter ? letter[1].toLowerCase() : withoutPrefix.replace(/[^a-z0-9]/g, '');
    };

    const getStudentClassValue = (student) =>
        student.className || student.class || student.grade || student.standard || student.classId || '';

    const getStudentSectionValue = (student) => {
        if (student.sectionName || student.section || student.sectionCode) {
            return student.sectionName || student.section || student.sectionCode;
        }

        if (student.sectionId) {
            const sectionDoc = sectionsList.find(sec =>
                String(sec.id) === String(student.sectionId)
            );

            return sectionDoc?.name ||
                sectionDoc?.sectionName ||
                sectionDoc?.section ||
                '';
        }

        return '';
    };

    const attendanceStudents = selectedAttendanceSlot &&
        selectedAttendanceSlot.timetableClass &&
        selectedAttendanceSlot.timetableSection
        ? allStudents.filter(student => {
            const classMatches =
                normalizeClassKey(getStudentClassValue(student)) ===
                normalizeClassKey(selectedAttendanceSlot.timetableClass);

            const sectionMatches =
                normalizeSectionKey(getStudentSectionValue(student)) ===
                normalizeSectionKey(selectedAttendanceSlot.timetableSection);

            return classMatches && sectionMatches;
        })
        : [];

    const filteredAttendanceStudents = attendanceStudents.filter(student =>
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.admissionNo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const presentStudentsCount = activeStudents.filter(s => s.status === 'present').length;
    const absentStudentsCount = activeStudents.filter(s => s.status === 'absent').length;
    const classAttendanceRate = activeStudents.length > 0
        ? Math.round((presentStudentsCount / activeStudents.length) * 100)
        : 100;

    const attendanceDefaulters = activeStudents.filter(s => {
        const rate = s.attendanceRate ? Number(s.attendanceRate) : (s.status === 'absent' ? 65 : 92);
        return rate < 75;
    });

    const handleLogout = () => {
        localStorage.removeItem('staffUser');
        navigate('/');
    };

    const getMatchedTimetableSlot = () => {
        if (!selectedAttendanceSlot) return null;
        if (!selectedAttendanceSlot.timetableClass || !selectedAttendanceSlot.timetableSection) return null;
        return selectedAttendanceSlot;
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
        const matchedSlot = getMatchedTimetableSlot();

        if (!matchedSlot) {
            alert('Attendance is locked because no exact timetable slot is selected.');
            return;
        }

        if (attendanceStudents.length === 0) {
            alert(
                `No students found for ${matchedSlot.timetableClass} - ${matchedSlot.timetableSection}. ` +
                'Please verify the student class and section records.'
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const batch = writeBatch(db);

            attendanceStudents.forEach((student) => {
                const attendanceStatus =
                    student.status || 'present';

                const studentRef = doc(
                    db,
                    'students_records',
                    student.id
                );

                batch.update(studentRef, {
                    status: attendanceStatus,
                    lastAttendanceDate: attendanceDate,
                    lastAttendancePeriod: attendancePeriod,
                    lastAttendanceTimetableId:
                        matchedSlot?.id || null,
                    lastAttendanceSubject:
                        matchedSlot?.subject ||
                        selectedSubject ||
                        'General',
                    lastAttendanceRoom:
                        matchedSlot?.roomNo || null,
                    lastAttendanceTeacher:
                        staffData.name || null,
                    lastAttendanceClass:
                        matchedSlot.timetableClass,
                    lastAttendanceSection:
                        matchedSlot.timetableSection
                });

                const attendanceHistoryRef = doc(
                    collection(db, 'attendance_records')
                );

                batch.set(attendanceHistoryRef, {
                    studentId: student.id,

                    studentName:
                        student.name || '',

                    admissionNo:
                        student.admissionNo ||
                        student.rollNo ||
                        '',

                    className:
                        matchedSlot.timetableClass,

                    sectionName:
                        matchedSlot.timetableSection,

                    date: attendanceDate,

                    period:
                        attendancePeriod,

                    subject:
                        matchedSlot?.subject ||
                        selectedSubject ||
                        'General',

                    teacherId:
                        staffData.staffId || '',

                    teacherName:
                        staffData.name || '',

                    timetableId:
                        matchedSlot?.id || null,

                    roomNo:
                        matchedSlot?.roomNo || '',

                    status:
                        attendanceStatus,

                    createdAt:
                        serverTimestamp()
                });
            });

            await batch.commit();

            setAttendanceSubmitted(true);

            alert(
                `Attendance submitted successfully for ${attendanceStudents.length} student(s).`
            );

        } catch (error) {

            console.error(
                'Attendance submission error:',
                error
            );

            alert(
                'Failed to submit attendance. Please try again.'
            );

        } finally {

            setIsSubmitting(false);
        }
    };

    const handleSubmitleaveRequest = async (e) => {
        e.preventDefault();
        if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
            alert('Please fill out all fields for the leave request.');
            return;
        }

        setIsLeaveSubmitting(true);
        try {
            await addDoc(collection(db, 'staff_leaves'), {
                staffId: staffData.staffId || 'UNKNOWN_ID',
                staffName: staffData.name,
                department: staffData.department,
                leaveType: leaveForm.leaveType,
                startDate: leaveForm.startDate,
                endDate: leaveForm.endDate,
                reason: leaveForm.reason,
                status: 'Pending',
                createdAt: serverTimestamp()
            });

            setLeaveForm({
                leaveType: 'Casual Leave',
                startDate: '',
                endDate: '',
                reason: ''
            });
            setLeaveActionStatus('Leave request submitted successfully to administration.');
            setTimeout(() => setLeaveActionStatus(''), 4000);
        } catch (error) {
            console.error("Error submitting leave request:", error);
            alert("Failed to submit leave request.");
        } finally {
            setIsLeaveSubmitting(false);
        }
    };

    const openChatWithStaff = async (member) => {
        if (!member?.staffId || !staffData.staffId) return;
        const chatId = getChatId(staffData.staffId, member.staffId);

        try {
            await setDoc(doc(db, 'staff_chats', chatId), {
                participants: [staffData.staffId, member.staffId],
                participantNames: {
                    [staffData.staffId]: staffData.name,
                    [member.staffId]: member.name
                },
                participantDepartments: {
                    [staffData.staffId]: staffData.department,
                    [member.staffId]: member.department || 'General'
                },
                updatedAt: serverTimestamp(),
                deletedFor: arrayRemove(staffData.staffId)
            }, { merge: true });

            setActiveChatId(chatId);
            setActiveChatInfo({ staffId: member.staffId, name: member.name, department: member.department || 'General' });
            setShowNewChatPicker(false);
            setChatDirectorySearch('');
            setActiveTab('chats');
        } catch (error) {
            console.error("Error opening chat:", error);
            alert("Could not open the chat. Please try again.");
        }
    };

    const handleSelectChat = (chat) => {
        const otherId = (chat.participants || []).find(id => id !== staffData.staffId);
        setActiveChatId(chat.id);
        setActiveChatInfo({
            staffId: otherId,
            name: chat.participantNames?.[otherId] || 'Staff Member',
            department: chat.participantDepartments?.[otherId] || 'General'
        });
    };

    const deleteConversationForMe = async () => {
        if (!activeChatId || !staffData.staffId) return;

        const confirmed = window.confirm(
            'Delete this chat from your chat list? The other staff member will keep their conversation and messages.'
        );
        if (!confirmed) return;

        try {
            await updateDoc(doc(db, 'staff_chats', activeChatId), {
                deletedFor: arrayUnion(staffData.staffId)
            });
            setActiveChatId(null);
            setActiveChatInfo(null);
            setActiveChatMessages([]);
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Could not delete this chat. Please try again.');
        }
    };

    const deleteChatMessage = async (messageId) => {
        if (!activeChatId || !messageId) return;
        if (!window.confirm('Delete this message permanently?')) return;

        try {
            await deleteDoc(doc(db, 'staff_chats', activeChatId, 'messages', messageId));
        } catch (error) {
            console.error('Error deleting chat message:', error);
            alert('Could not delete the message.');
        }
    };

    const deleteStaffRoomMessage = async (messageId) => {
        if (!messageId) return;
        if (!window.confirm('Delete this Staff Room message permanently?')) return;

        try {
            await deleteDoc(doc(db, 'staffroom_messages', messageId));
        } catch (error) {
            console.error('Error deleting Staff Room message:', error);
            alert('Could not delete the message.');
        }
    };

    const clearMyStaffRoomMessages = async () => {
        const mine = staffRoomMessages.filter(msg => msg.senderId === staffData.staffId);
        if (!mine.length) {
            alert('You do not have any Staff Room messages to delete.');
            return;
        }

        if (!window.confirm(`Delete your ${mine.length} visible Staff Room message(s)? This cannot be undone.`)) return;

        try {
            const batch = writeBatch(db);
            mine.forEach((msg) => batch.delete(doc(db, 'staffroom_messages', msg.id)));
            await batch.commit();
        } catch (error) {
            console.error('Error clearing Staff Room messages:', error);
            alert('Could not delete your Staff Room messages.');
        }
    };

    const sendChatMessage = async () => {
        const text = chatMessageInput.trim();
        if (!text || !activeChatId) return;

        setChatMessageInput('');
        try {
            await addDoc(collection(db, 'staff_chats', activeChatId, 'messages'), {
                senderId: staffData.staffId,
                senderName: staffData.name,
                text,
                type: 'message',
                createdAt: serverTimestamp()
            });
            await setDoc(doc(db, 'staff_chats', activeChatId), {
                lastMessage: text,
                lastMessageBy: staffData.staffId,
                updatedAt: serverTimestamp(),
                deletedFor: arrayRemove(staffData.staffId)
            }, { merge: true });
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Message could not be sent. Please try again.");
        }
    };

    const openRequestModal = (member) => {
        setRequestTargetStaff(member);
        setRequestForm({ subject: '', message: '' });
        setShowRequestModal(true);
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!requestTargetStaff || !requestForm.subject.trim() || !requestForm.message.trim()) {
            alert('Please enter both a subject and a message for the request.');
            return;
        }

        setIsRequestSubmitting(true);
        const member = requestTargetStaff;
        const chatId = getChatId(staffData.staffId, member.staffId);

        try {
            await setDoc(doc(db, 'staff_chats', chatId), {
                participants: [staffData.staffId, member.staffId],
                participantNames: {
                    [staffData.staffId]: staffData.name,
                    [member.staffId]: member.name
                },
                participantDepartments: {
                    [staffData.staffId]: staffData.department,
                    [member.staffId]: member.department || 'General'
                },
                updatedAt: serverTimestamp()
            }, { merge: true });

            const text = `${requestForm.subject.trim()}: ${requestForm.message.trim()}`;
            await addDoc(collection(db, 'staff_chats', chatId, 'messages'), {
                senderId: staffData.staffId,
                senderName: staffData.name,
                text,
                type: 'request',
                requestSubject: requestForm.subject.trim(),
                createdAt: serverTimestamp()
            });
            await setDoc(doc(db, 'staff_chats', chatId), {
                lastMessage: `Request: ${requestForm.subject.trim()}`,
                lastMessageBy: staffData.staffId,
                updatedAt: serverTimestamp()
            }, { merge: true });

            setShowRequestModal(false);
            setRequestTargetStaff(null);
            setActiveChatId(chatId);
            setActiveChatInfo({ staffId: member.staffId, name: member.name, department: member.department || 'General' });
            setActiveTab('chats');
        } catch (error) {
            console.error("Error sending request:", error);
            alert("Could not send the request. Please try again.");
        } finally {
            setIsRequestSubmitting(false);
        }
    };

    const sendStaffRoomMessage = async () => {
        const text = staffRoomInput.trim();
        if (!text) return;

        setStaffRoomInput('');
        try {
            await addDoc(collection(db, 'staffroom_messages'), {
                senderId: staffData.staffId,
                senderName: staffData.name,
                department: staffData.department,
                text,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error posting to staff room:", error);
            alert("Message could not be posted. Please try again.");
        }
    };

    const getExamSubjectKey = () => `${examType} - ${selectedSubject}`;

    const handleMarkChange = (studentId, value) => {
        setStudentMarks(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    const handleSaveSingleMark = async (studentId) => {
        const score = studentMarks[studentId];
        if (score === undefined || score === '') {
            alert('Please enter a valid mark first.');
            return;
        }

        const student = allStudents.find(s => s.id === studentId);
        if (!student || !isAssignedToTeach(selectedClass, student.sectionName, selectedSubject)) {
            alert("You are not assigned to teach this subject to this student's class/section.");
            return;
        }

        const compositeKey = getExamSubjectKey();
        try {
            const studentRef = doc(db, 'students_records', studentId);
            await updateDoc(studentRef, {
                [`marksDraft.${compositeKey}`]: Number(score),
                lastMarksDraftSaved: new Date().toISOString(),
                [`marksDraftEnteredBy.${compositeKey}`]: staffData.staffId || staffData.name
            });
            setMarksActionStatus(`Saved draft score for student #${studentId.slice(0, 5)}`);
            setTimeout(() => setMarksActionStatus(''), 3000);
        } catch (err) {
            console.error("Error updating individual mark draft:", err);
            alert("Failed to update record.");
        }
    };

    const handleResetSingleMark = async (studentId) => {
        const student = allStudents.find(s => s.id === studentId);
        if (!student || !isAssignedToTeach(selectedClass, student.sectionName, selectedSubject)) {
            alert("You are not assigned to teach this subject to this student's class/section.");
            return;
        }

        const compositeKey = getExamSubjectKey();
        if (!window.confirm("Are you sure you want to clear this student's mark?")) return;

        try {
            const studentRef = doc(db, 'students_records', studentId);
            await updateDoc(studentRef, {
                [`marksDraft.${compositeKey}`]: deleteField(),
                [`marksDraftEnteredBy.${compositeKey}`]: deleteField(),
                lastMarksUpdated: new Date().toISOString()
            });

            setStudentMarks(prev => {
                const next = { ...prev };
                delete next[studentId];
                return next;
            });
            setMarksActionStatus(`Cleared mark for student #${studentId.slice(0, 5)}`);
            setTimeout(() => setMarksActionStatus(''), 3000);
        } catch (err) {
            console.error("Error clearing mark:", err);
            alert("Failed to clear score.");
        }
    };

    const handleSaveMarksDraft = async () => {
        setIsSubmitting(true);
        const compositeKey = getExamSubjectKey();
        try {
            const batch = writeBatch(db);
            marksFilteredStudents.forEach(student => {
                const score = studentMarks[student.id] ?? student.marksDraft?.[compositeKey] ?? student.marks?.[compositeKey];
                if (score !== undefined && score !== '') {
                    const studentRef = doc(db, 'students_records', student.id);
                    batch.update(studentRef, {
                        [`marksDraft.${compositeKey}`]: Number(score),
                        lastMarksDraftSaved: new Date().toISOString(),
                        [`marksDraftEnteredBy.${compositeKey}`]: staffData.staffId || staffData.name
                    });
                }
            });
            await batch.commit();
            setMarksActionStatus('saved');
        } catch (error) {
            console.error("Error saving draft marks: ", error);
            alert("Failed to save draft marks.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetAllExamMarks = async () => {
        const compositeKey = getExamSubjectKey();
        if (!window.confirm(`Reset ALL draft marks for ${compositeKey}? This cannot be undone.`)) return;

        setIsSubmitting(true);
        try {
            const batch = writeBatch(db);
            marksFilteredStudents.forEach(student => {
                const studentRef = doc(db, 'students_records', student.id);
                batch.update(studentRef, {
                    [`marksDraft.${compositeKey}`]: deleteField(),
                    [`marksDraftEnteredBy.${compositeKey}`]: deleteField()
                });
            });
            await batch.commit();
            setStudentMarks({});
            setMarksActionStatus('reset');
        } catch (err) {
            console.error("Error resetting class marks:", err);
            alert("Failed to reset marks.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!assignmentForm.title || !assignmentForm.className || !assignmentForm.sectionName) return;

        try {
            await addDoc(collection(db, 'class_assignments'), {
                ...assignmentForm,
                staffId: staffData.staffId,
                staffName: staffData.name,
                createdAt: serverTimestamp()
            });
            setAssignmentForm(initialAssignmentForm);
        } catch (error) {
            console.error("Error assigning task:", error);
        }
    };

    const handleUpdateAssignment = async (e) => {
        e.preventDefault();
        if (!editingAssignment || !editingAssignment.id) return;

        try {
            const taskRef = doc(db, 'class_assignments', editingAssignment.id);
            await updateDoc(taskRef, {
                title: editingAssignment.title,
                type: editingAssignment.type,
                className: editingAssignment.className,
                sectionName: editingAssignment.sectionName,
                subject: editingAssignment.subject,
                dueDate: editingAssignment.dueDate,
                description: editingAssignment.description || '',
                updatedAt: new Date().toISOString()
            });
            setEditingAssignment(null);
        } catch (err) {
            console.error("Update task error:", err);
            alert("Failed to update assignment.");
        }
    };

    const handleDeleteAssignment = async (id) => {
        if (window.confirm("Are you sure you want to delete this assignment permanently?")) {
            try {
                await deleteDoc(doc(db, 'class_assignments', id));
            } catch (err) {
                console.error("Delete task error:", err);
            }
        }
    };

    const handleSyllabusFileSelect = (file) => {
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            alert('Invalid file format! Please upload only standard PDF documents.');
            return;
        }

        setIsSyllabusCompressing(true);

        const reader = new FileReader();
        reader.onload = (e) => {
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
                        setIsSyllabusCompressing(false);
                        return;
                    }
                }

                setPendingSyllabusFile({
                    fileName: file.name,
                    fileSize: (file.size / 1024).toFixed(1) + ' KB',
                    data: base64String
                });
            } catch (err) {
                console.error("Syllabus PDF processing error:", err);
                alert("Could not process PDF file. Please try another document.");
            } finally {
                setIsSyllabusCompressing(false);
            }
        };

        reader.readAsDataURL(file);
    };

    const handleUploadSyllabus = async (e) => {
        e.preventDefault();
        if (!syllabusForm.className || !syllabusForm.subject || !syllabusForm.title) return;

        if (!pendingSyllabusFile) {
            alert('Please attach a syllabus PDF before uploading.');
            return;
        }

        try {
            await addDoc(collection(db, 'class_syllabus'), {
                ...syllabusForm,
                fileName: pendingSyllabusFile.fileName,
                fileSize: pendingSyllabusFile.fileSize,
                pdfData: pendingSyllabusFile.data,
                staffId: staffData.staffId,
                staffName: staffData.name,
                createdAt: serverTimestamp()
            });

            setSyllabusForm({ ...initialSyllabusForm, className: syllabusForm.className });
            setPendingSyllabusFile(null);
            setSyllabusUploadStatus('Syllabus uploaded successfully!');
            setTimeout(() => setSyllabusUploadStatus(''), 3000);
        } catch (error) {
            console.error("Error uploading syllabus:", error);
            alert("Failed to upload syllabus. Please try again.");
        }
    };

    const handleDeleteSyllabus = async (id) => {
        if (window.confirm("Delete this syllabus document permanently?")) {
            try {
                await deleteDoc(doc(db, 'class_syllabus', id));
            } catch (err) {
                console.error("Delete syllabus error:", err);
            }
        }
    };

    const handleAddBook = async (e) => {
        e.preventDefault();
        if (!bookForm.title.trim() || !bookForm.author.trim()) return;

        const copies = parseInt(bookForm.totalCopies, 10) || 1;

        try {
            await addDoc(collection(db, 'library_books'), {
                title: bookForm.title.trim(),
                author: bookForm.author.trim(),
                category: bookForm.category.trim() || 'General',
                isbn: bookForm.isbn.trim(),
                totalCopies: copies,
                availableCopies: copies,
                addedBy: staffData.name,
                createdAt: serverTimestamp()
            });
            setBookForm(initialBookForm);
            setLibraryStatus('Book added to catalog!');
            setTimeout(() => setLibraryStatus(''), 2500);
        } catch (err) {
            console.error("Add book error:", err);
            alert("Failed to add book. Please try again.");
        }
    };

    const handleDeleteBook = async (bookId) => {
        const hasActiveIssue = libraryIssues.some(iss => iss.bookId === bookId && iss.status === 'issued');
        if (hasActiveIssue) {
            alert("This book has copies currently issued to students. All copies must be returned before it can be removed.");
            return;
        }
        if (window.confirm("Remove this book from the library catalog permanently?")) {
            try {
                await deleteDoc(doc(db, 'library_books', bookId));
            } catch (err) {
                console.error("Delete book error:", err);
            }
        }
    };

    const handleIssueBook = async (e) => {
        e.preventDefault();
        const book = libraryBooks.find(b => b.id === issueForm.bookId);
        const student = allStudents.find(s => s.id === issueForm.studentId);

        if (!book) { alert("Please select a book to issue."); return; }
        if (!student) { alert("Please select a valid student."); return; }
        if ((book.availableCopies || 0) <= 0) { alert("No copies of this book are currently available."); return; }
        if (!issueForm.dueDate) { alert("Please select a return due date."); return; }

        try {
            await addDoc(collection(db, 'library_issues'), {
                bookId: book.id,
                bookTitle: book.title,
                studentId: student.id,
                studentName: student.name,
                studentRoll: student.rollNo || student.rollNumber || '',
                studentClass: student.className || '',
                studentSection: student.sectionName || student.section || '',
                issueDate: new Date().toISOString().slice(0, 10),
                dueDate: issueForm.dueDate,
                returnDate: null,
                status: 'issued',
                issuedBy: staffData.name,
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, 'library_books', book.id), {
                availableCopies: increment(-1)
            });

            setIssueForm(initialIssueForm);
            setLibraryStatus(`"${book.title}" issued to ${student.name}!`);
            setTimeout(() => setLibraryStatus(''), 2500);
        } catch (err) {
            console.error("Issue book error:", err);
            alert("Failed to issue book. Please try again.");
        }
    };

    const handleReturnBook = async (issue) => {
        if (!window.confirm(`Mark "${issue.bookTitle}" as returned by ${issue.studentName}?`)) return;
        try {
            await updateDoc(doc(db, 'library_issues', issue.id), {
                status: 'returned',
                returnDate: new Date().toISOString().slice(0, 10)
            });
            await updateDoc(doc(db, 'library_books', issue.bookId), {
                availableCopies: increment(1)
            });
        } catch (err) {
            console.error("Return book error:", err);
            alert("Failed to update return status. Please try again.");
        }
    };

    const handleSaveSubmissionGrade = async (submissionId, studentId, taskTitle) => {
        const score = submissionGrades[submissionId];
        if (score === undefined || score === '') {
            alert('Please enter a mark score first.');
            return;
        }

        setGradingLoadingId(submissionId);
        try {
            await updateDoc(doc(db, 'assignment_submissions', submissionId), {
                obtainedMarks: Number(score),
                gradedAt: new Date().toISOString(),
                gradedBy: staffData.name
            });

            if (studentId) {
                await updateDoc(doc(db, 'students_records', studentId), {
                    [`marks.${taskTitle || 'Assignment'}`]: Number(score),
                    lastMarksUpdated: new Date().toISOString()
                });
            }

            alert('Marks saved and published successfully!');
        } catch (error) {
            console.error("Grading save error:", error);
            alert("Failed to save grade.");
        } finally {
            setGradingLoadingId(null);
        }
    };

    const stats = [
        { title: 'Scheduled Slots', value: `${mySchedule.length} Sessions`, icon: BookOpen, color: 'indigo' },
        { title: 'Turned In PDFs', value: `${submissionsList.length} Files`, icon: FileCheck, color: 'emerald' },
        { title: 'Class Attendance', value: `${classAttendanceRate}%`, icon: BarChart2, color: classAttendanceRate < 75 ? 'rose' : 'emerald' },
        { title: 'Assigned Roster', value: allStudents.length.toString(), icon: Users, color: 'rose' },
    ];

    const announcements = [
        { id: 1, title: 'Term-1 Exam Marks Submission', date: 'Deadline: Aug 20, 2026', type: 'urgent' },
        { id: 2, title: 'Staff Council Meeting', date: 'Tomorrow at 03:30 PM', type: 'info' },
        { id: 3, title: 'Independence Day Event Photos Uploaded', date: 'Aug 15, 2026', type: 'normal' },
    ];

    const todayRef = new Date();
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startOfCurrentWeek = new Date(todayRef);
    startOfCurrentWeek.setDate(todayRef.getDate() - todayRef.getDay() + (calendarWeekOffset * 7));
    const calendarWeekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfCurrentWeek);
        d.setDate(startOfCurrentWeek.getDate() + i);
        return d;
    });
    const calendarMonthLabel = calendarWeekDays[3].toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const selectedDayEvents = dayEvents[selectedCalendarDate] || [];

    const persistDayEvents = (updated) => {
        setDayEvents(updated);
        try {
            localStorage.setItem(`staffScheduleEvents_${staffData.staffId || 'default'}`, JSON.stringify(updated));
        } catch (err) {
            console.error("Failed to save schedule events", err);
        }
    };

    const handleAddScheduleEvent = () => {
        if (!newEventForm.title.trim()) return;
        const updated = {
            ...dayEvents,
            [selectedCalendarDate]: [
                ...(dayEvents[selectedCalendarDate] || []),
                { id: `evt-${Date.now()}`, title: newEventForm.title.trim(), time: newEventForm.time }
            ]
        };
        persistDayEvents(updated);
        setNewEventForm({ title: '', time: '' });
        setShowAddEventForm(false);
    };

    const handleDeleteScheduleEvent = (dateKey, eventId) => {
        const updated = {
            ...dayEvents,
            [dateKey]: (dayEvents[dateKey] || []).filter(ev => ev.id !== eventId)
        };
        persistDayEvents(updated);
    };

    const todayWeekdayName = todayRef.toLocaleDateString('en-US', { weekday: 'long' });
    const todaysPlanItems = (mySchedule.filter(i => i.day === todayWeekdayName).length > 0
        ? mySchedule.filter(i => i.day === todayWeekdayName)
        : mySchedule
    ).slice(0, 3);

    const recentDocuments = [...submissionsList]
        .sort((a, b) => {
            const aT = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : 0;
            const bT = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : 0;
            return bT - aT;
        })
        .slice(0, 4);

    const classProgressData = classList
        .map(cls => {
            const studentsInClass = allStudents.filter(s => s.className === cls);
            if (studentsInClass.length === 0) return null;
            const presentCount = studentsInClass.filter(s => s.status === 'present').length;
            const rate = Math.round((presentCount / studentsInClass.length) * 100);
            return { className: cls, count: studentsInClass.length, rate };
        })
        .filter(Boolean)
        .slice(0, 4);

    const filteredLibraryBooks = libraryBooks.filter(b => {
        const q = cleanString(librarySearch);
        if (!q) return true;
        return cleanString(b.title).includes(q) || cleanString(b.author).includes(q) || cleanString(b.category).includes(q);
    });

    const studentsForIssue = allStudents.filter(s => {
        if (issueForm.className && cleanString(s.className) !== cleanString(issueForm.className)) return false;
        if (issueForm.sectionName && cleanString(s.sectionName || s.section) !== cleanString(issueForm.sectionName)) return false;
        return true;
    });

    const currentlyIssuedBooks = libraryIssues
        .filter(i => i.status === 'issued')
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    const todayISO = new Date().toISOString().slice(0, 10);
    const isOverdue = (dueDate) => dueDate && dueDate < todayISO;

    const upcomingActivities = [
        ...mySchedule.slice(0, 1).map(item => ({
            id: `sch-${item.id}`,
            title: item.subject || 'Class Session',
            meta: `${item.day || 'Today'} • ${item.timeSlot || 'TBA'}`,
            icon: Calendar
        })),
        ...[...assignmentsList]
            .filter(a => a.dueDate)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 2)
            .map(a => ({
                id: `asg-${a.id}`,
                title: a.title || 'Assignment',
                meta: `Due ${a.dueDate}`,
                icon: ClipboardList
            }))
    ].slice(0, 3);

    const pendingLeaveCount = myLeaveRequests.filter(l => (l.status || 'Pending') === 'Pending').length;
    const ungradedSubmissionsCount = submissionsList.filter(s => s.obtainedMarks === undefined || s.obtainedMarks === null || s.obtainedMarks === '').length;
    const dueSoonAssignmentsCount = assignmentsList.filter(a => a.dueDate && new Date(a.dueDate) >= new Date(new Date().setHours(0, 0, 0, 0))).length;

    const filteredStudents = activeStudents.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const marksFilteredStudents = filteredStudents.filter(student =>
        isAssignedToTeach(selectedClass, student.sectionName, selectedSubject)
    );

    const sectionSubmissions = submissionsList.filter(item => {
        if (!subClassFilter) return false;
        const matchesClass = cleanString(item.className) === cleanString(subClassFilter);
        if (subSectionFilter) {
            return matchesClass && cleanString(item.sectionName) === cleanString(subSectionFilter);
        }
        return matchesClass;
    });

    const sectionEnrolledStudents = allStudents.filter(student => {
        if (!subClassFilter) return false;
        const matchesClass = cleanString(student.className) === cleanString(subClassFilter);
        if (subSectionFilter) {
            return matchesClass && cleanString(student.sectionName) === cleanString(subSectionFilter);
        }
        return matchesClass;
    });

    const sectionAssignments = assignmentsList.filter(task => {
        if (!subClassFilter) return false;
        const matchesClass = cleanString(task.className) === cleanString(subClassFilter);
        if (subSectionFilter) {
            return matchesClass && cleanString(task.sectionName) === cleanString(subSectionFilter);
        }
        return matchesClass;
    });

    const unsubmittedStudentList = [];
    sectionAssignments.forEach(task => {
        sectionEnrolledStudents.forEach(st => {
            const hasSubmitted = sectionSubmissions.some(sub =>
                sub.taskId === task.id &&
                (cleanString(sub.admissionNo) === cleanString(st.admissionNo) || sub.studentId === st.id)
            );
            if (!hasSubmitted) {
                unsubmittedStudentList.push({
                    student: st,
                    task: task
                });
            }
        });
    });

    const pendingReviewCount = sectionSubmissions.filter(s => s.obtainedMarks === undefined || s.obtainedMarks === null || s.obtainedMarks === '').length;
    const completedCount = sectionSubmissions.filter(s => s.obtainedMarks !== undefined && s.obtainedMarks !== null && s.obtainedMarks !== '').length;

    const displayedSubmissions = sectionSubmissions.filter(item => {
        const isGraded = item.obtainedMarks !== undefined && item.obtainedMarks !== null && item.obtainedMarks !== '';
        if (submissionFilterStatus === 'pending') return !isGraded;
        if (submissionFilterStatus === 'completed') return isGraded;
        return true;
    });

    const extraDepartments = [...new Set(
        allStaffMembers
            .map(s => (s.department || '').trim())
            .filter(d => d && !subjectList.some(sub => cleanString(sub) === cleanString(d)))
    )];
    const departmentNames = [...subjectList, ...extraDepartments];

    const departmentGroups = departmentNames.reduce((acc, dept) => {
        acc[dept] = allStaffMembers.filter(s => cleanString(s.department) === cleanString(dept));
        return acc;
    }, {});

    const activeDepartmentStaff = selectedDepartment ? (departmentGroups[selectedDepartment] || []) : [];

    const chatDirectoryResults = allStaffMembers.filter(s => {
        if (s.staffId === staffData.staffId) return false;
        const q = chatDirectorySearch.trim().toLowerCase();
        if (!q) return true;
        return (
            (s.name || '').toLowerCase().includes(q) ||
            (s.department || '').toLowerCase().includes(q)
        );
    });

    const getChatId = (idA, idB) => [idA, idB].sort().join('_');

    return (
        <div className="dashboard-containers">
            <header className="mobile-topbar">
                <div className="mobile-brand">
                    <img src={logo} alt="" id='logog' />
                    <span>HOLY CROSS MATRIC. HR. SEC. SCHOOL</span>
                </div>
                <button
                    className="menu-toggle-btn"
                    aria-label="Toggle Sidebar"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {isMobileMenuOpen && (
                <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-icon"><img src={logo} alt="" id='logog' /></div>
                    <span className="brand-titles">HOLY CROSS MATRIC. HR. SEC. SCHOOL</span>
                </div>

                <div className="sidebar-user">
                    <div className="user-avatar">{staffData.name.charAt(0)}</div>
                    <div className="user-info">
                        <span className="user-name">{staffData.name}</span>
                        <span className="user-role">{staffData.department}</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-group">
                        <span className="sidebar-group-label">My Workspace</span>

                        <button
                            className={`nav-links ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <LayoutGrid size={18} />
                                <span>Dashboard</span>
                            </div>
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'schedule' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('schedule'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <Calendar size={18} />
                                <span>Timetable</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'departments' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('departments'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <Building2 size={18} />
                                <span>Departments</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'assignments' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('assignments'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <ClipboardList size={18} />
                                <span>Tasks</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'syllabus' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('syllabus'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <BookMarked size={18} />
                                <span>Syllabus</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'marks' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('marks');
                                setSelectedClass('10th Std');
                                setSelectedSection(null);
                                setIsMobileMenuOpen(false);
                            }}
                        >
                            <div className="nav-links-content">
                                <Award size={18} />
                                <span>Marks Entry</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'attendance' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('attendance');
                                setSelectedClass('10th Std');
                                setSelectedSection(null);
                                setIsMobileMenuOpen(false);
                            }}
                        >
                            <div className="nav-links-content">
                                <CheckCircle size={18} />
                                <span>Attendance</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'submissions' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('submissions');
                                setSubClassFilter(null);
                                setSubSectionFilter(null);
                                setSubmissionFilterStatus('all');
                                setIsMobileMenuOpen(false);
                            }}
                        >
                            <div className="nav-links-content">
                                <FileCheck size={18} />
                                <span>Assessments</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>

                        <div className="nav-group">
                            <button
                                className={`nav-links ${academicMenuOpen ? 'expanded' : ''} ${['students', 'analytics'].includes(activeTab) ? 'active-parent' : ''}`}
                                onClick={() => setAcademicMenuOpen(!academicMenuOpen)}
                            >
                                <div className="nav-links-content">
                                    <GraduationCap size={18} />
                                    <span>More Academic Tools</span>
                                </div>
                                <ChevronDown size={16} className="chevron" />
                            </button>

                            {academicMenuOpen && (
                                <div className="sub-menu">
                                    <button
                                        className={`sub-link ${activeTab === 'students' ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveTab('students');
                                            setSelectedClass(null);
                                            setSelectedSection(null);
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        Student Roster
                                    </button>
                                    <button
                                        className={`sub-link ${activeTab === 'analytics' ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveTab('analytics');
                                            setSelectedClass('10th Std');
                                            setSelectedSection(null);
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        Attendance Analytics
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sidebar-group">
                        <span className="sidebar-group-label">Examinations</span>
                        <div className="nav-group">
                            <button
                                type="button"
                                className={`nav-links ${examHallMenuOpen ? 'expanded' : ''} ${activeTab === 'exam-halls' ? 'active-parent' : ''}`}
                                onClick={() => setExamHallMenuOpen(prev => !prev)}
                            >
                                <div className="nav-links-content">
                                    <Calendar size={18} />
                                    <span>Exam Hall Allocation</span>
                                </div>
                                <ChevronDown size={15} className={`chevron ${examHallMenuOpen ? 'open' : ''}`} />
                            </button>
                            {examHallMenuOpen && (
                                <div className="sub-menu">
                                    <button
                                        type="button"
                                        className={`sub-link ${activeTab === 'exam-halls' ? 'active' : ''}`}
                                        onClick={() => { setActiveTab('exam-halls'); setIsMobileMenuOpen(false); }}
                                    >
                                        <CheckCircle size={13} /> My Invigilation Duty
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sidebar-group">
                        <span className="sidebar-group-label">Communication</span>

                        <button
                            className={`nav-links ${activeTab === 'chats' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('chats'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <MessageCircle size={18} />
                                <span>Chats</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'staffroom' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('staffroom'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <Users size={18} />
                                <span>Staff Room</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'schoolnews' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('schoolnews'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <Newspaper size={18} />
                                <span>School News</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>
                    </div>

                    <div className="sidebar-group">
                        <span className="sidebar-group-label">Approval & Alerts</span>

                        <button
                            className={`nav-links ${activeTab === 'leaves' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('leaves'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <SendHorizonal size={18} />
                                <span>Leave Requests</span>
                            </div>
                            <ChevronRight size={15} className="nav-arrow" />
                        </button>
                    </div>

                    <div className="sidebar-group">
                        <span className="sidebar-group-label">Others</span>

                        <button
                            className={`nav-links ${activeTab === 'downloads' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('downloads'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <Download size={18} />
                                <span>Downloads</span>
                            </div>
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'library' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('library'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <Library size={18} />
                                <span>Library</span>
                            </div>
                        </button>

                        <button
                            className={`nav-links ${activeTab === 'events' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('events'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <PartyPopper size={18} />
                                <span>Events</span>
                            </div>
                        </button>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-topbar">
                    <h1 className="dashboard-page-title">Staff Dashboard</h1>

                    <div className="topbar-right">
                        <div className="search-bar">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search for student and teacher"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="topbar-actions">
                            <button
                                className={`icon-btn ${isDarkMode ? 'icon-btn-on' : ''}`}
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                aria-label="Toggle dark mode"
                            >
                                <Moon size={17} />
                            </button>

                            <div className="notification-wrapper" style={{ position: 'relative' }}>
                                <button className="icon-btn" onClick={() => { setShowNotifications(!showNotifications); setShowAiHint(false); }}>
                                    <Bell size={17} />
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

                            <div className="notification-wrapper" style={{ position: 'relative' }}>
                                <button className="icon-btn icon-btn-accent" onClick={() => { setShowAiHint(!showAiHint); setShowNotifications(false); }}>
                                    <Sparkles size={17} />
                                </button>
                                {showAiHint && (
                                    <div className="notification-dropdown ai-hint-dropdown">
                                        <div className="dropdown-header">
                                            <h4>AI Assistant</h4>
                                        </div>
                                        <div style={{ padding: '14px 16px', fontSize: '.8rem', color: 'var(--muted)' }}>
                                            Smart suggestions for your day are coming soon.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="notification-wrapper" style={{ position: 'relative' }}>
                            <div
                                className="topbar-profile"
                                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); setShowAiHint(false); }}
                            >
                                <div className="topbar-avatar">{staffData.name.charAt(0)}</div>
                                <div className="topbar-profile-copy">
                                    <strong>{staffData.name}</strong>
                                    <span>{staffData.department || 'Staff User'}</span>
                                </div>
                                <ChevronDown size={17} />
                            </div>
                            {showProfileMenu && (
                                <div className="notification-dropdown profile-dropdown">
                                    <button className="profile-dropdown-item" onClick={() => { setActiveTab('leaves'); setShowProfileMenu(false); }}>
                                        <SendHorizonal size={15} /> My Leave Requests
                                    </button>
                                    <button className="profile-dropdown-item logout-item" onClick={handleLogout}>
                                        <LogOut size={15} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    {activeTab === 'overview' && (
                        <div className="overview-layout">
                            <div className="overview-left">
                                <div className="welcome-banner">
                                    <div className="welcome-copy">
                                        <h2>Good morning, {staffData.name.split(' ')[0]}!</h2>
                                        <p>Have a great day at work!</p>
                                        {announcements[0] && (
                                            <p className="welcome-notice">
                                                <strong>Important notice:</strong> {announcements[0].title} — {announcements[0].date}. Don't miss it!
                                            </p>
                                        )}
                                    </div>
                                    <div className="welcome-visual" aria-hidden="true">
                                        <div className="welcome-check"><Check size={22} /></div>
                                        <div className="welcome-laptop"><div className="laptop-dot" /></div>
                                        <div className="welcome-person">
                                            <div className="person-head" />
                                            <div className="person-body" />
                                        </div>
                                    </div>
                                </div>

                                <div className="dash-card quick-links-card">
                                    <div className="card-header compact">
                                        <div><h3>Quick Links</h3></div>
                                    </div>
                                    <div className="quick-links-grid">
                                        <button className="quick-link-item" onClick={() => { setActiveTab('students'); setSelectedClass(null); setSelectedSection(null); }}>
                                            <div className="quick-link-icon bg-indigo"><Folder size={20} /></div>
                                            <span>Class Roster</span>
                                        </button>
                                        <button className="quick-link-item" onClick={() => setActiveTab('schedule')}>
                                            <div className="quick-link-icon bg-rose"><Calendar size={20} /></div>
                                            <span>Time Table</span>
                                        </button>
                                        <button className="quick-link-item" onClick={() => setActiveTab('assignments')}>
                                            <div className="quick-link-icon bg-amber"><ClipboardList size={20} /></div>
                                            <span>Lesson Plans</span>
                                        </button>
                                        <button className="quick-link-item" onClick={() => { setActiveTab('marks'); setSelectedClass('10th Std'); setSelectedSection(null); }}>
                                            <div className="quick-link-icon bg-indigo"><Award size={20} /></div>
                                            <span>Marks Entry</span>
                                        </button>
                                        <button className="quick-link-item" onClick={() => setActiveTab('attendance')}>
                                            <div className="quick-link-icon bg-emerald"><CheckCircle size={20} /> </div>
                                            <span>Attendance</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="stats-grid">
                                    {stats.map((stat, idx) => {
                                        const IconComponent = stat.icon;
                                        return (
                                            <div key={idx} className={`stat-card stat-card-${idx + 1}`}>
                                                <div className="stat-details">
                                                    <span className="stat-title">{stat.title}</span>
                                                    <div className="stat-value">{stat.value}</div>
                                                </div>
                                                <div className={`stat-icon bg-${stat.color}`}>
                                                    <IconComponent size={22} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="content-grid overview-grid">
                                    <div className="dash-card overview-main-card">
                                        <div className="card-header">
                                            <div>
                                                <h3>Today's Plan</h3>
                                                <p className="subtitle">Classes lined up for you today</p>
                                            </div>
                                            <button className="see-all-btn" onClick={() => setActiveTab('schedule')}>
                                                See All <span>→</span>
                                            </button>
                                        </div>

                                        {todaysPlanItems.length === 0 ? (
                                            <div className="overview-empty">
                                                No timetable slots mapped to your staff profile yet.
                                            </div>
                                        ) : (
                                            <div className="todays-plan-list">
                                                {todaysPlanItems.map((item, idx) => (
                                                    <div key={item.id || idx} className="plan-row">
                                                        <div className="plan-avatar">{(item.subject || 'S').charAt(0)}</div>
                                                        <div className="plan-info">
                                                            <strong>{item.subject || 'Subject'}</strong>
                                                            <button className="plan-class-link" onClick={() => setActiveTab('students')}>
                                                                {item.className || 'General Class'}
                                                            </button>
                                                        </div>
                                                        <div className="plan-meta">
                                                            <span><Layers size={13} /> {item.roomNo || 'Room N/A'}</span>
                                                            <span><Clock size={13} /> {item.timeSlot || 'TBA'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="dash-card">
                                        <div className="card-header compact">
                                            <div>
                                                <h3>Documents</h3>
                                                <p className="subtitle">Recently turned-in files</p>
                                            </div>
                                            <button className="see-all-btn" onClick={() => setActiveTab('downloads')}>See all</button>
                                        </div>
                                        {recentDocuments.length === 0 ? (
                                            <div className="overview-empty">No documents submitted yet.</div>
                                        ) : (
                                            <div className="documents-list">
                                                {recentDocuments.map((doc) => (
                                                    <div key={doc.id} className="document-row">
                                                        <div className="document-icon"><FileText size={16} /></div>
                                                        <div className="document-info">
                                                            <strong>{doc.taskTitle || 'Assignment'}</strong>
                                                            <span>{doc.submittedAt?.toDate ? doc.submittedAt.toDate().toLocaleDateString() : 'Recent'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="dash-card full-width">
                                    <div className="card-header compact">
                                        <div>
                                            <h3>Class Progress</h3>
                                            <p className="subtitle">Live attendance rate by class</p>
                                        </div>
                                        <button className="see-all-btn" onClick={() => setActiveTab('analytics')}>See all</button>
                                    </div>
                                    {classProgressData.length === 0 ? (
                                        <div className="overview-empty">No enrolled students found yet.</div>
                                    ) : (
                                        <div className="class-progress-list">
                                            {classProgressData.map((c) => (
                                                <div key={c.className} className="progress-row">
                                                    <div className="progress-row-info">
                                                        <strong>{c.className}</strong>
                                                        <span>{c.count} Students</span>
                                                    </div>
                                                    <div className="progress-bar-track">
                                                        <div
                                                            className={`progress-bar-fill ${c.rate < 75 ? 'low' : ''}`}
                                                            style={{ width: `${c.rate}%` }}
                                                        />
                                                    </div>
                                                    <span className="progress-rate">{c.rate}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <aside className="overview-right-rail">
                                <div className="dash-card schedule-widget">
                                    <div className="card-header compact">
                                        <div><h3>Schedule</h3></div>
                                        <span className="schedule-month-label">{calendarMonthLabel}</span>
                                    </div>
                                    <div className="calendar-week-nav">
                                        <button className="calendar-nav-btn" onClick={() => setCalendarWeekOffset(calendarWeekOffset - 1)}>
                                            <ChevronLeft size={15} />
                                        </button>
                                        <span>Weekly</span>
                                        <button className="calendar-nav-btn" onClick={() => setCalendarWeekOffset(calendarWeekOffset + 1)}>
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                    <div className="calendar-days-row">
                                        {calendarWeekDays.map((d) => (
                                            <button
                                                key={d.toDateString()}
                                                className={`calendar-day-pill ${selectedCalendarDate === d.toDateString() ? 'selected' : ''} ${d.toDateString() === todayRef.toDateString() ? 'is-today' : ''}`}
                                                onClick={() => setSelectedCalendarDate(d.toDateString())}
                                            >
                                                <span className="cal-dow">{dayLabels[d.getDay()]}</span>
                                                <span className="cal-date">{d.getDate()}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="schedule-day-panel">
                                        <div className="schedule-day-panel-header">
                                            <span className="schedule-day-panel-date">
                                                {new Date(selectedCalendarDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                            <button
                                                className="schedule-add-btn"
                                                onClick={() => setShowAddEventForm(!showAddEventForm)}
                                            >
                                                <PlusCircle size={14} /> Add New
                                            </button>
                                        </div>

                                        {showAddEventForm && (
                                            <div className="schedule-add-form">
                                                <input
                                                    type="text"
                                                    className="table-input full-width-input"
                                                    placeholder="What's scheduled?"
                                                    value={newEventForm.title}
                                                    onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddScheduleEvent()}
                                                    autoFocus
                                                />
                                                <input
                                                    type="time"
                                                    className="table-input"
                                                    value={newEventForm.time}
                                                    onChange={(e) => setNewEventForm({ ...newEventForm, time: e.target.value })}
                                                />
                                                <div className="schedule-add-form-actions">
                                                    <button className="btn-primary" onClick={handleAddScheduleEvent}>Save</button>
                                                    <button
                                                        className="btn-secondary"
                                                        onClick={() => { setShowAddEventForm(false); setNewEventForm({ title: '', time: '' }); }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDayEvents.length === 0 ? (
                                            <div className="overview-empty">Nothing added for this day yet.</div>
                                        ) : (
                                            <div className="schedule-day-events">
                                                {selectedDayEvents
                                                    .slice()
                                                    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                                                    .map((ev) => (
                                                        <div key={ev.id} className="schedule-day-event-row">
                                                            <div className="schedule-day-event-info">
                                                                <strong>{ev.title}</strong>
                                                                {ev.time && <span>{ev.time}</span>}
                                                            </div>
                                                            <button
                                                                className="schedule-day-event-delete"
                                                                onClick={() => handleDeleteScheduleEvent(selectedCalendarDate, ev.id)}
                                                                title="Remove"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="dash-card">
                                    <div className="card-header compact">
                                        <div><h3>Upcoming Activities</h3></div>
                                        <button className="see-all-btn" onClick={() => setActiveTab('schedule')}>See all</button>
                                    </div>
                                    {upcomingActivities.length === 0 ? (
                                        <div className="overview-empty">Nothing scheduled right now.</div>
                                    ) : (
                                        <div className="activity-list">
                                            {upcomingActivities.map((a) => {
                                                const AIcon = a.icon;
                                                return (
                                                    <div key={a.id} className="activity-row">
                                                        <div className="activity-icon"><AIcon size={17} /></div>
                                                        <div className="activity-info">
                                                            <strong>{a.title}</strong>
                                                            <span>{a.meta}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="dash-card">
                                    <div className="card-header compact">
                                        <div><h3>Notifications</h3></div>
                                        <span className="see-all-btn" style={{ cursor: 'default' }}>
                                            <ChevronDown size={15} />
                                        </span>
                                    </div>
                                    <div className="rail-notify-list">
                                        <div className="rail-notify-item accent-rose">
                                            <div className="rail-notify-head">
                                                <strong>Leave Approval</strong>
                                                <MoreVertical size={14} />
                                            </div>
                                            <span>{pendingLeaveCount} pending leave request{pendingLeaveCount === 1 ? '' : 's'}</span>
                                        </div>
                                        <div className="rail-notify-item accent-blue">
                                            <div className="rail-notify-head">
                                                <strong>Homework</strong>
                                                <MoreVertical size={14} />
                                            </div>
                                            <span>{dueSoonAssignmentsCount} task{dueSoonAssignmentsCount === 1 ? '' : 's'} due soon</span>
                                        </div>
                                        <div className="rail-notify-item accent-amber">
                                            <div className="rail-notify-head">
                                                <strong>Class Assessment</strong>
                                                <MoreVertical size={14} />
                                            </div>
                                            <span>{ungradedSubmissionsCount} submission{ungradedSubmissionsCount === 1 ? '' : 's'} awaiting grading</span>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div className="dash-card full-width">
                            {!selectedClass && (
                                <>
                                    <div className="card-header">
                                        <div>
                                            <h3>Students Directory — Select Class</h3>
                                            <p className="subtitle">Choose a class to browse its sections and enrolled students.</p>
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
                                        <div className="empty-sub-card">No sections registered for {selectedClass}.</div>
                                    ) : (
                                        <div className="sections-grid">
                                            {sectionsList.filter(s => s.className === selectedClass).map(sec => {
                                                const studentCount = allStudents.filter(st =>
                                                    st.className === selectedClass && (st.sectionId === sec.id || st.sectionName === sec.name)
                                                ).length;

                                                return (
                                                    <div
                                                        key={sec.id}
                                                        className="section-card"
                                                        onClick={() => setSelectedSection(sec)}
                                                    >
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            <Folder size={22} color="var(--primary)" />
                                                            <div>
                                                                <h5 style={{ margin: 0 }}>{formatSectionTitle(sec.name)}</h5>
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

                            {selectedClass && selectedSection && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <button className="back-btn" onClick={() => setSelectedSection(null)}>
                                            <ArrowLeft size={16} /> Back to Sections
                                        </button>
                                        <h3 style={{ margin: 0 }}>
                                            {selectedClass} — {formatSectionTitle(selectedSection?.name)} Student Directory ({filteredStudents.length} Students)
                                        </h3>
                                    </div>

                                    {filteredStudents.length === 0 ? (
                                        <div className="empty-sub-card">No student records enrolled in this section.</div>
                                    ) : (
                                        <div className="student-cards-grid-layout">
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
                            <div className="card-header" style={{ flexDirection: 'column', gap: '0.75rem', alignItems: 'stretch' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <h3>Mark Attendance</h3>
                                        <p className="subtitle">
                                            {hasAttendanceSchedule && selectedAttendanceSlot
                                                ? `${selectedAttendanceSlot.subject || 'Scheduled Class'} • ${selectedAttendanceSlot.timetableClass || 'Class'} ${selectedAttendanceSlot.timetableSection ? `(${formatSectionTitle(selectedAttendanceSlot.timetableSection)})` : ''}`
                                                : `No class scheduled for you on ${attendanceWeekday || 'this date'}`}
                                        </p>
                                        <p className="subtitle" style={{ marginTop: '2px', fontSize: '0.72rem' }}>
                                            {hasAttendanceSchedule ? (
                                                <span style={{ color: 'var(--primary)' }}>
                                                    <CalendarClock size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                                                    Attendance is locked to your {attendanceWeekday} Weekly Timetable
                                                </span>
                                            ) : (
                                                <span style={{ color: '#b42318', fontWeight: 600 }}>
                                                    Attendance locked — no timetable class is assigned to you.
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <input
                                            type="date"
                                            className="custom-select"
                                            value={attendanceDate}
                                            onChange={(e) => setAttendanceDate(e.target.value)}
                                            title="Attendance Date"
                                        />

                                        {hasAttendanceSchedule ? (
                                            <>
                                                <select
                                                    className="custom-select"
                                                    value={attendanceSlotId}
                                                    onChange={(e) => {
                                                        const slot = scheduledPeriodsForAttendance.find(item => String(item.id) === e.target.value);
                                                        setAttendanceSlotId(e.target.value);
                                                        setAttendancePeriod(slot?.timetableTime || '');
                                                    }}
                                                    title={`Only periods assigned to you on ${attendanceWeekday}`}
                                                >
                                                    {scheduledPeriodsForAttendance.map(slot => (
                                                        <option key={slot.id} value={String(slot.id)}>
                                                            {slot.timetableTime} — {slot.subject} ({slot.timetableClass}{slot.timetableSection ? ` • ${formatSectionTitle(slot.timetableSection)}` : ''})
                                                        </option>
                                                    ))}
                                                </select>

                                                <div
                                                    className="custom-select"
                                                    style={{ display: 'flex', alignItems: 'center', opacity: 0.8, cursor: 'not-allowed' }}
                                                    title="Class is automatically taken from your timetable"
                                                >
                                                    {selectedAttendanceSlot?.timetableClass || 'Scheduled Class'}
                                                </div>

                                                <div
                                                    className="custom-select"
                                                    style={{ display: 'flex', alignItems: 'center', opacity: 0.8, cursor: 'not-allowed' }}
                                                    title="Section is automatically taken from your timetable"
                                                >
                                                    {selectedAttendanceSlot?.timetableSection
                                                        ? formatSectionTitle(selectedAttendanceSlot.timetableSection)
                                                        : 'Scheduled Section'}
                                                </div>
                                            </>
                                        ) : (
                                            <div
                                                className="custom-select"
                                                style={{ display: 'flex', alignItems: 'center', opacity: 0.65 }}
                                            >
                                                Attendance unavailable
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {attendanceSubmitted && (
                                <div style={{ color: 'var(--primary)', padding: '8px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Check size={18} /> Attendance submitted successfully for {attendanceDate} ({attendancePeriod})!
                                </div>
                            )}

                            {hasAttendanceSchedule && selectedAttendanceSlot ? (
                                <>
                                    <div className="table-responsive">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Admission No</th>
                                                    <th>Student Name</th>
                                                    <th>Section</th>
                                                    <th>Status</th>
                                                    <th style={{ textAlign: 'right' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredAttendanceStudents.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem' }}>
                                                            No student records found in this section.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredAttendanceStudents.map((student) => (
                                                        <tr key={student.id}>
                                                            <td>#{student.admissionNo || student.id.slice(0, 6)}</td>
                                                            <td>{student.name}</td>
                                                            <td><span className="task-target-tag">{formatSectionTitle(student.sectionName)}</span></td>
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
                                        <button
                                            className="btn-primary"
                                            onClick={handleSubmitAttendance}
                                            disabled={isSubmitting || filteredAttendanceStudents.length === 0 || !selectedAttendanceSlot}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>Attendance is locked</h4>
                                    <p style={{ margin: 0 }}>
                                        You do not have any class scheduled on {attendanceWeekday || 'the selected date'}.
                                        Attendance will become available only when an admin timetable is assigned to you.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Class Attendance Analytics & Defaulters Tracker</h3>
                                    <p className="subtitle">
                                        Analytics for {selectedClass} {selectedSection ? `(${formatSectionTitle(selectedSection.name)})` : '(All Sections)'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        className="custom-select"
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
                                    <select
                                        className="custom-select"
                                        value={selectedSection ? selectedSection.name : ''}
                                        onChange={(e) => {
                                            const sec = sectionsList.find(s => s.className === selectedClass && s.name === e.target.value);
                                            setSelectedSection(sec || (e.target.value ? { name: e.target.value } : null));
                                        }}
                                        disabled={!selectedClass}
                                    >
                                        <option value="">All Sections</option>
                                        {sectionsList.filter(s => s.className === selectedClass).map(s => (
                                            <option key={s.id} value={s.name}>{formatSectionTitle(s.name)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="analytics-summary-grid">
                                <div className="analytics-card">
                                    <span className="analytics-label">Active Roster</span>
                                    <h3>{activeStudents.length} Students</h3>
                                    <span className="analytics-sub">Enrolled in Selected Roster</span>
                                </div>
                                <div className="analytics-card present">
                                    <span className="analytics-label">Present Today</span>
                                    <h3>{presentStudentsCount}</h3>
                                    <span className="analytics-sub">{classAttendanceRate}% Attendance Rate</span>
                                </div>
                                <div className="analytics-card absent">
                                    <span className="analytics-label">Absent Today</span>
                                    <h3>{absentStudentsCount}</h3>
                                    <span className="analytics-sub">Requires Follow-up</span>
                                </div>
                                <div className="analytics-card alert">
                                    <span className="analytics-label">Below 75% Threshold</span>
                                    <h3>{attendanceDefaulters.length} Students</h3>
                                    <span className="analytics-sub">Defaulter Alert Status</span>
                                </div>
                            </div>

                            <h4 style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle size={16} color="var(--accent-rose)" /> Low-Attendance Defaulters List (&lt; 75%)
                            </h4>

                            {attendanceDefaulters.length === 0 ? (
                                <div className="empty-sub-card">
                                    <CheckCircle size={32} color="var(--accent-emerald)" />
                                    <h4>No Attendance Defaulters</h4>
                                    <p>All students maintain attendance records above 75%.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>Admission No</th>
                                                <th>Class & Section</th>
                                                <th>Attendance Rate</th>
                                                <th>Parent / Guardian</th>
                                                <th>Contact Phone</th>
                                                <th style={{ textAlign: 'right' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceDefaulters.map(st => (
                                                <tr key={st.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <img
                                                                src={st.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                                                                alt={st.name}
                                                                className="student-avatar"
                                                                style={{ width: 30, height: 30 }}
                                                            />
                                                            <strong>{st.name}</strong>
                                                        </div>
                                                    </td>
                                                    <td><code>#{st.admissionNo || 'N/A'}</code></td>
                                                    <td>{st.className} - {formatSectionTitle(st.sectionName)}</td>
                                                    <td>
                                                        <span className="defaulter-rate-badge">
                                                            {st.attendanceRate || (st.status === 'absent' ? '65%' : '72%')}
                                                        </span>
                                                    </td>
                                                    <td>{st.guardianName || 'Parent'}</td>
                                                    <td>{st.phone || 'N/A'}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <a href={`tel:${st.phone}`} className="call-parent-btn">
                                                            <PhoneCall size={12} /> Contact Parent
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'marks' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Enter Examination Marks (Draft Mode)</h3>
                                    <p className="subtitle">
                                        Managing scores for {selectedClass} {selectedSection ? `(${formatSectionTitle(selectedSection.name)})` : '(All Sections)'} — {selectedSubject} ({examType}). Saved entries are sent to Admin for final review and publishing.
                                    </p>
                                </div>
                            </div>

                            {marksActionStatus && (
                                <div style={{
                                    color: marksActionStatus === 'reset' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                                    padding: '8px 0',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <Check size={18} /> {
                                        marksActionStatus === 'saved' ? 'Marks saved as Draft in Firestore.' :
                                            marksActionStatus === 'reset' ? 'Class draft scores reset successfully.' :
                                                marksActionStatus
                                    }
                                </div>
                            )}

                            {myTaughtClasses.length === 0 ? (
                                <div className="empty-sub-card">
                                    <AlertCircle size={28} />
                                    <p>You have no class/subject assigned in the timetable yet. Please contact the admin to get a timetable assignment before entering marks.</p>
                                </div>
                            ) : (
                            <div className="form-grid marks-four-col-grid">
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>Select Class</label>
                                    <select
                                        className="custom-select full-width"
                                        value={selectedClass || ''}
                                        onChange={(e) => {
                                            const cls = e.target.value;
                                            setSelectedClass(cls);
                                            setSelectedSection(null);
                                            const nextSubjects = getMyTaughtSubjectsForClass(cls, null);
                                            if (!nextSubjects.includes(selectedSubject)) {
                                                setSelectedSubject(nextSubjects[0] || '');
                                            }
                                            setMarksActionStatus('');
                                        }}
                                    >
                                        {myTaughtClasses.map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>Select Section</label>
                                    <select
                                        className="custom-select full-width"
                                        value={selectedSection ? selectedSection.name : ''}
                                        onChange={(e) => {
                                            const secName = e.target.value;
                                            if (!secName) {
                                                setSelectedSection(null);
                                            } else {
                                                const match = sectionsList.find(s => s.className === selectedClass && s.name === secName);
                                                setSelectedSection(match || { name: secName });
                                            }
                                            const nextSubjects = getMyTaughtSubjectsForClass(selectedClass, secName || null);
                                            if (!nextSubjects.includes(selectedSubject)) {
                                                setSelectedSubject(nextSubjects[0] || '');
                                            }
                                            setMarksActionStatus('');
                                        }}
                                        disabled={!selectedClass}
                                    >
                                        <option value="">All My Sections</option>
                                        {sectionsList
                                            .filter(s => s.className === selectedClass && getMyTaughtSectionsForClass(selectedClass).some(name => cleanString(name) === cleanString(s.name)))
                                            .map(sec => (
                                                <option key={sec.id} value={sec.name}>{formatSectionTitle(sec.name)}</option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>Exam Type</label>
                                    <select
                                        className="custom-select full-width"
                                        value={examType}
                                        onChange={(e) => {
                                            setExamType(e.target.value);
                                            setMarksActionStatus('');
                                        }}
                                    >
                                        {examList.map(exam => (
                                            <option key={exam} value={exam}>{exam}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>Subject</label>
                                    <select
                                        className="custom-select full-width"
                                        value={selectedSubject}
                                        onChange={(e) => {
                                            setSelectedSubject(e.target.value);
                                            setMarksActionStatus('');
                                        }}
                                    >
                                        {getMyTaughtSubjectsForClass(selectedClass, selectedSection ? selectedSection.name : null).map(subj => (
                                            <option key={subj} value={subj}>{subj}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            )}

                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Admission No</th>
                                            <th>Student Name</th>
                                            <th>Section</th>
                                            <th>Subject</th>
                                            <th>Score (0-100)</th>
                                            <th style={{ textAlign: 'right' }}>Row Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myTaughtClasses.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>
                                                    No timetable assignment found for your account.
                                                </td>
                                            </tr>
                                        ) : marksFilteredStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>
                                                    No students available for this class / section / subject that you teach.
                                                </td>
                                            </tr>
                                        ) : (
                                            marksFilteredStudents.map((student) => {
                                                const compositeKey = getExamSubjectKey();
                                                const currentVal = studentMarks[student.id] ?? (student.marksDraft?.[compositeKey] ?? '');
                                                return (
                                                    <tr key={student.id}>
                                                        <td>#{student.admissionNo || student.id.slice(0, 6)}</td>
                                                        <td>{student.name}</td>
                                                        <td>
                                                            <span className="task-target-tag">{formatSectionTitle(student.sectionName)}</span>
                                                        </td>
                                                        <td>
                                                            <span className="topic-badge">{selectedSubject}</span>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                className="table-input"
                                                                placeholder="0-100"
                                                                value={currentVal}
                                                                onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'inline-flex', gap: '5px' }}>
                                                                <button
                                                                    className="btn-save-grade"
                                                                    title="Save Draft"
                                                                    onClick={() => handleSaveSingleMark(student.id)}
                                                                >
                                                                    <Save size={12} /> Save Draft
                                                                </button>
                                                                <button
                                                                    className="delete-task-btn"
                                                                    title="Clear / Reset Mark"
                                                                    onClick={() => handleResetSingleMark(student.id)}
                                                                >
                                                                    <RotateCcw size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="marks-action-footer" style={{ justifyContent: 'space-between' }}>
                                <button
                                    type="button"
                                    className="delete-task-btn"
                                    style={{ padding: '0.5rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                                    onClick={handleResetAllExamMarks}
                                    disabled={isSubmitting || marksFilteredStudents.length === 0}
                                >
                                    <RotateCcw size={14} /> Clear All Drafts
                                </button>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        className="btn-save-draft"
                                        onClick={handleSaveMarksDraft}
                                        disabled={isSubmitting || marksFilteredStudents.length === 0}
                                    >
                                        <Save size={15} /> Save All as Draft
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Assign Task / Project / Test</h3>
                                    <p className="subtitle">Publish coursework specifically targeted to a Class & Section</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateAssignment} className="assignment-form-grid">
                                <div>
                                    <label>Task Category</label>
                                    <select
                                        className="custom-select full-width"
                                        value={assignmentForm.type}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, type: e.target.value })}
                                        required
                                    >
                                        <option value="Assignment">Assignment / Homework</option>
                                        <option value="Project">Term Project / Lab Task</option>
                                        <option value="Class Test">Class Unit Test</option>
                                    </select>
                                </div>

                                <div>
                                    <label>Target Class</label>
                                    <select
                                        className="custom-select full-width"
                                        value={assignmentForm.className}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, className: e.target.value, sectionName: '' })}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classList.map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Target Section</label>
                                    <select
                                        className="custom-select full-width"
                                        value={assignmentForm.sectionName}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, sectionName: e.target.value })}
                                        disabled={!assignmentForm.className}
                                        required
                                    >
                                        <option value="">Select Section</option>
                                        {sectionsList
                                            .filter(s => s.className === assignmentForm.className)
                                            .map(sec => (
                                                <option key={sec.id} value={sec.name}>{formatSectionTitle(sec.name)}</option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Subject</label>
                                    <input
                                        type="text"
                                        className="table-input full-width-input"
                                        placeholder="e.g. Mathematics"
                                        value={assignmentForm.subject}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Task / Test Title</label>
                                    <input
                                        type="text"
                                        className="table-input full-width-input"
                                        placeholder="e.g. Chapter 4 Trigonometry Worksheet"
                                        value={assignmentForm.title}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Submission / Exam Date</label>
                                    <input
                                        type="date"
                                        className="table-input full-width-input"
                                        value={assignmentForm.dueDate}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label>Description & Instructions</label>
                                    <textarea
                                        rows="3"
                                        className="custom-textarea"
                                        placeholder="Add instructions, page numbers, or exam syllabus..."
                                        value={assignmentForm.description}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                                    />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary">
                                        <PlusCircle size={15} /> Assign to Class
                                    </button>
                                </div>
                            </form>

                            <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>
                                Active Assigned Coursework ({assignmentsList.length})
                            </h4>

                            {assignmentsList.length === 0 ? (
                                <div className="empty-sub-card">
                                    <Layers size={28} />
                                    <p>No active tasks assigned yet.</p>
                                </div>
                            ) : (
                                <div className="assignments-admin-grid">
                                    {assignmentsList.map(task => (
                                        <div key={task.id} className="task-admin-card">
                                            <div className="task-header-row">
                                                <span className={`task-badge badge-${task.type.toLowerCase().replace(/\s+/g, '')}`}>
                                                    {task.type}
                                                </span>
                                                <span className="task-target-tag">
                                                    {task.className} - {formatSectionTitle(task.sectionName)}
                                                </span>
                                            </div>
                                            <h5>{task.title}</h5>
                                            <p className="task-meta-line">
                                                <strong>Subject:</strong> {task.subject} | <strong>Due Date:</strong> {task.dueDate}
                                            </p>
                                            {task.description && <p className="task-desc-line">{task.description}</p>}
                                            <div className="task-footer-row">
                                                <span>Assigned by {task.staffName || 'Faculty'}</span>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button
                                                        onClick={() => setEditingAssignment({ ...task })}
                                                        className="edit-task-btn"
                                                        title="Edit Assignment"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAssignment(task.id)}
                                                        className="delete-task-btn"
                                                        title="Delete Task"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {editingAssignment && (
                                <div className="modal-overlay">
                                    <div className="modal-container">
                                        <div className="modal-header">
                                            <h4>Edit Task / Assignment</h4>
                                            <button className="icon-btn" onClick={() => setEditingAssignment(null)}><X size={18} /></button>
                                        </div>
                                        <form onSubmit={handleUpdateAssignment} className="modal-body-form">
                                            <div>
                                                <label>Task Title</label>
                                                <input
                                                    type="text"
                                                    className="table-input full-width-input"
                                                    value={editingAssignment.title || ''}
                                                    onChange={(e) => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-grid">
                                                <div>
                                                    <label>Category</label>
                                                    <select
                                                        className="custom-select full-width"
                                                        value={editingAssignment.type || 'Assignment'}
                                                        onChange={(e) => setEditingAssignment({ ...editingAssignment, type: e.target.value })}
                                                    >
                                                        <option value="Assignment">Assignment</option>
                                                        <option value="Project">Project</option>
                                                        <option value="Class Test">Class Test</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label>Due Date</label>
                                                    <input
                                                        type="date"
                                                        className="table-input full-width-input"
                                                        value={editingAssignment.dueDate || ''}
                                                        onChange={(e) => setEditingAssignment({ ...editingAssignment, dueDate: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label>Subject</label>
                                                <input
                                                    type="text"
                                                    className="table-input full-width-input"
                                                    value={editingAssignment.subject || ''}
                                                    onChange={(e) => setEditingAssignment({ ...editingAssignment, subject: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label>Description</label>
                                                <textarea
                                                    rows="3"
                                                    className="custom-textarea"
                                                    value={editingAssignment.description || ''}
                                                    onChange={(e) => setEditingAssignment({ ...editingAssignment, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="modal-actions">
                                                <button type="button" className="btn-save-draft" onClick={() => setEditingAssignment(null)}>Cancel</button>
                                                <button type="submit" className="btn-primary">Update Assignment</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'syllabus' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Upload Syllabus</h3>
                                    <p className="subtitle">Share the subject syllabus with students of the class & section you teach.</p>
                                </div>
                            </div>

                            {syllabusUploadStatus && (
                                <div style={{ color: 'var(--accent-emerald)', padding: '8px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Check size={18} /> {syllabusUploadStatus}
                                </div>
                            )}

                            <form onSubmit={handleUploadSyllabus} className="assignment-form-grid">
                                <div>
                                    <label>Class</label>
                                    <select
                                        className="custom-select full-width"
                                        value={syllabusForm.className}
                                        onChange={(e) => setSyllabusForm({ ...syllabusForm, className: e.target.value, sectionName: '' })}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classList.map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Section (optional)</label>
                                    <select
                                        className="custom-select full-width"
                                        value={syllabusForm.sectionName}
                                        onChange={(e) => setSyllabusForm({ ...syllabusForm, sectionName: e.target.value })}
                                        disabled={!syllabusForm.className}
                                    >
                                        <option value="">All Sections</option>
                                        {sectionsList
                                            .filter(s => s.className === syllabusForm.className)
                                            .map(sec => (
                                                <option key={sec.id} value={sec.name}>{formatSectionTitle(sec.name)}</option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Subject</label>
                                    <select
                                        className="custom-select full-width"
                                        value={syllabusForm.subject}
                                        onChange={(e) => setSyllabusForm({ ...syllabusForm, subject: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {subjectList.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Syllabus Title</label>
                                    <input
                                        type="text"
                                        className="table-input full-width-input"
                                        placeholder="e.g. Term 1 Syllabus / Unit 4 Topics"
                                        value={syllabusForm.title}
                                        onChange={(e) => setSyllabusForm({ ...syllabusForm, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label>Notes / Topics Covered</label>
                                    <textarea
                                        rows="3"
                                        className="custom-textarea"
                                        placeholder="Add unit breakdown, chapters, or exam weightage..."
                                        value={syllabusForm.description}
                                        onChange={(e) => setSyllabusForm({ ...syllabusForm, description: e.target.value })}
                                    />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label>Syllabus PDF</label>
                                    <div className="upload-action-box">
                                        <label className="pdf-file-label">
                                            <Upload size={14} />
                                            <span>{pendingSyllabusFile ? pendingSyllabusFile.fileName : 'Choose Syllabus PDF (Auto-compressed to 500KB)'}</span>
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={(e) => handleSyllabusFileSelect(e.target.files[0])}
                                                disabled={isSyllabusCompressing}
                                                style={{ display: 'none' }}
                                            />
                                        </label>

                                        {isSyllabusCompressing && (
                                            <div className="compressing-pill">
                                                <Loader2 size={12} className="spin-icon" /> Compressing PDF &lt; 500KB...
                                            </div>
                                        )}

                                        {pendingSyllabusFile && !isSyllabusCompressing && (
                                            <div className="pdf-ready-row">
                                                <span className="pdf-ready-tag">Ready: {pendingSyllabusFile.fileSize}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary" disabled={isSyllabusCompressing}>
                                        <PlusCircle size={15} /> Upload Syllabus
                                    </button>
                                </div>
                            </form>

                            <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>
                                Uploaded Syllabus Documents ({syllabusList.length})
                            </h4>

                            {syllabusList.length === 0 ? (
                                <div className="empty-sub-card">
                                    <BookMarked size={28} />
                                    <p>No syllabus documents uploaded yet.</p>
                                </div>
                            ) : (
                                <div className="syllabus-admin-grid">
                                    {syllabusList.map(item => (
                                        <div key={item.id} className="syllabus-admin-card">
                                            <div className="task-header-row">
                                                <span className="topic-badge">{item.subject}</span>
                                                <span className="task-target-tag">
                                                    {item.className}{item.sectionName ? ` - ${formatSectionTitle(item.sectionName)}` : ' - All Sections'}
                                                </span>
                                            </div>
                                            <h5>{item.title}</h5>
                                            {item.description && <p className="task-desc-line">{item.description}</p>}
                                            <div className="task-footer-row">
                                                <span>By {item.staffName || 'Faculty'}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {item.pdfData && (
                                                        <a
                                                            href={item.pdfData}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="view-pdf-link"
                                                        >
                                                            <ExternalLink size={13} /> View PDF
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteSyllabus(item.id)}
                                                        className="delete-task-btn"
                                                        title="Delete Syllabus"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'submissions' && (
                        <div className="dash-card full-width">
                            {!subClassFilter && (
                                <>
                                    <div className="card-header">
                                        <div>
                                            <h3>PDF Submissions Directory — Select Class</h3>
                                            <p className="subtitle">Evaluate uploaded student PDF assignments</p>
                                        </div>
                                    </div>
                                    <div className="class-cards-grid">
                                        {classList.map((cls) => {
                                            const subCount = submissionsList.filter(s => cleanString(s.className) === cleanString(cls)).length;
                                            const classSections = sectionsList.filter(s => s.className === cls);
                                            return (
                                                <div
                                                    key={cls}
                                                    className="class-card"
                                                    onClick={() => {
                                                        setSubClassFilter(cls);
                                                        setSubSectionFilter(null);
                                                        setSubmissionFilterStatus('all');
                                                    }}
                                                >
                                                    <div className="class-card-icon" style={{ background: '#ecfdf5', color: 'var(--accent-emerald)' }}>
                                                        <FileCheck size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: 0 }}>{cls}</h4>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {classSections.length} Sections • {subCount} Submissions
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {subClassFilter && !subSectionFilter && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <button
                                            className="back-btn"
                                            onClick={() => {
                                                setSubClassFilter(null);
                                                setSubSectionFilter(null);
                                                setSubmissionFilterStatus('all');
                                            }}
                                        >
                                            <ArrowLeft size={16} /> Back to All Classes
                                        </button>
                                        <h3 style={{ margin: 0 }}>{subClassFilter} Sections — Submissions</h3>
                                    </div>

                                    {sectionsList.filter(s => s.className === subClassFilter).length === 0 ? (
                                        <div className="empty-sub-card">No sections created for {subClassFilter}.</div>
                                    ) : (
                                        <div className="sections-grid">
                                            {sectionsList.filter(s => s.className === subClassFilter).map(sec => {
                                                const subCount = submissionsList.filter(
                                                    s => cleanString(s.className) === cleanString(subClassFilter) &&
                                                        cleanString(s.sectionName) === cleanString(sec.name)
                                                ).length;

                                                return (
                                                    <div
                                                        key={sec.id}
                                                        className="section-card"
                                                        onClick={() => {
                                                            setSubSectionFilter(sec.name);
                                                            setSubmissionFilterStatus('all');
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            <Folder size={22} color="var(--primary)" />
                                                            <div>
                                                                <h5 style={{ margin: 0 }}>{formatSectionTitle(sec.name)}</h5>
                                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                    {subCount} Submitted PDF Documents
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

                            {subClassFilter && subSectionFilter && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <button
                                            className="back-btn"
                                            onClick={() => {
                                                setSubSectionFilter(null);
                                                setSubmissionFilterStatus('all');
                                            }}
                                        >
                                            <ArrowLeft size={16} /> Back to Sections
                                        </button>
                                        <h3 style={{ margin: 0 }}>
                                            {subClassFilter} — {formatSectionTitle(subSectionFilter)} Submissions & Roster
                                        </h3>
                                    </div>

                                    <div className="sub-status-cards-grid">
                                        <div
                                            className={`sub-status-card total ${submissionFilterStatus === 'all' ? 'active' : ''}`}
                                            onClick={() => setSubmissionFilterStatus('all')}
                                        >
                                            <div className="sub-status-icon bg-indigo"><Layers size={20} /></div>
                                            <div className="sub-status-info">
                                                <span>Total Turned In</span>
                                                <h4>{sectionSubmissions.length}</h4>
                                            </div>
                                        </div>

                                        <div
                                            className={`sub-status-card pending ${submissionFilterStatus === 'pending' ? 'active' : ''}`}
                                            onClick={() => setSubmissionFilterStatus('pending')}
                                        >
                                            <div className="sub-status-icon bg-amber"><AlertCircle size={20} /></div>
                                            <div className="sub-status-info">
                                                <span>Pending Review</span>
                                                <h4>{pendingReviewCount}</h4>
                                            </div>
                                        </div>

                                        <div
                                            className={`sub-status-card completed ${submissionFilterStatus === 'completed' ? 'active' : ''}`}
                                            onClick={() => setSubmissionFilterStatus('completed')}
                                        >
                                            <div className="sub-status-icon bg-emerald"><CheckCircle size={20} /></div>
                                            <div className="sub-status-info">
                                                <span>Completed / Graded</span>
                                                <h4>{completedCount}</h4>
                                            </div>
                                        </div>

                                        <div
                                            className={`sub-status-card unsubmitted ${submissionFilterStatus === 'unsubmitted' ? 'active' : ''}`}
                                            onClick={() => setSubmissionFilterStatus('unsubmitted')}
                                        >
                                            <div className="sub-status-icon bg-rose"><UserX size={20} /></div>
                                            <div className="sub-status-info">
                                                <span>Pending Students</span>
                                                <h4>{unsubmittedStudentList.length}</h4>
                                            </div>
                                        </div>
                                    </div>

                                    {submissionFilterStatus === 'unsubmitted' ? (
                                        unsubmittedStudentList.length === 0 ? (
                                            <div className="empty-sub-card">
                                                <CheckCircle size={32} color="var(--accent-emerald)" />
                                                <h4>All Students Have Submitted!</h4>
                                                <p>Every student in this section has turned in their PDF coursework.</p>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="custom-table submissions-grading-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Student Name & Photo</th>
                                                            <th>Admission No</th>
                                                            <th>Pending Task / Topic</th>
                                                            <th>Due Date</th>
                                                            <th>Parent / Contact</th>
                                                            <th style={{ textAlign: 'right' }}>Submission Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {unsubmittedStudentList.map((item, idx) => (
                                                            <tr key={`${item.student.id}_${item.task.id}_${idx}`}>
                                                                <td>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <img
                                                                            src={item.student.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                                                                            alt={item.student.name}
                                                                            className="student-avatar"
                                                                            style={{ width: 30, height: 30 }}
                                                                        />
                                                                        <strong>{item.student.name}</strong>
                                                                    </div>
                                                                </td>
                                                                <td><code>#{item.student.admissionNo || 'N/A'}</code></td>
                                                                <td>
                                                                    <span className="topic-badge">{item.task.title} ({item.task.subject})</span>
                                                                </td>
                                                                <td style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
                                                                    {item.task.dueDate}
                                                                </td>
                                                                <td style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                                                    {item.student.guardianName || 'Parent'} ({item.student.phone || 'N/A'})
                                                                </td>
                                                                <td style={{ textAlign: 'right' }}>
                                                                    <span className="status-badge status-absent">
                                                                        <Clock size={11} /> NOT TURNED IN
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )
                                    ) : (
                                        displayedSubmissions.length === 0 ? (
                                            <div className="empty-sub-card">
                                                <FileText size={32} />
                                                <h4>No Submissions Found</h4>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="custom-table submissions-grading-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Student Name & ID</th>
                                                            <th>Assignment</th>
                                                            <th>PDF File</th>
                                                            <th>Date</th>
                                                            <th>Status</th>
                                                            <th>Score (0-100)</th>
                                                            <th style={{ textAlign: 'right' }}>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {displayedSubmissions.map((sub) => {
                                                            const currentGrade = submissionGrades[sub.id] ?? (sub.obtainedMarks ?? '');
                                                            const isGraded = sub.obtainedMarks !== undefined && sub.obtainedMarks !== null && sub.obtainedMarks !== '';

                                                            return (
                                                                <tr key={sub.id}>
                                                                    <td>
                                                                        <strong>{sub.studentName || 'Student'}</strong>
                                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                                            Adm No: <code>#{sub.admissionNo || 'N/A'}</code>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <span className="topic-badge">{sub.taskTitle || 'Assignment'}</span>
                                                                    </td>
                                                                    <td>
                                                                        <a
                                                                            href={sub.pdfData}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="pdf-preview-link"
                                                                        >
                                                                            <ExternalLink size={13} /> {sub.fileName || 'Document.pdf'}
                                                                        </a>
                                                                    </td>
                                                                    <td style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                                                        {sub.submittedAt?.toDate ? sub.submittedAt.toDate().toLocaleString() : 'Recent'}
                                                                    </td>
                                                                    <td>
                                                                        {isGraded ? (
                                                                            <span className="status-badge status-present">
                                                                                <Check size={11} /> GRADED ({sub.obtainedMarks})
                                                                            </span>
                                                                        ) : (
                                                                            <span className="status-badge status-absent">
                                                                                <Clock size={11} /> PENDING
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            placeholder="Score"
                                                                            className="table-input grade-input"
                                                                            value={currentGrade}
                                                                            onChange={(e) => setSubmissionGrades({
                                                                                ...submissionGrades,
                                                                                [sub.id]: e.target.value
                                                                            })}
                                                                        />
                                                                    </td>
                                                                    <td style={{ textAlign: 'right' }}>
                                                                        <button
                                                                            className="btn-save-grade"
                                                                            onClick={() => handleSaveSubmissionGrade(sub.id, sub.studentId, sub.taskTitle)}
                                                                            disabled={gradingLoadingId === sub.id}
                                                                        >
                                                                            {gradingLoadingId === sub.id ? 'Saving...' : <><Award size={13} /> Save Grade</>}
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Weekly Timetable</h3>
                                    <p className="subtitle">Overview of routine classes</p>
                                </div>
                            </div>
                            <div className="timetable-grid">
                                {mySchedule.map((item, idx) => (
                                    <div key={item.id || idx} className="timetable-card">
                                        <div className="time-pill" style={{ marginBottom: '8px', display: 'inline-block' }}>
                                            {item.day} — {item.timeSlot}
                                        </div>
                                        <h4 style={{ margin: '0 0 4px 0' }}>{item.subject}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Class: {item.className || 'General'} | Room: {item.roomNo || 'N/A'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'departments' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    {selectedDepartment ? (
                                        <>
                                            <button
                                                type="button"
                                                className="back-btn"
                                                onClick={() => setSelectedDepartment(null)}
                                                style={{ marginBottom: '10px' }}
                                            >
                                                <ArrowLeft size={14} /> All Departments
                                            </button>
                                            <h3>{selectedDepartment}</h3>
                                            <p className="subtitle">
                                                {activeDepartmentStaff.length} staff member{activeDepartmentStaff.length === 1 ? '' : 's'} in this department.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h3>Departments</h3>
                                            <p className="subtitle">Faculty grouped by subject department, synced live from Admin.</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {!selectedDepartment ? (
                                <div className="class-cards-grid">
                                    {departmentNames.map((dept) => (
                                        <div
                                            key={dept}
                                            className="class-card"
                                            role="button"
                                            tabIndex={0}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setSelectedDepartment(dept)}
                                        >
                                            <div className="class-card-icon">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0 }}>{dept}</h4>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {departmentGroups[dept]?.length || 0} Staff
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activeDepartmentStaff.length === 0 ? (
                                <div className="empty-sub-card">
                                    <Building2 size={28} />
                                    <p>No staff assigned to this department yet.</p>
                                </div>
                            ) : (
                                <div className="dept-staff-list">
                                    {activeDepartmentStaff.map((member) => {
                                        const isMe = member.staffId === staffData.staffId;
                                        return (
                                            <div key={member.id} className="dept-staff-row">
                                                <div className="dept-staff-identity">
                                                    <div className="student-avatar">
                                                        {(member.name || '?').trim().charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <strong>{member.name}{isMe ? ' (You)' : ''}</strong>
                                                        <span className="dept-staff-subtext">
                                                            {member.staffId ? `ID: ${member.staffId}` : ''}{member.email ? ` • ${member.email}` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                                {!isMe && (
                                                    <div className="dept-staff-actions">
                                                        <button type="button" className="action-btn" onClick={() => openChatWithStaff(member)}>
                                                            <MessageCircle size={14} /> Chat
                                                        </button>
                                                        <button type="button" className="btn-primary" onClick={() => openRequestModal(member)}>
                                                            <Send size={14} /> Request
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chats' && (
                        <div className="dash-card full-width chats-workspace">
                            <div className="card-header">
                                <div>
                                    <h3>Chats</h3>
                                    <p className="subtitle">Direct messages with your colleagues.</p>
                                </div>
                                <button type="button" className="btn-primary" onClick={() => setShowNewChatPicker(true)}>
                                    <PlusCircle size={15} /> New Chat
                                </button>
                            </div>

                            <div className="chats-layout">
                                <div className="chats-list-pane">
                                    {myChats.length === 0 ? (
                                        <div className="empty-sub-card">
                                            <MessageCircle size={26} />
                                            <p>No conversations yet. Start one from Departments or "New Chat".</p>
                                        </div>
                                    ) : (
                                        myChats.map((chat) => {
                                            const otherId = (chat.participants || []).find(id => id !== staffData.staffId);
                                            const otherName = chat.participantNames?.[otherId] || 'Staff Member';
                                            const otherDept = chat.participantDepartments?.[otherId] || 'General';
                                            return (
                                                <button
                                                    key={chat.id}
                                                    type="button"
                                                    className={`chat-list-item ${activeChatId === chat.id ? 'active' : ''}`}
                                                    onClick={() => handleSelectChat(chat)}
                                                >
                                                    <div className="student-avatar">{otherName.charAt(0).toUpperCase()}</div>
                                                    <div className="chat-list-item-info">
                                                        <strong>{otherName}</strong>
                                                        <span>{chat.lastMessage || `${otherDept} Department`}</span>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="chat-thread-pane">
                                    {!activeChatId ? (
                                        <div className="empty-sub-card chat-thread-empty">
                                            <MessageCircle size={28} />
                                            <p>Select a conversation, or start a new chat.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="chat-thread-header">
                                                <div className="student-avatar">
                                                    {(activeChatInfo?.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <strong>{activeChatInfo?.name}</strong>
                                                    <span className="dept-staff-subtext">{activeChatInfo?.department}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="communication-delete-btn"
                                                    onClick={deleteConversationForMe}
                                                    title="Delete chat"
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Delete Chat</span>
                                                </button>
                                            </div>

                                            <div className="chat-thread-messages">
                                                {activeChatMessages.length === 0 ? (
                                                    <div className="empty-sub-card">
                                                        <MessageCircle size={22} />
                                                        <p>No messages yet. Say hello!</p>
                                                    </div>
                                                ) : (
                                                    activeChatMessages.map((msg) => (
                                                        <div
                                                            key={msg.id}
                                                            className={`chat-bubble-row ${msg.senderId === staffData.staffId ? 'mine' : ''}`}
                                                        >
                                                            <div className={`chat-bubble ${msg.type === 'request' ? 'is-request' : ''}`}>
                                                                {msg.type === 'request' && <span className="request-tag">Request</span>}
                                                                <p>{msg.text}</p>
                                                                {msg.senderId === staffData.staffId && (
                                                                    <button
                                                                        type="button"
                                                                        className="message-delete-btn"
                                                                        onClick={() => deleteChatMessage(msg.id)}
                                                                        title="Delete message"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <div className="chat-thread-input-row">
                                                <input
                                                    type="text"
                                                    placeholder="Type a message..."
                                                    value={chatMessageInput}
                                                    onChange={(e) => setChatMessageInput(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-primary"
                                                    onClick={sendChatMessage}
                                                    disabled={!chatMessageInput.trim()}
                                                >
                                                    <Send size={15} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'staffroom' && (
                        <div className="dash-card full-width staffroom-workspace">
                            <div className="card-header">
                                <div>
                                    <h3>Staff Room</h3>
                                    <p className="subtitle">A shared space for all faculty to chat together.</p>
                                </div>
                                <button
                                    type="button"
                                    className="communication-delete-btn staffroom-clear-btn"
                                    onClick={clearMyStaffRoomMessages}
                                    title="Delete my Staff Room messages"
                                >
                                    <Trash2 size={16} />
                                    <span>Clear My Messages</span>
                                </button>
                            </div>

                            <div className="staffroom-feed">
                                {staffRoomMessages.length === 0 ? (
                                    <div className="empty-sub-card">
                                        <Users size={28} />
                                        <p>No messages yet. Be the first to say hello!</p>
                                    </div>
                                ) : (
                                    staffRoomMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`staffroom-message-row ${msg.senderId === staffData.staffId ? 'mine' : ''}`}
                                        >
                                            <div className="student-avatar">{(msg.senderName || '?').charAt(0).toUpperCase()}</div>
                                            <div className="staffroom-message-body">
                                                <div className="staffroom-message-meta">
                                                    <strong>{msg.senderName}</strong>
                                                    <span className="topic-badge">{msg.department || 'General'}</span>
                                                </div>
                                                <p>{msg.text}</p>
                                                {msg.senderId === staffData.staffId && (
                                                    <button
                                                        type="button"
                                                        className="staffroom-message-delete-btn"
                                                        onClick={() => deleteStaffRoomMessage(msg.id)}
                                                        title="Delete message"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="chat-thread-input-row">
                                <input
                                    type="text"
                                    placeholder="Message the staff room..."
                                    value={staffRoomInput}
                                    onChange={(e) => setStaffRoomInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') sendStaffRoomMessage(); }}
                                />
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={sendStaffRoomMessage}
                                    disabled={!staffRoomInput.trim()}
                                >
                                    <Send size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'library' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Library</h3>
                                    <p className="subtitle">Manage the book catalog and track issue / return of books to students.</p>
                                </div>
                            </div>

                            <div className="library-subtabs">
                                <button
                                    className={`library-subtab-btn ${librarySubTab === 'catalog' ? 'active' : ''}`}
                                    onClick={() => setLibrarySubTab('catalog')}
                                >
                                    <BookOpen size={14} /> Catalog ({libraryBooks.length})
                                </button>
                                <button
                                    className={`library-subtab-btn ${librarySubTab === 'issue' ? 'active' : ''}`}
                                    onClick={() => setLibrarySubTab('issue')}
                                >
                                    <Send size={14} /> Issue Book
                                </button>
                                <button
                                    className={`library-subtab-btn ${librarySubTab === 'issued' ? 'active' : ''}`}
                                    onClick={() => setLibrarySubTab('issued')}
                                >
                                    <ClipboardList size={14} /> Issued ({currentlyIssuedBooks.length})
                                </button>
                            </div>

                            {libraryStatus && (
                                <div style={{ color: 'var(--accent-emerald)', padding: '8px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Check size={18} /> {libraryStatus}
                                </div>
                            )}

                            {librarySubTab === 'catalog' && (
                                <>
                                    <form onSubmit={handleAddBook} className="assignment-form-grid" style={{ marginTop: '10px' }}>
                                        <div>
                                            <label>Book Title</label>
                                            <input
                                                type="text"
                                                className="table-input full-width-input"
                                                placeholder="e.g. A Brief History of Time"
                                                value={bookForm.title}
                                                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label>Author</label>
                                            <input
                                                type="text"
                                                className="table-input full-width-input"
                                                placeholder="e.g. Stephen Hawking"
                                                value={bookForm.author}
                                                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label>Category</label>
                                            <select
                                                className="custom-select full-width"
                                                value={bookForm.category}
                                                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                                            >
                                                <option value="">Select Category</option>
                                                <option value="Fiction">Fiction</option>
                                                <option value="Non-Fiction">Non-Fiction</option>
                                                <option value="Science">Science</option>
                                                <option value="Mathematics">Mathematics</option>
                                                <option value="History">History</option>
                                                <option value="Biography">Biography</option>
                                                <option value="Reference">Reference</option>
                                                <option value="Competitive Exams">Competitive Exams</option>
                                                <option value="General">General</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label>ISBN / Code (optional)</label>
                                            <input
                                                type="text"
                                                className="table-input full-width-input"
                                                placeholder="e.g. 978-0553380163"
                                                value={bookForm.isbn}
                                                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label>Total Copies</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="table-input full-width-input"
                                                value={bookForm.totalCopies}
                                                onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button type="submit" className="btn-primary">
                                                <PlusCircle size={15} /> Add Book
                                            </button>
                                        </div>
                                    </form>

                                    <div className="search-bar" style={{ margin: '18px 0 12px', maxWidth: '340px' }}>
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search by title, author, category..."
                                            value={librarySearch}
                                            onChange={(e) => setLibrarySearch(e.target.value)}
                                        />
                                    </div>

                                    {filteredLibraryBooks.length === 0 ? (
                                        <div className="empty-sub-card">
                                            <Library size={28} />
                                            <p>No books in the catalog yet. Add your first book above.</p>
                                        </div>
                                    ) : (
                                        <div className="library-book-grid">
                                            {filteredLibraryBooks.map(book => (
                                                <div key={book.id} className="library-book-card">
                                                    <div className="task-header-row">
                                                        <span className="topic-badge">{book.category || 'General'}</span>
                                                        <span className={`library-copies-tag ${(book.availableCopies || 0) === 0 ? 'out' : ''}`}>
                                                            {book.availableCopies ?? 0} / {book.totalCopies ?? 0} available
                                                        </span>
                                                    </div>
                                                    <h5>{book.title}</h5>
                                                    <p className="task-desc-line">by {book.author}</p>
                                                    {book.isbn && <p className="library-isbn">ISBN: {book.isbn}</p>}
                                                    <div className="task-footer-row">
                                                        <span>Added by {book.addedBy || 'Staff'}</span>
                                                        <button
                                                            onClick={() => handleDeleteBook(book.id)}
                                                            className="delete-task-btn"
                                                            title="Remove Book"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {librarySubTab === 'issue' && (
                                <form onSubmit={handleIssueBook} className="assignment-form-grid" style={{ marginTop: '10px' }}>
                                    <div>
                                        <label>Book</label>
                                        <select
                                            className="custom-select full-width"
                                            value={issueForm.bookId}
                                            onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Book</option>
                                            {libraryBooks.map(book => (
                                                <option key={book.id} value={book.id} disabled={(book.availableCopies || 0) <= 0}>
                                                    {book.title} ({book.availableCopies ?? 0} available)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label>Class</label>
                                        <select
                                            className="custom-select full-width"
                                            value={issueForm.className}
                                            onChange={(e) => setIssueForm({ ...issueForm, className: e.target.value, sectionName: '', studentId: '' })}
                                        >
                                            <option value="">All Classes</option>
                                            {classList.map(cls => (
                                                <option key={cls} value={cls}>{cls}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label>Section</label>
                                        <select
                                            className="custom-select full-width"
                                            value={issueForm.sectionName}
                                            onChange={(e) => setIssueForm({ ...issueForm, sectionName: e.target.value, studentId: '' })}
                                            disabled={!issueForm.className}
                                        >
                                            <option value="">All Sections</option>
                                            {sectionsList
                                                .filter(s => s.className === issueForm.className)
                                                .map(sec => (
                                                    <option key={sec.id} value={sec.name}>{formatSectionTitle(sec.name)}</option>
                                                ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label>Student</label>
                                        <select
                                            className="custom-select full-width"
                                            value={issueForm.studentId}
                                            onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Student</option>
                                            {studentsForIssue.map(st => (
                                                <option key={st.id} value={st.id}>
                                                    {st.name} {st.rollNo ? `(Roll ${st.rollNo})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label>Due Date</label>
                                        <input
                                            type="date"
                                            className="table-input full-width-input"
                                            value={issueForm.dueDate}
                                            min={todayISO}
                                            onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <button type="submit" className="btn-primary">
                                            <Send size={15} /> Issue Book
                                        </button>
                                    </div>
                                </form>
                            )}

                            {librarySubTab === 'issued' && (
                                currentlyIssuedBooks.length === 0 ? (
                                    <div className="empty-sub-card">
                                        <ClipboardList size={28} />
                                        <p>No books are currently issued.</p>
                                    </div>
                                ) : (
                                    <div className="library-book-grid">
                                        {currentlyIssuedBooks.map(issue => (
                                            <div key={issue.id} className="library-book-card">
                                                <div className="task-header-row">
                                                    <span className="topic-badge">{issue.studentClass}{issue.studentSection ? ` - ${formatSectionTitle(issue.studentSection)}` : ''}</span>
                                                    {isOverdue(issue.dueDate) && (
                                                        <span className="library-copies-tag out">Overdue</span>
                                                    )}
                                                </div>
                                                <h5>{issue.bookTitle}</h5>
                                                <p className="task-desc-line">Issued to {issue.studentName}{issue.studentRoll ? ` (Roll ${issue.studentRoll})` : ''}</p>
                                                <p className="library-isbn">Issued: {issue.issueDate} • Due: {issue.dueDate}</p>
                                                <div className="task-footer-row">
                                                    <span>By {issue.issuedBy || 'Staff'}</span>
                                                    <button
                                                        onClick={() => handleReturnBook(issue)}
                                                        className="btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                                    >
                                                        <Check size={13} /> Mark Returned
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {activeTab === 'events' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Events</h3>
                                    <p className="subtitle">This workspace is coming soon.</p>
                                </div>
                            </div>
                            <div className="empty-sub-card">
                                <PartyPopper size={28} />
                                <p>Nothing here yet — check back soon.</p>
                            </div>
                        </div>
                    )}

                    {showNewChatPicker && (
                        <div className="modal-overlay" onClick={() => setShowNewChatPicker(false)}>
                            <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                                <h3 style={{ marginTop: 0 }}>Start a New Chat</h3>
                                <div className="search-bar" style={{ width: '100%', marginBottom: '14px' }}>
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search staff by name or department..."
                                        value={chatDirectorySearch}
                                        onChange={(e) => setChatDirectorySearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="chat-directory-list">
                                    {chatDirectoryResults.length === 0 ? (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '14px 0' }}>
                                            No staff found.
                                        </p>
                                    ) : (
                                        chatDirectoryResults.map((member) => (
                                            <button
                                                key={member.id}
                                                type="button"
                                                className="chat-directory-item"
                                                onClick={() => openChatWithStaff(member)}
                                            >
                                                <div className="student-avatar">{(member.name || '?').charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <strong>{member.name}</strong>
                                                    <span>{member.department || 'General'}</span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowNewChatPicker(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showRequestModal && requestTargetStaff && (
                        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
                            <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
                                <h3 style={{ marginTop: 0 }}>Send a Request to {requestTargetStaff.name}</h3>
                                <form onSubmit={handleSubmitRequest}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label>Subject</label>
                                        <input
                                            type="text"
                                            className="table-input full-width"
                                            placeholder="e.g. Substitute Class Request"
                                            value={requestForm.subject}
                                            onChange={(e) => setRequestForm({ ...requestForm, subject: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label>Message</label>
                                        <textarea
                                            rows="4"
                                            className="custom-textarea"
                                            placeholder="Describe your request..."
                                            value={requestForm.message}
                                            onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn-secondary" onClick={() => setShowRequestModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-primary" disabled={isRequestSubmitting}>
                                            <Send size={14} /> {isRequestSubmitting ? 'Sending...' : 'Send Request'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'exam-halls' && (
                        <div className="dash-card full-width exam-hall-staff-card">
                            <div className="card-header">
                                <div>
                                    <h3>Exam Hall Allocation — My Invigilation Duty</h3>
                                    <p className="subtitle">Live duty assignments published by the Office Dashboard.</p>
                                </div>
                                <span className="exam-sync-pill"><CheckCircle size={13} /> Live Synced</span>
                            </div>

                            {myExamHallDuties.length === 0 ? (
                                <div className="empty-sub-card">
                                    <Calendar size={30} />
                                    <h4>No Exam Hall Duty Assigned</h4>
                                    <p>Your office has not assigned an invigilation duty yet.</p>
                                </div>
                            ) : (
                                <div className="exam-hall-grid">
                                    {myExamHallDuties.map(item => (
                                        <div className="exam-hall-card" key={item.id}>
                                            <div className="exam-hall-card-top">
                                                <span className="exam-hall-room">{item.hallNo || 'Hall —'}</span>
                                                <span className="exam-hall-class">Invigilator</span>
                                            </div>
                                            <h4>{item.examName || 'Examination'}</h4>
                                            <div className="exam-hall-meta">
                                                <span><User size={14} /> {item.staffName || staffData.name}</span>
                                                <span><Clock size={14} /> {item.dutyTime || 'Time not specified'}</span>
                                                <span><Users size={14} /> {item.studentCount || item.studentIds?.length || 0} Students</span>
                                            </div>
                                            <button type="button" className="btn-primary" style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => openHallTicketScanner(item)}>
                                                 <Search size={16} /> Scan Hall Ticket QR
                                             </button>
                                             {Array.isArray(item.studentList) && item.studentList.length > 0 && (
                                                <div className="exam-hall-student-list">
                                                    {item.studentList.map((student, idx) => (
                                                        <div key={student.id || idx} className="exam-hall-student-item">
                                                            <span>{idx + 1}. {student.name || 'Student'}</span>
                                                            <small>#{student.admissionNo || 'N/A'} · {student.verificationStatus === 'Verified' ? 'Present · Verified' : 'Not Verified'}</small>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {showHallTicketScanner && (
                        <div className="modal-overlay" onClick={closeHallTicketScanner}>
                            <div className="modal-content" style={{ maxWidth: '560px', width: '95%', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>Scan Student Hall Ticket</h3>
                                        <p style={{ margin: '5px 0 0', color: 'var(--text-muted)' }}>
                                            {activeExamDuty?.examName || 'Examination'} · {activeExamDuty?.hallNo || 'Hall'}
                                            {scanTotalAllocated > 0 && <> · {scanVerifiedCount}/{scanTotalAllocated} Verified</>}
                                        </p>
                                    </div>
                                    <button type="button" className="btn-secondary" onClick={closeHallTicketScanner}><X size={16} /> Close</button>
                                </div>

                                {!allStudentsScanned ? (
                                    <div style={{ position: 'relative' }}>
                                        <div id="hall-ticket-qr-reader" style={{ width: '100%', minHeight: '280px', borderRadius: '12px', overflow: 'hidden', background: '#0f172a' }} />
                                        {scannerResult && (
                                            <div
                                                style={{
                                                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(15, 23, 42, 0.82)', borderRadius: '12px', padding: '10px'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: '22px 30px', borderRadius: '14px', textAlign: 'center', minWidth: '220px',
                                                        background: scannerResult.ok ? '#dcfce7' : '#fee2e2',
                                                        color: scannerResult.ok ? '#166534' : '#991b1b',
                                                        boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
                                                    }}
                                                >
                                                    {scannerResult.ok ? <CheckCircle size={40} /> : <X size={40} />}
                                                    <div style={{ marginTop: '6px', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.03em' }}>
                                                        {scannerResult.ok ? 'VERIFIED' : 'NOT VERIFIED'}
                                                    </div>
                                                    <div style={{ marginTop: '4px', fontSize: '0.82rem', fontWeight: 500 }}>{scannerResult.message}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            minHeight: '280px', borderRadius: '12px', display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center',
                                            background: '#dcfce7', color: '#166534', padding: '24px'
                                        }}
                                    >
                                        <CheckCircle size={46} />
                                        <h4 style={{ margin: '6px 0 0' }}>All Students Verified</h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '360px' }}>
                                            Every student allocated to this hall ({scanVerifiedCount}/{scanTotalAllocated}) has been scanned and marked Present.
                                        </p>
                                        <button type="button" className="btn-primary" style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={closeHallTicketScanner}>
                                            <X size={16} /> Close Scanner
                                        </button>
                                    </div>
                                )}

                                <p style={{ textAlign: 'center', margin: '12px 0', fontSize: '0.85rem' }}>{scannerStatus}</p>
                                <div style={{ marginTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Only students included in this invigilation duty allocation can be verified. A successful scan marks the student <strong>Present</strong> and <strong>Verified</strong>, then the scanner automatically gets ready for the next student.</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schoolnews' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>School News</h3>
                                    <p className="subtitle">All notices and announcements.</p>
                                </div>
                            </div>
                            <div className="announcement-list">
                                {announcements.map((item) => (
                                    <div key={item.id} className={`announcement-item type-${item.type}`}>
                                        <div className="announcement-dot" />
                                        <div>
                                            <h4>{item.title}</h4>
                                            <span>{item.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'downloads' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Downloads</h3>
                                    <p className="subtitle">Files submitted by students, ready to download.</p>
                                </div>
                            </div>
                            {submissionsList.length === 0 ? (
                                <div className="empty-sub-card">
                                    <Download size={28} />
                                    <p>No files available yet.</p>
                                </div>
                            ) : (
                                <div className="documents-list">
                                    {submissionsList.slice(0, 12).map((doc) => (
                                        <div key={doc.id} className="document-row">
                                            <div className="document-icon"><FileText size={16} /></div>
                                            <div className="document-info">
                                                <strong>{doc.fileName || doc.taskTitle || 'Document.pdf'}</strong>
                                                <span>{doc.submittedAt?.toDate ? doc.submittedAt.toDate().toLocaleDateString() : 'Recent'}</span>
                                            </div>
                                            {doc.fileUrl && (
                                                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="document-download">
                                                    <Download size={15} />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'leaves' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Staff Leave Applications</h3>
                                    <p className="subtitle">Apply for leave and track the approval status from the administration.</p>
                                </div>
                            </div>

                            {leaveActionStatus && (
                                <div style={{ color: 'var(--accent-emerald)', padding: '8px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Check size={18} /> {leaveActionStatus}
                                </div>
                            )}

                            <form onSubmit={handleSubmitleaveRequest} className="assignment-form-grid" style={{ marginBottom: '30px' }}>
                                <div>
                                    <label>Leave Type</label>
                                    <select
                                        className="custom-select full-width"
                                        value={leaveForm.leaveType}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                                        required
                                    >
                                        <option value="Casual Leave">Casual Leave (CL)</option>
                                        <option value="Medical Leave">Medical Leave (ML)</option>
                                        <option value="Earned Leave">Earned Leave (EL)</option>
                                        <option value="On Duty">On Duty (OD)</option>
                                    </select>
                                </div>

                                <div>
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        className="table-input full-width-input"
                                        value={leaveForm.startDate}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        className="table-input full-width-input"
                                        value={leaveForm.endDate}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label>Reason for Leave</label>
                                    <textarea
                                        rows="3"
                                        className="custom-textarea"
                                        placeholder="Provide detailed reason for absence..."
                                        value={leaveForm.reason}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary" disabled={isLeaveSubmitting}>
                                        <SendHorizonal size={15} /> {isLeaveSubmitting ? 'Submitting Application...' : 'Submit Leave Request'}
                                    </button>
                                </div>
                            </form>

                            <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>
                                My Leave Application History ({myLeaveRequests.length})
                            </h4>

                            {myLeaveRequests.length === 0 ? (
                                <div className="empty-sub-card">
                                    <Calendar size={28} />
                                    <p>No past or active leave requests found.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>Leave Type</th>
                                                <th>From</th>
                                                <th>To</th>
                                                <th>Reason</th>
                                                <th style={{ textAlign: 'right' }}>Admin Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myLeaveRequests.map((leave) => (
                                                <tr key={leave.id}>
                                                    <td>
                                                        <span className="topic-badge">{leave.leaveType}</span>
                                                    </td>
                                                    <td>{leave.startDate}</td>
                                                    <td>{leave.endDate}</td>
                                                    <td>{leave.reason}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <span className={`status-badge status-${leave.status === 'Approved' ? 'present' : leave.status === 'Rejected' ? 'absent' : 'pending'}`}>
                                                            {(leave.status || 'Pending').toUpperCase()}
                                                        </span>
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
            </main>
        </div>
    );
}