import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import AdminLogin from '../admin/AdminLogin';
import { AdminDashboard } from './AdminDashboard';

export function ProtectedAdminRoute() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) return <div>Checking authorization...</div>;

    if (!user) {
        return <AdminLogin onLoginSuccess={() => { }} />;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
                <span>Logged in as: {user.email}</span>
                <button onClick={() => signOut(getAuth())}>Sign Out</button>
            </div>
            <AdminDashboard />
        </div>
    );
}