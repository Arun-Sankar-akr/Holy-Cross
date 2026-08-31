import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User, Lock, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import './ErpPages.css';

export default function StaffErp() {
    const [credentials, setCredentials] = useState({ staffId: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Forgot Password State
    const [view, setView] = useState('login'); // 'login' | 'forgot'
    const [forgotStaffId, setForgotStaffId] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotResult, setForgotResult] = useState(null); // { status: 'found' | 'notfound', message }

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log("Authenticating Staff ID:", credentials.staffId.trim());

            // Query Firestore for matching staff credentials
            const staffRef = collection(db, 'staff_members');
            const q = query(
                staffRef,
                where('staffId', '==', credentials.staffId.trim()),
                where('password', '==', String(credentials.password))
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Retrieve authenticated staff details
                const staffDoc = querySnapshot.docs[0];
                const staffData = staffDoc.data();

                console.log("Authentication successful for:", staffData.name);

                // Store staff details in local storage for session management
                localStorage.setItem('staffUser', JSON.stringify({
                    id: staffDoc.id,
                    name: staffData.name,
                    staffId: staffData.staffId,
                    department: staffData.department,
                    email: staffData.email
                }));

                // Redirect to Staff Dashboard route
                navigate('/erp/staff/dashboard');
            } else {
                setError('Invalid Staff ID or Password. Please check with your administrator.');
            }
        } catch (err) {
            console.error("Login verification failed: ", err);
            setError('An error occurred during authentication. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openForgot = () => {
        setForgotStaffId(credentials.staffId || '');
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
            const staffRef = collection(db, 'staff_members');
            const q = query(staffRef, where('staffId', '==', forgotStaffId.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setForgotResult({
                    status: 'notfound',
                    message: 'No staff record found for that Staff ID. Please verify the ID with your department administrator.'
                });
            } else {
                const staffDoc = querySnapshot.docs[0];
                const staffData = staffDoc.data();
                const maskedEmail = staffData.email
                    ? staffData.email.replace(/^(.{2}).+(@.+)$/, '$1***$2')
                    : null;

                setForgotResult({
                    status: 'found',
                    message: maskedEmail
                        ? `We found a record for this Staff ID (registered email: ${maskedEmail}). For security, password resets are handled by the system administrator. Please contact the admin office quoting your Staff ID to have your password reset.`
                        : 'We found a record for this Staff ID. For security, password resets are handled by the system administrator. Please contact the admin office quoting your Staff ID to have your password reset.'
                });
            }
        } catch (err) {
            console.error('Forgot password lookup error:', err);
            setForgotResult({
                status: 'notfound',
                message: 'Something went wrong while checking your details. Please try again or contact the admin office.'
            });
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="erp-page-container">
            <div className="erp-card">
                <div className="erp-header staff-theme">
                    <div className="erp-badge">Staff Portal</div>
                    <h2>Faculty & Staff ERP</h2>
                    <p>Access attendance management, grading systems, and administrative tools.</p>
                </div>

                {view === 'login' ? (
                    <>
                        {error && (
                            <div className="error-message-box" style={{
                                backgroundColor: '#fef2f2',
                                color: '#991b1b',
                                padding: '0.75rem',
                                borderRadius: '6px',
                                border: '1px solid #fecaca',
                                marginBottom: '1rem',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form className="erp-form" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label htmlFor="staffId">Staff ID / Username</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        id="staffId"
                                        name="staffId"
                                        placeholder="Enter your Staff ID"
                                        value={credentials.staffId}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        placeholder="Enter your password"
                                        value={credentials.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="forgot-link" onClick={openForgot}>Forgot Password?</button>
                            </div>

                            <button type="submit" className="erp-btn staff-btn" disabled={loading}>
                                <span>{loading ? 'Authenticating...' : 'Login to Staff Portal'}</span>
                                <ArrowRight size={18} />
                            </button>
                        </form>

                        <div className="erp-footer">
                            <ShieldCheck size={16} />
                            <span>Secure end-to-end encrypted staff portal</span>
                        </div>
                    </>
                ) : (
                    <>
                        <form className="erp-form" onSubmit={handleForgotSubmit}>
                            <button type="button" className="forgot-back-link" onClick={backToLogin}>
                                <ArrowLeft size={15} /> Back to Login
                            </button>

                            <p className="forgot-intro">
                                Enter your Staff ID and we'll tell you how to recover access to your account.
                            </p>

                            <div className="input-group">
                                <label htmlFor="forgotStaffId">Staff ID / Username</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        id="forgotStaffId"
                                        name="forgotStaffId"
                                        placeholder="Enter your Staff ID"
                                        value={forgotStaffId}
                                        onChange={(e) => { setForgotStaffId(e.target.value); setForgotResult(null); }}
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

                            <button type="submit" className="erp-btn staff-btn" disabled={forgotLoading}>
                                <span>{forgotLoading ? 'Checking...' : 'Recover Password'}</span>
                                <ArrowRight size={18} />
                            </button>
                        </form>

                        <div className="erp-footer">
                            <ShieldCheck size={16} />
                            <span>Secure end-to-end encrypted staff portal</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}