import React, { useState, useEffect } from 'react';
import { db } from '../service/firebase'; 
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Eye, CheckCircle2, FileText, Mail, Phone, GraduationCap, X, ShieldCheck } from 'lucide-react';
import '../admin/AdminAdmissionPanel';
import '../admin/AdminAdmissionPanel.css';

export default function AdmissionPanel() {
  const [applications, setApplications] = useState([]);
  const [approvalSections, setApprovalSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'admissions'));
      const appsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(appsList);
    } catch (error) {
      console.error("Error fetching admissions: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (appId, sectionName) => {
    setApprovalSections(prev => ({
      ...prev,
      [appId]: sectionName
    }));
  };

  const generateStudentCredentials = (studentName) => {
    const cleanName = studentName.replace(/\s+/g, '').toLowerCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const loginId = `${cleanName}.${randomNum}`;
    const tempPassword = `Pass@${Math.floor(100000 + Math.random() * 900000)}`;

    return { loginId, tempPassword };
  };

  const handleApproveAdmission = async (app) => {
    const selectedSection = approvalSections[app.id];
    if (!selectedSection) {
      alert("Please select a section before approving the admission.");
      return;
    }

    try {
      const { loginId, tempPassword } = generateStudentCredentials(app.fullName || app.name);

      const sectionQueryId = `${app.grade}_${selectedSection}`;
      const sectionDocRef = doc(db, 'class_sections', sectionQueryId);
      const sectionSnap = await getDoc(sectionDocRef);

      if (!sectionSnap.exists()) {
        await setDoc(sectionDocRef, {
          grade: app.grade,
          sectionName: selectedSection,
          createdAt: serverTimestamp()
        });
      }

      const studentErpData = {
        applicationId: app.id,
        fullName: app.fullName || app.name,
        email: app.email || '',
        phone: app.phone || '',
        grade: app.grade,
        section: selectedSection,
        sectionId: sectionQueryId,
        photoUrl: app.photoUrl || '',
        documents: app.documents || [],
        credentials: {
          loginId: loginId,
          temporaryPassword: tempPassword,
          mustChangePassword: true
        },
        status: 'Active',
        enrolledAt: serverTimestamp()
      };

      const appRef = doc(db, 'admissions', app.id);
      await updateDoc(appRef, {
        status: 'Approved',
        assignedSection: selectedSection,
        approvedAt: serverTimestamp()
      });

      await setDoc(doc(db, 'students_erp', app.id), studentErpData);
      await setDoc(doc(db, 'students_records', app.id), studentErpData);

      alert(`Admission Approved & Synced to ERP Successfully!\n\nGenerated Student Login ID: ${loginId}\nTemporary Password: ${tempPassword}`);

      fetchApplications();

    } catch (error) {
      console.error("Error processing approval and syncing ERP: ", error);
      alert("Failed to approve application.");
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  };

  const totalCount = applications.length;
  const approvedCount = applications.filter(a => a.status === 'Approved').length;
  const pendingCount = totalCount - approvedCount;

  if (loading) {
    return (
      <div className="admin-panel-container">
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          Loading admissions data...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <div className="admin-header-text">
          <h3>Admissions Administration Panel</h3>
          <p>Manage pending applications and sync approved students with ERP</p>
        </div>
        <div className="admin-stats-row">
          <div className="admin-stat-chip">
            <span className="admin-stat-value">{totalCount}</span>
            <span className="admin-stat-label">Total</span>
          </div>
          <div className="admin-stat-chip pending">
            <span className="admin-stat-value">{pendingCount}</span>
            <span className="admin-stat-label">Pending</span>
          </div>
          <div className="admin-stat-chip approved">
            <span className="admin-stat-value">{approvedCount}</span>
            <span className="admin-stat-label">Approved</span>
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="no-data-state">
          <GraduationCap size={30} strokeWidth={1.5} />
          <p>No admission applications found.</p>
        </div>
      ) : (
        <div className="admissions-grid">
          {applications.map((app) => {
            const statusClass = (app.status || 'pending').toLowerCase();
            const isApproved = app.status === 'Approved';
            const displayName = app.fullName || app.name;

            return (
              <div className={`admission-card ${statusClass}`} key={app.id}>
                <div className="admission-card-accent" />

                <div className="admission-card-top">
                  <div className="admission-avatar">{getInitials(displayName)}</div>
                  <div className="admission-card-titles">
                    <h4 title={displayName}>{displayName}</h4>
                    <span className="grade-badge">
                      <GraduationCap size={12} /> {app.grade}
                    </span>
                  </div>
                  <span className={`status-pill ${statusClass}`}>
                    {isApproved && <ShieldCheck size={11} />}
                    {app.status || 'Pending'}
                  </span>
                </div>

                <div className="admission-card-details">
                  <div className="admission-detail-row">
                    <Mail size={13} />
                    <span>{app.email || 'No email provided'}</span>
                  </div>
                  <div className="admission-detail-row">
                    <Phone size={13} />
                    <span>{app.phone || 'No phone provided'}</span>
                  </div>
                </div>

                <div className="admission-card-section">
                  <label>Assign Section</label>
                  <select
                    className="section-select"
                    value={approvalSections[app.id] || app.assignedSection || ''}
                    onChange={(e) => handleSectionChange(app.id, e.target.value)}
                    disabled={isApproved}
                  >
                    <option value="">Select Section</option>
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                  </select>
                </div>

                <div className="admission-card-footer">
                  <button
                    className="icon-btn view-btn"
                    title="View Details"
                    onClick={() => setSelectedApp(app)}
                  >
                    <Eye size={15} /> Details
                  </button>

                  {!isApproved ? (
                    <button
                      onClick={() => handleApproveAdmission(app)}
                      className="icon-btn approve-sync-btn"
                      title="Approve & Send to ERP"
                    >
                      <CheckCircle2 size={14} /> Approve &amp; Sync
                    </button>
                  ) : (
                    <span className="synced-label">
                      <CheckCircle2 size={13} /> Synced to ERP
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedApp(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setSelectedApp(null)}>
              <X size={16} />
            </button>

            <div className="modal-header-block">
              <div className="admission-avatar large">
                {getInitials(selectedApp.fullName || selectedApp.name)}
              </div>
              <div>
                <h3>{selectedApp.fullName || selectedApp.name}</h3>
                <span className={`status-pill ${(selectedApp.status || 'pending').toLowerCase()}`}>
                  {selectedApp.status || 'Pending'}
                </span>
              </div>
            </div>

            <div className="modal-grid">
              <p><strong>Grade</strong>{selectedApp.grade}</p>
              <p><strong>Email</strong>{selectedApp.email || 'N/A'}</p>
              <p><strong>Phone</strong>{selectedApp.phone || 'N/A'}</p>
              <p><strong>Assigned Section</strong>{selectedApp.assignedSection || approvalSections[selectedApp.id] || 'Not Assigned'}</p>
            </div>

            {selectedApp.documents && selectedApp.documents.length > 0 && (
              <div className="modal-docs">
                <h4>Submitted Documents</h4>
                <div className="modal-docs-list">
                  {selectedApp.documents.map((docUrl, idx) => (
                    <a key={idx} href={docUrl} target="_blank" rel="noopener noreferrer">
                      <FileText size={13} /> Document {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button className="close-modal-btn" onClick={() => setSelectedApp(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}