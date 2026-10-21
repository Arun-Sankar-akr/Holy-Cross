import React, { useCallback, useEffect, useState } from 'react';
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

/*
 * How long to wait for Firebase Auth before giving up and showing the
 * "Try Again" screen. Without this the page can sit on
 * "Preparing secure session" forever when sign-in never answers.
 */
const AUTH_TIMEOUT_MS = 15000;

const withTimeout = (promise, ms) =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            const error = new Error('Firebase authentication timed out.');
            error.code = 'auth/timeout';
            reject(error);
        }, ms);

        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            }
        );
    });

/* Wait until Firebase has restored (or confirmed there is no) saved session. */
const waitForAuthReady = () => {
    if (typeof auth.authStateReady === 'function') {
        return auth.authStateReady();
    }

    // Older Firebase SDKs: the first onAuthStateChanged call means "ready".
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            () => {
                unsubscribe();
                resolve();
            },
            (error) => {
                unsubscribe();
                reject(error);
            }
        );
    });
};

/* Make sure there is a signed-in (anonymous) user, then return it. */
async function ensureAdmission() {
    await waitForAuthReady();

    if (auth.currentUser) {
        return auth.currentUser;
    }

    const credential = await signInAnonymously(auth);

    if (!credential?.user) {
        throw new Error('Firebase authentication did not return a user.');
    }

    return credential.user;
}

const startSession = () => withTimeout(ensureAdmission(), AUTH_TIMEOUT_MS);

/* Turn a Firebase error into something a person can act on. */
const describeAuthError = (error) => {
    switch (error?.code) {
        case 'auth/operation-not-allowed':
        case 'auth/admin-restricted-operation':
            return 'Anonymous sign-in is switched off for this school\'s Firebase project. The administrator must enable it under Authentication → Sign-in method → Anonymous.';
        case 'auth/unauthorized-domain':
            return 'This website address is not authorised in Firebase. The administrator must add it under Authentication → Settings → Authorized domains.';
        case 'auth/network-request-failed':
            return 'Could not reach the server. Please check your internet connection (or disable any ad-blocker for this site) and try again.';
        case 'auth/too-many-requests':
            return 'Too many attempts were made from this device. Please wait a few minutes and try again.';
        case 'auth/timeout':
            return 'Starting the secure session is taking too long. Please check your internet connection and try again.';
        default:
            return 'Could not start a secure admission session. Please check your internet connection and try again.';
    }
};

/*
|--------------------------------------------------------------------------
| ADMISSION REGISTER PAGE
|--------------------------------------------------------------------------
*/

export default function AdmissionRegisterPage() {
    const [authReady, setAuthReady] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [retrying, setRetrying] = useState(false);

    const begin = useCallback(async (isCancelled = () => false) => {
        setAuthError(null);
        setAuthReady(false);

        try {
            await startSession();

            if (!isCancelled()) {
                setAuthReady(true);
            }
        } catch (error) {
            console.error(
                'Admission authentication failed:',
                error?.code || '',
                error
            );

            if (!isCancelled()) {
                setAuthReady(false);
                setAuthError(describeAuthError(error));
            }
        }
    }, []);

    /* Start Firebase authentication when the page loads. */
    useEffect(() => {
        let cancelled = false;

        begin(() => cancelled);

        return () => {
            cancelled = true;
        };
    }, [begin]);

    /* Retry without making the user refresh the browser. */
    const handleRetry = async () => {
        if (retrying) return;

        setRetrying(true);

        try {
            await begin();
        } finally {
            setRetrying(false);
        }
    };

    return (
        <div className="adm-standalone-page">

            {/* TOP HEADER */}
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
                    <small>Academic Year 2026–2027</small>
                </div>
            </header>

            {/* MAIN BODY */}
            <main className="adm-standalone-body">

                <Link to="/admissions" className="adm-back-link">
                    <ArrowLeft size={15} />
                    <span>Back to Admissions Home</span>
                </Link>

                {/* AUTHENTICATION ERROR */}
                {authError && (
                    <div className="adm-auth-error">
                        <AlertTriangle size={20} />

                        <div
                            className="adm-auth-error-content"
                            style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}
                        >
                            <strong>Secure Session Error</strong>

                            <span>{authError}</span>

                            <button
                                type="button"
                                onClick={handleRetry}
                                disabled={retrying}
                                className="adm-auth-retry"
                            >
                                {retrying ? 'Trying Again...' : 'Try Again'}
                            </button>
                        </div>
                    </div>
                )}

                {/* AUTHENTICATION LOADING */}
                {!authError && !authReady && (
                    <div
                        className="adm-auth-loading"
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 4px' }}
                    >
                        <Loader2 size={20} className="adm-spin" />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <strong>Preparing secure session</strong>

                            <span>
                                Please wait while we securely prepare your admission form…
                            </span>
                        </div>
                    </div>
                )}

                {/* ADMISSION FORM */}
                {authReady && <AdmissionForm mode="create" />}

            </main>

        </div>
    );
}