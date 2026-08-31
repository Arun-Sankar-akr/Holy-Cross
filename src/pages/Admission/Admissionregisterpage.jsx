import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    GraduationCap,
    ArrowLeft,
    Loader2,
    AlertTriangle
} from 'lucide-react';

import AdmissionForm from './AdmissionForm';
import { ensureAdmission } from './Ensureadmissionauth.js';

import './Admissionstandalone.css';

export default function AdmissionRegisterPage() {
    const [authReady, setAuthReady] = useState(false);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const startAdmissionSession = async () => {
            try {
                setAuthError(null);
                setAuthReady(false);

                await ensureAdmission();

                if (!cancelled) {
                    setAuthReady(true);
                }
            } catch (error) {
                console.error(
                    'Admission authentication failed:',
                    error
                );

                if (!cancelled) {
                    setAuthError(
                        'Could not start a secure admission session. Please check your internet connection and refresh the page.'
                    );
                }
            }
        };

        startAdmissionSession();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="adm-standalone-page">

            {/* ================================
                TOP HEADER
            ================================= */}
            <header className="adm-standalone-topbar">

                <div className="adm-standalone-brand">

                    <div className="adm-standalone-mark">
                        <GraduationCap
                            size={22}
                            strokeWidth={2.2}
                        />
                    </div>

                    <div>
                        <strong>Holy Cross</strong>
                        <span>New Application</span>
                    </div>

                </div>

                <div className="adm-standalone-meta">
                    <span>Admissions Portal</span>

                    <small>
                        Academic Year 2026–2027
                    </small>
                </div>

            </header>

            {/* ================================
                MAIN BODY
            ================================= */}
            <main className="adm-standalone-body">

                {/* Back Navigation */}
                <Link
                    to="/admissions"
                    className="adm-back-link"
                >
                    <ArrowLeft size={15} />
                    <span>
                        Back to Admissions Home
                    </span>
                </Link>

                {/* ================================
                    AUTH ERROR
                ================================= */}
                {authError && (
                    <div className="adm-auth-error">

                        <AlertTriangle
                            size={18}
                        />

                        <div>
                            <strong>
                                Secure Session Error
                            </strong>

                            <span>
                                {authError}
                            </span>

                            <button
                                type="button"
                                onClick={handleRetry}
                                className="adm-auth-retry"
                            >
                                Try Again
                            </button>
                        </div>

                    </div>
                )}

                {/* ================================
                    AUTH LOADING
                ================================= */}
                {!authError && !authReady && (
                    <div className="adm-auth-loading">

                        <Loader2
                            size={20}
                            className="adm-spin"
                        />

                        <div>
                            <strong>
                                Preparing secure session
                            </strong>

                            <span>
                                Please wait while we securely
                                prepare your admission form…
                            </span>
                        </div>

                    </div>
                )}

                {/* ================================
                    ADMISSION FORM
                ================================= */}
                {authReady && (
                    <AdmissionForm
                        mode="create"
                    />
                )}

            </main>
        </div>
    );
}
