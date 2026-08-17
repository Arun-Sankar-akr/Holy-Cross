import React, { useState, useEffect } from 'react';
import { UserCheck, Mail, Phone, Shield } from 'lucide-react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './Administrators.css';

export default function Administrators() {
    const [adminList, setAdminList] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'administrators'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAdminList(data);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="admin-container">
            <div className="page-header">
                <h2><Shield size={28} /> School Administration</h2>
                <p>Meet our visionary leadership dedicated to academic and ethical excellence</p>
            </div>

            {adminList.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>No administrator profiles published yet.</p>
            ) : (
                <div className="admin-grid">
                    {adminList.map((admin) => (
                        <div key={admin.id} className="admin-card">
                            <div className="admin-avatar">
                                <UserCheck size={40} />
                            </div>
                            <h3 className="admin-name">{admin.name}</h3>
                            <span className="admin-role">{admin.role}</span>
                            <p className="admin-qual">{admin.qualification}</p>
                            <p className="admin-message">"{admin.message}"</p>

                            <div className="admin-contact">
                                <div><Mail size={14} /> {admin.email}</div>
                                <div><Phone size={14} /> {admin.phone}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}