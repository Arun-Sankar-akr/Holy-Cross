import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { GraduationCap, Lock, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import './ErpPage.css';

export default function StudentErp() {
    const navigate = useNavigate();

    // Login Form State
    const [credentials, setCredentials] = useState({ registerNo: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Forgot Credentials State
    const [view, setView] = useState('login'); // 'login' | 'forgot'
    const [forgotAdmissionNo, setForgotAdmissionNo] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotResult, setForgotResult] = useState(null); // { status: 'found' | 'notfound', message, name }

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

    const openForgot = () => {
        setForgotAdmissionNo(credentials.registerNo || '');
        setForgotResult(null);
        setView('forgot');
    };

    const backToLogin = () => {
        setForgotResult(null);
        setView('login');
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotResult(null);

        try {
            const studentsRef = collection(db, 'students_records');
            const q = query(studentsRef, where('admissionNo', '==', forgotAdmissionNo.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setForgotResult({
                    status: 'notfound',
                    message: 'No student record found for that Admission / Register Number. Please double-check the number or contact the school office.'
                });
            } else {
                const studentDoc = querySnapshot.docs[0];
                const rawData = studentDoc.data();
                setForgotResult({
                    status: 'found',
                    name: rawData.name || 'Student',
                    message: `We found a record for this Admission No. Your password is your Date of Birth on file, in YYYY-MM-DD format. If you don't remember the date of birth on record, please contact the school administrative office with your Admission No. to have it confirmed.`
                });
            }
        } catch (err) {
            console.error('Forgot credentials lookup error:', err);
            setForgotResult({
                status: 'notfound',
                message: 'Something went wrong while checking your details. Please try again or contact the school office.'
            });
        } finally {
            setForgotLoading(false);
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

                {view === 'login' ? (
                    <>
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
                                <button type="button" className="forgot-link" onClick={openForgot}>Forgot Credentials?</button>
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
                    </>
                ) : (
                    <>
                        <form className="erp-form" onSubmit={handleForgotSubmit}>
                            <button type="button" className="forgot-back-link" onClick={backToLogin}>
                                <ArrowLeft size={15} /> Back to Login
                            </button>

                            <p className="forgot-intro">
                                Enter your Admission / Register Number and we'll tell you how to recover access to your account.
                            </p>

                            <div className="input-group">
                                <label htmlFor="forgotAdmissionNo">Roll Number / Admission No.</label>
                                <div className="input-wrapper">
                                    <GraduationCap size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        id="forgotAdmissionNo"
                                        name="forgotAdmissionNo"
                                        placeholder="Enter Admission No"
                                        value={forgotAdmissionNo}
                                        onChange={(e) => { setForgotAdmissionNo(e.target.value); setForgotResult(null); }}
                                        required
                                    />
                                </div>
                            </div>

                            {forgotResult && (
                                <div className={`forgot-status ${forgotResult.status === 'found' ? 'forgot-status-success' : 'forgot-status-error'}`}>
                                    {forgotResult.status === 'found' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                    <span>{forgotResult.message}</span>
                                </div>
                            )}

                            <button type="submit" className="erp-btn student-btn" disabled={forgotLoading}>
                                <span>{forgotLoading ? 'Checking...' : 'Recover Credentials'}</span>
                                <ArrowRight size={18} />
                            </button>
                        </form>

                        <div className="erp-footer">
                            <ShieldCheck size={16} />
                            <span>For assistance, contact the school administrative office</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}