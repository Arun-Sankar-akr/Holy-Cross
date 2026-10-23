import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../service/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
  getDoc,
  deleteField,
  onSnapshot,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import {
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  FileText,
  Mail,
  Phone,
  GraduationCap,
  X,
  ShieldCheck,
  Search,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  Minus,
  Paperclip,
  Hash,
  User,
  Users,
  MapPin,
  Image as ImageIcon,
  FileWarning,
  ArrowLeft,
  Clock,
  CalendarDays,
  ArrowRight,
  ClipboardCheck,
  RefreshCw,
  Send,
  Award,
  Building2,
  UserCheck
} from 'lucide-react';
import './AdminAdmissionPanel.css';

/* ============================================================================
   DOCUMENT HELPERS
   AdmissionForm stores every uploaded file as Base64 in a sub-collection:
     admissions/{id}/documents/{auto-id}  ->  { fieldName, base64, contentType }
   It is NOT stored on the main admission document, so we read it from there.
   ============================================================================ */

const DOC_META = {
  studentPhoto: { label: 'Student Photo', short: 'Photo', flag: 'studentPhotoStored' },
  aadhar: { label: 'Aadhaar Card', short: 'Aadhaar', flag: 'aadharFileStored' },
  dob: { label: 'Date of Birth Certificate', short: 'DOB Cert', flag: 'dobFileStored' },
  community: { label: 'Community Certificate', short: 'Community', flag: 'communityFileStored' },
  tc: { label: 'Transfer Certificate', short: 'TC', flag: 'tcFileStored' }
};

const DOC_ORDER = ['studentPhoto', 'aadhar', 'dob', 'community', 'tc'];

const FILE_ALIASES = {
  studentPhoto: 'studentPhoto',
  aadhar: 'aadhar',
  aadharFile: 'aadhar',
  dob: 'dob',
  dobFile: 'dob',
  community: 'community',
  communityFile: 'community',
  tc: 'tc',
  tcFile: 'tc'
};

const fetchAdmissionFiles = async (admissionId) => {
  const snap = await getDocs(collection(db, 'admissions', admissionId, 'documents'));
  const files = {};
  snap.forEach((item) => {
    const d = item.data();
    const key = FILE_ALIASES[d.fieldName || item.id];
    if (key && d.base64) {
      files[key] = {
        base64: d.base64,
        contentType:
          d.contentType ||
          (d.base64.startsWith('data:application/pdf') ? 'application/pdf' : 'image/jpeg')
      };
    }
  });
  return files;
};

// Only the student photo (not the other four documents) - used for the avatars in the list
const fetchStudentPhoto = async (admissionId) => {
  const docsRef = collection(db, 'admissions', admissionId, 'documents');
  const snap = await getDocs(query(docsRef, where('fieldName', '==', 'studentPhoto'), limit(1)));
  let data = snap.empty ? null : snap.docs[0].data();
  if (!data?.base64) {
    const byId = await getDoc(doc(db, 'admissions', admissionId, 'documents', 'studentPhoto'));
    data = byId.exists() ? byId.data() : null;
  }
  return data?.base64 || '';
};

const dataUrlToBlobUrl = (dataUrl) => {
  try {
    const [header, payload] = dataUrl.split(',');
    const mime = (header.match(/data:(.*?);/) || [])[1] || 'application/octet-stream';
    const bin = atob(payload);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch (e) {
    console.error('Could not build preview for file', e);
    return '';
  }
};

const fileExt = (contentType) => (contentType === 'application/pdf' ? 'pdf' : 'jpg');

/* ============================================================================
   APPLICANT HELPERS
   ============================================================================ */

const getFullName = (app) =>
  [app.firstName, app.middleName, app.lastName].filter(Boolean).join(' ').trim() ||
  app.fullName ||
  app.name ||
  'Unnamed applicant';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};


const fmtDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const fmtShort = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const docState = (app, key) => {
  if (app[DOC_META[key].flag]) return 'ok';
  const required = key === 'tc' ? !!app.grade && app.grade !== 'LKG' : true;
  return required ? 'missing' : 'na';
};

/* ============================================================================
   CLASS HELPERS (LKG -> XII)
   Grade values coming from the admission form can be written many ways
   ("LKG", "Class 5", "5th", "V", "Grade 10", "XII"...). normalizeGrade maps
   all of them onto one canonical class key so applications land in the right card.
   ============================================================================ */

const CLASS_LIST = [
  'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
];

const ROMAN_BY_NUMBER = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
  7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
};

