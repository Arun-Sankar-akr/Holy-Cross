import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { GraduationCap, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import './ErpPage.css';

export default function StudentErp() {
    const navigate = useNavigate();

    // Login Form State
    const [credentials, setCredentials] = useState({ registerNo: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If session exists in localStorage, redirect immediately to the Dashboard
    useEffect(() => {
        const storedUser = localStorage.getItem('studentUser');
        if (storedUser) {
            navigate('/erp/student/dashboard');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Query Firestore for student matching Admission No
            const studentsRef = collection(db, 'students_records');
            const q = query(studentsRef, where('admissionNo', '==', credentials.registerNo.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('No student record found with this Admission / Register Number.');
                setLoading(false);
                return;
            }

            const studentDoc = querySnapshot.docs[0];
            const rawData = { id: studentDoc.id, ...studentDoc.data() };

            // Password verification against DOB
            if (rawData.dob === credentials.password.trim()) {
                const sessionData = {
                    name: rawData.name || 'Student Name',
                    grade: rawData.className || rawData.grade || '10th Std',
                    section: rawData.sectionName || rawData.section || 'Section A',
                    rollNo: rawData.admissionNo || credentials.registerNo,
                    photo: rawData.photo || null,
                    guardianName: rawData.guardianName || 'N/A',
                    phone: rawData.phone || 'N/A',
                    dob: rawData.dob || 'N/A',
                    address: rawData.address || ''
                };

                // Store user details in local storage and redirect to student dashboard
                localStorage.setItem('studentUser', JSON.stringify(sessionData));
                navigate('/erp/student/dashboard');
            } else {
                setError('Invalid password or Date of Birth. Please try again.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="erp-page-container">
            <div className="erp-card">
                <div className="erp-header student-theme">
                    <div className="erp-badge">Student Portal</div>
                    <h2>Student & Parent ERP</h2>
                    <p>View exam results, progress reports, attendance, and fee details.</p>
                </div>

                <form className="erp-form" onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ color: '#d9534f', backgroundColor: '#fdf7f7', border: '1px solid #d9534f', padding: '10px', borderRadius: '6px', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="registerNo">Roll Number / Admission No.</label>
                        <div className="input-wrapper">
                            <GraduationCap size={18} className="input-icon" />
                            <input
                                type="text"
                                id="registerNo"
                                name="registerNo"
                                placeholder="Enter Admission No"
                                value={credentials.registerNo}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password / DOB (YYYY-MM-DD)</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter Date of Birth"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <a href="#forgot" className="forgot-link">Forgot Credentials?</a>
                    </div>

                    <button type="submit" className="erp-btn student-btn" disabled={loading}>
                        <span>{loading ? 'Authenticating...' : 'Login to Student Portal'}</span>
                        <ArrowRight size={18} />
                    </button>
                </form>

                <div className="erp-footer">
                    <ShieldCheck size={16} />
                    <span>For assistance, contact the school administrative office</span>
                </div>
            </div>
        </div>
    );
}