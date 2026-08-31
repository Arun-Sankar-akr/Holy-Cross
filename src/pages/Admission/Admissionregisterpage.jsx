import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import AdmissionForm from './AdmissionForm';
import { ensureAdmission } from './Ensureadmissionauth';
import './Admissionstandalone.css';


export default function AdmissionRegisterPage() {
    const [authReady, setAuthReady] = useState(false);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        ensureAdmission()
            .then(() => {
                if (!cancelled) setAuthReady(true);
            })
            .catch((err) => {
                console.error('Anonymous auth failed:', err);
                if (!cancelled) {
                    setAuthError('Could not start a secure session. Please check your internet connection and refresh the page.');
                }
            });

        return () => { cancelled = true; };
    }, []);

    return (
        <div className="adm-standalone-page">
            <header className="adm-standalone-topbar">
                <div className="adm-standalone-brand">
                    <div className="adm-standalone-mark">
                        <GraduationCap size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <strong>Holy Cross</strong>
                        <span>New Application</span>
                    </div>
                </div>
                <div className="adm-standalone-meta">
                    <span>Admissions Portal</span>
                    <small><p>Academic Year 2026–2027</p></small>
                </div>
            </header>

            <div className="adm-standalone-body">
                <Link to="/admissions" className="adm-back-link">
                    <ArrowLeft size={15} /> Back to Admissions Home
                </Link>

                {authError && (
                    <div className="adm-auth-error">
                        <AlertTriangle size={16} />
                        <span>{authError}</span>
                    </div>
                )}

                {!authError && !authReady && (
                    <div className="adm-auth-loading">
                        <Loader2 size={18} className="adm-spin" />
                        <span>Preparing secure session…</span>
                    </div>
                )}

                {authReady && <AdmissionForm mode="create" />}
            </div>
        </div>
    );
}