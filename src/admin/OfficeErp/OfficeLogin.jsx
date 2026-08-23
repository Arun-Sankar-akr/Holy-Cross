import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../service/firebase';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import './OfficeLogin.css';

export default function OfficeLogin() {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, credentials.email.trim(), credentials.password);
            localStorage.setItem('officeUser', JSON.stringify({ email: credentials.email }));
            navigate('/erp/office/dashboard');
        } catch (err) {
            console.error("Office login error:", err);
            setError('Invalid credentials or unauthorized office access.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="office-erp-page-container">
            <div className="office-erp-card">
                <div className="office-erp-header">
                    <div className="office-erp-badge">Office Portal</div>
                    <h2>Front-Office & Admin office-erp</h2>
                    <p>Access fee collection desks, visitor enquiries, and internal operations.</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        color: '#991b1b',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        margin: '1rem 1rem 0 1rem',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form className="office-erp-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Office Email ID</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="office login id or mail"
                                value={credentials.email}
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
                                placeholder="Enter password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="office-erp-btn" style={{ backgroundColor: '#059669' }} disabled={loading}>
                        <span>{loading ? 'Authenticating...' : 'Login to Office Portal'}</span>
                        <ArrowRight size={18} />
                    </button>
                </form>

                <div className="office-erp-footer">
                    <ShieldCheck size={16} />
                    <span>Secured Front-Desk Management Module</span>
                </div>
            </div>
        </div>
    );
}