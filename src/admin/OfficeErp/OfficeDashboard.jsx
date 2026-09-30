import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../service/firebase';
import { signOut } from 'firebase/auth';
import logo from "../../assets/logo.png";
import {
    collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where
} from 'firebase/firestore';
import {
    Users, DollarSign, Calendar, ClipboardList, UserPlus, Download,
    Ticket, CheckCircle, XCircle, LogOut, PlusCircle, Check, X, Menu, LayoutGrid, ChevronDown, ChevronUp, UserCheck, ArrowLeft, GraduationCap, CheckSquare, CalendarDays, Trash2, Bell, Search, Sparkles, TrendingUp, Activity, Clock, Plus, MoreHorizontal
} from 'lucide-react';
import './OfficeDashboard.css';

export default function OfficeDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [hallTicketSearch, setHallTicketSearch] = useState("");
    const [hallTicketExam, setHallTicketExam] = useState('1st Mid-Term Exam');
    const [hallTicketYear, setHallTicketYear] = useState(String(new Date().getFullYear()));
    const [hallTicketClass, setHallTicketClass] = useState('');
    const [hallTicketSection, setHallTicketSection] = useState('');
    const [hallTicketSelectedStudents, setHallTicketSelectedStudents] = useState([]);
    const [hallTicketPublications, setHallTicketPublications] = useState([]);

    // Exam Timetable States
    const [timetableClass, setTimetableClass] = useState('');
    const [timetableExamName, setTimetableExamName] = useState('1st Mid-Term Exam');
    const [timetableSubjectCode, setTimetableSubjectCode] = useState('');
    const [timetableSubject, setTimetableSubject] = useState('');
    const [timetableDate, setTimetableDate] = useState('');
    const [timetableTime, setTimetableTime] = useState('09:30 AM - 12:30 PM');
    const [examTimetables, setExamTimetables] = useState([]);

    const [selectedTimetableClass, setSelectedTimetableClass] = useState('all');

    // Timetable: which older (non-latest) exams are expanded, keyed by `${class}__${examName}`
    const [openTimetableExams, setOpenTimetableExams] = useState({});

    // Seating arrangement (class-by-class) view state
    const [seatingFilterClass, setSeatingFilterClass] = useState('all');
    const [openSeatingClasses, setOpenSeatingClasses] = useState({});


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
    const [feeViewMode, setFeeViewMode] = useState('classes');
    const [selectedFeeClass, setSelectedFeeClass] = useState(null);
    const [selectedFeeSection, setSelectedFeeSection] = useState(null);
    const [feeLedgerOpen, setFeeLedgerOpen] = useState(false);
    const [feeStatusFilter, setFeeStatusFilter] = useState('all');
    const [expandedFeeStudent, setExpandedFeeStudent] = useState(null);

    // Bulk "set dues for a whole class" workflow
    const [assignClass, setAssignClass] = useState('');
    const [assignSection, setAssignSection] = useState('all');
    const [assignSearch, setAssignSearch] = useState('');
    const [assignSelectedIds, setAssignSelectedIds] = useState([]);
    const [assignForm, setAssignForm] = useState({ term: 'Term 1', totalFee: '' });
    const [isAssigningFees, setIsAssigningFees] = useState(false);

    // Form States
    const [enquiryForm, setEnquiryForm] = useState({ studentName: '', parentName: '', phone: '', grade: '10th Std', notes: '' });
    const [feeForm, setFeeForm] = useState({ admissionNo: '', studentName: '', class: '', totalFee: '', paidAmount: '', term: 'Term 1' });
    const [taskForm, setTaskForm] = useState({ title: '', assignedTo: '', priority: 'Normal', deadline: '' });

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

    const examTypes = [
        '1st Mid-Term Exam',
        'Quarterly Exam',
        '2nd Mid-Term Exam',
        'Half-yearly Exam',
        '3rd Mid-Term Exam',
        'Annual Exam'
    ];

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
        const unsubHallTicketPublications = onSnapshot(collection(db, 'hall_ticket_publications'), snap =>
            setHallTicketPublications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubStaffHalls = onSnapshot(collection(db, 'staff_exam_halls'), snap =>
            setStaffExamHalls(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const unsubTimetables = onSnapshot(collection(db, 'exam_timetables'), snap =>
            setExamTimetables(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
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
            unsubHallTicketPublications();
            unsubTimetables();
        };
    }, []);

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

    const officeHallTicketStudents = studentsList.filter(s => {
        const q = hallTicketSearch.trim().toLowerCase();
        if (!q) return true;
        return [s.name, s.admissionNo, s.rollNo].filter(Boolean).some(v => String(v).toLowerCase().includes(q));
    });
    const hallTicketYears = Array.from({ length: 16 }, (_, index) => String(2025 + index));

    const hallTicketExamOptions = examTypes;

    const hallTicketClasses = Array.from(new Set(
        studentsList.map(s => s.className || s.grade).filter(Boolean)
    ));

    const hallTicketSections = Array.from(new Set(
        studentsList
            .filter(s => !hallTicketClass || (s.className || s.grade) === hallTicketClass)
            .map(s => s.sectionName || s.section)
            .filter(Boolean)
    ));

    const getStudentFeeStatus = (student) => {
        const admission = String(student.admissionNo || student.rollNo || '').trim().toLowerCase();
        const name = String(student.name || '').trim().toLowerCase();

        const records = feesList.filter(f => {
            const feeAdmission = String(f.admissionNo || f.rollNo || '').trim().toLowerCase();
            const feeName = String(f.studentName || f.name || '').trim().toLowerCase();
            return (admission && feeAdmission && admission === feeAdmission) ||
                (name && feeName && name === feeName);
        });

        const paid = records.length > 0 && records.every(f =>
            String(f.status || '').trim().toLowerCase() === 'paid' ||
            Number(f.balance ?? 0) <= 0
        );

        return { paid, records };
    };

    const hallTicketAllocationForStudent = (student) => examHalls.find(h =>
        (h.studentIds || []).includes(student.id) ||
        (h.studentList || []).some(x =>
            x.id === student.id ||
            (x.admissionNo && String(x.admissionNo) === String(student.admissionNo || student.rollNo))
        )
    );

    const hallTicketListStudents = studentsList.filter(student => {
        const q = hallTicketSearch.trim().toLowerCase();
        const cls = student.className || student.grade;
        const sec = student.sectionName || student.section;

        const matchesSearch = !q || [student.name, student.admissionNo, student.rollNo]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(q));

        const matchesClass = !hallTicketClass || cls === hallTicketClass;
        const matchesSection = !hallTicketSection || sec === hallTicketSection;

        return matchesSearch && matchesClass && matchesSection;
    });

    const paidHallTicketStudents = hallTicketListStudents.filter(s => getStudentFeeStatus(s).paid);
    const unpaidHallTicketStudents = hallTicketListStudents.filter(s => !getStudentFeeStatus(s).paid);

    const toggleHallTicketStudent = (studentId) => {
        setHallTicketSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const toggleAllPaidHallTicketStudents = () => {
        const paidIds = paidHallTicketStudents.map(s => s.id);
        const allSelected = paidIds.length > 0 && paidIds.every(id => hallTicketSelectedStudents.includes(id));

        setHallTicketSelectedStudents(prev =>
            allSelected
                ? prev.filter(id => !paidIds.includes(id))
                : Array.from(new Set([...prev, ...paidIds]))
        );
    };

    const isHallTicketPublished = (student) => {
        return hallTicketPublications.some(p =>
            p.published === true &&
            p.exam === hallTicketExam &&
            String(p.year) === String(hallTicketYear) &&
            (
                p.studentId === student.id ||
                (p.admissionNo && String(p.admissionNo) === String(student.admissionNo || student.rollNo))
            )
        );
    };

    const publishHallTicket = async (student) => {
        const fee = getStudentFeeStatus(student);
        if (!fee.paid) {
            alert(`${student.name || 'This student'} has pending fees. Hall Ticket cannot be published.`);
            return;
        }

        const allocation = hallTicketAllocationForStudent(student);
        if (!allocation) {
            alert('This student has no exam hall allocation. Allocate the exam hall first.');
            return;
        }

        if (isHallTicketPublished(student)) {
            alert('Hall Ticket is already published for this student.');
            return;
        }

        try {
            const newPublicationRef = await addDoc(collection(db, 'hall_ticket_publications'), {
                studentId: student.id,
                studentName: student.name || 'Student',
                admissionNo: student.admissionNo || student.rollNo || '',
                exam: hallTicketExam,
                year: Number(hallTicketYear),
                allocationId: allocation.id,
                hallNo: allocation.hallNo || '',
                seatNo: (allocation.studentList || []).find(x => x.id === student.id)?.seatNo || '',
                published: true,
                publishedAt: serverTimestamp()
            });

            // Delete this student's older published hall tickets - only the latest is kept
            const oldPublications = hallTicketPublications.filter(p =>
                p.id !== newPublicationRef.id &&
                (
                    p.studentId === student.id ||
                    (p.admissionNo && String(p.admissionNo) === String(student.admissionNo || student.rollNo))
                )
            );
            await Promise.all(
                oldPublications.map(p => deleteDoc(doc(db, 'hall_ticket_publications', p.id)))
            );

            alert(`Hall Ticket published for ${student.name || 'student'}.`);
        } catch (error) {
            console.error('Hall Ticket publication failed:', error);
            alert('Failed to publish Hall Ticket. Please try again.');
        }
    };

    const publishSelectedHallTickets = async () => {
        const selected = paidHallTicketStudents.filter(s => hallTicketSelectedStudents.includes(s.id));
        if (selected.length === 0) {
            alert('Please select at least one paid student.');
            return;
        }

        for (const student of selected) {
            if (!isHallTicketPublished(student)) {
                await publishHallTicket(student);
            }
        }

        setHallTicketSelectedStudents([]);
    };

    const handleAddTimetableSubject = async (e) => {
        e.preventDefault();
        if (!timetableClass || !timetableExamName || !timetableSubject.trim() || !timetableDate) {
            alert('Please select class, exam name, enter subject name, and select exam date.');
            return;
        }

        try {
            await addDoc(collection(db, 'exam_timetables'), {
                className: timetableClass,
                examName: timetableExamName,
                subjectCode: timetableSubjectCode.trim(),
                subject: timetableSubject.trim(),
                examDate: timetableDate,
                examTime: timetableTime.trim() || '09:30 AM - 12:30 PM',
                createdAt: serverTimestamp()
            });

            setTimetableSubjectCode('');
            setTimetableSubject('');
            setTimetableDate('');
            alert('Exam subject schedule added successfully!');
        } catch (error) {
            console.error('Error adding timetable schedule:', error);
            alert('Failed to add timetable schedule.');
        }
    };

    const printStudentHallTicket = (student) => {
        const allocation = examHalls.find(h => (h.studentIds || []).includes(student.id) || (h.studentList || []).some(x => x.id === student.id));
        if (!allocation) {
            alert('This student has no exam hall allocation yet.');
            return;
        }
        const seat = (allocation.studentList || []).find(x => x.id === student.id)?.seatNo || '—';
        const stClass = student.className || student.grade || allocation.targetClass || '';
        const currentExam = allocation.examName || hallTicketExam || '1st Mid-Term Exam';

        const matchedTimetable = examTimetables.filter(t =>
            t.className === stClass && t.examName === currentExam
        );

        let timetableHtml = matchedTimetable.length > 0
            ? matchedTimetable.map(t => `<tr><td>${t.examDate}</td><td>${t.subject}</td><td>${t.examTime || '09:30 AM - 12:30 PM'}</td></tr>`).join('')
            : `<tr><td colSpan="3" style="text-align:center;">No Exam Schedule Available</td></tr>`;

        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`<html><head><title>Hall Ticket</title><style>body{font-family:Arial;padding:30px}.ticket{border:3px solid #111;padding:25px;max-width:750px;margin:auto}h1{text-align:center;margin-bottom:5px}h3{text-align:center;margin-top:0;color:#555}table{width:100%;border-collapse:collapse;margin-top:15px}td,th{padding:9px;border:1px solid #ccc;text-align:left}th{background:#f2f2f2}.info-table td{border:none;padding:6px 0}</style></head><body><div class="ticket"><h1>EXAMINATION HALL TICKET</h1><h3>${currentExam}</h3><table class="info-table"><tr><td><strong>Student Name:</strong> ${student.name || 'Student'}</td><td><strong>Admission No:</strong> ${student.admissionNo || student.rollNo || '—'}</td></tr><tr><td><strong>Class / Sec:</strong> ${stClass} / ${student.sectionName || student.section || ''}</td><td><strong>Hall / Seat:</strong> ${allocation.hallNo || '—'} / Seat ${seat}</td></tr></table><h4 style="margin-top:20px;margin-bottom:8px">EXAM TIMETABLE</h4><table><thead><tr><th>Date</th><th>Subject</th><th>Timing</th></tr></thead><tbody>${timetableHtml}</tbody></table><p style="margin-top:30px;text-align:right"><strong>Authorized Signatory</strong></p></div><script>window.print()</script></body></html>`);
        win.document.close();
    };

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

    const dashboardFeeTotal = feesList.reduce((sum, item) => sum + Number(item.totalFee || 0), 0);
    const dashboardFeePaid = feesList.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
    const dashboardFeeBalance = feesList.reduce((sum, item) => sum + Number(item.balance || 0), 0);
    const dashboardPendingLeaves = leaveRequests.filter(item => String(item.status || 'Pending').toLowerCase() === 'pending').length;
    const dashboardPendingTasks = officeTasks.filter(item => !['completed', 'done'].includes(String(item.status || '').toLowerCase())).length;
    const dashboardPublishedTickets = hallTicketPublications.filter(item => item.published === true).length;
    const dashboardPaidStudents = studentsList.filter(student => getStudentFeeStatus(student).paid).length;


    // ---------------- Fee collection helpers ----------------
    const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
    const normFee = (value) => String(value ?? '').trim().toLowerCase();
    const feeRecordBalance = (record) => {
        const total = Number(record.totalFee || 0);
        const paid = Number(record.paidAmount || 0);
        return Number(record.balance ?? Math.max(total - paid, 0));
    };
    const isFeeRecordPaid = (record) => normFee(record.status) === 'paid' || feeRecordBalance(record) <= 0;

    // Class -> Section -> Student tree with each student's fee records attached.
    // Every fee record is attached to exactly one student (admission no. first,
    // then name); records that match nobody are kept under their saved class label.
    const buildFeeTree = () => {
        const admMap = new Map();
        const nameMap = new Map();
        studentsList.forEach((st) => {
            const a = normFee(st.admissionNo || st.rollNo);
            const n = normFee(st.name);
            if (a && !admMap.has(a)) admMap.set(a, st);
            if (n && !nameMap.has(n)) nameMap.set(n, st);
        });

        const tree = {};
        const bucketFor = (cls, sec) => {
            tree[cls] = tree[cls] || {};
            tree[cls][sec] = tree[cls][sec] || {};
            return tree[cls][sec];
        };

        studentsList.forEach((st) => {
            const cls = st.className || st.grade;
            if (!cls) return;
            const sec = st.sectionName || st.section || 'General';
            bucketFor(cls, sec)[st.id] = {
                key: st.id,
                name: st.name || 'Unnamed',
                admissionNo: st.admissionNo || st.rollNo || '',
                phone: st.phone || st.parentPhone || '',
                records: []
            };
        });

        feesList.forEach((item) => {
            const a = normFee(item.admissionNo || item.rollNo);
            const n = normFee(item.studentName || item.name);
            const st = (a && admMap.get(a)) || (n && nameMap.get(n)) || null;
            if (st) {
                const cls = st.className || st.grade;
                const sec = st.sectionName || st.section || 'General';
                const entry = cls && tree[cls] && tree[cls][sec] && tree[cls][sec][st.id];
                if (entry) { entry.records.push(item); return; }
            }
            const label = String(item.class || '').trim();
            const idx = label.lastIndexOf(' - ');
            const cls = (idx > 0 ? label.slice(0, idx) : label) || 'Unassigned';
            const sec = (idx > 0 ? label.slice(idx + 3) : '') || 'General';
            const key = `orphan-${a || n || item.id}`;
            const bucket = bucketFor(cls, sec);
            if (!bucket[key]) {
                bucket[key] = {
                    key,
                    name: item.studentName || item.name || 'Unknown student',
                    admissionNo: item.admissionNo || '',
                    phone: '',
                    records: []
                };
            }
            bucket[key].records.push(item);
        });

        const withStats = (entry) => {
            const billed = entry.records.reduce((s, r) => s + Number(r.totalFee || 0), 0);
            const collected = entry.records.reduce((s, r) => s + Number(r.paidAmount || 0), 0);
            const balance = entry.records.reduce((s, r) => s + feeRecordBalance(r), 0);
            const status = entry.records.length === 0
                ? 'none'
                : (entry.records.every(isFeeRecordPaid) ? 'paid' : 'pending');
            return { ...entry, billed, collected, balance, status };
        };

        const summarize = (entries) => {
            const acc = { students: entries.length, billed: 0, collected: 0, balance: 0, pending: 0, paid: 0, unset: 0 };
            entries.forEach((e) => {
                acc.billed += e.billed;
                acc.collected += e.collected;
                acc.balance += e.balance;
                if (e.status === 'pending') acc.pending += 1;
                else if (e.status === 'paid') acc.paid += 1;
                else acc.unset += 1;
            });
            acc.percent = acc.billed ? Math.min(100, Math.round((acc.collected / acc.billed) * 100)) : 0;
            return acc;
        };

        return Object.keys(tree)
            .sort((x, y) => x.localeCompare(y, undefined, { numeric: true }))
            .map((clsName) => {
                const sections = Object.keys(tree[clsName])
                    .sort((x, y) => x.localeCompare(y, undefined, { numeric: true }))
                    .map((secName) => {
                        const entries = Object.values(tree[clsName][secName])
                            .map(withStats)
                            .sort((x, y) => String(x.name).localeCompare(String(y.name)));
                        return { name: secName, entries, stats: summarize(entries) };
                    });
                const allEntries = sections.flatMap((s) => s.entries);
                return { name: clsName, sections, stats: summarize(allEntries) };
            });
    };

    const feeClassTree = activeTab === 'fees' ? buildFeeTree() : [];
    const feeClassNode = feeClassTree.find((c) => c.name === selectedFeeClass) || null;
    const feeSectionNode = feeClassNode ? feeClassNode.sections.find((s) => s.name === selectedFeeSection) || null : null;

    // Bulk dues assignment (whole class / section)
    const assignSectionOptions = Array.from(new Set(
        studentsList
            .filter((s) => (s.className || s.grade) === assignClass)
            .map((s) => s.sectionName || s.section || 'General')
    )).sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));

    const assignClassStudents = studentsList
        .filter((s) => (s.className || s.grade) === assignClass &&
            (assignSection === 'all' || (s.sectionName || s.section || 'General') === assignSection))
        .sort((x, y) => {
            const sx = String(x.sectionName || x.section || 'General');
            const sy = String(y.sectionName || y.section || 'General');
            return sx.localeCompare(sy) || String(x.name || '').localeCompare(String(y.name || ''));
        });

    const assignVisibleStudents = assignClassStudents.filter((s) => {
        const q = assignSearch.trim().toLowerCase();
        if (!q) return true;
        return [s.name, s.admissionNo, s.rollNo].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });

    const assignAllVisibleSelected = assignVisibleStudents.length > 0 &&
        assignVisibleStudents.every((s) => assignSelectedIds.includes(s.id));
    const assignSelectedCount = assignClassStudents.filter((s) => assignSelectedIds.includes(s.id)).length;
    const assignAmount = Number(assignForm.totalFee);
    const assignAmountValid = Number.isFinite(assignAmount) && assignAmount > 0;

    const toggleAssignStudent = (id) => {
        setAssignSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const toggleAssignAllVisible = () => {
        const ids = assignVisibleStudents.map((s) => s.id);
        setAssignSelectedIds((prev) => assignAllVisibleSelected
            ? prev.filter((id) => !ids.includes(id))
            : Array.from(new Set([...prev, ...ids])));
    };

    const handleBulkAssignFees = async () => {
        const targets = assignClassStudents.filter((s) => assignSelectedIds.includes(s.id));
        if (!assignClass || targets.length === 0 || !assignAmountValid) return;

        const alreadyHaveTerm = targets.filter((s) =>
            getStudentFeeStatus(s).records.some((r) => String(r.term) === assignForm.term)
        ).length;
        if (alreadyHaveTerm > 0 && !window.confirm(
            `${alreadyHaveTerm} of the selected students already have ${assignForm.term} dues.\nAdd another ${assignForm.term} entry for them too?`
        )) return;

        setIsAssigningFees(true);
        try {
            await Promise.all(targets.map((st) => {
                const sec = st.sectionName || st.section || 'General';
                return addDoc(collection(db, 'fee_collections'), {
                    admissionNo: st.admissionNo || st.rollNo || '',
                    studentName: st.name || '',
                    class: `${assignClass} - ${sec}`,
                    className: assignClass,
                    sectionName: sec,
                    term: assignForm.term,
                    totalFee: assignAmount,
                    paidAmount: 0,
                    balance: assignAmount,
                    status: 'Pending',
                    createdAt: serverTimestamp()
                });
            }));
            alert(`Fee dues of ${formatINR(assignAmount)} assigned to ${targets.length} student${targets.length === 1 ? '' : 's'}. Student dashboards will show the alert.`);
            setAssignSelectedIds([]);
            setAssignForm((prev) => ({ ...prev, totalFee: '' }));
        } catch (error) {
            console.error('Error assigning class fees:', error);
            alert('Could not assign the fees. Please try again.');
        } finally {
            setIsAssigningFees(false);
        }
    };

    const handleMarkFeePaid = async (item) => {
        try {
            await updateDoc(doc(db, 'fee_collections', item.id), {
                paidAmount: Number(item.totalFee || 0),
                balance: 0,
                status: 'Paid'
            });
            alert('Marked as Paid! Receipt generated for student.');
        } catch (error) {
            console.error('Error marking fee paid:', error);
            alert('Could not update this record.');
        }
    };

    const openFeeClass = (clsName) => {
        setSelectedFeeClass(clsName);
        setSelectedFeeSection(null);
        setExpandedFeeStudent(null);
        setFeeStatusFilter('all');
        setFeeViewMode('sections');
    };

    const openFeeSection = (secName) => {
        setSelectedFeeSection(secName);
        setExpandedFeeStudent(null);
        setFeeStatusFilter('all');
        setFeeViewMode('students-fee');
    };

    const goFeeAllClasses = () => {
        setFeeViewMode('classes');
        setSelectedFeeClass(null);
        setSelectedFeeSection(null);
        setExpandedFeeStudent(null);
    };

    // Group a class's timetable rows by exam; newest published exam comes first
    const getExamGroups = (classTimetables) => {
        const map = {};
        classTimetables.forEach(t => {
            const key = t.examName || 'Examination';
            (map[key] = map[key] || []).push(t);
        });
        return Object.entries(map)
            .map(([examName, items]) => ({
                examName,
                items,
                latest: Math.max(...items.map(i => i.createdAt?.seconds ?? Date.now() / 1000))
            }))
            .sort((a, b) => (b.latest - a.latest) || (examTypes.indexOf(b.examName) - examTypes.indexOf(a.examName)));
    };

    const renderTimetableTable = (items) => (
        <div className="table-responsive">
            <table className="custom-table classwise-exam-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Exam</th>
                        <th>Subject Code</th>
                        <th>Subject</th>
                        <th>Timing</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item.id}>
                            <td><span className="exam-number">{index + 1}</span></td>
                            <td>
                                <strong className="exam-date">
                                    {item.examDate ? new Date(item.examDate).toLocaleDateString('en-GB') : '—'}
                                </strong>
                            </td>
                            <td><span className="exam-name-badge">{item.examName || 'Examination'}</span></td>
                            <td><code>{item.subjectCode || '—'}</code></td>
                            <td><strong>{item.subject}</strong></td>
                            <td><span className="exam-time">{item.examTime || '09:30 AM - 12:30 PM'}</span></td>
                            <td>
                                <button
                                    type="button"
                                    className="delete-task-btn"
                                    onClick={() => handleDelete('exam_timetables', item.id)}
                                    title="Delete Timetable"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Seating arrangement grouped class by class
    const seatingClasses = Array.from(new Set(examHalls.map(h => h.targetClass).filter(Boolean)));
    const getHallSeatList = (hall) => {
        const list = Array.isArray(hall.studentList) && hall.studentList.length
            ? hall.studentList
            : (hall.studentIds || []).map((id, i) => {
                const st = studentsList.find(x => x.id === id) || {};
                return {
                    id,
                    name: st.name || 'Student',
                    admissionNo: st.admissionNo || '',
                    sectionName: st.sectionName || st.section || hall.targetSection || '',
                    seatNo: i + 1
                };
            });
        return [...list].sort((a, b) => Number(a.seatNo || 0) - Number(b.seatNo || 0));
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
                    className="mobile-overlays"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close navigation"
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`dashboard-sidebars ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-icon"> <img src={logo} alt="" id='logogs' /> </div>
                    <span className="brand-titles">Front-Office Desk</span>
                </div>

                <div className="sidebar-user">
                    <div className="user-avatar" style={{ background: '#6d5dfc' }}>O</div>
                    <div className="user-info">
                        <span className="user-name">Office Executive</span>
                        <span className="user-role">Front-Desk Admin</span>
                    </div>
                </div>

                <div className="sidebar-command-card">
                    <div className="command-icon"><Sparkles size={15} /></div>
                    <div><b>Today at a glance</b><span>Everything looks synced</span></div>
                    <span className="command-status"><i /></span>
                </div>

                <nav className="sidebar-nav">
                    <button className={`nav-links ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}>
                        <div className="nav-links-content"><LayoutGrid size={18} /><span>Dashboard Overview</span></div>
                    </button>
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
                                <button className={`nav-links ${activeTab === 'exam-timetable' ? 'active' : ''}`} onClick={() => { setActiveTab('exam-timetable'); setIsMobileMenuOpen(false); }}>
                                    <CalendarDays size={18} /><span id='hall'>Exam Timetable</span>
                                </button>
                                <button className={`nav-links ${activeTab === 'hall-ticket-allocation' ? 'active' : ''}`} onClick={() => { setActiveTab('hall-ticket-allocation'); setIsMobileMenuOpen(false); }}>
                                    <Ticket size={18} /><span id='hall'>Hall Ticket Allocation</span>
                                </button>
                                <button className={`nav-links ${activeTab === 'hall-tickets' ? 'active' : ''}`} onClick={() => { setActiveTab('hall-tickets'); setIsMobileMenuOpen(false); }}>
                                    <Download size={18} /><span id='hall'>Hall Tickets</span>
                                </button>
                                <button className={`nav-links ${activeTab === 'exam-halls' ? 'active' : ''}`} onClick={() => { setActiveTab('exam-halls'); setIsMobileMenuOpen(false); }}>
                                    <div className="nav-links-content"><Users size={16} /><span>Allocate</span></div>
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
                    <div className="topbar-title-wrap">
                        <div className="topbar-breadcrumb"><span>Workspace</span><b>/</b><strong>{activeTab === 'overview' ? 'Overview' : activeTab.replaceAll('-', ' ')}</strong></div>
                        <div className="academic-badge">Academic Year 2026 - 2027</div>
                    </div>
                    <div className="topbar-actions">
                        <button className="topbar-search" type="button" onClick={() => document.querySelector('.dashboard-content')?.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <Search size={15} /><span>Search workspace</span><kbd>⌘ K</kbd>
                        </button>
                        <button className="topbar-icon-btn notification-trigger" type="button" title="Notifications">
                            <Bell size={17} /><i />
                        </button>
                        <div className="topbar-profile"><span className="topbar-avatar">O</span><div><b>Office Executive</b><small>Administrator</small></div><ChevronDown size={14} /></div>
                    </div>
                </header>

                <div className="dashboard-content">
                    {activeTab === 'overview' && (
                        <section className="office-overview">
                            <div className="overview-hero">
                                <div className="overview-hero-copy">
                                    <span className="overview-kicker">FRONT-OFFICE CONTROL CENTER</span>
                                    <h1>Good evening, Office Executive.</h1>
                                    <p>One compact workspace for enquiries, fee operations, examinations, staff approvals and daily tasks.</p>
                                    <div className="overview-hero-meta">
                                        <span><CheckCircle size={14} /> Live Firestore sync</span>
                                        <span>Academic Year 2026–2027</span>
                                    </div>
                                </div>
                                <div className="overview-hero-orb"><LayoutGrid size={34} /></div>
                            </div>

                            <div className="overview-stat-grid">
                                <button className="overview-stat stat-green" onClick={() => setActiveTab('enquiries')}>
                                    <span className="overview-stat-icon"><UserPlus size={17} /></span>
                                    <span className="overview-stat-copy"><small>ENQUIRIES</small><strong>{enquiries.length}</strong><em>Active records</em></span>
                                    <ArrowLeft className="overview-stat-arrow" size={15} />
                                </button>
                                <button className="overview-stat stat-blue" onClick={() => setActiveTab('fees')}>
                                    <span className="overview-stat-icon"><DollarSign size={17} /></span>
                                    <span className="overview-stat-copy"><small>FEE BALANCE</small><strong>₹{dashboardFeeBalance.toLocaleString('en-IN')}</strong><em>₹{dashboardFeePaid.toLocaleString('en-IN')} collected</em></span>
                                    <ArrowLeft className="overview-stat-arrow" size={15} />
                                </button>
                                <button className="overview-stat stat-purple" onClick={() => setActiveTab('exam-halls')}>
                                    <span className="overview-stat-icon"><Users size={17} /></span>
                                    <span className="overview-stat-copy"><small>EXAM HALLS</small><strong>{examHalls.length}</strong><em>{examHalls.reduce((n, h) => n + Number(h.studentCount || h.studentIds?.length || 0), 0)} students allocated</em></span>
                                    <ArrowLeft className="overview-stat-arrow" size={15} />
                                </button>
                                <button className="overview-stat stat-amber" onClick={() => setActiveTab('hall-ticket-allocation')}>
                                    <span className="overview-stat-icon"><Ticket size={17} /></span>
                                    <span className="overview-stat-copy"><small>HALL TICKETS</small><strong>{dashboardPublishedTickets}</strong><em>Published tickets</em></span>
                                    <ArrowLeft className="overview-stat-arrow" size={15} />
                                </button>
                                <button className="overview-stat stat-rose" onClick={() => setActiveTab('leaves')}>
                                    <span className="overview-stat-icon"><Calendar size={17} /></span>
                                    <span className="overview-stat-copy"><small>LEAVE REQUESTS</small><strong>{dashboardPendingLeaves}</strong><em>Awaiting approval</em></span>
                                    <ArrowLeft className="overview-stat-arrow" size={15} />
                                </button>
                                <button className="overview-stat stat-slate" onClick={() => setActiveTab('tasks')}>
                                    <span className="overview-stat-icon"><ClipboardList size={17} /></span>
                                    <span className="overview-stat-copy"><small>TASK BOARD</small><strong>{dashboardPendingTasks}</strong><em>Open tasks</em></span>
                                    <ArrowLeft className="overview-stat-arrow" size={15} />
                                </button>
                            </div>

                            <div className="overview-insight-row">
                                <div className="insight-card insight-primary">
                                    <div className="insight-head"><div><span>OPERATIONS FLOW</span><b>Today’s activity</b></div><Activity size={16} /></div>
                                    <div className="mini-bars">{[42, 58, 48, 72, 64, 82, 68, 91, 76, 88, 70, 96].map((v, i) => <span key={i} style={{ height: `${v}%` }} />)}</div>
                                    <div className="insight-foot"><strong>+18.4%</strong><small>vs. previous activity window</small></div>
                                </div>
                                <div className="insight-card">
                                    <div className="insight-head"><div><span>COLLECTION SNAPSHOT</span><b>Fee performance</b></div><TrendingUp size={16} /></div>
                                    <div className="insight-metric"><strong>₹{dashboardFeePaid.toLocaleString('en-IN')}</strong><span>collected</span></div>
                                    <div className="progress-track"><span style={{ width: `${dashboardFeeTotal ? Math.min(100, (dashboardFeePaid / dashboardFeeTotal) * 100) : 0}%` }} /></div>
                                    <div className="insight-foot"><strong>{dashboardFeeTotal ? Math.round((dashboardFeePaid / dashboardFeeTotal) * 100) : 0}%</strong><small>of total fee ledger</small></div>
                                </div>
                                <div className="notification-panel">
                                    <div className="notification-head"><div><span>NOTIFICATIONS</span><b>Needs attention</b></div><button type="button"><MoreHorizontal size={16} /></button></div>
                                    <div className="notification-list">
                                        <button type="button" onClick={() => setActiveTab('leaves')}><span className="notice-dot notice-amber" /><div><b>{dashboardPendingLeaves} leave request{dashboardPendingLeaves === 1 ? '' : 's'}</b><small>Awaiting approval</small></div><ArrowLeft size={13} /></button>
                                        <button type="button" onClick={() => setActiveTab('tasks')}><span className="notice-dot notice-violet" /><div><b>{dashboardPendingTasks} open task{dashboardPendingTasks === 1 ? '' : 's'}</b><small>Internal work queue</small></div><ArrowLeft size={13} /></button>
                                        <button type="button" onClick={() => setActiveTab('hall-ticket-allocation')}><span className="notice-dot notice-blue" /><div><b>{dashboardPublishedTickets} tickets published</b><small>Hall ticket desk status</small></div><ArrowLeft size={13} /></button>
                                    </div>
                                </div>
                            </div>

                            <div className="overview-main-grid">
                                <div className="overview-panel">
                                    <div className="overview-panel-head">
                                        <div><span className="panel-kicker">QUICK ACCESS</span><h2>Office operations</h2></div>
                                        <span className="panel-live"><span /> Live</span>
                                    </div>
                                    <div className="quick-action-grid">
                                        <button onClick={() => setActiveTab('enquiries')}><span className="qa-icon qa-green"><UserPlus size={18} /></span><span><b>New enquiry</b><small>Log visitor / admission</small></span><ArrowLeft size={14} /></button>
                                        <button onClick={() => setActiveTab('fees')}><span className="qa-icon qa-blue"><DollarSign size={18} /></span><span><b>Fee desk</b><small>Manage dues & receipts</small></span><ArrowLeft size={14} /></button>
                                        <button onClick={() => setActiveTab('exam-timetable')}><span className="qa-icon qa-violet"><CalendarDays size={18} /></span><span><b>Exam timetable</b><small>Schedule subjects</small></span><ArrowLeft size={14} /></button>
                                        <button onClick={() => setActiveTab('hall-ticket-allocation')}><span className="qa-icon qa-amber"><Ticket size={18} /></span><span><b>Publish tickets</b><small>Check fee eligibility</small></span><ArrowLeft size={14} /></button>
                                        <button onClick={() => setActiveTab('leaves')}><span className="qa-icon qa-rose"><Calendar size={18} /></span><span><b>Leave approvals</b><small>{dashboardPendingLeaves} pending request{dashboardPendingLeaves === 1 ? '' : 's'}</small></span><ArrowLeft size={14} /></button>
                                        <button onClick={() => setActiveTab('tasks')}><span className="qa-icon qa-slate"><ClipboardList size={18} /></span><span><b>Task board</b><small>Track office work</small></span><ArrowLeft size={14} /></button>
                                    </div>
                                </div>

                                <div className="overview-panel">
                                    <div className="overview-panel-head">
                                        <div><span className="panel-kicker">AT A GLANCE</span><h2>Workspace health</h2></div>
                                    </div>
                                    <div className="health-list">
                                        <div className="health-row"><span className="health-icon green"><Users size={15} /></span><div><b>Student records</b><small>Registered in office system</small></div><strong>{studentsList.length}</strong></div>
                                        <div className="health-row"><span className="health-icon blue"><GraduationCap size={15} /></span><div><b>Fee-covered students</b><small>Eligible for hall ticket flow</small></div><strong>{dashboardPaidStudents}</strong></div>
                                        <div className="health-row"><span className="health-icon violet"><CalendarDays size={15} /></span><div><b>Exam schedules</b><small>Timetable entries</small></div><strong>{examTimetables.length}</strong></div>
                                        <div className="health-row"><span className="health-icon amber"><UserCheck size={15} /></span><div><b>Staff members</b><small>Office directory</small></div><strong>{staffList.length}</strong></div>
                                    </div>
                                </div>
                            </div>

                            <div className="overview-footer-strip">
                                <div><span className="footer-dot" /><b>Office workspace is active</b><small>Real-time records are connected</small></div>
                                <div><span>Total fee ledger</span><strong>₹{dashboardFeeTotal.toLocaleString('en-IN')}</strong></div>
                                <button onClick={() => setActiveTab('hall-tickets')}>Open Hall Ticket Desk <ArrowLeft size={14} /></button>
                            </div>
                        </section>
                    )}

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
                                    <button type="submit" className="btn-primary" style={{ background: '#6d5dfc' }}>
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

                    {/* FEES MODULE — bulk class dues + collapsible class-wise ledger */}
                    {activeTab === 'fees' && (
                        <div className="fx-page">
                            <div className="fx-hero">
                                <div className="fx-hero-text">
                                    <span className="fx-kicker">FEE COLLECTION DESK</span>
                                    <h3>Fees & Dues</h3>
                                    <p>Set dues for a whole class in one step, then track collections class by class.</p>
                                </div>
                                <div className="fx-hero-stats">
                                    <div className="fx-stat">
                                        <span>Total billed</span>
                                        <strong>{formatINR(dashboardFeeTotal)}</strong>
                                    </div>
                                    <div className="fx-stat ok">
                                        <span>Collected</span>
                                        <strong>{formatINR(dashboardFeePaid)}</strong>
                                    </div>
                                    <div className="fx-stat warn">
                                        <span>Outstanding</span>
                                        <strong>{formatINR(dashboardFeeBalance)}</strong>
                                    </div>
                                    <div className="fx-stat ring">
                                        <span>Collection rate</span>
                                        <strong>{dashboardFeeTotal ? Math.round((dashboardFeePaid / dashboardFeeTotal) * 100) : 0}%</strong>
                                        <div className="fx-progress"><i style={{ width: `${dashboardFeeTotal ? Math.min(100, (dashboardFeePaid / dashboardFeeTotal) * 100) : 0}%` }} /></div>
                                    </div>
                                </div>
                            </div>

                            {/* ---------- SET DUES FOR A CLASS ---------- */}
                            <div className="fx-panel">
                                <div className="fx-panel-head">
                                    <span className="fx-panel-icon"><PlusCircle size={17} /></span>
                                    <div>
                                        <h4>Set Dues & Fees</h4>
                                        <p>Pick a class, tick the students (or select the whole class) and publish the fee once.</p>
                                    </div>
                                </div>

                                <div className="fx-assign-filters">
                                    <div className="fx-field">
                                        <label>1 · Class</label>
                                        <select
                                            className="custom-select full-width"
                                            value={assignClass}
                                            onChange={(e) => {
                                                setAssignClass(e.target.value);
                                                setAssignSection('all');
                                                setAssignSearch('');
                                                setAssignSelectedIds([]);
                                            }}
                                        >
                                            <option value="">Select class…</option>
                                            {uniqueClasses
                                                .slice()
                                                .sort((x, y) => String(x).localeCompare(String(y), undefined, { numeric: true }))
                                                .map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                                        </select>
                                    </div>
                                    <div className="fx-field">
                                        <label>2 · Section</label>
                                        <select
                                            className="custom-select full-width"
                                            value={assignSection}
                                            disabled={!assignClass}
                                            onChange={(e) => {
                                                setAssignSection(e.target.value);
                                                setAssignSelectedIds([]);
                                            }}
                                        >
                                            <option value="all">All sections</option>
                                            {assignSectionOptions.map((sec) => <option key={sec} value={sec}>Section {sec}</option>)}
                                        </select>
                                    </div>
                                    <div className="fx-field fx-search-field">
                                        <label>Find student</label>
                                        <div className="fx-search">
                                            <Search size={14} />
                                            <input
                                                type="text"
                                                placeholder="Name or admission no."
                                                value={assignSearch}
                                                disabled={!assignClass}
                                                onChange={(e) => setAssignSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="fx-assign-grid">
                                    <div className="fx-assign-students">
                                        {!assignClass ? (
                                            <div className="fx-empty">
                                                <GraduationCap size={30} />
                                                <b>Choose a class to begin</b>
                                                <span>Its students will appear here so you can select them all at once.</span>
                                            </div>
                                        ) : assignClassStudents.length === 0 ? (
                                            <div className="fx-empty">
                                                <Users size={30} />
                                                <b>No students found</b>
                                                <span>There are no students enrolled in this selection.</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="fx-select-bar">
                                                    <label className="fx-check-all">
                                                        <input
                                                            type="checkbox"
                                                            checked={assignAllVisibleSelected}
                                                            onChange={toggleAssignAllVisible}
                                                        />
                                                        <span>{assignSearch.trim() ? 'Select all shown' : `Select all students in ${assignSection === 'all' ? assignClass : `${assignClass} - ${assignSection}`}`}</span>
                                                    </label>
                                                    <span className="fx-selected-count">{assignSelectedCount} of {assignClassStudents.length} selected</span>
                                                </div>

                                                <div className="fx-student-list">
                                                    {assignVisibleStudents.length === 0 && (
                                                        <div className="fx-empty small"><span>No student matches “{assignSearch}”.</span></div>
                                                    )}
                                                    {assignVisibleStudents.map((st) => {
                                                        const checked = assignSelectedIds.includes(st.id);
                                                        const hasTerm = getStudentFeeStatus(st).records.some((r) => String(r.term) === assignForm.term);
                                                        return (
                                                            <label key={st.id} className={`fx-student-row ${checked ? 'checked' : ''}`}>
                                                                <input type="checkbox" checked={checked} onChange={() => toggleAssignStudent(st.id)} />
                                                                <span className="fx-avatar">{String(st.name || '?').trim().charAt(0).toUpperCase()}</span>
                                                                <span className="fx-student-meta">
                                                                    <b>{st.name || 'Unnamed'}</b>
                                                                    <small>#{st.admissionNo || st.rollNo || 'N/A'} • Section {st.sectionName || st.section || 'General'}</small>
                                                                </span>
                                                                {hasTerm && <span className="fx-pill info">Has {assignForm.term}</span>}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="fx-assign-side">
                                        <h5>3 · Fee details</h5>
                                        <div className="fx-field">
                                            <label>Term</label>
                                            <select
                                                className="custom-select full-width"
                                                value={assignForm.term}
                                                onChange={(e) => setAssignForm({ ...assignForm, term: e.target.value })}
                                            >
                                                <option value="Term 1">Term 1</option>
                                                <option value="Term 2">Term 2</option>
                                                <option value="Annual">Annual Full Fee</option>
                                            </select>
                                        </div>
                                        <div className="fx-field">
                                            <label>Fee per student (₹)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="table-input full-width-input"
                                                placeholder="e.g. 15000"
                                                value={assignForm.totalFee}
                                                onChange={(e) => setAssignForm({ ...assignForm, totalFee: e.target.value })}
                                            />
                                        </div>

                                        <div className="fx-summary">
                                            <div><span>Class</span><b>{assignClass ? `${assignClass}${assignSection === 'all' ? '' : ` - ${assignSection}`}` : '—'}</b></div>
                                            <div><span>Students selected</span><b>{assignSelectedCount}</b></div>
                                            <div><span>Term</span><b>{assignForm.term}</b></div>
                                            <div className="total"><span>Total dues to publish</span><b>{assignAmountValid ? formatINR(assignAmount * assignSelectedCount) : '—'}</b></div>
                                        </div>

                                        <button
                                            type="button"
                                            className="fx-publish-btn"
                                            disabled={isAssigningFees || assignSelectedCount === 0 || !assignAmountValid}
                                            onClick={handleBulkAssignFees}
                                        >
                                            <PlusCircle size={15} />
                                            {isAssigningFees
                                                ? 'Publishing…'
                                                : assignSelectedCount > 0
                                                    ? `Publish dues to ${assignSelectedCount} student${assignSelectedCount === 1 ? '' : 's'}`
                                                    : 'Select students to continue'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ---------- FEE LEDGERS & RECORDS (dropdown) ---------- */}
                            <div className={`fx-panel fx-ledger ${feeLedgerOpen ? 'open' : ''}`}>
                                <button
                                    type="button"
                                    className="fx-ledger-toggle"
                                    aria-expanded={feeLedgerOpen}
                                    onClick={() => setFeeLedgerOpen((open) => !open)}
                                >
                                    <span className="fx-panel-icon alt"><ClipboardList size={17} /></span>
                                    <span className="fx-ledger-title">
                                        <b>Fee Ledgers & Records</b>
                                        <small>Class → Section → Students · {feesList.length} record{feesList.length === 1 ? '' : 's'}</small>
                                    </span>
                                    <span className="fx-ledger-count">{feesList.length}</span>
                                    {feeLedgerOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>

                                {feeLedgerOpen && (
                                    <div className="fx-ledger-body">
                                        <div className="fx-crumbs">
                                            <button type="button" className={feeViewMode === 'classes' ? 'current' : ''} onClick={goFeeAllClasses}>All Classes</button>
                                            {feeClassNode && (
                                                <>
                                                    <span>›</span>
                                                    <button type="button" className={feeViewMode === 'sections' ? 'current' : ''} onClick={() => openFeeClass(feeClassNode.name)}>{feeClassNode.name}</button>
                                                </>
                                            )}
                                            {feeSectionNode && feeViewMode === 'students-fee' && (
                                                <>
                                                    <span>›</span>
                                                    <button type="button" className="current">Section {feeSectionNode.name}</button>
                                                </>
                                            )}
                                            {feeViewMode !== 'classes' && (
                                                <button
                                                    type="button"
                                                    className="fx-back"
                                                    onClick={() => (feeViewMode === 'students-fee' ? openFeeClass(selectedFeeClass) : goFeeAllClasses())}
                                                >
                                                    <ArrowLeft size={13} /> Back
                                                </button>
                                            )}
                                        </div>

                                        {/* LEVEL 1 — CLASS CARDS */}
                                        {feeViewMode === 'classes' && (
                                            feeClassTree.length === 0 ? (
                                                <div className="fx-empty"><GraduationCap size={30} /><b>No classes yet</b><span>Add students to see their fee records here.</span></div>
                                            ) : (
                                                <div className="fx-card-grid">
                                                    {feeClassTree.map((cls) => (
                                                        <button type="button" key={cls.name} className="fx-card" onClick={() => openFeeClass(cls.name)}>
                                                            <div className="fx-card-top">
                                                                <span className="fx-card-icon"><GraduationCap size={18} /></span>
                                                                <div>
                                                                    <h5>{cls.name}</h5>
                                                                    <small>{cls.sections.length} section{cls.sections.length === 1 ? '' : 's'} • {cls.stats.students} student{cls.stats.students === 1 ? '' : 's'}</small>
                                                                </div>
                                                            </div>
                                                            <div className="fx-progress"><i style={{ width: `${cls.stats.percent}%` }} /></div>
                                                            <div className="fx-card-money">
                                                                <span><small>Billed</small><b>{formatINR(cls.stats.billed)}</b></span>
                                                                <span><small>Collected</small><b className="ok">{formatINR(cls.stats.collected)}</b></span>
                                                                <span><small>Balance</small><b className={cls.stats.balance > 0 ? 'bad' : 'ok'}>{formatINR(cls.stats.balance)}</b></span>
                                                            </div>
                                                            <div className="fx-card-pills">
                                                                {cls.stats.pending > 0 && <span className="fx-pill bad">{cls.stats.pending} pending</span>}
                                                                {cls.stats.paid > 0 && <span className="fx-pill ok">{cls.stats.paid} paid</span>}
                                                                {cls.stats.unset > 0 && <span className="fx-pill muted">{cls.stats.unset} no dues</span>}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )
                                        )}

                                        {/* LEVEL 2 — SECTION CARDS */}
                                        {feeViewMode === 'sections' && feeClassNode && (
                                            <div className="fx-card-grid">
                                                {feeClassNode.sections.map((sec) => (
                                                    <button type="button" key={sec.name} className="fx-card" onClick={() => openFeeSection(sec.name)}>
                                                        <div className="fx-card-top">
                                                            <span className="fx-card-icon alt"><Users size={18} /></span>
                                                            <div>
                                                                <h5>Section {sec.name}</h5>
                                                                <small>{feeClassNode.name} • {sec.stats.students} student{sec.stats.students === 1 ? '' : 's'}</small>
                                                            </div>
                                                        </div>
                                                        <div className="fx-progress"><i style={{ width: `${sec.stats.percent}%` }} /></div>
                                                        <div className="fx-card-money">
                                                            <span><small>Billed</small><b>{formatINR(sec.stats.billed)}</b></span>
                                                            <span><small>Collected</small><b className="ok">{formatINR(sec.stats.collected)}</b></span>
                                                            <span><small>Balance</small><b className={sec.stats.balance > 0 ? 'bad' : 'ok'}>{formatINR(sec.stats.balance)}</b></span>
                                                        </div>
                                                        <div className="fx-card-pills">
                                                            {sec.stats.pending > 0 && <span className="fx-pill bad">{sec.stats.pending} pending</span>}
                                                            {sec.stats.paid > 0 && <span className="fx-pill ok">{sec.stats.paid} paid</span>}
                                                            {sec.stats.unset > 0 && <span className="fx-pill muted">{sec.stats.unset} no dues</span>}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* LEVEL 3 — STUDENTS LIST */}
                                        {feeViewMode === 'students-fee' && feeSectionNode && (
                                            <div>
                                                <div className="fx-students-head">
                                                    <div>
                                                        <h5>{feeClassNode.name} · Section {feeSectionNode.name}</h5>
                                                        <small>
                                                            {feeSectionNode.stats.students} students • Billed {formatINR(feeSectionNode.stats.billed)} • Collected {formatINR(feeSectionNode.stats.collected)} • Balance {formatINR(feeSectionNode.stats.balance)}
                                                        </small>
                                                    </div>
                                                    <div className="fx-filter-chips">
                                                        {[
                                                            ['all', 'All'],
                                                            ['pending', 'Pending'],
                                                            ['paid', 'Paid'],
                                                            ['none', 'No dues']
                                                        ].map(([value, label]) => (
                                                            <button
                                                                type="button"
                                                                key={value}
                                                                className={feeStatusFilter === value ? 'active' : ''}
                                                                onClick={() => setFeeStatusFilter(value)}
                                                            >{label}</button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="table-responsive">
                                                    <table className="custom-table fx-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Adm No</th>
                                                                <th>Student</th>
                                                                <th>Billed</th>
                                                                <th>Paid</th>
                                                                <th>Balance</th>
                                                                <th>Status</th>
                                                                <th style={{ textAlign: 'right' }}>Records</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {feeSectionNode.entries
                                                                .filter((e) => feeStatusFilter === 'all' || e.status === feeStatusFilter)
                                                                .map((entry) => {
                                                                    const expanded = expandedFeeStudent === entry.key;
                                                                    return (
                                                                        <React.Fragment key={entry.key}>
                                                                            <tr className={expanded ? 'fx-row-open' : ''}>
                                                                                <td><code>#{entry.admissionNo || 'N/A'}</code></td>
                                                                                <td><strong>{entry.name}</strong></td>
                                                                                <td>{entry.records.length ? formatINR(entry.billed) : '—'}</td>
                                                                                <td>{entry.records.length ? formatINR(entry.collected) : '—'}</td>
                                                                                <td style={{ color: entry.balance > 0 ? '#dc2626' : '#059669', fontWeight: 800 }}>
                                                                                    {entry.records.length ? formatINR(entry.balance) : '—'}
                                                                                </td>
                                                                                <td>
                                                                                    <span className={`fx-pill ${entry.status === 'paid' ? 'ok' : entry.status === 'pending' ? 'bad' : 'muted'}`}>
                                                                                        {entry.status === 'paid' ? 'Paid' : entry.status === 'pending' ? 'Pending' : 'No dues set'}
                                                                                    </span>
                                                                                </td>
                                                                                <td style={{ textAlign: 'right' }}>
                                                                                    {entry.records.length > 0 ? (
                                                                                        <button
                                                                                            type="button"
                                                                                            className="fx-link-btn"
                                                                                            onClick={() => setExpandedFeeStudent(expanded ? null : entry.key)}
                                                                                        >
                                                                                            {entry.records.length} record{entry.records.length === 1 ? '' : 's'}
                                                                                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                                                        </button>
                                                                                    ) : (
                                                                                        <span className="fx-muted-text">—</span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                            {expanded && (
                                                                                <tr className="fx-detail-row">
                                                                                    <td colSpan={7}>
                                                                                        <div className="fx-records">
                                                                                            {entry.records.map((item) => (
                                                                                                <div className="fx-record" key={item.id}>
                                                                                                    <div className="fx-record-main">
                                                                                                        <b>{item.term || 'Fee'}</b>
                                                                                                        <small>{formatINR(item.totalFee)} total • {formatINR(item.paidAmount)} paid</small>
                                                                                                    </div>
                                                                                                    <span className="fx-record-balance" style={{ color: feeRecordBalance(item) > 0 ? '#dc2626' : '#059669' }}>
                                                                                                        {formatINR(feeRecordBalance(item))} due
                                                                                                    </span>
                                                                                                    <span className={`fx-pill ${isFeeRecordPaid(item) ? 'ok' : 'bad'}`}>
                                                                                                        {isFeeRecordPaid(item) ? 'Paid' : (item.status || 'Pending')}
                                                                                                    </span>
                                                                                                    <div className="fx-record-actions">
                                                                                                        {!isFeeRecordPaid(item) && (
                                                                                                            <button type="button" className="btn-save-grade" onClick={() => handleMarkFeePaid(item)}>
                                                                                                                <Check size={13} /> Mark Paid & Send Receipt
                                                                                                            </button>
                                                                                                        )}
                                                                                                        <button type="button" className="delete-task-btn" onClick={() => handleDelete('fee_collections', item.id)} title="Delete record">
                                                                                                            <X size={14} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </React.Fragment>
                                                                    );
                                                                })}
                                                            {feeSectionNode.entries.filter((e) => feeStatusFilter === 'all' || e.status === feeStatusFilter).length === 0 && (
                                                                <tr><td colSpan={7} className="fx-empty-cell">No students match this filter.</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* EXAM TIMETABLE MODULE */}
                    {activeTab === 'exam-timetable' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div>
                                    <span className="exam-module-kicker">EXAMINATION TIMETABLE SCHEDULER</span>
                                    <h3>Manage Exam Timetable</h3>
                                    <p className="subtitle">Select class, exam type, subject and date to add dynamic timetables displayed directly on Student Hall Tickets.</p>
                                </div>
                                <CalendarDays size={28} />
                            </div>

                            <form onSubmit={handleAddTimetableSubject} className="form-grid" style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Choose Class</label>
                                    <select className="custom-select full-width" value={timetableClass} onChange={e => setTimetableClass(e.target.value)} required>
                                        <option value="">Select Class</option>
                                        {uniqueClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Exam Name</label>
                                    <select className="custom-select full-width" value={timetableExamName} onChange={e => setTimetableExamName(e.target.value)} required>
                                        {examTypes.map(exam => <option key={exam} value={exam}>{exam}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Subject Code</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. 041" value={timetableSubjectCode} onChange={e => setTimetableSubjectCode(e.target.value)} required />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Subject Name</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. Mathematics" value={timetableSubject} onChange={e => setTimetableSubject(e.target.value)} required />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Exam Date</label>
                                    <input type="date" className="table-input full-width-input" value={timetableDate} onChange={e => setTimetableDate(e.target.value)} required />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Exam Time Slot</label>
                                    <input type="text" className="table-input full-width-input" placeholder="e.g. 09:30 AM - 12:30 PM" value={timetableTime} onChange={e => setTimetableTime(e.target.value)} required />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="btn-primary" style={{ background: '#6d5dfc' }}>
                                        <PlusCircle size={15} /> Add Subject Exam Schedule
                                    </button>
                                </div>
                            </form>

                            {/* CLASS-WISE EXAM TIMETABLE */}
                            <div className="classwise-timetable-section">

                                <div className="classwise-header">
                                    <div>
                                        <span className="classwise-kicker">
                                            TIMETABLE OVERVIEW
                                        </span>

                                        <h4>
                                            Class-wise Exam Timetable
                                        </h4>

                                        <p>
                                            View examination schedules separately for each class.
                                        </p>
                                    </div>

                                    <div className="classwise-count">
                                        <strong>{examTimetables.length}</strong>
                                        <span>Schedules</span>
                                    </div>
                                </div>


                                {/* CLASS FILTER */}

                                <div className="class-filter-bar">

                                    <button
                                        type="button"
                                        className={`class-filter-btn ${selectedTimetableClass === 'all'
                                            ? 'active'
                                            : ''
                                            }`}
                                        onClick={() => setSelectedTimetableClass('all')}
                                    >
                                        <span>All Classes</span>
                                        <b>{examTimetables.length}</b>
                                    </button>


                                    {uniqueClasses.map(cls => {

                                        const classCount = examTimetables.filter(
                                            item => item.className === cls
                                        ).length;

                                        return (
                                            <button
                                                type="button"
                                                key={cls}
                                                className={`class-filter-btn ${selectedTimetableClass === cls
                                                    ? 'active'
                                                    : ''
                                                    }`}
                                                onClick={() =>
                                                    setSelectedTimetableClass(cls)
                                                }
                                            >
                                                <span>{cls}</span>
                                                <b>{classCount}</b>
                                            </button>
                                        );
                                    })}

                                </div>


                                {/* CLASS-WISE TIMETABLE */}

                                {examTimetables.length === 0 ? (

                                    <div className="classwise-empty">

                                        <CalendarDays size={34} />

                                        <h4>No Timetables Yet</h4>

                                        <p>
                                            Add an examination schedule above to
                                            display the class-wise timetable.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="classwise-timetable-list">

                                        {uniqueClasses
                                            .filter(cls =>
                                                selectedTimetableClass === 'all' ||
                                                selectedTimetableClass === cls
                                            )
                                            .map(cls => {

                                                const classTimetables =
                                                    examTimetables
                                                        .filter(
                                                            item =>
                                                                item.className === cls
                                                        )
                                                        .sort(
                                                            (a, b) =>
                                                                new Date(a.examDate) -
                                                                new Date(b.examDate)
                                                        );

                                                if (classTimetables.length === 0) {
                                                    return null;
                                                }

                                                return (

                                                    <div
                                                        className="classwise-card"
                                                        key={cls}
                                                    >

                                                        {/* CLASS HEADER */}

                                                        <div className="classwise-card-header">

                                                            <div className="class-title-area">

                                                                <div className="class-icon">
                                                                    <GraduationCap size={20} />
                                                                </div>

                                                                <div>
                                                                    <span>
                                                                        CLASS
                                                                    </span>

                                                                    <h3>
                                                                        {cls}
                                                                    </h3>
                                                                </div>

                                                            </div>


                                                            <div className="class-exam-count">
                                                                <strong>
                                                                    {classTimetables.length}
                                                                </strong>

                                                                <span>
                                                                    {classTimetables.length === 1
                                                                        ? 'Exam'
                                                                        : 'Exams'}
                                                                </span>
                                                            </div>

                                                        </div>


                                                        {/* EXAMS: latest open, older exams hidden in dropdowns */}

                                                        {getExamGroups(classTimetables).map((group, gi) => {
                                                            const key = `${cls}__${group.examName}`;
                                                            const isOpen = !!openTimetableExams[key];

                                                            if (gi === 0) {
                                                                return (
                                                                    <div key={key}>
                                                                        <div className="tt-exam-head">
                                                                            <strong>{group.examName}</strong>
                                                                            <span className="status-badge status-present">Latest Published</span>
                                                                            <small className="tt-exam-count">{group.items.length} {group.items.length === 1 ? 'subject' : 'subjects'}</small>
                                                                        </div>
                                                                        {renderTimetableTable(group.items)}
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div key={key} className={`tt-exam-dropdown ${isOpen ? 'open' : ''}`}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setOpenTimetableExams(prev => ({ ...prev, [key]: !prev[key] }))}
                                                                        className="tt-exam-toggle"
                                                                    >
                                                                        <span>{group.examName} <small>({group.items.length} {group.items.length === 1 ? 'subject' : 'subjects'})</small></span>
                                                                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                    </button>
                                                                    {isOpen && renderTimetableTable(group.items)}
                                                                </div>
                                                            );
                                                        })}

                                                    </div>

                                                );
                                            })}

                                    </div>

                                )}

                            </div>
                        </div>
                    )}

                    {/* HALL TICKET OFFICE MODULE */}
                    {activeTab === 'hall-ticket-allocation' && (
                        <div className="dash-card full-width hall-ticket-allocation-module">
                            <style>{`
                                .hall-ticket-allocation-filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:18px 0;padding:18px;border:1px solid #dbe7e2;border-radius:16px;background:#f8fbfa}
                                .hall-ticket-allocation-filters label{display:flex;flex-direction:column;gap:7px;font-size:.75rem;font-weight:800;color:#475569}
                                .hall-ticket-allocation-filters select,.hall-ticket-allocation-filters input{height:42px;padding:0 12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a;font-size:.8rem;outline:none}
                                .hall-ticket-allocation-filters select:focus,.hall-ticket-allocation-filters input:focus{border-color:#7c6df6;box-shadow:0 0 0 3px rgba(16,185,129,.12)}
                                .hall-ticket-search-field{grid-column:span 1}
                                .hall-ticket-summary-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 16px}
                                .hall-ticket-count{display:flex;align-items:center;gap:7px;padding:9px 13px;border-radius:10px;font-size:.75rem}
                                .hall-ticket-count strong{font-size:1rem}
                                .hall-ticket-count.paid{background:#dcfce7;color:#5847e8}
                                .hall-ticket-count.blocked{background:#fee2e2;color:#b91c1c}
                                .hall-ticket-publish-selected{background:#6d5dfc!important;color:#fff!important}
                                .hall-ticket-publish-selected:disabled,.hall-ticket-summary-row .exam-primary-btn:disabled{opacity:.45;cursor:not-allowed}
                                .hall-ticket-allocation-table td{vertical-align:middle}
                                .hall-ticket-allocation-table input[type="checkbox"]{width:16px;height:16px;accent-color:#6d5dfc}
                                .hall-ticket-fee-badge,.hall-ticket-published-badge{display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border-radius:999px;font-size:.68rem;font-weight:900}
                                .hall-ticket-fee-badge.paid{background:#dcfce7;color:#5847e8}
                                .hall-ticket-fee-badge.not-paid{background:#fee2e2;color:#b91c1c}
                                .hall-ticket-published-badge{background:#e6e0ff;color:#5847e8}
                                .hall-ticket-publish-btn,.hall-ticket-block-btn{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:9px;padding:9px 12px;font-size:.72rem;font-weight:800;cursor:pointer}
                                .hall-ticket-publish-btn{background:#6d5dfc;color:#fff}
                                .hall-ticket-publish-btn:hover{background:#5847e8}
                                .hall-ticket-block-btn{background:#f1f5f9;color:#94a3b8;cursor:not-allowed}
                                .hall-ticket-row-blocked{background:rgba(248,113,113,.035)}
                                .hall-ticket-no-allocation{color:#94a3b8;font-size:.72rem}
                                @media(max-width:900px){.hall-ticket-allocation-filters{grid-template-columns:repeat(2,minmax(0,1fr))}}
                                @media(max-width:560px){.hall-ticket-allocation-filters{grid-template-columns:1fr}.hall-ticket-search-field{grid-column:auto}}
                            `}</style>
                            <div className="card-header">
                                <div>
                                    <span className="exam-module-kicker">HALL TICKET MANAGEMENT</span>
                                    <h3>Hall Ticket Allocation</h3>
                                    <p className="subtitle">Select the examination and academic year, then publish Hall Tickets only for students whose fees are fully paid.</p>
                                </div>
                                <Ticket size={28} />
                            </div>

                            <div className="hall-ticket-allocation-filters">
                                <label>
                                    <span>Exam</span>
                                    <select value={hallTicketExam} onChange={e => setHallTicketExam(e.target.value)}>
                                        {hallTicketExamOptions.map(exam => <option key={exam} value={exam}>{exam}</option>)}
                                    </select>
                                </label>

                                <label>
                                    <span>Year</span>
                                    <select value={hallTicketYear} onChange={e => setHallTicketYear(e.target.value)}>
                                        {hallTicketYears.map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </label>

                                <label>
                                    <span>Class</span>
                                    <select value={hallTicketClass} onChange={e => {
                                        setHallTicketClass(e.target.value);
                                        setHallTicketSection('');
                                    }}>
                                        <option value="">All Classes</option>
                                        {hallTicketClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                    </select>
                                </label>

                                <label>
                                    <span>Section</span>
                                    <select value={hallTicketSection} onChange={e => setHallTicketSection(e.target.value)}>
                                        <option value="">All Sections</option>
                                        {hallTicketSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                                    </select>
                                </label>

                                <label className="hall-ticket-search-field">
                                    <span>Search Student</span>
                                    <input
                                        value={hallTicketSearch}
                                        onChange={e => setHallTicketSearch(e.target.value)}
                                        placeholder="Name / Admission No..."
                                    />
                                </label>
                            </div>

                            <div className="hall-ticket-summary-row">
                                <div className="hall-ticket-count paid">
                                    <strong>{paidHallTicketStudents.length}</strong>
                                    <span>Paid</span>
                                </div>
                                <div className="hall-ticket-count blocked">
                                    <strong>{unpaidHallTicketStudents.length}</strong>
                                    <span>Not Paid / Blocked</span>
                                </div>
                                <button
                                    type="button"
                                    className="exam-primary-btn"
                                    onClick={toggleAllPaidHallTicketStudents}
                                    disabled={paidHallTicketStudents.length === 0}
                                >
                                    <CheckSquare size={15} /> Select All Paid
                                </button>
                                <button
                                    type="button"
                                    className="exam-primary-btn hall-ticket-publish-selected"
                                    onClick={publishSelectedHallTickets}
                                    disabled={hallTicketSelectedStudents.length === 0}
                                >
                                    <Ticket size={15} /> Publish Selected ({hallTicketSelectedStudents.length})
                                </button>
                            </div>

                            <div className="table-responsive">
                                <table className="custom-table hall-ticket-allocation-table">
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>Student</th>
                                            <th>Admission No</th>
                                            <th>Class / Section</th>
                                            <th>Fee Status</th>
                                            <th>Hall / Seat</th>
                                            <th>Hall Ticket</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hallTicketListStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '28px' }}>
                                                    No students found for the selected filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            hallTicketListStudents.map(student => {
                                                const fee = getStudentFeeStatus(student);
                                                const allocation = hallTicketAllocationForStudent(student);
                                                const published = isHallTicketPublished(student);
                                                const seat = allocation
                                                    ? (allocation.studentList || []).find(x => x.id === student.id)?.seatNo || '—'
                                                    : '—';

                                                return (
                                                    <tr key={student.id} className={!fee.paid ? 'hall-ticket-row-blocked' : ''}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={hallTicketSelectedStudents.includes(student.id)}
                                                                onChange={() => toggleHallTicketStudent(student.id)}
                                                                disabled={!fee.paid || published}
                                                            />
                                                        </td>
                                                        <td><strong>{student.name || 'Student'}</strong></td>
                                                        <td>{student.admissionNo || student.rollNo || '—'}</td>
                                                        <td>{student.className || student.grade || ''} {student.sectionName || student.section ? `/ ${student.sectionName || student.section}` : ''}</td>
                                                        <td>
                                                            <span className={`hall-ticket-fee-badge ${fee.paid ? 'paid' : 'not-paid'}`}>
                                                                {fee.paid ? 'PAID' : 'NOT PAID'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {allocation
                                                                ? `${allocation.hallNo || '—'} / Seat ${seat}`
                                                                : <span className="hall-ticket-no-allocation">Not Allocated</span>}
                                                        </td>
                                                        <td>
                                                            {published ? (
                                                                <span className="hall-ticket-published-badge">
                                                                    <CheckCircle size={14} /> Published
                                                                </span>
                                                            ) : fee.paid && allocation ? (
                                                                <button
                                                                    type="button"
                                                                    className="hall-ticket-publish-btn"
                                                                    onClick={() => publishHallTicket(student)}
                                                                >
                                                                    <Ticket size={14} /> Publish Hall Ticket
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="hall-ticket-block-btn"
                                                                    disabled
                                                                    title={!fee.paid ? 'Fees are pending' : 'Exam hall is not allocated'}
                                                                >
                                                                    <XCircle size={14} /> Blocked
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'hall-tickets' && (
                        <div className="dash-card full-width">
                            <div className="card-header">
                                <div><h3>Hall Ticket Management</h3><p>Office can manually search any student and download the hall ticket.</p></div>
                                <Ticket size={28} />
                            </div>
                            <div style={{ margin: '18px 0' }}>
                                <input value={hallTicketSearch} onChange={e => setHallTicketSearch(e.target.value)} placeholder="Search student name or admission number..." style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div className="table-responsive">
                                <table className="custom-table" style={{ width: '100%' }}>
                                    <thead><tr><th>Student</th><th>Admission No</th><th>Class</th><th>Hall Status</th><th>Action</th></tr></thead>
                                    <tbody>{officeHallTicketStudents.map(student => {
                                        const allocation = examHalls.find(h => (h.studentIds || []).includes(student.id) || (h.studentList || []).some(x => x.id === student.id));
                                        return <tr key={student.id}><td><strong>{student.name || 'Student'}</strong></td><td>{student.admissionNo || student.rollNo || '—'}</td><td>{student.className || student.grade || ''} {student.sectionName || student.section ? `/ ${student.sectionName || student.section}` : ''}</td><td>{allocation ? `${allocation.hallNo} / Seat ${(allocation.studentList || []).find(x => x.id === student.id)?.seatNo || '—'}` : 'Not Allocated'}</td><td><button className="exam-primary-btn" disabled={!allocation} onClick={() => printStudentHallTicket(student)}><Download size={15} /> Download Hall Ticket</button></td></tr>
                                    })}</tbody>
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
                                                <select value={examName} onChange={e => setExamName(e.target.value)}>
                                                    {examTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                                </select>
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

                                    {/* CLASS-WISE SEATING ARRANGEMENT */}
                                    <div className="exam-existing-section">
                                        <div className="exam-section-heading">
                                            <strong>Seating Arrangement (Class-wise)</strong>
                                            <span>{seatingClasses.length}</span>
                                        </div>

                                        <select
                                            className="custom-select full-width seat-filter-select"
                                            value={seatingFilterClass}
                                            onChange={e => setSeatingFilterClass(e.target.value)}
                                        >
                                            <option value="all">All Classes</option>
                                            {seatingClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                        </select>

                                        {seatingClasses.length === 0 ? (
                                            <div className="exam-empty-state"><Users size={22} /><span>No seating arrangements yet. Assign students to a hall first.</span></div>
                                        ) : seatingClasses
                                            .filter(cls => seatingFilterClass === 'all' || seatingFilterClass === cls)
                                            .map(cls => {
                                                const classHalls = examHalls
                                                    .filter(h => h.targetClass === cls)
                                                    .sort((a, b) => String(a.hallNo).localeCompare(String(b.hallNo), undefined, { numeric: true }));
                                                const totalStudents = classHalls.reduce((n, h) => n + getHallSeatList(h).length, 0);
                                                const isOpen = seatingFilterClass === cls || !!openSeatingClasses[cls];

                                                return (
                                                    <div key={cls} className={`seat-class-group ${isOpen ? 'open' : ''}`}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenSeatingClasses(prev => ({ ...prev, [cls]: !prev[cls] }))}
                                                            className="seat-class-toggle"
                                                        >
                                                            <span className="seat-class-title">
                                                                <GraduationCap size={16} /> {cls}
                                                                <small>
                                                                    {classHalls.length} {classHalls.length === 1 ? 'hall' : 'halls'} · {totalStudents} students
                                                                </small>
                                                            </span>
                                                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>

                                                        {isOpen && classHalls.map(hall => (
                                                            <div key={hall.id} className="seat-hall">
                                                                <div className="seat-hall-head">
                                                                    <strong>{hall.hallNo}</strong>
                                                                    <span className="task-target-tag">{hall.targetClass || '—'} / {hall.targetSection || '—'}</span>
                                                                    <small className="seat-hall-exam">{hall.examName || 'Examination'}</small>
                                                                </div>
                                                                <div className="table-responsive">
                                                                    <table className="custom-table">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Seat No</th>
                                                                                <th>Student Name</th>
                                                                                <th>Admission No</th>
                                                                                <th>Section</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {getHallSeatList(hall).map(st => (
                                                                                <tr key={st.id}>
                                                                                    <td><span className="exam-seat-range">{st.seatNo || '—'}</span></td>
                                                                                    <td><strong>{st.name || 'Student'}</strong></td>
                                                                                    <td>{st.admissionNo || '—'}</td>
                                                                                    <td>{st.sectionName || hall.targetSection || '—'}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
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
                                                        <button className="btn-save-grade" onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')} style={{ background: '#6d5dfc', padding: '4px 8px' }}>
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
                                    <button type="submit" className="btn-primary" style={{ background: '#6d5dfc' }}>
                                        <PlusCircle size={15} /> Create Task Item
                                    </button>
                                </div>
                            </form>

                            <h4>Pending Front-Office Tasks ({officeTasks.length})</h4>
                            <div className="table-responsive">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Task Description</th>
                                            <th>Assigned Staff</th>
                                            <th>Priority</th>
                                            <th>Deadline</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {officeTasks.map(task => (
                                            <tr key={task.id}>
                                                <td><strong>{task.title}</strong></td>
                                                <td>{task.assignedTo}</td>
                                                <td>
                                                    <span className={`status-badge ${task.priority === 'Urgent' ? 'status-absent' : 'status-present'}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td>{task.deadline}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="delete-task-btn" onClick={() => handleDelete('office_tasks', task.id)} title="Delete Task"><X size={14} /></button>
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