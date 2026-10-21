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
    X,
    Ticket,
    Check
} from 'lucide-react';
import './Admissionstandalone.css';

export default function AdmissionLoginPage() {
    const navigate = useNavigate();
    const [ackNumber, setAckNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotPhone, setForgotPhone] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotResults, setForgotResults] = useState(null);

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

    const openForgotModal = () => {
        setForgotPhone('');
        setForgotError('');
        setForgotResults(null);
        setShowForgotModal(true);
    };

    const closeForgotModal = () => {
        setShowForgotModal(false);
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!forgotPhone.trim()) return;

        setForgotLoading(true);
        setForgotError('');
        setForgotResults(null);

        try {
            const q = query(
                collection(db, 'admissions'),
                where('phone', '==', forgotPhone.trim())
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setForgotError('No application is registered against that phone number.');
                return;
            }

            const numbers = querySnapshot.docs
                .map((doc) => doc.data().acknowledgementNumber)
                .filter(Boolean);

            setForgotResults(numbers);
        } catch (err) {
            console.error('Error looking up acknowledgement number:', err);
            setForgotError('Something went wrong during the lookup. Please try again.');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="adm-standalone-page">
            <div className="adm-login-shell">
                <div className="adm-login-card">
                    <aside className="adm-login-aside">
                        <div className="adm-login-brand">
                            <span className="adm-login-seal">
                                <GraduationCap size={22} strokeWidth={2.2} />
                            </span>
                            <div>
                                <strong>Holy Cross</strong>
                                <span>Admissions 2026–2027</span>
                            </div>
                        </div>

                        <div className="adm-login-aside-copy">
                            <h2>Welcome back</h2>
                            <p>Pick up your application exactly where you stopped. Everything you saved is still here.</p>
                        </div>

                        <ul className="adm-login-points">
                            <li><Check size={16} /> Review any step of your form</li>
                            <li><Check size={16} /> Update details and documents</li>
                            <li><Check size={16} /> Save your changes when you finish</li>
                        </ul>
                    </aside>

                    <div className="adm-login-main">
                        <h1>Continue your application</h1>
                        <p className="adm-login-lead">Enter your acknowledgement number and the phone number you registered with.</p>

                        {error && (
                            <div className="adm-login-error" role="alert">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="adm-login-field">
                                <label htmlFor="adm-ack">Acknowledgement number</label>
                                <div className="adm-login-input">
                                    <Hash size={17} />
                                    <input
                                        id="adm-ack"
                                        type="text"
                                        placeholder="e.g. HCMS20260001"
                                        value={ackNumber}
                                        onChange={(e) => setAckNumber(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="adm-login-field">
                                <label htmlFor="adm-phone">Registered phone number</label>
                                <div className="adm-login-input">
                                    <Phone size={17} />
                                    <input
                                        id="adm-phone"
                                        type="tel"
                                        placeholder="e.g. +91 98765 43210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="adm-forgot-link-row">
                                <button type="button" className="adm-forgot-link" onClick={openForgotModal}>
                                    Forgot acknowledgement number?
                                </button>
                            </div>

                            <button type="submit" className="adm-login-submit" disabled={loading}>
                                {loading ? 'Checking...' : 'Open my application'}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>

                        <div className="adm-login-footer">
                            <span>New applicant? <Link to="/admission/register">Register now</Link></span>
                            <Link to="/admissions">Back to home</Link>
                        </div>
                    </div>
                </div>
            </div>

            {showForgotModal && (
                <div className="adm-modal-overlay" onClick={closeForgotModal}>
                    <div className="adm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="adm-modal-head">
                            <div>
                                <h2>Find your acknowledgement number</h2>
                                <p>Enter the phone number you registered with. We'll match it against saved applications.</p>
                            </div>
                            <button className="adm-modal-close" onClick={closeForgotModal} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="adm-modal-body">
                            {forgotError && (
                                <div className="adm-login-error" role="alert">
                                    <AlertCircle size={16} />
                                    <span>{forgotError}</span>
                                </div>
                            )}

                            <form onSubmit={handleForgotSubmit}>
                                <div className="adm-login-field">
                                    <label htmlFor="adm-forgot-phone">Registered phone number</label>
                                    <div className="adm-login-input">
                                        <Phone size={17} />
                                        <input
                                            id="adm-forgot-phone"
                                            type="tel"
                                            placeholder="e.g. +91 98765 43210"
                                            value={forgotPhone}
                                            onChange={(e) => setForgotPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="adm-modal-submit" disabled={forgotLoading}>
                                    {forgotLoading ? 'Searching...' : 'Find my number'}
                                </button>
                            </form>

                            {forgotResults && forgotResults.length > 0 && (
                                <div className="adm-modal-results">
                                    <p>Found against this phone number:</p>
                                    {forgotResults.map((num) => (
                                        <div className="adm-modal-result-item" key={num}>
                                            <Ticket size={16} />
                                            <span>{num}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}