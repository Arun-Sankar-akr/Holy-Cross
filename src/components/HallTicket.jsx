import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../service/firebase';
import logo from '../assets/logo.png';
import principalSignature from '../assets/signature.png';
import {
    collection,
    onSnapshot
} from 'firebase/firestore';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    FileText,
    LockKeyhole,
    LogIn,
    MapPin,
    Printer,
    RefreshCw,
    ShieldCheck,
    Ticket,
    User,
    UserRound,
    XCircle
} from 'lucide-react';
import './HallTicket.css';

const normalize = (value = '') =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');

const normalizeDate = (value) => {
    if (!value) return '';

    if (typeof value === 'object' && value?.toDate) {
        const d = value.toDate();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const raw = String(value).trim();

    // Already an HTML/date Firestore string: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    // Support DD/MM/YYYY, DD-MM-YYYY and DD.MM.YYYY
    const match = raw.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
    if (match) {
        const [, day, month, year] = match;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    return raw;
};

const formatDate = (value) => {
    if (!value) return '—';

    const normalized = normalizeDate(value);
    const date = new Date(`${normalized}T00:00:00`);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

// Alias used by the Hall Ticket preview. Keeping this wrapper prevents
// preview rendering from failing if a timetable row uses this helper name.
const formatHallTicketDate = (value) => formatDate(value);

const sortHallTicketSubjectRows = (rows) => {
    return [...rows].sort((a, b) => {
        const dateA = normalizeDate(a?.date || a?.examDate);
        const dateB = normalizeDate(b?.date || b?.examDate);
        if (dateA && dateB) return dateA.localeCompare(dateB);
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
    });
};

const getStudentAdmissionNo = (student) =>
    student?.admissionNo || student?.acknowledgementNumber || student?.rollNo || '';

const getStudentRollNo = (student) =>
    student?.rollNumber || student?.rollNo || '';

const getStudentClass = (student) =>
    student?.className || student?.grade || '';

const getStudentSection = (student) =>
    student?.sectionName || student?.section || '';

const getPublicationStudentAdmissionNo = (publication) =>
    publication?.admissionNo || publication?.rollNo || '';

const getNumericBalance = (fee) => {
    if (fee?.balance !== undefined && fee?.balance !== null && fee.balance !== '') {
        const value = Number(fee.balance);
        return Number.isFinite(value) ? value : 0;
    }

    if (fee?.due !== undefined && fee?.due !== null && fee.due !== '') {
        const value = Number(fee.due);
        return Number.isFinite(value) ? value : 0;
    }

    const total = Number(fee?.totalFee ?? 0);
    const paid = Number(fee?.paidAmount ?? fee?.paid ?? 0);

    if (Number.isFinite(total) && Number.isFinite(paid)) {
        return Math.max(total - paid, 0);
    }

    return 0;
};

const isFeeRecordPaid = (fee) => {
    const status = normalize(fee?.status || '');

    return (
        status === 'paid' ||
        status === 'fullypaid' ||
        getNumericBalance(fee) <= 0
    );
};

const getFeeStatus = (student, feeRecords) => {
    const admissionNo = normalize(getStudentAdmissionNo(student));
    const rollNo = normalize(getStudentRollNo(student));
    const name = normalize(student?.name);

    const records = feeRecords.filter((fee) => {
        const feeAdmission = normalize(
            fee?.admissionNo || fee?.rollNo || fee?.admissionNumber
        );
        const feeName = normalize(fee?.studentName || fee?.name);

        return (
            (admissionNo && feeAdmission && admissionNo === feeAdmission) ||
            (rollNo && feeAdmission && rollNo === feeAdmission) ||
            (name && feeName && name === feeName)
        );
    });

    /*
     * Same policy as OfficeDashboard:
     * - at least one fee record must exist
     * - every matching fee record must be fully paid
     * - no outstanding balance is allowed
     */
    const paid =
        records.length > 0 &&
        records.every((fee) => isFeeRecordPaid(fee));

    const total = records.reduce(
        (sum, fee) => sum + (Number(fee?.totalFee) || 0),
        0
    );

    const paidAmount = records.reduce(
        (sum, fee) =>
            sum + (Number(fee?.paidAmount ?? fee?.paid) || 0),
        0
    );

    const balance = records.reduce(
        (sum, fee) => sum + getNumericBalance(fee),
        0
    );

    return {
        paid,
        records,
        total,
        paidAmount,
        balance
    };
};

export default function Hallticket({
    schoolName = 'EduPulse Matric Higher Secondary School',
    academicYear = '2026 - 2027',
    officeRoom = 'School Office Room'
}) {
    const [admissionNo, setAdmissionNo] = useState('');
    const [dob, setDob] = useState('');
    const [selectedExam] = useState('');
    const [selectedYear] = useState('');

    const [students, setStudents] = useState([]);
    const [erpStudents, setErpStudents] = useState([]);
    const [feeRecords, setFeeRecords] = useState([]);
    const [publications, setPublications] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [timetables, setTimetables] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [verifiedStudent, setVerifiedStudent] = useState(null);
    const [availableTickets, setAvailableTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        setLoading(true);

        const unsubStudents = onSnapshot(
            collection(db, 'students_records'),
            (snapshot) => {
                setStudents(snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data()
                })));
            },
            (err) => {
                console.error('students_records listener failed:', err);
                setError('Unable to load student verification data.');
            }
        );

        const unsubErp = onSnapshot(
            collection(db, 'students_erp'),
            (snapshot) => {
                setErpStudents(snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data()
                })));
            },
            (err) => {
                console.error('students_erp listener failed:', err);
                setError('Unable to load Student ERP data.');
            }
        );

        const unsubFees = onSnapshot(
            collection(db, 'fee_collections'),
            (snapshot) => {
                setFeeRecords(snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data()
                })));
            },
            (err) => {
                console.error('fee_collections listener failed:', err);
                setError('Unable to load fee status.');
            }
        );

        const unsubPublications = onSnapshot(
            collection(db, 'hall_ticket_publications'),
            (snapshot) => {
                setPublications(snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data()
                })));
            },
            (err) => {
                console.error('hall_ticket_publications listener failed:', err);
                setError('Unable to load hall ticket availability.');
            }
        );

        const unsubAllocations = onSnapshot(
            collection(db, 'exam_hall_allocations'),
            (snapshot) => {
                setAllocations(snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data()
                })));
            },
            (err) => {
                console.error('exam_hall_allocations listener failed:', err);
                setError('Unable to load examination hall allocation.');
            }
        );

        const unsubTimetables = onSnapshot(
            collection(db, 'exam_timetables'),
            (snapshot) => {
                setTimetables(snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data()
                })));
                setLoading(false);
            },
            (err) => {
                console.error('exam_timetables listener failed:', err);
                setError('Unable to load examination timetable.');
                setLoading(false);
            }
        );

        return () => {
            unsubStudents();
            unsubErp();
            unsubFees();
            unsubPublications();
            unsubAllocations();
            unsubTimetables();
        };
    }, []);

    /*
     * Combines students_records with students_erp.
     * students_records is preferred because it contains DOB/photo/rollNumber.
     * students_erp is used as a fallback for the ERP admission record.
     */
    const mergedStudents = useMemo(() => {
        const byAdmission = new Map();

        students.forEach((student) => {
            const admission = normalize(getStudentAdmissionNo(student));
            if (admission) {
                byAdmission.set(admission, { ...student });
            }
        });

        erpStudents.forEach((erp) => {
            const admission = normalize(getStudentAdmissionNo(erp));
            if (!admission) return;

            const existing = byAdmission.get(admission) || {};

            byAdmission.set(admission, {
                ...erp,
                ...existing,
                admissionNo:
                    existing.admissionNo ||
                    erp.admissionNo ||
                    erp.acknowledgementNumber ||
                    '',
                name: existing.name || erp.name || '',
                dob: existing.dob || erp.dob || '',
                photo: existing.photo || erp.photo || '',
                rollNumber: existing.rollNumber || erp.rollNumber || erp.rollNo || '',
                className: existing.className || erp.className || erp.grade || '',
                grade: existing.grade || erp.grade || erp.className || '',
                sectionName: existing.sectionName || erp.sectionName || erp.section || '',
                section: existing.section || erp.section || erp.sectionName || ''
            });
        });

        return Array.from(byAdmission.values());
    }, [students, erpStudents]);

    const findStudentByCredentials = () => {
        const normalizedAdmission = normalize(admissionNo);
        const normalizedDob = normalizeDate(dob);

        return mergedStudents.find((student) => {
            const studentAdmission = normalize(getStudentAdmissionNo(student));
            const studentDob = normalizeDate(student.dob);

            return (
                studentAdmission === normalizedAdmission &&
                studentDob === normalizedDob
            );
        });
    };

    const findAllocationForStudent = (student, publication) => {
        if (publication?.allocationId) {
            const byId = allocations.find(
                (allocation) => allocation.id === publication.allocationId
            );
            if (byId) return byId;
        }

        return allocations.find((allocation) => {
            if (
                Array.isArray(allocation.studentIds) &&
                allocation.studentIds.includes(student.id)
            ) {
                return true;
            }

            return (allocation.studentList || []).some((item) => {
                const itemAdmission = normalize(item?.admissionNo);
                const studentAdmission = normalize(getStudentAdmissionNo(student));

                return (
                    item?.id === student.id ||
                    (
                        itemAdmission &&
                        studentAdmission &&
                        itemAdmission === studentAdmission
                    )
                );
            });
        });
    };

    const getSeatNumber = (student, publication, allocation) => {
        if (publication?.seatNo !== undefined && publication?.seatNo !== '') {
            return publication.seatNo;
        }

        const item = (allocation?.studentList || []).find((studentItem) => {
            const itemAdmission = normalize(studentItem?.admissionNo);
            const studentAdmission = normalize(getStudentAdmissionNo(student));

            return (
                studentItem?.id === student.id ||
                (
                    itemAdmission &&
                    studentAdmission &&
                    itemAdmission === studentAdmission
                )
            );
        });

        return item?.seatNo || '—';
    };

    const getTicketTimetable = (student, publication, allocation) => {
        const className =
            getStudentClass(student) ||
            allocation?.targetClass ||
            '';

        const examName =
            publication?.exam ||
            allocation?.examName ||
            selectedExam ||
            '';

        return timetables
            .filter((item) => {
                const itemClass = item?.className || item?.grade || '';
                const itemExam = item?.examName || item?.exam || '';

                return (
                    normalize(itemClass) === normalize(className) &&
                    normalize(itemExam) === normalize(examName)
                );
            })
            .sort((a, b) =>
                String(a.examDate || '').localeCompare(String(b.examDate || ''))
            );
    };

    const verifyStudent = async (event) => {
        event.preventDefault();

        setError('');
        setNotice('');
        setSelectedTicket(null);
        setAvailableTickets([]);
        setVerifiedStudent(null);

        if (!admissionNo.trim() || !dob) {
            setError('Please enter your Admission Number and Date of Birth.');
            return;
        }

        setLoginLoading(true);

        try {
            const student = findStudentByCredentials();

            if (!student) {
                setError(
                    'Verification failed. Please check your Admission Number and Date of Birth.'
                );
                return;
            }

            if (normalize(student.status) === 'inactive') {
                setError(
                    'This student account is currently inactive. Please contact the school office.'
                );
                return;
            }

            const studentPublications = publications.filter((publication) => {
                const publicationAdmission = normalize(
                    getPublicationStudentAdmissionNo(publication)
                );
                const studentAdmission = normalize(getStudentAdmissionNo(student));

                return (
                    publication.published === true &&
                    (
                        publication.studentId === student.id ||
                        (
                            publicationAdmission &&
                            studentAdmission &&
                            publicationAdmission === studentAdmission
                        )
                    )
                );
            });

            /*
             * Re-check the live fee status now, not only when OfficeDashboard
             * originally published the ticket.
             */
            const fee = getFeeStatus(student, feeRecords);

            if (!fee.paid) {
                setVerifiedStudent({
                    ...student,
                    fee
                });

                setError('HALL_TICKET_BLOCKED');
                return;
            }

            const validTickets = studentPublications
                .filter((publication) => {
                    if (selectedExam && publication.exam !== selectedExam) {
                        return false;
                    }

                    if (
                        selectedYear &&
                        String(publication.year || '') !== String(selectedYear)
                    ) {
                        return false;
                    }

                    const allocation = findAllocationForStudent(
                        student,
                        publication
                    );

                    return Boolean(allocation);
                })
                .map((publication) => {
                    const allocation = findAllocationForStudent(
                        student,
                        publication
                    );

                    const timetable = getTicketTimetable(
                        student,
                        publication,
                        allocation
                    );

                    return {
                        publication,
                        allocation,
                        timetable,
                        seatNo: getSeatNumber(student, publication, allocation)
                    };
                });

            setVerifiedStudent({
                ...student,
                fee
            });

            if (!validTickets.length) {
                setNotice(
                    'Your details are verified, but no Hall Ticket has been published for the selected exam/year yet.'
                );
                return;
            }

            setAvailableTickets(validTickets);
            setSelectedTicket(validTickets[0]);
            setCurrentStep(2);
        } catch (err) {
            console.error('Hall ticket verification failed:', err);
            setError(
                'Something went wrong while verifying your details. Please try again.'
            );
        } finally {
            setLoginLoading(false);
        }
    };

    const resetVerification = () => {
        setVerifiedStudent(null);
        setAvailableTickets([]);
        setSelectedTicket(null);
        setError('');
        setNotice('');
        setCurrentStep(1);
    };

    const renderError = () => {
        if (error === 'HALL_TICKET_BLOCKED') {
            const fee = verifiedStudent?.fee;

            return (
                <div className="blocked-card">
                    <div className="blocked-icon">
                        <LockKeyhole size={28} />
                    </div>

                    <div>
                        <span className="status-kicker">ACCESS BLOCKED</span>
                        <h2>Hall Ticket is currently blocked</h2>
                        <p>
                            Your student details were verified, but the Hall Ticket
                            cannot be displayed because the fee account is not fully paid.
                        </p>

                        <div className="blocked-summary">
                            <div>
                                <span>Student</span>
                                <strong>{verifiedStudent?.name || '—'}</strong>
                            </div>
                            <div>
                                <span>Admission No.</span>
                                <strong>{getStudentAdmissionNo(verifiedStudent) || '—'}</strong>
                            </div>
                            <div>
                                <span>Outstanding Balance</span>
                                <strong>
                                    ₹{Number(fee?.balance || 0).toLocaleString('en-IN')}
                                </strong>
                            </div>
                        </div>

                        <div className="office-contact-box">
                            <MapPin size={18} />
                            <div>
                                <strong>Please contact the school office</strong>
                                <span>{officeRoom} to clear the pending fee.</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={resetVerification}
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        if (!error) return null;

        return (
            <div className="form-alert error">
                <AlertCircle size={18} />
                <span>{error}</span>
            </div>
        );
    };

    const goToPreview = () => {
        if (!verifiedStudent || !selectedTicket) return;
        setCurrentStep(3);
    };

    const printHallTicket = () => window.print();

    const renderExactHallTicket = () => {
        if (!verifiedStudent || !selectedTicket) return null;
        const publication = selectedTicket.publication || {};
        const allocation = selectedTicket.allocation || {};
        const studentPhoto = verifiedStudent.photo || '';
        const rollNoValue = getStudentAdmissionNo(verifiedStudent) || getStudentRollNo(verifiedStudent) || verifiedStudent.id || '—';
        const examNameValue = publication.exam || allocation.examName || selectedExam || 'Examination';
        const examYearValue = publication.year || selectedYear || '';
        const classValue = getStudentClass(verifiedStudent) || allocation.targetClass || 'Senior Secondary';
        const examCenterCode = publication.examCenterCode || allocation.hallNo || publication.hallNo || '—';
        const seatNoValue = selectedTicket.seatNo || publication.seatNo || '—';
        const rawSubjectRows = selectedTicket.timetable?.length
            ? selectedTicket.timetable.map(t => ({ code: t.subjectCode, name: t.subject, date: t.examDate }))
            : (Array.isArray(publication.subjects) && publication.subjects.length ? publication.subjects : (Array.isArray(allocation.subjects) ? allocation.subjects : []));
        const subjectRows = sortHallTicketSubjectRows(rawSubjectRows);
        const qrData = encodeURIComponent(`Roll No: ${rollNoValue} | Name: ${verifiedStudent.name} | Exam: ${examNameValue}`);
        const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=0&data=${qrData}`;

        return (
            <div className="ticket-stage">
                <div className="ticket-toolbar no-print">
                    <div><h4>Hall Ticket</h4><span>Official examination details</span></div>
                    <div className="toolbar-actions">
                        <button type="button" onClick={printHallTicket} title="Print / Download" className="icon-btn"><Printer size={16} /></button>
                        <button type="button" onClick={() => setCurrentStep(2)} title="Back" aria-label="Back to verification" className="icon-btn"><XCircle size={16} /></button>
                    </div>
                </div>
                <div className="ht-card">
                    <div className="ht-watermark"><img src={logo} alt="" /></div>
                    <div className="ht-content">
                        <div className="ht-header">
                            <img src={logo} alt="School Logo" className="ht-header-logo" />
                            <div className="ht-header-text">
                                <h1>HOLY CROSS MATRIC. HR. SEC. SCHOOL</h1>
                                <p>Somarasampettai, Tiruchirapalli - 102 (Affiliated to the State Board of School Examinations)</p>
                            </div>
                            <div className="ht-header-spacer" />
                        </div>
                        <div className="ht-band">
                            <div>Hall Ticket – Theory</div>
                            <div>{examNameValue}{examYearValue ? ` ${examYearValue}` : ''} Examination</div>
                            <div>{classValue}</div>
                        </div>
                        <div className="ht-info-row">
                            <div className="ht-info-fields">
                                {[["Roll No", rollNoValue], ["Name", verifiedStudent.name || '—']].map(([label, value]) => (
                                    <div key={label} className="ht-info-item"><span className="label">{label}</span><span className="colon">:</span><span className="value">{value}</span></div>
                                ))}
                            </div>
                            <div className="ht-side">
                                <div className="ht-qr-box"><img src={qrSrc} alt="QR Code" /><span>Scan to verify</span></div>
                                <div className="ht-photo-box">{studentPhoto ? <img src={studentPhoto} alt={verifiedStudent.name || 'Student'} /> : <User size={34} color="#94a3b8" />}</div>
                            </div>
                        </div>
                        <div className="ht-meta-strip">
                            <div className="ht-meta-cell"><span className="m-label">Hall Number</span><span className="m-value">{examCenterCode}</span></div>
                            <div className="ht-meta-cell"><span className="m-label">Seat Number</span><span className="m-value">{seatNoValue}</span></div>
                        </div>
                        <div className="ht-table-wrap">
                            <table className="ht-table">
                                <thead><tr><th>Subject Code</th><th>Subject Name</th><th>Date of Exam</th><th>Invigilator Signature</th></tr></thead>
                                <tbody>
                                    {subjectRows.length > 0 ? subjectRows.map((sub, idx) => (
                                        <tr key={idx}><td>{sub.code || sub.subjectCode || '—'}</td><td>{sub.name || sub.subjectName || '—'}</td><td>{formatHallTicketDate(sub.date || sub.examDate)}</td><td>&nbsp;</td></tr>
                                    )) : <tr><td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>Subject-wise schedule will be updated by the office shortly.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div className="ht-sign-row"><div className="ht-sign-block"><div className="ht-sign-line">Student Signature</div></div></div>
                        <div className="ht-notes">
                            <h4>Important Instructions</h4>
                            <ol>
                                <li>Students must bring their <strong>School Identity Card</strong> along with the Examination Hall Ticket to enter the examination hall.</li>
                                <li>Students are <strong>not permitted</strong> to bring smart watches, calculators, electronic gadgets, bags, written materials, or any other unauthorized items into the examination hall.</li>
                                <li>Students are <strong>only permitted</strong> to bring <strong>Hall Ticket, Pen, Pencils, Scientific Calculators (if needed)</strong> for respective exams items into the examination hall.</li>
                                <li>Students must report to the examination venue at least <strong>15 minutes before</strong> the scheduled commencement of the examination.</li>
                                <li>Students arriving after the commencement of the examination may <strong>not be permitted to enter</strong> the examination hall.</li>
                            </ol>
                            <h4 style={{ marginTop: 16 }}>Disclaimer</h4>
                            <p className="ht-disclaimer">Students are requested to verify all details printed on the Hall Ticket. Any discrepancy should be reported to the school office immediately. The school will not be responsible for errors not brought to its notice in time.</p>
                            <div className="ht-principal-row"><div className="ht-principal-block"><img src={principalSignature} alt="Principal Signature" /><p className="p-name">Fr. A. AROKIA SAHAYARAJ</p><span className="p-role">Principal Signature</span></div></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="hallticket-app">
            {loading ? (
                <div className="app-loading">
                    <RefreshCw size={22} className="spin" />
                    <span>Connecting to Student ERP...</span>
                </div>
            ) : (
                <>
                    {currentStep === 1 && !verifiedStudent && (
                        <div className="auth-stage">
                            <div className="auth-card">
                                <div className="auth-card-icon"><img src={logo} alt="" /> <div className="sname"><p>Holy Cross Matric. Hr. Sec. School</p><span>Somarasampettai, Trichy 102.</span></div></div>
                                <h1>Hall Ticket Login</h1>
                                <p>Enter your Admission Number and Date of Birth to verify your record.</p>
                                <form onSubmit={verifyStudent} className="auth-form">
                                    <label className="field">
                                        <span>Admission Number</span>
                                        <div className="field-input">
                                            <FileText size={16} />
                                            <input type="text" value={admissionNo} onChange={e => setAdmissionNo(e.target.value)} placeholder="Enter Admission Number" required />
                                        </div>
                                    </label>
                                    <label className="field">
                                        <span>Date of Birth</span>
                                        <div className="field-input">
                                            <CalendarDays size={16} />
                                            <input type="date" value={dob} onChange={e => setDob(e.target.value)} required />
                                        </div>
                                    </label>
                                    <button type="submit" className="btn-primary" disabled={loginLoading}>
                                        {loginLoading ? <><RefreshCw size={17} className="spin" /> Verifying...</> : <><LogIn size={17} /> Verify & Continue</>}
                                    </button>
                                </form>
                                <div className="auth-note">
                                    <ShieldCheck size={15} />
                                    <span>Your Date of Birth is used only to verify your Student ERP record.</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {renderError()}

                    {currentStep === 2 && verifiedStudent && error !== 'HALL_TICKET_BLOCKED' && (
                        <div className="confirm-stage">
                            <div className="confirm-card">
                                <div className="confirm-header">
                                    <div>
                                        <span>STEP 2 • VERIFICATION COMPLETE</span>
                                        <h2>Confirm Student & Hall Details</h2>
                                        <p>Review your photo, student information, fee clearance and allotted examination seat.</p>
                                    </div>
                                    <CheckCircle2 size={32} />
                                </div>
                                <div className="confirm-body">
                                    <div className="confirm-photo">
                                        {verifiedStudent.photo ? <img src={verifiedStudent.photo} alt={verifiedStudent.name || 'Student'} /> : <UserRound size={40} />}
                                    </div>
                                    <div className="confirm-fields">
                                        <div><span>Student Name</span><strong>{verifiedStudent.name || '—'}</strong></div>
                                        <div><span>Admission Number</span><strong>{getStudentAdmissionNo(verifiedStudent) || '—'}</strong></div>
                                        <div><span>Roll Number</span><strong>{getStudentRollNo(verifiedStudent) || '—'}</strong></div>
                                        <div><span>Class / Section</span><strong>{getStudentClass(verifiedStudent) || '—'} / {getStudentSection(verifiedStudent) || '—'}</strong></div>
                                        <div><span>Date of Birth</span><strong>{formatDate(verifiedStudent.dob)}</strong></div>
                                        <div><span>Exam</span><strong>{selectedTicket?.publication?.exam || selectedTicket?.allocation?.examName || 'Examination'}</strong></div>
                                    </div>
                                </div>
                                <div className="status-grid">
                                    <div className="status-item success">
                                        <CheckCircle2 size={19} />
                                        <div><span>Fee Clearance</span><strong>Fees Cleared</strong><small>No outstanding balance</small></div>
                                    </div>
                                    <div className="status-item">
                                        <MapPin size={19} />
                                        <div><span>Examination Hall</span><strong>{selectedTicket?.publication?.hallNo || selectedTicket?.allocation?.hallNo || '—'}</strong><small>Hall allocation confirmed</small></div>
                                    </div>
                                    <div className="status-item">
                                        <Ticket size={19} />
                                        <div><span>Seat Number</span><strong>{selectedTicket?.seatNo || '—'}</strong><small>Seat assigned to you</small></div>
                                    </div>
                                </div>
                                <div className="confirm-actions">
                                    <button type="button" className="btn-secondary" onClick={resetVerification}><RefreshCw size={15} /> Verify Another</button>
                                    <button type="button" className="btn-primary slim" disabled={!selectedTicket} onClick={goToPreview}><FileText size={16} /> Continue to Hall Ticket <ChevronRight size={16} /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && selectedTicket && verifiedStudent && error !== 'HALL_TICKET_BLOCKED' && renderExactHallTicket()}

                    {notice && verifiedStudent && currentStep !== 3 && (
                        <div className="form-alert notice"><AlertCircle size={16} /><span>{notice}</span></div>
                    )}
                </>
            )}
        </div>
    );
} 