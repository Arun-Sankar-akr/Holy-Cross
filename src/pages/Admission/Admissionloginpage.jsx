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
    Ticket
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
                <div className="adm-ticket">
                    <div className="adm-ticket-letterhead">
                        <div className="adm-ticket-seal">
                            <GraduationCap size={20} strokeWidth={2.2} />
                        </div>
                        <div className="adm-ticket-letterhead-text">
                            <strong>Holy Cross</strong>
                            <span>Admissions</span>
                        </div>
                        <div className="adm-ticket-serial">2026–27</div>
                    </div>

                    <div className="adm-ticket-body">
                        <h1>Continue your application</h1>
                        <p>Enter your acknowledgement number and registered phone number to pick up where you left off.</p>

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

                            <div className="adm-forgot-link-row">
                                <button type="button" className="adm-forgot-link" onClick={openForgotModal}>
                                    Forgot acknowledgement number?
                                </button>
                            </div>

                            <button type="submit" className="adm-login-submit" disabled={loading}>
                                {loading ? 'Checking...' : 'Access Application'}
                                {!loading && <ArrowRight size={17} />}
                            </button>
                        </form>
                    </div>

                    <div className="adm-ticket-perforation" />

                    <div className="adm-ticket-stub">
                        <div className="adm-login-footer">
                            <span>New applicant? <Link to="/admission/register">Register Now</Link></span>
                            <Link to="/admissions">Back to Home</Link>
                        </div>
                    </div>
                </div>
            </div>

            {showForgotModal && (
                <div className="adm-modal-overlay" onClick={closeForgotModal}>
                    <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
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
                                <div className="adm-login-error">
                                    <AlertCircle size={16} />
                                    <span>{forgotError}</span>
                                </div>
                            )}

                            <form onSubmit={handleForgotSubmit}>
                                <div className="adm-login-field">
                                    <label>Registered Phone Number</label>
                                    <div className="adm-login-input">
                                        <Phone size={17} />
                                        <input
                                            type="tel"
                                            placeholder="e.g. +91 98765 43210"
                                            value={forgotPhone}
                                            onChange={(e) => setForgotPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="adm-modal-submit" disabled={forgotLoading}>
                                    {forgotLoading ? 'Searching...' : 'Find My Number'}
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