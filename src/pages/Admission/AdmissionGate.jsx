import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { Lock } from 'lucide-react';
import { db } from '../../service/firebase';
import { AdmissionConfigContext, buildAdmissionConfig } from './admissionSettings';

// Admission pages are visible only while the admin has switched admissions ON
// (Firestore: site_settings/admission -> { open: true }).
// Missing document, read errors or open !== true all count as CLOSED.
// Also provides academic year / class range / open classes to the pages via useAdmissionConfig().
export default function AdmissionGate({ children }) {
    const [status, setStatus] = useState('loading'); // loading | open | closed
    const [config, setConfig] = useState(() => buildAdmissionConfig({}));

    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'site_settings', 'admission'),
            (snap) => {
                const cfg = buildAdmissionConfig(snap.exists() ? snap.data() : {});
                setConfig(cfg);
                // Closed when the switch is off, or when every class has been closed manually.
                setStatus(cfg.open && cfg.openClasses.length > 0 ? 'open' : 'closed');
            },
            (err) => {
                console.error('Admission status error:', err);
                setStatus('closed');
            }
        );
        return () => unsub();
    }, []);

    if (status === 'loading') {
        return (
            <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#64748b' }}>
                Checking admission status…
            </div>
        );
    }

    if (status === 'open') {
        return <AdmissionConfigContext.Provider value={config}>{children}</AdmissionConfigContext.Provider>;
    }

    return (
        <section
            style={{
                minHeight: '70vh',
                display: 'grid',
                placeItems: 'center',
                padding: '48px 24px',
                background: '#f6f9fc',
            }}
        >
            <div
                style={{
                    maxWidth: 480,
                    textAlign: 'center',
                    background: '#fff',
                    border: '1px solid #e2e9f2',
                    borderRadius: 20,
                    padding: '40px 32px',
                    boxShadow: '0 12px 32px rgba(23,35,58,.07)',
                }}
            >
                <span
                    style={{
                        display: 'inline-grid',
                        placeItems: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: '#ffe8e3',
                        color: '#f26b52',
                    }}
                >
                    <Lock size={26} />
                </span>
                <h1 style={{ margin: '18px 0 8px', fontSize: 26, color: '#17233a' }}>Admissions are closed</h1>
                <p style={{ margin: 0, color: '#46546b', lineHeight: 1.6 }}>
                    We are not accepting admission applications right now. Please check back later or
                    contact the school office for details.
                </p>
                <Link
                    to="/"
                    style={{
                        display: 'inline-block',
                        marginTop: 24,
                        padding: '12px 22px',
                        borderRadius: 999,
                        background: '#2f7cf6',
                        color: '#fff',
                        fontWeight: 700,
                        textDecoration: 'none',
                    }}
                >
                    Back to home
                </Link>
            </div>
        </section>
    );
}