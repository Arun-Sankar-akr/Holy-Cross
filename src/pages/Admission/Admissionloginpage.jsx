import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../service/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
    GraduationCap,
    Hash,
    Phone,
    ArrowRight,
    AlertCircle,
    Zap,
    Clock3,
    FileCheck2,
    ShieldCheck
} from 'lucide-react';
import './Admissionstandalone.css';

export default function AdmissionLoginPage() {
    const navigate = useNavigate();
    const [ackNumber, setAckNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!ackNumber.trim() || !phone.trim()) return;

        setLoading(true);
        setError('');

        try {
            const q = query(
                collection(db, 'admissions'),
                where('acknowledgementNumber', '==', ackNumber.trim())
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('No application found for that acknowledgement number.');
                return;
            }

            const matchedDoc = querySnapshot.docs[0];
            const data = matchedDoc.data();

            if ((data.phone || '').trim() !== phone.trim()) {
                setError('Acknowledgement number and phone number do not match our records.');
                return;
            }

            navigate('/admission/continue', {
                state: { docId: matchedDoc.id, data }
            });
        } catch (err) {
            console.error('Error logging in:', err);
            setError('Something went wrong while looking up your application. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="adm-standalone-page">
            <div className="adm-login-shell">
                <div className="adm-login-left">
                    <div className="adm-login-card">
                        <div className="adm-login-brand">
                            <div className="adm-login-brand-mark">
                                <GraduationCap size={24} strokeWidth={2.2} />
                            </div>
                            <div>
                                <strong>Holy Cross</strong>
                                <span>Admissions 2026–2027</span>
                            </div>
                        </div>

                        <h1>Applicant Login</h1>
                        <p>Enter your acknowledgement number and registered phone number to continue your application.</p>

                        {error && (
                            <div className="adm-login-error">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="adm-login-field">
                                <label>Acknowledgement Number</label>
                                <div className="adm-login-input">
                                    <Hash size={17} />
                                    <input
                                        type="text"
                                        placeholder="e.g. HCMS20260001"
                                        value={ackNumber}
                                        onChange={(e) => setAckNumber(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="adm-login-field">
                                <label>Registered Phone Number</label>
                                <div className="adm-login-input">
                                    <Phone size={17} />
                                    <input
                                        type="tel"
                                        placeholder="e.g. +91 98765 43210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="adm-login-submit" disabled={loading}>
                                {loading ? 'Checking...' : 'Access Application'}
                                {!loading && <ArrowRight size={17} />}
                            </button>
                        </form>

                        <div className="adm-login-footer">
                            <span>New applicant? <Link to="/admission/register">Register Now</Link></span>
                            <Link to="/admissions">Back to Home</Link>
                        </div>
                    </div>
                </div>

                <div className="adm-login-right">
                    <div className="adm-login-right-head">Important Information</div>

                    <div className="adm-login-info-item">
                        <div className="adm-login-info-icon"><Zap size={17} /></div>
                        <div>
                            <h4>Instant Access</h4>
                            <p>Your acknowledgement number and phone number are matched instantly against your saved application.</p>
                        </div>
                    </div>

                    <div className="adm-login-info-item">
                        <div className="adm-login-info-icon"><Clock3 size={17} /></div>
                        <div>
                            <h4>Pick Up Where You Left Off</h4>
                            <p>Review and update any step of your application, including uploaded documents.</p>
                        </div>
                    </div>

                    <div className="adm-login-info-item">
                        <div className="adm-login-info-icon"><FileCheck2 size={17} /></div>
                        <div>
                            <h4>Keep Documents Ready</h4>
                            <p>Have your identity document and community certificate on hand if you plan to update them.</p>
                        </div>
                    </div>

                    <div className="adm-login-info-item">
                        <div className="adm-login-info-icon"><ShieldCheck size={17} /></div>
                        <div>
                            <h4>Secure Portal</h4>
                            <p>Only the acknowledgement number and matching phone number can unlock an application.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}