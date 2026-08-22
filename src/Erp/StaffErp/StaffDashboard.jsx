import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import logo from "../../assets/logo.png"
import {
    collection, onSnapshot, doc, updateDoc, writeBatch, addDoc, deleteDoc, serverTimestamp, deleteField, query, where
} from 'firebase/firestore';
import {
    Users, Calendar, BookOpen, FileText, Bell, CheckCircle, Clock,
    LogOut, Search, Menu, X, Check, GraduationCap, ArrowLeft,
    Folder, KeyRound, Sparkles, ChevronDown, ChevronRight, ChevronLeft, PlusCircle, Trash2, Layers,
    FileCheck, ExternalLink, Award, Send, Save, AlertCircle, UserX,
    TrendingUp, AlertTriangle, PhoneCall, BarChart2, Edit3, RotateCcw, SendHorizonal,
    LayoutGrid, ClipboardList, MessageCircle, Building2, Newspaper, Download,
    Library, PartyPopper, Moon, CalendarClock, Cake, Gift, MoreVertical
} from 'lucide-react';
import './StaffDashboard.css';

export default function StaffDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [academicMenuOpen, setAcademicMenuOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAiHint, setShowAiHint] = useState(false);
    const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toDateString());
    const [dayEvents, setDayEvents] = useState({});
    const [showAddEventForm, setShowAddEventForm] = useState(false);
    const [newEventForm, setNewEventForm] = useState({ title: '', time: '' });

    const [staffData, setStaffData] = useState({ staffId: '', name: 'Dr. R. Sharma', department: 'Senior Math Faculty' });
    
    // Leave Request States
    const [staffLeaveList, setStaffLeaveList] = useState([]);
    const [leaveForm, setLeaveForm] = useState({
        leaveType: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [isLeaveSubmitting, setIsLeaveSubmitting] = useState(false);
    const [leaveActionStatus, setLeaveActionStatus] = useState('');

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
    // Shared active class & section states across tabs
    const [selectedClass, setSelectedClass] = useState('10th Std');
    const [selectedSection, setSelectedSection] = useState(null);

    // Attendance Date & Period States
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendancePeriod, setAttendancePeriod] = useState('Period 1 (09:00 - 09:45 AM)');

    // Submissions Review State
    const [subClassFilter, setSubClassFilter] = useState(null);
    const [subSectionFilter, setSubSectionFilter] = useState(null);
    const [submissionFilterStatus, setSubmissionFilterStatus] = useState('all');

    const [allStudents, setAllStudents] = useState([]);
    const [sectionsList, setSectionsList] = useState([]);
    const [staffTimetableList, setStaffTimetableList] = useState([]);
    const [assignmentsList, setAssignmentsList] = useState([]);
    const [submissionsList, setSubmissionsList] = useState([]);

    const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
    const [studentMarks, setStudentMarks] = useState({});
    const [examType, setExamType] = useState('1st Mid-Term exam');
    const [selectedSubject, setSelectedSubject] = useState('Mathematics');
    const [marksActionStatus, setMarksActionStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Assignment CRUD State
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

        // Load this staff member's previously saved schedule events (grouped by day)
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

        // Fetch Staff Leave Requests
        const unsubLeaves = onSnapshot(collection(db, 'staff_leaves'), (snap) => {
            const leaves = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Filter leaves for current staff member if staffId exists
            setStaffLeaveList(leaves);
        });

        return () => {
            unsubStudents();
            unsubSections();
            unsubStaffTT();
            unsubAssignments();
            unsubSubmissions();
            unsubLeaves();
        };
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

    const formatSectionTitle = (secName) => {
        if (!secName) return '';
        const trimmed = secName.trim();
        return trimmed.toLowerCase().startsWith('section') ? trimmed : `Section ${trimmed}`;
    };

    const mySchedule = staffTimetableList.filter(item =>
        (staffData.staffId && item.staffId === staffData.staffId) ||
        (item.staffName && item.staffName.toLowerCase() === staffData.name.toLowerCase())
    );

    const myLeaveRequests = staffLeaveList.filter(item =>
        (staffData.staffId && item.staffId === staffData.staffId) ||
        (item.staffName && item.staffName.toLowerCase() === staffData.name.toLowerCase())
    );

    // Active Students based on Selected Class & Section
    const getActiveStudents = () => {
        return allStudents.filter(student => {
            if (!selectedClass) return false;
            const matchesClass = student.className &&
                cleanString(student.className) === cleanString(selectedClass);

            if (selectedSection && (selectedSection.id || selectedSection.name)) {
                return matchesClass && (
                    student.sectionId === selectedSection.id ||
                    cleanString(student.sectionName) === cleanString(selectedSection.name)
                );
            }
            return matchesClass;
        });
    };

    const activeStudents = getActiveStudents();

    // Attendance Analytics Computations
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
        setIsSubmitting(true);
        try {
            const batch = writeBatch(db);
            activeStudents.forEach(student => {
                const studentRef = doc(db, 'students_records', student.id);
                batch.update(studentRef, {
                    status: student.status || 'present',
                    lastAttendanceDate: attendanceDate,
                    lastAttendancePeriod: attendancePeriod
                });
            });
            await batch.commit();
            setAttendanceSubmitted(true);
        } catch (error) {
            console.error("Batch attendance submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Leave Request Handler
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

    // Marks CRUD
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

        const compositeKey = getExamSubjectKey();
        try {
            const studentRef = doc(db, 'students_records', studentId);
            await updateDoc(studentRef, {
                [`marksDraft.${compositeKey}`]: Number(score),
                lastMarksDraftSaved: new Date().toISOString()
            });
            setMarksActionStatus(`Saved draft score for student #${studentId.slice(0, 5)}`);
            setTimeout(() => setMarksActionStatus(''), 3000);
        } catch (err) {
            console.error("Error updating individual mark draft:", err);
            alert("Failed to update record.");
        }
    };

    const handleResetSingleMark = async (studentId) => {
        const compositeKey = getExamSubjectKey();
        if (!window.confirm("Are you sure you want to clear this student's mark?")) return;

        try {
            const studentRef = doc(db, 'students_records', studentId);
            await updateDoc(studentRef, {
                [`marksDraft.${compositeKey}`]: deleteField(),
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
            activeStudents.forEach(student => {
                const score = studentMarks[student.id] ?? student.marksDraft?.[compositeKey] ?? student.marks?.[compositeKey];
                if (score !== undefined && score !== '') {
                    const studentRef = doc(db, 'students_records', student.id);
                    batch.update(studentRef, {
                        [`marksDraft.${compositeKey}`]: Number(score),
                        lastMarksDraftSaved: new Date().toISOString()
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
            activeStudents.forEach(student => {
                const studentRef = doc(db, 'students_records', student.id);
                batch.update(studentRef, {
                    [`marksDraft.${compositeKey}`]: deleteField()
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

    // Assignments Handlers
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

    // ---------- Right-rail: Weekly Schedule Calendar ----------
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

    // ---------- Left column: Today's Plan (from live timetable) ----------
    const todayWeekdayName = todayRef.toLocaleDateString('en-US', { weekday: 'long' });
    const todaysPlanItems = (mySchedule.filter(i => i.day === todayWeekdayName).length > 0
        ? mySchedule.filter(i => i.day === todayWeekdayName)
        : mySchedule
    ).slice(0, 3);

    // ---------- Left column: Documents (latest turned-in submissions) ----------
    const recentDocuments = [...submissionsList]
        .sort((a, b) => {
            const aT = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : 0;
            const bT = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : 0;
            return bT - aT;
        })
        .slice(0, 4);

    // ---------- Left column: Class Progress (live attendance rate per class) ----------
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

    // ---------- Right-rail: Upcoming Activities (from live schedule + assignments) ----------
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

    // ---------- Right-rail: Notifications (live counts, no fabricated data) ----------
    const pendingLeaveCount = myLeaveRequests.filter(l => (l.status || 'Pending') === 'Pending').length;
    const ungradedSubmissionsCount = submissionsList.filter(s => s.obtainedMarks === undefined || s.obtainedMarks === null || s.obtainedMarks === '').length;
    const dueSoonAssignmentsCount = assignmentsList.filter(a => a.dueDate && new Date(a.dueDate) >= new Date(new Date().setHours(0, 0, 0, 0))).length;

    const filteredStudents = activeStudents.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNo?.toLowerCase().includes(searchQuery.toLowerCase())
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

    return (
        <div className="dashboard-containers">
            {/* Mobile Topbar */}
            <header className="mobile-topbar">
                <div className="mobile-brand">
                    <img src={logo} alt="" id='logog'/>
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

            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-icon"><img src={logo} alt="" id='logog'/></div>
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
                    {/* GROUP: MY WORKSPACE */}
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
                                <span>Gradebook</span>
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

                    {/* GROUP: COMMUNICATION */}
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

                    {/* GROUP: APPROVALS & ALERTS */}
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

                    {/* GROUP: OTHERS */}
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

            {/* Main Workspace */}
            <main className="dashboard-main">
                <header className="dashboard-topbar">
                    <h1 className="dashboard-page-title">Dashboard</h1>

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
                    {/* OVERVIEW TAB */}
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
                                            <span>Gradebook</span>
                                        </button>
                                        <button className="quick-link-item" onClick={() => setActiveTab('library')}>
                                            <div className="quick-link-icon bg-emerald"><Library size={20} /></div>
                                            <span>Resources</span>
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

                    {/* STUDENT ROSTER TAB */}
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

                    {/* ATTENDANCE TAB */}
                    {activeTab === 'attendance' && (
                        <div className="dash-card full-width">
                            <div className="card-header" style={{ flexDirection: 'column', gap: '0.75rem', alignItems: 'stretch' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <h3>Mark Attendance</h3>
                                        <p className="subtitle">
                                            Synchronized live status for {selectedClass} {selectedSection ? `(${formatSectionTitle(selectedSection.name)})` : '(All Sections)'}
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

                                        <select
                                            className="custom-select"
                                            value={attendancePeriod}
                                            onChange={(e) => setAttendancePeriod(e.target.value)}
                                            title="Period / Class Hour"
                                        >
                                            {periodList.map(per => (
                                                <option key={per} value={per}>{per}</option>
                                            ))}
                                        </select>

                                        <select
                                            className="custom-select"
                                            value={selectedClass || ''}
                                            onChange={(e) => {
                                                setSelectedClass(e.target.value);
                                                setSelectedSection(null);
                                                setAttendanceSubmitted(false);
                                            }}
                                            title="Select Class"
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
                                                setAttendanceSubmitted(false);
                                            }}
                                            disabled={!selectedClass}
                                            title="Select Section"
                                        >
                                            <option value="">All Sections</option>
                                            {sectionsList.filter(s => s.className === selectedClass).map(s => (
                                                <option key={s.id} value={s.name}>{formatSectionTitle(s.name)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {attendanceSubmitted && (
                                <div style={{ color: 'var(--primary)', padding: '8px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Check size={18} /> Attendance submitted successfully for {attendanceDate} ({attendancePeriod})!
                                </div>
                            )}

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
                                        {filteredStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem' }}>
                                                    No student records found in this section.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStudents.map((student) => (
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
                                <button className="btn-primary" onClick={handleSubmitAttendance} disabled={isSubmitting || filteredStudents.length === 0}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ATTENDANCE ANALYTICS TAB */}
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

                    {/* MARKS ENTRY & CRUD TAB */}
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

                            <div className="form-grid marks-four-col-grid">
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>Select Class</label>
                                    <select
                                        className="custom-select full-width"
                                        value={selectedClass || ''}
                                        onChange={(e) => {
                                            setSelectedClass(e.target.value);
                                            setSelectedSection(null);
                                            setMarksActionStatus('');
                                        }}
                                    >
                                        {classList.map(cls => (
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
                                            setMarksActionStatus('');
                                        }}
                                        disabled={!selectedClass}
                                    >
                                        <option value="">All Sections</option>
                                        {sectionsList
                                            .filter(s => s.className === selectedClass)
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
                                        {subjectList.map(subj => (
                                            <option key={subj} value={subj}>{subj}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

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
                                        {filteredStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>
                                                    No students available for this class / section.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStudents.map((student) => {
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
                                    disabled={isSubmitting || filteredStudents.length === 0}
                                >
                                    <RotateCcw size={14} /> Clear All Drafts
                                </button>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        className="btn-save-draft"
                                        onClick={handleSaveMarksDraft}
                                        disabled={isSubmitting || filteredStudents.length === 0}
                                    >
                                        <Save size={15} /> Save All as Draft
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ASSIGNMENTS / TASKS */}
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

                    {/* PDF SUBMISSIONS & GRADING */}
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

                    {/* SCHEDULE TAB */}
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

                    {/* DEPARTMENTS TAB */}
                    {activeTab === 'departments' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>Departments</h3>
                                    <p className="subtitle">Faculty grouped by subject department.</p>
                                </div>
                            </div>
                            <div className="class-cards-grid">
                                {subjectList.map((dept) => (
                                    <div key={dept} className="class-card">
                                        <div className="class-card-icon">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{dept}</h4>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CHATS / STAFF ROOM / EVENTS / LIBRARY / DOWNLOADS - lightweight placeholders */}
                    {['chats', 'staffroom', 'library', 'events'].includes(activeTab) && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <h3>
                                        {activeTab === 'chats' && 'Chats'}
                                        {activeTab === 'staffroom' && 'Staff Room'}
                                        {activeTab === 'library' && 'Library'}
                                        {activeTab === 'events' && 'Events'}
                                    </h3>
                                    <p className="subtitle">This workspace is coming soon.</p>
                                </div>
                            </div>
                            <div className="empty-sub-card">
                                {activeTab === 'chats' && <MessageCircle size={28} />}
                                {activeTab === 'staffroom' && <Users size={28} />}
                                {activeTab === 'library' && <Library size={28} />}
                                {activeTab === 'events' && <PartyPopper size={28} />}
                                <p>Nothing here yet — check back soon.</p>
                            </div>
                        </div>
                    )}

                    {/* SCHOOL NEWS TAB - reuses live announcements data */}
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

                    {/* DOWNLOADS TAB - reuses live submissions data */}
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

                    {/* NEW: LEAVE REQUESTS TAB */}
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

                            {/* Leave Application Form */}
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