const normalizeGrade = (grade) => {
  if (!grade) return 'Other';
  const raw = String(grade).toUpperCase().replace(/[^A-Z0-9]/g, ' ').trim();
  const cleaned = raw
    .replace(/\b(CLASS|GRADE|STD|STANDARD)\b/g, ' ')
    .replace(/(\d+)(ST|ND|RD|TH)\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const compact = cleaned.replace(/\s/g, '');
  if (compact === 'LKG') return 'LKG';
  if (compact === 'UKG') return 'UKG';
  if (/^\d+$/.test(compact) && ROMAN_BY_NUMBER[Number(compact)]) return ROMAN_BY_NUMBER[Number(compact)];
  if (CLASS_LIST.includes(compact)) return compact;
  return 'Other';
};

const classLabel = (key) => (key === 'LKG' || key === 'UKG' || key === 'Other' ? key : `Class ${key}`);
const classShort = (key) => (key === 'Other' ? '?' : key);

/* ============================================================================
   ADMISSION FLOW
   Pending -> In Review -> Entrance Exam -> Eligible -> Accepted -> Synced
   The office only marks an applicant Eligible or Not Eligible after the entrance exam.
   Only the admin accepts or rejects: Eligible -> Accept / Reject, Not Eligible -> Reject / Re-exam.

   Office dashboard (role="office") : receives, reviews, runs the entrance exam,
                                      marks eligible, and syncs accepted students to ERP
   Admin dashboard  (role="admin")  : accepts / rejects the eligible applications
   Legacy status "Approved" (old flow, already in ERP) is shown as "Synced".
   ============================================================================ */

const FLOW = [
  { key: 'Pending', label: 'Received' },
  { key: 'In Review', label: 'Review' },
  { key: 'Entrance Exam', label: 'Entrance exam' },
  { key: 'Eligible', label: 'Eligible' },
  { key: 'Accepted', label: 'Admin accepted' },
  { key: 'Synced', label: 'Synced to ERP' }
];

const STAMP = {
  'In Review': 'reviewStartedAt',
  'Entrance Exam': 'examSentAt',
  Eligible: 'eligibleAt',
  'Not Eligible': 'notEligibleAt',
  Accepted: 'acceptedAt',
  Synced: 'syncedAt',
  Rejected: 'rejectedAt'
};

const OFFICE_FILTERS = ['All', 'Pending', 'In Review', 'Entrance Exam', 'Eligible', 'Not Eligible', 'Accepted', 'Synced', 'Rejected'];
const ADMIN_FILTERS = OFFICE_FILTERS;

const STATUS_ICON = {
  Pending: Clock,
  'In Review': Eye,
  'Entrance Exam': ClipboardCheck,
  Eligible: Award,
  'Not Eligible': FileWarning,
  Accepted: CheckCircle2,
  Synced: ShieldCheck,
  Rejected: XCircle
};

const STAGE_HINT = {
  office: {
    Pending: 'New application. Start the review to begin processing it.',
    'In Review': 'Check the documents and details, then send the applicant to the entrance exam.',
    'Entrance Exam': 'The assigned staff member enters the subject-wise marks. Once they are submitted, mark the applicant eligible or not eligible.',
    Eligible: 'Passed to the admin. Waiting for the admin to accept or reject.',
    'Not Eligible': 'Marked not eligible. The admin decides whether to reject the application or order a re-exam.',
    Accepted: 'Accepted by the admin. Choose a section and sync this student to ERP.',
    Synced: 'This student has been synced to ERP.',
    Rejected: 'This application was rejected.'
  },
  admin: {
    Pending: 'Received. The office has not started the review yet.',
    'In Review': 'The office is reviewing this application.',
    'Entrance Exam': 'In the entrance exam stage. Subject-wise marks appear here once the assigned staff member submits them.',
    Eligible: 'The office found this applicant eligible. Accept or reject the application.',
    'Not Eligible': 'The office marked this applicant not eligible. Reject the application, or order a re-exam with the same staff member.',
    Accepted: 'Accepted. The office will sync this student to ERP.',
    Synced: 'This student has been synced to ERP.',
    Rejected: 'This application was rejected.'
  }
};

const getStatus = (app) => {
  const s = app.status || 'Pending';
  return s === 'Approved' ? 'Synced' : s;
};

const statusSlug = (s) => String(s).toLowerCase().replace(/\s+/g, '-');

// Both roles see every application and its status (the admin uses this for analysis).
// What differs is which actions each role gets, see needsAction / renderActions.
const isVisibleTo = () => true;

const STATUS_ORDER = ['Pending', 'In Review', 'Entrance Exam', 'Eligible', 'Not Eligible', 'Accepted', 'Synced', 'Rejected'];

// Applications waiting for THIS role to do something
const needsAction = (app, role) => {
  const s = getStatus(app);
  return role === 'office'
    ? ['Pending', 'In Review', 'Entrance Exam', 'Accepted'].includes(s)
    : ['Eligible', 'Not Eligible'].includes(s);
};

// A "new" application is one waiting for this role that nobody has opened yet
const isNewApp = (app, role) =>
  role === 'office'
    ? getStatus(app) === 'Pending' && !(app.officeSeen || app.adminSeen)
    : ['Eligible', 'Not Eligible'].includes(getStatus(app)) && !app.adminSeen;

/* Compact class tile: badge, name, counts, arrow */
function ClassCard({ short, title, sub, total, pending, fresh, onOpen, isAll }) {
  return (
    <button
      type="button"
      className={`cls-tile ${isAll ? 'all' : ''} ${total === 0 ? 'empty' : ''}`}
      onClick={onOpen}
      title={`${title} — ${total} application${total === 1 ? '' : 's'}${fresh ? `, ${fresh} new` : ''}`}
    >
      <span className="cls-badge">{short}</span>
      <span className="cls-main">
        <span className="cls-name">
          {title}
          {fresh > 0 && <span className="green-dot" title={`${fresh} new`} />}
        </span>
        <span className="cls-sub">{sub}</span>
      </span>
      <ArrowRight size={18} className="cls-go" />
      <span className="cls-nums">
        <span><strong>{total}</strong> total</span>
        <span><strong>{pending}</strong> to do</span>
        {fresh > 0 && <span className="new"><strong>{fresh}</strong> new</span>}
      </span>
    </button>
  );
}

const DOC_STATE_LABEL = { ok: 'Uploaded', missing: 'Missing', na: 'Not required' };

const attachedCount = (app) =>
  DOC_ORDER.filter((k) => app[DOC_META[k].flag]).length;

/* ============================================================================
   DOCUMENT VIEWER (tabs + inline preview + lightbox)
   ============================================================================ */

function DocumentViewer({ files, loading, error, fileBase }) {
  const [active, setActive] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [blobUrl, setBlobUrl] = useState('');

  const available = DOC_ORDER.filter((k) => files[k]);
  const current = available.includes(active) ? active : available[0] || null;
  const file = current ? files[current] : null;
  const isPdf = file?.contentType === 'application/pdf';

  useEffect(() => {
    if (!file || !isPdf) {
      setBlobUrl('');
      return undefined;
    }
    const url = dataUrlToBlobUrl(file.base64);
    setBlobUrl(url);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, isPdf]);

  useEffect(() => {
    if (!zoom) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setZoom(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [zoom]);

  const openInTab = () => {
    const url = isPdf ? blobUrl : dataUrlToBlobUrl(file.base64);
    if (url) window.open(url, '_blank', 'noopener');
  };

  return (
    <div className="doc-viewer">
      <div className="doc-tabs" role="tablist">
        {DOC_ORDER.map((key) => {
          const has = !!files[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={current === key}
              disabled={!has}
              className={`doc-tab ${current === key ? 'active' : ''}`}
              onClick={() => setActive(key)}
              title={has ? DOC_META[key].label : `${DOC_META[key].label} — not uploaded`}
            >
              {key === 'studentPhoto' ? <ImageIcon size={13} /> : <FileText size={13} />}
              {DOC_META[key].short}
              {has && <span className="doc-tab-dot" />}
            </button>
          );
        })}
      </div>

      <div className="doc-stage">
        {loading && (
          <div className="doc-state">
            <div className="ap-spinner" />
            <span>Loading documents…</span>
          </div>
        )}

        {!loading && error && (
          <div className="doc-state error">
            <FileWarning size={26} strokeWidth={1.6} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && !file && (
          <div className="doc-state">
            <Paperclip size={26} strokeWidth={1.6} />
            <span>No documents were uploaded with this application.</span>
          </div>
        )}

        {!loading && !error && file && (
          <>
            <div className="doc-stage-bar">
              <strong>{DOC_META[current].label}</strong>
              <div className="doc-stage-actions">
                {!isPdf && (
                  <button type="button" className="doc-action" onClick={() => setZoom(true)}>
                    <Maximize2 size={13} /> Full view
                  </button>
                )}
                <button type="button" className="doc-action" onClick={openInTab}>
                  <ExternalLink size={13} /> Open
                </button>
                <a
                  className="doc-action"
                  href={file.base64}
                  download={`${fileBase}_${current}.${fileExt(file.contentType)}`}
                >
                  <Download size={13} /> Download
                </a>
              </div>
            </div>

            <div className="doc-canvas">
              {isPdf ? (
                blobUrl ? (
                  <iframe className="doc-frame" src={blobUrl} title={DOC_META[current].label} />
                ) : (
                  <div className="doc-state error">
                    <FileWarning size={26} strokeWidth={1.6} />
                    <span>This PDF could not be previewed. Use Open or Download.</span>
                  </div>
                )
              ) : (
                <img
                  className="doc-image"
                  src={file.base64}
                  alt={DOC_META[current].label}
                  onClick={() => setZoom(true)}
                />
              )}
            </div>
          </>
        )}
      </div>

      {zoom && file && !isPdf && (
        <div className="doc-lightbox" onClick={() => setZoom(false)}>
          <button type="button" className="doc-lightbox-close" aria-label="Close preview">
            <X size={18} />
          </button>
          <img src={file.base64} alt={DOC_META[current].label} onClick={(e) => e.stopPropagation()} />
          <span className="doc-lightbox-caption">{DOC_META[current].label}</span>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  );
}

export default function AdmissionPanel({ role = 'admin' }) {
  const [applications, setApplications] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [approvalSections, setApprovalSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState('normal'); // normal | maximized | minimized
  const [classFilter, setClassFilter] = useState(null); // null = first page (class cards) | All | LKG | UKG | I ... XII | Other

  const [reviewTab, setReviewTab] = useState('docs'); // docs | details | process

  const isOffice = role === 'office';
  const isNew = (app) => isNewApp(app, role);
  const [busy, setBusy] = useState(false);

  // Student photos for the list avatars, loaded lazily for the applications on screen
  const [photos, setPhotos] = useState({});
  const photoRequested = useRef(new Set());

  // "Send to exam" form: hall details come from Hall Management, invigilator from the staff records
  const [halls, setHalls] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [assignFor, setAssignFor] = useState(null);
  const [reexamFor, setReexamFor] = useState(null);   // admin: re-exam for an office-rejected applicant
  const [reexamDate, setReexamDate] = useState('');
  const [assignForm, setAssignForm] = useState({ date: '', hallId: '', staffDocId: '' });

  // Uploaded files for the application open in the modal
  const [files, setFiles] = useState({});
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState('');

  useEffect(() => {
    getDocs(collection(db, 'class_sections'))
      .then((snap) => setSectionsList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((err) => console.error('Error loading class sections: ', err));
  }, []);

  // Hall Management + staff records (only the office assigns exams)
  useEffect(() => {
    if (role !== 'office') return;
    getDocs(collection(db, 'exam_hall_master'))
      .then((snap) => setHalls(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((err) => console.error('Error loading halls: ', err));
    getDocs(collection(db, 'staff_members'))
      .then((snap) => setStaffMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((err) => console.error('Error loading staff: ', err));
  }, [role]);

  // Load uploaded documents only when an application is opened
  useEffect(() => {
    if (!selectedApp) {
      setFiles({});
      setFilesError('');
      return undefined;
    }
    let cancelled = false;
    setModalMode('normal');
    setFiles({});
    setFilesError('');
    setFilesLoading(true);
    fetchAdmissionFiles(selectedApp.id)
      .then((result) => {
        if (!cancelled) setFiles(result);
      })
      .catch((err) => {
        console.error('Error loading admission documents: ', err);
        if (!cancelled) {
          setFilesError(
            err?.code === 'permission-denied'
              ? 'Permission denied reading documents. Check the Firestore rules for admissions/{id}/documents.'
              : 'Could not load the uploaded documents. Please try again.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedApp?.id]);

  // Esc closes the modal
  useEffect(() => {
    if (!selectedApp) return undefined;
    const onKey = (e) => e.key === 'Escape' && setSelectedApp(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedApp]);

  // Lock page scroll behind the open drawer
  useEffect(() => {
    if (!selectedApp || modalMode === 'minimized') return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      // always release the lock (never restore a stale 'hidden' value)
      document.body.style.overflow = '';
    };
  }, [!!selectedApp, modalMode]);

  // Live feed: every status change (office, staff or admin) shows up here immediately
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'admissions'),
      (snap) => {
        const appsList = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setApplications(appsList);
        setSelectedApp((prev) => (prev ? appsList.find((a) => a.id === prev.id) || prev : prev));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching admissions: ', error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Sections that exist for the applicant's grade (falls back to Section A)
  const sectionNamesFor = (grade) => {
    const names = sectionsList
      .filter((s) => s.className === grade)
      .map((s) => s.name)
      .filter(Boolean);
    return names.length ? [...new Set(names)] : ['Section A'];
  };

  const getSection = (app) =>
    approvalSections[app.id] || app.assignedSection || sectionNamesFor(app.grade)[0];

  const handleSectionChange = (appId, sectionName) => {
    setApprovalSections((prev) => ({ ...prev, [appId]: sectionName }));
  };

  /* -------------------- flow actions -------------------- */

  // Moves an application to a new status (and logs it in the application's history)
  const changeStatus = async (app, status, fields = {}) => {
    const keepOpen = selectedApp?.id === app.id && !['Eligible', 'Not Eligible', 'Accepted', 'Rejected', 'Synced'].includes(status);
    setBusy(true);
    try {
      const stamp = STAMP[status];
      const entry = { status, by: role, at: Date.now() };
      await updateDoc(doc(db, 'admissions', app.id), {
        ...fields,
        status,
        ...(stamp ? { [stamp]: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
        history: arrayUnion(entry)
      });
      const now = new Date();
      const merged = {
        ...app,
        ...fields,
        status,
        ...(stamp ? { [stamp]: now } : {}),
        updatedAt: now,
        history: [...(app.history || []), entry]
      };
      setApplications((prev) => prev.map((a) => (a.id === app.id ? merged : a)));
      setSelectedApp(keepOpen ? merged : null);
      return true;
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Could not update the application. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Step 2 - office starts reviewing a received application
  const handleStartReview = (app) => changeStatus(app, 'In Review', { reviewedBy: 'office' });

  // Step 3 - office sends the reviewed application to the entrance exam:
  // exam date + hall (block / room) + invigilator, which also assigns the application to that staff member
  const openAssign = (app) => {
    const x = app.examAssignment || {};
    setAssignForm({ date: x.date || '', hallId: x.hallId || '', staffDocId: x.staffDocId || '' });
    setAssignFor(app);
  };

  const handleSendToExam = (app) => {
    const missing = DOC_ORDER.filter((k) => docState(app, k) === 'missing');
    if (
      missing.length &&
      !window.confirm(
        `These documents are missing: ${missing.map((k) => DOC_META[k].short).join(', ')}.\n\nSend to entrance exam anyway?`
      )
    ) {
      return;
    }
    openAssign(app);
  };

  const handleConfirmAssign = async () => {
    const app = assignFor;
    const hall = halls.find((h) => h.id === assignForm.hallId);
    const staff = staffMembers.find((m) => m.id === assignForm.staffDocId);
    if (!assignForm.date) return alert('Choose the exam date.');
    if (!hall) return alert('Choose the exam hall.');
    if (!staff) return alert('Choose the invigilator.');
    if (!staff.staffId) return alert('This staff record has no Staff ID, so the application cannot be assigned to them.');

    const ok = await changeStatus(app, 'Entrance Exam', {
      examAssignment: {
        date: assignForm.date,
        hallId: hall.id,
        blockName: hall.blockName || '',
        roomNo: hall.hallNo || '',
        location: hall.location || '',
        staffDocId: staff.id,
        staffId: staff.staffId,
        staffName: staff.name || staff.staffName || '',
        assignedAt: Date.now()
      },
      marksSubmitted: app.marksSubmitted && getStatus(app) === 'Entrance Exam' ? app.marksSubmitted : false
    });
    if (ok) setAssignFor(null);
  };

  // Let the staff member enter the marks again (e.g. after a mistake)
  const handleReopenMarks = async (app) => {
    if (!window.confirm('Allow the assigned staff member to edit and re-submit the marks?')) return;
    await changeStatus(app, 'Entrance Exam', { marksSubmitted: false });
  };

  // Step 4 - office decides using the marks the assigned staff member submitted:
  // eligible (goes to admin) or rejected
  const handleExamResult = async (app, eligible) => {
    const marks = app.examMarks;
    if (!app.marksSubmitted || !marks) {
      alert('The assigned staff member has not submitted the marks yet.');
      return;
    }
    if (
      !eligible &&
      !window.confirm('Mark this applicant as not eligible? The admin will then decide whether to reject or order a re-exam.')
    ) {
      return;
    }

    const entranceExam = {
      date: app.examAssignment?.date || '',
      score: marks.total,
      maxScore: marks.maxTotal,
      percentage: marks.percentage ?? null,
      remarks: '',
      result: eligible ? 'Eligible' : 'Not eligible',
      recordedBy: 'office'
    };
    await changeStatus(app, eligible ? 'Eligible' : 'Not Eligible', { entranceExam });
  };

  // Admin: an applicant the office marked Not Eligible after the entrance exam can be given a re-exam.
  // It goes back to the Entrance Exam stage with the same staff member (and hall); only the date is new.
  const canReexam = (app) =>
    !isOffice &&
    !!app.examAssignment?.staffId &&
    (getStatus(app) === 'Not Eligible' || (getStatus(app) === 'Rejected' && app.rejectedBy === 'office'));

  const handleConfirmReexam = async () => {
    const app = reexamFor;
    if (!reexamDate) return alert('Choose the re-exam date.');
    const attempt = (app.reexamCount || 0) + 1;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'admissions', app.id), {
        status: 'Entrance Exam',
        marksSubmitted: false,
        reexamCount: attempt,
        examAssignment: { ...app.examAssignment, date: reexamDate, assignedAt: Date.now() },
        previousAttempts: arrayUnion({
          date: app.examAssignment?.date || '',
          marks: app.examMarks || null,
          result: app.entranceExam?.result || 'Not eligible',
          rejectedBy: app.rejectedBy || 'office',
          at: Date.now()
        }),
        examMarks: deleteField(),
        entranceExam: deleteField(),
        rejectedBy: deleteField(),
        rejectedReason: deleteField(),
        rejectedAt: deleteField(),
        examSentAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        history: arrayUnion({
          status: 'Entrance Exam',
          by: 'admin',
          at: Date.now(),
          note: `Re-exam ordered (attempt ${attempt + 1}) with ${app.examAssignment.staffName || 'the same staff'}`
        })
      });
      setReexamFor(null);
      setSelectedApp(null);
    } catch (error) {
      console.error('Error ordering re-exam:', error);
      alert('Could not order the re-exam. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Step 5 - admin accepts an eligible application
  const handleAdminAccept = (app) => changeStatus(app, 'Accepted', { acceptedBy: 'admin' });

  // Reject (office: before the exam result; admin: an eligible application)
  const handleReject = async (app) => {
    if (!window.confirm('Are you sure you want to reject this application?')) return;
    await changeStatus(app, 'Rejected', {
      rejectedBy: role,
      ...(getStatus(app) === 'Not Eligible' ? { rejectedReason: 'Not eligible after the entrance exam' } : {})
    });
  };

  // Step 6 - office syncs an accepted application into the ERP.
  // ERP records are written first and the application is marked "Synced" last,
  // so a failed sync stays "Accepted" and can simply be retried.
  const syncToErp = async (app) => {
    const assignedSectionName = getSection(app);
    const targetGrade = app.grade;

    const sectionSnap = await getDocs(
      query(
        collection(db, 'class_sections'),
        where('className', '==', targetGrade),
        where('name', '==', assignedSectionName)
      )
    );

    let resolvedSectionId = '';
    if (!sectionSnap.empty) {
      resolvedSectionId = sectionSnap.docs[0].id;
    } else {
      const newSectionRef = await addDoc(collection(db, 'class_sections'), {
        className: targetGrade,
        name: assignedSectionName,
        roomNo: '101',
        createdAt: serverTimestamp()
      });
      resolvedSectionId = newSectionRef.id;
    }

    // Student photo lives in the documents sub-collection
    const uploaded = await fetchAdmissionFiles(app.id);

    const studentErpData = {
      admissionId: app.id,
      admissionNo: app.acknowledgementNumber || 'HCMS20260000',
      name: getFullName(app),
      className: targetGrade,
      grade: targetGrade,
      sectionName: assignedSectionName,
      sectionId: resolvedSectionId,
      guardianName: app.parentName || '',
      phone: app.phone || '',
      address: app.address || '',
      dob: app.dob || '',
      bloodGroup: app.bloodGroup || '',
      photo: uploaded.studentPhoto?.base64 || '',
      status: 'Active',
      enrolledAt: serverTimestamp()
    };

    // Same document id in both collections, so syncing twice can never create duplicates
    await setDoc(doc(db, 'students_erp', app.id), studentErpData);
    await setDoc(doc(db, 'students_records', app.id), studentErpData);

    await updateDoc(doc(db, 'admissions', app.id), {
      status: 'Synced',
      assignedSection: assignedSectionName,
      syncedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: arrayUnion({ status: 'Synced', by: role, at: Date.now() })
    });

    const now = new Date();
    setApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? { ...a, status: 'Synced', assignedSection: assignedSectionName, syncedAt: now, updatedAt: now }
          : a
      )
    );
    return assignedSectionName;
  };

  const handleSyncToErp = async (app) => {
    if (getStatus(app) !== 'Accepted') return;
    setBusy(true);
    try {
      await syncToErp(app);
      alert('Student synced to ERP.');
      setSelectedApp(null);
    } catch (error) {
      console.error('Error syncing to ERP:', error);
      alert('Failed to sync to ERP. The application is still Accepted, so you can try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSyncAll = async () => {
    const list = applications.filter((a) => getStatus(a) === 'Accepted');
    if (!list.length) return;
    if (
      !window.confirm(
        `Sync ${list.length} accepted application${list.length === 1 ? '' : 's'} to ERP?\n\nEach student goes into the section chosen on its row.`
      )
    ) {
      return;
    }
    setBusy(true);
    let ok = 0;
    for (const app of list) {
      try {
        await syncToErp(app);
        ok += 1;
      } catch (error) {
        console.error('Error syncing', app.id, error);
      }
    }
    setBusy(false);
    alert(
      ok === list.length
        ? `${ok} student${ok === 1 ? '' : 's'} synced to ERP.`
        : `${ok} of ${list.length} synced. The rest are still Accepted - try again.`
    );
  };

  const handleDeleteAdmission = async (appId) => {
    if (!window.confirm('Are you sure you want to permanently delete this application?')) return;
    try {
      // Remove the uploaded files first so they are not left orphaned
      const docsSnap = await getDocs(collection(db, 'admissions', appId, 'documents'));
      await Promise.all(docsSnap.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'admissions', appId));
      setApplications((prev) => prev.filter((item) => item.id !== appId));
      setSelectedApp(null);
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete application.');
    }
  };

  // Opening an application clears its green "new" dot (and remembers it in Firestore)
  const markSeen = async (app) => {
    if (!isNew(app)) return;
    const field = isOffice ? 'officeSeen' : 'adminSeen';
    setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, [field]: true } : a)));
    try {
      await updateDoc(doc(db, 'admissions', app.id), { [field]: true });
    } catch (error) {
      console.error('Could not mark application as seen:', error);
    }
  };

  const openReview = (app, tab = 'docs') => {
    setReviewTab(tab);
    setSelectedApp(app);
    markSeen(app);
  };

  // First page -> tap a class card -> that class's applications
  const openClass = (key) => {
    setSearch('');
    setStatusFilter('All');
    setClassFilter(key);
    window.scrollTo?.({ top: 0 });
  };

  const backToClasses = () => {
    setSearch('');
    setStatusFilter('All');
    setClassFilter(null);
  };

  // Each role only works with the applications that belong to its stage of the flow
  const roleApps = useMemo(() => applications.filter((a) => isVisibleTo(a, role)), [applications, role]);

  const totalCount = roleApps.length;
  const countOf = (st) => roleApps.filter((a) => getStatus(a) === st).length;
  const todoCount = roleApps.filter((a) => needsAction(a, role)).length;
  const acceptedCount = countOf('Accepted');

  const visibleApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roleApps.filter((a) => {
      if (classFilter && classFilter !== 'All' && normalizeGrade(a.grade) !== classFilter) return false;
      if (statusFilter !== 'All' && getStatus(a) !== statusFilter) return false;
      if (!q) return true;
      return [getFullName(a), a.acknowledgementNumber, a.email, a.phone, a.parentName, a.grade]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [roleApps, statusFilter, search, classFilter]);

  useEffect(() => {
    if (!classFilter) return;
    visibleApps.forEach((a) => {
      if (!a[DOC_META.studentPhoto.flag] || photoRequested.current.has(a.id)) return;
      photoRequested.current.add(a.id);
      fetchStudentPhoto(a.id)
        .then((src) => src && setPhotos((prev) => ({ ...prev, [a.id]: src })))
        .catch((err) => console.error('Could not load student photo:', err));
    });
  }, [visibleApps, classFilter]);

  // Per-class totals for the class cards (always from all applications this role can see)
  // "pending" = applications waiting for this role to act
  const classStats = useMemo(() => {
    const stats = {};
    [...CLASS_LIST, 'Other'].forEach((k) => {
      stats[k] = { total: 0, pending: 0, fresh: 0 };
    });
    roleApps.forEach((a) => {
      const k = normalizeGrade(a.grade);
      stats[k].total += 1;
      if (needsAction(a, role)) stats[k].pending += 1;
      if (isNewApp(a, role)) stats[k].fresh += 1;
    });
    return stats;
  }, [roleApps, role]);

  const totalNew = useMemo(() => roleApps.filter((a) => isNewApp(a, role)).length, [roleApps, role]);

  // Applications organised per class (after search + status filter)
  const groupedApps = useMemo(() => {
    const groups = {};
    visibleApps.forEach((a) => {
      const k = normalizeGrade(a.grade);
      (groups[k] = groups[k] || []).push(a);
    });
    return groups;
  }, [visibleApps]);

  const classesToShow = (classFilter === 'All' ? [...CLASS_LIST, 'Other'] : [classFilter]).filter(
    (k) => classFilter !== 'All' || (groupedApps[k] || []).length > 0
  );

  const statChips = isOffice
    ? [
        { label: 'Total', value: totalCount, cls: '' },
        { label: 'Pending', value: countOf('Pending'), cls: 'pending' },
        { label: 'New', value: totalNew, cls: 'fresh', dot: true },
        { label: 'In process', value: countOf('In Review') + countOf('Entrance Exam'), cls: 'in-process' },
        { label: 'Eligible', value: countOf('Eligible'), cls: 'eligible' },
        { label: 'Not eligible', value: countOf('Not Eligible'), cls: 'not-eligible' },
        { label: 'To sync', value: acceptedCount, cls: 'accepted' },
        { label: 'Synced', value: countOf('Synced'), cls: 'approved' },
        { label: 'Rejected', value: countOf('Rejected'), cls: 'rejected' }
      ]
    : [
        { label: 'Total', value: totalCount, cls: '' },
        { label: 'New', value: totalNew, cls: 'fresh', dot: true },
        { label: 'Pending', value: countOf('Pending'), cls: 'pending' },
        { label: 'In review', value: countOf('In Review'), cls: 'in-process' },
        { label: 'Entrance exam', value: countOf('Entrance Exam'), cls: 'in-process' },
        { label: 'To decide', value: countOf('Eligible') + countOf('Not Eligible'), cls: 'eligible' },
        { label: 'Accepted', value: acceptedCount, cls: 'accepted' },
        { label: 'Synced', value: countOf('Synced'), cls: 'approved' },
        { label: 'Rejected', value: countOf('Rejected'), cls: 'rejected' }
      ];

  if (loading) {
    return (
      <div className="ap-root">
        <div className="ap-loading">
          <div className="ap-spinner" />
          Loading admissions data...
        </div>
      </div>
    );
  }

  const renderSectionSelect = (app, disabled) => (
    <select
      className="section-select"
      value={getSection(app)}
      onChange={(e) => handleSectionChange(app.id, e.target.value)}
      disabled={disabled}
    >
      {[...new Set([...sectionNamesFor(app.grade), getSection(app)])].map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  );

  // Buttons for the next step of the flow, depending on role and status
  const renderActions = (app, variant) => {
    const st = getStatus(app);
    const isRow = variant === 'row';

    const btn = (kind, Icon, label, onClick) => (
      <button
        key={label}
        type="button"
        className={isRow ? `row-btn ${kind}` : `modal-${kind}-btn`}
        title={label}
        disabled={busy}
        onClick={onClick}
      >
        <Icon size={15} /> <span>{label}</span>
      </button>
    );
    const note = (Icon, text) => (
      <span key={text} className={isRow ? 'row-synced' : 'synced-label'}>
        <Icon size={14} /> {text}
      </span>
    );

    const out = [];

    if (isOffice) {
      if (st === 'Pending') out.push(btn('approve', Eye, 'Start review', () => handleStartReview(app)));
      if (st === 'In Review') out.push(btn('approve', Send, 'Send to exam', () => handleSendToExam(app)));
      if (st === 'Entrance Exam' && (isRow || reviewTab !== 'process')) {
        out.push(
          btn('approve', ClipboardCheck, app.marksSubmitted ? 'Decide result' : 'View exam', () => openReview(app, 'process'))
        );
      }
      if (st === 'Eligible') out.push(note(Clock, 'Waiting for admin'));
      if (st === 'Accepted') {
        out.push(<React.Fragment key="section">{renderSectionSelect(app, busy)}</React.Fragment>);
        out.push(btn('approve', RefreshCw, 'Sync to ERP', () => handleSyncToErp(app)));
      }
      if (st === 'Synced') {
        out.push(note(CheckCircle2, `Synced to ERP${app.assignedSection ? ` · ${app.assignedSection}` : ''}`));
      }
      if (st === 'Not Eligible') out.push(note(Clock, 'Not eligible · waiting for admin'));
    } else {
      if (st === 'Eligible') {
        out.push(btn('approve', CheckCircle2, 'Accept', () => handleAdminAccept(app)));
        out.push(btn('reject', XCircle, 'Reject', () => handleReject(app)));
      }
      if (st === 'Pending') out.push(note(Clock, 'With office · not reviewed'));
      if (st === 'In Review') out.push(note(Clock, 'With office · in review'));
      if (canReexam(app)) {
        out.push(btn('approve', RefreshCw, 'Re-exam', () => { setReexamDate(''); setReexamFor(app); }));
      }
      if (st === 'Not Eligible') out.push(btn('reject', XCircle, 'Reject', () => handleReject(app)));
      if (st === 'Entrance Exam') {
        out.push(note(Clock, app.marksSubmitted ? 'Marks received · office deciding' : 'Exam marks pending'));
      }
      if (st === 'Accepted') out.push(note(Clock, 'Accepted · awaiting ERP sync'));
      if (st === 'Synced') {
        out.push(note(CheckCircle2, `Synced to ERP${app.assignedSection ? ` · ${app.assignedSection}` : ''}`));
      }
    }
    return out;
  };

  // Progress strip: Received -> Review -> Entrance exam -> Eligible -> Admin accepted -> Synced
  const renderStepper = (app) => {
    const st = getStatus(app);
    const rejected = st === 'Rejected' || st === 'Not Eligible';
    const idx = FLOW.findIndex((f) => f.key === st);
    return (
      <div className={`flow-stepper ${rejected ? 'is-rejected' : ''}`}>
        <div className="flow-steps">
          {FLOW.map((f, i) => {
            const state = rejected
              ? 'todo'
              : i < idx || (i === idx && st === 'Synced')
                ? 'done'
                : i === idx
                  ? 'current'
                  : 'todo';
            return (
              <div key={f.key} className={`flow-step ${state}`}>
                <span className="flow-dot">{state === 'done' ? <CheckCircle2 size={14} /> : i + 1}</span>
                <span className="flow-label">{f.label}</span>
              </div>
            );
          })}
        </div>
        {rejected && (
          <div className="flow-rejected">
            <XCircle size={14} />
            {st === 'Not Eligible' ? (
              ' Marked not eligible by the office — waiting for the admin'
            ) : (
              <>
                {' '}Rejected
                {app.rejectedBy ? ` by ${app.rejectedBy === 'admin' ? 'admin' : 'office'}` : ''}
                {app.rejectedReason ? ` — ${app.rejectedReason}` : ''}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Admin analysis: where every application currently stands, plus a per-class breakdown
  const renderAnalysis = () => {
    if (totalCount === 0) return null;
    const pct = (n) => (totalCount ? Math.round((n / totalCount) * 1000) / 10 : 0);
    const scored = roleApps.filter((a) => a.examMarks && typeof a.examMarks.percentage === 'number');
    const avgScore = scored.length
      ? Math.round((scored.reduce((sum, a) => sum + a.examMarks.percentage, 0) / scored.length) * 10) / 10
      : null;
    const decided = countOf('Accepted') + countOf('Synced') + countOf('Rejected');
    const through = countOf('Accepted') + countOf('Synced');
    const marksWaiting = roleApps.filter((a) => getStatus(a) === 'Entrance Exam' && !a.marksSubmitted).length;
    const classRows = [...CLASS_LIST, 'Other'].filter((k) => classStats[k].total > 0);
    const countIn = (k, st) =>
      roleApps.filter((a) => normalizeGrade(a.grade) === k && getStatus(a) === st).length;

    return (
      <section className="an-wrap">
        <div className="an-head">
          <h4>Admission analysis</h4>
          <span>{totalCount} application{totalCount === 1 ? '' : 's'} in total</span>
        </div>

        <div className="an-kpis">
          <div><strong>{pct(through)}%</strong><span>Accepted or synced</span></div>
          <div><strong>{pct(countOf('Rejected'))}%</strong><span>Rejected</span></div>
          <div><strong>{decided ? Math.round((through / decided) * 100) : 0}%</strong><span>Acceptance rate of decided</span></div>
          <div><strong>{avgScore === null ? '—' : `${avgScore}%`}</strong><span>Avg entrance score ({scored.length})</span></div>
          <div><strong>{marksWaiting}</strong><span>Exam marks awaited</span></div>
        </div>

        <div className="an-bars">
          {STATUS_ORDER.map((st) => {
            const n = countOf(st);
            return (
              <button
                type="button"
                key={st}
                className="an-bar-row"
                title={`Show ${st} applications`}
                onClick={() => { setStatusFilter(st); setClassFilter('All'); }}
              >
                <span className="an-bar-label">{st}</span>
                <span className="an-bar-track">
                  <span className={`an-bar-fill bar-${statusSlug(st)}`} style={{ width: `${pct(n)}%` }} />
                </span>
                <span className="an-bar-num">{n} <em>{pct(n)}%</em></span>
              </button>
            );
          })}
        </div>

        <div className="an-table-wrap">
          <table className="an-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Total</th>
                {STATUS_ORDER.map((st) => <th key={st}>{st}</th>)}
              </tr>
            </thead>
            <tbody>
              {classRows.map((k) => (
                <tr key={k}>
                  <td><button type="button" onClick={() => openClass(k)}>{classLabel(k)}</button></td>
                  <td><strong>{classStats[k].total}</strong></td>
                  {STATUS_ORDER.map((st) => {
                    const n = countIn(k, st);
                    return <td key={st} className={n ? '' : 'zero'}>{n}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderRow = (app) => {
    const st = getStatus(app);
    const statusClass = statusSlug(st);
    const displayName = getFullName(app);
    const docCount = attachedCount(app);
    const isFresh = isNew(app);
    const StatusIcon = STATUS_ICON[st] || Clock;

    return (
      <tr key={app.id} className={`ap-row ${statusClass} ${isFresh ? 'is-new' : ''}`}>
        <td data-label="Applicant" className="cell-applicant">
          <button
            type="button"
            className="ap-person"
            onClick={() => openReview(app)}
            title="Open application"
          >
            <span className="ap-avatar">
              {photos[app.id] ? <img src={photos[app.id]} alt={displayName} /> : getInitials(displayName)}
            </span>
            <span className="ap-person-text">
              <strong title={displayName}>
                {displayName}
                {isFresh && <span className="green-dot" title="New application" />}
              </strong>
              <em>{app.acknowledgementNumber || 'No acknowledgement no.'}</em>
            </span>
          </button>
        </td>

        <td data-label="Class" className="cell-class">
          <span className="ap-grade">{app.grade || '—'}</span>
        </td>

        <td data-label="Contact" className="cell-contact hide-lg">
          <span className="cell-main">{app.parentName || '—'}</span>
          {app.phone && <span className="cell-sub">{app.phone}</span>}
        </td>

        <td data-label="Applied" className="cell-applied hide-md">
          {fmtShort(app.createdAt)}
        </td>

        <td data-label="Documents" className="cell-docs">
          <span className={`doc-count ${docCount === DOC_ORDER.length ? 'full' : ''}`}>
            <Paperclip size={13} /> {docCount}/{DOC_ORDER.length}
          </span>
        </td>

        <td data-label="Status" className="cell-status">
          <span className={`ap-status ${statusClass}`}>
            <StatusIcon size={13} />
            {st}
          </span>
          {st === 'Entrance Exam' && (app.marksSubmitted || app.examAssignment) && (
            <span className="cell-sub">
              {app.marksSubmitted ? 'Marks submitted' : `Exam ${app.examAssignment.date || ''} · Room ${app.examAssignment.roomNo || '—'}`}
            </span>
          )}
        </td>

        <td data-label="Section" className="cell-section">
          {isOffice && st === 'Accepted' ? (
            renderSectionSelect(app, busy)
          ) : (
            <span className="cell-main">{app.assignedSection || '—'}</span>
          )}
        </td>

        <td data-label="Actions" className="cell-actions">
          <div className="row-actions">
            <button
              type="button"
              className="row-btn review"
              title="View details and documents"
              onClick={() => openReview(app)}
            >
              <Eye size={15} /> <span>Review</span>
            </button>

            {/* Accepted rows keep the section picker beside the Sync button; skip the duplicate */}
            {renderActions(app, 'row').filter((el) => !(isOffice && st === 'Accepted' && el.key === 'section'))}

            {isOffice && (
              <button
                type="button"
                className="row-btn icon delete"
                title="Delete Record"
                aria-label="Delete record"
                onClick={() => handleDeleteAdmission(app.id)}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="ap-root">
      <div className="ap-header">
        <div className="ap-header-text">
          <h3>{isOffice ? 'Admissions' : 'Admissions — Overview & Approval'}</h3>
          <p>
            {isOffice
              ? 'Review applications, run entrance exams, pass eligible applicants to the admin, then sync accepted students to ERP'
              : 'Track every application through the flow, and accept or reject the ones the office found eligible'}
          </p>
        </div>
        <div className="ap-stats-row">
          {statChips.map((c) => (
            <div key={c.label} className={`ap-stat-chip ${c.cls}`}>
              <span className="ap-stat-value">
                {c.dot && c.value > 0 && <span className="green-dot" />}
                {c.value}
              </span>
              <span className="ap-stat-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {isOffice && acceptedCount > 0 && (
        <div className="sync-banner">
          <div>
            <strong>
              {acceptedCount} accepted application{acceptedCount === 1 ? '' : 's'}
            </strong>{' '}
            approved by the admin and ready to sync to ERP.
          </div>
          <button type="button" className="sync-banner-btn" disabled={busy} onClick={handleSyncAll}>
            <RefreshCw size={15} /> Sync all to ERP
          </button>
        </div>
      )}

      {classFilter === null ? (
        <>
      {!isOffice && renderAnalysis()}

      {/* ---------------- Class cards (LKG to XII) ---------------- */}
      <div className="class-cards-head">
        <h4>Select a class to view its applications</h4>
        <span className="class-cards-legend">
          <span className="green-dot" /> New application{totalNew === 1 ? '' : 's'} waiting
          {totalNew > 0 && <strong>{totalNew}</strong>}
        </span>
      </div>

      <div className="cls-grid">
        <ClassCard
          isAll
          short="All"
          title="All classes"
          sub="Every application"
          total={totalCount}
          pending={todoCount}
          fresh={totalNew}
          onOpen={() => openClass('All')}
        />

        {[...CLASS_LIST, ...(classStats.Other.total > 0 ? ['Other'] : [])].map((key) => {
          const st = classStats[key];
          return (
            <ClassCard
              key={key}
              short={classShort(key)}
              title={classLabel(key)}
              sub={st.total === 0 ? 'No applications yet' : 'Tap to review'}
              total={st.total}
              pending={st.pending}
              fresh={st.fresh}
              onOpen={() => openClass(key)}
            />
          );
        })}
      </div>

        </>
      ) : (
        <>
      <div className="class-detail-bar">
        <button type="button" className="class-back-btn" onClick={backToClasses}>
          <ArrowLeft size={15} /> All classes
        </button>
        <h4 className="class-detail-title">
          {classFilter === 'All' ? 'All classes' : classLabel(classFilter)}
          {classFilter !== 'All' && classStats[classFilter]?.fresh > 0 && <span className="green-dot" />}
        </h4>
        <span className="class-detail-count">
          {classFilter === 'All' ? totalCount : classStats[classFilter]?.total || 0} application
          {(classFilter === 'All' ? totalCount : classStats[classFilter]?.total || 0) === 1 ? '' : 's'}
        </span>
      </div>

      <div className="ap-toolbar">
        <div className="ap-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search name, acknowledgement no., phone, grade…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className="ap-filter-tabs">
          {(isOffice ? OFFICE_FILTERS : ADMIN_FILTERS).map((f) => (
            <button
              key={f}
              type="button"
              className={statusFilter === f ? 'active' : ''}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- Applications, organised by class ---------------- */}
      {visibleApps.length === 0 ? (
        <div className="no-data-state">
          <GraduationCap size={30} strokeWidth={1.5} />
          <p>
            {roleApps.length === 0
              ? 'No admission applications found.'
              : 'No applications match your search or filter.'}
          </p>
        </div>
      ) : (
        classesToShow.map((key) => {
          const list = groupedApps[key] || [];
          const freshInGroup = list.filter(isNewApp).length;
          return (
            <section className="class-group" key={key}>
              <div className="class-group-head">
                <h4>
                  {classLabel(key)}
                  {freshInGroup > 0 && <span className="green-dot" />}
                </h4>
                <span className="class-group-count">
                  {list.length} application{list.length === 1 ? '' : 's'}
                  {freshInGroup > 0 && <em>{freshInGroup} new</em>}
                </span>
              </div>
              {list.length === 0 ? (
                <div className="class-group-empty">No applications for {classLabel(key)} yet.</div>
              ) : (
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Class</th>
                        <th className="hide-lg">Contact</th>
                        <th className="hide-md">Applied</th>
                        <th>Docs</th>
                        <th>Status</th>
                        <th>Section</th>
                        <th className="col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>{list.map(renderRow)}</tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })
      )}

        </>
      )}

      {/* ---------------- Review modal ---------------- */}
      {selectedApp && createPortal(<div className="ap-portal" data-lenis-prevent>{(() => {
        const app = selectedApp;
        const name = getFullName(app);
        const st = getStatus(app);
        const statusClass = statusSlug(st);
        const isApproved = st === 'Synced';

        if (modalMode === 'minimized') {
          return (
            <div className="ap-dock" role="dialog" aria-label={`${name} review (minimized)`}>
              {files.studentPhoto ? (
                <img className="ap-dock-avatar" src={files.studentPhoto.base64} alt={name} />
              ) : (
                <div className="ap-dock-avatar">{getInitials(name)}</div>
              )}
              <div className="ap-dock-text">
                <strong title={name}>{name}</strong>
                <span>
                  <span className={`ap-status ${statusClass}`}>{st}</span>
                  {app.grade ? ` · ${app.grade}` : ''}
                </span>
              </div>
              <button
                type="button"
                className="ap-win-btn"
                onClick={() => setModalMode('normal')}
                title="Restore"
                aria-label="Restore"
              >
                <Maximize2 size={14} />
              </button>
              <button
                type="button"
                className="ap-win-btn"
                onClick={() => setSelectedApp(null)}
                title="Close"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          );
        }

        const isMax = modalMode === 'maximized';

        return (
          <div
            className={`ap-modal-backdrop ${isMax ? 'is-max' : ''}`}
            onClick={() => setSelectedApp(null)}
          >
            <div
              className={`ap-modal-card ${isMax ? 'is-max' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="review-head">
                <div className="review-identity">
                  {files.studentPhoto ? (
                    <img className="admission-avatar large photo" src={files.studentPhoto.base64} alt={name} />
                  ) : (
                    <div className="admission-avatar large">{getInitials(name)}</div>
                  )}
                  <div className="review-titles">
                    <h3>{name}</h3>
                    <div className="review-meta">
                      <span className={`ap-status ${statusClass}`}>
                        {isApproved && <ShieldCheck size={11} />}
                        {st}
                      </span>
                      <span className="ap-grade">
                        <GraduationCap size={12} /> {app.grade || '—'}
                      </span>
                      {app.acknowledgementNumber && (
                        <span className="ack-chip">
                          <Hash size={12} /> {app.acknowledgementNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="review-window-controls">
                  <button
                    type="button"
                    className="ap-win-btn"
                    onClick={() => setModalMode('minimized')}
                    title="Minimize"
                    aria-label="Minimize"
                  >
                    <Minus size={15} />
                  </button>
                  <button
                    type="button"
                    className="ap-win-btn"
                    onClick={() => setModalMode(isMax ? 'normal' : 'maximized')}
                    title={isMax ? 'Restore size' : 'Maximize'}
                    aria-label={isMax ? 'Restore size' : 'Maximize'}
                  >
                    {isMax ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button
                    type="button"
                    className="ap-win-btn close"
                    onClick={() => setSelectedApp(null)}
                    title="Close"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="review-summary">
                <div>
                  <span>Class</span>
                  <strong>{app.grade || '—'}</strong>
                </div>
                <div>
                  <span>Submitted</span>
                  <strong>{fmtShort(app.createdAt)}</strong>
                </div>
                <div>
                  <span>{app.hasGuardian ? 'Guardian' : 'Parent'}</span>
                  <strong title={app.parentName || app.fatherName || app.guardianName || ''}>
                    {app.parentName || app.fatherName || app.guardianName || '—'}
                  </strong>
                </div>
                <div>
                  <span>Mobile</span>
                  {(() => {
                    const mobile =
                      app.parentPhone || app.phone || app.fatherMobile || app.guardianMobile;
                    return mobile ? (
                      <a className="review-tel" href={`tel:${mobile}`}>{mobile}</a>
                    ) : (
                      <strong>—</strong>
                    );
                  })()}
                </div>
              </div>

              {renderStepper(app)}

              <div className="review-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={reviewTab === 'docs'}
                  className={`review-tab ${reviewTab === 'docs' ? 'active' : ''}`}
                  onClick={() => setReviewTab('docs')}
                >
                  <Paperclip size={15} /> Documents
                  <span className="review-tab-count">{attachedCount(app)}/{DOC_ORDER.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={reviewTab === 'details'}
                  className={`review-tab ${reviewTab === 'details' ? 'active' : ''}`}
                  onClick={() => setReviewTab('details')}
                >
                  <FileText size={15} /> Details
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={reviewTab === 'process'}
                  className={`review-tab ${reviewTab === 'process' ? 'active' : ''}`}
                  onClick={() => setReviewTab('process')}
                >
                  <ClipboardCheck size={15} /> Process
                </button>
              </div>

              <div className="review-body">
                <section className="review-docs" hidden={reviewTab !== 'docs'}>
                  <h4 className="review-section-title">
                    <Paperclip size={14} /> Uploaded Documents
                  </h4>
                  <DocumentViewer
                    files={files}
                    loading={filesLoading}
                    error={filesError}
                    fileBase={app.acknowledgementNumber || app.id}
                  />
                  <div className="doc-checklist">
                    {DOC_ORDER.map((key) => {
                      const st = docState(app, key);
                      return (
                        <div className={`check-chip ${st}`} key={key}>
                          <span>{DOC_META[key].label}</span>
                          <strong>{DOC_STATE_LABEL[st]}</strong>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="review-info" hidden={reviewTab !== 'details'}>
                  <div className="info-block">
                    <h4 className="review-section-title">
                      <Hash size={14} /> Application
                    </h4>
                    <div className="info-grid">
                      <InfoRow label="Acknowledgement No." value={app.acknowledgementNumber} />
                      <InfoRow label="Status" value={st} />
                      <InfoRow label="Class Applied For" value={app.grade} />
                      <InfoRow label="Assigned Section" value={app.assignedSection} />
                      <InfoRow label="Submitted On" value={fmtDate(app.createdAt)} />
                      <InfoRow label="Last Updated" value={fmtDate(app.updatedAt)} />
                      {app.approvedAt && <InfoRow label="Approved On" value={fmtDate(app.approvedAt)} />}
                    </div>
                  </div>

                  <div className="info-block">
                    <h4 className="review-section-title">
                      <User size={14} /> Student
                    </h4>
                    <div className="info-grid">
                      <InfoRow label="First Name" value={app.firstName} />
                      <InfoRow label="Middle Name" value={app.middleName} />
                      <InfoRow label="Last Name" value={app.lastName} />
                      <InfoRow label="Date of Birth" value={app.dob} />
                      <InfoRow label="Gender" value={app.gender} />
                      <InfoRow label="Aadhaar Number" value={app.aadharNumber || app.idNumber} />
                      <InfoRow label="Religion" value={app.religion} />
                      <InfoRow label="Caste" value={app.caste} />
                      <InfoRow label="Sub-Caste" value={app.subCaste} />
                      {app.bloodGroup && <InfoRow label="Blood Group" value={app.bloodGroup} />}
                      {app.email && <InfoRow label="Email Address" value={app.email} />}
                    </div>
                  </div>

                  {app.grade && app.grade !== 'LKG' && (
                    <div className="info-block">
                      <h4 className="review-section-title">
                        <GraduationCap size={14} /> Previous School
                      </h4>
                      <div className="info-grid">
                        <InfoRow label="Previous School Name" value={app.previousSchool} />
                      </div>
                    </div>
                  )}

                  <div className="info-block">
                    <h4 className="review-section-title">
                      <Users size={14} /> {app.hasGuardian ? 'Guardian' : 'Parents'}
                    </h4>
                    <div className="info-grid">
                      {app.hasGuardian ? (
                        <>
                          <InfoRow label="Guardian's Name" value={app.guardianName} />
                          <InfoRow label="Guardian's Mobile" value={app.guardianMobile} />
                        </>
                      ) : app.fatherName || app.motherName ? (
                        <>
                          <InfoRow label="Father's Name" value={app.fatherName} />
                          <InfoRow label="Father's Mobile" value={app.fatherMobile} />
                          <InfoRow label="Mother's Name" value={app.motherName} />
                          <InfoRow label="Mother's Mobile" value={app.motherMobile} />
                        </>
                      ) : (
                        <>
                          <InfoRow label="Name" value={app.parentName} />
                          <InfoRow label="Relationship" value={app.parentRelationship} />
                          <InfoRow label="Mobile" value={app.parentPhone || app.phone} />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="info-block">
                    <h4 className="review-section-title">
                      <MapPin size={14} /> Background
                    </h4>
                    <div className="info-grid">
                      <InfoRow label="Community Certificate No." value={app.communityCertNo} />
                      <InfoRow label="Physical Ability Status" value={app.physicalAbility} />
                      {(app.disabilityDetails || (app.physicalAbility && app.physicalAbility !== 'Normal')) && (
                        <div className="info-row wide">
                          <span>Disability Details</span>
                          <strong>{app.disabilityDetails || '—'}</strong>
                        </div>
                      )}
                      {app.address && (
                        <div className="info-row wide">
                          <span>Address</span>
                          <strong>{app.address}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="review-process" hidden={reviewTab !== 'process'}>
                  <p className="process-hint">
                    {canReexam(app)
                      ? `The office marked this applicant not eligible. You can reject the application, or order a re-exam with the same staff member (${app.examAssignment.staffName || 'assigned staff'}).`
                      : (STAGE_HINT[role] || {})[st] || ''}
                  </p>

                  {(app.previousAttempts || []).length > 0 && (
                    <div className="info-block">
                      <h4 className="review-section-title">
                        <Clock size={14} /> Previous exam attempts
                      </h4>
                      <ul className="flow-history">
                        {app.previousAttempts.map((p, i) => (
                          <li key={`${p.at}-${i}`}>
                            <strong>
                              Attempt {i + 1}{p.date ? ` · ${p.date}` : ''}
                            </strong>
                            <span>
                              {p.marks ? `${p.marks.total} / ${p.marks.maxTotal}` : 'No marks'} · {p.result}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {app.examAssignment && (
                    <div className="info-block">
                      <h4 className="review-section-title">
                        <Building2 size={14} /> Exam assignment
                      </h4>
                      <div className="info-grid">
                        <InfoRow label="Exam Date" value={app.examAssignment.date} />
                        <InfoRow label="Block Name" value={app.examAssignment.blockName} />
                        <InfoRow label="Room No" value={app.examAssignment.roomNo} />
                        <InfoRow label="Invigilator" value={app.examAssignment.staffName} />
                      </div>
                      {isOffice && st === 'Entrance Exam' && (
                        <button type="button" className="process-link" disabled={busy} onClick={() => openAssign(app)}>
                          <UserCheck size={14} /> Change date, room or staff
                        </button>
                      )}
                    </div>
                  )}

                  {app.examMarks && app.marksSubmitted && (
                    <div className="info-block">
                      <h4 className="review-section-title">
                        <ClipboardCheck size={14} /> Marks entered by staff
                      </h4>
                      <table className="marks-table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Marks</th>
                            <th>Out of</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(app.examMarks.subjects || []).map((m, i) => (
                            <tr key={`${m.subject}-${i}`}>
                              <td>{m.subject}</td>
                              <td>{m.marks}</td>
                              <td>{m.maxMarks}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>Total</td>
                            <td>{app.examMarks.total}</td>
                            <td>
                              {app.examMarks.maxTotal}
                              {app.examMarks.percentage !== undefined ? ` (${app.examMarks.percentage}%)` : ''}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                      <p className="process-empty">
                        Submitted by {app.examMarks.submittedBy || 'staff'}
                        {app.examMarks.submittedAt ? ` · ${fmtDate(app.examMarks.submittedAt)}` : ''}
                      </p>
                      {isOffice && st === 'Entrance Exam' && (
                        <button type="button" className="process-link" disabled={busy} onClick={() => handleReopenMarks(app)}>
                          <RefreshCw size={14} /> Allow staff to re-enter marks
                        </button>
                      )}
                    </div>
                  )}

                  <div className="info-block">
                    <h4 className="review-section-title">
                      <ClipboardCheck size={14} /> Entrance exam
                    </h4>
                    {isOffice && st === 'Entrance Exam' ? (
                      !app.examAssignment ? (
                        <>
                          <p className="process-empty">No exam date, room or staff has been assigned yet.</p>
                          <button type="button" className="process-link" disabled={busy} onClick={() => openAssign(app)}>
                            <UserCheck size={14} /> Assign exam
                          </button>
                        </>
                      ) : app.marksSubmitted && app.examMarks ? (
                        <div className="exam-decision">
                          <p className="process-empty">
                            Total from staff: <strong>{app.examMarks.total} / {app.examMarks.maxTotal}</strong>
                            {typeof app.examMarks.percentage === 'number' ? ` (${app.examMarks.percentage}%)` : ''}.
                            Check the marks above, then decide.
                          </p>
                          <div className="exam-form-actions">
                            <button
                              type="button"
                              className="modal-reject-btn"
                              disabled={busy}
                              onClick={() => handleExamResult(app, false)}
                            >
                              <XCircle size={15} /> Not eligible
                            </button>
                            <button
                              type="button"
                              className="modal-approve-btn"
                              disabled={busy}
                              onClick={() => handleExamResult(app, true)}
                            >
                              <Award size={15} /> Mark eligible
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="process-empty">
                          Waiting for {app.examAssignment.staffName || 'the assigned staff member'} to submit the marks.
                          This page updates automatically.
                        </p>
                      )
                    ) : app.entranceExam ? (
                      <div className="info-grid">
                        <InfoRow label="Result" value={app.entranceExam.result} />
                        <InfoRow label="Exam Date" value={app.entranceExam.date} />
                        <InfoRow
                          label="Score"
                          value={
                            app.entranceExam.score === null || app.entranceExam.score === undefined
                              ? ''
                              : `${app.entranceExam.score}${app.entranceExam.maxScore ? ` / ${app.entranceExam.maxScore}` : ''}`
                          }
                        />
                        {app.entranceExam.remarks && (
                          <div className="info-row wide">
                            <span>Remarks</span>
                            <strong>{app.entranceExam.remarks}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="process-empty">No entrance exam result recorded yet.</p>
                    )}
                  </div>

                  <div className="info-block">
                    <h4 className="review-section-title">
                      <Clock size={14} /> History
                    </h4>
                    {(app.history || []).length === 0 ? (
                      <p className="process-empty">No history recorded yet.</p>
                    ) : (
                      <ul className="flow-history">
                        {[...(app.history || [])].reverse().map((h, i) => (
                          <li key={`${h.at}-${i}`}>
                            <strong>{h.status}</strong>
                            <span>
                              {h.by === 'admin' ? 'Admin' : h.by === 'staff' ? 'Staff' : 'Office'} · {fmtDate(h.at)}
                              {h.note ? ` · ${h.note}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </div>

              <div className="review-footer">
                {renderActions(app, 'modal')}
                <button className="ap-close-btn" onClick={() => setSelectedApp(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}</div>, document.body)}

      {/* ---------------- Send to exam: date, hall, invigilator ---------------- */}
      {assignFor &&
        createPortal(
          <div className="ap-portal" data-lenis-prevent>
            <div className="assign-backdrop" onClick={() => setAssignFor(null)}>
              <div className="assign-card" onClick={(e) => e.stopPropagation()}>
                <div className="assign-head">
                  <div>
                    <h3>Send to entrance exam</h3>
                    <p>{getFullName(assignFor)} · {assignFor.grade || '—'}</p>
                  </div>
                  <button type="button" className="ap-win-btn" onClick={() => setAssignFor(null)} aria-label="Close">
                    <X size={16} />
                  </button>
                </div>

                <div className="assign-body">
                  <label>
                    Exam date
                    <input
                      type="date"
                      value={assignForm.date}
                      onChange={(e) => setAssignForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </label>

                  <label>
                    Exam hall (from Hall Management)
                    <select
                      value={assignForm.hallId}
                      onChange={(e) => setAssignForm((f) => ({ ...f, hallId: e.target.value }))}
                    >
                      <option value="">Select hall…</option>
                      {halls.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.hallNo}{h.blockName ? ` — ${h.blockName}` : ''}
                        </option>
                      ))}
                    </select>
                    {halls.length === 0 && <small>No halls found. Add halls in Hall Management first.</small>}
                  </label>

                  {(() => {
                    const hall = halls.find((h) => h.id === assignForm.hallId);
                    return (
                      <div className="assign-pair">
                        <div>
                          <span>Block Name</span>
                          <strong>{hall?.blockName || '—'}</strong>
                        </div>
                        <div>
                          <span>Room No</span>
                          <strong>{hall?.hallNo || '—'}</strong>
                        </div>
                      </div>
                    );
                  })()}

                  <label>
                    Invigilator / assign to staff (from staff records)
                    <select
                      value={assignForm.staffDocId}
                      onChange={(e) => setAssignForm((f) => ({ ...f, staffDocId: e.target.value }))}
                    >
                      <option value="">Select staff…</option>
                      {staffMembers
                        .filter((m) => m.name || m.staffName)
                        .sort((a, b) => String(a.name || a.staffName).localeCompare(String(b.name || b.staffName)))
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name || m.staffName}{m.staffId ? ` (${m.staffId})` : ''}
                          </option>
                        ))}
                    </select>
                    <small>The selected staff member sees this applicant on their dashboard and enters the marks.</small>
                  </label>
                </div>

                <div className="assign-foot">
                  <button type="button" className="ap-close-btn" onClick={() => setAssignFor(null)}>
                    Cancel
                  </button>
                  <button type="button" className="modal-approve-btn" disabled={busy} onClick={handleConfirmAssign}>
                    <UserCheck size={15} /> Assign to staff &amp; send to exam
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ---------------- Admin: re-exam for an office-rejected applicant ---------------- */}
      {reexamFor &&
        createPortal(
          <div className="ap-portal" data-lenis-prevent>
            <div className="assign-backdrop" onClick={() => setReexamFor(null)}>
              <div className="assign-card" onClick={(e) => e.stopPropagation()}>
                <div className="assign-head">
                  <div>
                    <h3>Order a re-exam</h3>
                    <p>{getFullName(reexamFor)} · {reexamFor.grade || '—'}</p>
                  </div>
                  <button type="button" className="ap-win-btn" onClick={() => setReexamFor(null)} aria-label="Close">
                    <X size={16} />
                  </button>
                </div>
                <div className="assign-body">
                  <div className="assign-pair">
                    <div>
                      <span>Invigilator (same staff)</span>
                      <strong>{reexamFor.examAssignment?.staffName || '—'}</strong>
                    </div>
                    <div>
                      <span>Block · Room</span>
                      <strong>{reexamFor.examAssignment?.blockName || '—'} · {reexamFor.examAssignment?.roomNo || '—'}</strong>
                    </div>
                  </div>
                  <label>
                    New exam date
                    <input type="date" value={reexamDate} onChange={(e) => setReexamDate(e.target.value)} />
                    <small>
                      The application goes back to the Entrance Exam stage. The staff member enters fresh marks and the
                      office decides again. The earlier attempt is kept in the history.
                    </small>
                  </label>
                </div>
                <div className="assign-foot">
                  <button type="button" className="ap-close-btn" onClick={() => setReexamFor(null)}>
                    Cancel
                  </button>
                  <button type="button" className="modal-approve-btn" disabled={busy} onClick={handleConfirmReexam}>
                    <RefreshCw size={15} /> Order re-exam
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}