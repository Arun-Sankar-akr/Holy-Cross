import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import "./AdminLogin.css"

export default function adminsLogin({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        const auth = getAuth();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (onLoginSuccess) onLoginSuccess();
        } catch (err) {
            setError('Invalid credentials. Access denied.');
        }
    };

    return (
        <div className="admins-page-container">
            <div className="admins-card">
                <div className="admins-header admins-theme">
                    <div className="admins-badge">admins Portal</div>
                    <h2>Admin & Adminsistrator</h2>
                    <p>Access web management, Admins management systems, and Adminsistrative tools.</p>
                </div>

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

                <form className="admins-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="adminsId">Admin Email </label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                            <input
                                type="email"
                                placeholder="Admin Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="admins-btn admins-btn" >
                        <span>Login to Admin Portal</span>
                        <ArrowRight size={18} />
                    </button>
                </form>

                <div className="admins-footer">
                    <ShieldCheck size={16} id='ShieldChecks'/>
                    <span>Secure end-to-end encrypted admin portal</span>
                </div>
            </div>
        </div>
    );
}

  // <div className="logins">
        //     <form onSubmit={handleLogin} className='formss'>
        //         <h3 id='headings'>admins Login</h3>
        //         {error && <p style={{ color: 'red' }}>{error}</p>}
        //         <input className='inputs'
        //             type="email"
        //             placeholder="admins Email"
        //             value={email}
        //             onChange={(e) => setEmail(e.target.value)}
        //         />
        //         <input className='inputs'
        //             type="password"
        //             placeholder="Password"
        //             value={password}
        //             onChange={(e) => setPassword(e.target.value)}
        //         />
        //         <button type="submit" className='btns'>Sign In</button>
        //     </form>
        // </div>