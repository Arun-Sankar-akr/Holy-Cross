import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function AdminLogin({ onLoginSuccess }) { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <form onSubmit={handleLogin}>
            <h3>Admin Login</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Sign In</button>
        </form>
    );
}