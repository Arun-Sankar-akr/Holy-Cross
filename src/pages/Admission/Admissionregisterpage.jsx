import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    GraduationCap,
    ArrowLeft,
    Loader2,
    AlertTriangle
} from 'lucide-react';

import {
    onAuthStateChanged,
    signInAnonymously
} from 'firebase/auth';

import { auth } from '../../service/firebase';

import AdmissionForm from './AdmissionForm';
import './Admissionstandalone.css';
// endure
function ensureAdmission() {
    return new Promise((resolve, reject) => {
        let unsubscribe = null;
        let finished = false;

        const finish = (callback, value) => {
            if (finished) {
                return;
            }

            finished = true;

            if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
            }

            callback(value);
        };

        try {
            unsubscribe = onAuthStateChanged(
                auth,

                async (user) => {
                    /*
                     * Existing authenticated user
                     */
                    if (user) {
                        finish(resolve, user);
                        return;
                    }

                    /*
                     * No authenticated user.
                     * Create anonymous Firebase session.
                     */
                    try {
                        const credential =
                            await signInAnonymously(auth);

                        if (credential?.user) {
                            finish(
                                resolve,
                                credential.user
                            );
                        } else {
                            finish(
                                reject,
                                new Error(
                                    'Firebase authentications did not return a user.'
                                )
                            );
                        }
                    } catch (error) {
                        console.error(
                            'Anonymous authentication failed:',
                            error
                        );

                        finish(reject, error);
                    }
                },

                (error) => {
                    console.error(
                        'Firebase authentication state error:',
                        error
                    );

                    finish(reject, error);
                }
            );
        } catch (error) {
            console.error(
                'Could not initialize Firebase authentication:',
                error
            );

            finish(reject, error);
        }
    });
}

/*
|--------------------------------------------------------------------------
| ADMISSION REGISTER PAGE
|--------------------------------------------------------------------------
*/

export default function AdmissionRegisterPage() {
    const [authReady, setAuthReady] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [retrying, setRetrying] = useState(false);

    /*
     * Start Firebase authentication when the page loads.
     */
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
                    setAuthReady(false);

                    setAuthError(
                        'Could not start a secure admission session. Please check your internet connection and try again.'
                    );
                }
            }
        };

        startAdmissionSession();

        return () => {
            cancelled = true;
        };
    }, []);

    /*
     * Retry authentication without requiring
     * the user to manually refresh the browser.
     */
    const handleRetry = async () => {
        if (retrying) {
            return;
        }

        setRetrying(true);
        setAuthError(null);
        setAuthReady(false);

        try {
            await ensureAdmission();

            setAuthReady(true);
        } catch (error) {
            console.error(
                'Admission authentication retry failed:',
                error
            );

            setAuthError(
                'Could not start a secure admission session. Please check your internet connection and try again.'
            );
        } finally {
            setRetrying(false);
        }
    };

    return (
        <div className="adm-standalone-page">

            {/* =====================================================
                TOP HEADER
            ====================================================== */}

            <header className="adm-standalone-topbar">

                <div className="adm-standalone-brand">

                    <div className="adm-standalone-mark">
                        <GraduationCap
                            size={22}
                            strokeWidth={2.2}
                        />
                    </div>

                    <div>
                        <strong>
                            Holy Cross
                        </strong>

                        <span>
                            New Application
                        </span>
                    </div>

                </div>

                <div className="adm-standalone-meta">

                    <span>
                        Admissions Portal
                    </span>

                    <small>
                        Academic Year 2026–2027
                    </small>

                </div>

            </header>

            {/* =====================================================
                MAIN BODY
            ====================================================== */}

            <main className="adm-standalone-body">

                {/* =================================================
                    BACK TO ADMISSIONS
                ================================================== */}

                <Link
                    to="/admissions"
                    className="adm-back-link"
                >
                    <ArrowLeft size={15} />

                    <span>
                        Back to Admissions Home
                    </span>
                </Link>

                {/* =================================================
                    AUTHENTICATION ERROR
                ================================================== */}

                {authError && (
                    <div className="adm-auth-error">

                        <AlertTriangle
                            size={20}
                        />

                        <div className="adm-auth-error-content">

                            <strong>
                                Secure Session Error
                            </strong>

                            <span>
                                {authError}
                            </span>

                            <button
                                type="button"
                                onClick={handleRetry}
                                disabled={retrying}
                                className="adm-auth-retry"
                            >
                                {retrying
                                    ? 'Trying Again...'
                                    : 'Try Again'}
                            </button>

                        </div>

                    </div>
                )}

                {/* =================================================
                    AUTHENTICATION LOADING
                ================================================== */}

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

                {/* =================================================
                    ADMISSION FORM
                ================================================== */}

                {authReady && (
                    <AdmissionForm
                        mode="create"
                    />
                )}

            </main>

        </div>
    );
}