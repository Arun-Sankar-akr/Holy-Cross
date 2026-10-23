import React, { useState, useEffect, useMemo } from 'react';
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
  serverTimestamp
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
  ArrowRight
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

// A "new" application is one still waiting for action that the admin has not opened yet
const isNewApp = (app) => (app.status || 'Pending') === 'Pending' && !app.adminSeen;

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
        <span><strong>{pending}</strong> pending</span>
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

export default function AdmissionPanel() {
  const [applications, setApplications] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [approvalSections, setApprovalSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState('normal'); // normal | maximized | minimized
  const [classFilter, setClassFilter] = useState(null); // null = first page (class cards) | All | LKG | UKG | I ... XII | Other

  const [reviewTab, setReviewTab] = useState('docs'); // docs | details

  // Uploaded files for the application open in the modal
  const [files, setFiles] = useState({});
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState('');

  useEffect(() => {
    fetchApplications();
    getDocs(collection(db, 'class_sections'))
      .then((snap) => setSectionsList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((err) => console.error('Error loading class sections: ', err));
  }, []);

  // Load uploaded documents only when an application is opened
  useEffect(() => {
    if (!selectedApp) {
      setFiles({});
      setFilesError('');
      return undefined;
    }
    let cancelled = false;
    setModalMode('normal');
    setReviewTab('docs');
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
  }, [selectedApp]);

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
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedApp, modalMode]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'admissions'));
      const appsList = querySnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setApplications(appsList);
    } catch (error) {
      console.error('Error fetching admissions: ', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleApproveAdmission = async (app) => {
    try {
      const assignedSectionName = getSection(app);

      await updateDoc(doc(db, 'admissions', app.id), {
        status: 'Approved',
        assignedSection: assignedSectionName,
        approvedAt: serverTimestamp()
      });

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

      await setDoc(doc(db, 'students_erp', app.id), studentErpData);
      await addDoc(collection(db, 'students_records'), studentErpData);

      alert('Application approved! Student registered into Student ERP.');
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application.');
    }
  };

  const handleRejectAdmission = async (appId) => {
    if (!window.confirm('Are you sure you want to reject this application?')) return;
    try {
      await updateDoc(doc(db, 'admissions', appId), { status: 'Rejected' });
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
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
    if (!isNewApp(app)) return;
    setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, adminSeen: true } : a)));
    try {
      await updateDoc(doc(db, 'admissions', app.id), { adminSeen: true });
    } catch (error) {
      console.error('Could not mark application as seen:', error);
    }
  };

  const openReview = (app) => {
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

  const totalCount = applications.length;
  const countBy = (s) => applications.filter((a) => (a.status || 'Pending') === s).length;
  const pendingCount = countBy('Pending');
  const approvedCount = countBy('Approved');
  const rejectedCount = countBy('Rejected');

  const visibleApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (classFilter && classFilter !== 'All' && normalizeGrade(a.grade) !== classFilter) return false;
      if (statusFilter !== 'All' && (a.status || 'Pending') !== statusFilter) return false;
      if (!q) return true;
      return [getFullName(a), a.acknowledgementNumber, a.email, a.phone, a.parentName, a.grade]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [applications, statusFilter, search, classFilter]);

  // Per-class totals for the class cards (always from ALL applications)
  const classStats = useMemo(() => {
    const stats = {};
    [...CLASS_LIST, 'Other'].forEach((k) => {
      stats[k] = { total: 0, pending: 0, fresh: 0 };
    });
    applications.forEach((a) => {
      const k = normalizeGrade(a.grade);
      stats[k].total += 1;
      if ((a.status || 'Pending') === 'Pending') stats[k].pending += 1;
      if (isNewApp(a)) stats[k].fresh += 1;
    });
    return stats;
  }, [applications]);

  const totalNew = useMemo(() => applications.filter(isNewApp).length, [applications]);

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

  const renderRow = (app) => {
    const statusClass = (app.status || 'Pending').toLowerCase();
    const isApproved = app.status === 'Approved';
    const isRejected = app.status === 'Rejected';
    const displayName = getFullName(app);
    const docCount = attachedCount(app);
    const isFresh = isNewApp(app);
    const StatusIcon = isApproved ? ShieldCheck : isRejected ? XCircle : Clock;

    return (
      <tr key={app.id} className={`ap-row ${statusClass} ${isFresh ? 'is-new' : ''}`}>
        <td data-label="Applicant" className="cell-applicant">
          <button
            type="button"
            className="ap-person"
            onClick={() => openReview(app)}
            title="Open application"
          >
            <span className="ap-avatar">{getInitials(displayName)}</span>
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
            {app.status || 'Pending'}
          </span>
        </td>

        <td data-label="Section" className="cell-section">
          {renderSectionSelect(app, isApproved)}
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

            {isApproved ? (
              <span className="row-synced">
                <CheckCircle2 size={14} /> Synced to ERP
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className="row-btn approve"
                  title="Approve & Send to ERP"
                  onClick={() => handleApproveAdmission(app)}
                >
                  <CheckCircle2 size={15} /> <span>Approve</span>
                </button>
                {!isRejected && (
                  <button
                    type="button"
                    className="row-btn reject"
                    title="Reject Application"
                    onClick={() => handleRejectAdmission(app.id)}
                  >
                    <XCircle size={15} /> <span>Reject</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              className="row-btn icon delete"
              title="Delete Record"
              aria-label="Delete record"
              onClick={() => handleDeleteAdmission(app.id)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="ap-root">
      <div className="ap-header">
        <div className="ap-header-text">
          <h3>Admissions Administration Panel</h3>
          <p>Review applications and documents, then sync approved students with ERP</p>
        </div>
        <div className="ap-stats-row">
          <div className="ap-stat-chip">
            <span className="ap-stat-value">{totalCount}</span>
            <span className="ap-stat-label">Total</span>
          </div>
          <div className="ap-stat-chip pending">
            <span className="ap-stat-value">{pendingCount}</span>
            <span className="ap-stat-label">Pending</span>
          </div>
          <div className="ap-stat-chip fresh">
            <span className="ap-stat-value">
              {totalNew > 0 && <span className="green-dot" />}
              {totalNew}
            </span>
            <span className="ap-stat-label">New</span>
          </div>
          <div className="ap-stat-chip approved">
            <span className="ap-stat-value">{approvedCount}</span>
            <span className="ap-stat-label">Approved</span>
          </div>
          <div className="ap-stat-chip rejected">
            <span className="ap-stat-value">{rejectedCount}</span>
            <span className="ap-stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {classFilter === null ? (
        <>
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
          pending={pendingCount}
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
          {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
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
            {applications.length === 0
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
      {selectedApp && createPortal(<div className="ap-portal">{(() => {
        const app = selectedApp;
        const name = getFullName(app);
        const statusClass = (app.status || 'Pending').toLowerCase();
        const isApproved = app.status === 'Approved';
        const isRejected = app.status === 'Rejected';

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
                  <span className={`ap-status ${statusClass}`}>{app.status || 'Pending'}</span>
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
                        {app.status || 'Pending'}
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
                      <InfoRow label="Status" value={app.status || 'Pending'} />
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
              </div>

              <div className="review-footer">
                {!isApproved ? (
                  <>
                    {renderSectionSelect(app, false)}
                    {!isRejected && (
                      <button className="modal-reject-btn" onClick={() => handleRejectAdmission(app.id)}>
                        <XCircle size={15} /> Reject
                      </button>
                    )}
                    <button className="modal-approve-btn" onClick={() => handleApproveAdmission(app)}>
                      <CheckCircle2 size={15} /> Approve &amp; Sync
                    </button>
                  </>
                ) : (
                  <span className="synced-label">
                    <CheckCircle2 size={14} /> Synced to ERP
                    {app.assignedSection ? ` · ${app.assignedSection}` : ''}
                  </span>
                )}
                <button className="ap-close-btn" onClick={() => setSelectedApp(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}</div>, document.body)}
    </div>
  );
}