import { db, auth } from '../service/firebase';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection, onSnapshot, deleteDoc, doc, addDoc, updateDoc, serverTimestamp, setDoc, writeBatch, getDocs, query, where
} from 'firebase/firestore';
import {
    Calendar, Shield, Award, Image as ImageIcon, Sun, Bell,
    PlusCircle, Trash2, LogOut, Radio, ChevronDown, Users, GraduationCap,
    Edit2, Check, X, ArrowLeft, Folder, UserCheck, KeyRound, Clock, Menu, LayoutGrid,
    User, RefreshCw, ChevronRight, Settings,
    Search, AlertTriangle, ShieldCheck, Database, Sliders, Save, Send,
    FileText, CheckCircle, XCircle, Eye, Mail, Upload, FolderPlus, Images,
    Camera, Briefcase, Lock, Copy, EyeOff, Hash,
    Megaphone, Link2, Phone, Trophy, CalendarDays,
    Minus, Maximize2, Minimize2, GripVertical
} from 'lucide-react';
import AdminLogin from '../admin/AdminLogin';
import './AdminDashboard.css';
import logo from "../assets/logo.png";

import Previewmodal from "./Previewmodal"
import AdminAdmissionPanel from './AdminAdmissionPanel';
import {
    ADMISSION_CLASSES,
    DEFAULT_ADMISSION_SETTINGS,
    classLabel,
    normalizeAdmissionSettings,
} from '../pages/Admission/admissionSettings';

// Shared building blocks for the website-content pages (announcements, events,
// toppers, calendar, administrators, gallery, holidays).
function PxHead({ icon: Icon, title, desc, count, countLabel }) {
    return (
        <header className="px-head">
            <span className="px-head-icon"><Icon size={24} /></span>
            <div className="px-head-text">
                <h2>{title}</h2>
                <p>{desc}</p>
            </div>
            <div className="px-head-count">
                <strong>{count}</strong>
                <span>{countLabel}</span>
            </div>
        </header>
    );
}

function PxEmpty({ icon: Icon, title, text }) {
    return (
        <div className="px-empty">
            <span><Icon size={22} /></span>
            <strong>{title}</strong>
            <p>{text}</p>
        </div>
    );
}

// Attendance per student for a class roster. Matches each attendance record to a
// student by id, then admission number, then (only for records with neither) name.
const normKey = (v) => String(v || '').trim().toLowerCase();
function buildAttendanceStats(students, records) {
    const byId = new Map();
    const byAdm = new Map();
    const byName = new Map();
    students.forEach(st => {
        byId.set(st.id, st.id);
        const adm = normKey(st.admissionNo || st.rollNumber);
        if (adm && !byAdm.has(adm)) byAdm.set(adm, st.id);
        const nm = normKey(st.name);
        if (nm && !byName.has(nm)) byName.set(nm, st.id);
    });
    const stats = new Map(students.map(st => [st.id, { present: 0, total: 0 }]));
    records.forEach(r => {
        const sid = (r.studentId && byId.get(r.studentId))
            || byAdm.get(normKey(r.admissionNo))
            || (!r.studentId && !r.admissionNo ? byName.get(normKey(r.studentName)) : undefined);
        if (!sid) return;
        const s = stats.get(sid);
        s.total += 1;
        if (r.status === 'present') s.present += 1;
    });
    return stats;
}

