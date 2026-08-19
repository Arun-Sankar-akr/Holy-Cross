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

export default function AdmissionPanel() {
  const [applications, setApplications] = useState([]);
  const [approvalSections, setApprovalSections] = useState({});
  const [loading, setLoading] = useState(true);

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
    return <div className="p-6 text-center">Loading admissions data...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Admissions Administration Panel</h2>
      
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade / Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign Section</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map((app) => (
              <tr key={app.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {app.fullName || app.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {app.grade}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select 
                    value={approvalSections[app.id] || ''}
                    onChange={(e) => handleSectionChange(app.id, e.target.value)}
                    disabled={app.status === 'Approved'}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Section</option>
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    app.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status || 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  {app.status !== 'Approved' ? (
                    <button
                      onClick={() => handleApproveAdmission(app)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-semibold shadow transition-colors"
                    >
                      Approve & Send to ERP
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs italic">Synced</span>
                  )}
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  No admission applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}