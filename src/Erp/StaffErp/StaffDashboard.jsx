import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { Html5Qrcode } from 'html5-qrcode';
import logo from "../../assets/logo.png"
import idBuilding from "../../assets/id1.png"
import principalSignature from "../../assets/signature.png"
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
    PersonStanding, Printer, RotateCw,
    Plus, Mail, Share2, Sun
} from 'lucide-react';
import './StaffDashboard.css';

const HALL_TICKET_SCHOOL_NAME = "HOLY CROSS MATRIC. HR. SEC. SCHOOL";
const HALL_TICKET_SCHOOL_TAGLINE = "Somarasampettai, Tiruchirapalli - 102 (Affiliated to the State Board of School Examinations)";

const SIDEBAR_TAB_GROUP = {
    profile: 'workspace', schedule: 'workspace', departments: 'workspace', assignments: 'workspace',
    syllabus: 'workspace', marks: 'workspace', attendance: 'workspace', submissions: 'workspace',
    students: 'workspace', analytics: 'workspace',
    'exam-halls': 'exams', 'entrance-exams': 'exams',
    chats: 'comms', staffroom: 'comms', schoolnews: 'comms',
    mytasks: 'alerts', leaves: 'alerts',
    downloads: 'others', library: 'others', events: 'others'
};