// Academic progress for a class roster, from published marks (keys look like
// "Quarterly Exam - Mathematics", scores out of 100).
const PROGRESS_EXAM_ORDER = [
    '1st Mid-Term exam', 'Quarterly Exam', '2nd Mid-Term exam', 'Halferly Exam',
    '3rd Mid-Term exam', 'Annual Exam', 'Class Unit Test'
];
function buildProgressStats(students) {
    const subjects = {};
    const exams = {};
    const perStudent = new Map();
    let publishedCount = 0;
    let pendingCount = 0;
    students.forEach(st => {
        const marks = st.marks || {};
        let total = 0;
        let count = 0;
        Object.entries(marks).forEach(([key, value]) => {
            const score = Number(value);
            if (value === undefined || value === null || value === '' || Number.isNaN(score)) return;
            total += score;
            count += 1;
            const cut = key.indexOf(' - ');
            const exam = cut >= 0 ? key.slice(0, cut) : key;
            const subject = cut >= 0 ? key.slice(cut + 3) : 'Other';
            (subjects[subject] = subjects[subject] || { sum: 0, n: 0 });
            subjects[subject].sum += score; subjects[subject].n += 1;
            (exams[exam] = exams[exam] || { sum: 0, n: 0 });
            exams[exam].sum += score; exams[exam].n += 1;
        });
        publishedCount += count;
        pendingCount += Object.keys(st.marksDraft || {}).filter(k => marks[k] === undefined).length;
        perStudent.set(st.id, { avg: count ? total / count : null, count });
    });
    const withMarks = [...perStudent.values()].filter(p => p.avg !== null);
    const round = (n) => Math.round(n * 10) / 10;
    return {
        perStudent,
        publishedCount,
        pendingCount,
        classAvg: withMarks.length ? round(withMarks.reduce((a, p) => a + p.avg, 0) / withMarks.length) : null,
        passRate: withMarks.length ? Math.round((withMarks.filter(p => p.avg >= 35).length / withMarks.length) * 100) : null,
        subjects: Object.entries(subjects).map(([subject, v]) => ({ subject, avg: round(v.sum / v.n), count: v.n })).sort((a, b) => b.avg - a.avg),
        exams: Object.entries(exams).map(([exam, v]) => ({ exam, avg: round(v.sum / v.n) }))
            .sort((a, b) => {
                const ia = PROGRESS_EXAM_ORDER.indexOf(a.exam); const ib = PROGRESS_EXAM_ORDER.indexOf(b.exam);
                return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
            })
    };
}

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics');

    const [staffSearchQuery, setStaffSearchQuery] = React.useState('');
    const [staffIdSearchQuery, setStaffIdSearchQuery] = React.useState('');
    const [staffDeptFilter, setStaffDeptFilter] = React.useState('');


    // Collapsible states for sidebar dropdowns
    const [admissionsOpen, setAdmissionsOpen] = useState(true);
    const [updatesOpen, setUpdatesOpen] = useState(true);
    const [erpOpen, setErpOpen] = useState(true);
    const [timetableOpen, setTimetableOpen] = useState(true);
    const [systemOpen, setSystemOpen] = useState(true);

    // Mobile Navigation Drawer State & page-jump search
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [navQuery, setNavQuery] = useState('');

    // Real-time Firestore state
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [administrators, setAdministrators] = useState([]);
    const [toppers, setToppers] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [galleryItems, setGalleryItems] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [feeRecords, setFeeRecords] = useState([]);
    const [idCards, setIdCards] = useState([]);

    // Admission access switch (public admission pages open only while this is ON)
    const [admissionOpen, setAdmissionOpen] = useState(false);
    const [admissionAccessMeta, setAdmissionAccessMeta] = useState(null);
    const [admissionAccessLoading, setAdmissionAccessLoading] = useState(true);
    const [admissionAccessSaving, setAdmissionAccessSaving] = useState(false);
    const [admissionDraft, setAdmissionDraft] = useState({
        academicYear: DEFAULT_ADMISSION_SETTINGS.academicYear,
        classFrom: DEFAULT_ADMISSION_SETTINGS.classFrom,
        classTo: DEFAULT_ADMISSION_SETTINGS.classTo,
        closedClasses: [],
    });
    const [admissionDirty, setAdmissionDirty] = useState(false);
    const [admissionDetailsSaved, setAdmissionDetailsSaved] = useState(false);
    const admissionDirtyRef = useRef(false);

    // Admissions Administration Panel States
    const [admissionApplications, setAdmissionApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [admissionLoading, setAdmissionLoading] = useState(false);

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
    const getSectionsForClass = (className) => {
        if (!className) return [];

        const normalize = (value = '') =>
            String(value)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');

        const normalizedClass = normalize(className);

        return sectionsList.filter((item) => {
            const itemClass =
                item.className ||
                item.class ||
                item.standard ||
                item.grade ||
                '';

            return normalize(itemClass) === normalizedClass;
        });
    };

    const [studentsList, setStudentsList] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [previewStudent, setPreviewStudent] = useState(null);

    // Results & Publish Drill-down States
    const [selectedClassResults, setSelectedClassResults] = useState(null);
    const [selectedSectionResults, setSelectedSectionResults] = useState(null);
    const [examType, setExamType] = useState('1st Mid-Term exam');
    const [selectedSubject, setSelectedSubject] = useState('Mathematics');

    // Form inputs state
    const [calendarForm, setCalendarForm] = useState({ month: '', date: '', day: '', title: '', category: 'General' });
    const [adminForm, setAdminForm] = useState({ name: '', role: '', qualification: '', message: '', email: '', phone: '' });
    const [topperForm, setTopperForm] = useState({ name: '', streamOrGrade: '', scoreOrPercentage: '', photo: '', rank: '1' });
    const [eventForm, setEventForm] = useState({ month: 'SEP', day: '12', title: '', description: '', time: '9:00 AM Onwards' });
    const [galleryForm, setGalleryForm] = useState({
        title: '',
        description: '',
        files: []
    });
    const [galleryUploadFiles, setGalleryUploadFiles] = useState([]);
    const [galleryUploading, setGalleryUploading] = useState(false);
    // Desktop-style folder navigation: '' = Home/root. Nested folders use 'Parent/Child' paths.
    const [galleryCurrentPath, setGalleryCurrentPath] = useState('');
    const [galleryFolderRecords, setGalleryFolderRecords] = useState([]);
    const [isCreatingGalleryFolder, setIsCreatingGalleryFolder] = useState(false);
    const [galleryNewFolderName, setGalleryNewFolderName] = useState('');
    // Gallery photo edit modal state
    const [editingGalleryId, setEditingGalleryId] = useState(null);
    const [editGalleryForm, setEditGalleryForm] = useState({ title: '', description: '', folderPath: '', image: '' });
    const [editGalleryNewImageFile, setEditGalleryNewImageFile] = useState(null);
    const [editGalleryImagePreview, setEditGalleryImagePreview] = useState('');
    const [galleryUpdating, setGalleryUpdating] = useState(false);
    const [holidayForm, setHolidayForm] = useState({ date: '', day: '', occasion: '', type: 'National Holiday' });
    const [noticeText, setNoticeText] = useState('');
    const [announcementLinkText, setAnnouncementLinkText] = useState('');
    const [announcementLinkUrl, setAnnouncementLinkUrl] = useState('');

    // Global Search and System Settings State
    const [globalSearch, setGlobalSearch] = useState('');
    const [settingsForm, setSettingsForm] = useState({
        schoolName: 'EduPulse Matric Higher Secondary School',
        academicYear: '2026 - 2027',
        contactEmail: 'admin@edupulse.edu',
        helpline: '+91 98765 43210'
    });
    const [emergencyNotice, setEmergencyNotice] = useState('');
    const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

    // Staff Form & Update States
    const initialStaffForm = { name: '', staffId: '', password: '', department: '', email: '', photo: '' };
    const [staffForm, setStaffForm] = useState(initialStaffForm);
    const [editingStaffId, setEditingStaffId] = useState(null);
    const [editStaffForm, setEditStaffForm] = useState(initialStaffForm);

    // Directory-card UI state (Users-directory style grid for Staff & Students)
    const [showAddStaffForm, setShowAddStaffForm] = useState(false);
    const [showAddStudentForm, setShowAddStudentForm] = useState(false);
    const [viewStaffId, setViewStaffId] = useState(null);
    const [staffViewTab, setStaffViewTab] = useState('details');
    const [staffViewSectionId, setStaffViewSectionId] = useState(null);
    const [staffViewSort, setStaffViewSort] = useState('name');
    const [staffClassView, setStaffClassView] = useState('attendance');

    // Staff profile window: normal | maximized | minimized (floating, draggable)
    const STAFF_MINI_W = 300;
    const STAFF_MINI_H = 64;
    const [staffWinMode, setStaffWinMode] = useState('normal');
    const [staffMiniPos, setStaffMiniPos] = useState(null);
    const [staffMiniDragging, setStaffMiniDragging] = useState(false);
    const staffMiniOffset = useRef(null);
    const clampStaffMini = (x, y) => ({
        x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - Math.min(STAFF_MINI_W, window.innerWidth - 16) - 8)),
        y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - STAFF_MINI_H - 8))
    });
    const minimizeStaffView = () => {
        setStaffMiniPos(p => clampStaffMini(p ? p.x : 20, p ? p.y : window.innerHeight - STAFF_MINI_H - 20));
        setStaffWinMode('minimized');
    };
    const onStaffMiniPointerDown = (e) => {
        if (e.target.closest('button')) return;
        const pos = staffMiniPos || { x: 0, y: 0 };
        staffMiniOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
        e.currentTarget.setPointerCapture(e.pointerId);
        setStaffMiniDragging(true);
    };
    const onStaffMiniPointerMove = (e) => {
        if (!staffMiniOffset.current) return;
        setStaffMiniPos(clampStaffMini(e.clientX - staffMiniOffset.current.dx, e.clientY - staffMiniOffset.current.dy));
    };
    const onStaffMiniPointerUp = (e) => {
        if (!staffMiniOffset.current) return;
        staffMiniOffset.current = null;
        setStaffMiniDragging(false);
        if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    };
    const onStaffMiniKeyDown = (e) => {
        if (e.target !== e.currentTarget) return;
        const step = e.shiftKey ? 60 : 20;
        const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (moves[e.key]) {
            e.preventDefault();
            const [mx, my] = moves[e.key];
            setStaffMiniPos(p => clampStaffMini((p ? p.x : 0) + mx, (p ? p.y : 0) + my));
        } else if (e.key === 'Enter') {
            setStaffWinMode('normal');
        }
    };
    useEffect(() => {
        if (staffWinMode !== 'minimized') return undefined;
        const onResize = () => setStaffMiniPos(p => (p ? clampStaffMini(p.x, p.y) : p));
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [staffWinMode]);
    // null = not loaded yet. Only subscribed while a staff profile is open.
    const [attendanceRecords, setAttendanceRecords] = useState(null);
    const [studentDirSearch, setStudentDirSearch] = useState('');
    const staffFormRef = useRef(null);
    const [showStaffPwd, setShowStaffPwd] = useState(false);
    const [copiedStaffField, setCopiedStaffField] = useState('');

    // Close staff popups with the Escape key
    useEffect(() => {
        if (!viewStaffId && !editingStaffId) return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                if (staffWinMode !== 'minimized') setViewStaffId(null);
                setEditingStaffId(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [viewStaffId, editingStaffId, staffWinMode]);

    // Attendance is only needed for the "My class" tab of a staff profile.
    useEffect(() => {
        if (!user || !viewStaffId) return undefined;
        setAttendanceRecords(null);
        const unsub = onSnapshot(
            collection(db, 'attendance_records'),
            snap => setAttendanceRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            err => { console.error('Attendance load failed:', err); setAttendanceRecords([]); }
        );
        return () => unsub();
    }, [user, viewStaffId]);

    // Live admission access flag: site_settings/admission -> { open: boolean }
    useEffect(() => {
        if (!user) return undefined;
        const unsub = onSnapshot(
            doc(db, 'site_settings', 'admission'),
            snap => {
                const data = snap.exists() ? snap.data() : {};
                setAdmissionOpen(data.open === true);
                setAdmissionAccessMeta(data);
                if (!admissionDirtyRef.current) {
                    const s = normalizeAdmissionSettings(data);
                    setAdmissionDraft({
                        academicYear: s.academicYear,
                        classFrom: s.classFrom,
                        classTo: s.classTo,
                        closedClasses: s.closedClasses,
                    });
                }
                setAdmissionAccessLoading(false);
            },
            err => { console.error('Admission access load failed:', err); setAdmissionAccessLoading(false); }
        );
        return () => unsub();
    }, [user]);

    const toggleAdmissionAccess = async () => {
        const next = !admissionOpen;
        const msg = next
            ? 'Open admissions? The public admission pages will become available to everyone.'
            : 'Close admissions? The public admission pages will be blocked immediately.';
        if (!window.confirm(msg)) return;
        setAdmissionAccessSaving(true);
        try {
            // Opening also stores the details shown in the form (defaults on first use).
            const details = next ? {
                academicYear: admissionDraft.academicYear.trim() || DEFAULT_ADMISSION_SETTINGS.academicYear,
                classFrom: admissionDraft.classFrom,
                classTo: admissionDraft.classTo,
                closedClasses: admissionDraft.closedClasses,
            } : {};
            await setDoc(doc(db, 'site_settings', 'admission'), {
                open: next,
                ...details,
                updatedAt: serverTimestamp(),
                updatedBy: user?.email || null,
            }, { merge: true });
        } catch (err) {
            console.error('Could not update admission access:', err);
            alert('Could not update admission access. Please try again.');
        } finally {
            setAdmissionAccessSaving(false);
        }
    };

    const admissionFromIdx = ADMISSION_CLASSES.indexOf(admissionDraft.classFrom);
    const admissionToIdx = ADMISSION_CLASSES.indexOf(admissionDraft.classTo);
    const admissionRangeInvalid = admissionFromIdx > admissionToIdx;

    const updateAdmissionDraft = (patch) => {
        admissionDirtyRef.current = true;
        setAdmissionDirty(true);
        setAdmissionDetailsSaved(false);
        setAdmissionDraft((d) => ({ ...d, ...patch }));
    };

    const toggleAdmissionClass = (c) => {
        const closed = admissionDraft.closedClasses;
        updateAdmissionDraft({
            closedClasses: closed.includes(c) ? closed.filter((x) => x !== c) : [...closed, c],
        });
    };

    const saveAdmissionDetails = async () => {
        if (admissionRangeInvalid) return;
        setAdmissionAccessSaving(true);
        try {
            const inRange = ADMISSION_CLASSES.slice(admissionFromIdx, admissionToIdx + 1);
            await setDoc(doc(db, 'site_settings', 'admission'), {
                academicYear: admissionDraft.academicYear.trim() || DEFAULT_ADMISSION_SETTINGS.academicYear,
                classFrom: admissionDraft.classFrom,
                classTo: admissionDraft.classTo,
                closedClasses: admissionDraft.closedClasses.filter((c) => inRange.includes(c)),
                updatedAt: serverTimestamp(),
                updatedBy: user?.email || null,
            }, { merge: true });
            admissionDirtyRef.current = false;
            setAdmissionDirty(false);
            setAdmissionDetailsSaved(true);
            setTimeout(() => setAdmissionDetailsSaved(false), 2500);
        } catch (err) {
            console.error('Could not save admission details:', err);
            alert('Could not save admission details. Please try again.');
        } finally {
            setAdmissionAccessSaving(false);
        }
    };

    // Section CRUD States
    const [sectionForm, setSectionForm] = useState({ name: '', roomNo: '' });
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [editSectionForm, setEditSectionForm] = useState({ name: '', roomNo: '' });

    // Class Incharge Teachers States
    const [selectedInchargeClass, setSelectedInchargeClass] = useState('');
    const [selectedInchargeSectionId, setSelectedInchargeSectionId] = useState('');
    const [selectedInchargeTeacherId, setSelectedInchargeTeacherId] = useState('');
    const [inchargeAssigning, setInchargeAssigning] = useState(false);
    const [inchargeSavedMsg, setInchargeSavedMsg] = useState(false);

    const sidebarRef = useRef(null);
    const studentFormRef = useRef(null);

    // Live clock for the Institution KPI header
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(clockTimer);
    }, []);

    // Builds and downloads a plain-text snapshot of the current KPI data
    const handleDownloadReport = () => {
        const now = new Date();
        const reportLines = [
            `${settingsForm.schoolName} — Institution KPI Report`,
            `Generated: ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${now.toLocaleTimeString('en-GB')}`,
            '',
            '--- Overview & Live Analytics ---',
            `Total Enrolled Students: ${studentsList.length}`,
            `Class Sections: ${sectionsList.length}`,
            `Faculty Staff Members: ${staffList.length}`,
            `Staff Work Slots: ${staffTimetables.length}`,
            `Student Schedule Periods: ${studentTimetables.length}`,
            `Campus Circulars Published: ${announcements.length}`,
            `Events on Record: ${calendarEvents.length}`,
        ].join('\n');

        try {
            const blob = new Blob([reportLines], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `institution-kpi-report-${now.toISOString().slice(0, 10)}.txt`;
            link.rel = 'noopener';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            // Some sandboxed preview iframes (CodeSandbox/StackBlitz previews,
            // embedded dev tools, etc.) block the `download` attribute / blob
            // URLs outright. Falling back to a new tab still lets the admin
            // see and manually save the report in that case.
            console.error('Download failed, falling back to a new tab:', err);
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(`<pre>${reportLines.replace(/</g, '&lt;')}</pre>`);
                win.document.title = 'Institution KPI Report';
            } else {
                alert('Your browser blocked the download. Please allow pop-ups for this site and try again.');
            }
        }
    };

    // Topbar title/subtitle per tab (mirrors the section headers in the reference design)
    const tabMeta = {
        analytics: { title: 'Dashboard', subtitle: "Welcome back! Here's what's happening today." },
        admission_panel: { title: 'Admission Panel', subtitle: 'Review and manage incoming admission applications.' },
        upcoming_events: { title: 'Upcoming Events', subtitle: 'Manage school events and activities.' },
        toppers: { title: 'Toppers & Achievers', subtitle: 'Manage board exam toppers and achievers.' },
        calendar: { title: 'Academic Calendar', subtitle: 'Manage holidays and important dates.' },
        admins: { title: 'Administrators', subtitle: 'Manage admin accounts and access.' },
        gallery: { title: 'Gallery Management', subtitle: 'Manage school gallery photos.' },
        holidays: { title: 'School Holidays', subtitle: 'Manage the holiday calendar.' },
        announcements: { title: 'Announcements', subtitle: 'Create and manage announcements.' },
        staff: { title: 'Teachers', subtitle: 'Manage staff directory and details.' },
        students: { title: 'Students', subtitle: 'Manage all student details and information.' },
        class_incharge: { title: 'Class Incharge', subtitle: 'Assign teachers to classes and sections.' },
        results: { title: 'Results Management', subtitle: 'Publish and manage exam results.' },
        student_timetable: { title: 'Timetable', subtitle: 'Manage class schedules.' },
        staff_timetable: { title: 'Staff Timetable', subtitle: 'Manage staff work schedules.' },
        settings: { title: 'System Settings', subtitle: 'Manage system configuration and settings.' },
        idcards: { title: 'ID Card Management', subtitle: 'Generate and manage ID cards.' },
    };
    const currentTabMeta = tabMeta[activeTab] || { title: 'Dashboard', subtitle: '' };

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
        admissionNo: '', admissionDate: '', name: '', dob: '', photo: '', bloodGroup: '', guardianName: '', phone: '', address: '',
        gender: '', rollNumber: '', email: '', parentPhone: '', relationship: '', status: 'Active'
    };
    const [studentForm, setStudentForm] = useState(initialStudentForm);
    const [editingStudentId, setEditingStudentId] = useState(null);

    // Timetable Form & Edit States
    const initialStudentTimetableForm = {
        className: '', sectionName: '', day: 'Monday', timeSlot: '', subject: '', teacherName: '', roomNo: ''
    };
    const [studentTimetableForm, setStudentTimetableForm] = useState(initialStudentTimetableForm);
    const [editingStudentTTId, setEditingStudentTTId] = useState(null);
    const [editStudentTTForm, setEditStudentTTForm] = useState(initialStudentTimetableForm);

    const initialStaffTimetableForm = {
        staffId: '',
        staffName: '',
        day: 'Monday',
        timeSlot: '',
        subject: '',
        className: '',
        sectionName: '',
        roomNo: ''
    };

    const [staffTimetableForm, setStaffTimetableForm] = useState(initialStaffTimetableForm);
    const [editingStaffTTId, setEditingStaffTTId] = useState(null);
    const [editStaffTTForm, setEditStaffTTForm] = useState(initialStaffTimetableForm);

    const classList = [
        'LKG', 'UKG',
        '1st Std', '2nd Std', '3rd Std', '4th Std', '5th Std',
        '6th Std', '7th Std', '8th Std', '9th Std', '10th Std',
        '11th Std', '12th Std'
    ];

    // Board exam toppers are ordered Class X first, then Class XII, and by rank within each class.
    const getTopperClassOrder = (streamOrGrade = '') => {
        const value = String(streamOrGrade).toUpperCase();
        if (value.includes('XII')) return 2;
        if (value.includes('X')) return 1;
        return 99;
    };
    const sortToppers = (list) =>
        [...list].sort((a, b) => {
            const classDiff = getTopperClassOrder(a.streamOrGrade) - getTopperClassOrder(b.streamOrGrade);
            if (classDiff !== 0) return classDiff;
            return Number(a.rank || 99) - Number(b.rank || 99);
        });

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

    const handleImageUpload = (file, onSuccess) => {
        if (!file) return;
        const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedFormats.includes(file.type.toLowerCase())) {
            alert('Unsupported image format! Please upload only JPG, JPEG, PNG, or WEBP images.');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 1200;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.85;
                let outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                let dataUrl = canvas.toDataURL(outputFormat, quality);

                while (dataUrl.length > 680000 && quality > 0.3) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                onSuccess(dataUrl);
            };
        };
    };

    // Gallery multi-upload helpers. Each selected image is compressed before it is
    // written as its own Firestore gallery document, while `folder` keeps the UI organized.
    const compressImageToDataUrl = (file) => new Promise((resolve, reject) => {
        if (!file) return reject(new Error('No file selected'));
        const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedFormats.includes(file.type.toLowerCase())) {
            reject(new Error(`${file.name}: unsupported image format. Use JPG, JPEG, PNG or WEBP.`));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
        reader.onload = (event) => {
            const img = new Image();
            img.onerror = () => reject(new Error(`Unable to process ${file.name}`));
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 1200;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.82;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                while (dataUrl.length > 680000 && quality > 0.3) {
                    quality -= 0.08;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                resolve(dataUrl);
            };
        };
        reader.readAsDataURL(file);
    });

    const handleGalleryFilesChange = (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        setGalleryUploadFiles(files);
        setGalleryForm(prev => ({ ...prev, files }));
    };

    // Resolves the full folder path a photo lives in, e.g. "Campus/Day 1".
    // Falls back to older folder/subfolder/category fields so existing photos keep working.
    const getItemPath = (item) => {
        if (item.folderPath) return item.folderPath;
        const legacyFolder = item.folder || item.category || '';
        const legacySubfolder = (item.subfolder || '').trim();
        if (legacyFolder && legacySubfolder) return `${legacyFolder}/${legacySubfolder}`;
        return legacyFolder || 'Uncategorized';
    };

    // If fullPath sits directly inside basePath, returns that immediate child folder name; otherwise null.
    const getChildFolderName = (fullPath, basePath) => {
        const prefix = basePath ? `${basePath}/` : '';
        if (basePath) {
            if (!fullPath.startsWith(prefix)) return null;
        } else if (!fullPath) {
            return null;
        }
        const remainder = basePath ? fullPath.slice(prefix.length) : fullPath;
        if (!remainder) return null;
        return remainder.split('/')[0];
    };

    // Subfolders visible while browsing galleryCurrentPath, combining folders that hold
    // photos with folders explicitly created (which may still be empty).
    const galleryChildFolders = Array.from(new Set([
        ...galleryItems.map(item => getChildFolderName(getItemPath(item), galleryCurrentPath)).filter(Boolean),
        ...galleryFolderRecords.map(rec => getChildFolderName(rec.path, galleryCurrentPath)).filter(Boolean)
    ])).sort((a, b) => a.localeCompare(b));

    // Photos that live directly inside the folder currently being browsed (not in a deeper subfolder).
    const galleryItemsHere = galleryItems.filter(item => getItemPath(item) === galleryCurrentPath);

    const getFolderItemCount = (fullPath) => galleryItems.filter(item => {
        const itemPath = getItemPath(item);
        return itemPath === fullPath || itemPath.startsWith(`${fullPath}/`);
    }).length;

    const handleCreateGalleryFolder = async () => {
        const name = galleryNewFolderName.trim();
        if (!name) return;
        const fullPath = galleryCurrentPath ? `${galleryCurrentPath}/${name}` : name;
        if (galleryChildFolders.some(existing => existing.toLowerCase() === name.toLowerCase())) {
            alert('A folder with that name already exists here.');
            return;
        }
        try {
            await addDoc(collection(db, 'galleryFolders'), {
                path: fullPath,
                name,
                parentPath: galleryCurrentPath,
                createdAt: serverTimestamp()
            });
            setGalleryNewFolderName('');
            setIsCreatingGalleryFolder(false);
        } catch (error) {
            console.error('Error creating gallery folder:', error);
            alert('Could not create the folder. Please try again.');
        }
    };

    const handleDeleteGalleryFolder = async (fullPath) => {
        const itemCount = getFolderItemCount(fullPath);
        const confirmMsg = itemCount > 0
            ? `Delete "${fullPath}" and all ${itemCount} photo${itemCount === 1 ? '' : 's'} inside it (including subfolders)? This can't be undone.`
            : `Delete the empty folder "${fullPath}"?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const photosToDelete = galleryItems.filter(item => {
                const itemPath = getItemPath(item);
                return itemPath === fullPath || itemPath.startsWith(`${fullPath}/`);
            });
            const foldersToDelete = galleryFolderRecords.filter(rec =>
                rec.path === fullPath || rec.path.startsWith(`${fullPath}/`)
            );

            const batch = writeBatch(db);
            photosToDelete.forEach(item => batch.delete(doc(db, 'gallery', item.id)));
            foldersToDelete.forEach(rec => batch.delete(doc(db, 'galleryFolders', rec.id)));
            await batch.commit();
        } catch (error) {
            console.error('Error deleting gallery folder:', error);
            alert('Could not delete the folder. Please try again.');
        }
    };

    const handleGalleryMultiUpload = async (event) => {
        event.preventDefault();
        if (!galleryUploadFiles.length) {
            alert('Please select one or more images.');
            return;
        }

        setGalleryUploading(true);
        let uploaded = 0;
        try {
            for (const file of galleryUploadFiles) {
                const image = await compressImageToDataUrl(file);
                const title = galleryForm.title.trim()
                    ? (galleryUploadFiles.length === 1 ? galleryForm.title.trim() : `${galleryForm.title.trim()} - ${file.name.replace(/\.[^/.]+$/, '')}`)
                    : file.name.replace(/\.[^/.]+$/, '');

                await addDoc(collection(db, 'gallery'), {
                    title,
                    folderPath: galleryCurrentPath || 'Uncategorized',
                    image,
                    description: galleryForm.description.trim(),
                    fileName: file.name,
                    createdAt: serverTimestamp()
                });
                uploaded += 1;
            }

            const destinationLabel = galleryCurrentPath || 'Home';
            alert(`${uploaded} image${uploaded === 1 ? '' : 's'} uploaded successfully to "${destinationLabel}".`);
            setGalleryUploadFiles([]);
            setGalleryForm({ title: '', description: '', files: [] });
            event.target.reset();
        } catch (error) {
            console.error('Gallery multi-upload failed:', error);
            alert(`Upload stopped after ${uploaded} image${uploaded === 1 ? '' : 's'}. ${error.message || 'Please try again.'}`);
        } finally {
            setGalleryUploading(false);
        }
    };

    // Opens the edit modal for a gallery photo, pre-filling the form with its current details.
    const handleStartEditGallery = (item) => {
        setEditingGalleryId(item.id);
        setEditGalleryForm({
            title: item.title || '',
            description: item.description || '',
            folderPath: getItemPath(item),
            image: item.image || ''
        });
        setEditGalleryNewImageFile(null);
        setEditGalleryImagePreview('');
    };

    const handleCancelEditGallery = () => {
        setEditingGalleryId(null);
        setEditGalleryForm({ title: '', description: '', folderPath: '', image: '' });
        setEditGalleryNewImageFile(null);
        setEditGalleryImagePreview('');
    };

    // Lets the admin swap in a new image file for the photo being edited, with an instant preview.
    const handleEditGalleryImageChange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedFormats.includes(file.type.toLowerCase())) {
            alert(`${file.name}: unsupported image format. Use JPG, JPEG, PNG or WEBP.`);
            event.target.value = '';
            return;
        }
        setEditGalleryNewImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setEditGalleryImagePreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    // Saves edits (title, description, folder, and optionally a replacement image) to Firestore.
    const handleSaveGalleryEdit = async (event) => {
        event.preventDefault();
        if (!editingGalleryId) return;

        setGalleryUpdating(true);
        try {
            const updates = {
                title: editGalleryForm.title.trim() || 'Untitled',
                description: editGalleryForm.description.trim(),
                folderPath: editGalleryForm.folderPath.trim() || 'Uncategorized'
            };

            if (editGalleryNewImageFile) {
                updates.image = await compressImageToDataUrl(editGalleryNewImageFile);
                updates.fileName = editGalleryNewImageFile.name;
            }

            await updateDoc(doc(db, 'gallery', editingGalleryId), updates);
            handleCancelEditGallery();
        } catch (error) {
            console.error('Error updating gallery photo:', error);
            alert(error.message || 'Could not update the photo. Please try again.');
        } finally {
            setGalleryUpdating(false);
        }
    };

    const handleTabClick = (tabKey, extraCallback) => {
        setActiveTab(tabKey);
        setIsMobileMenuOpen(false);
        if (extraCallback) extraCallback();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const contentPane = document.querySelector('.od-content');
        if (contentPane) contentPane.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fetchAdmissionApplications = async () => {
        setAdmissionLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "admissions"));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAdmissionApplications(list);
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setAdmissionLoading(false);
        }
    };

    const [approvalSections, setApprovalSections] = useState({});

    const handleApproveAdmission = async (app) => {
        try {
            const assignedSectionName = approvalSections[app.id] || 'Section A';
            const appRef = doc(db, "admissions", app.id);
            await updateDoc(appRef, { status: 'Approved' });

            const targetGrade = app.grade;
            const sectionsQuery = query(
                collection(db, "class_sections"),
                where("className", "==", targetGrade),
                where("name", "==", assignedSectionName)
            );
            const sectionSnap = await getDocs(sectionsQuery);

            let resolvedSectionId = '';
            if (!sectionSnap.empty) {
                resolvedSectionId = sectionSnap.docs[0].id;
            } else {
                const newSectionRef = await addDoc(collection(db, "class_sections"), {
                    className: targetGrade,
                    name: assignedSectionName,
                    roomNo: '101',
                    createdAt: serverTimestamp()
                });
                resolvedSectionId = newSectionRef.id;
            }

            const studentErpData = {
                admissionId: app.id,
                admissionNo: app.acknowledgementNumber || 'HCMS20260000',
                name: `${app.firstName} ${app.middleName ? app.middleName + ' ' : ''}${app.lastName}`,
                className: targetGrade,
                grade: targetGrade,
                sectionName: assignedSectionName,
                sectionId: resolvedSectionId,
                guardianName: app.parentName,
                phone: app.phone,
                address: app.address,
                status: 'Active',
                enrolledAt: serverTimestamp()
            };

            await setDoc(doc(db, "students_erp", app.id), studentErpData);
            await addDoc(collection(db, "students_records"), studentErpData);

            alert(`Application approved! Student registered into Student ERP.`);
            fetchAdmissionApplications();
        } catch (error) {
            console.error("Error approving application:", error);
        }
    };

    const handleRejectAdmission = async (appId) => {
        if (!window.confirm("Are you sure you want to reject this application?")) return;
        try {
            const appRef = doc(db, "admissions", appId);
            await updateDoc(appRef, { status: 'Rejected' });
            alert("Application marked as Rejected.");
            fetchAdmissionApplications();
        } catch (error) {
            console.error("Error rejecting application:", error);
        }
    };

    const handleDeleteAdmission = async (appId) => {
        if (!window.confirm("Are you sure you want to permanently delete this application?")) return;
        try {
            await deleteDoc(doc(db, "admissions", appId));
            setAdmissionApplications(admissionApplications.filter(item => item.id !== appId));
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    };

    const getAdmissionInitials = (app) => {
        const first = (app.firstName || '')[0] || '';
        const last = (app.lastName || '')[0] || '';
        return (first + last).toUpperCase() || '?';
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

        fetchAdmissionApplications();
        const unsubCalendar = onSnapshot(collection(db, 'academic_calendar'), snap =>
            setCalendarEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubAdmins = onSnapshot(collection(db, 'administrators'), snap =>
            setAdministrators(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubToppers = onSnapshot(collection(db, 'exam_toppers'), snap =>
            setToppers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubEvents = onSnapshot(collection(db, 'upcoming_events'), snap =>
            setUpcomingEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubGallery = onSnapshot(collection(db, 'gallery'), snap =>
            setGalleryItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubGalleryFolders = onSnapshot(collection(db, 'galleryFolders'), snap =>
            setGalleryFolderRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
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
        const unsubFees = onSnapshot(collection(db, 'fee_records'), snap =>
            setFeeRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubIdCards = onSnapshot(collection(db, 'id_cards'), snap =>
            setIdCards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );

        return () => {
            unsubCalendar();
            unsubAdmins();
            unsubToppers();
            unsubEvents();
            unsubGallery();
            unsubGalleryFolders();
            unsubHolidays();
            unsubAnnouncements();
            unsubStaff();
            unsubSections();
            unsubStudents();
            unsubStaffTT();
            unsubStudentTT();
            unsubFees();
            unsubIdCards();
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
        if (window.confirm('Are you sure you want to remove this seclected one?')) {
            try {
                await deleteDoc(doc(db, collectionName, id));
            } catch (error) {
                console.error("Error deleting document: ", error);
            }
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

    const handleAddFeeRecord = async (e) => {
        e.preventDefault();
        if (!feeForm.studentId) return;
        const total = parseFloat(feeForm.totalFee) || 0;
        const paid = parseFloat(feeForm.paid) || 0;
        const due = Math.max(total - paid, 0);
        const status = due === 0 ? 'Paid' : (paid === 0 ? 'Pending' : 'Partial');
        await handlePublish('fee_records', {
            studentId: feeForm.studentId,
            studentName: feeForm.studentName,
            className: feeForm.className,
            totalFee: total,
            paid,
            due,
            status
        }, () => setFeeForm(initialFeeForm));
    };

    const handleGenerateIdCard = async (type, ref) => {
        const already = idCards.find(c => c.refId === ref.id && c.type === type);
        if (already) return;
        await handlePublish('id_cards', {
            type,
            refId: ref.id,
            name: ref.name,
            code: type === 'student' ? ref.admissionNo : ref.staffId,
            className: ref.className || '',
            department: ref.department || ''
        });
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

    // Class Incharge Teachers: assign (or reassign/clear) a teacher as a class section's incharge
    const handleAssignClassIncharge = async () => {
        if (!selectedInchargeSectionId) return;
        const selectedStaffMember = staffList.find(s => s.id === selectedInchargeTeacherId);
        setInchargeAssigning(true);
        try {
            await updateDoc(doc(db, 'class_sections', selectedInchargeSectionId), {
                classInchargeId: selectedInchargeTeacherId || '',
                classIncharge: selectedStaffMember ? selectedStaffMember.name : ''
            });
            setInchargeSavedMsg(true);
            setTimeout(() => setInchargeSavedMsg(false), 2000);
        } catch (error) {
            console.error("Error assigning class incharge: ", error);
        } finally {
            setInchargeAssigning(false);
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
            address: studentForm.address.trim(),
            gender: studentForm.gender,
            rollNumber: studentForm.rollNumber.trim(),
            email: studentForm.email.trim(),
            parentPhone: studentForm.parentPhone.trim(),
            relationship: studentForm.relationship,
            status: studentForm.status || 'Active'
        }, () => setStudentForm(initialStudentForm));
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        if (!editingStudentId || !studentForm.name.trim() || !studentForm.admissionNo.trim()) return;

        try {
            await updateDoc(doc(db, 'students_records', editingStudentId), {
                admissionNo: studentForm.admissionNo.trim(),
                admissionDate: studentForm.admissionDate,
                name: studentForm.name.trim(),
                dob: studentForm.dob,
                photo: studentForm.photo.trim(),
                bloodGroup: studentForm.bloodGroup.trim(),
                guardianName: studentForm.guardianName.trim(),
                phone: studentForm.phone.trim(),
                address: studentForm.address.trim(),
                gender: studentForm.gender,
                rollNumber: studentForm.rollNumber.trim(),
                email: studentForm.email.trim(),
                parentPhone: studentForm.parentPhone.trim(),
                relationship: studentForm.relationship,
                status: studentForm.status || 'Active'
            });
            setEditingStudentId(null);
            setStudentForm(initialStudentForm);
        } catch (error) {
            console.error("Error updating student record: ", error);
        }
    };

    const startEditingStudent = (student) => {
        setEditingStudentId(student.id);
        setShowAddStudentForm(true);
        setStudentForm({
            admissionNo: student.admissionNo || '',
            admissionDate: student.admissionDate || '',
            name: student.name || '',
            dob: student.dob || '',
            photo: student.photo || '',
            bloodGroup: student.bloodGroup || '',
            guardianName: student.guardianName || '',
            phone: student.phone || '',
            address: student.address || '',
            gender: student.gender || '',
            rollNumber: student.rollNumber || '',
            email: student.email || '',
            parentPhone: student.parentPhone || '',
            relationship: student.relationship || '',
            status: student.status || 'Active'
        });

        if (studentFormRef.current) {
            studentFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

    const handleUpdateStudentTimetable = async (e) => {
        e.preventDefault();
        if (!editingStudentTTId) return;

        const rawSection = editStudentTTForm.sectionName.trim();
        const formattedSection = rawSection.toLowerCase().startsWith('section')
            ? rawSection
            : `Section ${rawSection}`;

        try {
            await updateDoc(doc(db, 'student_timetables', editingStudentTTId), {
                className: editStudentTTForm.className.trim(),
                sectionName: formattedSection,
                day: editStudentTTForm.day,
                timeSlot: editStudentTTForm.timeSlot.trim(),
                subject: editStudentTTForm.subject.trim(),
                teacherName: editStudentTTForm.teacherName.trim(),
                roomNo: editStudentTTForm.roomNo.trim()
            });
            setEditingStudentTTId(null);
            setEditStudentTTForm(initialStudentTimetableForm);
        } catch (error) {
            console.error("Error updating student timetable slot:", error);
        }
    };

    const handleAddStaffTimetable = async (e) => {
        e.preventDefault();

        if (
            !staffTimetableForm.staffId ||
            !staffTimetableForm.subject ||
            !staffTimetableForm.timeSlot ||
            !staffTimetableForm.className ||
            !staffTimetableForm.sectionName
        ) {
            alert('Please select Staff, Time Slot, Subject, Class and Section.');
            return;
        }

        const selectedStaff = staffList.find(
            (s) => s.staffId === staffTimetableForm.staffId
        );

        const resolvedStaffName = selectedStaff
            ? selectedStaff.name
            : staffTimetableForm.staffName;

        await handlePublish(
            'staff_timetables',
            {
                staffId: staffTimetableForm.staffId,
                staffName: resolvedStaffName,
                day: staffTimetableForm.day,
                timeSlot: staffTimetableForm.timeSlot.trim(),
                subject: staffTimetableForm.subject.trim(),

                // IMPORTANT:
                // These are now stored separately for StaffDashboard attendance sync
                className: staffTimetableForm.className.trim(),
                sectionName: staffTimetableForm.sectionName.trim(),

                roomNo: staffTimetableForm.roomNo.trim()
            },
            () => setStaffTimetableForm(initialStaffTimetableForm)
        );
    };
    const handleUpdateStaffTimetable = async (e) => {
        e.preventDefault();

        if (!editingStaffTTId) return;

        if (
            !editStaffTTForm.staffId ||
            !editStaffTTForm.subject ||
            !editStaffTTForm.timeSlot ||
            !editStaffTTForm.className ||
            !editStaffTTForm.sectionName
        ) {
            alert('Please select Staff, Time Slot, Subject, Class and Section.');
            return;
        }

        const selectedStaff = staffList.find(
            (s) => s.staffId === editStaffTTForm.staffId
        );

        const resolvedStaffName = selectedStaff
            ? selectedStaff.name
            : editStaffTTForm.staffName;

        try {
            await updateDoc(
                doc(db, 'staff_timetables', editingStaffTTId),
                {
                    staffId: editStaffTTForm.staffId,
                    staffName: resolvedStaffName,
                    day: editStaffTTForm.day,
                    timeSlot: editStaffTTForm.timeSlot.trim(),
                    subject: editStaffTTForm.subject.trim(),

                    // Exact timetable class and section
                    className: editStaffTTForm.className.trim(),
                    sectionName: editStaffTTForm.sectionName.trim(),

                    roomNo: editStaffTTForm.roomNo.trim()
                }
            );

            setEditingStaffTTId(null);
            setEditStaffTTForm(initialStaffTimetableForm);

        } catch (error) {
            console.error(
                'Error updating staff timetable slot:',
                error
            );
        }
    };

    const handleBroadcastEmergency = async (e) => {
        e.preventDefault();
        if (!emergencyNotice.trim()) return;
        await handlePublish('announcements', {
            content: `🚨 [EMERGENCY/URGENT] ${emergencyNotice.trim()}`
        }, () => {
            setEmergencyNotice('');
            alert('Emergency broadcast published live to staff and student dashboards.');
        });
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        setSettingsSavedMsg(true);
        setTimeout(() => setSettingsSavedMsg(false), 3500);
    };

    const searchMatchStudents = studentsList.filter(s =>
        globalSearch.trim() !== '' && (
            s.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
            s.admissionNo?.toLowerCase().includes(globalSearch.toLowerCase()) ||
            s.className?.toLowerCase().includes(globalSearch.toLowerCase())
        )
    );

    const searchMatchStaff = staffList.filter(s =>
        globalSearch.trim() !== '' && (
            s.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
            s.staffId?.toLowerCase().includes(globalSearch.toLowerCase()) ||
            s.department?.toLowerCase().includes(globalSearch.toLowerCase())
        )
    );

    const handleAddStaff = async (e) => {
        e.preventDefault();
        if (!staffForm.name.trim() || !staffForm.staffId.trim()) return;
        await handlePublish('staff_members', {
            name: staffForm.name.trim(),
            staffId: staffForm.staffId.trim(),
            password: staffForm.password.trim(),
            department: staffForm.department.trim(),
            email: staffForm.email.trim(),
            photo: staffForm.photo || ''
        }, () => setStaffForm(initialStaffForm));
    };

    const handleStartEditStaff = (member) => {
        setEditingStaffId(member.id);
        setEditStaffForm({
            name: member.name || '',
            staffId: member.staffId || '',
            password: member.password || '',
            department: member.department || '',
            email: member.email || '',
            photo: member.photo || ''
        });
    };

    const handleUpdateStaff = async (id) => {
        if (!editStaffForm.name.trim() || !editStaffForm.staffId.trim()) return;
        try {
            await updateDoc(doc(db, 'staff_members', id), {
                name: editStaffForm.name.trim(),
                staffId: editStaffForm.staffId.trim(),
                password: editStaffForm.password.trim(),
                department: editStaffForm.department.trim(),
                email: editStaffForm.email.trim(),
                photo: editStaffForm.photo || ''
            });
            setEditingStaffId(null);
            setEditStaffForm(initialStaffForm);
        } catch (error) {
            console.error("Error updating staff member: ", error);
        }
    };

    if (authLoading) {
        return <div style={{ textAlign: 'center', padding: '350px' }}>Checking Authorization...</div>;
    }

    if (!user) {
        return <AdminLogin />;
    }

    // ---- Office-style navigation helpers ----
    const tabCallbacks = {
        admission_panel: fetchAdmissionApplications,
        students: () => { setSelectedClass(null); setSelectedSection(null); },
        class_incharge: () => { setSelectedInchargeClass(''); setSelectedInchargeSectionId(''); setSelectedInchargeTeacherId(''); },
        results: () => { setSelectedClassResults(null); setSelectedSectionResults(null); },
        student_timetable: () => { setSelectedClassTT(null); setSelectedSectionTT(null); },
        staff_timetable: () => { setSelectedStaffTT(null); setSelectedStaffDayTT(null); },
    };
    const goTo = (tab) => { handleTabClick(tab, tabCallbacks[tab]); setNavQuery(''); };
    const searchMatches = navQuery.trim()
        ? Object.entries(tabMeta).filter(([, m]) => m.title.toLowerCase().includes(navQuery.trim().toLowerCase()))
        : [];
    const navItem = (tab, Icon, label) => (
        <button
            type="button"
            key={tab}
            className={`od-nav-item ${activeTab === tab ? 'is-active' : ''}`}
            aria-current={activeTab === tab ? 'page' : undefined}
            onClick={() => goTo(tab)}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );
    const navGroup = (label, Icon, isOpen, toggle, children) => (
        <>
            <button
                type="button"
                className="od-nav-item od-nav-group-btn"
                aria-expanded={isOpen}
                onClick={toggle}
            >
                <Icon size={18} />
                <span>{label}</span>
                <ChevronDown size={16} className="od-chev" />
            </button>
            {isOpen && <div className="od-nav-children">{children}</div>}
        </>
    );
    const longDate = currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
    const hour = currentTime.getHours();
    const greetingWord = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="od-app admin-od">
            {isMobileMenuOpen && (
                <button
                    type="button"
                    className="od-scrim is-shown"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close navigation"
                />
            )}

            {/* Sidebar */}
            <aside className={`od-side od-glass ${isMobileMenuOpen ? 'is-open' : ''}`} ref={sidebarRef}>
                <div className="od-profile">
                    <div className="od-logo"><img src={logo} alt="School logo" id="logogs" /></div>
                    <div className="od-profile-text">
                        <b>Admin Control</b>
                        <small>{user.email}</small>
                        <span className="od-chip">Super Admin</span>
                    </div>
                </div>

                <nav className="od-nav" aria-label="Main">
                    {navItem('analytics', LayoutGrid, 'Dashboard')}

                    <div className="od-nav-label">Admissions</div>
                    {navItem('admission_panel', FileText, 'Admission panel')}

                    <div className="od-nav-label">Website</div>
                    {navGroup('Updates', Radio, updatesOpen, () => setUpdatesOpen(!updatesOpen), <>
                        {navItem('announcements', Bell, 'Announcements')}
                        {navItem('upcoming_events', Calendar, 'Upcoming events')}
                        {navItem('toppers', Award, 'Toppers & achievers')}
                        {navItem('calendar', Clock, 'Academic calendar')}
                        {navItem('admins', Shield, 'Administrators')}
                        {navItem('gallery', ImageIcon, 'Photo gallery')}
                        {navItem('holidays', Sun, 'School holidays')}
                    </>)}

                    <div className="od-nav-label">School ERP</div>
                    {navGroup('ERP management', Users, erpOpen, () => setErpOpen(!erpOpen), <>
                        {navItem('staff', Users, 'Staff directory')}
                        {navItem('students', GraduationCap, 'Students ERP')}
                        {navItem('class_incharge', UserCheck, 'Class incharge')}
                        {navItem('results', Award, 'Results & publish')}
                    </>)}
                    {navGroup('Timetables', Clock, timetableOpen, () => setTimetableOpen(!timetableOpen), <>
                        {navItem('student_timetable', Clock, 'Student schedule')}
                        {navItem('staff_timetable', Clock, 'Staff schedule')}
                    </>)}

                    <div className="od-nav-label">System</div>
                    {navItem('settings', Settings, 'System controls')}
                    {navItem('idcards', ShieldCheck, 'ID card management')}
                </nav>

                <div className="od-side-foot">
                    <button type="button" className="od-signout" onClick={() => signOut(auth)}>
                        <LogOut size={17} /><span>Sign out</span>
                    </button>
                </div>
            </aside>

            {/* Main panel */}
            <main className="od-main od-glass">
                <header className="od-top">
                    <div className="od-top-left">
                        <button
                            type="button"
                            className="od-menu-btn"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1>{currentTabMeta.title}</h1>
                    </div>

                    <div className="od-search">
                        <Search size={17} />
                        <input
                            type="search"
                            value={navQuery}
                            placeholder="Jump to a page…"
                            aria-label="Jump to a page"
                            onChange={e => setNavQuery(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && searchMatches[0]) goTo(searchMatches[0][0]);
                                if (e.key === 'Escape') setNavQuery('');
                            }}
                        />
                        {navQuery.trim() && (
                            <div className="od-results">
                                {searchMatches.length === 0
                                    ? <p>No page matches “{navQuery.trim()}”.</p>
                                    : searchMatches.map(([tab, m]) => (
                                        <button type="button" key={tab} onClick={() => goTo(tab)}>{m.title}</button>
                                    ))}
                            </div>
                        )}
                    </div>

                    <div className="od-top-right">
                        <span className="od-pill is-live">Live sync</span>
                        <button
                            type="button"
                            className="od-bell"
                            onClick={() => goTo('announcements')}
                            title="Announcements"
                            aria-label="Open announcements"
                        >
                            <Bell size={18} />
                        </button>
                        <button type="button" className="od-pill" onClick={() => goTo('settings')}><Settings size={16} /> Settings</button>
                    </div>
                </header>

                <div className="od-content">
                    {/* UPCOMING EVENTS */}
                    {activeTab === 'upcoming_events' && (
                        <section className="px-page" style={{ '--tone': '#1fb27a', '--tone-soft': '#e2f7ee' }}>
                            <PxHead icon={Calendar} title="Upcoming events" desc="Events and activities shown to parents and students on the school website." count={upcomingEvents.length} countLabel="published" />
                            <div className="px-split">
                                <form
                                    className="px-card px-compose"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handlePublish('upcoming_events', eventForm, () =>
                                            setEventForm({ month: 'SEP', day: '12', title: '', description: '', time: '9:00 AM Onwards' })
                                        );
                                    }}
                                >
                                    <h3>Publish an event</h3>
                                    <div className="px-preview px-preview-event" aria-hidden="true">
                                        <span className="px-datetile"><b>{eventForm.day || '--'}</b><small>{eventForm.month || '---'}</small></span>
                                        <div>
                                            <strong>{eventForm.title || 'Event title'}</strong>
                                            <span>{eventForm.time || 'Time details'}</span>
                                        </div>
                                    </div>
                                    <div className="px-row2">
                                        <label className="px-field"><span>Month</span><input type="text" placeholder="SEP" value={eventForm.month} onChange={e => setEventForm({ ...eventForm, month: e.target.value })} required /></label>
                                        <label className="px-field"><span>Day</span><input type="text" placeholder="12" value={eventForm.day} onChange={e => setEventForm({ ...eventForm, day: e.target.value })} required /></label>
                                    </div>
                                    <label className="px-field"><span>Event title</span><input type="text" placeholder="Annual Sports Day" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} required /></label>
                                    <label className="px-field"><span>Time</span><input type="text" placeholder="9:00 AM Onwards" value={eventForm.time} onChange={e => setEventForm({ ...eventForm, time: e.target.value })} required /></label>
                                    <label className="px-field"><span>Description</span><textarea rows="3" placeholder="What should families know about this event?" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} required /></label>
                                    <button type="submit" className="px-btn primary"><PlusCircle size={16} /> Publish event</button>
                                </form>

                                <div className="px-card px-list-card">
                                    <div className="px-list-head"><h3>Published events</h3><span className="px-count">{upcomingEvents.length}</span></div>
                                    {upcomingEvents.length === 0 ? (
                                        <PxEmpty icon={Calendar} title="No events published yet" text="Events you publish will appear here and on the website." />
                                    ) : (
                                        <ul className="px-list">
                                            {upcomingEvents.map(item => (
                                                <li className="px-item px-event" key={item.id}>
                                                    <span className="px-datetile"><b>{item.day}</b><small>{item.month}</small></span>
                                                    <div className="px-item-body">
                                                        <h4>{item.title}</h4>
                                                        {item.description && <p>{item.description}</p>}
                                                        <span className="px-chip"><Clock size={12} /> {item.time}</span>
                                                    </div>
                                                    <button type="button" className="px-icon-btn danger" onClick={() => handleDelete('upcoming_events', item.id)} aria-label={`Delete ${item.title}`} title="Delete event"><Trash2 size={15} /></button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TOPPERS & ACHIEVERS */}
                    {activeTab === 'toppers' && (
                        <section className="px-page" style={{ '--tone': '#e59a1a', '--tone-soft': '#fff2d9' }}>
                            <PxHead icon={Trophy} title="Toppers & achievers" desc="Celebrate board exam toppers. Class X is listed first, then Class XII, ordered by rank." count={toppers.length} countLabel="profiles" />
                            <div className="px-split">
                                <form
                                    className="px-card px-compose"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handlePublish('exam_toppers', topperForm, () =>
                                            setTopperForm({ name: '', streamOrGrade: '', scoreOrPercentage: '', photo: '', rank: '1' })
                                        );
                                    }}
                                >
                                    <h3>Publish a topper</h3>
                                    <label className="px-field"><span>Student name</span><input type="text" placeholder="Aarthi S." value={topperForm.name} onChange={e => setTopperForm({ ...topperForm, name: e.target.value })} required /></label>
                                    <div className="px-row2">
                                        <label className="px-field">
                                            <span>Class</span>
                                            <select value={topperForm.streamOrGrade} onChange={e => setTopperForm({ ...topperForm, streamOrGrade: e.target.value })} required>
                                                <option value="">Select class</option>
                                                <option value="Class X">Class X</option>
                                                <option value="Class XII">Class XII</option>
                                            </select>
                                        </label>
                                        <label className="px-field">
                                            <span>Rank</span>
                                            <select value={topperForm.rank} onChange={e => setTopperForm({ ...topperForm, rank: e.target.value })}>
                                                <option value="1">1st (Gold)</option>
                                                <option value="2">2nd (Silver)</option>
                                                <option value="3">3rd (Bronze)</option>
                                            </select>
                                        </label>
                                    </div>
                                    <label className="px-field"><span>Score or achievement</span><input type="text" placeholder="491 / 500 (District Rank)" value={topperForm.scoreOrPercentage} onChange={e => setTopperForm({ ...topperForm, scoreOrPercentage: e.target.value })} required /></label>
                                    <div className="px-field">
                                        <span>Student photo</span>
                                        <label className="px-upload">
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onChange={e => handleImageUpload(e.target.files[0], (base64) => setTopperForm({ ...topperForm, photo: base64 }))}
                                            />
                                            {topperForm.photo
                                                ? <img src={topperForm.photo} alt="Preview" />
                                                : <span className="px-upload-ico"><Camera size={18} /></span>}
                                            <span className="px-upload-text">
                                                <b>{topperForm.photo ? 'Change photo' : 'Upload photo'}</b>
                                                <small>JPG, PNG or WEBP. Compressed automatically.</small>
                                            </span>
                                        </label>
                                        {topperForm.photo && (
                                            <button type="button" className="px-link-danger" onClick={() => setTopperForm({ ...topperForm, photo: '' })}>Remove photo</button>
                                        )}
                                    </div>
                                    <button type="submit" className="px-btn primary"><PlusCircle size={16} /> Publish topper</button>
                                </form>

                                <div className="px-card px-list-card">
                                    <div className="px-list-head"><h3>Published toppers</h3><span className="px-count">{toppers.length}</span></div>
                                    {toppers.length === 0 ? (
                                        <PxEmpty icon={Trophy} title="No toppers published yet" text="Add your first topper to feature them on the website." />
                                    ) : (() => {
                                        const sorted = sortToppers(toppers);
                                        const groups = [
                                            ['Class X', sorted.filter(t => getTopperClassOrder(t.streamOrGrade) === 1)],
                                            ['Class XII', sorted.filter(t => getTopperClassOrder(t.streamOrGrade) === 2)],
                                            ['Other achievers', sorted.filter(t => getTopperClassOrder(t.streamOrGrade) === 99)]
                                        ].filter(g => g[1].length > 0);
                                        const ordinal = (r) => ({ '1': '1st', '2': '2nd', '3': '3rd' }[String(r)] || `${r || 3}th`);
                                        return groups.map(([label, items]) => (
                                            <div className="px-group" key={label}>
                                                <h4 className="px-group-title">{label}<small>{items.length}</small></h4>
                                                <div className="px-topper-grid">
                                                    {items.map(item => (
                                                        <article className={`px-topper rank-${['1', '2', '3'].includes(String(item.rank)) ? item.rank : '3'}`} key={item.id}>
                                                            <button type="button" className="px-icon-btn danger px-corner" onClick={() => handleDelete('exam_toppers', item.id)} aria-label={`Delete ${item.name}`} title="Delete topper"><Trash2 size={14} /></button>
                                                            <div className="px-topper-photo">
                                                                {item.photo ? <img src={item.photo} alt={item.name} /> : <span>{(item.name || '?').charAt(0).toUpperCase()}</span>}
                                                                <em className="px-medal">{ordinal(item.rank)}</em>
                                                            </div>
                                                            <h5>{item.name}</h5>
                                                            <p>{item.scoreOrPercentage}</p>
                                                            <span className="px-chip">{item.streamOrGrade}</span>
                                                        </article>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ADMISSIONS ADMINISTRATION PANEL */}
                    {activeTab === 'admission_panel' && (
                        <>
                            <section className={`adm-access ${admissionOpen ? 'is-open' : 'is-closed'}`}>
                                <div className="adm-access-icon">
                                    {admissionOpen ? <CheckCircle size={22} /> : <Lock size={22} />}
                                </div>
                                <div className="adm-access-text">
                                    <h3>Public admissions are {admissionAccessLoading ? '…' : admissionOpen ? 'open' : 'closed'}</h3>
                                    <p>
                                        {admissionOpen
                                            ? 'Parents can view, register and log in on the admission pages.'
                                            : 'The admission pages (apply, register, login, continue) are blocked for visitors.'}
                                        {admissionAccessMeta?.updatedBy && (
                                            <small> Last changed by {admissionAccessMeta.updatedBy}.</small>
                                        )}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={admissionOpen}
                                    aria-label="Allow public admissions"
                                    className="adm-access-switch"
                                    disabled={admissionAccessLoading || admissionAccessSaving}
                                    onClick={toggleAdmissionAccess}
                                >
                                    <span />
                                </button>
                            </section>
                            {admissionOpen && (
                                <section className="adm-details">
                                    <div className="adm-details-head">
                                        <h3>Admission details</h3>
                                        <p>Shown to parents on the admission pages. Changes go live when you save.</p>
                                    </div>

                                    <div className="adm-details-grid">
                                        <label>
                                            <span>Academic year</span>
                                            <input
                                                type="text"
                                                value={admissionDraft.academicYear}
                                                placeholder="2026–27"
                                                onChange={(e) => updateAdmissionDraft({ academicYear: e.target.value })}
                                            />
                                        </label>
                                        <label>
                                            <span>Classes from</span>
                                            <select
                                                value={admissionDraft.classFrom}
                                                onChange={(e) => updateAdmissionDraft({ classFrom: e.target.value })}
                                            >
                                                {ADMISSION_CLASSES.map((c) => <option key={c} value={c}>{classLabel(c)}</option>)}
                                            </select>
                                        </label>
                                        <label>
                                            <span>Classes to</span>
                                            <select
                                                value={admissionDraft.classTo}
                                                onChange={(e) => updateAdmissionDraft({ classTo: e.target.value })}
                                            >
                                                {ADMISSION_CLASSES.map((c) => <option key={c} value={c}>{classLabel(c)}</option>)}
                                            </select>
                                        </label>
                                    </div>

                                    {admissionRangeInvalid && (
                                        <p className="adm-details-error">“Classes from” must come before “Classes to”.</p>
                                    )}

                                    <div className="adm-class-block">
                                        <strong>Accepting applications</strong>
                                        <p>Tap a class to close it, for example when seats are full. Tap again to reopen.</p>
                                        <div className="adm-class-chips">
                                            {ADMISSION_CLASSES.map((c, i) => {
                                                const inRange = !admissionRangeInvalid && i >= admissionFromIdx && i <= admissionToIdx;
                                                const closed = admissionDraft.closedClasses.includes(c);
                                                const state = !inRange ? 'is-out' : closed ? 'is-closed' : 'is-open';
                                                return (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        className={`adm-chip ${state}`}
                                                        disabled={!inRange}
                                                        aria-pressed={inRange && !closed}
                                                        onClick={() => toggleAdmissionClass(c)}
                                                    >
                                                        <b>{classLabel(c)}</b>
                                                        <span>{!inRange ? 'Not offered' : closed ? 'Closed' : 'Open'}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="adm-details-actions">
                                        <button
                                            type="button"
                                            className="adm-save"
                                            disabled={admissionAccessSaving || admissionRangeInvalid || !admissionDirty}
                                            onClick={saveAdmissionDetails}
                                        >
                                            <Save size={16} /> Save details
                                        </button>
                                        {admissionDirty && <span className="adm-unsaved">Unsaved changes</span>}
                                        {admissionDetailsSaved && <span className="adm-saved">Saved</span>}
                                    </div>
                                </section>
                            )}
                            <AdminAdmissionPanel />
                        </>
                    )}

                    {/* DASHBOARD — OVERVIEW, QUICK ACTIONS & DIRECTORY SEARCH */}
                    {activeTab === 'analytics' && (() => {
                        const pendingApps = admissionApplications.filter(a => (a.status || 'Pending') === 'Pending').length;
                        const approvedApps = admissionApplications.filter(a => a.status === 'Approved').length;
                        const approvedPct = admissionApplications.length ? Math.round((approvedApps / admissionApplications.length) * 100) : 0;
                        const recentEvents = upcomingEvents.slice(0, 4);
                        const recentNotices = announcements.slice(0, 4);

                        return (
                            <section className="dx">
                                {/* HERO */}
                                <div className="dx-hero">
                                    <span className="dx-orb dx-orb-a" aria-hidden="true" />
                                    <span className="dx-orb dx-orb-b" aria-hidden="true" />
                                    <div className="dx-hero-text">
                                        <span className="dx-date"><Calendar size={14} /> {longDate}</span>
                                        <h2>{greetingWord}, Admin</h2>
                                        <p>{studentsList.length} students, {staffList.length} staff and {announcements.length} published circulars are live across the institution.</p>
                                        <div className="dx-hero-actions">
                                            <button type="button" className="dx-btn is-light" onClick={handleDownloadReport}>
                                                Download report <ChevronRight size={16} />
                                            </button>
                                            <button type="button" className="dx-btn is-ghost" onClick={() => goTo('announcements')}>
                                                <Bell size={15} /> New announcement
                                            </button>
                                        </div>
                                    </div>
                                    <div className="dx-hero-stats">
                                        <button type="button" onClick={() => goTo('admission_panel')}>
                                            <strong>{pendingApps}</strong><span>Pending admissions</span>
                                        </button>
                                        <button type="button" onClick={() => goTo('upcoming_events')}>
                                            <strong>{upcomingEvents.length}</strong><span>Upcoming events</span>
                                        </button>
                                        <button type="button" onClick={() => goTo('calendar')}>
                                            <strong>{calendarEvents.length}</strong><span>Calendar entries</span>
                                        </button>
                                    </div>
                                </div>

                                {/* KPI CARDS */}
                                <div className="dx-kpis">
                                    <button type="button" className="dx-kpi" style={{ '--tone': '#6a5cf0', '--tone-soft': '#ece9ff' }} onClick={() => goTo('students')}>
                                        <span className="dx-kpi-icon"><GraduationCap size={22} /></span>
                                        <span className="dx-kpi-body">
                                            <small>Students enrolled</small>
                                            <strong>{studentsList.length}</strong>
                                            <em>{sectionsList.length} class sections</em>
                                        </span>
                                        <ChevronRight size={18} className="dx-kpi-go" />
                                    </button>
                                    <button type="button" className="dx-kpi" style={{ '--tone': '#1fb27a', '--tone-soft': '#e2f7ee' }} onClick={() => goTo('staff')}>
                                        <span className="dx-kpi-icon"><Users size={22} /></span>
                                        <span className="dx-kpi-body">
                                            <small>Faculty staff</small>
                                            <strong>{staffList.length}</strong>
                                            <em>{staffTimetables.length} work slots</em>
                                        </span>
                                        <ChevronRight size={18} className="dx-kpi-go" />
                                    </button>
                                    <button type="button" className="dx-kpi" style={{ '--tone': '#e59a1a', '--tone-soft': '#fff2d9' }} onClick={() => goTo('student_timetable')}>
                                        <span className="dx-kpi-icon"><Clock size={22} /></span>
                                        <span className="dx-kpi-body">
                                            <small>Timetable periods</small>
                                            <strong>{studentTimetables.length}</strong>
                                            <em>Across 14 standards</em>
                                        </span>
                                        <ChevronRight size={18} className="dx-kpi-go" />
                                    </button>
                                    <button type="button" className="dx-kpi" style={{ '--tone': '#f0587a', '--tone-soft': '#ffe9ee' }} onClick={() => goTo('announcements')}>
                                        <span className="dx-kpi-icon"><Bell size={22} /></span>
                                        <span className="dx-kpi-body">
                                            <small>Campus circulars</small>
                                            <strong>{announcements.length}</strong>
                                            <em>{calendarEvents.length} events on record</em>
                                        </span>
                                        <ChevronRight size={18} className="dx-kpi-go" />
                                    </button>
                                </div>

                                {/* MAIN GRID */}
                                <div className="dx-grid">
                                    <div className="dx-col">
                                        {/* QUICK ACTIONS */}
                                        <div className="dx-card">
                                            <div className="dx-card-head">
                                                <h3>Quick actions</h3>
                                                <span>Jump straight to a task</span>
                                            </div>
                                            <div className="dx-actions">
                                                <button type="button" style={{ '--tone': '#8a7dfa', '--tone-soft': '#efecff' }} onClick={() => goTo('results')}>
                                                    <i><Award size={20} /></i><b>Results &amp; publish</b><small>Manage exam results</small>
                                                </button>
                                                <button type="button" style={{ '--tone': '#3b9be8', '--tone-soft': '#e3f1ff' }} onClick={() => goTo('student_timetable')}>
                                                    <i><Clock size={20} /></i><b>Student timetable</b><small>Class schedules</small>
                                                </button>
                                                <button type="button" style={{ '--tone': '#f0587a', '--tone-soft': '#ffe9ee' }} onClick={() => goTo('announcements')}>
                                                    <i><Send size={20} /></i><b>Add announcement</b><small>Notify the campus</small>
                                                </button>
                                                <button type="button" style={{ '--tone': '#1fb27a', '--tone-soft': '#e2f7ee' }} onClick={() => goTo('upcoming_events')}>
                                                    <i><PlusCircle size={20} /></i><b>Create event</b><small>Publish an activity</small>
                                                </button>
                                                <button type="button" style={{ '--tone': '#e59a1a', '--tone-soft': '#fff2d9' }} onClick={() => goTo('admission_panel')}>
                                                    <i><FileText size={20} /></i><b>Admissions</b><small>Review applications</small>
                                                </button>
                                                <button type="button" style={{ '--tone': '#12a5b8', '--tone-soft': '#dff6f9' }} onClick={() => goTo('staff_timetable')}>
                                                    <i><UserCheck size={20} /></i><b>Staff timetable</b><small>Work schedules</small>
                                                </button>
                                            </div>
                                        </div>

                                        {/* DIRECTORY SEARCH */}
                                        <div className="dx-card">
                                            <div className="dx-card-head">
                                                <h3>Quick directory search</h3>
                                                <span>Students &amp; staff</span>
                                            </div>
                                            <div className="dx-search">
                                                <Search size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Search by student name, admission no, staff name, or ID..."
                                                    value={globalSearch}
                                                    onChange={(e) => setGlobalSearch(e.target.value)}
                                                />
                                                {globalSearch && (
                                                    <button type="button" aria-label="Clear search" onClick={() => setGlobalSearch('')}><X size={14} /></button>
                                                )}
                                            </div>

                                            {globalSearch.trim() !== '' && (
                                                <div className="dx-results">
                                                    <h5>Search results for "{globalSearch}"</h5>
                                                    <div className="dx-results-grid">
                                                        <div>
                                                            <strong className="dx-results-title">Matched students ({searchMatchStudents.length})</strong>
                                                            {searchMatchStudents.length === 0 ? <p className="dx-none">No students found.</p> : (
                                                                <ul>
                                                                    {searchMatchStudents.map(st => (
                                                                        <li key={st.id}>
                                                                            <span className="dx-avatar is-student">{(st.name || '?').charAt(0).toUpperCase()}</span>
                                                                            <div>
                                                                                <b>{st.name} <em>({st.className} - {st.sectionName})</em></b>
                                                                                <small>Adm: #{st.admissionNo} • DOB: {st.dob}</small>
                                                                            </div>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <strong className="dx-results-title">Matched staff ({searchMatchStaff.length})</strong>
                                                            {searchMatchStaff.length === 0 ? <p className="dx-none">No staff found.</p> : (
                                                                <ul>
                                                                    {searchMatchStaff.map(stf => (
                                                                        <li key={stf.id}>
                                                                            <span className="dx-avatar is-staff">{(stf.name || '?').charAt(0).toUpperCase()}</span>
                                                                            <div>
                                                                                <b>{stf.name} <em>({stf.department})</em></b>
                                                                                <small>ID: {stf.staffId} • Email: {stf.email}</small>
                                                                            </div>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="dx-col">
                                        {/* ADMISSIONS SNAPSHOT */}
                                        <div className="dx-card">
                                            <div className="dx-card-head">
                                                <h3>Admissions</h3>
                                                <button type="button" className="dx-link" onClick={() => goTo('admission_panel')}>View all <ChevronRight size={14} /></button>
                                            </div>
                                            <div className="dx-adm">
                                                <div><strong>{admissionApplications.length}</strong><span>Total</span></div>
                                                <div><strong>{pendingApps}</strong><span>Pending</span></div>
                                                <div><strong>{approvedApps}</strong><span>Approved</span></div>
                                            </div>
                                            <div className="dx-bar" role="progressbar" aria-valuenow={approvedPct} aria-valuemin="0" aria-valuemax="100">
                                                <span style={{ width: `${approvedPct}%` }} />
                                            </div>
                                            <p className="dx-bar-note">{approvedPct}% of applications approved</p>
                                        </div>

                                        {/* UPCOMING EVENTS */}
                                        <div className="dx-card">
                                            <div className="dx-card-head">
                                                <h3>Upcoming events</h3>
                                                <button type="button" className="dx-link" onClick={() => goTo('upcoming_events')}>Manage <ChevronRight size={14} /></button>
                                            </div>
                                            {recentEvents.length === 0 ? (
                                                <div className="dx-empty">No upcoming events published yet.</div>
                                            ) : (
                                                <ul className="dx-list">
                                                    {recentEvents.map(ev => (
                                                        <li key={ev.id}>
                                                            <span className="dx-datebox"><b>{ev.day}</b><small>{ev.month}</small></span>
                                                            <div><b>{ev.title}</b><small>{ev.time}</small></div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        {/* LATEST CIRCULARS */}
                                        <div className="dx-card">
                                            <div className="dx-card-head">
                                                <h3>Latest circulars</h3>
                                                <button type="button" className="dx-link" onClick={() => goTo('announcements')}>Manage <ChevronRight size={14} /></button>
                                            </div>
                                            {recentNotices.length === 0 ? (
                                                <div className="dx-empty">No announcements published yet.</div>
                                            ) : (
                                                <ul className="dx-list">
                                                    {recentNotices.map(n => (
                                                        <li key={n.id}>
                                                            <span className="dx-dot"><Bell size={15} /></span>
                                                            <div><b className="dx-clamp">{n.content}</b></div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );
                    })()}

                    {/* SYSTEM CONTROLS & EMERGENCY BROADCAST */}
                    {activeTab === 'settings' && (
                        <div className="applications-management-card">
                            <h3><Sliders size={18} color="var(--primary)" /> System Configuration & Emergency Dispatch</h3>

                            <div className="settings-category-grid">
                                <div className="settings-category-card"><div className="settings-category-icon blue"><Settings size={18} /></div><span>General Settings</span></div>
                                <div className="settings-category-card"><div className="settings-category-icon purple"><GraduationCap size={18} /></div><span>Academic Settings</span></div>
                                <div className="settings-category-card" onClick={() => handleTabClick('fees')}><div className="settings-category-icon orange"><FileText size={18} /></div><span>Fee Settings</span></div>
                                <div className="settings-category-card"><div className="settings-category-icon green"><Bell size={18} /></div><span>Notification Settings</span></div>
                                <div className="settings-category-card"><div className="settings-category-icon rose"><Database size={18} /></div><span>Backup Settings</span></div>
                            </div>

                            <form onSubmit={handleBroadcastEmergency} className="emergency-form">
                                <div className="emergency-header">
                                    <AlertTriangle size={18} color="var(--accent-danger)" />
                                    <div>
                                        <h4 style={{ margin: 0, color: 'var(--accent-danger)' }}>Dispatch Urgent Campus Broadcast</h4>
                                        <small style={{ color: 'var(--text-muted)' }}>Immediately streams this notice with an emergency badge to all student and faculty panels.</small>
                                    </div>
                                </div>
                                <textarea
                                    rows="2"
                                    placeholder="Enter urgent broadcast message..."
                                    value={emergencyNotice}
                                    onChange={(e) => setEmergencyNotice(e.target.value)}
                                    required
                                />
                                <button type="submit" className="add-notice-btn" style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}>
                                    <Radio size={15} /> Dispatch Emergency Alert
                                </button>
                            </form>

                            <h4 style={{ marginTop: '24px' }}>Institution Identity & Configuration</h4>
                            {settingsSavedMsg && (
                                <div className="settings-saved-pill">
                                    <Check size={14} /> Institution details updated successfully.
                                </div>
                            )}
                            <form onSubmit={handleSaveSettings}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>School / Institution Name</label>
                                    <input
                                        type="text"
                                        value={settingsForm.schoolName}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, schoolName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Active Academic Year</label>
                                    <input
                                        type="text"
                                        value={settingsForm.academicYear}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, academicYear: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Official Admin Contact Email</label>
                                    <input
                                        type="email"
                                        value={settingsForm.contactEmail}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Campus Helpline / Phone</label>
                                    <input
                                        type="text"
                                        value={settingsForm.helpline}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, helpline: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" className="add-notice-btn">
                                    <Save size={15} /> Save Institution Settings
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ID CARD MANAGEMENT TAB */}
                    {activeTab === 'idcards' && (() => {
                        const generatedThisMonth = idCards.filter(c => {
                            if (!c.createdAt?.toDate) return false;
                            const d = c.createdAt.toDate();
                            const now = new Date();
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length;
                        return (
                            <div className="applications-management-card">
                                <h3><ShieldCheck size={18} color="var(--primary)" /> ID Card Management</h3>

                                <div className="admin-kpi-grid kpi-cols-3">
                                    <div className="admin-kpi-card indigo">
                                        <div className="kpi-icon-wrapper"><GraduationCap size={22} /></div>
                                        <div className="kpi-info">
                                            <span>Students</span>
                                            <h4>{studentsList.length}</h4>
                                        </div>
                                    </div>
                                    <div className="admin-kpi-card emerald">
                                        <div className="kpi-icon-wrapper"><Users size={22} /></div>
                                        <div className="kpi-info">
                                            <span>Staff</span>
                                            <h4>{staffList.length}</h4>
                                        </div>
                                    </div>
                                    <div className="admin-kpi-card amber">
                                        <div className="kpi-icon-wrapper"><KeyRound size={22} /></div>
                                        <div className="kpi-info">
                                            <span>Generated This Month</span>
                                            <h4>{generatedThisMonth}</h4>
                                        </div>
                                    </div>
                                </div>

                                <h4 style={{ marginTop: '24px' }}>Students <span className="count-badge">{studentsList.length}</span></h4>
                                <div className="table-responsive-wrapper">
                                    <table className="custom-table">
                                        <thead>
                                            <tr><th>Name</th><th>Admission No</th><th>Class</th><th>Status</th><th>Action</th></tr>
                                        </thead>
                                        <tbody>
                                            {studentsList.length === 0 ? (
                                                <tr><td colSpan="5" className="no-data-cell">No students enrolled yet.</td></tr>
                                            ) : studentsList.map(st => {
                                                const generated = idCards.some(c => c.type === 'student' && c.refId === st.id);
                                                return (
                                                    <tr key={st.id}>
                                                        <td>{st.name}</td>
                                                        <td>{st.admissionNo}</td>
                                                        <td>{st.className}</td>
                                                        <td><span className={`status-pill ${generated ? 'status-present' : 'pending'}`}>{generated ? 'Generated' : 'Not Generated'}</span></td>
                                                        <td className="actions-cell">
                                                            <button className="icon-btn" disabled={generated} onClick={() => handleGenerateIdCard('student', st)} title="Generate ID Card"><FileText size={14} /></button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <h4 style={{ marginTop: '24px' }}>Staff <span className="count-badge">{staffList.length}</span></h4>
                                <div className="table-responsive-wrapper">
                                    <table className="custom-table">
                                        <thead>
                                            <tr><th>Name</th><th>Staff ID</th><th>Department</th><th>Status</th><th>Action</th></tr>
                                        </thead>
                                        <tbody>
                                            {staffList.length === 0 ? (
                                                <tr><td colSpan="5" className="no-data-cell">No staff members added yet.</td></tr>
                                            ) : staffList.map(stf => {
                                                const generated = idCards.some(c => c.type === 'staff' && c.refId === stf.id);
                                                return (
                                                    <tr key={stf.id}>
                                                        <td>{stf.name}</td>
                                                        <td>{stf.staffId}</td>
                                                        <td>{stf.department}</td>
                                                        <td><span className={`status-pill ${generated ? 'status-present' : 'pending'}`}>{generated ? 'Generated' : 'Not Generated'}</span></td>
                                                        <td className="actions-cell">
                                                            <button className="icon-btn" disabled={generated} onClick={() => handleGenerateIdCard('staff', stf)} title="Generate ID Card"><FileText size={14} /></button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ACADEMIC CALENDAR */}
                    {activeTab === 'calendar' && (
                        <section className="px-page" style={{ '--tone': '#3b9be8', '--tone-soft': '#e3f1ff' }}>
                            <PxHead icon={CalendarDays} title="Academic calendar" desc="Exams, meetings and key dates for the school year, grouped by month." count={calendarEvents.length} countLabel="dates" />
                            <div className="px-split">
                                <form
                                    className="px-card px-compose"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handlePublish('academic_calendar', calendarForm, () =>
                                            setCalendarForm({ month: '', date: '', day: '', title: '', category: 'General' })
                                        );
                                    }}
                                >
                                    <h3>Add a calendar date</h3>
                                    <label className="px-field">
                                        <span>Event date</span>
                                        <input
                                            type="date"
                                            value={calendarForm.date || ''}
                                            onChange={e => {
                                                const value = e.target.value;
                                                if (!value) {
                                                    setCalendarForm({ ...calendarForm, month: '', date: '', day: '' });
                                                    return;
                                                }

                                                const selectedDate = new Date(`${value}T00:00:00`);
                                                const month = selectedDate.toLocaleDateString('en-IN', {
                                                    month: 'long',
                                                    year: 'numeric'
                                                });
                                                const day = selectedDate.toLocaleDateString('en-IN', {
                                                    weekday: 'short'
                                                });

                                                setCalendarForm({
                                                    ...calendarForm,
                                                    month,
                                                    date: value,
                                                    day
                                                });
                                            }}
                                            required
                                        />
                                        <small className="px-hint">Month and weekday are filled in from the date you pick.</small>
                                    </label>
                                    <label className="px-field"><span>Event title</span><input type="text" placeholder="Quarterly exams begin" value={calendarForm.title} onChange={e => setCalendarForm({ ...calendarForm, title: e.target.value })} required /></label>
                                    <label className="px-field">
                                        <span>Category</span>
                                        <select value={calendarForm.category} onChange={e => setCalendarForm({ ...calendarForm, category: e.target.value })}>
                                            <option value="General">General</option>
                                            <option value="Exam">Exam</option>
                                            <option value="Meeting">Meeting</option>
                                            <option value="Event">Event</option>
                                        </select>
                                    </label>
                                    {calendarForm.date && (
                                        <div className="px-preview px-preview-event" aria-hidden="true">
                                            <span className="px-datetile"><b>{calendarForm.date.slice(8, 10)}</b><small>{calendarForm.day}</small></span>
                                            <div>
                                                <strong>{calendarForm.title || 'New calendar event'}</strong>
                                                <span>{calendarForm.month} · {calendarForm.category}</span>
                                            </div>
                                        </div>
                                    )}
                                    <button type="submit" className="px-btn primary"><PlusCircle size={16} /> Publish date</button>
                                </form>

                                <div className="px-card px-list-card">
                                    <div className="px-list-head"><h3>Published dates</h3><span className="px-count">{calendarEvents.length}</span></div>
                                    {calendarEvents.length === 0 ? (
                                        <PxEmpty icon={CalendarDays} title="No calendar dates yet" text="Add exam schedules, meetings and events for the year." />
                                    ) : (() => {
                                        const sorted = [...calendarEvents].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
                                        const months = [];
                                        sorted.forEach(ev => {
                                            const key = ev.month || 'Undated';
                                            let group = months.find(m => m.key === key);
                                            if (!group) { group = { key, items: [] }; months.push(group); }
                                            group.items.push(ev);
                                        });
                                        return months.map(group => (
                                            <div className="px-group" key={group.key}>
                                                <h4 className="px-group-title">{group.key}<small>{group.items.length}</small></h4>
                                                <ul className="px-list">
                                                    {group.items.map(item => {
                                                        const cat = item.category || 'General';
                                                        return (
                                                            <li className="px-item px-cal-row" key={item.id}>
                                                                <span className="px-datetile slim"><b>{item.date ? item.date.slice(8, 10) : '–'}</b><small>{item.day || ''}</small></span>
                                                                <div className="px-item-body">
                                                                    <h4>{item.title}</h4>
                                                                    <span className={`px-tag cat-${cat.toLowerCase()}`}>{cat}</span>
                                                                </div>
                                                                <button type="button" className="px-icon-btn danger" onClick={() => handleDelete('academic_calendar', item.id)} aria-label={`Delete ${item.title}`} title="Delete date"><Trash2 size={15} /></button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ADMINISTRATORS */}
                    {activeTab === 'admins' && (
                        <section className="px-page" style={{ '--tone': '#6a5cf0', '--tone-soft': '#efecff' }}>
                            <PxHead icon={Shield} title="Administrators" desc="Leadership profiles and messages shown on the school website." count={administrators.length} countLabel="profiles" />
                            <div className="px-split">
                                <form
                                    className="px-card px-compose"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handlePublish('administrators', adminForm, () =>
                                            setAdminForm({ name: '', role: '', qualification: '', message: '', email: '', phone: '' })
                                        );
                                    }}
                                >
                                    <h3>Publish a profile</h3>
                                    <label className="px-field"><span>Full name</span><input type="text" placeholder="Dr. Meera Krishnan" value={adminForm.name} onChange={e => setAdminForm({ ...adminForm, name: e.target.value })} required /></label>
                                    <div className="px-row2">
                                        <label className="px-field"><span>Role</span><input type="text" placeholder="Principal" value={adminForm.role} onChange={e => setAdminForm({ ...adminForm, role: e.target.value })} required /></label>
                                        <label className="px-field"><span>Qualifications</span><input type="text" placeholder="M.Sc., B.Ed." value={adminForm.qualification} onChange={e => setAdminForm({ ...adminForm, qualification: e.target.value })} required /></label>
                                    </div>
                                    <div className="px-row2">
                                        <label className="px-field"><span>Email</span><input type="email" placeholder="name@school.edu" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} required /></label>
                                        <label className="px-field"><span>Phone</span><input type="text" placeholder="+91 98765 43210" value={adminForm.phone} onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })} required /></label>
                                    </div>
                                    <label className="px-field"><span>Message to families</span><textarea rows="4" placeholder="A short welcome or message from this administrator" value={adminForm.message} onChange={e => setAdminForm({ ...adminForm, message: e.target.value })} required /></label>
                                    <button type="submit" className="px-btn primary"><PlusCircle size={16} /> Publish profile</button>
                                </form>

                                <div className="px-card px-list-card">
                                    <div className="px-list-head"><h3>Published profiles</h3><span className="px-count">{administrators.length}</span></div>
                                    {administrators.length === 0 ? (
                                        <PxEmpty icon={Shield} title="No administrators published yet" text="Add the principal and leadership team to introduce them to families." />
                                    ) : (
                                        <div className="px-admin-grid">
                                            {administrators.map(item => (
                                                <article className="px-admin" key={item.id}>
                                                    <button type="button" className="px-icon-btn danger px-corner" onClick={() => handleDelete('administrators', item.id)} aria-label={`Delete ${item.name}`} title="Delete profile"><Trash2 size={14} /></button>
                                                    <div className="px-admin-top">
                                                        <span className="px-avatar">{(item.name || '?').replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, '').charAt(0).toUpperCase()}</span>
                                                        <div>
                                                            <h5>{item.name}</h5>
                                                            <p>{item.role}</p>
                                                        </div>
                                                    </div>
                                                    {item.qualification && <span className="px-chip">{item.qualification}</span>}
                                                    {item.message && <blockquote>{item.message}</blockquote>}
                                                    <div className="px-contact">
                                                        {item.email && <a href={`mailto:${item.email}`}><Mail size={13} /> {item.email}</a>}
                                                        {item.phone && <span><Phone size={13} /> {item.phone}</span>}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* GALLERY */}
                    {activeTab === 'gallery' && (
                        <section className="px-page" style={{ '--tone': '#12a5b8', '--tone-soft': '#dff6f9' }}>
                            <PxHead icon={Images} title="Photo gallery" desc="Organise photos into folders, just like on your computer. Uploads go into the folder you have open." count={galleryItems.length} countLabel="photos" />

                            <div className="px-card px-gal-bar">
                                <nav className="px-crumbs" aria-label="Gallery folders">
                                    <button type="button" className={`px-crumb ${!galleryCurrentPath ? 'active' : ''}`} onClick={() => setGalleryCurrentPath('')}>
                                        <Folder size={14} /> Home
                                    </button>
                                    {galleryCurrentPath && galleryCurrentPath.split('/').map((segment, idx, arr) => {
                                        const pathUpToHere = arr.slice(0, idx + 1).join('/');
                                        const isLast = idx === arr.length - 1;
                                        return (
                                            <React.Fragment key={pathUpToHere}>
                                                <ChevronRight size={14} className="px-crumb-sep" />
                                                <button type="button" className={`px-crumb ${isLast ? 'active' : ''}`} onClick={() => setGalleryCurrentPath(pathUpToHere)}>
                                                    {segment}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}
                                </nav>

                                {!isCreatingGalleryFolder ? (
                                    <button type="button" className="px-btn ghost" onClick={() => setIsCreatingGalleryFolder(true)}>
                                        <FolderPlus size={16} /> New folder
                                    </button>
                                ) : (
                                    <form className="px-newfolder" onSubmit={e => { e.preventDefault(); handleCreateGalleryFolder(); }}>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={galleryNewFolderName}
                                            onChange={e => setGalleryNewFolderName(e.target.value)}
                                            placeholder="Folder name"
                                            aria-label="Folder name"
                                        />
                                        <button type="submit" className="px-btn primary small">Create</button>
                                        <button type="button" className="px-btn ghost small" onClick={() => { setIsCreatingGalleryFolder(false); setGalleryNewFolderName(''); }}>Cancel</button>
                                    </form>
                                )}
                            </div>

                            {galleryChildFolders.length > 0 && (
                                <div className="px-folders">
                                    {galleryChildFolders.map(name => {
                                        const fullPath = galleryCurrentPath ? `${galleryCurrentPath}/${name}` : name;
                                        const count = getFolderItemCount(fullPath);
                                        return (
                                            <div
                                                key={fullPath}
                                                className="px-folder"
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setGalleryCurrentPath(fullPath)}
                                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setGalleryCurrentPath(fullPath); } }}
                                                title={`Open ${name}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="px-icon-btn danger px-corner"
                                                    onClick={e => { e.stopPropagation(); handleDeleteGalleryFolder(fullPath); }}
                                                    onKeyDown={e => e.stopPropagation()}
                                                    aria-label={`Delete folder ${name}`}
                                                    title="Delete folder"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                                <span className="px-folder-ico"><Folder size={26} /></span>
                                                <strong>{name}</strong>
                                                <small>{count} photo{count === 1 ? '' : 's'}</small>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <form onSubmit={handleGalleryMultiUpload} className="px-card px-upload-card">
                                <div className="px-upload-top">
                                    <h3>Upload photos</h3>
                                    <span className="px-chip"><Folder size={12} /> {galleryCurrentPath || 'Home'}</span>
                                </div>
                                <div className="px-row2">
                                    <label className="px-field">
                                        <span>Title <small>(optional)</small></span>
                                        <input type="text" placeholder="Annual Day highlights" value={galleryForm.title} onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })} />
                                    </label>
                                    <label className="px-field">
                                        <span>Description <small>(optional)</small></span>
                                        <input type="text" placeholder="A line about these photos" value={galleryForm.description} onChange={e => setGalleryForm({ ...galleryForm, description: e.target.value })} />
                                    </label>
                                </div>

                                <label className="px-dropzone">
                                    <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple onChange={handleGalleryFilesChange} />
                                    <span className="px-dropzone-ico"><Upload size={22} /></span>
                                    <strong>Choose photos to upload</strong>
                                    <span>Select several JPG, PNG or WEBP files at once. They are resized and compressed automatically.</span>
                                </label>

                                {galleryUploadFiles.length > 0 && (
                                    <div className="px-selected">
                                        <div className="px-selected-head">
                                            <strong>{galleryUploadFiles.length} photo{galleryUploadFiles.length === 1 ? '' : 's'} selected</strong>
                                            <button type="button" className="px-link-danger" onClick={() => setGalleryUploadFiles([])}>Clear selection</button>
                                        </div>
                                        <div className="px-selected-list">
                                            {galleryUploadFiles.map((file, index) => (
                                                <div key={`${file.name}-${index}`} className="px-selected-file">
                                                    <ImageIcon size={14} />
                                                    <span>{file.name}</span>
                                                    <small>{Math.round(file.size / 1024)} KB</small>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button type="submit" className="px-btn primary" disabled={galleryUploading || !galleryUploadFiles.length}>
                                    <Upload size={16} />
                                    {galleryUploading ? 'Uploading photos...' : `Upload ${galleryUploadFiles.length || ''} photo${galleryUploadFiles.length === 1 ? '' : 's'}`}
                                </button>
                            </form>

                            <div className="px-card px-list-card">
                                <div className="px-list-head">
                                    <h3>Photos in {galleryCurrentPath || 'Home'}</h3>
                                    <span className="px-count">{galleryItemsHere.length}</span>
                                </div>
                                {galleryItemsHere.length === 0 ? (
                                    <PxEmpty icon={Folder} title="No photos directly in this folder" text="Open a subfolder above, or upload photos here." />
                                ) : (
                                    <div className="px-photo-grid">
                                        {galleryItemsHere.map(item => (
                                            <figure key={item.id} className="px-photo">
                                                {item.image ? <img src={item.image} alt={item.title} loading="lazy" /> : <div className="px-photo-empty"><ImageIcon size={22} /></div>}
                                                <figcaption>
                                                    <div>
                                                        <strong>{item.title}</strong>
                                                        <span>{item.fileName || galleryCurrentPath || 'Home'}</span>
                                                    </div>
                                                    <div className="px-photo-actions">
                                                        <button type="button" onClick={() => handleStartEditGallery(item)} aria-label={`Edit ${item.title}`} title="Edit photo"><Edit2 size={14} /></button>
                                                        <button type="button" className="danger" onClick={() => handleDelete('gallery', item.id)} aria-label={`Delete ${item.title}`} title="Delete photo"><Trash2 size={14} /></button>
                                                    </div>
                                                </figcaption>
                                            </figure>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {editingGalleryId && (
                                <div className="px-modal-backdrop" onClick={handleCancelEditGallery}>
                                    <form className="px-modal" role="dialog" aria-modal="true" aria-label="Edit photo" onClick={e => e.stopPropagation()} onSubmit={handleSaveGalleryEdit}>
                                        <div className="px-modal-head">
                                            <h3>Edit photo</h3>
                                            <button type="button" className="px-icon-btn" onClick={handleCancelEditGallery} aria-label="Close"><X size={16} /></button>
                                        </div>
                                        <div className="px-modal-body">
                                            <div className="px-edit-preview">
                                                {(editGalleryImagePreview || editGalleryForm.image) ? (
                                                    <img src={editGalleryImagePreview || editGalleryForm.image} alt={editGalleryForm.title} />
                                                ) : (
                                                    <div className="px-photo-empty"><ImageIcon size={22} /></div>
                                                )}
                                                <label className="px-btn ghost small">
                                                    <Upload size={14} /> Replace photo
                                                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleEditGalleryImageChange} hidden />
                                                </label>
                                            </div>
                                            <label className="px-field"><span>Title</span><input type="text" placeholder="Photo title" value={editGalleryForm.title} onChange={e => setEditGalleryForm({ ...editGalleryForm, title: e.target.value })} /></label>
                                            <label className="px-field"><span>Description <small>(optional)</small></span><textarea rows={3} placeholder="Short description" value={editGalleryForm.description} onChange={e => setEditGalleryForm({ ...editGalleryForm, description: e.target.value })} /></label>
                                            <label className="px-field"><span>Folder <small>(for example Campus/Day 1)</small></span><input type="text" placeholder="Uncategorized" value={editGalleryForm.folderPath} onChange={e => setEditGalleryForm({ ...editGalleryForm, folderPath: e.target.value })} /></label>
                                        </div>
                                        <div className="px-modal-foot">
                                            <button type="button" className="px-btn ghost" onClick={handleCancelEditGallery}>Cancel</button>
                                            <button type="submit" className="px-btn primary" disabled={galleryUpdating}>
                                                {galleryUpdating ? 'Saving...' : <><Save size={15} /> Save changes</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </section>
                    )}

                    {/* HOLIDAYS */}
                    {activeTab === 'holidays' && (
                        <section className="px-page" style={{ '--tone': '#f0587a', '--tone-soft': '#ffe9ee' }}>
                            <PxHead icon={Sun} title="School holidays" desc="National holidays and festivals the school is closed for." count={holidays.length} countLabel="holidays" />
                            <div className="px-split">
                                <form
                                    className="px-card px-compose"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handlePublish('holidays', holidayForm, () =>
                                            setHolidayForm({ date: '', day: '', occasion: '', type: 'National Holiday' })
                                        );
                                    }}
                                >
                                    <h3>Publish a holiday</h3>
                                    <label className="px-field"><span>Occasion</span><input type="text" placeholder="Independence Day" value={holidayForm.occasion} onChange={e => setHolidayForm({ ...holidayForm, occasion: e.target.value })} required /></label>
                                    <div className="px-row2">
                                        <label className="px-field"><span>Date</span><input type="text" placeholder="15 Aug 2026" value={holidayForm.date} onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })} required /></label>
                                        <label className="px-field"><span>Day</span><input type="text" placeholder="Saturday" value={holidayForm.day} onChange={e => setHolidayForm({ ...holidayForm, day: e.target.value })} required /></label>
                                    </div>
                                    <label className="px-field">
                                        <span>Type</span>
                                        <select value={holidayForm.type} onChange={e => setHolidayForm({ ...holidayForm, type: e.target.value })}>
                                            <option value="National Holiday">National Holiday</option>
                                            <option value="Festival">Festival</option>
                                        </select>
                                    </label>
                                    <button type="submit" className="px-btn primary"><PlusCircle size={16} /> Publish holiday</button>
                                </form>

                                <div className="px-card px-list-card">
                                    <div className="px-list-head"><h3>Published holidays</h3><span className="px-count">{holidays.length}</span></div>
                                    {holidays.length === 0 ? (
                                        <PxEmpty icon={Sun} title="No holidays published yet" text="Add holidays so families can plan ahead." />
                                    ) : (
                                        <ul className="px-list">
                                            {holidays.map(item => {
                                                const parsed = new Date(item.date);
                                                const valid = !isNaN(parsed.getTime());
                                                const isFestival = item.type === 'Festival';
                                                return (
                                                    <li className="px-item px-holiday" key={item.id}>
                                                        <span className={`px-datetile ${isFestival ? 'warm' : ''}`}>
                                                            {valid
                                                                ? <><b>{parsed.getDate()}</b><small>{parsed.toLocaleDateString('en-GB', { month: 'short' })}</small></>
                                                                : <Sun size={20} />}
                                                        </span>
                                                        <div className="px-item-body">
                                                            <h4>{item.occasion}</h4>
                                                            <p>{item.date}{item.day ? ` · ${item.day}` : ''}</p>
                                                            <span className={`px-tag ${isFestival ? 'cat-festival' : 'cat-national'}`}>{item.type || 'National Holiday'}</span>
                                                        </div>
                                                        <button type="button" className="px-icon-btn danger" onClick={() => handleDelete('holidays', item.id)} aria-label={`Delete ${item.occasion}`} title="Delete holiday"><Trash2 size={15} /></button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ANNOUNCEMENTS */}
                    {activeTab === 'announcements' && (
                        <section className="px-page" style={{ '--tone': '#6a5cf0', '--tone-soft': '#efecff' }}>
                            <PxHead icon={Megaphone} title="Announcements" desc="Circulars appear on the school website and on student and staff dashboards." count={announcements.length} countLabel="published" />
                            <div className="px-split">
                                <form
                                    className="px-card px-compose"
                                    onSubmit={(e) => {
                                        e.preventDefault();

                                        const linkText = announcementLinkText.trim();
                                        const linkUrl = announcementLinkUrl.trim();

                                        if (linkUrl && !/^https?:\/\//i.test(linkUrl)) {
                                            alert('Please enter a valid link beginning with http:// or https://');
                                            return;
                                        }

                                        handlePublish(
                                            'announcements',
                                            {
                                                content: noticeText.trim(),
                                                linkText: linkText || '',
                                                linkUrl: linkUrl || ''
                                            },
                                            () => {
                                                setNoticeText('');
                                                setAnnouncementLinkText('');
                                                setAnnouncementLinkUrl('');
                                            }
                                        );
                                    }}
                                >
                                    <h3>New announcement</h3>
                                    <label className="px-field">
                                        <span>Message</span>
                                        <textarea rows="4" placeholder="Hall tickets have been released. Students can download them using the link below." value={noticeText} onChange={e => setNoticeText(e.target.value)} required />
                                    </label>

                                    <fieldset className="px-linkbox">
                                        <legend><Link2 size={14} /> Attach a link <small>(optional)</small></legend>
                                        <p>Turn a phrase into a clickable link, such as Download hall ticket or View results.</p>
                                        <label className="px-field"><span>Clickable words</span><input type="text" placeholder="Download hall ticket" value={announcementLinkText} onChange={e => setAnnouncementLinkText(e.target.value)} /></label>
                                        <label className="px-field"><span>Link address</span><input type="url" placeholder="https://your-site.com/hall-ticket" value={announcementLinkUrl} onChange={e => setAnnouncementLinkUrl(e.target.value)} /></label>
                                    </fieldset>

                                    {(noticeText.trim() || announcementLinkText.trim() || announcementLinkUrl.trim()) && (
                                        <div className="px-preview px-preview-notice" aria-label="Preview">
                                            <span className="px-preview-label">Preview</span>
                                            <p>
                                                {noticeText.trim() || 'Your message appears here.'}
                                                {(announcementLinkText.trim() || announcementLinkUrl.trim()) && (
                                                    <>
                                                        {' '}
                                                        {announcementLinkUrl.trim() ? (
                                                            <a href={announcementLinkUrl.trim()} target="_blank" rel="noopener noreferrer">{announcementLinkText.trim() || announcementLinkUrl.trim()}</a>
                                                        ) : (
                                                            <strong>{announcementLinkText.trim()}</strong>
                                                        )}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    <button type="submit" className="px-btn primary"><Send size={16} /> Publish announcement</button>
                                </form>

                                <div className="px-card px-list-card">
                                    <div className="px-list-head"><h3>Published announcements</h3><span className="px-count">{announcements.length}</span></div>
                                    {announcements.length === 0 ? (
                                        <PxEmpty icon={Megaphone} title="No announcements yet" text="Published circulars will be listed here." />
                                    ) : (
                                        <ul className="px-list">
                                            {announcements.map(item => {
                                                const urgent = String(item.content || '').includes('[EMERGENCY/URGENT]');
                                                return (
                                                    <li className={`px-item px-notice ${urgent ? 'urgent' : ''}`} key={item.id}>
                                                        <span className="px-notice-ico">{urgent ? <AlertTriangle size={17} /> : <Bell size={17} />}</span>
                                                        <div className="px-item-body">
                                                            <p>{item.content}</p>
                                                            {item.linkUrl && (
                                                                <a className="px-notice-link" href={item.linkUrl} target="_blank" rel="noopener noreferrer">
                                                                    <Link2 size={13} /> {item.linkText || 'Open link'}
                                                                </a>
                                                            )}
                                                        </div>
                                                        <button type="button" className="px-icon-btn danger" onClick={() => handleDelete('announcements', item.id)} aria-label="Delete announcement" title="Delete announcement"><Trash2 size={15} /></button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* STAFF DIRECTORY */}
                    {activeTab === 'staff' && (() => {
                        // Local search state for Staff Directory filtering

                        // Filter staff members based on search input
                        const nameQuery = staffSearchQuery.toLowerCase().trim();
                        const idQuery = staffIdSearchQuery.toLowerCase().trim();
                        const filteredStaffList = staffList.filter(member => {
                            const matchesName = !nameQuery || member.name?.toLowerCase().includes(nameQuery);
                            const matchesId = !idQuery || member.staffId?.toLowerCase().includes(idQuery);
                            const matchesDept = !staffDeptFilter || member.department === staffDeptFilter;
                            return matchesName && matchesId && matchesDept;
                        });
                        const staffDeptOptions = [...new Set(staffList.map(m => m.department).filter(Boolean))];
                        const staffFiltersActive = !!(staffSearchQuery || staffIdSearchQuery || staffDeptFilter);

                        return (
                            <div className="applications-management-card premium-section staff-directory-premium">
                                <div className="premium-section-heading">
                                    <div className="premium-section-title-wrap">
                                        <div className="premium-section-icon"><Users size={19} /></div>
                                        <div>
                                            <h3>Staff Directory Management</h3>
                                            <p>Manage staff profiles, credentials, departments and contact details.</p>
                                        </div>
                                    </div>
                                    <span className="premium-section-count">{staffList.length} Staff</span>
                                </div>

                                {/* CREATE FORM */}
                                {showAddStaffForm && (
                                    <form ref={staffFormRef} onSubmit={handleAddStaff} className="admin-form-grid" style={{ marginBottom: '20px' }}>
                                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div className="form-section-title" style={{ margin: 0 }}>New Staff Member</div>
                                            <button type="button" className="directory-form-close-btn" onClick={() => setShowAddStaffForm(false)} title="Close">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Dr. John Doe"
                                                value={staffForm.name}
                                                onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Staff ID</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. STF102"
                                                value={staffForm.staffId}
                                                onChange={e => setStaffForm({ ...staffForm, staffId: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
                                            <input
                                                type="text"
                                                placeholder="Login password"
                                                value={staffForm.password}
                                                onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Department</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Mathematics"
                                                value={staffForm.department}
                                                onChange={e => setStaffForm({ ...staffForm, department: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address</label>
                                            <input
                                                type="email"
                                                placeholder="staff@school.edu"
                                                value={staffForm.email}
                                                onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                Photo (Auto-compressed to &lt; 500 KB)
                                            </label>
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onChange={e => handleImageUpload(e.target.files[0], (base64) => setStaffForm({ ...staffForm, photo: base64 }))}
                                            />
                                            {staffForm.photo && (
                                                <div style={{ marginTop: '6px' }}>
                                                    <img src={staffForm.photo} alt="Preview" style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border)' }} />
                                                </div>
                                            )}
                                        </div>
                                        <button type="submit" className="add-notice-btn" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                                            <PlusCircle size={15} /> Add Staff Member
                                        </button>
                                    </form>
                                )}

                                {/* DIRECTORY TOOLBAR */}
                                <div className="directory-toolbar">
                                    <input
                                        type="text"
                                        placeholder="Search by full name"
                                        value={staffSearchQuery}
                                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                                        className="directory-search-input"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search by staff ID"
                                        value={staffIdSearchQuery}
                                        onChange={(e) => setStaffIdSearchQuery(e.target.value)}
                                        className="directory-search-input"
                                    />
                                    <select
                                        value={staffDeptFilter}
                                        onChange={(e) => setStaffDeptFilter(e.target.value)}
                                        className="directory-select"
                                    >
                                        <option value="">Select Department</option>
                                        {staffDeptOptions.map(dep => (
                                            <option key={dep} value={dep}>{dep}</option>
                                        ))}
                                    </select>
                                    <button type="button" className="directory-btn-search" onClick={(e) => e.currentTarget.blur()}>
                                        <Search size={14} /> Search
                                    </button>
                                    <button
                                        type="button"
                                        className="directory-btn-reset"
                                        onClick={() => { setStaffSearchQuery(''); setStaffIdSearchQuery(''); setStaffDeptFilter(''); }}
                                    >
                                        <RefreshCw size={14} /> Reset
                                    </button>
                                </div>

                                {/* STAFF LIST */}
                                <h4>
                                    Registered Staff Members
                                    <span className="count-badge" style={{ marginLeft: '8px' }}>
                                        {filteredStaffList.length} / {staffList.length}
                                    </span>
                                </h4>
                                <p className="directory-showing-text">Showing {filteredStaffList.length} of {staffList.length}</p>

                                <div className="staff-cards-container">
                                    <div className="directory-grid">
                                        <div
                                            className="directory-add-card"
                                            onClick={() => {
                                                setEditingStaffId(null);
                                                setShowAddStaffForm(true);
                                                setTimeout(() => staffFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                                            }}
                                        >
                                            <div className="directory-add-icon"><PlusCircle size={26} /></div>
                                            <h5>Add New Staff</h5>
                                            <p>Click to register a new staff account</p>
                                            <span className="directory-add-link">Create Account <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} /></span>
                                        </div>

                                        {staffFiltersActive && filteredStaffList.length === 0 && (
                                            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                                No staff members found matching your filters.
                                            </div>
                                        )}

                                        {filteredStaffList.map(member => (
                                            <div className="directory-card" key={member.id}>
                                                        <button className="directory-delete-corner" onClick={() => handleDelete('staff_members', member.id)} title="Delete Staff">
                                                            <Trash2 size={13} />
                                                        </button>
                                                        <div className="directory-card-top">
                                                            <div className="directory-avatar-wrap">
                                                                {member.photo ? (
                                                                    <img src={member.photo} alt={member.name} className="directory-avatar-img" />
                                                                ) : (
                                                                    <div className="directory-avatar-fallback">
                                                                        {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                                                                    </div>
                                                                )}
                                                                <span className="directory-status-dot" title="Active" />
                                                            </div>
                                                            <h5 className="directory-card-name">{member.name}</h5>
                                                            <span className="directory-pill">{member.staffId}</span>
                                                            <span className="directory-pill directory-pill-alt"><Users size={11} /> {member.department || 'General'}</span>
                                                            {(() => {
                                                                const mine = sectionsList.filter(s => s.classInchargeId === member.id || (!s.classInchargeId && s.classIncharge && s.classIncharge === member.name));
                                                                return mine.length > 0 ? (
                                                                    <span className="directory-pill directory-pill-alt"><UserCheck size={11} /> Incharge: {mine[0].className} {mine[0].name}{mine.length > 1 ? ` +${mine.length - 1}` : ''}</span>
                                                                ) : null;
                                                            })()}
                                                        </div>

                                                        <div className="directory-card-footer">
                                                            <button className="directory-action-btn view" onClick={() => { setShowStaffPwd(false); setEditingStaffId(null); setStaffViewTab('details'); setStaffViewSectionId(null); setStaffViewSort('name'); setStaffClassView('attendance'); setStaffWinMode('normal'); setViewStaffId(member.id); }}>
                                                                <Eye size={14} /> View
                                                            </button>
                                                            {member.email ? (
                                                                <a className="directory-action-btn message" href={`mailto:${member.email}`}>
                                                                    <Mail size={14} /> Message
                                                                </a>
                                                            ) : (
                                                                <button className="directory-action-btn message" disabled title="No email on file">
                                                                    <Mail size={14} /> Message
                                                                </button>
                                                            )}
                                                            <button className="directory-action-btn edit" onClick={() => { setViewStaffId(null); handleStartEditStaff(member); }}>
                                                                <Edit2 size={14} /> Edit
                                                            </button>
                                                        </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* STAFF VIEW POPUP */}
                                {viewStaffId && (() => {
                                    const m = staffList.find(x => x.id === viewStaffId);
                                    if (!m) return null;
                                    const copy = (label, value) => {
                                        try { navigator.clipboard.writeText(value || ''); } catch (err) { /* ignore */ }
                                        setCopiedStaffField(label);
                                        setTimeout(() => setCopiedStaffField(''), 1400);
                                    };

                                    // ----- minimized: small floating card that can be dragged anywhere -----
                                    if (staffWinMode === 'minimized') {
                                        const pos = staffMiniPos || { x: 20, y: 20 };
                                        return createPortal(
                                            <div
                                                className={`sdm-float ${staffMiniDragging ? 'is-dragging' : ''}`}
                                                style={{ left: pos.x, top: pos.y }}
                                                role="dialog"
                                                aria-label={`${m.name} profile (minimized). Drag or use arrow keys to move, Enter to restore.`}
                                                tabIndex={0}
                                                onPointerDown={onStaffMiniPointerDown}
                                                onPointerMove={onStaffMiniPointerMove}
                                                onPointerUp={onStaffMiniPointerUp}
                                                onPointerCancel={onStaffMiniPointerUp}
                                                onKeyDown={onStaffMiniKeyDown}
                                                onDoubleClick={(e) => { if (!e.target.closest('button')) setStaffWinMode('normal'); }}
                                            >
                                                <GripVertical size={16} className="sdm-float-grip" aria-hidden="true" />
                                                <span className="sdm-float-avatar">
                                                    {m.photo ? <img src={m.photo} alt="" draggable={false} /> : (m.name ? m.name.charAt(0).toUpperCase() : 'S')}
                                                </span>
                                                <div className="sdm-float-text">
                                                    <strong>{m.name}</strong>
                                                    <span>{m.department || 'General'} · {m.staffId}</span>
                                                </div>
                                                <button type="button" className="sdm-float-btn" onClick={() => setStaffWinMode('normal')} title="Restore" aria-label="Restore profile"><Maximize2 size={13} /></button>
                                                <button type="button" className="sdm-float-btn close" onClick={() => setViewStaffId(null)} title="Close" aria-label="Close profile"><X size={15} /></button>
                                            </div>,
                                            document.body
                                        );
                                    }
                                    const isMax = staffWinMode === 'maximized';

                                    // ----- class incharge data -----
                                    const inchargeSections = sectionsList
                                        .filter(s => s.classInchargeId === m.id || (!s.classInchargeId && s.classIncharge && s.classIncharge === m.name))
                                        .sort((a, b) => (classList.indexOf(a.className) - classList.indexOf(b.className)) || String(a.name).localeCompare(String(b.name)));
                                    const hasClass = inchargeSections.length > 0;
                                    const showClassTab = hasClass && staffViewTab === 'class';
                                    const showSchedule = staffViewTab === 'schedule';
                                    const activeSec = inchargeSections.find(s => s.id === staffViewSectionId) || inchargeSections[0];
                                    const tone = (pct) => pct === null || pct === undefined ? 'none' : pct >= 90 ? 'good' : pct >= 75 ? 'fair' : 'low';
                                    const scoreTone = (pct) => pct === null || pct === undefined ? 'none' : pct >= 75 ? 'good' : pct >= 50 ? 'fair' : 'low';

                                    let classStudents = [];
                                    let classSummary = null;
                                    let progress = null;
                                    if (showClassTab && activeSec) {
                                        const roster = studentsList.filter(st => st.sectionId === activeSec.id);
                                        if (staffClassView === 'attendance') {
                                            const stats = buildAttendanceStats(roster, attendanceRecords || []);
                                            classStudents = roster.map(st => {
                                                const s = stats.get(st.id) || { present: 0, total: 0 };
                                                return { ...st, present: s.present, total: s.total, pct: s.total ? Math.round((s.present / s.total) * 100) : null };
                                            });
                                            if (staffViewSort === 'low') {
                                                classStudents.sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101) || String(a.name).localeCompare(String(b.name)));
                                            } else {
                                                classStudents.sort((a, b) => String(a.name).localeCompare(String(b.name)));
                                            }
                                            const totalPresent = classStudents.reduce((n, s) => n + s.present, 0);
                                            const totalSessions = classStudents.reduce((n, s) => n + s.total, 0);
                                            classSummary = {
                                                count: classStudents.length,
                                                avg: totalSessions ? Math.round((totalPresent / totalSessions) * 100) : null,
                                                low: classStudents.filter(s => s.pct !== null && s.pct < 75).length
                                            };
                                        } else {
                                            progress = buildProgressStats(roster);
                                            classStudents = roster.map(st => {
                                                const p = progress.perStudent.get(st.id) || { avg: null, count: 0 };
                                                return { ...st, avgScore: p.avg === null ? null : Math.round(p.avg * 10) / 10, scoreCount: p.count };
                                            });
                                            if (staffViewSort === 'low') {
                                                classStudents.sort((a, b) => (a.avgScore ?? 101) - (b.avgScore ?? 101) || String(a.name).localeCompare(String(b.name)));
                                            } else {
                                                classStudents.sort((a, b) => String(a.name).localeCompare(String(b.name)));
                                            }
                                        }
                                    }

                                    // ----- schedule data (classes this teacher takes) -----
                                    const mySlots = staffTimetables.filter(tt => tt.staffId === m.staffId || tt.staffName === m.name);
                                    const slotOrder = (t) => { const i = timeSlots.indexOf(t.timeSlot); return i < 0 ? 99 : i; };
                                    const slotsByDay = weekDays.map(day => ({
                                        day,
                                        slots: mySlots.filter(t => t.day === day)
                                            .sort((a, b) => slotOrder(a) - slotOrder(b) || String(a.timeSlot).localeCompare(String(b.timeSlot)))
                                    }));
                                    const takenMap = new Map();
                                    mySlots.forEach(t => {
                                        const key = `${t.className || '—'}||${t.sectionName || ''}`;
                                        if (!takenMap.has(key)) takenMap.set(key, { className: t.className || 'General', sectionName: t.sectionName || '', subjects: new Set(), periods: 0, days: new Set() });
                                        const g = takenMap.get(key);
                                        if (t.subject) g.subjects.add(t.subject);
                                        g.periods += 1;
                                        if (t.day) g.days.add(t.day);
                                    });
                                    const classesTaken = [...takenMap.values()].sort((a, b) =>
                                        (classList.indexOf(a.className) - classList.indexOf(b.className)) || String(a.sectionName).localeCompare(String(b.sectionName)));
                                    const subjectsTaught = new Set(mySlots.map(t => t.subject).filter(Boolean));
                                    const todayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
                                    const isIncharge = (g) => inchargeSections.some(s => s.className === g.className && (s.name === g.sectionName || `Section ${s.name}` === g.sectionName || s.name === `Section ${g.sectionName}`));

                                    return createPortal(
                                        <div className={`sdm-overlay ${isMax ? 'is-max' : ''}`} onMouseDown={(e) => { if (!isMax && e.target === e.currentTarget) setViewStaffId(null); }}>
                                            <div className={`sdm-modal sdm-wide ${isMax ? 'is-max' : ''}`} role="dialog" aria-modal="true" aria-label="Staff details">
                                                <div className="sdm-hero" onDoubleClick={(e) => { if (!e.target.closest('button')) setStaffWinMode(isMax ? 'normal' : 'maximized'); }}>
                                                    <div className="sdm-winctl">
                                                        <button type="button" className="sdm-wbtn" onClick={minimizeStaffView} title="Minimize" aria-label="Minimize profile"><Minus size={15} /></button>
                                                        <button
                                                            type="button"
                                                            className="sdm-wbtn"
                                                            onClick={() => setStaffWinMode(isMax ? 'normal' : 'maximized')}
                                                            title={isMax ? 'Restore size' : 'Maximize'}
                                                            aria-label={isMax ? 'Restore profile size' : 'Maximize profile'}
                                                        >
                                                            {isMax ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                                        </button>
                                                        <button type="button" className="sdm-wbtn close" onClick={() => setViewStaffId(null)} title="Close" aria-label="Close profile"><X size={16} /></button>
                                                    </div>
                                                    <div className="sdm-avatar">
                                                        {m.photo ? <img src={m.photo} alt={m.name} /> : <span>{m.name ? m.name.charAt(0).toUpperCase() : 'S'}</span>}
                                                        <i className="sdm-online" />
                                                    </div>
                                                    <h3 className="sdm-name">{m.name}</h3>
                                                    <div className="sdm-chips">
                                                        <span className="sdm-chip"><Hash size={12} /> {m.staffId}</span>
                                                        <span className="sdm-chip alt"><Briefcase size={12} /> {m.department || 'General'}</span>
                                                        {hasClass && (
                                                            <span className="sdm-chip"><UserCheck size={12} /> Incharge · {inchargeSections.map(s => `${s.className} ${s.name}`).join(', ')}</span>
                                                        )}
                                                        <span className="sdm-chip ok"><i /> Active</span>
                                                    </div>
                                                </div>

                                                <div className="sdm-tabs" role="tablist">
                                                    <button type="button" role="tab" aria-selected={staffViewTab === 'details'} className={`sdm-tab ${staffViewTab === 'details' ? 'active' : ''}`} onClick={() => setStaffViewTab('details')}>
                                                        <User size={14} /> Details
                                                    </button>
                                                    {hasClass && (
                                                        <button type="button" role="tab" aria-selected={showClassTab} className={`sdm-tab ${showClassTab ? 'active' : ''}`} onClick={() => setStaffViewTab('class')}>
                                                            <GraduationCap size={14} /> My class
                                                            <b>{inchargeSections.reduce((n, s) => n + studentsList.filter(st => st.sectionId === s.id).length, 0)}</b>
                                                        </button>
                                                    )}
                                                    <button type="button" role="tab" aria-selected={showSchedule} className={`sdm-tab ${showSchedule ? 'active' : ''}`} onClick={() => setStaffViewTab('schedule')}>
                                                        <Clock size={14} /> Schedule
                                                        {mySlots.length > 0 && <b>{mySlots.length}</b>}
                                                    </button>
                                                </div>

                                                {showSchedule ? (
                                                    <div className="sdm-body sdm-class-body">
                                                        {mySlots.length === 0 ? (
                                                            <div className="sdm-class-empty">
                                                                <p>{m.name} has no periods in the staff schedule yet.</p>
                                                                <button type="button" className="sdm-btn ghost sdm-inline-btn" onClick={() => { setViewStaffId(null); goTo('staff_timetable'); }}>
                                                                    <Clock size={14} /> Open staff schedule
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="sdm-kpis">
                                                                    <div className="sdm-kpi"><small>Periods per week</small><strong>{mySlots.length}</strong></div>
                                                                    <div className="sdm-kpi"><small>Classes taken</small><strong>{classesTaken.length}</strong></div>
                                                                    <div className="sdm-kpi"><small>Subjects</small><strong>{subjectsTaught.size}</strong></div>
                                                                </div>

                                                                <h4 className="sdm-sub">Classes taken</h4>
                                                                <div className="sdm-taken-grid">
                                                                    {classesTaken.map(g => (
                                                                        <div className="sdm-taken" key={`${g.className}-${g.sectionName}`}>
                                                                            <div className="sdm-taken-top">
                                                                                <b>{g.className}{g.sectionName ? ` · ${g.sectionName}` : ''}</b>
                                                                                {isIncharge(g) && <span className="sdm-tag">Class incharge</span>}
                                                                            </div>
                                                                            <small>{g.periods} period{g.periods === 1 ? '' : 's'} a week · {g.days.size} day{g.days.size === 1 ? '' : 's'}</small>
                                                                            <div className="sdm-subj-chips">
                                                                                {[...g.subjects].map(s => <span key={s}>{s}</span>)}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <h4 className="sdm-sub">Weekly timetable</h4>
                                                                <div className="sdm-week">
                                                                    {slotsByDay.map(({ day, slots }) => (
                                                                        <div className={`sdm-day ${day === todayName ? 'is-today' : ''}`} key={day}>
                                                                            <div className="sdm-day-name">
                                                                                <b>{day}</b>
                                                                                {day === todayName && <span className="sdm-tag">Today</span>}
                                                                            </div>
                                                                            <div className="sdm-day-slots">
                                                                                {slots.length === 0 ? (
                                                                                    <span className="sdm-day-empty">No periods</span>
                                                                                ) : slots.map(t => (
                                                                                    <div className="sdm-slot" key={t.id}>
                                                                                        <small>{t.timeSlot}</small>
                                                                                        <b>{t.subject}</b>
                                                                                        <span>{t.className || 'General'}{t.sectionName ? ` · ${t.sectionName}` : ''}{t.roomNo ? ` · Room ${t.roomNo}` : ''}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : !showClassTab ? (
                                                    <div className="sdm-body">
                                                        <div className="sdm-section-label">Staff details</div>
                                                        <div className="sdm-info-list">
                                                            <div className="sdm-info">
                                                                <span className="sdm-info-ico"><Users size={16} /></span>
                                                                <div><small>Full name</small><b>{m.name || '—'}</b></div>
                                                            </div>
                                                            <div className="sdm-info">
                                                                <span className="sdm-info-ico"><Hash size={16} /></span>
                                                                <div><small>Staff ID</small><b>{m.staffId || '—'}</b></div>
                                                                <button type="button" className="sdm-mini" onClick={() => copy('id', m.staffId)} title="Copy ID">
                                                                    {copiedStaffField === 'id' ? <Check size={14} /> : <Copy size={14} />}
                                                                </button>
                                                            </div>
                                                            <div className="sdm-info">
                                                                <span className="sdm-info-ico"><Briefcase size={16} /></span>
                                                                <div><small>Department</small><b>{m.department || 'General'}</b></div>
                                                            </div>
                                                            <div className="sdm-info">
                                                                <span className="sdm-info-ico"><GraduationCap size={16} /></span>
                                                                <div>
                                                                    <small>Class incharge</small>
                                                                    <b>{hasClass ? inchargeSections.map(s => `${s.className} — ${s.name}`).join(', ') : 'Not assigned'}</b>
                                                                </div>
                                                            </div>
                                                            <div className="sdm-info">
                                                                <span className="sdm-info-ico"><Mail size={16} /></span>
                                                                <div><small>Email</small><b className="sdm-wrap">{m.email || 'Not provided'}</b></div>
                                                                {m.email && (
                                                                    <button type="button" className="sdm-mini" onClick={() => copy('email', m.email)} title="Copy email">
                                                                        {copiedStaffField === 'email' ? <Check size={14} /> : <Copy size={14} />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="sdm-info">
                                                                <span className="sdm-info-ico"><Lock size={16} /></span>
                                                                <div>
                                                                    <small>Login password</small>
                                                                    <b className="sdm-pass">{showStaffPwd ? (m.password || '—') : '••••••••'}</b>
                                                                </div>
                                                                <button type="button" className="sdm-mini" onClick={() => setShowStaffPwd(v => !v)} title={showStaffPwd ? 'Hide' : 'Show'}>
                                                                    {showStaffPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="sdm-body sdm-class-body">
                                                        {inchargeSections.length > 1 && (
                                                            <div className="sdm-sec-pills" role="tablist" aria-label="Sections">
                                                                {inchargeSections.map(sec => (
                                                                    <button
                                                                        key={sec.id}
                                                                        type="button"
                                                                        className={`sdm-sec-pill ${sec.id === activeSec.id ? 'active' : ''}`}
                                                                        onClick={() => setStaffViewSectionId(sec.id)}
                                                                    >
                                                                        {sec.className} · {sec.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="sdm-class-head">
                                                            <div>
                                                                <h4>{activeSec.className} — {activeSec.name}</h4>
                                                                <p>{activeSec.roomNo ? `Room ${activeSec.roomNo}` : 'No room assigned'}</p>
                                                            </div>
                                                            <div className="sdm-controls">
                                                                <div className="sdm-sort" role="group" aria-label="Class view">
                                                                    <button type="button" className={staffClassView === 'attendance' ? 'active' : ''} onClick={() => setStaffClassView('attendance')}>Attendance</button>
                                                                    <button type="button" className={staffClassView === 'progress' ? 'active' : ''} onClick={() => setStaffClassView('progress')}>Progress</button>
                                                                </div>
                                                                <div className="sdm-sort" role="group" aria-label="Sort students">
                                                                    <button type="button" className={staffViewSort === 'name' ? 'active' : ''} onClick={() => setStaffViewSort('name')}>By name</button>
                                                                    <button type="button" className={staffViewSort === 'low' ? 'active' : ''} onClick={() => setStaffViewSort('low')}>{staffClassView === 'attendance' ? 'Lowest attendance' : 'Lowest average'}</button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {staffClassView === 'attendance' ? (
                                                            <>
                                                                <div className="sdm-kpis">
                                                                    <div className="sdm-kpi">
                                                                        <small>Students</small>
                                                                        <strong>{classSummary.count}</strong>
                                                                    </div>
                                                                    <div className={`sdm-kpi tone-${attendanceRecords === null ? 'none' : tone(classSummary.avg)}`}>
                                                                        <small>Class attendance</small>
                                                                        <strong>{attendanceRecords === null ? '…' : classSummary.avg !== null ? `${classSummary.avg}%` : '—'}</strong>
                                                                    </div>
                                                                    <div className={`sdm-kpi ${classSummary.low > 0 ? 'tone-low' : ''}`}>
                                                                        <small>Below 75%</small>
                                                                        <strong>{attendanceRecords === null ? '…' : classSummary.low}</strong>
                                                                    </div>
                                                                </div>

                                                                {classStudents.length === 0 ? (
                                                                    <div className="sdm-class-empty">No students are enrolled in {activeSec.className} — {activeSec.name} yet.</div>
                                                                ) : (
                                                                    <ul className="sdm-roster">
                                                                        {classStudents.map(st => {
                                                                            const t = attendanceRecords === null ? 'none' : tone(st.pct);
                                                                            return (
                                                                                <li key={st.id} className="sdm-student">
                                                                                    <span className="sdm-student-avatar">
                                                                                        {st.photo ? <img src={st.photo} alt="" /> : (st.name || '?').charAt(0).toUpperCase()}
                                                                                    </span>
                                                                                    <div className="sdm-student-id">
                                                                                        <b>{st.name}</b>
                                                                                        <small>{st.rollNumber ? `Roll ${st.rollNumber}` : st.admissionNo ? `Adm #${st.admissionNo}` : '—'}</small>
                                                                                    </div>
                                                                                    <div className="sdm-att">
                                                                                        <div className="sdm-att-bar" aria-hidden="true"><span className={`tone-${t}`} style={{ width: `${st.pct ?? 0}%` }} /></div>
                                                                                        <small>{st.total ? `${st.present}/${st.total} sessions present` : attendanceRecords === null ? 'Loading…' : 'No records yet'}</small>
                                                                                    </div>
                                                                                    <span className={`sdm-pct tone-${t}`}>{st.pct !== null ? `${st.pct}%` : '—'}</span>
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ul>
                                                                )}
                                                                <p className="sdm-class-note">Attendance is calculated from the sessions staff have marked. Green is 90% or more, amber 75 to 89%, red below 75%.</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="sdm-kpis">
                                                                    <div className={`sdm-kpi tone-${scoreTone(progress.classAvg)}`}>
                                                                        <small>Class average</small>
                                                                        <strong>{progress.classAvg !== null ? `${progress.classAvg}%` : '—'}</strong>
                                                                    </div>
                                                                    <div className={`sdm-kpi tone-${scoreTone(progress.passRate)}`}>
                                                                        <small>Pass rate</small>
                                                                        <strong>{progress.passRate !== null ? `${progress.passRate}%` : '—'}</strong>
                                                                    </div>
                                                                    <div className="sdm-kpi">
                                                                        <small>Scores published</small>
                                                                        <strong>{progress.publishedCount}</strong>
                                                                    </div>
                                                                </div>

                                                                {progress.publishedCount === 0 ? (
                                                                    <div className="sdm-class-empty">
                                                                        <p>No published marks for {activeSec.className} — {activeSec.name} yet.{progress.pendingCount > 0 ? ` ${progress.pendingCount} draft score${progress.pendingCount === 1 ? ' is' : 's are'} waiting to be published.` : ''}</p>
                                                                        <button type="button" className="sdm-btn ghost sdm-inline-btn" onClick={() => { setViewStaffId(null); goTo('results'); }}>
                                                                            <Award size={14} /> Open results
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <h4 className="sdm-sub">Subject performance</h4>
                                                                        <ul className="sdm-bars">
                                                                            {progress.subjects.map(s => (
                                                                                <li key={s.subject}>
                                                                                    <span className="sdm-bars-label">{s.subject}</span>
                                                                                    <div className="sdm-att-bar" aria-hidden="true"><span className={`tone-${scoreTone(s.avg)}`} style={{ width: `${s.avg}%` }} /></div>
                                                                                    <span className={`sdm-pct tone-${scoreTone(s.avg)}`}>{s.avg}%</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>

                                                                        {progress.exams.length > 0 && (
                                                                            <>
                                                                                <h4 className="sdm-sub">Exam-wise average</h4>
                                                                                <div className="sdm-exam-chips">
                                                                                    {progress.exams.map(x => (
                                                                                        <span key={x.exam} className={`tone-${scoreTone(x.avg)}`}><small>{x.exam.replace(/ exam$/i, '')}</small><b>{x.avg}%</b></span>
                                                                                    ))}
                                                                                </div>
                                                                            </>
                                                                        )}

                                                                        <h4 className="sdm-sub">Student progress</h4>
                                                                        <ul className="sdm-roster">
                                                                            {classStudents.map(st => {
                                                                                const t = scoreTone(st.avgScore);
                                                                                return (
                                                                                    <li key={st.id} className="sdm-student">
                                                                                        <span className="sdm-student-avatar">
                                                                                            {st.photo ? <img src={st.photo} alt="" /> : (st.name || '?').charAt(0).toUpperCase()}
                                                                                        </span>
                                                                                        <div className="sdm-student-id">
                                                                                            <b>{st.name}</b>
                                                                                            <small>{st.rollNumber ? `Roll ${st.rollNumber}` : st.admissionNo ? `Adm #${st.admissionNo}` : '—'}</small>
                                                                                        </div>
                                                                                        <div className="sdm-att">
                                                                                            <div className="sdm-att-bar" aria-hidden="true"><span className={`tone-${t}`} style={{ width: `${st.avgScore ?? 0}%` }} /></div>
                                                                                            <small>{st.scoreCount ? `${st.scoreCount} published score${st.scoreCount === 1 ? '' : 's'}` : 'No published marks'}</small>
                                                                                        </div>
                                                                                        <span className={`sdm-pct tone-${t}`}>{st.avgScore !== null ? `${st.avgScore}%` : '—'}</span>
                                                                                    </li>
                                                                                );
                                                                            })}
                                                                        </ul>
                                                                        <p className="sdm-class-note">Averages use published marks out of 100. Green is 75% or more, amber 50 to 74%, red below 50%. Pass mark is 35.</p>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="sdm-footer">
                                                    {m.email ? (
                                                        <a className="sdm-btn ghost" href={`mailto:${m.email}`}><Mail size={15} /> Message</a>
                                                    ) : (
                                                        <button type="button" className="sdm-btn ghost" disabled><Mail size={15} /> Message</button>
                                                    )}
                                                    <button type="button" className="sdm-btn primary" onClick={() => { setViewStaffId(null); handleStartEditStaff(m); }}>
                                                        <Edit2 size={15} /> Edit profile
                                                    </button>
                                                </div>
                                            </div>
                                        </div>,
                                        document.body
                                    );
                                })()}

                                {/* STAFF EDIT POPUP */}
                                {editingStaffId && (() => {
                                    const m = staffList.find(x => x.id === editingStaffId);
                                    if (!m) return null;
                                    const canSave = editStaffForm.name.trim() && editStaffForm.staffId.trim();
                                    return createPortal(
                                        <div className="sdm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditingStaffId(null); }}>
                                            <form
                                                className="sdm-modal sdm-edit"
                                                role="dialog"
                                                aria-modal="true"
                                                aria-label="Edit staff"
                                                onSubmit={(e) => { e.preventDefault(); handleUpdateStaff(m.id); }}
                                            >
                                                <div className="sdm-edit-head">
                                                    <div className="sdm-edit-title">
                                                        <span className="sdm-edit-ico"><Edit2 size={17} /></span>
                                                        <div>
                                                            <h3>Edit staff profile</h3>
                                                            <p>Update credentials, department and contact details.</p>
                                                        </div>
                                                    </div>
                                                    <button type="button" className="sdm-close flat" onClick={() => setEditingStaffId(null)} aria-label="Close"><X size={16} /></button>
                                                </div>

                                                <div className="sdm-body sdm-edit-body">
                                                    <div className="sdm-photo-row">
                                                        <label className="sdm-photo" title="Change photo">
                                                            {editStaffForm.photo
                                                                ? <img src={editStaffForm.photo} alt="Preview" />
                                                                : <span>{editStaffForm.name ? editStaffForm.name.charAt(0).toUpperCase() : 'S'}</span>}
                                                            <em><Camera size={14} /></em>
                                                            <input
                                                                type="file"
                                                                accept=".jpg,.jpeg,.png,.webp"
                                                                onChange={e => handleImageUpload(e.target.files[0], (base64) => setEditStaffForm(f => ({ ...f, photo: base64 })))}
                                                            />
                                                        </label>
                                                        <div className="sdm-photo-text">
                                                            <b>Profile photo</b>
                                                            <small>JPG, PNG or WEBP · auto-compressed</small>
                                                            {editStaffForm.photo && (
                                                                <button type="button" className="sdm-link-danger" onClick={() => setEditStaffForm(f => ({ ...f, photo: '' }))}>Remove photo</button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="sdm-fields">
                                                        <label className="sdm-field full">
                                                            <span>Full name</span>
                                                            <div className="sdm-input"><Users size={15} />
                                                                <input type="text" value={editStaffForm.name} placeholder="e.g. Dr. John Doe" required
                                                                    onChange={e => setEditStaffForm({ ...editStaffForm, name: e.target.value })} />
                                                            </div>
                                                        </label>
                                                        <label className="sdm-field">
                                                            <span>Staff ID</span>
                                                            <div className="sdm-input"><Hash size={15} />
                                                                <input type="text" value={editStaffForm.staffId} placeholder="e.g. HCMS-05" required
                                                                    onChange={e => setEditStaffForm({ ...editStaffForm, staffId: e.target.value })} />
                                                            </div>
                                                        </label>
                                                        <label className="sdm-field">
                                                            <span>Department</span>
                                                            <div className="sdm-input"><Briefcase size={15} />
                                                                <input type="text" value={editStaffForm.department} placeholder="e.g. Mathematics"
                                                                    onChange={e => setEditStaffForm({ ...editStaffForm, department: e.target.value })} />
                                                            </div>
                                                        </label>
                                                        <label className="sdm-field full">
                                                            <span>Email address</span>
                                                            <div className="sdm-input"><Mail size={15} />
                                                                <input type="email" value={editStaffForm.email} placeholder="staff@school.edu"
                                                                    onChange={e => setEditStaffForm({ ...editStaffForm, email: e.target.value })} />
                                                            </div>
                                                        </label>
                                                        <label className="sdm-field full">
                                                            <span>Login password</span>
                                                            <div className="sdm-input"><Lock size={15} />
                                                                <input type={showStaffPwd ? 'text' : 'password'} value={editStaffForm.password} placeholder="Login password"
                                                                    onChange={e => setEditStaffForm({ ...editStaffForm, password: e.target.value })} />
                                                                <button type="button" className="sdm-eye" onClick={() => setShowStaffPwd(v => !v)} tabIndex={-1}>
                                                                    {showStaffPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                                                </button>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="sdm-footer">
                                                    <button type="button" className="sdm-btn ghost" onClick={() => setEditingStaffId(null)}><X size={15} /> Cancel</button>
                                                    <button type="submit" className="sdm-btn primary" disabled={!canSave}><Check size={15} /> Save changes</button>
                                                </div>
                                            </form>
                                        </div>,
                                        document.body
                                    );
                                })()}
                            </div>
                        );
                    })()}

                    {/* STUDENTS ERP */}
                    {activeTab === 'students' && (
                        <div className="applications-management-card premium-section students-directory-premium">
                            {!selectedClass && (
                                <>
                                    <div className="premium-section-heading">
                                        <div className="premium-section-title-wrap">
                                            <div className="premium-section-icon"><GraduationCap size={19} /></div>
                                            <div>
                                                <h3>Students Directory — Classes</h3>
                                                <p>Choose a class to manage sections, enrollment and student records.</p>
                                            </div>
                                        </div>
                                        <span className="premium-section-count">{studentsList.length} Students</span>
                                    </div>
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
                                        <div><input type="text" placeholder="Section Name (e.g., Section A)" value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} required /></div>
                                        <div><input type="text" placeholder="Room No / Hall (e.g., Room 104)" value={sectionForm.roomNo} onChange={e => setSectionForm({ ...sectionForm, roomNo: e.target.value })} /></div>
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
                                                                <input type="text" value={editSectionForm.name} onChange={e => setEditSectionForm({ ...editSectionForm, name: e.target.value })} placeholder="Section Name" />
                                                                <input type="text" value={editSectionForm.roomNo} onChange={e => setEditSectionForm({ ...editSectionForm, roomNo: e.target.value })} placeholder="Room No" />
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
                                        <button className="back-btn" onClick={() => {
                                            setSelectedSection(null);
                                            setEditingStudentId(null);
                                            setStudentForm(initialStudentForm);
                                            setShowAddStudentForm(false);
                                        }}>
                                            <ArrowLeft size={15} /> Back to Sections
                                        </button>
                                        <h3 style={{ margin: 0 }}>
                                            {selectedClass} — {selectedSection.name} Admission
                                        </h3>
                                    </div>

                                    {showAddStudentForm && (
                                        <form ref={studentFormRef} onSubmit={editingStudentId ? handleUpdateStudent : handleAddStudent} className="student-admission-form">
                                            <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>{editingStudentId ? `Update Student Details (#${studentForm.admissionNo})` : 'Admission & Credentials'}</span>
                                                <button
                                                    type="button"
                                                    className="directory-form-close-btn"
                                                    onClick={() => { setShowAddStudentForm(false); setEditingStudentId(null); setStudentForm(initialStudentForm); }}
                                                    title="Close"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="student-form-grid">
                                                <div>
                                                    <label>Admission No (User ID)</label>
                                                    <input type="text" placeholder="e.g. ADM2026-001" value={studentForm.admissionNo} onChange={e => setStudentForm({ ...studentForm, admissionNo: e.target.value })} required />
                                                </div>
                                                <div>
                                                    <label>Admission Date</label>
                                                    <input type="date" value={studentForm.admissionDate} onChange={e => setStudentForm({ ...studentForm, admissionDate: e.target.value })} required />
                                                </div>
                                            </div>

                                            <div className="form-section-title">Personal Details</div>
                                            <div className="student-form-grid">
                                                <div>
                                                    <label>Student Name</label>
                                                    <input type="text" placeholder="e.g. Rahul Sharma" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} required />
                                                </div>
                                                <div>
                                                    <label>DOB (Password)</label>
                                                    <input type="date" value={studentForm.dob} onChange={e => setStudentForm({ ...studentForm, dob: e.target.value })} required />
                                                </div>
                                                <div>
                                                    <label>Blood Group</label>
                                                    <select value={studentForm.bloodGroup} onChange={e => setStudentForm({ ...studentForm, bloodGroup: e.target.value })}>
                                                        <option value="">Select Blood Group</option>
                                                        <option value="A+">A+</option><option value="A-">A-</option>
                                                        <option value="B+">B+</option><option value="B-">B-</option>
                                                        <option value="O+">O+</option><option value="O-">O-</option>
                                                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label>Gender</label>
                                                    <select value={studentForm.gender} onChange={e => setStudentForm({ ...studentForm, gender: e.target.value })}>
                                                        <option value="">Select Gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label>Roll Number</label>
                                                    <input type="text" placeholder="Enter roll number" value={studentForm.rollNumber} onChange={e => setStudentForm({ ...studentForm, rollNumber: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label>Email Address</label>
                                                    <input type="email" placeholder="Enter email address" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label>Status</label>
                                                    <select value={studentForm.status} onChange={e => setStudentForm({ ...studentForm, status: e.target.value })}>
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label>Student Photo</label>
                                                    <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => handleImageUpload(e.target.files[0], (base64) => setStudentForm({ ...studentForm, photo: base64 }))} />
                                                    {studentForm.photo && (
                                                        <div style={{ marginTop: '4px' }}>
                                                            <img src={studentForm.photo} alt="Student Preview" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="form-section-title">Parent / Guardian Information</div>
                                            <div className="student-form-grid">
                                                <div>
                                                    <label>Parent / Guardian Name</label>
                                                    <input type="text" placeholder="Parent's Name" value={studentForm.guardianName} onChange={e => setStudentForm({ ...studentForm, guardianName: e.target.value })} required />
                                                </div>
                                                <div>
                                                    <label>Phone Number</label>
                                                    <input type="text" placeholder="Student Contact Number" value={studentForm.phone} onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} required />
                                                </div>
                                                <div>
                                                    <label>Parent Phone</label>
                                                    <input type="text" placeholder="Enter parent phone" value={studentForm.parentPhone} onChange={e => setStudentForm({ ...studentForm, parentPhone: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label>Relationship</label>
                                                    <select value={studentForm.relationship} onChange={e => setStudentForm({ ...studentForm, relationship: e.target.value })}>
                                                        <option value="">Select Relationship</option>
                                                        <option value="Father">Father</option>
                                                        <option value="Mother">Mother</option>
                                                        <option value="Guardian">Guardian</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '4px', width: '100%' }}>
                                                <label>Address</label>
                                                <textarea rows="2" placeholder="Enter full address" value={studentForm.address} onChange={e => setStudentForm({ ...studentForm, address: e.target.value })} />
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                <button type="submit" className="add-notice-btn">
                                                    {editingStudentId ? <><RefreshCw size={15} /> Update Student Record</> : <><UserCheck size={15} /> Enroll & Generate Credentials</>}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cancel-btn"
                                                    onClick={() => { setEditingStudentId(null); setStudentForm(initialStudentForm); setShowAddStudentForm(false); }}
                                                >
                                                    <X size={14} /> {editingStudentId ? 'Cancel Edit' : 'Close'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {(() => {
                                        const sectionStudents = studentsList.filter(st => st.sectionId === selectedSection.id);
                                        const dirQuery = studentDirSearch.toLowerCase().trim();
                                        const visibleStudents = sectionStudents.filter(st =>
                                            !dirQuery ||
                                            st.name?.toLowerCase().includes(dirQuery) ||
                                            st.admissionNo?.toLowerCase().includes(dirQuery) ||
                                            String(st.rollNumber || '').toLowerCase().includes(dirQuery)
                                        );
                                        return (
                                            <>
                                                <h4>Enrolled Students Directory <span className="count-badge">{sectionStudents.length}</span></h4>

                                                <div className="directory-toolbar">
                                                    <input
                                                        type="text"
                                                        placeholder="Search by full name"
                                                        value={studentDirSearch}
                                                        onChange={(e) => setStudentDirSearch(e.target.value)}
                                                        className="directory-search-input"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Search by admission / roll no"
                                                        value={studentDirSearch}
                                                        onChange={(e) => setStudentDirSearch(e.target.value)}
                                                        className="directory-search-input"
                                                    />
                                                    <select className="directory-select" disabled value="">
                                                        <option value="">{selectedClass} - {selectedSection.name}</option>
                                                    </select>
                                                    <button type="button" className="directory-btn-search" onClick={(e) => e.currentTarget.blur()}>
                                                        <Search size={14} /> Search
                                                    </button>
                                                    <button type="button" className="directory-btn-reset" onClick={() => setStudentDirSearch('')}>
                                                        <RefreshCw size={14} /> Reset
                                                    </button>
                                                </div>
                                                <p className="directory-showing-text">Showing {visibleStudents.length} of {sectionStudents.length}</p>

                                                <div className="directory-grid">
                                                    <div
                                                        className="directory-add-card"
                                                        onClick={() => {
                                                            setEditingStudentId(null);
                                                            setStudentForm(initialStudentForm);
                                                            setShowAddStudentForm(true);
                                                            setTimeout(() => studentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                                                        }}
                                                    >
                                                        <div className="directory-add-icon"><PlusCircle size={26} /></div>
                                                        <h5>Add New Student</h5>
                                                        <p>Click to enroll a new student</p>
                                                        <span className="directory-add-link">Create Account <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} /></span>
                                                    </div>

                                                    {visibleStudents.length === 0 ? (
                                                        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                                            {dirQuery ? `No students found matching "${studentDirSearch}".` : 'No student records enrolled in this section yet.'}
                                                        </div>
                                                    ) : (
                                                        visibleStudents.map(st => (
                                                            <div key={st.id} className="directory-card">
                                                                <button className="directory-delete-corner" onClick={() => handleDelete('students_records', st.id)} title="Delete Record">
                                                                    <Trash2 size={13} />
                                                                </button>
                                                                <div className="directory-card-top">
                                                                    <div className="directory-avatar-wrap">
                                                                        <img
                                                                            src={st.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                                                                            alt={st.name}
                                                                            className="directory-avatar-img"
                                                                        />
                                                                        <span
                                                                            className={`directory-status-dot ${(st.status || 'Active').toLowerCase() === 'active' ? '' : 'inactive'}`}
                                                                            title={st.status || 'Active'}
                                                                        />
                                                                    </div>
                                                                    <h5 className="directory-card-name">
                                                                        {st.name}
                                                                        {st.bloodGroup && <span className="blood-badge" style={{ marginLeft: '6px' }}>{st.bloodGroup}</span>}
                                                                    </h5>
                                                                    <span className="directory-pill">R.No: {st.rollNumber || 'N/A'}</span>
                                                                    <span className="directory-pill directory-pill-alt"><GraduationCap size={11} /> {selectedClass} - {selectedSection.name}</span>
                                                                </div>

                                                                <div className="directory-card-footer">
                                                                    <button className="directory-action-btn view" onClick={() => setPreviewStudent(st)}>
                                                                        <Eye size={14} /> View
                                                                    </button>
                                                                    {st.email ? (
                                                                        <a className="directory-action-btn message" href={`mailto:${st.email}`}>
                                                                            <Mail size={14} /> Message
                                                                        </a>
                                                                    ) : (
                                                                        <button className="directory-action-btn message" disabled title="No email on file">
                                                                            <Mail size={14} /> Message
                                                                        </button>
                                                                    )}
                                                                    <button className="directory-action-btn edit" onClick={() => startEditingStudent(st)}>
                                                                        <Edit2 size={14} /> Edit
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </>
                            )}

                            {previewStudent && (
                                <Previewmodal
                                    student={previewStudent}
                                    className={previewStudent.className || selectedClass}
                                    sectionName={
                                        selectedSection?.name ||
                                        sectionsList.find(sec => sec.id === previewStudent.sectionId)?.name
                                    }
                                    onClose={() => setPreviewStudent(null)}
                                    onEdit={(st) => {
                                        setPreviewStudent(null);
                                        startEditingStudent(st);
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* CLASS INCHARGE TEACHERS TAB */}
                    {activeTab === 'class_incharge' && (
                        <div className="applications-management-card premium-section students-directory-premium">
                            <div className="premium-section-heading">
                                <div className="premium-section-title-wrap">
                                    <div className="premium-section-icon"><UserCheck size={19} /></div>
                                    <div>
                                        <h3>Class Incharge Teachers</h3>
                                        <p>Select a class and section, then assign a teacher as its class incharge.</p>
                                    </div>
                                </div>
                                <span className="premium-section-count">{sectionsList.filter(s => s.classIncharge).length} Assigned</span>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleAssignClassIncharge(); }}>
                                <div>
                                    <label>Select Class</label>
                                    <select
                                        value={selectedInchargeClass}
                                        onChange={e => {
                                            setSelectedInchargeClass(e.target.value);
                                            setSelectedInchargeSectionId('');
                                            setSelectedInchargeTeacherId('');
                                        }}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classList.map((cls) => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Select Section</label>
                                    <select
                                        value={selectedInchargeSectionId}
                                        onChange={e => {
                                            const sectionId = e.target.value;
                                            setSelectedInchargeSectionId(sectionId);
                                            const sec = sectionsList.find(s => s.id === sectionId);
                                            setSelectedInchargeTeacherId(sec?.classInchargeId || '');
                                        }}
                                        required
                                        disabled={!selectedInchargeClass}
                                    >
                                        <option value="">Select Section</option>
                                        {getSectionsForClass(selectedInchargeClass).map((sec) => (
                                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Assign Teacher</label>
                                    <select
                                        value={selectedInchargeTeacherId}
                                        onChange={e => setSelectedInchargeTeacherId(e.target.value)}
                                        disabled={!selectedInchargeSectionId}
                                    >
                                        <option value="">No Teacher Assigned</option>
                                        {staffList.map(stf => (
                                            <option key={stf.id} value={stf.id}>{stf.name} ({stf.department || 'Staff'})</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="add-notice-btn" disabled={!selectedInchargeSectionId || inchargeAssigning}>
                                    <UserCheck size={15} /> {inchargeAssigning ? 'Saving...' : 'Assign Class Incharge'}
                                </button>
                                {inchargeSavedMsg && <span style={{ color: 'var(--primary)', fontSize: '0.8rem', marginLeft: '10px' }}>Saved successfully</span>}
                            </form>

                            <h4>
                                {selectedInchargeClass ? `${selectedInchargeClass} Sections` : 'All Class Sections'}{' '}
                                <span className="count-badge">
                                    {(selectedInchargeClass ? getSectionsForClass(selectedInchargeClass) : sectionsList).length}
                                </span>
                            </h4>

                            {(selectedInchargeClass ? getSectionsForClass(selectedInchargeClass) : sectionsList).length === 0 ? (
                                <div className="empty-state">No class sections found. Create sections first under Students ERP.</div>
                            ) : (
                                <div className="sections-grid">
                                    {(selectedInchargeClass ? getSectionsForClass(selectedInchargeClass) : sectionsList).map(sec => (
                                        <div key={sec.id} className="section-card">
                                            <div className="section-card-body" onClick={() => {
                                                setSelectedInchargeClass(sec.className);
                                                setSelectedInchargeSectionId(sec.id);
                                                setSelectedInchargeTeacherId(sec.classInchargeId || '');
                                            }}>
                                                <UserCheck size={18} className="section-folder-icon" />
                                                <div>
                                                    <h5>{sec.className} — {sec.name}</h5>
                                                    <p>{sec.classIncharge ? `Incharge: ${sec.classIncharge}` : 'No teacher assigned'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* RESULTS & MASTER PUBLISHING TAB */}
                    {activeTab === 'results' && (
                        <div className="applications-management-card premium-section results-premium">
                            <div className="premium-results-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <h3><Award size={18} color="var(--primary)" /> Examination Results & Master Publishing</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                                        Review staff-entered draft scores by Class and Section, choose the Exam Type & Subject, and publish marks live for students.
                                    </p>
                                </div>

                                {!selectedClassResults && (
                                    <button
                                        type="button"
                                        className="add-notice-btn"
                                        style={{ background: 'linear-gradient(135deg, #059669, #047857)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        onClick={async () => {
                                            const compositeKey = `${examType} - ${selectedSubject}`;
                                            if (!window.confirm(`Publish ALL draft marks across ALL classes and sections for ${compositeKey}?`)) return;

                                            const targetStudents = studentsList.filter(st => st.marksDraft?.[compositeKey] !== undefined);
                                            if (targetStudents.length === 0) {
                                                alert(`No draft marks found anywhere in the school for ${compositeKey}.`);
                                                return;
                                            }

                                            const batch = writeBatch(db);
                                            targetStudents.forEach(st => {
                                                const score = st.marksDraft[compositeKey];
                                                const studentRef = doc(db, 'students_records', st.id);
                                                batch.update(studentRef, {
                                                    [`marks.${compositeKey}`]: score,
                                                    [`publishedMarks.${compositeKey}`]: {
                                                        score: score,
                                                        subject: selectedSubject,
                                                        examType: examType,
                                                        publishedAt: new Date().toISOString(),
                                                        publishedBy: 'Administrator'
                                                    },
                                                    marksPublished: true,
                                                    lastMarksUpdated: new Date().toISOString()
                                                });
                                            });

                                            await batch.commit();
                                            alert(`Successfully published ${targetStudents.length} student scores live across ALL classes for ${compositeKey}!`);
                                        }}
                                    >
                                        <Award size={15} /> Publish for All Classes At Once
                                    </button>
                                )}
                            </div>

                            {(selectedClassResults || selectedSectionResults) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
                                    <button onClick={() => { setSelectedClassResults(null); setSelectedSectionResults(null); }} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: 0, fontWeight: 600 }}>All Classes</button>
                                    {selectedClassResults && (
                                        <>
                                            <span style={{ color: '#94a3b8' }}>/</span>
                                            <button onClick={() => setSelectedSectionResults(null)} style={{ background: 'none', border: 'none', color: selectedSectionResults ? '#4f46e5' : '#0f172a', cursor: selectedSectionResults ? 'pointer' : 'default', padding: 0, fontWeight: 600 }}>{selectedClassResults}</button>
                                        </>
                                    )}
                                    {selectedSectionResults && (
                                        <>
                                            <span style={{ color: '#94a3b8' }}>/</span>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>Section {selectedSectionResults.name}</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {!selectedClassResults && (
                                <div>
                                    <h4 style={{ marginBottom: '12px' }}>Select Class</h4>
                                    <div className="class-cards-grid">
                                        {classList.map((cls) => {
                                            const classSections = sectionsList.filter(s => s.className === cls);
                                            const countStudents = studentsList.filter(s => s.className === cls).length;

                                            return (
                                                <div key={cls} className="class-card" onClick={() => setSelectedClassResults(cls)}>
                                                    <div className="class-card-icon"><GraduationCap size={20} /></div>
                                                    <div className="class-card-content">
                                                        <h4>{cls}</h4>
                                                        <span>{classSections.length} Sections • {countStudents} Students</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedClassResults && !selectedSectionResults && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <button className="back-btn" onClick={() => setSelectedClassResults(null)}><ArrowLeft size={15} /> Back to Classes</button>
                                        <h4 style={{ margin: 0 }}>{selectedClassResults} — Select Section</h4>
                                    </div>

                                    {sectionsList.filter(s => s.className === selectedClassResults).length === 0 ? (
                                        <div className="empty-state">No sections registered for {selectedClassResults}.</div>
                                    ) : (
                                        <div className="sections-grid">
                                            {sectionsList.filter(s => s.className === selectedClassResults).map(sec => {
                                                const studentCount = studentsList.filter(st => st.sectionId === sec.id).length;
                                                return (
                                                    <div key={sec.id} className="section-card" onClick={() => setSelectedSectionResults(sec)}>
                                                        <div className="section-card-body">
                                                            <Folder size={18} className="section-folder-icon" />
                                                            <div>
                                                                <h5>Section {sec.name}</h5>
                                                                <p>{studentCount} Students Enrolled</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedClassResults && selectedSectionResults && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <button className="back-btn" onClick={() => setSelectedSectionResults(null)}><ArrowLeft size={15} /> Back to Sections</button>
                                        <h4 style={{ margin: 0 }}>{selectedClassResults} — Section {selectedSectionResults.name} Marks & Drafts</h4>
                                    </div>

                                    <div className="form-grid marks-four-col-grid" style={{ marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Exam Term</label>
                                            <select className="custom-select full-width" value={examType} onChange={(e) => setExamType(e.target.value)}>
                                                <option value="1st Mid-Term exam">1st Mid-Term exam</option>
                                                <option value="Quarterly Exam">Quarterly Exam</option>
                                                <option value="2nd Mid-Term exam">2nd Mid-Term exam</option>
                                                <option value="Halferly Exam">Halferly Exam</option>
                                                <option value="3rd Mid-Term exam">3rd Mid-Term exam</option>
                                                <option value="Annual Exam">Annual Exam</option>
                                                <option value="Class Unit Test">Class Unit Test</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Subject</label>
                                            <select className="custom-select full-width" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                                                <option value="Mathematics">Mathematics</option>
                                                <option value="Science">Science</option>
                                                <option value="Physics">Physics</option>
                                                <option value="Chemistry">Chemistry</option>
                                                <option value="Biology">Biology</option>
                                                <option value="English">English</option>
                                                <option value="Tamil">Tamil</option>
                                                <option value="Social Science">Social Science</option>
                                                <option value="Computer Science">Computer Science</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Admission No</th>
                                                    <th>Student Name</th>
                                                    <th>Staff Entered Draft Score</th>
                                                    <th>Live Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentsList.filter(st => st.sectionId === selectedSectionResults.id).length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No students enrolled in this section.</td>
                                                    </tr>
                                                ) : (
                                                    studentsList.filter(st => st.sectionId === selectedSectionResults.id).map(st => {
                                                        const compositeKey = `${examType} - ${selectedSubject}`;
                                                        const draftScore = st.marksDraft?.[compositeKey];
                                                        const liveScore = st.marks?.[compositeKey];

                                                        return (
                                                            <tr key={st.id}>
                                                                <td><code>#{st.admissionNo || 'N/A'}</code></td>
                                                                <td><strong>{st.name}</strong></td>
                                                                <td>
                                                                    {draftScore !== undefined ? (
                                                                        <span style={{ fontWeight: 800, color: 'var(--accent-warning)' }}>{draftScore} / 100 (Draft)</span>
                                                                    ) : (
                                                                        <span style={{ color: 'var(--text-muted)' }}>No draft entry</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {liveScore !== undefined ? (
                                                                        <span className="status-badge status-present">PUBLISHED ({liveScore})</span>
                                                                    ) : (
                                                                        <span className="status-badge status-absent">PENDING PUBLISH</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="card-footer" style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                                        <button
                                            type="button"
                                            className="add-notice-btn"
                                            onClick={async () => {
                                                const compositeKey = `${examType} - ${selectedSubject}`;
                                                if (!window.confirm(`Publish all draft marks for ${selectedClassResults} - Section ${selectedSectionResults.name} (${compositeKey})?`)) return;

                                                const targetStudents = studentsList.filter(st => st.sectionId === selectedSectionResults.id && st.marksDraft?.[compositeKey] !== undefined);
                                                if (targetStudents.length === 0) {
                                                    alert("No draft marks found to publish for this section.");
                                                    return;
                                                }

                                                const batch = writeBatch(db);
                                                targetStudents.forEach(st => {
                                                    const score = st.marksDraft[compositeKey];
                                                    const studentRef = doc(db, 'students_records', st.id);
                                                    batch.update(studentRef, {
                                                        [`marks.${compositeKey}`]: score,
                                                        [`publishedMarks.${compositeKey}`]: {
                                                            score: score,
                                                            subject: selectedSubject,
                                                            examType: examType,
                                                            publishedAt: new Date().toISOString(),
                                                            publishedBy: 'Administrator'
                                                        },
                                                        marksPublished: true,
                                                        lastMarksUpdated: new Date().toISOString()
                                                    });
                                                });

                                                await batch.commit();
                                                alert(`Successfully published ${targetStudents.length} student scores live for this section!`);
                                            }}
                                        >
                                            <Send size={15} /> Publish Section Drafts Live
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STUDENT TIMETABLE TAB */}
                    {activeTab === 'student_timetable' && (
                        <div className="applications-management-card">
                            <h3 style={{ marginBottom: '14px' }}>Student Directory — Class Timetables</h3>

                            {(selectedClassTT || selectedSectionTT) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
                                    <button onClick={() => { setSelectedClassTT(null); setSelectedSectionTT(null); }} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: 0, fontWeight: 600 }}>All Classes</button>
                                    {selectedClassTT && (
                                        <>
                                            <span style={{ color: '#94a3b8' }}>/</span>
                                            <button onClick={() => setSelectedSectionTT(null)} style={{ background: 'none', border: 'none', color: selectedSectionTT ? '#4f46e5' : '#0f172a', cursor: selectedSectionTT ? 'pointer' : 'default', padding: 0, fontWeight: 600 }}>{selectedClassTT}</button>
                                        </>
                                    )}
                                    {selectedSectionTT && (
                                        <>
                                            <span style={{ color: '#94a3b8' }}>/</span>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSectionTT.startsWith('Section') ? selectedSectionTT : `Section ${selectedSectionTT}`}</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {!selectedClassTT && (
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '-4px', marginBottom: '12px' }}>Select a class to manage its section timetables.</p>
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
                                        Available Sections <span className="count-badge">{sectionsList.filter(s => s.className === selectedClassTT).length}</span>
                                    </h4>

                                    {sectionsList.filter(s => s.className === selectedClassTT).length === 0 ? (
                                        <div className="empty-state">No sections found for {selectedClassTT}. Create sections in Student ERP first.</div>
                                    ) : (
                                        <div className="sections-grid">
                                            {sectionsList.filter(s => s.className === selectedClassTT).map(sec => {
                                                const sectionSlots = studentTimetables.filter(tt => tt.className === selectedClassTT && tt.sectionName === sec.name).length;
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
                                                    {timeSlots.map(slot => (<th key={slot}>{slot}</th>))}
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

                                                                            <div style={{ position: 'absolute', top: '2px', right: '2px', display: 'flex', gap: '3px' }}>
                                                                                <button onClick={() => { setEditingStudentTTId(match.id); setEditStudentTTForm({ ...match }); }} title="Edit Slot" style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: 0 }}><Edit2 size={11} /></button>
                                                                                <button onClick={() => handleDelete('student_timetables', match.id)} title="Delete Slot" style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', padding: 0 }}><Trash2 size={11} /></button>
                                                                            </div>
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

                            <h3 style={{ marginTop: '28px', marginBottom: '10px' }}>
                                {editingStudentTTId ? 'Update Student Schedule Slot' : 'Add Student Class Schedule Slot'}
                            </h3>
                            <form onSubmit={editingStudentTTId ? handleUpdateStudentTimetable : handleAddStudentTimetable} className="student-admission-form">
                                <div>
                                    <label>Class</label>
                                    <select
                                        value={editingStudentTTId ? editStudentTTForm.className : studentTimetableForm.className}
                                        onChange={e => {
                                            if (editingStudentTTId) {
                                                setEditStudentTTForm({ ...editStudentTTForm, className: e.target.value, sectionName: '' });
                                            } else {
                                                setStudentTimetableForm({ ...studentTimetableForm, className: e.target.value, sectionName: '' });
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classList.map(cls => (<option key={cls} value={cls}>{cls}</option>))}
                                    </select>
                                </div>

                                <div>
                                    <label>Section Name</label>
                                    <select
                                        value={editingStudentTTId ? editStudentTTForm.sectionName : studentTimetableForm.sectionName}
                                        onChange={e => {
                                            if (editingStudentTTId) {
                                                setEditStudentTTForm({ ...editStudentTTForm, sectionName: e.target.value });
                                            } else {
                                                setStudentTimetableForm({ ...studentTimetableForm, sectionName: e.target.value });
                                            }
                                        }}
                                        disabled={editingStudentTTId ? !editStudentTTForm.className : !studentTimetableForm.className}
                                    >
                                        <option value="">Select Section</option>
                                        {sectionsList
                                            .filter(sec => sec.className === (editingStudentTTId ? editStudentTTForm.className : studentTimetableForm.className))
                                            .map(sec => (<option key={sec.id} value={sec.name}>{sec.name}</option>))}
                                    </select>
                                </div>

                                <div>
                                    <label>Day of Week</label>
                                    <select
                                        value={editingStudentTTId ? editStudentTTForm.day : studentTimetableForm.day}
                                        onChange={e => {
                                            if (editingStudentTTId) {
                                                setEditStudentTTForm({ ...editStudentTTForm, day: e.target.value });
                                            } else {
                                                setStudentTimetableForm({ ...studentTimetableForm, day: e.target.value });
                                            }
                                        }}
                                        required
                                    >
                                        {weekDays.map(day => (<option key={day} value={day}>{day}</option>))}
                                    </select>
                                </div>

                                <div>
                                    <label>Time Slot</label>
                                    <select
                                        value={editingStudentTTId ? editStudentTTForm.timeSlot : studentTimetableForm.timeSlot}
                                        onChange={e => {
                                            if (editingStudentTTId) {
                                                setEditStudentTTForm({ ...editStudentTTForm, timeSlot: e.target.value });
                                            } else {
                                                setStudentTimetableForm({ ...studentTimetableForm, timeSlot: e.target.value });
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Select Time Slot</option>
                                        {timeSlots.map(slot => (<option key={slot} value={slot}>{slot}</option>))}
                                    </select>
                                </div>

                                <div>
                                    <label>Subject</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Mathematics"
                                        value={editingStudentTTId ? editStudentTTForm.subject : studentTimetableForm.subject}
                                        onChange={e => {
                                            if (editingStudentTTId) {
                                                setEditStudentTTForm({ ...editStudentTTForm, subject: e.target.value });
                                            } else {
                                                setStudentTimetableForm({ ...studentTimetableForm, subject: e.target.value });
                                            }
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Teacher Name</label>
                                    <select
                                        value={editingStudentTTId ? editStudentTTForm.teacherName : studentTimetableForm.teacherName}
                                        onChange={e => {
                                            if (editingStudentTTId) {
                                                setEditStudentTTForm({ ...editStudentTTForm, teacherName: e.target.value });
                                            } else {
                                                setStudentTimetableForm({ ...studentTimetableForm, teacherName: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="">Select Teacher</option>
                                        {staffList.map(stf => (<option key={stf.id} value={stf.name}>{stf.name} ({stf.department || 'Staff'})</option>))}
                                    </select>
                                </div>

                                <div>
                                    <label>Room / Lab No</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Room 102"
                                        value={editingStudentTTId ? editStudentTTForm.roomNo : studentTimetableForm.roomNo}
                                        onChange={e => {
                                            if (editingStudentTTId) {
                                                setEditStudentTTForm({ ...editStudentTTForm, roomNo: e.target.value });
                                            } else {
                                                setStudentTimetableForm({ ...studentTimetableForm, roomNo: e.target.value });
                                            }
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '8px', gridColumn: '1 / -1' }}>
                                    <button type="submit" className="add-notice-btn">
                                        {editingStudentTTId ? <><RefreshCw size={15} /> Update Schedule Slot</> : <><PlusCircle size={15} /> Add Student Schedule Slot</>}
                                    </button>
                                    {editingStudentTTId && (
                                        <button type="button" className="cancel-btn" onClick={() => { setEditingStudentTTId(null); setEditStudentTTForm(initialStudentTimetableForm); }}>
                                            <X size={14} /> Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* STAFF TIMETABLE TAB */}
                    {activeTab === 'staff_timetable' && (
                        <div className="applications-management-card">
                            <h3 style={{ marginBottom: '14px' }}>Staff Directory — Work Timetables</h3>

                            {(selectedStaffTT || selectedStaffDayTT) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
                                    <button onClick={() => { setSelectedStaffTT(null); setSelectedStaffDayTT(null); }} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', padding: 0, fontWeight: 600 }}>All Staff</button>
                                    {selectedStaffTT && (
                                        <>
                                            <span style={{ color: '#94a3b8' }}>/</span>
                                            <button onClick={() => setSelectedStaffDayTT(null)} style={{ background: 'none', border: 'none', color: selectedStaffDayTT ? '#059669' : '#0f172a', cursor: selectedStaffDayTT ? 'pointer' : 'default', padding: 0, fontWeight: 600 }}>{selectedStaffTT.name}</button>
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
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '-4px', marginBottom: '12px' }}>Select a staff member to view their schedule breakdown.</p>
                                    {staffList.length === 0 ? (
                                        <div className="empty-state">No staff members found in the directory.</div>
                                    ) : (
                                        <div className="class-cards-grid">
                                            {staffList.map(stf => {
                                                const totalSlots = staffTimetables.filter(tt => tt.staffId === stf.staffId || tt.staffName === stf.name).length;

                                                return (
                                                    <div key={stf.id} className="class-card" onClick={() => setSelectedStaffTT(stf)}>
                                                        <div className="class-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}><User size={20} /></div>
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
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>Days Schedule for {selectedStaffTT.name}</h4>
                                    <div className="class-cards-grid">
                                        {weekDays.map(day => {
                                            const daySlots = staffTimetables.filter(
                                                tt => (tt.staffId === selectedStaffTT.staffId || tt.staffName === selectedStaffTT.name) && tt.day === day
                                            ).length;

                                            return (
                                                <div key={day} className="class-card" onClick={() => setSelectedStaffDayTT(day)}>
                                                    <div className="class-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}><Calendar size={18} /></div>
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
                                    <h4 style={{ marginBottom: '12px', color: '#0f172a' }}>Schedule: {selectedStaffTT.name} — {selectedStaffDayTT}</h4>

                                    {staffTimetables.filter(
                                        tt => (tt.staffId === selectedStaffTT.staffId || tt.staffName === selectedStaffTT.name) && tt.day === selectedStaffDayTT
                                    ).length === 0 ? (
                                        <div className="empty-state">No schedule slots assigned for {selectedStaffTT.name} on {selectedStaffDayTT}.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {staffTimetables
                                                .filter(tt => (tt.staffId === selectedStaffTT.staffId || tt.staffName === selectedStaffTT.name) && tt.day === selectedStaffDayTT)
                                                .map(item => (
                                                    <div key={item.id} style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: '14px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{item.timeSlot}</span>
                                                            <div>
                                                                <strong style={{ color: '#0f172a', fontSize: '0.82rem' }}>{item.subject}</strong>
                                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Class: {item.className || 'General'} • Room: {item.roomNo || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button onClick={() => { setEditingStaffTTId(item.id); setEditStaffTTForm({ ...item }); }} title="Edit Slot" style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                                            <button onClick={() => handleDelete('staff_timetables', item.id)} title="Delete Slot" style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <h3 style={{ marginTop: '28px', marginBottom: '10px' }}>
                                {editingStaffTTId ? 'Update Staff Work Schedule Slot' : 'Add Staff Work Schedule Slot'}
                            </h3>
                            <form onSubmit={editingStaffTTId ? handleUpdateStaffTimetable : handleAddStaffTimetable} className="student-admission-form">
                                <div>
                                    <label>Staff Member</label>
                                    <select
                                        value={editingStaffTTId ? editStaffTTForm.staffId : staffTimetableForm.staffId}
                                        onChange={e => {
                                            const selected = staffList.find(s => s.staffId === e.target.value);
                                            if (editingStaffTTId) {
                                                setEditStaffTTForm({ ...editStaffTTForm, staffId: e.target.value, staffName: selected ? selected.name : '' });
                                            } else {
                                                setStaffTimetableForm({ ...staffTimetableForm, staffId: e.target.value, staffName: selected ? selected.name : '' });
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Select Staff Member</option>
                                        {staffList.map(stf => (<option key={stf.id} value={stf.staffId}>{stf.name} ({stf.staffId})</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label>Day of Week</label>
                                    <select
                                        value={editingStaffTTId ? editStaffTTForm.day : staffTimetableForm.day}
                                        onChange={e => {
                                            if (editingStaffTTId) {
                                                setEditStaffTTForm({ ...editStaffTTForm, day: e.target.value });
                                            } else {
                                                setStaffTimetableForm({ ...staffTimetableForm, day: e.target.value });
                                            }
                                        }}
                                        required
                                    >
                                        {weekDays.map(day => (<option key={day} value={day}>{day}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label>Time Slot</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 10:00 - 10:45 AM"
                                        value={editingStaffTTId ? editStaffTTForm.timeSlot : staffTimetableForm.timeSlot}
                                        onChange={e => {
                                            if (editingStaffTTId) {
                                                setEditStaffTTForm({ ...editStaffTTForm, timeSlot: e.target.value });
                                            } else {
                                                setStaffTimetableForm({ ...staffTimetableForm, timeSlot: e.target.value });
                                            }
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Subject / Activity</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Physics Lab"
                                        value={editingStaffTTId ? editStaffTTForm.subject : staffTimetableForm.subject}
                                        onChange={e => {
                                            if (editingStaffTTId) {
                                                setEditStaffTTForm({ ...editStaffTTForm, subject: e.target.value });
                                            } else {
                                                setStaffTimetableForm({ ...staffTimetableForm, subject: e.target.value });
                                            }
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Class Assigned</label>

                                    <select
                                        value={
                                            editingStaffTTId
                                                ? editStaffTTForm.className
                                                : staffTimetableForm.className
                                        }
                                        onChange={(e) => {

                                            const selectedValue = e.target.value;

                                            if (editingStaffTTId) {

                                                setEditStaffTTForm({
                                                    ...editStaffTTForm,
                                                    className: selectedValue,

                                                    // Reset section when class changes
                                                    sectionName: ''
                                                });

                                            } else {

                                                setStaffTimetableForm({
                                                    ...staffTimetableForm,
                                                    className: selectedValue,

                                                    // Reset section when class changes
                                                    sectionName: ''
                                                });
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">
                                            Select Class
                                        </option>

                                        {classList.map((className) => (
                                            <option
                                                key={className}
                                                value={className}
                                            >
                                                {className}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Section Assigned</label>

                                    <select
                                        value={
                                            editingStaffTTId
                                                ? editStaffTTForm.sectionName
                                                : staffTimetableForm.sectionName
                                        }
                                        onChange={(e) => {

                                            const selectedValue = e.target.value;

                                            if (editingStaffTTId) {

                                                setEditStaffTTForm({
                                                    ...editStaffTTForm,
                                                    sectionName: selectedValue
                                                });

                                            } else {

                                                setStaffTimetableForm({
                                                    ...staffTimetableForm,
                                                    sectionName: selectedValue
                                                });
                                            }
                                        }}
                                        required
                                        disabled={
                                            !(
                                                editingStaffTTId
                                                    ? editStaffTTForm.className
                                                    : staffTimetableForm.className
                                            )
                                        }
                                    >
                                        <option value="">
                                            Select Section
                                        </option>

                                        {getSectionsForClass(
                                            editingStaffTTId
                                                ? editStaffTTForm.className
                                                : staffTimetableForm.className
                                        ).map((section) => {

                                            const sectionValue =
                                                section.sectionName ||
                                                section.section ||
                                                section.name ||
                                                section.label ||
                                                '';

                                            return (
                                                <option
                                                    key={section.id}
                                                    value={sectionValue}
                                                >
                                                    {sectionValue}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label>Room No</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Room 204"
                                        value={editingStaffTTId ? editStaffTTForm.roomNo : staffTimetableForm.roomNo}
                                        onChange={e => {
                                            if (editingStaffTTId) {
                                                setEditStaffTTForm({ ...editStaffTTForm, roomNo: e.target.value });
                                            } else {
                                                setStaffTimetableForm({ ...staffTimetableForm, roomNo: e.target.value });
                                            }
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', gridColumn: '1 / -1' }}>
                                    <button type="submit" className="add-notice-btn">
                                        {editingStaffTTId ? <><RefreshCw size={15} /> Update Work Schedule Slot</> : <><PlusCircle size={15} /> Add Staff Work Schedule Slot</>}
                                    </button>
                                    {editingStaffTTId && (
                                        <button type="button" className="cancel-btn" onClick={() => { setEditingStaffTTId(null); setEditStaffTTForm(initialStaffTimetableForm); }}>
                                            <X size={14} /> Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}