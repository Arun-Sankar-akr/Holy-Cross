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
    Ticket, CheckCircle, XCircle, LogOut, PlusCircle, Check, X, Menu, LayoutGrid, ChevronDown, ChevronUp, UserCheck, ArrowLeft, GraduationCap, CheckSquare, CalendarDays, Trash2, Bell, Search, Sparkles, TrendingUp, Activity, Clock, Plus, MoreHorizontal, Pencil, Building2
} from 'lucide-react';
import HallManagement from './Hallmanagement';
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
    const [examHallId, setExamHallId] = useState('');
    const [hallMaster, setHallMaster] = useState([]);   // Hall Management master list
    const [examName, setExamName] = useState('1st Mid-Term Exam');
    const [selectedExamStaff, setSelectedExamStaff] = useState([]);
    const [allocMode, setAllocMode] = useState('');            // '' | 'students' | 'staff'
    const [allocStudentSearch, setAllocStudentSearch] = useState('');
    const [examStaffSearch, setExamStaffSearch] = useState('');
    const [allocRecordsTab, setAllocRecordsTab] = useState('halls');
    const [seatEdit, setSeatEdit] = useState(null);   // { allocId, studentId, value }
    const [seatBusy, setSeatBusy] = useState(false);
    const [allocSeatOverrides, setAllocSeatOverrides] = useState({});   // { studentId: typed seat } while allocating
    const [editHallSeats, setEditHallSeats] = useState({});             // { studentId: typed seat } in the edit window
    const [allocRecordSearch, setAllocRecordSearch] = useState('');
    const [selectedHallIds, setSelectedHallIds] = useState([]);
    const [selectedDutyIds, setSelectedDutyIds] = useState([]);
    const [editHall, setEditHall] = useState(null);
    const [editHallForm, setEditHallForm] = useState({ hallId: '', examName: '' });
    const [editHallKeep, setEditHallKeep] = useState([]);
    const [editHallAllStudents, setEditHallAllStudents] = useState([]);
    const [editDuty, setEditDuty] = useState(null);
    const [editDutyForm, setEditDutyForm] = useState({ hallId: '', dutyTime: '' });
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
        const unsubHallMaster = onSnapshot(collection(db, 'exam_hall_master'), snap =>
            setHallMaster(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
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
            unsubHallMaster();
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

    const allocVisibleStudents = examClassStudents.filter(s => {
        const q = allocStudentSearch.trim().toLowerCase();
        if (!q) return true;
        return [s.name, s.admissionNo, s.rollNo].filter(Boolean).some(v => String(v).toLowerCase().includes(q));
    });
    const allocExam = examName || examTypes[0];
    const seatedAllocFor = (student, exam) => examHalls.find(a =>
        (a.examName || 'Examination') === exam &&
        ((a.studentIds || []).includes(student.id) || (a.studentList || []).some(x => x.id === student.id))
    );
    const allocSelectableStudents = allocVisibleStudents.filter(s => !seatedAllocFor(s, allocExam));

    const allocQ = allocRecordSearch.trim().toLowerCase();
    const allocFilteredHalls = examHalls.filter(h => !allocQ ||
        [h.hallNo, h.targetClass, h.targetSection, h.examName].filter(Boolean).some(v => String(v).toLowerCase().includes(allocQ)));
    const allocFilteredDuties = staffExamHalls.filter(d => !allocQ ||
        [d.staffName, d.hallNo, d.dutyTime, d.examName].filter(Boolean).some(v => String(v).toLowerCase().includes(allocQ)));
    // keep selections in sync with live Firestore data
    const hallSel = selectedHallIds.filter(id => examHalls.some(h => h.id === id));
    const dutySel = selectedDutyIds.filter(id => staffExamHalls.some(d => d.id === id));

    const allocVisibleStaff = staffList.filter(s => {
        const q = examStaffSearch.trim().toLowerCase();
        if (!q) return true;
        return [s.name, s.staffName, s.department, s.subject, s.designation, s.email]
            .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
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
        const paidIds = hallTicketSelectableStudents.map(s => s.id);
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

    // Only students who are fee-cleared, seated in a hall and not yet published can be bulk-selected
    const hallTicketSelectableStudents = hallTicketListStudents.filter(s =>
        getStudentFeeStatus(s).paid && !!hallTicketAllocationForStudent(s) && !isHallTicketPublished(s)
    );

    const publishHallTicket = async (student, silent = false) => {
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

            if (!silent) alert(`Hall Ticket published for ${student.name || 'student'}.`);
            return true;
        } catch (error) {
            console.error('Hall Ticket publication failed:', error);
            if (!silent) alert('Failed to publish Hall Ticket. Please try again.');
            return false;
        }
    };

    const publishSelectedHallTickets = async () => {
        const selected = hallTicketSelectableStudents.filter(s => hallTicketSelectedStudents.includes(s.id));
        if (selected.length === 0) {
            alert('Please select at least one student who is ready to publish.');
            return;
        }

        let success = 0;
        for (const student of selected) {
            if (await publishHallTicket(student, true)) success += 1;
        }

        setHallTicketSelectedStudents([]);
        alert(success === selected.length
            ? `Hall Tickets published for ${success} student${success === 1 ? '' : 's'}.`
            : `Published ${success} of ${selected.length} Hall Tickets. Please retry the remaining students.`);
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
        const hall = hallMaster.find(h => h.id === examHallId);
        const exam = examName || examTypes[0];
        if (!examStudentClass || !examStudentSection || selectedExamStudentRecords.length === 0 || !hall) {
            alert('Please select class, section, at least one student and a hall.');
            return;
        }
        if (hall.status === 'Maintenance') {
            alert(`${hall.hallNo} is under maintenance. Choose another hall.`);
            return;
        }
        const dup = selectedExamStudentRecords.find(s => seatedAllocFor(s, exam));
        if (dup) {
            alert(`${dup.name || 'A student'} already has a seat for ${exam}. Untick them or edit their allocation.`);
            return;
        }
        const plan = buildSeatPlan(hall, exam, selectedExamStudentRecords, allocSeatOverrides);
        if (!plan.ok) {
            alert('Some seat numbers are invalid, already taken, or the hall is full. Fix the highlighted seats.');
            return;
        }

        try {
            const studentList = selectedExamStudentRecords.map((s) => ({
                id: s.id,
                name: s.name || 'Student',
                admissionNo: s.admissionNo || '',
                className: s.className || s.grade || examStudentClass,
                sectionName: s.sectionName || s.section || examStudentSection,
                seatNo: plan.map[s.id]
            }));

            await addDoc(collection(db, 'exam_hall_allocations'), {
                hallId: hall.id,
                hallNo: hall.hallNo,
                examName: exam,
                targetClass: examStudentClass,
                targetSection: examStudentSection,
                studentCount: studentList.length,
                capacity: Number(hall.capacity) || studentList.length,
                studentIds: studentList.map(s => s.id),
                studentList,
                createdAt: serverTimestamp()
            });

            setSelectedExamStudents([]);
            setAllocSeatOverrides({});
            setAllocStudentSearch('');
            setAllocRecordsTab('halls');
            alert('Students assigned to the exam hall successfully.');
        } catch (error) {
            console.error('Error assigning students to hall:', error);
            alert('Failed to assign students to the examination hall.');
        }
    };

    const handleStaffHallAssignment = async (e) => {
        e.preventDefault();
        if (selectedExamStaff.length === 0 || !selectedStaffHall || !selectedStaffHallRecord) {
            alert('Please select at least one staff member and an allocated hall.');
            return;
        }

        const chosen = staffList.filter(s => selectedExamStaff.includes(s.id));
        if (chosen.length === 0) return;

        try {
            await Promise.all(chosen.map(staff => addDoc(collection(db, 'staff_exam_halls'), {
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
            })));

            setSelectedExamStaff([]);
            setSelectedStaffHall('');
            setStaffDutyTime('');
            setAllocRecordsTab('duties');
            alert('Staff invigilation duty assigned successfully.');
        } catch (error) {
            console.error('Error assigning staff duty:', error);
            alert('Failed to assign staff duty.');
        }
    };

    // ---------- Allocate: Update / Delete (single + bulk) ----------
    const deleteHalls = async (ids) => {
        if (!ids.length) return;
        const linked = staffExamHalls.filter(d => ids.includes(d.hallAllocationId));
        const msg = `Delete ${ids.length} hall allocation${ids.length > 1 ? 's' : ''}?` +
            (linked.length ? `\n${linked.length} linked staff dut${linked.length > 1 ? 'ies' : 'y'} will also be removed.` : '');
        if (!window.confirm(msg)) return;
        try {
            await Promise.all([
                ...ids.map(id => deleteDoc(doc(db, 'exam_hall_allocations', id))),
                ...linked.map(d => deleteDoc(doc(db, 'staff_exam_halls', d.id)))
            ]);
            setSelectedHallIds(prev => prev.filter(id => !ids.includes(id)));
        } catch (error) {
            console.error('Error deleting hall allocations:', error);
            alert('Failed to delete the selected hall allocations.');
        }
    };

    const deleteDuties = async (ids) => {
        if (!ids.length) return;
        if (!window.confirm(`Delete ${ids.length} staff dut${ids.length > 1 ? 'ies' : 'y'}?`)) return;
        try {
            await Promise.all(ids.map(id => deleteDoc(doc(db, 'staff_exam_halls', id))));
            setSelectedDutyIds(prev => prev.filter(id => !ids.includes(id)));
        } catch (error) {
            console.error('Error deleting staff duties:', error);
            alert('Failed to delete the selected duties.');
        }
    };

    const openEditHall = (hall) => {
        const list = getHallSeatList(hall);
        const matched = hall.hallId || hallMaster.find(h => allocInHall(hall, h))?.id || '';
        setEditHall(hall);
        setEditHallForm({ hallId: matched, examName: hall.examName || examTypes[0] });
        setEditHallAllStudents(list);
        setEditHallKeep(list.map(s => s.id));
        setEditHallSeats(Object.fromEntries(list.map(s => [s.id, String(s.seatNo || '')])));
    };

    // changing hall or exam in the edit window re-suggests seats from that hall's free seats
    const changeEditHallTarget = (hallId, exam) => {
        const hall = hallMaster.find(h => h.id === hallId);
        if (hall) {
            if (hall.status === 'Maintenance') { alert(`${hall.hallNo} is under maintenance.`); return; }
            const kept = editHallAllStudents.filter(s => editHallKeep.includes(s.id));
            const seats = pickFreeSeats(hall, exam, kept.length, editHall.id);
            if (!seats) { alert(`${hall.hallNo} does not have enough free seats for ${exam}.`); return; }
            setEditHallSeats(prev => {
                const next = { ...prev };
                kept.forEach((s, i) => { next[s.id] = String(seats[i]); });
                return next;
            });
        }
        setEditHallForm({ hallId, examName: exam });
    };

    const saveHall = async (e) => {
        e.preventDefault();
        if (!editHall) return;
        const keptBase = editHallAllStudents.filter(s => editHallKeep.includes(s.id));
        if (keptBase.length === 0) {
            alert('Keep at least one student (or delete the allocation instead).');
            return;
        }

        const exam = editHallForm.examName || 'Examination';
        const hall = hallMaster.find(h => h.id === editHallForm.hallId) || null;
        const originalHallId = editHall.hallId || hallMaster.find(h => allocInHall(editHall, h))?.id || '';
        const moved = !!hall && (hall.id !== originalHallId || exam !== (editHall.examName || 'Examination'));
        if (moved && hall.status === 'Maintenance') { alert(`${hall.hallNo} is under maintenance.`); return; }

        // validate the seat numbers typed in the list
        let seatOf;
        if (hall) {
            const plan = buildSeatPlan(hall, exam, keptBase, editHallSeats, editHall.id);
            if (!plan.ok) { alert('Some seat numbers are invalid or already taken. Fix the highlighted seats.'); return; }
            seatOf = (id) => plan.map[id];
        } else {
            const seen = new Set();
            const map = {};
            for (const s of keptBase) {
                const n = Math.floor(Number(editHallSeats[s.id])) || Number(s.seatNo) || 0;
                if (n < 1 || seen.has(n)) { alert('Seat numbers must be unique and at least 1.'); return; }
                seen.add(n);
                map[s.id] = n;
            }
            seatOf = (id) => map[id];
        }
        const kept = keptBase.map(s => ({ ...s, seatNo: seatOf(s.id) }));

        const payload = {
            examName: exam,
            studentCount: kept.length,
            studentIds: kept.map(s => s.id),
            studentList: kept,
            ...(hall ? { hallId: hall.id, hallNo: hall.hallNo, capacity: Number(hall.capacity) || kept.length } : {})
        };
        try {
            await updateDoc(doc(db, 'exam_hall_allocations', editHall.id), { ...payload, updatedAt: serverTimestamp() });
            // keep staff duties for this allocation in sync
            await Promise.all(staffExamHalls.filter(d => d.hallAllocationId === editHall.id).map(d =>
                updateDoc(doc(db, 'staff_exam_halls', d.id), {
                    hallNo: hall ? hall.hallNo : d.hallNo,
                    examName: payload.examName,
                    studentCount: payload.studentCount,
                    studentIds: payload.studentIds,
                    studentList: payload.studentList
                })
            ));
            setEditHall(null);
        } catch (error) {
            console.error('Error updating hall allocation:', error);
            alert('Failed to update the hall allocation.');
        }
    };

    // ---------- Edit a single student's seat (swaps if the seat is taken) ----------
    const saveSeatChange = async (alloc, studentId, rawValue) => {
        if (seatBusy) return;
        const list = getHallSeatList(alloc);
        const me = list.find(s => s.id === studentId);
        if (!me) { setSeatEdit(null); return; }

        const oldSeat = Number(me.seatNo || 0);
        const newSeat = Math.floor(Number(rawValue));
        if (newSeat === oldSeat) { setSeatEdit(null); return; }

        const hall = hallMaster.find(h => allocInHall(alloc, h)) || null;
        const cap = hall ? Number(hall.capacity || 0) : 0;
        if (!newSeat || newSeat < 1 || (cap && newSeat > cap)) {
            alert(cap ? `Enter a seat number between 1 and ${cap}.` : 'Enter a valid seat number.');
            return;
        }

        // who already sits in that seat (same hall, same exam — any class/section)
        const exam = alloc.examName || 'Examination';
        const sameHall = (a) => hall ? allocInHall(a, hall) : normHall(a.hallNo) === normHall(alloc.hallNo);
        let holder = null, holderAlloc = null;
        examHalls.forEach(a => {
            if (holder || !sameHall(a) || (a.examName || 'Examination') !== exam) return;
            const found = getHallSeatList(a).find(s => Number(s.seatNo) === newSeat && !(a.id === alloc.id && s.id === studentId));
            if (found) { holder = found; holderAlloc = a; }
        });

        if (holder && !window.confirm(`Seat ${newSeat} is taken by ${holder.name || 'another student'}.\nSwap seats with them (they move to seat ${oldSeat || '—'})?`)) return;

        const changes = new Map();
        const listFor = (a) => {
            if (!changes.has(a.id)) changes.set(a.id, { alloc: a, list: getHallSeatList(a).map(s => ({ ...s })) });
            return changes.get(a.id).list;
        };
        listFor(alloc).find(s => s.id === studentId).seatNo = newSeat;
        if (holder) listFor(holderAlloc).find(s => s.id === holder.id).seatNo = oldSeat;

        setSeatBusy(true);
        try {
            await Promise.all([...changes.values()].flatMap(({ alloc: a, list: l }) => [
                updateDoc(doc(db, 'exam_hall_allocations', a.id), { studentList: l, updatedAt: serverTimestamp() }),
                // staff duties keep a copy of the student list — keep it in sync
                ...staffExamHalls.filter(d => d.hallAllocationId === a.id)
                    .map(d => updateDoc(doc(db, 'staff_exam_halls', d.id), { studentList: l }))
            ]));
            setSeatEdit(null);
        } catch (error) {
            console.error('Error updating seat:', error);
            alert('Failed to update the seat.');
        }
        setSeatBusy(false);
    };

    const openEditDuty = (duty) => {
        setEditDuty(duty);
        setEditDutyForm({ hallId: duty.hallAllocationId || '', dutyTime: duty.dutyTime || '' });
    };

    const saveDuty = async (e) => {
        e.preventDefault();
        const hall = examHalls.find(h => h.id === editDutyForm.hallId);
        if (!editDuty || !hall) {
            alert('Please select a hall.');
            return;
        }
        const list = getHallSeatList(hall);
        try {
            await updateDoc(doc(db, 'staff_exam_halls', editDuty.id), {
                hallNo: hall.hallNo,
                examName: hall.examName || 'Examination',
                dutyTime: editDutyForm.dutyTime.trim() || 'Exam Duty',
                studentCount: list.length,
                studentIds: list.map(s => s.id),
                studentList: list,
                targetClass: hall.targetClass || '',
                targetSection: hall.targetSection || '',
                hallAllocationId: hall.id,
                updatedAt: serverTimestamp()
            });
            setEditDuty(null);
        } catch (error) {
            console.error('Error updating staff duty:', error);
            alert('Failed to update the duty.');
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

    // ---------- Hall Management sync helpers ----------
    const normHall = (v) => String(v || '').trim().toLowerCase();
    const allocInHall = (a, hall) => a.hallId ? a.hallId === hall.id : normHall(a.hallNo) === normHall(hall.hallNo);
    // seats already taken in a hall for one exam (optionally ignoring one allocation)
    const hallUsage = (hall, exam, excludeId) => {
        const taken = new Set();
        examHalls.forEach(a => {
            if (a.id === excludeId || !allocInHall(a, hall) || (a.examName || 'Examination') !== exam) return;
            getHallSeatList(a).forEach(st => taken.add(Number(st.seatNo)));
        });
        const cap = Number(hall.capacity || 0);
        return { taken, used: taken.size, cap, free: Math.max(cap - taken.size, 0) };
    };
    // the n lowest free seat numbers in a hall, or null if it can't fit n students
    const pickFreeSeats = (hall, exam, n, excludeId) => {
        const { taken, cap } = hallUsage(hall, exam, excludeId);
        const out = [];
        for (let seat = 1; seat <= cap && out.length < n; seat++) if (!taken.has(seat)) out.push(seat);
        return out.length === n ? out : null;
    };

    // Works out a seat for every student: typed-in seats first (validated), the rest fill the lowest free seats
    const buildSeatPlan = (hall, exam, records, overrides, excludeId) => {
        const { taken, cap } = hallUsage(hall, exam, excludeId);
        const used = new Set(taken);
        const map = {};
        const errors = {};
        records.forEach(s => {
            const raw = overrides[s.id];
            if (raw === undefined || raw === '') return;
            const n = Math.floor(Number(raw));
            if (!n || n < 1 || n > cap) errors[s.id] = `Use a seat between 1 and ${cap}`;
            else if (used.has(n)) errors[s.id] = `Seat ${n} is already taken`;
            else { used.add(n); map[s.id] = n; }
        });
        let next = 1;
        records.forEach(s => {
            if (map[s.id] || errors[s.id]) return;
            while (next <= cap && used.has(next)) next++;
            if (next <= cap) { map[s.id] = next; used.add(next); }
            else errors[s.id] = 'No free seat left';
        });
        return { map, errors, ok: Object.keys(errors).length === 0 };
    };

    const allocSelectedHall = hallMaster.find(h => h.id === examHallId) || null;
    const allocFree = allocSelectedHall ? hallUsage(allocSelectedHall, allocExam).free : 0;
    const allocOverflow = !!allocSelectedHall && selectedExamStudents.length > allocFree;
    const allocSeatPlan = allocSelectedHall && selectedExamStudentRecords.length
        ? buildSeatPlan(allocSelectedHall, allocExam, selectedExamStudentRecords, allocSeatOverrides)
        : { map: {}, errors: {}, ok: true };
    const allocSeatNums = Object.values(allocSeatPlan.map);

    const editHallTarget = editHall ? (hallMaster.find(h => h.id === editHallForm.hallId) || null) : null;
    const editHallPlan = editHallTarget
        ? buildSeatPlan(editHallTarget, editHallForm.examName || 'Examination', editHallAllStudents.filter(s => editHallKeep.includes(s.id)), editHallSeats, editHall.id)
        : null;

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
                                <button className={`nav-links ${activeTab === 'hall-management' ? 'active' : ''}`} onClick={() => { setActiveTab('hall-management'); setIsMobileMenuOpen(false); }}>
                                    <div className="nav-links-content"><Building2 size={16} /><span>Hall Management</span></div>
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
                    {activeTab === 'hall-ticket-allocation' && (() => {
                        const clsOf = s => s.className || s.grade;
                        const secOf = s => s.sectionName || s.section;
                        const secLetter = sec => String(sec).replace(/^section\s*/i, '').slice(0, 3).toUpperCase();
                        const step = !hallTicketClass ? 1 : !hallTicketSection ? 2 : 3;
                        const publishedCount = hallTicketListStudents.filter(isHallTicketPublished).length;
                        const selectableIds = hallTicketSelectableStudents.map(s => s.id);
                        const allSelectableChosen = selectableIds.length > 0 && selectableIds.every(id => hallTicketSelectedStudents.includes(id));
                        const selectedCount = hallTicketSelectedStudents.length;
                        const goClass = () => { setHallTicketClass(''); setHallTicketSection(''); setHallTicketSelectedStudents([]); setHallTicketSearch(''); };
                        const goSection = () => { setHallTicketSection(''); setHallTicketSelectedStudents([]); setHallTicketSearch(''); };
                        const blockReason = (fee, allocation) => !fee.paid ? 'Fees pending' : !allocation ? 'No hall allocated' : '';

                        return (
                            <div className="htx">
                                <style>{`
                                    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&display=swap');

                                    .htx{
                                        --ink:#161b33;--ink-2:#3b4262;--muted:#6b7394;--line:#e3e6f0;--paper:#fff;--wash:#f1f2f8;
                                        --signal:#ffb020;--signal-soft:#fff6df;--signal-ink:#5a3a00;
                                        --ok:#0f7a55;--ok-bg:#e2f5ec;--bad:#b42b2b;--bad-bg:#fdeaea;--pub:#3340c9;--pub-bg:#e8eafd;
                                        --display:'Bricolage Grotesque','Segoe UI',system-ui,sans-serif;
                                        display:flex;flex-direction:column;gap:22px;color:var(--ink)
                                    }
                                    .htx *{box-sizing:border-box}
                                    .htx button,.htx input,.htx select{font-family:inherit}
                                    .htx :focus-visible{outline:3px solid var(--signal);outline-offset:2px}

                                    /* ---------- masthead ---------- */
                                    .htx-mast{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap}
                                    .htx-mast h3{margin:0;font-family:var(--display);font-size:2rem;font-weight:800;letter-spacing:-.02em;line-height:1.05;color:var(--ink)}
                                    .htx-mast p{margin:8px 0 0;max-width:480px;font-size:.84rem;line-height:1.5;color:var(--muted)}
                                    .htx-pass{position:relative;display:flex;align-items:stretch;border-radius:16px;background:var(--ink);color:#fff;box-shadow:0 10px 24px rgba(22,27,51,.22)}
                                    .htx-pass-cell{display:flex;flex-direction:column;gap:4px;padding:12px 18px}
                                    .htx-pass-cell span{font-size:.72rem;font-weight:600;color:rgba(255,255,255,.62)}
                                    .htx-pass-cell select{min-width:150px;height:30px;padding:0 24px 0 0;border:0;background:transparent;color:#fff;font-family:var(--display);font-size:1rem;font-weight:700;outline:0;cursor:pointer}
                                    .htx-pass-cell select option{color:#0f172a;font-family:inherit}
                                    .htx-pass-cell.year select{min-width:78px}
                                    .htx-pass-cut{position:relative;width:0;border-left:2px dashed rgba(255,255,255,.28);margin:10px 0}
                                    .htx-pass-cut::before,.htx-pass-cut::after{content:"";position:absolute;left:-11px;width:20px;height:20px;border-radius:50%;background:var(--office-bg,#f5f7fb)}
                                    .htx-pass-cut::before{top:-20px}
                                    .htx-pass-cut::after{bottom:-20px}

                                    /* ---------- progress rail ---------- */
                                    .htx-rail{display:flex;align-items:center;gap:0;padding:6px 4px}
                                    .htx-node{display:inline-flex;align-items:center;gap:10px;padding:6px 14px 6px 6px;border:0;border-radius:999px;background:transparent;color:var(--muted);font-size:.86rem;font-weight:700;cursor:default}
                                    button.htx-node{cursor:pointer}
                                    button.htx-node:hover:not(:disabled){background:var(--wash)}
                                    button.htx-node:disabled{cursor:not-allowed;opacity:.6}
                                    .htx-dot{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;border:2px solid var(--line);background:var(--paper);font-family:var(--display);font-size:.8rem;font-weight:800;color:var(--muted)}
                                    .htx-node.current{color:var(--ink)}
                                    .htx-node.current .htx-dot{border-color:var(--ink);background:var(--signal);color:var(--ink)}
                                    .htx-node.done{color:var(--ink)}
                                    .htx-node.done .htx-dot{border-color:var(--ink);background:var(--ink);color:#fff}
                                    .htx-link{flex:1;min-width:24px;max-width:90px;height:2px;background:var(--line);border-radius:2px}
                                    .htx-link.on{background:var(--ink)}

                                    /* ---------- surface ---------- */
                                    .htx-stage{padding:26px;border:1px solid var(--line);border-radius:22px;background:var(--paper)}
                                    .htx-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:18px}
                                    .htx-head h4{margin:0;font-family:var(--display);font-size:1.25rem;font-weight:700;letter-spacing:-.01em;color:var(--ink)}
                                    .htx-head span{font-size:.8rem;color:var(--muted);font-weight:600}
                                    .htx-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:44px 12px;color:var(--muted);font-size:.86rem;text-align:center}

                                    /* ---------- class picker ---------- */
                                    .htx-classes{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
                                    .htx-class{position:relative;display:flex;flex-direction:column;gap:14px;padding:18px 18px 16px 22px;border:1px solid var(--line);border-radius:14px;background:var(--paper);text-align:left;cursor:pointer;overflow:hidden;transition:border-color .15s,box-shadow .15s}
                                    .htx-class::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--ink);transition:width .15s,background .15s}
                                    .htx-class:hover{border-color:var(--ink);box-shadow:0 8px 20px rgba(22,27,51,.1)}
                                    .htx-class:hover::before{width:10px;background:var(--signal)}
                                    .htx-class strong{font-family:var(--display);font-size:1.7rem;font-weight:800;letter-spacing:-.02em;line-height:1;color:var(--ink)}
                                    .htx-class-meta{display:flex;justify-content:space-between;gap:8px;font-size:.76rem;font-weight:600;color:var(--muted)}
                                    .htx-meter{height:4px;border-radius:4px;background:var(--wash);overflow:hidden}
                                    .htx-meter i{display:block;height:100%;background:var(--pub);border-radius:4px}

                                    /* ---------- section picker ---------- */
                                    .htx-sections{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
                                    .htx-section{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:var(--wash);text-align:left;cursor:pointer;transition:background .15s,border-color .15s}
                                    .htx-section:hover{background:var(--signal-soft);border-color:var(--signal)}
                                    .htx-letter{font-family:var(--display);font-size:3.4rem;font-weight:800;line-height:.95;letter-spacing:-.04em;color:var(--ink)}
                                    .htx-section small{font-size:.76rem;font-weight:600;color:var(--muted)}

                                    /* ---------- students layout ---------- */
                                    .htx-work{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:24px;align-items:start}
                                    .htx-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
                                    .htx-search{flex:1;min-width:200px;display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;border:1px solid var(--line);border-radius:12px;background:var(--paper);color:var(--muted)}
                                    .htx-search:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px var(--signal-soft)}
                                    .htx-search input{flex:1;border:0;outline:0;background:transparent;font-size:.86rem;color:var(--ink)}
                                    .htx-all{display:inline-flex;align-items:center;gap:9px;height:44px;padding:0 16px;border:1px solid var(--line);border-radius:12px;background:var(--paper);font-size:.82rem;font-weight:700;color:var(--ink);cursor:pointer;user-select:none}
                                    .htx-all input,.htx-check{width:18px;height:18px;accent-color:var(--ink);cursor:pointer}
                                    .htx-all:has(input:disabled){opacity:.5;cursor:not-allowed}

                                    .htx-list{display:flex;flex-direction:column;gap:10px;max-height:600px;overflow:auto;padding:12px;border-radius:16px;background:var(--wash)}

                                    /* ticket strip */
                                    .htx-ticket{position:relative;display:grid;grid-template-columns:92px 0 minmax(0,1fr) auto auto;align-items:center;gap:0 18px;min-height:76px;border:1px solid var(--line);border-radius:14px;background:var(--paper);overflow:hidden;cursor:pointer;transition:border-color .15s,background .15s}
                                    .htx-ticket:hover{border-color:var(--ink-2)}
                                    .htx-ticket.selected{border-color:var(--ink);background:var(--signal-soft);box-shadow:0 0 0 1px var(--ink)}
                                    .htx-ticket.locked{cursor:default;background:#f9fafc}
                                    .htx-ticket.locked:hover{border-color:var(--line)}
                                    .htx-ticket.locked .htx-check{cursor:not-allowed}
                                    .htx-stub{display:flex;flex-direction:column;align-items:center;justify-content:center;align-self:stretch;gap:1px;padding:8px 6px;background:var(--ink);color:#fff;text-align:center}
                                    .htx-stub small{max-width:100%;font-size:.68rem;font-weight:600;color:rgba(255,255,255,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                                    .htx-stub b{font-family:var(--display);font-size:1.6rem;font-weight:800;line-height:1.05;letter-spacing:-.02em}
                                    .htx-ticket.selected .htx-stub{background:var(--signal);color:var(--ink)}
                                    .htx-ticket.selected .htx-stub small{color:var(--signal-ink)}
                                    .htx-ticket.locked .htx-stub{background:repeating-linear-gradient(135deg,#e9ebf3 0 6px,#f1f2f8 6px 12px);color:var(--muted)}
                                    .htx-ticket.locked .htx-stub small{color:var(--muted)}
                                    .htx-perf{position:relative;align-self:stretch;width:0;border-left:2px dashed var(--line)}
                                    .htx-perf::before,.htx-perf::after{content:"";position:absolute;left:-10px;width:18px;height:18px;border-radius:50%;background:var(--wash);border:1px solid var(--line)}
                                    .htx-perf::before{top:-10px}
                                    .htx-perf::after{bottom:-10px}
                                    .htx-ticket.selected .htx-perf{border-left-color:var(--ink)}
                                    .htx-who{display:flex;flex-direction:column;gap:2px;min-width:0;padding:10px 0}
                                    .htx-who strong{font-size:.95rem;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                                    .htx-who small{font-size:.76rem;font-weight:600;color:var(--muted)}
                                    .htx-tags{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
                                    .htx-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;font-size:.72rem;font-weight:700;white-space:nowrap}
                                    .htx-chip.paid{background:var(--ok-bg);color:var(--ok)}
                                    .htx-chip.unpaid{background:var(--bad-bg);color:var(--bad)}
                                    .htx-chip.published{background:var(--pub-bg);color:var(--pub)}
                                    .htx-chip.ready{background:var(--ink);color:#fff}
                                    .htx-chip.blocked{background:var(--wash);color:var(--muted)}
                                    .htx-tick{padding-right:18px}

                                    /* ---------- summary panel ---------- */
                                    .htx-side{position:sticky;top:16px;display:flex;flex-direction:column;gap:16px;padding:20px;border:1px solid var(--line);border-radius:18px;background:var(--paper)}
                                    .htx-side-for{font-size:.8rem;color:var(--muted);font-weight:600;line-height:1.4}
                                    .htx-side-for b{display:block;margin-bottom:2px;font-family:var(--display);font-size:1.15rem;font-weight:800;color:var(--ink)}
                                    .htx-big{display:flex;align-items:baseline;gap:8px;padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
                                    .htx-big strong{font-family:var(--display);font-size:3.2rem;font-weight:800;line-height:.9;letter-spacing:-.04em;color:var(--ink)}
                                    .htx-big span{font-size:.82rem;font-weight:600;color:var(--muted)}
                                    .htx-facts{display:grid;gap:9px;margin:0}
                                    .htx-facts div{display:flex;justify-content:space-between;gap:10px;font-size:.82rem}
                                    .htx-facts dt{color:var(--muted);font-weight:600}
                                    .htx-facts dd{margin:0;font-weight:800;color:var(--ink)}
                                    .htx-facts .bad dd{color:var(--bad)}
                                    .htx-facts .ok dd{color:var(--ok)}
                                    .htx-facts .pub dd{color:var(--pub)}
                                    .htx-publish{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;height:50px;border:2px solid var(--ink);border-radius:13px;background:var(--signal);color:var(--ink);font-family:var(--display);font-size:.98rem;font-weight:800;cursor:pointer;box-shadow:3px 3px 0 var(--ink);transition:transform .12s,box-shadow .12s}
                                    .htx-publish:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--ink)}
                                    .htx-publish:active:not(:disabled){transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
                                    .htx-publish:disabled{background:var(--wash);border-color:var(--line);color:var(--muted);box-shadow:none;cursor:not-allowed}
                                    .htx-clear{border:0;background:transparent;color:var(--ink-2);font-size:.82rem;font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
                                    .htx-clear:disabled{opacity:.4;cursor:not-allowed}

                                    /* ---------- responsive ---------- */
                                    @media(max-width:980px){
                                        .htx-work{grid-template-columns:1fr}
                                        .htx-side{position:sticky;top:auto;bottom:10px;z-index:5;order:2;flex-direction:row;align-items:center;flex-wrap:wrap;padding:12px 14px;box-shadow:0 12px 28px rgba(22,27,51,.2)}
                                        .htx-side-for,.htx-facts{display:none}
                                        .htx-big{flex:1;padding:0;border:0}
                                        .htx-big strong{font-size:2rem}
                                        .htx-publish{width:auto;flex:1;min-width:190px}
                                    }
                                    @media(max-width:640px){
                                        .htx-mast h3{font-size:1.6rem}
                                        .htx-pass{width:100%}
                                        .htx-pass-cell{flex:1}
                                        .htx-pass-cell select{min-width:0;width:100%}
                                        .htx-stage{padding:16px}
                                        .htx-link{display:none}
                                        .htx-rail{flex-wrap:wrap;gap:4px}
                                        .htx-ticket{grid-template-columns:72px 0 minmax(0,1fr) auto;gap:0 12px}
                                        .htx-tags{grid-column:3 / 4;grid-row:2;justify-content:flex-start;padding:0 0 10px}
                                        .htx-tick{grid-column:4;grid-row:1 / span 2;padding-right:12px}
                                        .htx-stub{grid-row:1 / span 2}
                                        .htx-perf{grid-row:1 / span 2}
                                    }
                                    @media(prefers-reduced-motion:reduce){.htx *{transition:none!important}}
                                `}</style>

                                {/* Masthead */}
                                <div className="htx-mast">
                                    <div>
                                        <h3>Hall Ticket Allocation</h3>
                                        <p>Choose a class and section, then publish hall tickets for every student whose fees are cleared and who has a seat.</p>
                                    </div>
                                    <div className="htx-pass">
                                        <label className="htx-pass-cell">
                                            <span>Exam</span>
                                            <select value={hallTicketExam} onChange={e => setHallTicketExam(e.target.value)}>
                                                {hallTicketExamOptions.map(exam => <option key={exam} value={exam}>{exam}</option>)}
                                            </select>
                                        </label>
                                        <span className="htx-pass-cut" aria-hidden="true" />
                                        <label className="htx-pass-cell year">
                                            <span>Year</span>
                                            <select value={hallTicketYear} onChange={e => setHallTicketYear(e.target.value)}>
                                                {hallTicketYears.map(year => <option key={year} value={year}>{year}</option>)}
                                            </select>
                                        </label>
                                    </div>
                                </div>

                                {/* Progress rail */}
                                <div className="htx-rail">
                                    <button type="button" className={`htx-node ${step === 1 ? 'current' : 'done'}`} onClick={goClass}>
                                        <span className="htx-dot">{hallTicketClass ? <Check size={14} /> : 1}</span>
                                        <span>{hallTicketClass ? hallTicketClass : 'Class'}</span>
                                    </button>
                                    <span className={`htx-link ${hallTicketClass ? 'on' : ''}`} />
                                    <button type="button" className={`htx-node ${step === 2 ? 'current' : hallTicketSection ? 'done' : ''}`} disabled={!hallTicketClass} onClick={goSection}>
                                        <span className="htx-dot">{hallTicketSection ? <Check size={14} /> : 2}</span>
                                        <span>{hallTicketSection ? `Section ${hallTicketSection}` : 'Section'}</span>
                                    </button>
                                    <span className={`htx-link ${hallTicketSection ? 'on' : ''}`} />
                                    <div className={`htx-node ${step === 3 ? 'current' : ''}`}>
                                        <span className="htx-dot">3</span>
                                        <span>Students</span>
                                    </div>
                                </div>

                                <div className="htx-stage">
                                    {/* STEP 1 — class */}
                                    {step === 1 && (
                                        <>
                                            <div className="htx-head"><h4>Which class?</h4><span>{hallTicketClasses.length} {hallTicketClasses.length === 1 ? 'class' : 'classes'}</span></div>
                                            {hallTicketClasses.length === 0 ? (
                                                <div className="htx-empty"><Users size={26} />No students found in the records.</div>
                                            ) : (
                                                <div className="htx-classes">
                                                    {hallTicketClasses.map(cls => {
                                                        const inClass = studentsList.filter(s => clsOf(s) === cls);
                                                        const pub = inClass.filter(isHallTicketPublished).length;
                                                        return (
                                                            <button type="button" key={cls} className="htx-class" onClick={() => { setHallTicketClass(cls); setHallTicketSection(''); setHallTicketSelectedStudents([]); }}>
                                                                <strong>{cls}</strong>
                                                                <span className="htx-class-meta">
                                                                    <span>{inClass.length} {inClass.length === 1 ? 'student' : 'students'}</span>
                                                                    <span>{pub} published</span>
                                                                </span>
                                                                <span className="htx-meter"><i style={{ width: `${inClass.length ? Math.round((pub / inClass.length) * 100) : 0}%` }} /></span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* STEP 2 — section */}
                                    {step === 2 && (
                                        <>
                                            <div className="htx-head"><h4>Which section of {hallTicketClass}?</h4><span>{hallTicketSections.length} {hallTicketSections.length === 1 ? 'section' : 'sections'}</span></div>
                                            {hallTicketSections.length === 0 ? (
                                                <div className="htx-empty"><Users size={26} />No sections found for this class.</div>
                                            ) : (
                                                <div className="htx-sections">
                                                    {hallTicketSections.map(sec => {
                                                        const inSec = studentsList.filter(s => clsOf(s) === hallTicketClass && secOf(s) === sec);
                                                        const pub = inSec.filter(isHallTicketPublished).length;
                                                        return (
                                                            <button type="button" key={sec} className="htx-section" onClick={() => { setHallTicketSection(sec); setHallTicketSelectedStudents([]); }}>
                                                                <span className="htx-letter">{secLetter(sec)}</span>
                                                                <small>{inSec.length} {inSec.length === 1 ? 'student' : 'students'}, {pub} published</small>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* STEP 3 — bulk select students */}
                                    {step === 3 && (
                                        <>
                                            <div className="htx-head">
                                                <h4>Students in {hallTicketClass}, Section {hallTicketSection}</h4>
                                                <span>{hallTicketListStudents.length} shown</span>
                                            </div>

                                            <div className="htx-work">
                                                <div>
                                                    <div className="htx-bar">
                                                        <div className="htx-search">
                                                            <Search size={16} />
                                                            <input value={hallTicketSearch} onChange={e => setHallTicketSearch(e.target.value)} placeholder="Search by name or admission no." />
                                                        </div>
                                                        <label className="htx-all">
                                                            <input type="checkbox" checked={allSelectableChosen} disabled={selectableIds.length === 0} onChange={toggleAllPaidHallTicketStudents} />
                                                            Select all ready ({selectableIds.length})
                                                        </label>
                                                    </div>

                                                    {hallTicketListStudents.length === 0 ? (
                                                        <div className="htx-list"><div className="htx-empty"><Users size={26} />No students match your search.</div></div>
                                                    ) : (
                                                        <div className="htx-list">
                                                            {hallTicketListStudents.map(student => {
                                                                const fee = getStudentFeeStatus(student);
                                                                const allocation = hallTicketAllocationForStudent(student);
                                                                const published = isHallTicketPublished(student);
                                                                const seat = allocation ? ((allocation.studentList || []).find(x => x.id === student.id)?.seatNo || '—') : '—';
                                                                const selectable = fee.paid && !!allocation && !published;
                                                                const checked = hallTicketSelectedStudents.includes(student.id);
                                                                return (
                                                                    <label key={student.id} className={`htx-ticket ${checked ? 'selected' : ''} ${!selectable ? 'locked' : ''}`} title={blockReason(fee, allocation)}>
                                                                        <span className="htx-stub">
                                                                            <small>{allocation ? (allocation.hallNo || 'Hall') : 'No hall'}</small>
                                                                            <b>{seat}</b>
                                                                            <small>{allocation ? 'Seat' : 'yet'}</small>
                                                                        </span>
                                                                        <span className="htx-perf" aria-hidden="true" />
                                                                        <span className="htx-who">
                                                                            <strong>{student.name || 'Student'}</strong>
                                                                            <small>Adm. {student.admissionNo || student.rollNo || '—'}</small>
                                                                        </span>
                                                                        <span className="htx-tags">
                                                                            <span className={`htx-chip ${fee.paid ? 'paid' : 'unpaid'}`}>{fee.paid ? <CheckCircle size={13} /> : <XCircle size={13} />}{fee.paid ? 'Paid' : 'Not paid'}</span>
                                                                            {published ? (
                                                                                <span className="htx-chip published"><Ticket size={13} /> Published</span>
                                                                            ) : selectable ? (
                                                                                <span className="htx-chip ready"><Check size={13} /> Ready</span>
                                                                            ) : (
                                                                                <span className="htx-chip blocked">{blockReason(fee, allocation)}</span>
                                                                            )}
                                                                        </span>
                                                                        <span className="htx-tick">
                                                                            <input className="htx-check" type="checkbox" checked={checked} disabled={!selectable} onChange={() => toggleHallTicketStudent(student.id)} aria-label={`Select ${student.name || 'student'}`} />
                                                                        </span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Summary + bulk action */}
                                                <aside className="htx-side">
                                                    <div className="htx-side-for">
                                                        <b>{hallTicketClass}, Section {hallTicketSection}</b>
                                                        {hallTicketExam}, {hallTicketYear}
                                                    </div>
                                                    <div className="htx-big">
                                                        <strong>{selectedCount}</strong>
                                                        <span>selected of {hallTicketSelectableStudents.length} ready</span>
                                                    </div>
                                                    <dl className="htx-facts">
                                                        <div className="ok"><dt>Ready to publish</dt><dd>{hallTicketSelectableStudents.length}</dd></div>
                                                        <div className="bad"><dt>Fees pending</dt><dd>{unpaidHallTicketStudents.length}</dd></div>
                                                        <div className="pub"><dt>Already published</dt><dd>{publishedCount}</dd></div>
                                                    </dl>
                                                    <button type="button" className="htx-publish" onClick={publishSelectedHallTickets} disabled={selectedCount === 0}>
                                                        <Ticket size={18} /> Publish {selectedCount || ''} hall ticket{selectedCount === 1 ? '' : 's'}
                                                    </button>
                                                    <button type="button" className="htx-clear" onClick={() => setHallTicketSelectedStudents([])} disabled={selectedCount === 0}>
                                                        Clear selection
                                                    </button>
                                                </aside>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

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

                    {/* HALL MANAGEMENT */}
                    {activeTab === 'hall-management' && (
                        <HallManagement
                            halls={hallMaster}
                            allocations={examHalls}
                            duties={staffExamHalls}
                            examTypes={examTypes}
                            getSeatList={getHallSeatList}
                            allocInHall={allocInHall}
                            onOpenAllocate={() => { setActiveTab('exam-halls'); setAllocMode('students'); }}
                        />
                    )}

                    {/* EXAM HALL ALLOCATION MODULE — guided Students / Staff flow */}
                    {activeTab === 'exam-halls' && (
                        <div className="alloc-page">
                            {/* Header */}
                            <div className="dash-card full-width alloc-hero">
                                <div>
                                    <span className="alloc-kicker">EXAMINATION MANAGEMENT</span>
                                    <h3>Allocate</h3>
                                    <p className="subtitle">Seat students in exam halls, then assign staff to invigilate them.</p>
                                </div>
                                <div className="alloc-hero-stats">
                                    <div><strong>{examHalls.length}</strong><span>Halls</span></div>
                                    <div><strong>{examHalls.reduce((n, h) => n + Number(h.studentCount || h.studentIds?.length || 0), 0)}</strong><span>Seated</span></div>
                                    <div><strong>{staffExamHalls.length}</strong><span>Duties</span></div>
                                </div>
                            </div>

                            {/* STEP 0 — choose who to allocate */}
                            <div className="alloc-mode-grid">
                                <button type="button" className={`alloc-mode-card students ${allocMode === 'students' ? 'active' : ''}`} onClick={() => { setAllocMode('students'); }}>
                                    <span className="alloc-mode-icon"><GraduationCap size={26} /></span>
                                    <span className="alloc-mode-copy">
                                        <strong>Students</strong>
                                        <small>Choose class → section → students and give them seats in a hall</small>
                                    </span>
                                    {allocMode === 'students' && <CheckCircle size={20} className="alloc-mode-check" />}
                                </button>
                                <button type="button" className={`alloc-mode-card staff ${allocMode === 'staff' ? 'active' : ''}`} onClick={() => { setAllocMode('staff'); }}>
                                    <span className="alloc-mode-icon"><UserCheck size={26} /></span>
                                    <span className="alloc-mode-copy">
                                        <strong>Staff</strong>
                                        <small>Search and pick staff, then assign them invigilation duty in a hall</small>
                                    </span>
                                    {allocMode === 'staff' && <CheckCircle size={20} className="alloc-mode-check" />}
                                </button>
                            </div>

                            {!allocMode && (
                                <div className="dash-card alloc-placeholder">
                                    <LayoutGrid size={28} />
                                    <strong>Select Students or Staff to begin</strong>
                                    <span>Your allocation steps will appear here.</span>
                                </div>
                            )}

                            {/* ============ STUDENTS FLOW ============ */}
                            {allocMode === 'students' && (
                                <div className="dash-card alloc-flow">
                                    {/* Breadcrumb / stepper */}
                                    <div className="alloc-steps">
                                        <button type="button" className={`alloc-step ${!examStudentClass ? 'current' : 'done'}`} onClick={() => { setExamStudentClass(''); setExamStudentSection(''); setSelectedExamStudents([]); setAllocStudentSearch(''); }}>
                                            <span className="alloc-step-no">{examStudentClass ? <Check size={13} /> : 1}</span>
                                            <span>Class{examStudentClass ? `: ${examStudentClass}` : ''}</span>
                                        </button>
                                        <span className="alloc-step-line" />
                                        <button type="button" className={`alloc-step ${examStudentClass && !examStudentSection ? 'current' : examStudentSection ? 'done' : ''}`} disabled={!examStudentClass} onClick={() => { setExamStudentSection(''); setSelectedExamStudents([]); setAllocStudentSearch(''); }}>
                                            <span className="alloc-step-no">{examStudentSection ? <Check size={13} /> : 2}</span>
                                            <span>Section{examStudentSection ? `: ${examStudentSection}` : ''}</span>
                                        </button>
                                        <span className="alloc-step-line" />
                                        <div className={`alloc-step ${examStudentClass && examStudentSection ? 'current' : ''}`}>
                                            <span className="alloc-step-no">3</span>
                                            <span>Students</span>
                                        </div>
                                    </div>

                                    {/* Step 1 — class */}
                                    {!examStudentClass && (
                                        <>
                                            <div className="alloc-section-title"><h4>Select a class</h4><span>{uniqueClasses.length} classes</span></div>
                                            {uniqueClasses.length === 0 ? (
                                                <div className="exam-empty-state"><Users size={22} /><span>No students found in the records.</span></div>
                                            ) : (
                                                <div className="alloc-tile-grid">
                                                    {uniqueClasses.map(cls => {
                                                        const count = studentsList.filter(s => (s.className || s.grade) === cls).length;
                                                        return (
                                                            <button type="button" key={cls} className="alloc-tile" onClick={() => { setExamStudentClass(cls); setExamStudentSection(''); setSelectedExamStudents([]); }}>
                                                                <span className="alloc-tile-icon"><GraduationCap size={18} /></span>
                                                                <strong>{cls}</strong>
                                                                <small>{count} {count === 1 ? 'student' : 'students'}</small>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Step 2 — section */}
                                    {examStudentClass && !examStudentSection && (
                                        <>
                                            <div className="alloc-section-title"><h4>Select a section of {examStudentClass}</h4><span>{examSections.length} sections</span></div>
                                            {examSections.length === 0 ? (
                                                <div className="exam-empty-state"><Users size={22} /><span>No sections found for this class.</span></div>
                                            ) : (
                                                <div className="alloc-tile-grid">
                                                    {examSections.map(sec => {
                                                        const count = studentsList.filter(s => (s.className || s.grade) === examStudentClass && (s.sectionName || s.section) === sec).length;
                                                        return (
                                                            <button type="button" key={sec} className="alloc-tile section" onClick={() => { setExamStudentSection(sec); setSelectedExamStudents([]); }}>
                                                                <span className="alloc-tile-icon"><LayoutGrid size={18} /></span>
                                                                <strong>Section {sec}</strong>
                                                                <small>{count} {count === 1 ? 'student' : 'students'}</small>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Step 3 — student list + hall details */}
                                    {examStudentClass && examStudentSection && (
                                        <form onSubmit={handleStudentHallAllocation} className="alloc-student-layout">
                                            <div className="alloc-panel">
                                                <div className="alloc-section-title">
                                                    <h4>Students — {examStudentClass} / {examStudentSection}</h4>
                                                    <span className="alloc-count-pill">{selectedExamStudents.length} of {examClassStudents.length} selected</span>
                                                </div>
                                                <div className="alloc-toolbar">
                                                    <div className="alloc-search">
                                                        <Search size={16} />
                                                        <input value={allocStudentSearch} onChange={e => setAllocStudentSearch(e.target.value)} placeholder="Search by name or admission no." />
                                                    </div>
                                                    <label className="alloc-check-all">
                                                        <input type="checkbox" checked={allocSelectableStudents.length > 0 && allocSelectableStudents.every(s => selectedExamStudents.includes(s.id))} onChange={() => {
                                                            const ids = allocSelectableStudents.map(s => s.id);
                                                            const all = ids.length > 0 && ids.every(id => selectedExamStudents.includes(id));
                                                            setSelectedExamStudents(prev => all ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])));
                                                        }} />
                                                        Select all
                                                    </label>
                                                </div>
                                                {allocVisibleStudents.length === 0 ? (
                                                    <div className="exam-empty-state"><Users size={22} /><span>No students match.</span></div>
                                                ) : (
                                                    <div className="alloc-list">
                                                        {allocVisibleStudents.map(student => {
                                                            const already = seatedAllocFor(student, allocExam);
                                                            const checked = selectedExamStudents.includes(student.id);
                                                            return (
                                                                <label className={`alloc-row ${checked ? 'selected' : ''} ${already ? 'disabled' : ''}`} key={student.id}>
                                                                    <input type="checkbox" checked={checked} disabled={!!already} onChange={() => toggleExamStudent(student.id)} />
                                                                    <span className="alloc-avatar">{(student.name || 'S').charAt(0).toUpperCase()}</span>
                                                                    <span className="alloc-row-info">
                                                                        <strong>{student.name || 'Student'}</strong>
                                                                        <small>#{student.admissionNo || student.rollNo || student.id.slice(0, 7)}</small>
                                                                    </span>
                                                                    {already && <span className="alloc-tag warn">Seated · {already.hallNo}</span>}
                                                                    {checked && allocSelectedHall && (
                                                                        <span className={`alloc-seat-input ${allocSeatPlan.errors[student.id] ? 'err' : ''}`} title={allocSeatPlan.errors[student.id] || 'Edit seat number'} onClick={e => e.preventDefault()}>
                                                                            <small>Seat</small>
                                                                            <input
                                                                                type="number" min="1"
                                                                                value={allocSeatOverrides[student.id] ?? (allocSeatPlan.map[student.id] ?? '')}
                                                                                onChange={e => setAllocSeatOverrides(prev => ({ ...prev, [student.id]: e.target.value }))}
                                                                                onBlur={() => setAllocSeatOverrides(prev => {
                                                                                    if (prev[student.id] !== '') return prev;
                                                                                    const { [student.id]: _drop, ...rest } = prev;
                                                                                    return rest;
                                                                                })}
                                                                            />
                                                                        </span>
                                                                    )}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <aside className="alloc-panel alloc-side">
                                                <div className="alloc-section-title"><h4>Hall details</h4></div>
                                                <div className="alloc-field">
                                                    <label>Exam</label>
                                                    <select value={examName} onChange={e => setExamName(e.target.value)}>
                                                        {examTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                                    </select>
                                                </div>
                                                <div className="alloc-field">
                                                    <label>Hall</label>
                                                    <select value={examHallId} onChange={e => setExamHallId(e.target.value)} required>
                                                        <option value="">{hallMaster.length ? 'Select a hall' : 'No halls added yet'}</option>
                                                        {hallMaster.filter(h => h.status !== 'Maintenance').map(h => {
                                                            const u = hallUsage(h, allocExam);
                                                            return <option key={h.id} value={h.id} disabled={u.free <= 0}>{h.hallNo} — {u.free} of {h.capacity} seats free{u.free <= 0 ? ' (full)' : ''}</option>;
                                                        })}
                                                    </select>
                                                    {hallMaster.length === 0 && (
                                                        <small className="alloc-hint">Add halls first in <button type="button" className="hm-link" onClick={() => setActiveTab('hall-management')}>Hall Management</button>.</small>
                                                    )}
                                                </div>
                                                {allocSelectedHall && (
                                                    <div className="alloc-hall-preview">
                                                        <strong>{allocSelectedHall.hallNo}{allocSelectedHall.location ? ` · ${allocSelectedHall.location}` : ''}</strong>
                                                        <span>{allocSelectedHall.capacity} seats · {allocFree} free for {allocExam}</span>
                                                        <div className="hm-bar" style={{ marginTop: 6 }}>
                                                            <i className={allocOverflow ? 'full' : 'ok'} style={{ width: `${Math.min(100, Math.round(((allocSelectedHall.capacity - allocFree + selectedExamStudents.length) / allocSelectedHall.capacity) * 100))}%` }} />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="alloc-summary">
                                                    <div><span>Class / Section</span><strong>{examStudentClass} / {examStudentSection}</strong></div>
                                                    <div><span>Students</span><strong>{selectedExamStudents.length}</strong></div>
                                                    <div><span>Seats</span><strong>{allocSeatNums.length ? `${Math.min(...allocSeatNums)} – ${Math.max(...allocSeatNums)}` : '—'}</strong></div>
                                                </div>
                                                {Object.keys(allocSeatOverrides).length > 0 && (
                                                    <button type="button" className="hm-link" style={{ marginBottom: 12 }} onClick={() => setAllocSeatOverrides({})}>Reset to automatic seats</button>
                                                )}
                                                {!allocOverflow && !allocSeatPlan.ok && (
                                                    <div className="alloc-warning">Some seat numbers are invalid or already taken — fix the highlighted seats.</div>
                                                )}
                                                {allocOverflow && (
                                                    <div className="alloc-warning">Only {allocFree} seat{allocFree === 1 ? '' : 's'} free in this hall — deselect {selectedExamStudents.length - allocFree} student{selectedExamStudents.length - allocFree === 1 ? '' : 's'} or pick another hall.</div>
                                                )}
                                                <button type="submit" className="alloc-btn" disabled={!selectedExamStudents.length || !allocSelectedHall || allocOverflow || !allocSeatPlan.ok}>
                                                    <CheckSquare size={16} /> Allocate Seats
                                                </button>
                                            </aside>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* ============ STAFF FLOW ============ */}
                            {allocMode === 'staff' && (
                                <div className="dash-card alloc-flow">
                                    <form onSubmit={handleStaffHallAssignment} className="alloc-student-layout">
                                        <div className="alloc-panel">
                                            <div className="alloc-section-title">
                                                <h4>Select staff</h4>
                                                <span className="alloc-count-pill">{selectedExamStaff.length} selected</span>
                                            </div>
                                            <div className="alloc-toolbar">
                                                <div className="alloc-search">
                                                    <Search size={16} />
                                                    <input value={examStaffSearch} onChange={e => setExamStaffSearch(e.target.value)} placeholder="Search staff by name, department or subject" />
                                                </div>
                                                <label className="alloc-check-all">
                                                    <input type="checkbox" checked={allocVisibleStaff.length > 0 && allocVisibleStaff.every(st => selectedExamStaff.includes(st.id))} onChange={() => {
                                                        const ids = allocVisibleStaff.map(st => st.id);
                                                        const all = ids.length > 0 && ids.every(id => selectedExamStaff.includes(id));
                                                        setSelectedExamStaff(prev => all ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])));
                                                    }} />
                                                    Select all
                                                </label>
                                            </div>
                                            {allocVisibleStaff.length === 0 ? (
                                                <div className="exam-empty-state"><Users size={22} /><span>{staffList.length === 0 ? 'No staff records found.' : 'No staff match your search.'}</span></div>
                                            ) : (
                                                <div className="alloc-list">
                                                    {allocVisibleStaff.map(staff => {
                                                        const checked = selectedExamStaff.includes(staff.id);
                                                        const duties = staffExamHalls.filter(d => d.staffId === staff.id);
                                                        const nm = staff.name || staff.staffName || 'Staff';
                                                        return (
                                                            <label className={`alloc-row ${checked ? 'selected' : ''}`} key={staff.id}>
                                                                <input type="checkbox" checked={checked} onChange={() => setSelectedExamStaff(prev => prev.includes(staff.id) ? prev.filter(id => id !== staff.id) : [...prev, staff.id])} />
                                                                <span className="alloc-avatar staff">{nm.charAt(0).toUpperCase()}</span>
                                                                <span className="alloc-row-info">
                                                                    <strong>{nm}</strong>
                                                                    <small>{[staff.department, staff.subject, staff.designation].filter(Boolean).join(' · ') || 'Staff member'}</small>
                                                                </span>
                                                                {duties.length > 0 && <span className="alloc-tag info">{duties.length} {duties.length === 1 ? 'duty' : 'duties'}</span>}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <aside className="alloc-panel alloc-side">
                                            <div className="alloc-section-title"><h4>Invigilation duty</h4></div>
                                            <div className="alloc-field">
                                                <label>Hall</label>
                                                <select value={selectedStaffHall} onChange={e => setSelectedStaffHall(e.target.value)} required>
                                                    <option value="">Select allocated hall</option>
                                                    {examHalls.map(hall => <option key={hall.id} value={hall.id}>{hall.hallNo} — {hall.targetClass || ''}{hall.targetSection ? ` / ${hall.targetSection}` : ''} ({hall.studentCount || hall.studentIds?.length || 0})</option>)}
                                                </select>
                                                {examHalls.length === 0 && <small className="alloc-hint">Allocate students to a hall first.</small>}
                                            </div>
                                            <div className="alloc-field">
                                                <label>Duty time / slot</label>
                                                <input value={staffDutyTime} onChange={e => setStaffDutyTime(e.target.value)} placeholder="e.g. 09:30 AM - 12:30 PM" />
                                            </div>
                                            {selectedStaffHallRecord && (
                                                <div className="alloc-hall-preview">
                                                    <strong>{selectedStaffHallRecord.hallNo}</strong>
                                                    <span>{selectedStaffHallRecord.examName || 'Examination'} · {staffHallStudents.length || selectedStaffHallRecord.studentCount || 0} students</span>
                                                </div>
                                            )}
                                            <div className="alloc-summary">
                                                <div><span>Staff</span><strong>{selectedExamStaff.length}</strong></div>
                                                <div><span>Hall</span><strong>{selectedStaffHallRecord?.hallNo || '—'}</strong></div>
                                            </div>
                                            <button type="submit" className="alloc-btn staff" disabled={!selectedExamStaff.length || !selectedStaffHall}>
                                                <UserCheck size={16} /> Assign Invigilation Duty
                                            </button>
                                        </aside>
                                    </form>
                                </div>
                            )}

                            {/* ============ RECORDS ============ */}
                            <div className="dash-card alloc-records">
                                <div className="alloc-record-tabs">
                                    <button type="button" className={allocRecordsTab === 'halls' ? 'active' : ''} onClick={() => setAllocRecordsTab('halls')}>Allocated halls <span>{examHalls.length}</span></button>
                                    <button type="button" className={allocRecordsTab === 'seating' ? 'active' : ''} onClick={() => setAllocRecordsTab('seating')}>Seating arrangement <span>{seatingClasses.length}</span></button>
                                    <button type="button" className={allocRecordsTab === 'duties' ? 'active' : ''} onClick={() => setAllocRecordsTab('duties')}>Staff duties <span>{staffExamHalls.length}</span></button>
                                </div>

                                {(allocRecordsTab === 'halls' || allocRecordsTab === 'duties') && (
                                    <div className="alloc-records-bar">
                                        <div className="alloc-search">
                                            <Search size={16} />
                                            <input value={allocRecordSearch} onChange={e => setAllocRecordSearch(e.target.value)} placeholder={allocRecordsTab === 'halls' ? 'Search hall, class, section or exam' : 'Search staff, hall or duty time'} />
                                        </div>
                                        {(allocRecordsTab === 'halls' ? hallSel.length : dutySel.length) > 0 && (
                                            <>
                                                <span className="alloc-count-pill">{allocRecordsTab === 'halls' ? hallSel.length : dutySel.length} selected</span>
                                                <button type="button" className="alloc-danger-btn" onClick={() => allocRecordsTab === 'halls' ? deleteHalls(hallSel) : deleteDuties(dutySel)}>
                                                    <Trash2 size={15} /> Delete selected
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {allocRecordsTab === 'halls' && (
                                    <div className="exam-allocation-table-wrap">
                                        <table className="custom-table exam-allocation-table">
                                            <thead><tr>
                                                <th style={{ width: 36 }}><input type="checkbox" className="alloc-cb" title="Select all" checked={allocFilteredHalls.length > 0 && allocFilteredHalls.every(h => hallSel.includes(h.id))} onChange={() => {
                                                    const ids = allocFilteredHalls.map(h => h.id);
                                                    const all = ids.length > 0 && ids.every(id => hallSel.includes(id));
                                                    setSelectedHallIds(prev => all ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])));
                                                }} /></th>
                                                <th>Hall</th><th>Class / Section</th><th>Students</th><th>Seat Nos.</th><th>Exam</th><th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr></thead>
                                            <tbody>
                                                {allocFilteredHalls.length === 0 ? <tr><td colSpan="7" className="exam-table-empty">{examHalls.length === 0 ? 'No student hall allocations yet.' : 'No halls match your search.'}</td></tr> : allocFilteredHalls.map(item => (
                                                    <tr key={item.id} className={hallSel.includes(item.id) ? 'alloc-tr-selected' : ''}>
                                                        <td><input type="checkbox" className="alloc-cb" checked={hallSel.includes(item.id)} onChange={() => setSelectedHallIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])} /></td>
                                                        <td><strong>{item.hallNo}</strong></td>
                                                        <td><span className="task-target-tag">{item.targetClass || '—'} / {item.targetSection || '—'}</span></td>
                                                        <td><span className="exam-count-badge">{item.studentCount || item.studentIds?.length || 0}</span></td>
                                                        <td><span className="exam-seat-range">{Array.isArray(item.studentList) && item.studentList.length ? `1–${item.studentList.length}` : '—'}</span></td>
                                                        <td>{item.examName || 'Examination'}</td>
                                                        <td>
                                                            <div className="alloc-actions">
                                                                <button type="button" className="alloc-icon-btn" title="Edit" onClick={() => openEditHall(item)}><Pencil size={14} /></button>
                                                                <button type="button" className="alloc-icon-btn danger" title="Delete" onClick={() => deleteHalls([item.id])}><Trash2 size={14} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {allocRecordsTab === 'seating' && (
                                    <div>
                                        <select className="custom-select full-width seat-filter-select" value={seatingFilterClass} onChange={e => setSeatingFilterClass(e.target.value)}>
                                            <option value="all">All Classes</option>
                                            {seatingClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                        </select>
                                        {seatingClasses.length === 0 ? (
                                            <div className="exam-empty-state"><Users size={22} /><span>No seating arrangements yet. Allocate students to a hall first.</span></div>
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
                                                        <button type="button" onClick={() => setOpenSeatingClasses(prev => ({ ...prev, [cls]: !prev[cls] }))} className="seat-class-toggle">
                                                            <span className="seat-class-title">
                                                                <GraduationCap size={16} /> {cls}
                                                                <small>{classHalls.length} {classHalls.length === 1 ? 'hall' : 'halls'} · {totalStudents} students</small>
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
                                                                        <thead><tr><th>Seat No <small style={{ fontWeight: 600, color: '#94a3b8' }}>(editable)</small></th><th>Student Name</th><th>Admission No</th><th>Section</th></tr></thead>
                                                                        <tbody>
                                                                            {getHallSeatList(hall).map(st => (
                                                                                <tr key={st.id}>
                                                                                    <td>
                                                                                        {seatEdit && seatEdit.allocId === hall.id && seatEdit.studentId === st.id ? (
                                                                                            <span className="alloc-seat-edit">
                                                                                                <input
                                                                                                    type="number" min="1" autoFocus
                                                                                                    value={seatEdit.value}
                                                                                                    onChange={e => setSeatEdit(prev => ({ ...prev, value: e.target.value }))}
                                                                                                    onKeyDown={e => {
                                                                                                        if (e.key === 'Enter') { e.preventDefault(); saveSeatChange(hall, st.id, seatEdit.value); }
                                                                                                        if (e.key === 'Escape') setSeatEdit(null);
                                                                                                    }}
                                                                                                />
                                                                                                <button type="button" className="alloc-icon-btn ok" title="Save" disabled={seatBusy} onClick={() => saveSeatChange(hall, st.id, seatEdit.value)}><Check size={14} /></button>
                                                                                                <button type="button" className="alloc-icon-btn" title="Cancel" onClick={() => setSeatEdit(null)}><X size={14} /></button>
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="alloc-seat-view">
                                                                                                <span className="exam-seat-range">{st.seatNo || '—'}</span>
                                                                                                <button type="button" className="alloc-icon-btn sm" title="Edit seat" onClick={() => setSeatEdit({ allocId: hall.id, studentId: st.id, value: String(st.seatNo || '') })}><Pencil size={12} /></button>
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
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
                                )}

                                {allocRecordsTab === 'duties' && (
                                    <div className="exam-allocation-table-wrap">
                                        <table className="custom-table exam-allocation-table">
                                            <thead><tr>
                                                <th style={{ width: 36 }}><input type="checkbox" className="alloc-cb" title="Select all" checked={allocFilteredDuties.length > 0 && allocFilteredDuties.every(d => dutySel.includes(d.id))} onChange={() => {
                                                    const ids = allocFilteredDuties.map(d => d.id);
                                                    const all = ids.length > 0 && ids.every(id => dutySel.includes(id));
                                                    setSelectedDutyIds(prev => all ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])));
                                                }} /></th>
                                                <th>Staff</th><th>Hall</th><th>Students</th><th>Duty Time</th><th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr></thead>
                                            <tbody>
                                                {allocFilteredDuties.length === 0 ? <tr><td colSpan="6" className="exam-table-empty">{staffExamHalls.length === 0 ? 'No staff duties assigned yet.' : 'No duties match your search.'}</td></tr> : allocFilteredDuties.map(item => (
                                                    <tr key={item.id} className={dutySel.includes(item.id) ? 'alloc-tr-selected' : ''}>
                                                        <td><input type="checkbox" className="alloc-cb" checked={dutySel.includes(item.id)} onChange={() => setSelectedDutyIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])} /></td>
                                                        <td><strong>{item.staffName}</strong></td>
                                                        <td>{item.hallNo}</td>
                                                        <td><span className="exam-count-badge">{item.studentCount || item.studentIds?.length || 0}</span></td>
                                                        <td><span className="task-target-tag">{item.dutyTime || 'Exam Duty'}</span></td>
                                                        <td>
                                                            <div className="alloc-actions">
                                                                <button type="button" className="alloc-icon-btn" title="Edit" onClick={() => openEditDuty(item)}><Pencil size={14} /></button>
                                                                <button type="button" className="alloc-icon-btn danger" title="Delete" onClick={() => deleteDuties([item.id])}><Trash2 size={14} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* ============ EDIT MODALS ============ */}
                            {editHall && (
                                <div className="alloc-modal-backdrop" onClick={() => setEditHall(null)}>
                                    <form className="alloc-modal" onClick={e => e.stopPropagation()} onSubmit={saveHall}>
                                        <div className="alloc-modal-head">
                                            <div><h4>Edit hall allocation</h4><small>{editHall.targetClass || '—'} / {editHall.targetSection || '—'}</small></div>
                                            <button type="button" className="alloc-icon-btn" onClick={() => setEditHall(null)}><X size={16} /></button>
                                        </div>
                                        <div className="alloc-modal-body">
                                            <div className="alloc-modal-grid">
                                                <div className="alloc-field">
                                                    <label>Hall</label>
                                                    <select value={editHallForm.hallId} onChange={e => changeEditHallTarget(e.target.value, editHallForm.examName)}>
                                                        {!editHallForm.hallId && <option value="">{editHall.hallNo} (not in Hall Management)</option>}
                                                        {hallMaster.map(h => <option key={h.id} value={h.id}>{h.hallNo} — {h.capacity} seats{h.status === 'Maintenance' ? ' (maintenance)' : ''}</option>)}
                                                    </select>
                                                </div>
                                                <div className="alloc-field">
                                                    <label>Exam</label>
                                                    <select value={editHallForm.examName} onChange={e => changeEditHallTarget(editHallForm.hallId, e.target.value)}>
                                                        {Array.from(new Set([...examTypes, editHallForm.examName].filter(Boolean))).map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="alloc-section-title">
                                                <h4>Students in this hall</h4>
                                                <span className="alloc-count-pill">{editHallKeep.length} of {editHallAllStudents.length} kept</span>
                                            </div>
                                            <label className="alloc-check-all" style={{ marginBottom: 10 }}>
                                                <input type="checkbox" checked={editHallAllStudents.length > 0 && editHallKeep.length === editHallAllStudents.length} onChange={() => setEditHallKeep(editHallKeep.length === editHallAllStudents.length ? [] : editHallAllStudents.map(s => s.id))} />
                                                Select all
                                            </label>
                                            <div className="alloc-list" style={{ maxHeight: 260 }}>
                                                {editHallAllStudents.map(st => (
                                                    <label key={st.id} className={`alloc-row ${editHallKeep.includes(st.id) ? 'selected' : ''}`}>
                                                        <input type="checkbox" checked={editHallKeep.includes(st.id)} onChange={() => setEditHallKeep(prev => prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id])} />
                                                        <span className="alloc-avatar">{(st.name || 'S').charAt(0).toUpperCase()}</span>
                                                        <span className="alloc-row-info"><strong>{st.name || 'Student'}</strong><small>#{st.admissionNo || '—'}</small></span>
                                                        {editHallKeep.includes(st.id) && (
                                                            <span className={`alloc-seat-input ${editHallPlan?.errors[st.id] ? 'err' : ''}`} title={editHallPlan?.errors[st.id] || 'Edit seat number'} onClick={e => e.preventDefault()}>
                                                                <small>Seat</small>
                                                                <input type="number" min="1" value={editHallSeats[st.id] ?? ''} onChange={e => setEditHallSeats(prev => ({ ...prev, [st.id]: e.target.value }))} />
                                                            </span>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                            <p className="alloc-hint" style={{ marginTop: 10 }}>Type a new number to change a student's seat. Unticked students are removed and their seats become free. Changing the hall or exam suggests new seats from that hall's free seats. Linked staff duties are updated too.</p>
                                        </div>
                                        <div className="alloc-modal-foot">
                                            <button type="button" className="alloc-ghost-btn" onClick={() => setEditHall(null)}>Cancel</button>
                                            <button type="submit" className="alloc-btn" style={{ width: 'auto', padding: '0 22px' }} disabled={!editHallKeep.length || (!!editHallPlan && !editHallPlan.ok)}>Save changes</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {editDuty && (
                                <div className="alloc-modal-backdrop" onClick={() => setEditDuty(null)}>
                                    <form className="alloc-modal small" onClick={e => e.stopPropagation()} onSubmit={saveDuty}>
                                        <div className="alloc-modal-head">
                                            <div><h4>Edit invigilation duty</h4><small>{editDuty.staffName}</small></div>
                                            <button type="button" className="alloc-icon-btn" onClick={() => setEditDuty(null)}><X size={16} /></button>
                                        </div>
                                        <div className="alloc-modal-body">
                                            <div className="alloc-field">
                                                <label>Hall</label>
                                                <select value={editDutyForm.hallId} onChange={e => setEditDutyForm(f => ({ ...f, hallId: e.target.value }))} required>
                                                    <option value="">Select allocated hall</option>
                                                    {examHalls.map(hall => <option key={hall.id} value={hall.id}>{hall.hallNo} — {hall.targetClass || ''}{hall.targetSection ? ` / ${hall.targetSection}` : ''}</option>)}
                                                </select>
                                            </div>
                                            <div className="alloc-field">
                                                <label>Duty time / slot</label>
                                                <input value={editDutyForm.dutyTime} onChange={e => setEditDutyForm(f => ({ ...f, dutyTime: e.target.value }))} placeholder="e.g. 09:30 AM - 12:30 PM" />
                                            </div>
                                        </div>
                                        <div className="alloc-modal-foot">
                                            <button type="button" className="alloc-ghost-btn" onClick={() => setEditDuty(null)}>Cancel</button>
                                            <button type="submit" className="alloc-btn staff" style={{ width: 'auto', padding: '0 22px' }} disabled={!editDutyForm.hallId}>Save changes</button>
                                        </div>
                                    </form>
                                </div>
                            )}
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