export default function StaffDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [academicMenuOpen, setAcademicMenuOpen] = useState(false);
    const [examHallMenuOpen, setExamHallMenuOpen] = useState(false);
    const [openGroup, setOpenGroup] = useState(null);   // sidebar section accordion: only one open at a time

    // when the page changes (sidebar, bell, profile menu...), open the section that holds it
    useEffect(() => {
        const g = SIDEBAR_TAB_GROUP[activeTab];
        if (g) setOpenGroup(g);
        if (['students', 'analytics'].includes(activeTab)) setAcademicMenuOpen(true);
        if (activeTab === 'exam-halls' || activeTab === 'entrance-exams') setExamHallMenuOpen(true);
    }, [activeTab]);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('holy-cross-theme') === 'dark');
    const [showAiHint, setShowAiHint] = useState(false);
    const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toDateString());
    const [dayEvents, setDayEvents] = useState({});
    const [showAddEventForm, setShowAddEventForm] = useState(false);
    const [newEventForm, setNewEventForm] = useState({ title: '', time: '' });

    const [staffData, setStaffData] = useState({ staffId: '', name: 'Dr. R. Sharma', department: 'Senior Math Faculty' });

    // Entrance exam applicants assigned to this staff member (Office -> Admissions -> Send to exam)
    const [entranceApps, setEntranceApps] = useState([]);
    const [selectedEntranceId, setSelectedEntranceId] = useState(null);
    const [entranceDraft, setEntranceDraft] = useState({});   // { [applicationId]: [{ subject, marks, maxMarks }] }
    const [entranceInput, setEntranceInput] = useState({ subject: '', marks: '', maxMarks: '100' });
    const [entranceStatus, setEntranceStatus] = useState('');
    const [entranceSaving, setEntranceSaving] = useState(false);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [profileSaveStatus, setProfileSaveStatus] = useState('');
    const [profileForm, setProfileForm] = useState({ email: '', phone: '', qualification: '', bio: '' });
    const [profileSection, setProfileSection] = useState('all');
    const [idCardFlipped, setIdCardFlipped] = useState(false);

    const [staffLeaveList, setStaffLeaveList] = useState([]);
    const [officeTaskList, setOfficeTaskList] = useState([]);
    const [taskFilter, setTaskFilter] = useState('pending');
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
    const [chatListSearch, setChatListSearch] = useState('');

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
    const [attendanceSession, setAttendanceSession] = useState('Forenoon');
    const [attendanceFilter, setAttendanceFilter] = useState('all');
    const [attendanceSectionId, setAttendanceSectionId] = useState('');

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
    const [showAttendanceConfirm, setShowAttendanceConfirm] = useState(false);

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
        const theme = isDarkMode ? 'dark' : 'light';
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        localStorage.setItem('holy-cross-theme', theme);
    }, [isDarkMode]);


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

    // Only the applications assigned to this staff member are read
    useEffect(() => {
        if (!staffData.staffId) return undefined;
        const unsub = onSnapshot(
            query(collection(db, 'admissions'), where('examAssignment.staffId', '==', staffData.staffId)),
            (snap) => {
                setEntranceApps(
                    snap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter(a => a.status === 'Entrance Exam' || a.marksSubmitted)
                        .sort((x, y) => String(x.examAssignment?.date || '').localeCompare(String(y.examAssignment?.date || '')))
                );
            },
            (err) => console.error('Entrance exam assignments failed to load:', err)
        );
        return () => unsub();
    }, [staffData.staffId]);

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

        const unsubOfficeTasks = onSnapshot(collection(db, 'office_tasks'), (snap) => {
            setOfficeTaskList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
            unsubOfficeTasks();
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

    // ---- entrance exam marks entry ----
    const entranceName = (a) => [a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ').trim() || a.fullName || a.name || 'Applicant';
    const selectedEntranceApp = entranceApps.find(a => a.id === selectedEntranceId) || null;
    const entranceRows = selectedEntranceApp
        ? (selectedEntranceApp.marksSubmitted ? (selectedEntranceApp.examMarks?.subjects || []) : (entranceDraft[selectedEntranceApp.id] || []))
        : [];
    const entranceTotal = entranceRows.reduce((sum, r) => sum + Number(r.marks || 0), 0);
    const entranceMax = entranceRows.reduce((sum, r) => sum + Number(r.maxMarks || 0), 0);
    const entrancePending = entranceApps.filter(a => !a.marksSubmitted).length;

    const openEntranceApp = (a) => {
        setSelectedEntranceId(a.id);
        setEntranceStatus('');
        setEntranceInput({ subject: '', marks: '', maxMarks: '100' });
        // If the office re-opened the marks, start from what was submitted before
        setEntranceDraft(d => (d[a.id] ? d : { ...d, [a.id]: a.examMarks?.subjects || [] }));
    };

    const addEntranceSubject = () => {
        const subject = entranceInput.subject.trim();
        const marks = Number(entranceInput.marks);
        const maxMarks = Number(entranceInput.maxMarks);
        if (!subject) return setEntranceStatus('Enter the subject name.');
        if (entranceInput.marks === '' || Number.isNaN(marks) || marks < 0) return setEntranceStatus('Enter valid marks.');
        if (!maxMarks || maxMarks <= 0) return setEntranceStatus('Enter the maximum marks for the subject.');
        if (marks > maxMarks) return setEntranceStatus('Marks cannot be more than the maximum marks.');
        if (entranceRows.some(r => r.subject.toLowerCase() === subject.toLowerCase())) return setEntranceStatus(`${subject} is already added.`);
        setEntranceDraft(d => ({ ...d, [selectedEntranceApp.id]: [...(d[selectedEntranceApp.id] || []), { subject, marks, maxMarks }] }));
        setEntranceInput(i => ({ ...i, subject: '', marks: '' }));
        setEntranceStatus('');
    };

    const removeEntranceSubject = (index) => {
        setEntranceDraft(d => ({ ...d, [selectedEntranceApp.id]: (d[selectedEntranceApp.id] || []).filter((_, i) => i !== index) }));
    };

    const submitEntranceMarks = async () => {
        if (!selectedEntranceApp || selectedEntranceApp.marksSubmitted) return;
        if (entranceRows.length === 0) return setEntranceStatus('Add at least one subject with marks.');
        if (!window.confirm(`Submit the marks for ${entranceName(selectedEntranceApp)}? They will be visible to the office and admin.`)) return;
        setEntranceSaving(true);
        try {
            await updateDoc(doc(db, 'admissions', selectedEntranceApp.id), {
                examMarks: {
                    subjects: entranceRows,
                    total: entranceTotal,
                    maxTotal: entranceMax,
                    percentage: entranceMax ? Math.round((entranceTotal / entranceMax) * 1000) / 10 : 0,
                    submittedBy: staffData.name,
                    staffId: staffData.staffId,
                    submittedAt: serverTimestamp()
                },
                marksSubmitted: true,
                updatedAt: serverTimestamp(),
                history: arrayUnion({ status: 'Entrance Exam', by: 'staff', at: Date.now(), note: `Marks submitted by ${staffData.name}` })
            });
            setEntranceDraft(d => { const next = { ...d }; delete next[selectedEntranceApp.id]; return next; });
            setEntranceStatus('Marks submitted. The office and admin can now see them.');
        } catch (err) {
            console.error('Error submitting entrance marks:', err);
            setEntranceStatus('Could not submit the marks. Please try again.');
        } finally {
            setEntranceSaving(false);
        }
    };

    const mySchedule = staffTimetableList.filter(item =>
        (staffData.staffId && item.staffId === staffData.staffId) ||
        (item.staffName && item.staffName.toLowerCase() === staffData.name.toLowerCase())
    );

    // ---- weekly timetable grid (day rows x period columns) ----
    const TT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const normSlot = (slot) => extractTimeRange(slot).toLowerCase().replace(/\s+/g, '');

    const slotStartMinutes = (range) => {
        const m = String(range).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!m) return 0;
        let hour = parseInt(m[1], 10);
        const minute = parseInt(m[2], 10);
        const endHour = parseInt(m[4], 10);
        let suffix = (m[3] || m[6] || 'AM').toUpperCase();
        // "11:15 - 12:00 PM" starts in the morning
        if (!m[3] && m[6] && m[6].toUpperCase() === 'PM' && (hour % 12) > (endHour % 12)) suffix = 'AM';
        hour = (hour % 12) + (suffix === 'PM' ? 12 : 0);
        return hour * 60 + minute;
    };

    const ttColumns = (() => {
        const map = new Map();
        periodList.forEach((p) => map.set(normSlot(p), extractTimeRange(p)));
        mySchedule.forEach((item) => {
            if (!item.timeSlot) return;
            const key = normSlot(item.timeSlot);
            if (!map.has(key)) map.set(key, extractTimeRange(item.timeSlot));
        });
        return [...map.entries()]
            .map(([key, label]) => ({ key, label }))
            .sort((a, b) => slotStartMinutes(a.label) - slotStartMinutes(b.label));
    })();

    const sameDay = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

    const ttDays = [
        ...TT_DAYS,
        ...[...new Set(mySchedule.map((i) => String(i.day || '').trim()).filter(Boolean))]
            .filter((d) => !TT_DAYS.some((x) => sameDay(x, d)))
    ];

    const ttCell = (day, key) =>
        mySchedule.filter((item) => sameDay(item.day, day) && normSlot(item.timeSlot) === key);

    const ttClassLabel = (item) => {
        const cls = item.className || item.class || 'General';
        const sec = String(item.sectionName || item.section || '').trim();
        if (!sec) return cls;
        return `${cls} · ${sec.toLowerCase().startsWith('section') ? sec : `Sec ${sec}`}`;
    };

    const exportTimetableCsv = () => {
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = ['Day', ...ttColumns.map((c) => c.label)];
        const rows = ttDays.map((day) => [
            day,
            ...ttColumns.map((c) =>
                ttCell(day, c.key)
                    .map((i) => `${i.subject || 'Subject'} (${ttClassLabel(i)}, Rm ${i.roomNo || 'N/A'})`)
                    .join(' / ')
            )
        ]);
        const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-timetable.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const printTimetable = () => {
        const escH = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
        const head = ttColumns.map((c) => `<th>${escH(c.label)}</th>`).join('');
        const body = ttDays.map((day) => {
            const cells = ttColumns.map((c) => {
                const items = ttCell(day, c.key);
                return `<td>${items.map((i) =>
                    `<div class="slot"><b>${escH(i.subject || 'Subject')}</b><span>${escH(ttClassLabel(i))}</span><em>Rm: ${escH(i.roomNo || 'N/A')}</em></div>`
                ).join('')}</td>`;
            }).join('');
            return `<tr><th class="day">${escH(day)}</th>${cells}</tr>`;
        }).join('');

        const w = window.open('', '_blank', 'width=1100,height=800');
        if (!w) return;
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Timetable</title>
<style>
@page { size: A4 landscape; margin: 10mm; }
* { box-sizing: border-box; }
body { font-family: Outfit, Arial, sans-serif; color: #182033; margin: 0; }
h1 { font-size: 18px; margin: 0 0 2px; }
p { margin: 0 0 12px; font-size: 11px; color: #718096; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th, td { border: 1px solid #e4e8f1; padding: 6px 4px; text-align: center; font-size: 10px; vertical-align: middle; }
thead th { background: #f3f5fb; color: #5b6478; text-transform: uppercase; font-size: 9px; }
th.day { background: #f6f8ff; font-size: 11px; width: 78px; }
.slot { border-top: 3px solid #5b5cf0; border-radius: 8px 8px 6px 6px; background: #f1f0ff; padding: 5px 3px; margin: 2px 0; }
.slot b { display: block; color: #5b5cf0; font-size: 11px; }
.slot span { display: block; color: #718096; font-weight: 600; margin-top: 1px; }
.slot em { display: block; color: #718096; font-style: normal; font-size: 9px; margin-top: 1px; }
tr { height: 54px; }
</style></head><body>
<h1>Weekly Timetable — ${escH(staffData.name || '')}</h1>
<p>Synchronized live with administrator and faculty allocations</p>
<table><thead><tr><th class="day">Day</th>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 300);
    };

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

    // Class Incharge Teachers: attendance can only be marked by the teacher assigned as
    // Class Incharge for a section (assigned by the admin), split into Forenoon / Afternoon sessions.
    const myStaffRecord = allStaffMembers.find(s => s.staffId === staffData.staffId);
    const myStaffDocId = myStaffRecord?.id || '';

    useEffect(() => {
        if (!myStaffRecord || isEditingProfile) return;
        setProfileForm({
            email: myStaffRecord.email || '',
            phone: myStaffRecord.phone || '',
            qualification: myStaffRecord.qualification || '',
            bio: myStaffRecord.bio || ''
        });
    }, [myStaffRecord?.email, myStaffRecord?.phone, myStaffRecord?.qualification, myStaffRecord?.bio, isEditingProfile]);

    const myInchargeSections = sectionsList.filter((sec) => {
        const idMatch =
            Boolean(sec.classInchargeId) &&
            Boolean(myStaffDocId) &&
            sec.classInchargeId === myStaffDocId;

        const nameMatch =
            Boolean(sec.classIncharge) &&
            Boolean(staffData.name) &&
            cleanString(sec.classIncharge) === cleanString(staffData.name);

        return idMatch || nameMatch;
    });

    const isClassIncharge = myInchargeSections.length > 0;

    const myInchargeSectionsKey = myInchargeSections.map((sec) => sec.id).join(',');

    const selectedInchargeSection =
        myInchargeSections.find(
            (sec) => String(sec.id) === String(attendanceSectionId)
        ) ||
        myInchargeSections[0] ||
        null;

    useEffect(() => {

        if (myInchargeSections.length === 0) {
            setAttendanceSectionId('');
            setAttendanceSubmitted(false);
            return;
        }

        const stillExists = myInchargeSections.some(
            (sec) => String(sec.id) === String(attendanceSectionId)
        );

        if (!stillExists) {
            setAttendanceSectionId(String(myInchargeSections[0].id));
            setAttendanceSubmitted(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myInchargeSectionsKey]);

    // days of the visible month that already have attendance saved for this section
    const [attMarkedDates, setAttMarkedDates] = useState([]);
    const attMonthKey = /^\d{4}-\d{2}/.test(attendanceDate) ? attendanceDate.slice(0, 7) : new Date().toISOString().slice(0, 7);
    const attSectionKey = selectedInchargeSection?.id ?? '';
    useEffect(() => {
        if (!attSectionKey) { setAttMarkedDates([]); return; }
        const q = query(
            collection(db, 'attendance_records'),
            where('date', '>=', `${attMonthKey}-01`),
            where('date', '<=', `${attMonthKey}-31`)
        );
        const unsub = onSnapshot(q, (snap) => {
            const days = new Set();
            snap.docs.forEach((d) => {
                const r = d.data();
                if (String(r.sectionId) === String(attSectionKey) && r.date) days.add(r.date);
            });
            setAttMarkedDates([...days]);
        }, (err) => console.error('Attendance history error:', err));
        return () => unsub();
    }, [attMonthKey, attSectionKey]);

    useEffect(() => {
        setAttendanceSubmitted(false);
        setShowAttendanceConfirm(false);
    }, [attendanceSectionId, attendanceSession, attendanceDate]);
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
            try {
                const cameras = await Html5Qrcode.getCameras(); if (!cameras?.length) throw new Error('No camera found'); const preferred = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[0]; if (cancelled) return;
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
                }, () => { });
                if (!cancelled) setScannerStatus('Point the camera at the student hall-ticket QR code');
            } catch (error) { console.error('Unable to start hall-ticket QR scanner:', error); if (!cancelled) setScannerStatus('Camera unavailable. Please allow camera permission and try again.'); }
        };
        const timer = setTimeout(startScanner, 100);
        return () => {
            cancelled = true; clearTimeout(timer);
            if (scanPopupTimerRef.current) { clearTimeout(scanPopupTimerRef.current); scanPopupTimerRef.current = null; }
            const activeScanner = hallTicketScannerRef.current; hallTicketScannerRef.current = null;
            if (activeScanner) activeScanner.stop().catch(() => { }).finally(() => activeScanner.clear());
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
        if (activeScanner && activeScanner.isScanning) activeScanner.stop().catch(() => { });
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

    const attendanceStudents = selectedInchargeSection &&
        selectedInchargeSection.className &&
        selectedInchargeSection.name
        ? allStudents.filter(student => {
            const classMatches =
                normalizeClassKey(getStudentClassValue(student)) ===
                normalizeClassKey(selectedInchargeSection.className);

            const sectionMatches =
                normalizeSectionKey(getStudentSectionValue(student)) ===
                normalizeSectionKey(selectedInchargeSection.name);

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

    // PROFILE HELPERS — staff docs are written by several admin screens over time,
    // so the same info can live under different key names. pickField returns the
    // first key that actually has a value.
    const pickField = (source, keys, fallback = '—') => {
        if (!source) return fallback;
        for (const key of keys) {
            const value = source[key];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                return String(value).trim();
            }
        }
        return fallback;
    };

    const formatProfileDate = (value) => {
        if (!value || value === '—') return value || '—';
        let date = null;
        if (value?.toDate && typeof value.toDate === 'function') date = value.toDate();
        else if (value instanceof Date) date = value;
        else if (typeof value === 'string' || typeof value === 'number') date = new Date(value);
        if (!date || Number.isNaN(date.getTime())) return String(value);
        return [
            String(date.getDate()).padStart(2, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            date.getFullYear()
        ].join('-');
    };

    const printProfile = () => {
        // The print stylesheet shows only .profile-print-area (a clean A4 record sheet).
        // A temporary portrait @page rule is added for this one job and removed afterwards.
        const pageStyle = document.createElement('style');
        pageStyle.id = 'profile-print-page-style';
        pageStyle.textContent = '@page { size: A4 portrait !important; margin: 8mm !important; }';
        document.head.appendChild(pageStyle);

        const cleanup = () => {
            document.getElementById('profile-print-page-style')?.remove();
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);

        setTimeout(() => window.print(), 80);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!myStaffDocId) {
            setProfileSaveStatus('Unable to save — your staff record was not found.');
            return;
        }
        setIsProfileSaving(true);
        setProfileSaveStatus('');
        try {
            await updateDoc(doc(db, 'staff_members', myStaffDocId), {
                email: profileForm.email.trim(),
                phone: profileForm.phone.trim(),
                qualification: profileForm.qualification.trim(),
                bio: profileForm.bio.trim(),
                updatedAt: serverTimestamp()
            });
            setProfileSaveStatus('Profile updated successfully.');
            setIsEditingProfile(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            setProfileSaveStatus('Something went wrong while saving. Please try again.');
        } finally {
            setIsProfileSaving(false);
            setTimeout(() => setProfileSaveStatus(''), 4000);
        }
    };

    const getMatchedInchargeSection = () => {
        if (!selectedInchargeSection) return null;
        if (!selectedInchargeSection.className || !selectedInchargeSection.name) return null;
        return selectedInchargeSection;
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
        const matchedSection = getMatchedInchargeSection();

        if (!matchedSection) {
            alert('Attendance is locked because you are not assigned as the Class Incharge for any section.');
            return;
        }

        if (attendanceStudents.length === 0) {
            alert(
                `No students found for ${matchedSection.className} - ${matchedSection.name}. ` +
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
                    lastAttendanceSession: attendanceSession,
                    lastAttendanceSectionId:
                        matchedSection?.id || null,
                    lastAttendanceTeacher:
                        staffData.name || null,
                    lastAttendanceClass:
                        matchedSection.className,
                    lastAttendanceSection:
                        matchedSection.name
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
                        matchedSection.className,

                    sectionName:
                        matchedSection.name,

                    date: attendanceDate,

                    session:
                        attendanceSession,

                    teacherId:
                        staffData.staffId || '',

                    teacherName:
                        staffData.name || '',

                    sectionId:
                        matchedSection?.id || null,

                    status:
                        attendanceStatus,

                    createdAt:
                        serverTimestamp()
                });
            });

            await batch.commit();

            setAttendanceSubmitted(true);

            alert(
                `Attendance submitted successfully for ${attendanceStudents.length} student(s) — ${attendanceSession} session.`
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
    const greetingText = todayRef.getHours() < 12 ? 'Good morning' : todayRef.getHours() < 17 ? 'Good afternoon' : 'Good evening';
    const calendarMonthDate = new Date(todayRef.getFullYear(), todayRef.getMonth() + calendarMonthOffset, 1);
    const calendarMonthLabel = calendarMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const calendarCells = [
        ...Array(calendarMonthDate.getDay()).fill(null),
        ...Array.from(
            { length: new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 0).getDate() },
            (_, i) => new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth(), i + 1)
        )
    ];
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
    ).slice(0, 8);

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

    const isTaskDone = (t) => ['completed', 'done'].includes(String(t.status || '').toLowerCase());
    const myOfficeTasks = officeTaskList
        .filter(t =>
            (myStaffDocId && t.assignedToId === myStaffDocId) ||
            (staffData.staffId && t.assignedStaffId === staffData.staffId) ||
            (t.assignedTo && staffData.name && String(t.assignedTo).trim().toLowerCase() === String(staffData.name).trim().toLowerCase())
        )
        .sort((a, b) => (isTaskDone(a) - isTaskDone(b)) || String(a.deadline || '').localeCompare(String(b.deadline || '')));
    const pendingOfficeTasks = myOfficeTasks.filter(t => !isTaskDone(t));
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const isTaskOverdue = (t) => !isTaskDone(t) && t.deadline && new Date(t.deadline) < todayStart;
    const isTaskAssessment = (t) => t.category === 'Assessment';
    const overdueTaskCount = pendingOfficeTasks.filter(isTaskOverdue).length;
    const assessmentTaskCount = myOfficeTasks.filter(t => isTaskAssessment(t) && !isTaskDone(t)).length;
    const completedTaskCount = myOfficeTasks.length - pendingOfficeTasks.length;
    const visibleOfficeTasks = myOfficeTasks.filter(t =>
        taskFilter === 'pending' ? !isTaskDone(t)
            : taskFilter === 'assessment' ? isTaskAssessment(t)
                : taskFilter === 'done' ? isTaskDone(t)
                    : true
    );
    const fmtTaskDate = (d) => {
        if (!d) return 'No deadline';
        const dt = new Date(d);
        return isNaN(dt) ? d : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const handleCompleteOfficeTask = async (task, done) => {
        try {
            await updateDoc(doc(db, 'office_tasks', task.id), {
                status: done ? 'Completed' : 'Pending',
                completedAt: done ? serverTimestamp() : deleteField()
            });
        } catch (err) {
            console.error('Error updating task status:', err);
            alert('Could not update the task. Please try again.');
        }
    };
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

    const reviewQueueCount = submissionsList.filter(s => s.obtainedMarks === undefined || s.obtainedMarks === null || s.obtainedMarks === '').length;
    const workSwitch = (
        <div className="wk-top">
            <div>
                <h3>Tasks and assessments</h3>
                <p className="subtitle">Assign work to a class, then review and grade what comes back.</p>
            </div>
            <div className="wk-switch" role="tablist" aria-label="Tasks and assessments">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'assignments'}
                    className={activeTab === 'assignments' ? 'is-on' : ''}
                    onClick={() => setActiveTab('assignments')}
                >
                    <ClipboardList size={15} /> Assigned tasks <b>{assignmentsList.length}</b>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'submissions'}
                    className={activeTab === 'submissions' ? 'is-on' : ''}
                    onClick={() => {
                        setActiveTab('submissions');
                        setSubClassFilter(null);
                        setSubSectionFilter(null);
                        setSubmissionFilterStatus('all');
                    }}
                >
                    <FileCheck size={15} /> Grading <b className={reviewQueueCount > 0 ? 'has-alert' : ''}>{reviewQueueCount}</b>
                </button>
            </div>
        </div>
    );

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


    /* ---------- design helpers (Tassel Tutor dashboard / SchoolHub chat look) ---------- */
    const NAME_COLORS = ['#7c6cf0', '#e064c4', '#14a38b', '#2fa8e0', '#f0a030', '#e5603c'];
    const AVATAR_TONES = ['#d7f5e8', '#e4e0fb', '#ffe6d5', '#d9effb', '#fde0ef', '#fff1c6'];
    const hashName = (name = '') => [...String(name)].reduce((n, c) => n + c.charCodeAt(0), 0);
    const nameColor = (name) => NAME_COLORS[hashName(name) % NAME_COLORS.length];
    const avatarTone = (name) => AVATAR_TONES[hashName(name) % AVATAR_TONES.length];
    const initialOf = (name) => String(name || '?').trim().charAt(0).toUpperCase();
    const fmtClock = (ts) => {
        const d = ts?.toDate ? ts.toDate() : null;
        return d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
    };
    const fileBadge = (d) => {
        const name = String(d.fileName || '');
        const ext = name.includes('.') ? name.split('.').pop().toUpperCase().slice(0, 4) : 'DOC';
        const tones = { PDF: '#ec5b4d', JPG: '#6c6cf0', JPEG: '#6c6cf0', PNG: '#f5c76a', ZIP: '#1f9d8c', DOC: '#27c993', DOCX: '#2f7fe0', XLS: '#27a85c', XLSX: '#27a85c' };
        return { ext, color: tones[ext] || '#27c993' };
    };

    // donut: office tasks
    const taskTotal = myOfficeTasks.length;
    const taskDonePct = taskTotal ? (completedTaskCount / taskTotal) * 100 : 100;
    const taskProgPct = taskTotal ? ((pendingOfficeTasks.length - overdueTaskCount) / taskTotal) * 100 : 0;
    const donutBg = `conic-gradient(var(--tt-green) 0 ${taskDonePct}%, var(--tt-amber) ${taskDonePct}% ${taskDonePct + taskProgPct}%, var(--tt-red) ${taskDonePct + taskProgPct}% 100%)`;

    // smooth attendance curve (per class)
    const CH_W = 400, CH_H = 120;
    const smoothPath = (pts) => {
        if (pts.length < 2) return '';
        let d = `M ${pts[0][0]} ${pts[0][1]}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
            d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
        }
        return d;
    };
    const attendancePts = classProgressData.map((c, i) => [
        (i / Math.max(classProgressData.length - 1, 1)) * CH_W,
        CH_H - 12 - (c.rate / 100) * (CH_H - 34)
    ]);
    const attendanceLine = smoothPath(attendancePts);
    const attendanceArea = attendanceLine ? `${attendanceLine} L ${CH_W} ${CH_H} L 0 ${CH_H} Z` : '';
    const peakIdx = classProgressData.reduce((best, c, i, arr) => (c.rate > arr[best].rate ? i : best), 0);

    // attendance register helpers
    const attParsed = new Date(`${attendanceDate}T00:00:00`);
    const attDate = isNaN(attParsed) ? new Date() : attParsed;
    const attYear = attDate.getFullYear();
    const attMonth = attDate.getMonth();
    const attDaysInMonth = new Date(attYear, attMonth + 1, 0).getDate();
    const attMonthLabel = attDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const attDayISO = (d) => `${attYear}-${String(attMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const attPresentCount = attendanceStudents.filter(st => (st.status || 'present') !== 'absent').length;
    const attAbsentCount = attendanceStudents.length - attPresentCount;
    const attRows = filteredAttendanceStudents.filter(st => attendanceFilter === 'all' || (st.status || 'present') === attendanceFilter);

    const activeChatMember = allStaffMembers.find(m => m.staffId === activeChatInfo?.staffId);
    const lastRoomMessage = staffRoomMessages[staffRoomMessages.length - 1];

    // left pane shared by Chats and Staff Room
    const renderChatListPane = (mode) => {
        const q = chatListSearch.trim().toLowerCase();
        const rows = myChats.filter((chat) => {
            if (!q) return true;
            const otherId = (chat.participants || []).find(id => id !== staffData.staffId);
            return String(chat.participantNames?.[otherId] || '').toLowerCase().includes(q);
        });
        return (
            <div className="sh-list">
                <div className="sh-list-top">
                    <label className="sh-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={chatListSearch}
                            onChange={(e) => setChatListSearch(e.target.value)}
                        />
                    </label>
                    <button type="button" className="sh-add" onClick={() => setShowNewChatPicker(true)} aria-label="New chat" title="New chat">
                        <Plus size={20} />
                    </button>
                </div>
                <div className="sh-list-scroll">
                    <button
                        type="button"
                        className={`sh-list-item ${mode === 'room' ? 'active' : ''}`}
                        onClick={() => setActiveTab('staffroom')}
                    >
                        <div className="sh-avatar room"><Users size={20} /></div>
                        <div className="sh-list-copy">
                            <div className="sh-list-line"><strong>Staff Room</strong><span>{fmtClock(lastRoomMessage?.createdAt)}</span></div>
                            <p>{lastRoomMessage ? `${lastRoomMessage.senderName}: ${lastRoomMessage.text}` : 'A shared space for all faculty.'}</p>
                        </div>
                    </button>
                    {rows.length === 0 ? (
                        <div className="sh-list-empty">
                            <MessageCircle size={24} />
                            <p>No conversations yet. Start one with the + button or from Departments.</p>
                        </div>
                    ) : rows.map((chat) => {
                        const otherId = (chat.participants || []).find(id => id !== staffData.staffId);
                        const otherName = chat.participantNames?.[otherId] || 'Staff Member';
                        const otherDept = chat.participantDepartments?.[otherId] || 'General';
                        return (
                            <button
                                key={chat.id}
                                type="button"
                                className={`sh-list-item ${mode === 'chats' && activeChatId === chat.id ? 'active' : ''}`}
                                onClick={() => { handleSelectChat(chat); setActiveTab('chats'); }}
                            >
                                <div className="sh-avatar" style={{ background: avatarTone(otherName) }}>{initialOf(otherName)}</div>
                                <div className="sh-list-copy">
                                    <div className="sh-list-line"><strong>{otherName}</strong><span>{fmtClock(chat.updatedAt)}</span></div>
                                    <p>{chat.lastMessage || `${otherDept} Department`}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const mobilePageTitles = {
        overview: 'Home',
        profile: 'My profile',
        students: 'Students',
        attendance: 'Attendance',
        analytics: 'Analytics',
        marks: 'Marks entry',
        assignments: 'Tasks and assessments',
        submissions: 'Tasks and assessments',
        syllabus: 'Lessons',
        schedule: 'Time table',
        departments: 'Departments',
        chats: 'Chats',
        staffroom: 'Staff room',
        library: 'Library',
        events: 'Events',
        'entrance-exams': 'Entrance exams',
        'exam-halls': 'Exam halls',
        mytasks: 'My tasks',
        schoolnews: 'School news',
        downloads: 'Downloads',
        leaves: 'Leave requests'
    };
    const mobilePageTitle = mobilePageTitles[activeTab] || 'Staff portal';

    return (
        <div className="dashboard-containers">
            <header className="mobile-topbar">
                <div className="mobile-brand">
                    <img src={logo} alt="" id='logog' />
                    <span>{mobilePageTitle}</span>
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
                <div className="sidebar-brand">
                    <img src={logo} alt="" />
                    <div>
                        <strong>Holy Cross</strong>
                        <span>Staff Portal</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-pinned">
                        <button
                            className={`nav-links ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                        >
                            <div className="nav-links-content">
                                <LayoutGrid size={18} />
                                <span>Dashboard</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-group">
                        <button
                            type="button"
                            className={`sidebar-group-head ${openGroup === 'workspace' ? 'is-open' : ''} ${SIDEBAR_TAB_GROUP[activeTab] === 'workspace' ? 'has-active' : ''}`}
                            onClick={() => setOpenGroup(openGroup === 'workspace' ? null : 'workspace')}
                            aria-expanded={openGroup === 'workspace'}
                        >
                            <span>My Workspace</span>

                            <ChevronDown size={14} className="sg-chevron" />
                        </button>
                        {openGroup === 'workspace' && (
                            <div className="sidebar-group-body">

                                <button
                                    className={`nav-links ${activeTab === 'profile' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('profile'); setIsEditingProfile(false); setIsMobileMenuOpen(false); }}
                                >
                                    <div className="nav-links-content">
                                        <User size={18} />
                                        <span>My Profile</span>
                                    </div>
                                    <ChevronRight size={15} className="nav-arrow" />
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
                                    className={`nav-links ${activeTab === 'submissions' || activeTab === 'assignments' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('assignments');
                                        setSubClassFilter(null);
                                        setSubSectionFilter(null);
                                        setSubmissionFilterStatus('all');
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <div className="nav-links-content">
                                        <ClipboardList size={18} />
                                        <span>Tasks & Assessments</span>
                                        {reviewQueueCount > 0 && <span className="task-count-pill">{reviewQueueCount}</span>}
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
                        )}
                    </div>

                    <div className="sidebar-group">
                        <button
                            type="button"
                            className={`sidebar-group-head ${openGroup === 'exams' ? 'is-open' : ''} ${SIDEBAR_TAB_GROUP[activeTab] === 'exams' ? 'has-active' : ''}`}
                            onClick={() => setOpenGroup(openGroup === 'exams' ? null : 'exams')}
                            aria-expanded={openGroup === 'exams'}
                        >
                            <span>Examinations</span>

                            <ChevronDown size={14} className="sg-chevron" />
                        </button>
                        {openGroup === 'exams' && (
                            <div className="sidebar-group-body">
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
                                            <button
                                                type="button"
                                                className={`sub-link ${activeTab === 'entrance-exams' ? 'active' : ''}`}
                                                onClick={() => { setActiveTab('entrance-exams'); setSelectedEntranceId(null); setIsMobileMenuOpen(false); }}
                                            >
                                                <ClipboardList size={13} /> Entrance Exam Marks
                                                {entrancePending > 0 && <span className="ent-count">{entrancePending}</span>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sidebar-group">
                        <button
                            type="button"
                            className={`sidebar-group-head ${openGroup === 'comms' ? 'is-open' : ''} ${SIDEBAR_TAB_GROUP[activeTab] === 'comms' ? 'has-active' : ''}`}
                            onClick={() => setOpenGroup(openGroup === 'comms' ? null : 'comms')}
                            aria-expanded={openGroup === 'comms'}
                        >
                            <span>Communication</span>

                            <ChevronDown size={14} className="sg-chevron" />
                        </button>
                        {openGroup === 'comms' && (
                            <div className="sidebar-group-body">

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
                        )}
                    </div>

                    <div className="sidebar-group">
                        <button
                            type="button"
                            className={`sidebar-group-head ${openGroup === 'alerts' ? 'is-open' : ''} ${SIDEBAR_TAB_GROUP[activeTab] === 'alerts' ? 'has-active' : ''}`}
                            onClick={() => setOpenGroup(openGroup === 'alerts' ? null : 'alerts')}
                            aria-expanded={openGroup === 'alerts'}
                        >
                            <span>Approval & Alerts</span>
                            {pendingOfficeTasks.length > 0 && <em className="sg-badge">{pendingOfficeTasks.length}</em>}
                            <ChevronDown size={14} className="sg-chevron" />
                        </button>
                        {openGroup === 'alerts' && (
                            <div className="sidebar-group-body">

                                <button
                                    className={`nav-links ${activeTab === 'mytasks' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('mytasks'); setIsMobileMenuOpen(false); }}
                                >
                                    <div className="nav-links-content">
                                        <ClipboardList size={18} />
                                        <span>My Tasks</span>
                                        {pendingOfficeTasks.length > 0 && <span className="task-count-pill">{pendingOfficeTasks.length}</span>}
                                    </div>
                                    <ChevronRight size={15} className="nav-arrow" />
                                </button>

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
                        )}
                    </div>

                    <div className="sidebar-group">
                        <button
                            type="button"
                            className={`sidebar-group-head ${openGroup === 'others' ? 'is-open' : ''} ${SIDEBAR_TAB_GROUP[activeTab] === 'others' ? 'has-active' : ''}`}
                            onClick={() => setOpenGroup(openGroup === 'others' ? null : 'others')}
                            aria-expanded={openGroup === 'others'}
                        >
                            <span>Others</span>

                            <ChevronDown size={14} className="sg-chevron" />
                        </button>
                        {openGroup === 'others' && (
                            <div className="sidebar-group-body">

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
                                    className={`nav-links ${activeTab === 'events' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('events'); setIsMobileMenuOpen(false); }}
                                >
                                    <div className="nav-links-content">
                                        <PartyPopper size={18} />
                                        <span>Events</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div
                        className="sidebar-usercard"
                        role="button"
                        tabIndex={0}
                        onClick={() => { setActiveTab('profile'); setIsEditingProfile(false); setIsMobileMenuOpen(false); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setActiveTab('profile'); setIsEditingProfile(false); setIsMobileMenuOpen(false); } }}
                    >
                        <div className="user-avatar">{staffData.name.charAt(0)}</div>
                        <div className="user-info">
                            <span className="user-name">{staffData.name}</span>
                            <span className="user-role">{staffData.department}</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} aria-label="Sign out" title="Sign out">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-topbar">
                    <h1 className="topbar-hello">Hello, <strong>{staffData.name}</strong>!</h1>
                    <div className="topbar-right">
                        <div className="search-bar">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search students or teachers"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="topbar-actions">
                            <button className="topbar-pill" onClick={() => setActiveTab('mytasks')}>
                                <ClipboardList size={15} /> My Tasks{pendingOfficeTasks.length > 0 && <em>{pendingOfficeTasks.length}</em>}
                            </button>
                            <button className="topbar-pill" onClick={() => setActiveTab('leaves')}>
                                <SendHorizonal size={15} /> Leaves
                            </button>
                            <button
                                className={`icon-btn ${isDarkMode ? 'icon-btn-on' : ''}`}
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                aria-label="Toggle dark mode"
                            >
                                {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
                            </button>

                            <div style={{ position: 'relative' }}>
                                <button
                                    className={`icon-btn ${showAiHint ? 'icon-btn-on' : ''}`}
                                    onClick={() => { setShowAiHint(!showAiHint); setShowNotifications(false); setShowProfileMenu(false); }}
                                    aria-label="AI assistant"
                                >
                                    <Sparkles size={17} />
                                </button>
                                {showAiHint && (
                                    <div className="notification-dropdown">
                                        <div className="dropdown-header"><h4>AI Assistant</h4></div>
                                        <p style={{ margin: 0, padding: '2px 16px 14px', fontSize: '.8rem', color: 'var(--muted)' }}>
                                            Smart suggestions for your day are coming soon.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="notification-wrapper" style={{ position: 'relative' }}>
                                <button className="icon-btn" onClick={() => { setShowNotifications(!showNotifications); setShowAiHint(false); }}>
                                    <Bell size={17} />
                                    <span className="notification-badge">{announcements.length + pendingOfficeTasks.length}</span>
                                </button>
                                {showNotifications && (
                                    <div className="notification-dropdown">
                                        <div className="dropdown-header">
                                            <h4>Notifications</h4>
                                            <span className="badge-count">{announcements.length + pendingOfficeTasks.length} New</span>
                                        </div>
                                        <ul>
                                            {pendingOfficeTasks.map((t) => (
                                                <li
                                                    key={t.id}
                                                    className={`notify-item ${t.priority === 'Urgent' ? 'urgent' : 'info'}`}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => { setActiveTab('mytasks'); setShowNotifications(false); }}
                                                >
                                                    <strong>{t.category === 'Assessment' ? `Assessment: ${t.title}` : `New task: ${t.title}`}</strong>
                                                    <span>{t.priority || 'Normal'}{t.deadline ? ` · Due ${t.deadline}` : ''}</span>
                                                </li>
                                            ))}
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
                                    <button className="profile-dropdown-item" onClick={() => { setActiveTab('profile'); setIsEditingProfile(false); setShowProfileMenu(false); }}>
                                        <User size={15} /> My Profile
                                    </button>
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
                        <div className="tt-layout">
                            <div className="tt-main">
                                <div className="tt-top-row">
                                    <section className="tt-card tt-activities">
                                        <div className="tt-donut" style={{ background: donutBg }}>
                                            <span>{Math.round(taskDonePct)}%</span>
                                        </div>
                                        <div className="tt-activities-copy">
                                            <h3>Task Overview</h3>
                                            <p>{taskTotal ? `${completedTaskCount} of ${taskTotal} office tasks completed` : 'No office tasks assigned yet'}</p>
                                            <ul className="tt-legend">
                                                <li><i style={{ background: 'var(--tt-green)' }} />Done<b>{completedTaskCount}</b></li>
                                                <li><i style={{ background: 'var(--tt-amber)' }} />In-Progress<b>{pendingOfficeTasks.length - overdueTaskCount}</b></li>
                                                <li><i style={{ background: 'var(--tt-red)' }} />Overdue<b>{overdueTaskCount}</b></li>
                                            </ul>
                                        </div>
                                    </section>

                                    <section className="tt-card tt-attendance">
                                        <div className="tt-att-head">
                                            <h3>Class Attendance</h3>
                                            <button className="tt-viewall" onClick={() => setActiveTab('analytics')} aria-label="Open analytics"><i><ChevronRight size={14} /></i></button>
                                        </div>
                                        {attendancePts.length < 2 ? (
                                            <div className="overview-empty">Attendance by class shows up once students are enrolled in two or more classes.</div>
                                        ) : (
                                            <>
                                                <div className="tt-chart">
                                                    <svg viewBox={`0 0 ${CH_W} ${CH_H}`} preserveAspectRatio="none" aria-hidden="true">
                                                        <defs>
                                                            <linearGradient id="ttAtt" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#27c993" stopOpacity=".28" />
                                                                <stop offset="100%" stopColor="#27c993" stopOpacity="0" />
                                                            </linearGradient>
                                                        </defs>
                                                        <path d={attendanceArea} fill="url(#ttAtt)" />
                                                        <path d={attendanceLine} fill="none" stroke="#27c993" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                                                    </svg>
                                                    <span
                                                        className="tt-chart-dot"
                                                        style={{ left: `${(attendancePts[peakIdx][0] / CH_W) * 100}%`, top: `${(attendancePts[peakIdx][1] / CH_H) * 100}%` }}
                                                    />
                                                    <span
                                                        className="tt-chart-tip"
                                                        style={{ left: `${(attendancePts[peakIdx][0] / CH_W) * 100}%`, top: `${(attendancePts[peakIdx][1] / CH_H) * 100}%` }}
                                                    >
                                                        {classProgressData[peakIdx].rate}%
                                                    </span>
                                                </div>
                                                <div className="tt-chart-x">
                                                    {classProgressData.map((c) => <span key={c.className}>{c.className}</span>)}
                                                </div>
                                            </>
                                        )}
                                        <p className="tt-att-foot">{classAttendanceRate}% present today · {absentStudentsCount} absent</p>
                                    </section>
                                </div>

                                <div className="tt-quick">
                                    <button onClick={() => setActiveTab('schedule')}><Calendar size={16} /> Time Table</button>
                                    <button onClick={() => setActiveTab('attendance')}><CheckCircle size={16} /> Attendance</button>
                                    <button onClick={() => { setActiveTab('marks'); setSelectedClass('10th Std'); setSelectedSection(null); }}><Award size={16} /> Marks</button>
                                    <button onClick={() => setActiveTab('assignments')}><ClipboardList size={16} /> Lessons</button>
                                    <button onClick={() => { setActiveTab('students'); setSelectedClass(null); setSelectedSection(null); }}><Folder size={16} /> Roster</button>
                                    <button onClick={() => setActiveTab('leaves')}><SendHorizonal size={16} /> Leaves</button>
                                </div>

                                <div className="tt-section-head">
                                    <h3>Today Schedule</h3>
                                    <span className="tt-count">{mySchedule.length}</span>
                                    <button className="tt-viewall" onClick={() => setActiveTab('schedule')}>View All <i><ChevronRight size={14} /></i></button>
                                </div>
                                {todaysPlanItems.length === 0 ? (
                                    <div className="tt-card overview-empty">No timetable slots mapped to your staff profile yet.</div>
                                ) : (
                                    <div className="tt-classes">
                                        {todaysPlanItems.slice(0, 3).map((item, idx) => {
                                            const classStudents = allStudents.filter(st => st.className && cleanString(item.className || '').includes(cleanString(st.className)));
                                            return (
                                                <button
                                                    key={item.id || idx}
                                                    className={`tt-class ${idx === 0 ? 'featured' : ''}`}
                                                    onClick={() => setActiveTab('students')}
                                                >
                                                    <div className="tt-class-top">
                                                        <span className="tt-class-ico"><Users size={18} /></span>
                                                        <MoreVertical size={20} />
                                                    </div>
                                                    <h4>{item.subject || 'Subject'}</h4>
                                                    <span className="tt-class-meta">{item.className || 'General Class'}{item.roomNo ? ` · ${item.roomNo}` : ''}</span>
                                                    <div className="tt-avatars">
                                                        {classStudents.slice(0, 3).map((st, i) => (
                                                            <span key={st.id || i} style={{ background: avatarTone(st.name) }}>{initialOf(st.name)}</span>
                                                        ))}
                                                        {classStudents.length > 3 && <span className="more">+{classStudents.length - 3}</span>}
                                                    </div>
                                                    <div className="tt-class-foot"><Clock size={16} /> {item.timeSlot || 'TBA'}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="tt-section-head">
                                    <h3>Recent Documents</h3>
                                    <span className="tt-count">{submissionsList.length}</span>
                                    <button className="tt-viewall" onClick={() => setActiveTab('downloads')}>View All <i><ChevronRight size={14} /></i></button>
                                </div>
                                {recentDocuments.length === 0 ? (
                                    <div className="tt-card overview-empty">No documents submitted yet.</div>
                                ) : (
                                    <div className="tt-docs">
                                        {recentDocuments.map((d) => {
                                            const badge = fileBadge(d);
                                            return (
                                                <div key={d.id} className="tt-doc">
                                                    <div className="tt-doc-badge" style={{ background: badge.color }}>{badge.ext}</div>
                                                    <div className="tt-doc-copy">
                                                        <strong>{d.taskTitle || d.fileName || 'Assignment'}</strong>
                                                        <span>{d.studentName ? `${d.studentName} · ` : ''}{d.submittedAt?.toDate ? d.submittedAt.toDate().toLocaleDateString() : 'Recent'}</span>
                                                    </div>
                                                    <div className="tt-doc-actions">
                                                        {d.fileUrl ? (
                                                            <a href={d.fileUrl} target="_blank" rel="noreferrer" aria-label="Open document"><Share2 size={20} /></a>
                                                        ) : (
                                                            <button onClick={() => setActiveTab('submissions')} aria-label="Open submissions"><Share2 size={20} /></button>
                                                        )}
                                                        <button onClick={() => setActiveTab('submissions')} aria-label="More"><MoreVertical size={20} /></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="tt-bottom">

                                    <div className="tt-stack">
                                        <section className="tt-card">
                                <div className="ov-card-head"><h3>Notice Board</h3><span className="ov-pill soft">{announcements.length + pendingOfficeTasks.length} new</span></div>
                                <div className="notice-list">
                                    {pendingOfficeTasks.slice(0, 2).map((t) => (
                                        <button key={t.id} className="notice-row" onClick={() => setActiveTab('mytasks')}>
                                            <i className="warm"><ClipboardList size={16} /></i>
                                            <div><strong>{t.title}</strong><span>{t.priority || 'Normal'}{t.deadline ? ` · Due ${t.deadline}` : ''}</span></div>
                                        </button>
                                    ))}
                                    {announcements.map((a) => (
                                        <div key={a.id} className="notice-row">
                                            <i className={a.type === 'urgent' ? 'warm' : ''}><Bell size={16} /></i>
                                            <div><strong>{a.title}</strong><span>{a.date}</span></div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                                        <section className="tt-card">
                                <div className="ov-card-head">
                                    <h3>Leave Status</h3>
                                    <button className="ov-link" onClick={() => setActiveTab('leaves')}>Apply <ChevronRight size={14} /></button>
                                </div>
                                {myLeaveRequests.length === 0 ? (
                                    <div className="overview-empty">No leave requests yet.</div>
                                ) : (
                                    <div className="leave-list">
                                        {myLeaveRequests.slice(0, 4).map((l, i) => (
                                            <div key={l.id || i} className="leave-row">
                                                <div>
                                                    <strong>{l.leaveType}</strong>
                                                    <span>{l.startDate}{l.endDate && l.endDate !== l.startDate ? ` → ${l.endDate}` : ''}</span>
                                                </div>
                                                <em className={`status-${String(l.status || 'Pending').toLowerCase()}`}>{l.status || 'Pending'}</em>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                                    </div>
                                </div>
                            </div>

                            <aside className="tt-side">
                                <section className="schedule-widget tt-side-schedule">
                                <div className="ov-card-head">
                                    <h3>Schedules</h3>
                                    <button className="ov-pill" onClick={() => setShowAddEventForm(true)}>+ Add</button>
                                </div>
                                <div className="calendar-nav">
                                    <button className="calendar-nav-btn" onClick={() => setCalendarMonthOffset(calendarMonthOffset - 1)} aria-label="Previous month"><ChevronLeft size={15} /></button>
                                    <span className="calendar-month-label">{calendarMonthLabel}</span>
                                    <button className="calendar-nav-btn" onClick={() => setCalendarMonthOffset(calendarMonthOffset + 1)} aria-label="Next month"><ChevronRight size={15} /></button>
                                </div>
                                <div className="calendar-grid">
                                    {dayLabels.map((l) => <span key={l} className="cal-dow">{l.charAt(0)}</span>)}
                                    {calendarCells.map((d, i) => d ? (
                                        <button
                                            key={d.toDateString()}
                                            className={`cal-cell ${selectedCalendarDate === d.toDateString() ? 'selected' : ''} ${d.toDateString() === todayRef.toDateString() ? 'is-today' : ''} ${(dayEvents[d.toDateString()] || []).length ? 'has-event' : ''}`}
                                            onClick={() => setSelectedCalendarDate(d.toDateString())}
                                        >
                                            {d.getDate()}
                                        </button>
                                    ) : <span key={`pad-${i}`} />)}
                                </div>

                                <div className="schedule-day-panel">
                                    <div className="schedule-day-panel-header">
                                        <span className="schedule-day-panel-date">
                                            {new Date(selectedCalendarDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long' })}
                                        </span>
                                        {selectedCalendarDate === todayRef.toDateString() && <span className="ov-pill soft">Today</span>}
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
                                                <button className="btn-secondary" onClick={() => { setShowAddEventForm(false); setNewEventForm({ title: '', time: '' }); }}>Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDayEvents.length === 0 ? (
                                        <div className="overview-empty">Nothing scheduled for this day.</div>
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
                                                        <button className="schedule-day-event-delete" onClick={() => handleDeleteScheduleEvent(selectedCalendarDate, ev.id)} title="Remove"><Trash2 size={13} /></button>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>

                                <div className="ov-subhead">Upcoming</div>
                                {upcomingActivities.length === 0 ? (
                                    <div className="overview-empty">Nothing scheduled right now.</div>
                                ) : (
                                    <div className="activity-list">
                                        {upcomingActivities.map((a) => {
                                            const AIcon = a.icon;
                                            return (
                                                <div key={a.id} className="activity-row">
                                                    <div className="activity-icon"><AIcon size={16} /></div>
                                                    <div className="activity-info"><strong>{a.title}</strong><span>{a.meta}</span></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                                <section>
                                    <div className="tt-side-head"><h3>Messages</h3></div>
                                    {myChats.length === 0 ? (
                                        <div className="overview-empty">No conversations yet.</div>
                                    ) : (
                                        <div className="tt-msglist">
                                            {myChats.slice(0, 4).map((chat) => {
                                                const otherId = (chat.participants || []).find(id => id !== staffData.staffId);
                                                const otherName = chat.participantNames?.[otherId] || 'Staff Member';
                                                return (
                                                    <button key={chat.id} className="tt-msgrow" onClick={() => { handleSelectChat(chat); setActiveTab('chats'); }}>
                                                        <div className="sh-avatar" style={{ background: avatarTone(otherName) }}>{initialOf(otherName)}</div>
                                                        <div className="tt-person-copy">
                                                            <div className="tt-msgrow-line"><strong>{otherName}</strong><time>{fmtClock(chat.updatedAt)}</time></div>
                                                            <span>{chat.lastMessage || 'No messages yet'}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <button className="tt-more" onClick={() => setActiveTab('chats')}>View More</button>
                                </section>
                            </aside>
                        </div>
                    )}

                    {activeTab === 'profile' && (() => {
                        const rec = myStaffRecord || {};
                        const profilePhoto = rec.photo || rec.photoURL || rec.imageUrl || '';
                        const displayName = staffData.name || 'Staff';
                        const staffIdLabel = staffData.staffId || pickField(rec, ['staffId', 'employeeId', 'empId']);
                        const designation = pickField(rec, ['designation', 'role', 'position'], 'Faculty');
                        const departmentLabel = staffData.department || pickField(rec, ['department', 'subject']);

                        const personalFields = [
                            ['Full Name', displayName],
                            ['Date of Birth', formatProfileDate(pickField(rec, ['dob', 'dateOfBirth', 'birthDate']))],
                            ['Gender', pickField(rec, ['gender', 'sex'])],
                            ['Blood Group', pickField(rec, ['bloodGroup', 'blood'])],
                            ['Mother Tongue', pickField(rec, ['motherTongue', 'language'])],
                            ['Nationality', pickField(rec, ['nationality'])],
                        ];

                        const professionalFields = [
                            ['Staff ID', staffIdLabel],
                            ['Department', departmentLabel || '—'],
                            ['Designation', designation],
                            ['Qualification', profileForm.qualification || pickField(rec, ['qualification'])],
                            ['Date of Joining', formatProfileDate(pickField(rec, ['joiningDate', 'dateOfJoining', 'doj']))],
                            ['Experience', pickField(rec, ['experience', 'totalExperience'])],
                        ];

                        const contactFields = [
                            ['Mobile Number', profileForm.phone || pickField(rec, ['phone', 'mobile', 'contactNumber', 'phoneNumber'])],
                            ['Email Address', profileForm.email || pickField(rec, ['email', 'emailId', 'mailId'])],
                            ['Address', pickField(rec, ['address', 'residentialAddress', 'permanentAddress'])],
                            ['City / Town', pickField(rec, ['city', 'town', 'district'])],
                            ['State', pickField(rec, ['state'])],
                            ['PIN Code', pickField(rec, ['pincode', 'pinCode', 'zip'])],
                        ];

                        const aboutFields = [
                            ['Short Bio', profileForm.bio || pickField(rec, ['bio'])],
                        ];

                        const fieldGroups = [
                            { id: 'personal', short: 'Personal', title: 'Personal Information', icon: User, tone: 'primary', fields: personalFields },
                            { id: 'professional', short: 'Professional', title: 'Professional Information', icon: BookOpen, tone: 'cyan', fields: professionalFields },
                            { id: 'contact', short: 'Contact', title: 'Contact Information', icon: FileText, tone: 'emerald', fields: contactFields },
                            { id: 'about', short: 'About', title: 'About Me', icon: Award, tone: 'amber', fields: aboutFields },
                        ];

                        const subjectCount = [...new Set(myTaughtAssignments.map(a => a.subject))].length;
                        const quickStats = [
                            { label: 'Classes Teaching', value: myTaughtClasses.length, hint: 'Synced from timetable', tone: 'primary', icon: BookOpen },
                            { label: 'Subjects', value: subjectCount, hint: subjectCount === 1 ? '1 subject assigned' : `${subjectCount} subjects assigned`, tone: 'purple', icon: Layers },
                            { label: 'Sections In-Charge', value: myInchargeSections.length, hint: isClassIncharge ? 'Class Incharge' : 'Not assigned', tone: 'emerald', icon: GraduationCap },
                            { label: 'Leave Requests', value: myLeaveRequests.length, hint: 'Submitted so far', tone: 'amber', icon: SendHorizonal },
                        ];

                        const allProfileFields = fieldGroups.flatMap((g) => g.fields);
                        const filledProfileFields = allProfileFields.filter(([, v]) => v && v !== '—').length;
                        const profileCompleteness = allProfileFields.length
                            ? Math.round((filledProfileFields / allProfileFields.length) * 100)
                            : 0;
                        const visibleGroups = profileSection === 'all'
                            ? fieldGroups
                            : fieldGroups.filter((g) => g.id === profileSection);
                        const profileIdLabel = staffIdLabel && staffIdLabel !== '—' ? `#${staffIdLabel}` : '#STAFF';

                        // ---- ID card (front / back) values ----
                        const idYear = pickField(rec, ['academicYear', 'session'], '2026 - 2027');
                        const idDob = formatProfileDate(pickField(rec, ['dob', 'dateOfBirth', 'birthDate'], ''));
                        const idBlood = pickField(rec, ['bloodGroup', 'blood']);
                        const idAddress = pickField(rec, ['address', 'residentialAddress', 'permanentAddress']);
                        const idCell = profileForm.phone || pickField(rec, ['phone', 'mobile', 'contactNumber', 'phoneNumber']);
                        const idEmail = profileForm.email || pickField(rec, ['email', 'emailId', 'mailId']);
                        const printSummary = [
                            ['Classes Teaching', myTaughtClasses.length],
                            ['Subjects', subjectCount],
                            ['Sections In-Charge', myInchargeSections.length],
                            ['Leave Requests', myLeaveRequests.length],
                        ];

                        return (
                            <div className="pf-wrap">
                                <div className="pf-layout pfx">
                                    {/* ---------- Identity rail ---------- */}
                                    <aside className="pfx-rail">
                                        <section className="pfx-me">
                                            <div className="pfx-avatar">
                                                <svg viewBox="0 0 120 120" aria-hidden="true">
                                                    <circle className="trk" cx="60" cy="60" r="56" pathLength="100" />
                                                    <circle className="bar" cx="60" cy="60" r="56" pathLength="100" strokeDasharray={`${profileCompleteness} 100`} />
                                                </svg>
                                                <div className="pfx-photo">
                                                    {profilePhoto ? (
                                                        <img src={profilePhoto} alt={displayName} />
                                                    ) : (
                                                        <span aria-hidden="true">{displayName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || <User size={40} />}</span>
                                                    )}
                                                </div>
                                                <b className="pfx-pct" title="Profile completeness">{profileCompleteness}%</b>
                                            </div>

                                            <h2>{displayName}</h2>
                                            <p>{designation}{departmentLabel ? ` · ${departmentLabel}` : ''}</p>
                                            <div className="pfx-chips">
                                                <span className="pfx-chip is-id"><Sparkles size={11} /> {profileIdLabel}</span>
                                                {isClassIncharge && (
                                                    <span className="pfx-chip"><CheckCircle size={11} /> Class incharge</span>
                                                )}
                                            </div>
                                            <small className="pfx-fill">
                                                {filledProfileFields} of {allProfileFields.length} details filled
                                                {profileCompleteness < 100 && !isEditingProfile && (
                                                    <> · <button type="button" onClick={() => setIsEditingProfile(true)}>Complete profile</button></>
                                                )}
                                            </small>

                                            {((idEmail && idEmail !== '—') || (idCell && idCell !== '—')) && (
                                                <ul className="pfx-contact">
                                                    {idEmail && idEmail !== '—' && <li><span><Mail size={14} /></span>{idEmail}</li>}
                                                    {idCell && idCell !== '—' && <li><span><PhoneCall size={14} /></span>{idCell}</li>}
                                                </ul>
                                            )}

                                            <div className="pfx-actions">
                                                <button type="button" className="pfx-btn is-solid" onClick={printProfile}>
                                                    <Printer size={14} /> Print profile
                                                </button>
                                                {!isEditingProfile && (
                                                    <button type="button" className="pfx-btn" onClick={() => setIsEditingProfile(true)}>
                                                        <Edit3 size={14} /> Edit profile
                                                    </button>
                                                )}
                                                <button type="button" className="pfx-btn" onClick={() => setActiveTab('leaves')}>
                                                    <SendHorizonal size={14} /> My leaves
                                                </button>
                                            </div>
                                        </section>

                                        <div className="pfx-idcard">
                                                <div className="pfx-rail-head">
                                                    <h3>Staff ID card</h3>
                                                    <span>Tap the card to flip</span>
                                                </div>
                                                <div className="pf-idflip-wrap">
                                                    <div className={`pf-idflip ${idCardFlipped ? 'is-flipped' : ''}`}>
                                                <div
                                                    className="pf-idflip-inner"
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={idCardFlipped ? 'ID card back side. Click to flip to the front' : 'ID card front side. Click to flip to the back'}
                                                    onClick={() => setIdCardFlipped((v) => !v)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            setIdCardFlipped((v) => !v);
                                                        }
                                                    }}
                                                >
                                                    {/* ---------- FRONT ---------- */}
                                                    <div className="pf-idface idc-front" aria-hidden={idCardFlipped}>
                                                        <div className="idc-head">
                                                            <img src={logo} alt="" className="idc-logo" />
                                                            <div className="idc-head-text">
                                                                <h4>HOLY CROSS MATRIC HR. SEC. SCHOOL</h4>
                                                                <p>SOMARASAMPETTAI, TRICHY - 620 102.</p>
                                                                <p>Phone : 0431 - 2607175, 9597172383</p>
                                                            </div>
                                                        </div>
                                                        <div className="idc-band"><span>STAFF IDENTITY CARD</span></div>
                                                        <div className="idc-year">{idYear}</div>

                                                        <div className="idc-photo-row">
                                                            <div className="idc-photo">
                                                                {profilePhoto ? (
                                                                    <img src={profilePhoto} alt={displayName} />
                                                                ) : (
                                                                    <User size={46} />
                                                                )}
                                                            </div>
                                                            <div className="idc-blood">
                                                                <svg viewBox="0 0 24 32" width="20" height="26" aria-hidden="true">
                                                                    <path d="M12 2C12 2 3 13 3 20a9 9 0 0 0 18 0C21 13 12 2 12 2z" fill="#c1121f" />
                                                                </svg>
                                                                <b>{idBlood !== '—' ? idBlood : ''}</b>
                                                            </div>
                                                        </div>

                                                        <h3 className="idc-name">{displayName}</h3>
                                                        <div className="idc-lines">
                                                            <p><span>Post</span><span>:</span><b>{designation}</b></p>
                                                            <p><span>Staff ID</span><span>:</span><b>{staffIdLabel}</b></p>
                                                        </div>

                                                        <img src={idBuilding} alt="" />
                                                        <div className="idc-sign">
                                                            <img src={principalSignature} alt="" />
                                                        </div>
                                                        <div className="idc-principal">Principal</div>
                                                    </div>

                                                    {/* ---------- BACK ---------- */}
                                                    <div className="pf-idface idc-back" aria-hidden={!idCardFlipped}>
                                                        <div className="idc-back-slot" />
                                                        <dl className="idc-back-list">
                                                            <div><dt>Date of Birth</dt><dd>: {idDob}</dd></div>
                                                            <div><dt>Blood Group</dt><dd>: {idBlood}</dd></div>
                                                            <div className="stack"><dt>Department :</dt><dd>{departmentLabel || '—'}</dd></div>
                                                            <div className="stack"><dt>Address :</dt>
                                                                <dd>
                                                                    <strong>{displayName}</strong>
                                                                    <br />
                                                                    {idAddress}
                                                                </dd>
                                                            </div>
                                                            <div><dt>Cell</dt><dd>: {idCell}</dd></div>
                                                        </dl>
                                                        <p className="idc-back-foot">{HALL_TICKET_SCHOOL_NAME}</p>
                                                    </div>
                                                </div>
                                            </div>
                                                    <button type="button" className="pf-flip-btn" onClick={() => setIdCardFlipped((v) => !v)}>
                                                        <RotateCw size={13} /> {idCardFlipped ? 'Show front' : 'Show back'}
                                                    </button>
                                                </div>
                                            </div>
                                    </aside>

                                    {/* ---------- Content ---------- */}
                                    <div className="pfx-main">
                                        <section className="pfx-stats" aria-label="Workload summary">
                                        {quickStats.map((stat) => {
                                            const StatIcon = stat.icon;
                                            return (
                                                <div className={`pfx-stat tone-${stat.tone}`} key={stat.label} title={stat.hint}>
                                                    <span className="pfx-stat-icon"><StatIcon size={18} /></span>
                                                    <div className="pfx-stat-copy">
                                                        <strong>{stat.value}</strong>
                                                        <span>{stat.label}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </section>
                                            {!myStaffRecord && (
                                                <div className="profile-sync-note">
                                                    <AlertTriangle size={15} />
                                                    <span>
                                                        Your detailed staff record is still syncing. Fields shown as “Not added” will fill
                                                        in automatically once the record loads.
                                                    </span>
                                                </div>
                                            )}

                                            {profileSaveStatus && (
                                                <div className={`profile-save-note ${profileSaveStatus.includes('success') ? 'is-ok' : 'is-alert'}`}>
                                                    {profileSaveStatus.includes('success') ? <Check size={16} /> : <AlertCircle size={16} />} {profileSaveStatus}
                                                </div>
                                            )}

                                            {isEditingProfile ? (
                                                <section className="pfx-panel pfx-edit">
                                                    <h3>Edit your details</h3>
                                                    <p className="pf-edit-hint">Staff ID and Department are assigned by Admin and cannot be edited here.</p>
                                                    <form onSubmit={handleSaveProfile} className="assignment-form-grid">
                                                    <div>
                                                        <label>Email Address</label>
                                                        <input
                                                            type="email"
                                                            className="table-input full-width-input"
                                                            placeholder="you@holycross.edu"
                                                            value={profileForm.email}
                                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Phone Number</label>
                                                        <input
                                                            type="tel"
                                                            className="table-input full-width-input"
                                                            placeholder="+91 90000 00000"
                                                            value={profileForm.phone}
                                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Qualification</label>
                                                        <input
                                                            type="text"
                                                            className="table-input full-width-input"
                                                            placeholder="e.g. M.Sc, B.Ed"
                                                            value={profileForm.qualification}
                                                            onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Department</label>
                                                        <input
                                                            type="text"
                                                            className="table-input full-width-input"
                                                            value={staffData.department || ''}
                                                            disabled
                                                        />
                                                    </div>
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <label>Short Bio</label>
                                                        <textarea
                                                            rows="3"
                                                            className="custom-textarea"
                                                            placeholder="A short note about your role, experience or interests..."
                                                            value={profileForm.bio}
                                                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                                        />
                                                    </div>
                                                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
                                                        <button type="submit" className="btn-primary" disabled={isProfileSaving}>
                                                            <Save size={15} /> {isProfileSaving ? 'Saving...' : 'Save Changes'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-secondary"
                                                            onClick={() => {
                                                                setIsEditingProfile(false);
                                                                setProfileForm({
                                                                    email: myStaffRecord?.email || '',
                                                                    phone: myStaffRecord?.phone || '',
                                                                    qualification: myStaffRecord?.qualification || '',
                                                                    bio: myStaffRecord?.bio || ''
                                                                });
                                                            }}
                                                            disabled={isProfileSaving}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                                </section>
                                            ) : (
                                                <>
                                                    <div className="pfx-tabs" role="tablist" aria-label="Profile sections">
                                                        <button
                                                            type="button"
                                                            role="tab"
                                                            aria-selected={profileSection === 'all'}
                                                            className={profileSection === 'all' ? 'is-on' : ''}
                                                            onClick={() => setProfileSection('all')}
                                                        >
                                                            <span>All details</span>
                                                            <small>{filledProfileFields}/{allProfileFields.length}</small>
                                                        </button>
                                                        {fieldGroups.map((g) => {
                                                            const filled = g.fields.filter(([, v]) => v && v !== '—').length;
                                                            return (
                                                                <button
                                                                    key={g.id}
                                                                    type="button"
                                                                    role="tab"
                                                                    aria-selected={profileSection === g.id}
                                                                    className={profileSection === g.id ? 'is-on' : ''}
                                                                    onClick={() => setProfileSection(g.id)}
                                                                >
                                                                    <span>{g.short}</span>
                                                                    <small>{filled}/{g.fields.length}</small>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="pfx-groups">
                                                        {visibleGroups.map((group) => {
                                                            const GroupIcon = group.icon;
                                                            const groupFilled = group.fields.filter(([, v]) => v && v !== '—').length;
                                                            return (
                                                                <section className={`pfx-panel pfx-group tone-${group.tone}`} key={group.id}>
                                                                    <div className="pfx-group-head">
                                                                        <span className="pfx-group-icon"><GroupIcon size={17} /></span>
                                                                        <h3>{group.title}</h3>
                                                                        <small>{groupFilled}/{group.fields.length}</small>
                                                                    </div>
                                                                    <dl className="pfx-fields">
                                                                        {group.fields.map(([label, value]) => {
                                                                            const empty = !value || value === '—';
                                                                            return (
                                                                                <div className={`pfx-field ${label === 'Address' || label === 'Short Bio' ? 'is-wide' : ''}`} key={label}>
                                                                                    <dt>{label}</dt>
                                                                                    <dd className={empty ? 'is-empty' : ''}>{empty ? 'Not added' : value}</dd>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </dl>
                                                                </section>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}

                                            {myTaughtClasses.length > 0 && (
                                                <section className="pfx-panel pfx-classes">
                                                    <h3>Classes you teach</h3>
                                                    <ul>
                                                        {myTaughtClasses.map((cls) => {
                                                            const subjects = getMyTaughtSubjectsForClass(cls);
                                                            return (
                                                                <li key={cls}>
                                                                    <strong>{cls}</strong>
                                                                    <span className="pfx-subjects">
                                                                        {subjects.length === 0
                                                                            ? <em>No subjects listed</em>
                                                                            : subjects.map((s) => <span className="topic-badge" key={s}>{s}</span>)}
                                                                    </span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </section>
                                            )}

                                            <div className="profile-note-footer">
                                                <FileText size={14} />
                                                <span>
                                                    Your Staff ID and Department are assigned by the Admin. If anything else
                                                    here is incorrect, please contact the school office to have the record updated.
                                                </span>
                                            </div>
                                        
                                    </div>
                                </div>

                                {/* Print-only record sheet (hidden on screen, shown by @media print) */}
                                <div className="profile-print-area">
                                    <div className="pp-head">
                                        <img src={logo} alt="School Emblem" />
                                        <div>
                                            <h1>{HALL_TICKET_SCHOOL_NAME}</h1>
                                            <p>{HALL_TICKET_SCHOOL_TAGLINE}</p>
                                        </div>
                                    </div>
                                    <div className="pp-titlebar">
                                        <h2>STAFF PROFILE</h2>
                                        <span>Generated: {new Date().toLocaleDateString('en-IN')}</span>
                                    </div>

                                    <div className="pp-identity">
                                        <div className="pp-photo">
                                            {profilePhoto ? <img src={profilePhoto} alt="" /> : <span>Photo</span>}
                                        </div>
                                        <div className="pp-identity-text">
                                            <h3>{displayName}</h3>
                                            <p>Staff ID: <strong>{staffIdLabel}</strong></p>
                                            <p>Designation: <strong>{designation}</strong></p>
                                            <p>Department: <strong>{departmentLabel || '—'}</strong></p>
                                        </div>
                                        <div className="pp-summary">
                                            {printSummary.map(([label, value]) => (
                                                <div key={label}><span>{label}</span><strong>{value}</strong></div>
                                            ))}
                                        </div>
                                    </div>

                                    {fieldGroups.map((group) => (
                                        <div className="pp-section" key={group.id}>
                                            <h4>{group.title}</h4>
                                            <div className="pp-grid">
                                                {group.fields.map(([label, value]) => (
                                                    <div className={`pp-cell ${label === 'Address' || label === 'Short Bio' ? 'wide' : ''}`} key={label}>
                                                        <span>{label}</span>
                                                        <strong>{value}</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pp-signs">
                                        <div><i /> <span>Staff Signature</span></div>
                                        <div><i /> <span>Date</span></div>
                                        <div>
                                            <img src={principalSignature} alt="" />
                                            <span>Principal</span>
                                        </div>
                                    </div>
                                    <p className="pp-foot">Computer-generated staff profile — {HALL_TICKET_SCHOOL_NAME}</p>
                                </div>
                            </div>
                        );
                    })()}

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
                        <div className="ta-page">
                            <h2 className="ta-title">Attendance</h2>
                            <p className="ta-sub">
                                {isClassIncharge && selectedInchargeSection
                                    ? `${selectedInchargeSection.className || 'Class'} ${selectedInchargeSection.name ? `(${formatSectionTitle(selectedInchargeSection.name)})` : ''} • Class Incharge`
                                    : 'You are not the Class Incharge for any section'}
                            </p>

                            <div className="ta-head">
                                <h3>Register</h3>
                                <label className="ta-period">
                                    <span>Date:</span>
                                    <input type="date" value={attendanceDate} max={todayISO} onChange={(e) => setAttendanceDate(e.target.value > todayISO ? todayISO : e.target.value)} title="Attendance Date" />
                                </label>
                                <div className="ta-links">
                                    {isClassIncharge && myInchargeSections.length > 1 && (
                                        <select
                                            className="ta-select"
                                            value={attendanceSectionId}
                                            onChange={(e) => setAttendanceSectionId(e.target.value)}
                                            title="Select the class section you are Incharge of"
                                        >
                                            {myInchargeSections.map(sec => (
                                                <option key={sec.id} value={String(sec.id)}>{sec.className} — {formatSectionTitle(sec.name)}</option>
                                            ))}
                                        </select>
                                    )}
                                    {isClassIncharge && (
                                        <select
                                            className="ta-select"
                                            value={attendanceSession}
                                            onChange={(e) => setAttendanceSession(e.target.value)}
                                            title="Select Forenoon or Afternoon session"
                                        >
                                            <option value="Forenoon">Forenoon</option>
                                            <option value="Afternoon">Afternoon</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="ta-strip-card">
                                <div className="ta-strip-top">
                                    <span>Start of month: <b>1 {attDate.toLocaleDateString('en-GB', { month: 'short' })}</b></span>
                                    <span>End of month: <b>{attDaysInMonth} {attDate.toLocaleDateString('en-GB', { month: 'short' })}</b></span>
                                </div>
                                <div className="ta-month" aria-hidden="true">{attMonthLabel}</div>
                                <div className="ta-dow" aria-hidden="true">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
                                </div>
                                <div className="ta-strip" role="group" aria-label={`Days of ${attMonthLabel}`} style={{ '--ta-first': new Date(attYear, attMonth, 1).getDay() + 1 }}>
                                    {Array.from({ length: attDaysInMonth }, (_, i) => i + 1).map((d) => {
                                        const iso = attDayISO(d);
                                        const isSunday = new Date(attYear, attMonth, d).getDay() === 0;
                                        const marked = attMarkedDates.includes(iso);
                                        const stateClass = marked ? 'done' : isSunday ? 'off' : iso <= todayISO ? 'missed' : '';
                                        return (
                                            <button
                                                key={d}
                                                type="button"
                                                className={`ta-day ${stateClass} ${iso === attendanceDate ? 'sel' : ''} ${iso > todayISO ? 'locked' : ''}`}
                                                onClick={() => setAttendanceDate(iso)}
                                                disabled={iso > todayISO}
                                                aria-pressed={iso === attendanceDate}
                                                title={iso > todayISO ? 'Future dates are locked' : iso}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="ta-strip-tags">
                                    <span className="ta-tag ta-hide-m">{attMonthLabel}</span>
                                    <span className="ta-tag ta-hide-m">Present: <b>{attPresentCount}</b></span>
                                    <span className="ta-tag ta-hide-m">Absent: <b>{attAbsentCount}</b></span>
                                    <span className="ta-tag ta-hide-m">Total: <b>{attendanceStudents.length}</b></span>
                                    <span className="ta-legend"><i className="done" />Marked</span>
                                    <span className="ta-legend"><i className="missed" />Not marked</span>
                                    <span className="ta-legend"><i className="off" />Sunday</span>
                                    <span className="ta-legend"><i />Upcoming</span>
                                </div>
                            </div>

                            {attendanceSubmitted && (
                                <div className="ta-success"><Check size={18} /> Attendance submitted successfully for {attendanceDate} ({attendanceSession})!</div>
                            )}

                            {isClassIncharge && selectedInchargeSection ? (
                                <>
                                    <div className="ta-summary">
                                        <div className="present"><b>{attPresentCount}</b><span>Present</span></div>
                                        <div className="absent"><b>{attAbsentCount}</b><span>Absent</span></div>
                                        <div><b>{attendanceStudents.length}</b><span>Total</span></div>
                                    </div>
                                    <div className="ta-toolbar">
                                        <label className="ta-search">
                                            <Search size={16} />
                                            <input type="text" placeholder="Search student" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                        </label>
                                        <div className="ta-filter" role="group" aria-label="Filter by status">
                                            {['all', 'present', 'absent'].map((f) => (
                                                <button key={f} type="button" className={attendanceFilter === f ? 'on' : ''} onClick={() => setAttendanceFilter(f)}>
                                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            className="ta-submit"
                                            onClick={() => setShowAttendanceConfirm(true)}
                                            disabled={isSubmitting || filteredAttendanceStudents.length === 0 || !selectedInchargeSection || attendanceDate > todayISO}
                                        >
                                            {isSubmitting ? 'Submitting...' : `Submit ${attendanceSession} Attendance`}
                                        </button>
                                    </div>

                                    <div className="ta-table-wrap">
                                        <table className="ta-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Section</th>
                                                    <th>Session</th>
                                                    <th>Attendance rate</th>
                                                    <th>Status</th>
                                                    <th aria-label="Toggle" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attRows.length === 0 ? (
                                                    <tr><td colSpan="6" className="ta-empty">No student records found in this section.</td></tr>
                                                ) : attRows.map((student) => {
                                                    const status = student.status || 'present';
                                                    return (
                                                        <tr key={student.id}>
                                                            <td>
                                                                <div className="ta-person">
                                                                    <div className="sh-avatar sm" style={{ background: avatarTone(student.name) }}>{initialOf(student.name)}</div>
                                                                    <div>
                                                                        <strong>{student.name}</strong>
                                                                        <span>#{student.admissionNo || String(student.id).slice(0, 6)}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{formatSectionTitle(student.sectionName)}<span className="ta-subcell">{student.className || ''}</span></td>
                                                            <td>{attendanceSession}</td>
                                                            <td>{student.attendanceRate ? `${student.attendanceRate}%` : '—'}</td>
                                                            <td><span className={`ta-status ${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                                                            <td className="ta-act">
                                                                <button
                                                                    type="button"
                                                                    className={`ta-circle ${status}`}
                                                                    onClick={() => toggleAttendance(student.id, status)}
                                                                    title={`Mark ${status === 'present' ? 'Absent' : 'Present'}`}
                                                                    aria-label={`Mark ${student.name} ${status === 'present' ? 'absent' : 'present'}`}
                                                                >
                                                                    {status === 'present' ? <Check size={14} /> : <X size={14} />}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="ta-cards">
                                        {attRows.length === 0 ? (
                                            <div className="ta-empty">No student records found in this section.</div>
                                        ) : attRows.map((student) => {
                                            const status = student.status || 'present';
                                            return (
                                                <div className={`ta-card ${status}`} key={student.id}>
                                                    <div className="sh-avatar sm" style={{ background: avatarTone(student.name) }}>{initialOf(student.name)}</div>
                                                    <div className="ta-card-info">
                                                        <strong>{student.name}</strong>
                                                        <span>#{student.admissionNo || String(student.id).slice(0, 6)} · {student.className || ''} {formatSectionTitle(student.sectionName)}</span>
                                                    </div>
                                                    <span className="ta-card-rate" title="Attendance rate">{student.attendanceRate ? `${student.attendanceRate}%` : '—'}</span>
                                                    <div className="ta-seg" role="group" aria-label={`Attendance for ${student.name}`}>
                                                        <button
                                                            type="button"
                                                            className={status === 'present' ? 'on present' : ''}
                                                            aria-pressed={status === 'present'}
                                                            onClick={() => status !== 'present' && toggleAttendance(student.id, status)}
                                                        >
                                                            <Check size={14} /> Present
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={status === 'absent' ? 'on absent' : ''}
                                                            aria-pressed={status === 'absent'}
                                                            onClick={() => status !== 'absent' && toggleAttendance(student.id, status)}
                                                        >
                                                            <X size={14} /> Absent
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        className="ta-submit ta-submit-end"
                                        onClick={() => setShowAttendanceConfirm(true)}
                                        disabled={isSubmitting || filteredAttendanceStudents.length === 0 || !selectedInchargeSection || attendanceDate > todayISO}
                                    >
                                        {isSubmitting ? 'Submitting...' : `Submit ${attendanceSession} Attendance`}
                                    </button>
                                </>
                            ) : (
                                <div className="ta-locked">
                                    <h4>Attendance is locked</h4>
                                    <p>
                                        Only the teacher assigned as Class Incharge for a section can mark attendance.
                                        Ask an admin to assign you as Class Incharge from the admin dashboard.
                                    </p>
                                </div>
                            )}

                            {showAttendanceConfirm && (() => {
                                const absentList = attendanceStudents.filter((st) => (st.status || 'present') === 'absent');
                                const sectionLabel = selectedInchargeSection
                                    ? `${selectedInchargeSection.className || 'Class'} ${selectedInchargeSection.name ? `(${formatSectionTitle(selectedInchargeSection.name)})` : ''}`
                                    : '';
                                return (
                                    <div className="ta-modal-backdrop" onClick={() => { if (!isSubmitting) setShowAttendanceConfirm(false); }}>
                                        <div className="ta-modal" role="dialog" aria-modal="true" aria-labelledby="ta-confirm-title" onClick={(e) => e.stopPropagation()}>
                                            <div className="ta-modal-head">
                                                <h3 id="ta-confirm-title">Review before submitting</h3>
                                                <p>{attendanceDate} · {attendanceSession} session{sectionLabel ? ` · ${sectionLabel}` : ''}</p>
                                            </div>

                                            <div className="ta-modal-stats">
                                                <div className="present"><b>{attPresentCount}</b><span>Present</span></div>
                                                <div className="absent"><b>{absentList.length}</b><span>Absent</span></div>
                                                <div><b>{attendanceStudents.length}</b><span>Total</span></div>
                                            </div>

                                            <div className="ta-modal-body">
                                                <h4>Absent students ({absentList.length})</h4>
                                                {absentList.length === 0 ? (
                                                    <div className="ta-modal-empty">
                                                        <CheckCircle size={22} />
                                                        <span>No absentees. All {attendanceStudents.length} students are marked present.</span>
                                                    </div>
                                                ) : (
                                                    <ul className="ta-modal-list">
                                                        {absentList.map((student) => (
                                                            <li key={student.id}>
                                                                <div className="sh-avatar sm" style={{ background: avatarTone(student.name) }}>{initialOf(student.name)}</div>
                                                                <div className="ta-modal-who">
                                                                    <strong>{student.name}</strong>
                                                                    <span>#{student.admissionNo || String(student.id).slice(0, 6)} · {student.className || ''} {formatSectionTitle(student.sectionName)}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="ta-modal-fix"
                                                                    disabled={isSubmitting}
                                                                    onClick={() => toggleAttendance(student.id, 'absent')}
                                                                    title={`Mark ${student.name} present`}
                                                                >
                                                                    <Check size={13} /> Mark present
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>

                                            <div className="ta-modal-foot">
                                                <button type="button" className="ta-modal-back" onClick={() => setShowAttendanceConfirm(false)} disabled={isSubmitting}>
                                                    <ArrowLeft size={15} /> Go back &amp; edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="ta-modal-ok"
                                                    disabled={isSubmitting}
                                                    onClick={async () => {
                                                        await handleSubmitAttendance();
                                                        setShowAttendanceConfirm(false);
                                                    }}
                                                >
                                                    {isSubmitting ? 'Submitting...' : 'Confirm & submit'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
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

                    {activeTab === 'marks' && (() => {
                        const compositeKey = getExamSubjectKey();
                        const valueFor = (student) => studentMarks[student.id] ?? (student.marksDraft?.[compositeKey] ?? '');
                        const hasValue = (v) => v !== '' && v !== null && v !== undefined;
                        const isOutOfRange = (v) => hasValue(v) && (Number(v) < 0 || Number(v) > 100);
                        const initialsOf = (name) => (name || 'S').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
                        const totalCount = marksFilteredStudents.length;
                        const enteredCount = marksFilteredStudents.filter(s => hasValue(valueFor(s))).length;
                        const sectionLabel = selectedSection ? formatSectionTitle(selectedSection.name) : 'All sections';
                        const statusMessage =
                            marksActionStatus === 'saved' ? 'Marks saved as draft.' :
                                marksActionStatus === 'reset' ? 'Class draft scores reset.' :
                                    marksActionStatus;

                        return (
                            <div className="dash-card full-width mk">
                                <div className="mk-head">
                                    <h3>Marks entry</h3>
                                    <p className="subtitle">Scores are saved as drafts and sent to Admin for review and publishing.</p>
                                </div>

                                {marksActionStatus && (
                                    <div className={`mk-note ${marksActionStatus === 'reset' ? 'is-reset' : 'is-ok'}`} role="status">
                                        <Check size={16} /> {statusMessage}
                                    </div>
                                )}

                                {myTaughtClasses.length === 0 ? (
                                    <div className="empty-sub-card">
                                        <AlertCircle size={28} />
                                        <h4>No timetable assignment yet</h4>
                                        <p>Ask the admin to add you to the timetable before entering marks.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mk-bar">
                                            <div className="mk-field">
                                                <label htmlFor="mk-class">Class</label>
                                                <select
                                                    id="mk-class"
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

                                            <div className="mk-field">
                                                <label htmlFor="mk-section">Section</label>
                                                <select
                                                    id="mk-section"
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
                                                    <option value="">All my sections</option>
                                                    {sectionsList
                                                        .filter(s => s.className === selectedClass && getMyTaughtSectionsForClass(selectedClass).some(name => cleanString(name) === cleanString(s.name)))
                                                        .map(sec => (
                                                            <option key={sec.id} value={sec.name}>{formatSectionTitle(sec.name)}</option>
                                                        ))}
                                                </select>
                                            </div>

                                            <div className="mk-field">
                                                <label htmlFor="mk-exam">Exam</label>
                                                <select
                                                    id="mk-exam"
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

                                            <div className="mk-field">
                                                <label htmlFor="mk-subject">Subject</label>
                                                <select
                                                    id="mk-subject"
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

                                        <div className="mk-split">
                                            <div className="mk-main">
                                                {totalCount === 0 ? (
                                                    <div className="empty-sub-card">
                                                        <Users size={28} />
                                                        <h4>No students to mark</h4>
                                                        <p>No students match this class, section and subject that you teach.</p>
                                                    </div>
                                                ) : (
                                                    <div className="mk-list">
                                                        {marksFilteredStudents.map((student) => {
                                                            const currentVal = valueFor(student);
                                                            const entered = hasValue(currentVal);
                                                            const invalid = isOutOfRange(currentVal);
                                                            return (
                                                                <article key={student.id} className={`mk-row ${invalid ? 'is-invalid' : entered ? 'is-entered' : ''}`}>
                                                                    <span className="mk-avatar" aria-hidden="true">{initialsOf(student.name)}</span>
                                                                    <div className="mk-who">
                                                                        <strong>{student.name}</strong>
                                                                        <span>Adm. #{student.admissionNo || student.id.slice(0, 6)}</span>
                                                                        <span className="task-target-tag">{formatSectionTitle(student.sectionName)}</span>
                                                                    </div>
                                                                    <div className="mk-entry">
                                                                        <label className="mk-score-wrap">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                placeholder="0"
                                                                                aria-label={`${selectedSubject} score for ${student.name}, out of 100`}
                                                                                aria-invalid={invalid}
                                                                                className="mk-score"
                                                                                value={currentVal}
                                                                                onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                                            />
                                                                            <span>/ 100</span>
                                                                        </label>
                                                                        <button
                                                                            type="button"
                                                                            className="mk-icon-btn is-save"
                                                                            title="Save draft"
                                                                            aria-label={`Save draft for ${student.name}`}
                                                                            onClick={() => handleSaveSingleMark(student.id)}
                                                                        >
                                                                            <Save size={14} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="mk-icon-btn is-reset"
                                                                            title="Clear this mark"
                                                                            aria-label={`Clear mark for ${student.name}`}
                                                                            onClick={() => handleResetSingleMark(student.id)}
                                                                        >
                                                                            <RotateCcw size={14} />
                                                                        </button>
                                                                    </div>
                                                                </article>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <aside className="mk-rail">
                                                <h3>{selectedSubject || 'Subject'}</h3>
                                                <p className="mk-ctx">{examType}</p>
                                                <p className="mk-ctx">{selectedClass}, {sectionLabel}</p>

                                                <p className="mk-progress">{enteredCount} of {totalCount} scores entered</p>
                                                <span className="mk-bar-track" aria-hidden="true"><i style={{ width: `${totalCount ? Math.round((enteredCount / totalCount) * 100) : 0}%` }} /></span>

                                                <button
                                                    type="button"
                                                    className="mk-btn is-solid"
                                                    onClick={handleSaveMarksDraft}
                                                    disabled={isSubmitting || totalCount === 0}
                                                >
                                                    <Save size={15} /> Save all as draft
                                                </button>
                                                <button
                                                    type="button"
                                                    className="mk-btn"
                                                    onClick={handleResetAllExamMarks}
                                                    disabled={isSubmitting || totalCount === 0}
                                                >
                                                    <RotateCcw size={14} /> Clear all drafts
                                                </button>
                                            </aside>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                    {activeTab === 'assignments' && (() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const dueInfo = (raw) => {
                            const d = raw ? new Date(`${raw}T00:00:00`) : null;
                            if (!d || Number.isNaN(d.getTime())) return { day: '--', month: '', state: 'none', note: '' };
                            const diff = Math.round((d - today) / 86400000);
                            let state = 'ok';
                            let note = '';
                            if (diff < 0) { state = 'past'; note = 'Past due'; }
                            else if (diff === 0) { state = 'soon'; note = 'Due today'; }
                            else if (diff <= 3) { state = 'soon'; note = diff === 1 ? 'Due tomorrow' : `Due in ${diff} days`; }
                            return { day: d.getDate(), month: MONTHS[d.getMonth()], state, note };
                        };
                        const typeOptions = [
                            ['Assignment', 'Homework'],
                            ['Project', 'Project'],
                            ['Class Test', 'Class test']
                        ];

                        return (
                            <div className="dash-card full-width tsk">
                                {workSwitch}

                                <div className="tsk-split">
                                    {/* ---------- Assigned coursework ---------- */}
                                    <section className="tsk-main" aria-labelledby="tsk-list-title">
                                        <h4 id="tsk-list-title">Assigned coursework <span className="tsk-count">{assignmentsList.length}</span></h4>

                                        {assignmentsList.length === 0 ? (
                                            <div className="empty-sub-card">
                                                <Layers size={28} />
                                                <h4>Nothing assigned yet</h4>
                                                <p>Use the form to give a class its first task.</p>
                                            </div>
                                        ) : (
                                            <div className="tsk-list">
                                                {assignmentsList.map(task => {
                                                    const due = dueInfo(task.dueDate);
                                                    const taskSubs = submissionsList.filter(s =>
                                                        cleanString(s.className) === cleanString(task.className) &&
                                                        cleanString(s.sectionName) === cleanString(task.sectionName) &&
                                                        cleanString(s.taskTitle) === cleanString(task.title)
                                                    );
                                                    const taskPending = taskSubs.filter(s => s.obtainedMarks === undefined || s.obtainedMarks === null || s.obtainedMarks === '').length;
                                                    return (
                                                        <article key={task.id} className={`tsk-item is-${due.state}`}>
                                                            <div className="tsk-date" aria-hidden={due.state === 'none'}>
                                                                <b>{due.day}</b>
                                                                <span>{due.month}</span>
                                                            </div>

                                                            <div className="tsk-body">
                                                                <div className="tsk-top">
                                                                    <span className={`task-badge badge-${(task.type || '').toLowerCase().replace(/\s+/g, '')}`}>
                                                                        {task.type}
                                                                    </span>
                                                                    <span className="tsk-target">
                                                                        {task.className}, {formatSectionTitle(task.sectionName)}
                                                                    </span>
                                                                    {due.note && <span className={`tsk-note is-${due.state}`}>{due.note}</span>}
                                                                </div>
                                                                <h5>{task.title}</h5>
                                                                <p className="tsk-subject">{task.subject}, due {task.dueDate}</p>
                                                                {task.description && <p className="tsk-desc">{task.description}</p>}
                                                                <div className="tsk-foot">
                                                                    <span className="tsk-by">Assigned by {task.staffName || 'Faculty'}</span>
                                                                    <button
                                                                        type="button"
                                                                        className="tsk-review"
                                                                        onClick={() => {
                                                                            setSubClassFilter(task.className);
                                                                            setSubSectionFilter(task.sectionName);
                                                                            setSubmissionFilterStatus(taskPending > 0 ? 'pending' : 'all');
                                                                            setActiveTab('submissions');
                                                                        }}
                                                                    >
                                                                        <FileCheck size={13} />
                                                                        {taskSubs.length === 0
                                                                            ? 'No submissions yet'
                                                                            : taskPending > 0
                                                                                ? `Grade ${taskPending} of ${taskSubs.length} submitted`
                                                                                : `All ${taskSubs.length} graded`}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="tsk-actions">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingAssignment({ ...task })}
                                                                    className="edit-task-btn"
                                                                    title="Edit task"
                                                                    aria-label={`Edit ${task.title}`}
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteAssignment(task.id)}
                                                                    className="delete-task-btn"
                                                                    title="Delete task"
                                                                    aria-label={`Delete ${task.title}`}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>

                                    {/* ---------- New task form ---------- */}
                                    <form onSubmit={handleCreateAssignment} className="tsk-form">
                                        <h4>New task</h4>

                                        <fieldset className="tsk-field tsk-type">
                                            <legend>Type</legend>
                                            <div className="tsk-seg">
                                                {typeOptions.map(([val, label]) => (
                                                    <label key={val} className={assignmentForm.type === val ? 'is-on' : ''}>
                                                        <input
                                                            type="radio"
                                                            name="tsk-type"
                                                            value={val}
                                                            checked={assignmentForm.type === val}
                                                            onChange={(e) => setAssignmentForm({ ...assignmentForm, type: e.target.value })}
                                                        />
                                                        {label}
                                                    </label>
                                                ))}
                                            </div>
                                        </fieldset>

                                        <div className="tsk-pair">
                                            <div className="tsk-field">
                                                <label htmlFor="tsk-class">Class</label>
                                                <select
                                                    id="tsk-class"
                                                    className="custom-select full-width"
                                                    value={assignmentForm.className}
                                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, className: e.target.value, sectionName: '' })}
                                                    required
                                                >
                                                    <option value="">Select class</option>
                                                    {classList.map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="tsk-field">
                                                <label htmlFor="tsk-section">Section</label>
                                                <select
                                                    id="tsk-section"
                                                    className="custom-select full-width"
                                                    value={assignmentForm.sectionName}
                                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, sectionName: e.target.value })}
                                                    disabled={!assignmentForm.className}
                                                    required
                                                >
                                                    <option value="">Select section</option>
                                                    {sectionsList
                                                        .filter(s => s.className === assignmentForm.className)
                                                        .map(sec => (
                                                            <option key={sec.id} value={sec.name}>{formatSectionTitle(sec.name)}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="tsk-pair">
                                            <div className="tsk-field">
                                                <label htmlFor="tsk-subject">Subject</label>
                                                <input
                                                    id="tsk-subject"
                                                    type="text"
                                                    className="table-input full-width-input"
                                                    placeholder="e.g. Mathematics"
                                                    value={assignmentForm.subject}
                                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div className="tsk-field">
                                                <label htmlFor="tsk-date">Due or exam date</label>
                                                <input
                                                    id="tsk-date"
                                                    type="date"
                                                    className="table-input full-width-input"
                                                    value={assignmentForm.dueDate}
                                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="tsk-field">
                                            <label htmlFor="tsk-title">Title</label>
                                            <input
                                                id="tsk-title"
                                                type="text"
                                                className="table-input full-width-input"
                                                placeholder="e.g. Chapter 4 trigonometry worksheet"
                                                value={assignmentForm.title}
                                                onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="tsk-field">
                                            <label htmlFor="tsk-desc">Instructions</label>
                                            <textarea
                                                id="tsk-desc"
                                                rows="3"
                                                className="custom-textarea"
                                                placeholder="Page numbers, what to submit, or the exam syllabus"
                                                value={assignmentForm.description}
                                                onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                                            />
                                        </div>

                                        <button type="submit" className="btn-primary tsk-submit">
                                            <PlusCircle size={15} /> Assign to class
                                        </button>
                                    </form>
                                </div>
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
                        );
                    })()}

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

                    {activeTab === 'submissions' && (() => {
                        const isGraded = (s) => s.obtainedMarks !== undefined && s.obtainedMarks !== null && s.obtainedMarks !== '';
                        const initialsOf = (name) => (name || 'S').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
                        const pctOf = (done, total) => (total ? Math.round((done / total) * 100) : 0);
                        const subsFor = (cls, sec) => submissionsList.filter(s =>
                            cleanString(s.className) === cleanString(cls) &&
                            (sec === undefined || cleanString(s.sectionName) === cleanString(sec))
                        );
                        const backToClasses = () => {
                            setSubClassFilter(null);
                            setSubSectionFilter(null);
                            setSubmissionFilterStatus('all');
                        };
                        const backToSections = () => {
                            setSubSectionFilter(null);
                            setSubmissionFilterStatus('all');
                        };
                        const allGraded = submissionsList.filter(isGraded).length;
                        const allPending = submissionsList.length - allGraded;
                        const rosterFilters = [
                            ['all', 'All turned in', sectionSubmissions.length],
                            ['pending', 'Needs review', pendingReviewCount],
                            ['completed', 'Graded', completedCount],
                            ['unsubmitted', 'Not turned in', unsubmittedStudentList.length]
                        ];

                        return (
                            <div className="dash-card full-width asm">

                                {/* ---------- Screen 1: pick a class ---------- */}
                                {!subClassFilter && (
                                    <>
                                        {workSwitch}
                                        <div className="asm-head">
                                            <div>
                                                <h4>Choose a class to grade</h4>
                                                <p className="subtitle">Review the PDFs your students have turned in.</p>
                                            </div>
                                            <div className="asm-totals">
                                                <div className={`asm-total ${allPending > 0 ? 'is-alert' : ''}`}>
                                                    <b>{allPending}</b><span>Waiting for review</span>
                                                </div>
                                                <div className="asm-total">
                                                    <b>{allGraded}</b><span>Graded</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="asm-tiles">
                                            {classList.map((cls) => {
                                                const subs = subsFor(cls);
                                                const graded = subs.filter(isGraded).length;
                                                const pending = subs.length - graded;
                                                const secCount = sectionsList.filter(s => s.className === cls).length;
                                                return (
                                                    <button
                                                        key={cls}
                                                        type="button"
                                                        className="asm-tile"
                                                        onClick={() => {
                                                            setSubClassFilter(cls);
                                                            setSubSectionFilter(null);
                                                            setSubmissionFilterStatus('all');
                                                        }}
                                                    >
                                                        <span className="asm-tile-name">{cls}</span>
                                                        <span className="asm-tile-meta">
                                                            <span>{secCount} {secCount === 1 ? 'section' : 'sections'}</span>
                                                            <span>{subs.length} turned in</span>
                                                        </span>
                                                        <span className="asm-bar" aria-hidden="true"><i style={{ width: `${pctOf(graded, subs.length)}%` }} /></span>
                                                        <span className="asm-tile-foot">
                                                            {subs.length === 0
                                                                ? <b className="asm-pill">Nothing yet</b>
                                                                : pending > 0
                                                                    ? <b className="asm-pill is-warn">{pending} to review</b>
                                                                    : <b className="asm-pill is-ok">All graded</b>}
                                                            <ChevronRight size={16} />
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {/* ---------- Screen 2: pick a section ---------- */}
                                {subClassFilter && !subSectionFilter && (
                                    <>
                                        <nav className="asm-crumbs" aria-label="Breadcrumb">
                                            <button type="button" onClick={backToClasses}><ArrowLeft size={15} /> All classes</button>
                                            <ChevronRight size={14} />
                                            <span aria-current="page">{subClassFilter}</span>
                                        </nav>
                                        <div className="asm-head">
                                            <div>
                                                <h3>{subClassFilter}</h3>
                                                <p className="subtitle">Choose a section to see its submissions.</p>
                                            </div>
                                        </div>

                                        {sectionsList.filter(s => s.className === subClassFilter).length === 0 ? (
                                            <div className="empty-sub-card">No sections created for {subClassFilter}.</div>
                                        ) : (
                                            <div className="asm-rows">
                                                {sectionsList.filter(s => s.className === subClassFilter).map(sec => {
                                                    const subs = subsFor(subClassFilter, sec.name);
                                                    const graded = subs.filter(isGraded).length;
                                                    const pending = subs.length - graded;
                                                    return (
                                                        <button
                                                            key={sec.id}
                                                            type="button"
                                                            className="asm-sec"
                                                            onClick={() => {
                                                                setSubSectionFilter(sec.name);
                                                                setSubmissionFilterStatus('all');
                                                            }}
                                                        >
                                                            <span className="asm-sec-icon"><Folder size={20} /></span>
                                                            <span className="asm-sec-body">
                                                                <strong>{formatSectionTitle(sec.name)}</strong>
                                                                <span className="asm-bar" aria-hidden="true"><i style={{ width: `${pctOf(graded, subs.length)}%` }} /></span>
                                                                <small>{subs.length === 0 ? 'No PDFs turned in yet' : `${graded} of ${subs.length} graded`}</small>
                                                            </span>
                                                            {pending > 0 && <b className="asm-pill is-warn">{pending} to review</b>}
                                                            <ChevronRight size={16} className="asm-sec-arrow" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* ---------- Screen 3: roster + grading ---------- */}
                                {subClassFilter && subSectionFilter && (
                                    <>
                                        <nav className="asm-crumbs" aria-label="Breadcrumb">
                                            <button type="button" onClick={backToClasses}>All classes</button>
                                            <ChevronRight size={14} />
                                            <button type="button" onClick={backToSections}><ArrowLeft size={15} /> {subClassFilter}</button>
                                            <ChevronRight size={14} />
                                            <span aria-current="page">{formatSectionTitle(subSectionFilter)}</span>
                                        </nav>

                                        <div className="asm-split">
                                            <aside className="asm-side">
                                                <h3>{subClassFilter}, {formatSectionTitle(subSectionFilter)}</h3>
                                                <p className="asm-side-progress">
                                                    {completedCount} of {sectionSubmissions.length} graded
                                                </p>
                                                <span className="asm-bar on-dark" aria-hidden="true"><i style={{ width: `${pctOf(completedCount, sectionSubmissions.length)}%` }} /></span>

                                                <div className="asm-filters" role="tablist" aria-label="Filter submissions">
                                                    {rosterFilters.map(([key, label, count]) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            role="tab"
                                                            aria-selected={submissionFilterStatus === key}
                                                            className={submissionFilterStatus === key ? 'is-active' : ''}
                                                            onClick={() => setSubmissionFilterStatus(key)}
                                                        >
                                                            <span>{label}</span>
                                                            <b>{count}</b>
                                                        </button>
                                                    ))}
                                                </div>
                                            </aside>

                                            <div className="asm-main">
                                                {submissionFilterStatus === 'unsubmitted' ? (
                                                    unsubmittedStudentList.length === 0 ? (
                                                        <div className="empty-sub-card">
                                                            <CheckCircle size={32} color="var(--accent-emerald)" />
                                                            <h4>Everyone has turned in their work</h4>
                                                            <p>Every student in this section has submitted their PDF.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="asm-people">
                                                            {unsubmittedStudentList.map((item, idx) => (
                                                                <article className="asm-person" key={`${item.student.id}_${item.task.id}_${idx}`}>
                                                                    <img
                                                                        src={item.student.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                                                                        alt=""
                                                                        className="asm-photo"
                                                                    />
                                                                    <div className="asm-person-body">
                                                                        <strong>{item.student.name}</strong>
                                                                        <span>Adm. #{item.student.admissionNo || 'N/A'}</span>
                                                                        <span className="topic-badge">{item.task.title} ({item.task.subject})</span>
                                                                        <span className="asm-due"><Clock size={12} /> Due {item.task.dueDate}</span>
                                                                        <span className="asm-contact">{item.student.guardianName || 'Parent'}, {item.student.phone || 'N/A'}</span>
                                                                    </div>
                                                                </article>
                                                            ))}
                                                        </div>
                                                    )
                                                ) : (
                                                    displayedSubmissions.length === 0 ? (
                                                        <div className="empty-sub-card">
                                                            <FileText size={32} />
                                                            <h4>No submissions found</h4>
                                                            <p>Nothing matches this filter yet.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="asm-list">
                                                            {displayedSubmissions.map((sub) => {
                                                                const currentGrade = submissionGrades[sub.id] ?? (sub.obtainedMarks ?? '');
                                                                const graded = isGraded(sub);
                                                                return (
                                                                    <article key={sub.id} className={`asm-row ${graded ? 'is-graded' : 'is-pending'}`}>
                                                                        <div className="asm-who">
                                                                            <span className="asm-avatar" aria-hidden="true">{initialsOf(sub.studentName)}</span>
                                                                            <div>
                                                                                <strong>{sub.studentName || 'Student'}</strong>
                                                                                <span>Adm. #{sub.admissionNo || 'N/A'}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="asm-work">
                                                                            <div className="asm-work-top">
                                                                                <span className="topic-badge">{sub.taskTitle || 'Assignment'}</span>
                                                                                {graded ? (
                                                                                    <span className="asm-chip is-graded"><Check size={11} /> Graded, {sub.obtainedMarks}</span>
                                                                                ) : (
                                                                                    <span className="asm-chip is-pending"><Clock size={11} /> Needs review</span>
                                                                                )}
                                                                            </div>
                                                                            <a href={sub.pdfData} target="_blank" rel="noreferrer" className="pdf-preview-link">
                                                                                <ExternalLink size={13} /> {sub.fileName || 'Document.pdf'}
                                                                            </a>
                                                                            <span className="asm-date">
                                                                                {sub.submittedAt?.toDate ? sub.submittedAt.toDate().toLocaleString() : 'Recently submitted'}
                                                                            </span>
                                                                        </div>

                                                                        <div className="asm-grade">
                                                                            <label className="asm-score-wrap">
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    max="100"
                                                                                    placeholder="0"
                                                                                    aria-label={`Score for ${sub.studentName || 'student'} out of 100`}
                                                                                    className="asm-score"
                                                                                    value={currentGrade}
                                                                                    onChange={(e) => setSubmissionGrades({
                                                                                        ...submissionGrades,
                                                                                        [sub.id]: e.target.value
                                                                                    })}
                                                                                />
                                                                                <span>/ 100</span>
                                                                            </label>
                                                                            <button
                                                                                type="button"
                                                                                className="btn-save-grade"
                                                                                onClick={() => handleSaveSubmissionGrade(sub.id, sub.studentId, sub.taskTitle)}
                                                                                disabled={gradingLoadingId === sub.id}
                                                                            >
                                                                                {gradingLoadingId === sub.id ? 'Saving...' : <><Award size={13} /> Save grade</>}
                                                                            </button>
                                                                        </div>
                                                                    </article>
                                                                );
                                                            })}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                    {activeTab === 'schedule' && (
                        <div className="dash-card full-width stt-card">
                            <div className="stt-head">
                                <div>
                                    <h3>My Weekly Timetable</h3>
                                    <p className="stt-sub">Synchronized live with administrator and faculty allocations</p>
                                </div>
                                <div className="stt-actions">
                                    <button type="button" className="stt-btn" onClick={exportTimetableCsv}>
                                        <Download size={15} /> Export CSV
                                    </button>
                                    <button type="button" className="stt-btn primary" onClick={printTimetable}>
                                        <Printer size={15} /> Print Timetable
                                    </button>
                                </div>
                            </div>

                            <div className="stt-wrap">
                                <table className="stt-table">
                                    <thead>
                                        <tr>
                                            <th className="stt-corner">Day</th>
                                            {ttColumns.map((col) => (
                                                <th key={col.key}>{col.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ttDays.map((day) => (
                                            <tr key={day}>
                                                <th className="stt-day">{day}</th>
                                                {ttColumns.map((col) => {
                                                    const items = ttCell(day, col.key);
                                                    return (
                                                        <td key={col.key}>
                                                            {items.map((item, idx) => (
                                                                <div key={item.id || idx} className="stt-slot">
                                                                    <strong>{item.subject || 'Subject'}</strong>
                                                                    <span>{ttClassLabel(item)}</span>
                                                                    <em>Rm: {item.roomNo || 'N/A'}</em>
                                                                </div>
                                                            ))}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {mySchedule.length === 0 && (
                                <p className="stt-empty">No timetable slots mapped to your staff profile yet.</p>
                            )}
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
                        <div className={`sh-chat ${activeChatId ? 'has-thread' : ''}`}>
                            {renderChatListPane('chats')}

                            <div className="sh-thread">
                                {!activeChatId ? (
                                    <div className="sh-empty">
                                        <MessageCircle size={36} />
                                        <h4>Your messages</h4>
                                        <p>Select a conversation, or start a new chat with the + button.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="sh-thread-head">
                                            <button type="button" className="sh-back" onClick={() => { setActiveChatId(null); setActiveChatInfo(null); }} aria-label="Back to chats"><ChevronLeft size={20} /></button>
                                            <div className="sh-avatar" style={{ background: avatarTone(activeChatInfo?.name) }}>{initialOf(activeChatInfo?.name)}</div>
                                            <div className="sh-thread-title">
                                                <strong>{activeChatInfo?.name}</strong>
                                                <span>{activeChatInfo?.department} Department</span>
                                            </div>
                                            <button type="button" className="sh-icon-btn danger" onClick={deleteConversationForMe} title="Delete chat" aria-label="Delete chat">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="sh-thread-body">
                                            {activeChatMessages.length === 0 ? (
                                                <div className="sh-empty small">
                                                    <MessageCircle size={26} />
                                                    <p>No messages yet. Say hello!</p>
                                                </div>
                                            ) : (
                                                activeChatMessages.map((msg) => {
                                                    const mine = msg.senderId === staffData.staffId;
                                                    const sender = mine ? staffData.name : (msg.senderName || activeChatInfo?.name);
                                                    const role = mine ? staffData.department : activeChatInfo?.department;
                                                    return (
                                                        <div key={msg.id} className={`sh-msg ${mine ? 'mine' : ''}`}>
                                                            <div className="sh-avatar sm" style={{ background: avatarTone(sender) }}>{initialOf(sender)}</div>
                                                            <div className={`sh-bubble ${msg.type === 'request' ? 'is-request' : ''}`}>
                                                                <div className="sh-bubble-head">
                                                                    <strong style={{ color: nameColor(sender) }}>{mine ? 'You' : sender}</strong>
                                                                    <span>{role}</span>
                                                                </div>
                                                                {msg.type === 'request' && <span className="request-tag">Request</span>}
                                                                <p>{msg.text}</p>
                                                                <div className="sh-bubble-foot">
                                                                    {mine && (
                                                                        <button type="button" className="sh-msg-del" onClick={() => deleteChatMessage(msg.id)} title="Delete message" aria-label="Delete message">
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    )}
                                                                    <time>{fmtClock(msg.createdAt)}</time>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div className="sh-compose">
                                            <input
                                                type="text"
                                                placeholder="Type your message"
                                                value={chatMessageInput}
                                                onChange={(e) => setChatMessageInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                                            />
                                            <button type="button" className="sh-send" onClick={sendChatMessage} disabled={!chatMessageInput.trim()} aria-label="Send message">
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {activeChatId && (
                                <aside className="sh-info">
                                    <div className="sh-info-head"><h4>Contact Info</h4></div>
                                    <div className="sh-info-hero">
                                        <div className="sh-avatar xl" style={{ background: avatarTone(activeChatInfo?.name) }}>{initialOf(activeChatInfo?.name)}</div>
                                        <strong>{activeChatInfo?.name}</strong>
                                        <span>Staff • {activeChatInfo?.department}</span>
                                    </div>
                                    <div className="sh-info-section">
                                        <h5><FileText size={15} /> Description</h5>
                                        <p>Direct conversation with {activeChatInfo?.name} from the {activeChatInfo?.department} department.</p>
                                    </div>
                                    <div className="sh-info-section">
                                        <h5><Users size={15} /> Members</h5>
                                        <div className="sh-member">
                                            <div className="sh-avatar sm" style={{ background: avatarTone(staffData.name) }}>{initialOf(staffData.name)}</div>
                                            <div><strong>{staffData.name} (You)</strong><span>{staffData.department}</span></div>
                                        </div>
                                        <div className="sh-member">
                                            <div className="sh-avatar sm" style={{ background: avatarTone(activeChatInfo?.name) }}>{initialOf(activeChatInfo?.name)}</div>
                                            <div><strong>{activeChatInfo?.name}</strong><span>{activeChatInfo?.department}</span></div>
                                        </div>
                                    </div>
                                    {activeChatMember && (
                                        <button type="button" className="sh-info-btn" onClick={() => openRequestModal(activeChatMember)}>
                                            <SendHorizonal size={15} /> Send a request
                                        </button>
                                    )}
                                </aside>
                            )}
                        </div>
                    )}

                    {activeTab === 'staffroom' && (
                        <div className="sh-chat has-thread">
                            {renderChatListPane('room')}

                            <div className="sh-thread">
                                <div className="sh-thread-head">
                                    <div className="sh-avatar room"><Users size={20} /></div>
                                    <div className="sh-thread-title">
                                        <strong>Staff Room</strong>
                                        <span>{allStaffMembers.length} members · a shared space for all faculty</span>
                                    </div>
                                    <button type="button" className="sh-icon-btn danger" onClick={clearMyStaffRoomMessages} title="Delete my Staff Room messages" aria-label="Delete my Staff Room messages">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="sh-thread-body">
                                    {staffRoomMessages.length === 0 ? (
                                        <div className="sh-empty small">
                                            <Users size={28} />
                                            <p>No messages yet. Be the first to say hello!</p>
                                        </div>
                                    ) : (
                                        staffRoomMessages.map((msg) => {
                                            const mine = msg.senderId === staffData.staffId;
                                            return (
                                                <div key={msg.id} className={`sh-msg ${mine ? 'mine' : ''}`}>
                                                    <div className="sh-avatar sm" style={{ background: avatarTone(msg.senderName) }}>{initialOf(msg.senderName)}</div>
                                                    <div className="sh-bubble">
                                                        <div className="sh-bubble-head">
                                                            <strong style={{ color: nameColor(msg.senderName) }}>{mine ? 'You' : msg.senderName}</strong>
                                                            <span>{msg.department || 'General'}</span>
                                                        </div>
                                                        <p>{msg.text}</p>
                                                        <div className="sh-bubble-foot">
                                                            {mine && (
                                                                <button type="button" className="sh-msg-del" onClick={() => deleteStaffRoomMessage(msg.id)} title="Delete message" aria-label="Delete message">
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            )}
                                                            <time>{fmtClock(msg.createdAt)}</time>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="sh-compose">
                                    <input
                                        type="text"
                                        placeholder="Message the staff room"
                                        value={staffRoomInput}
                                        onChange={(e) => setStaffRoomInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') sendStaffRoomMessage(); }}
                                    />
                                    <button type="button" className="sh-send" onClick={sendStaffRoomMessage} disabled={!staffRoomInput.trim()} aria-label="Send message">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>

                            <aside className="sh-info">
                                <div className="sh-info-head"><h4>Group Info</h4></div>
                                <div className="sh-info-hero">
                                    <div className="sh-avatar xl room"><Users size={44} /></div>
                                    <strong>Staff Room</strong>
                                    <span>Group • {allStaffMembers.length} members</span>
                                </div>
                                <div className="sh-info-section">
                                    <h5><FileText size={15} /> Description</h5>
                                    <p>Your go-to hub for seamless communication and coordination among faculty. Share updates, ask for help, or just connect with your colleagues.</p>
                                </div>
                                <div className="sh-info-section">
                                    <div className="sh-info-row">
                                        <h5><Users size={15} /> Members</h5>
                                        <button type="button" onClick={() => setActiveTab('departments')}>View All</button>
                                    </div>
                                    {allStaffMembers.slice(0, 6).map((m, i) => (
                                        <div key={m.staffId || m.id || i} className="sh-member">
                                            <div className="sh-avatar sm" style={{ background: avatarTone(m.name) }}>{initialOf(m.name)}</div>
                                            <div><strong>{m.name}</strong><span>{m.department || 'General'}</span></div>
                                        </div>
                                    ))}
                                </div>
                            </aside>
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

                    {activeTab === 'entrance-exams' && (
                        <div className="dash-card full-width ent-card">
                            {!selectedEntranceApp ? (
                                <>
                                    <div className="card-header">
                                        <div>
                                            <h3>Entrance Exam — Assigned Applicants</h3>
                                            <p className="subtitle">Applicants the office has assigned to you. Open one to enter the subject-wise marks.</p>
                                        </div>
                                        <span className="exam-sync-pill"><CheckCircle size={13} /> Live Synced</span>
                                    </div>

                                    {entranceApps.length === 0 ? (
                                        <div className="empty-sub-card">
                                            <ClipboardList size={30} />
                                            <h4>No Applicants Assigned</h4>
                                            <p>The office has not assigned any entrance exam applicants to you yet.</p>
                                        </div>
                                    ) : (
                                        <div className="exam-hall-grid">
                                            {entranceApps.map(a => (
                                                <button type="button" className="exam-hall-card ent-app" key={a.id} onClick={() => openEntranceApp(a)}>
                                                    <div className="exam-hall-card-top">
                                                        <span className="exam-hall-room">{a.examAssignment?.roomNo ? `Room ${a.examAssignment.roomNo}` : 'Room —'}</span>
                                                        <span className={`ent-pill ${a.marksSubmitted ? 'done' : 'todo'}`}>{a.marksSubmitted ? 'Marks submitted' : a.reexamCount ? 'Re-exam · marks pending' : 'Marks pending'}</span>
                                                    </div>
                                                    <h4>{entranceName(a)}</h4>
                                                    <div className="exam-hall-meta">
                                                        <span><GraduationCap size={14} /> Class {a.grade || '—'}</span>
                                                        <span><Calendar size={14} /> {a.examAssignment?.date || 'Date not set'}</span>
                                                        <span><Building2 size={14} /> {a.examAssignment?.blockName || 'Block —'}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="card-header">
                                        <div>
                                            <button type="button" className="ent-back" onClick={() => { setSelectedEntranceId(null); setEntranceStatus(''); }}>
                                                <ArrowLeft size={14} /> All applicants
                                            </button>
                                            <h3>{entranceName(selectedEntranceApp)}</h3>
                                            <p className="subtitle">Application {selectedEntranceApp.acknowledgementNumber || '—'}</p>
                                        </div>
                                        <span className={`ent-pill ${selectedEntranceApp.marksSubmitted ? 'done' : 'todo'}`}>
                                            {selectedEntranceApp.marksSubmitted ? 'Marks submitted' : selectedEntranceApp.reexamCount ? 'Re-exam · marks pending' : 'Marks pending'}
                                        </span>
                                    </div>

                                    <div className="ent-details">
                                        {[
                                            ['Class Applied For', selectedEntranceApp.grade],
                                            ['Date of Birth', selectedEntranceApp.dob],
                                            ['Gender', selectedEntranceApp.gender],
                                            ['Parent / Guardian', selectedEntranceApp.hasGuardian ? selectedEntranceApp.guardianName : (selectedEntranceApp.parentName || selectedEntranceApp.fatherName)],
                                            ['Previous School', selectedEntranceApp.grade && selectedEntranceApp.grade !== 'LKG' ? selectedEntranceApp.previousSchool : ''],
                                            ['Exam Date', selectedEntranceApp.examAssignment?.date],
                                            ['Block Name', selectedEntranceApp.examAssignment?.blockName],
                                            ['Room No', selectedEntranceApp.examAssignment?.roomNo]
                                        ].map(([label, value]) => (
                                            <div key={label}><span>{label}</span><strong>{value || '—'}</strong></div>
                                        ))}
                                    </div>

                                    <h4 className="ent-title">Subject-wise Marks</h4>

                                    {!selectedEntranceApp.marksSubmitted && (
                                        <div className="ent-add">
                                            <input
                                                type="text"
                                                list="ent-subjects"
                                                placeholder="Subject"
                                                value={entranceInput.subject}
                                                onChange={e => setEntranceInput(i => ({ ...i, subject: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && addEntranceSubject()}
                                            />
                                            <datalist id="ent-subjects">
                                                {subjectList.map(sub => <option key={sub} value={sub} />)}
                                            </datalist>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Marks"
                                                value={entranceInput.marks}
                                                onChange={e => setEntranceInput(i => ({ ...i, marks: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && addEntranceSubject()}
                                            />
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Out of"
                                                value={entranceInput.maxMarks}
                                                onChange={e => setEntranceInput(i => ({ ...i, maxMarks: e.target.value }))}
                                            />
                                            <button type="button" className="ent-add-btn" onClick={addEntranceSubject}>
                                                <PlusCircle size={16} /> Add
                                            </button>
                                        </div>
                                    )}

                                    {entranceRows.length === 0 ? (
                                        <p className="ent-empty">No subjects added yet. Add each subject with its marks.</p>
                                    ) : (
                                        <div className="ent-table-wrap">
                                            <table className="ent-table">
                                                <thead>
                                                    <tr><th>Subject</th><th>Marks</th><th>Out of</th>{!selectedEntranceApp.marksSubmitted && <th />}</tr>
                                                </thead>
                                                <tbody>
                                                    {entranceRows.map((r, i) => (
                                                        <tr key={`${r.subject}-${i}`}>
                                                            <td>{r.subject}</td>
                                                            <td>{r.marks}</td>
                                                            <td>{r.maxMarks}</td>
                                                            {!selectedEntranceApp.marksSubmitted && (
                                                                <td>
                                                                    <button type="button" className="ent-remove" aria-label={`Remove ${r.subject}`} onClick={() => removeEntranceSubject(i)}>
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <td>Total</td>
                                                        <td>{entranceTotal}</td>
                                                        <td colSpan={selectedEntranceApp.marksSubmitted ? 1 : 2}>{entranceMax}{entranceMax ? ` (${Math.round((entranceTotal / entranceMax) * 1000) / 10}%)` : ''}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}

                                    {entranceStatus && <p className="ent-status">{entranceStatus}</p>}

                                    {selectedEntranceApp.marksSubmitted ? (
                                        <p className="ent-locked"><CheckCircle size={14} /> Marks submitted and shared with the office and admin. Contact the office if a correction is needed.</p>
                                    ) : (
                                        <div className="ent-actions">
                                            <button type="button" className="ent-submit" disabled={entranceSaving || entranceRows.length === 0} onClick={submitEntranceMarks}>
                                                <Send size={15} /> {entranceSaving ? 'Submitting…' : 'Submit marks'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
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

                    {activeTab === 'mytasks' && (
                        <div className="mt-page">
                            <div className="mt-stats">
                                <div className="mt-stat is-blue"><ClipboardList size={18} /><div><b>{pendingOfficeTasks.length}</b><span>Pending</span></div></div>
                                <div className="mt-stat is-purple"><Award size={18} /><div><b>{assessmentTaskCount}</b><span>Assessments</span></div></div>
                                <div className="mt-stat is-rose"><AlertTriangle size={18} /><div><b>{overdueTaskCount}</b><span>Overdue</span></div></div>
                                <div className="mt-stat is-green"><CheckCircle size={18} /><div><b>{completedTaskCount}</b><span>Completed</span></div></div>
                            </div>

                            <div className="dash-card full-width mt-card">
                                <div className="card-header compact">
                                    <div>
                                        <h3>My Tasks</h3>
                                        <p className="subtitle">Assigned to you by the front office.</p>
                                    </div>
                                    <div className="mt-tabs">
                                        {[['pending', 'Pending'], ['assessment', 'Assessment'], ['done', 'Completed'], ['all', 'All']].map(([key, label]) => (
                                            <button key={key} className={taskFilter === key ? 'is-active' : ''} onClick={() => setTaskFilter(key)}>{label}</button>
                                        ))}
                                    </div>
                                </div>

                                {visibleOfficeTasks.length === 0 ? (
                                    <div className="empty-sub-card">
                                        <ClipboardList size={28} />
                                        <p>{myOfficeTasks.length === 0 ? 'No tasks assigned to you.' : 'Nothing in this view.'}</p>
                                    </div>
                                ) : (
                                    <div className="mt-grid">
                                        {visibleOfficeTasks.map(task => {
                                            const done = isTaskDone(task);
                                            const overdue = isTaskOverdue(task);
                                            return (
                                                <div key={task.id} className={`mt-item ${done ? 'is-done' : ''} ${overdue ? 'is-overdue' : ''} ${isTaskAssessment(task) ? 'is-assessment' : ''}`}>
                                                    <div className="mt-item-top">
                                                        <span className={`mt-chip ${isTaskAssessment(task) ? 'chip-purple' : 'chip-blue'}`}>
                                                            {isTaskAssessment(task) ? <Award size={12} /> : <ClipboardList size={12} />}
                                                            {task.category || 'General'}
                                                        </span>
                                                        <span className={`mt-chip ${task.priority === 'Urgent' ? 'chip-rose' : task.priority === 'High' ? 'chip-amber' : 'chip-grey'}`}>{task.priority || 'Normal'}</span>
                                                    </div>
                                                    <h4>{task.title}</h4>
                                                    {task.assessmentType && <div className="mt-assess">{task.assessmentType}</div>}
                                                    {task.notes && <p className="mt-notes">{task.notes}</p>}
                                                    <div className="mt-item-foot">
                                                        <span className={`mt-due ${overdue ? 'is-late' : ''}`}><CalendarClock size={13} /> {overdue ? 'Overdue · ' : 'Due '}{fmtTaskDate(task.deadline)}</span>
                                                        <button className={`mt-btn ${done ? 'is-ghost' : ''}`} onClick={() => handleCompleteOfficeTask(task, !done)}>
                                                            {done ? <><RotateCcw size={13} /> Reopen</> : <><Check size={13} /> Mark done</>}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'schoolnews' && (() => {
                        const typeLabel = (type) => (type === 'urgent' ? 'Urgent' : type === 'info' ? 'Info' : 'General');
                        const urgent = announcements.filter(a => a.type === 'urgent');
                        const others = announcements.filter(a => a.type !== 'urgent');

                        return (
                            <div className="dash-card full-width nw">
                                <div className="nw-head">
                                    <h3>School news</h3>
                                    <p className="subtitle">
                                        {announcements.length === 0
                                            ? 'Notices and announcements from the school will show up here.'
                                            : `${announcements.length} ${announcements.length === 1 ? 'notice' : 'notices'}${urgent.length ? `, ${urgent.length} need${urgent.length === 1 ? 's' : ''} your attention` : ''}`}
                                    </p>
                                </div>

                                {announcements.length === 0 ? (
                                    <div className="empty-sub-card">
                                        <FileText size={28} />
                                        <h4>No notices yet</h4>
                                        <p>New announcements will appear here as soon as the office posts them.</p>
                                    </div>
                                ) : (
                                    <>
                                        {urgent.length > 0 && (
                                            <section className="nw-urgent" aria-label="Needs attention">
                                                {urgent.map((item) => (
                                                    <article key={item.id} className="nw-feature">
                                                        <span className="nw-flag"><AlertTriangle size={20} /></span>
                                                        <div>
                                                            <span className="nw-chip is-urgent">Urgent</span>
                                                            <h4>{item.title}</h4>
                                                            <p>{item.date}</p>
                                                        </div>
                                                    </article>
                                                ))}
                                            </section>
                                        )}

                                        {others.length > 0 && (
                                            <section className="nw-grid" aria-label="Other notices">
                                                {others.map((item) => (
                                                    <article key={item.id} className={`nw-card type-${item.type}`}>
                                                        <span className={`nw-chip is-${item.type === 'info' ? 'info' : 'general'}`}>{typeLabel(item.type)}</span>
                                                        <h4>{item.title}</h4>
                                                        <p>{item.date}</p>
                                                    </article>
                                                ))}
                                            </section>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })()}

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

                    {activeTab === 'leaves' && (() => {
                        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const toDate = (raw) => {
                            const d = raw ? new Date(`${raw}T00:00:00`) : null;
                            return d && !Number.isNaN(d.getTime()) ? d : null;
                        };
                        const fmtDate = (raw) => {
                            const d = toDate(raw);
                            return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : (raw || '');
                        };
                        const dayCount = (from, to) => {
                            const a = toDate(from);
                            const b = toDate(to);
                            if (!a || !b || b < a) return 0;
                            return Math.round((b - a) / 86400000) + 1;
                        };
                        const statusOf = (leave) => leave.status || 'Pending';
                        const toneOf = (status) => (status === 'Approved' ? 'ok' : status === 'Rejected' ? 'bad' : 'wait');
                        const leaveTypes = [
                            ['Casual Leave', 'Casual', 'CL'],
                            ['Medical Leave', 'Medical', 'ML'],
                            ['Earned Leave', 'Earned', 'EL'],
                            ['On Duty', 'On duty', 'OD']
                        ];
                        const countBy = (s) => myLeaveRequests.filter(l => (s === 'Pending' ? !['Approved', 'Rejected'].includes(statusOf(l)) : statusOf(l) === s)).length;
                        const formDays = dayCount(leaveForm.startDate, leaveForm.endDate);
                        const datesReversed = leaveForm.startDate && leaveForm.endDate && !formDays;

                        return (
                            <div className="dash-card full-width lv">
                                <div className="lv-head">
                                    <h3>Leave requests</h3>
                                    <p className="subtitle">Apply for leave and follow its approval from the administration.</p>
                                </div>

                                {leaveActionStatus && (
                                    <div className="mk-note is-ok" role="status">
                                        <Check size={16} /> {leaveActionStatus}
                                    </div>
                                )}

                                <div className="lv-split">
                                    {/* ---------- Apply ---------- */}
                                    <form onSubmit={handleSubmitleaveRequest} className="lv-form">
                                        <h4>Apply for leave</h4>

                                        <fieldset className="lv-field">
                                            <legend>Leave type</legend>
                                            <div className="lv-types">
                                                {leaveTypes.map(([val, label, code]) => (
                                                    <label key={val} className={leaveForm.leaveType === val ? 'is-on' : ''}>
                                                        <input
                                                            type="radio"
                                                            name="lv-type"
                                                            value={val}
                                                            checked={leaveForm.leaveType === val}
                                                            onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                                                        />
                                                        <strong>{label}</strong>
                                                        <small>{code}</small>
                                                    </label>
                                                ))}
                                            </div>
                                        </fieldset>

                                        <div className="lv-pair">
                                            <div className="lv-field">
                                                <label htmlFor="lv-from">From</label>
                                                <input
                                                    id="lv-from"
                                                    type="date"
                                                    className="table-input full-width-input"
                                                    value={leaveForm.startDate}
                                                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="lv-field">
                                                <label htmlFor="lv-to">To</label>
                                                <input
                                                    id="lv-to"
                                                    type="date"
                                                    className="table-input full-width-input"
                                                    min={leaveForm.startDate || undefined}
                                                    value={leaveForm.endDate}
                                                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {(formDays > 0 || datesReversed) && (
                                            <p className={`lv-days ${datesReversed ? 'is-warn' : ''}`} role="status">
                                                {datesReversed
                                                    ? 'The end date is before the start date.'
                                                    : `${formDays} ${formDays === 1 ? 'day' : 'days'} of leave`}
                                            </p>
                                        )}

                                        <div className="lv-field">
                                            <label htmlFor="lv-reason">Reason</label>
                                            <textarea
                                                id="lv-reason"
                                                rows="3"
                                                className="custom-textarea"
                                                placeholder="Tell the admin why you need leave"
                                                value={leaveForm.reason}
                                                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <button type="submit" className="btn-primary lv-submit" disabled={isLeaveSubmitting}>
                                            <SendHorizonal size={15} /> {isLeaveSubmitting ? 'Submitting...' : 'Submit request'}
                                        </button>
                                    </form>

                                    {/* ---------- History ---------- */}
                                    <section className="lv-main" aria-labelledby="lv-history-title">
                                        <h4 id="lv-history-title">My requests <span className="tsk-count">{myLeaveRequests.length}</span></h4>

                                        <div className="lv-summary">
                                            <span className="lv-stat is-wait"><b>{countBy('Pending')}</b> Pending</span>
                                            <span className="lv-stat is-ok"><b>{countBy('Approved')}</b> Approved</span>
                                            <span className="lv-stat is-bad"><b>{countBy('Rejected')}</b> Rejected</span>
                                        </div>

                                        {myLeaveRequests.length === 0 ? (
                                            <div className="empty-sub-card">
                                                <Calendar size={28} />
                                                <h4>No leave requests yet</h4>
                                                <p>Requests you submit will be listed here with their status.</p>
                                            </div>
                                        ) : (
                                            <div className="lv-list">
                                                {myLeaveRequests.map((leave) => {
                                                    const status = statusOf(leave);
                                                    const days = dayCount(leave.startDate, leave.endDate);
                                                    return (
                                                        <article key={leave.id} className={`lv-item is-${toneOf(status)}`}>
                                                            <div className="lv-length">
                                                                <b>{days || '-'}</b>
                                                                <span>{days === 1 ? 'day' : 'days'}</span>
                                                            </div>
                                                            <div className="lv-body">
                                                                <span className="topic-badge">{leave.leaveType}</span>
                                                                <h5>{fmtDate(leave.startDate)} to {fmtDate(leave.endDate)}</h5>
                                                                <p>{leave.reason}</p>
                                                            </div>
                                                            <span className={`lv-status is-${toneOf(status)}`}>{status}</span>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>
                                </div>
                            </div>
                        );
                    })()}

                </div>
            </main>

            
        </div>
    );
}