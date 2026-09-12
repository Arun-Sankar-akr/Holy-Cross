import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; // Adjust your firebase import path as needed
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Eye, CheckCircle2, FileText } from 'lucide-react';
import './AdminAdmissionPanel.css';

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

  if (loading) {
    return <div className="admin-loading">Loading admissions data...</div>;
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h3>Admissions Administration Panel</h3>
        <p>Manage pending applications and sync approved students with ERP</p>
      </div>

      <div className="table-responsive-wrapper">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Grade / Class</th>
              <th>Assign Section</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => {
              const statusClass = (app.status || 'pending').toLowerCase();
              return (
                <tr key={app.id}>
                  <td className="ack-cell">
                    <strong>{app.fullName || app.name}</strong>
                  </td>
                  <td>
                    <span className="grade-badge">{app.grade}</span>
                  </td>
                  <td>
                    <select
                      className="section-select"
                      value={approvalSections[app.id] || app.assignedSection || ''}
                      onChange={(e) => handleSectionChange(app.id, e.target.value)}
                      disabled={app.status === 'Approved'}
                    >
                      <option value="">Select Section</option>
                      <option value="Section A">Section A</option>
                      <option value="Section B">Section B</option>
                      <option value="Section C">Section C</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-pill ${statusClass}`}>
                      {app.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button
                        className="icon-btn view-btn"
                        title="View Details"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye size={15} />
                      </button>

                      {app.status !== 'Approved' ? (
                        <button
                          onClick={() => handleApproveAdmission(app)}
                          className="icon-btn approve-sync-btn"
                          title="Approve & Send to ERP"
                        >
                          <CheckCircle2 size={14} /> Approve &amp; Sync
                        </button>
                      ) : (
                        <span className="synced-label">
                          <CheckCircle2 size={13} /> Synced
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {applications.length === 0 && (
              <tr>
                <td colSpan="5" className="no-data-cell">
                  No admission applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal Integration */}
      {selectedApp && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedApp(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Application Details</h3>

            <div className="modal-grid">
              <p><strong>Name:</strong> {selectedApp.fullName || selectedApp.name}</p>
              <p><strong>Grade:</strong> {selectedApp.grade}</p>
              <p><strong>Email:</strong> {selectedApp.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {selectedApp.phone || 'N/A'}</p>
              <p><strong>Status:</strong> {selectedApp.status || 'Pending'}</p>
              <p><strong>Assigned Section:</strong> {selectedApp.assignedSection || approvalSections[selectedApp.id] || 'Not Assigned'}</p>
            </div>

            {selectedApp.documents && selectedApp.documents.length > 0 && (
              <div className="modal-docs">
                <h4>Submitted Documents</h4>
                {selectedApp.documents.map((docUrl, idx) => (
                  <a key={idx} href={docUrl} target="_blank" rel="noopener noreferrer">
                    <FileText size={13} /> Document {idx + 1}
                  </a>
                ))}
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