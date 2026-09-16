import React, { useEffect, useState } from 'react';
import LegalPage from './LegalPage';
import './CookiesSettings.css';

const COOKIE_CATEGORIES = [
    {
        id: 'essential',
        name: 'Essential',
        locked: true,
        description:
            'Required to log in to the ERP and admissions portal, and to keep your session secure. These cannot be turned off.',
    },
    {
        id: 'preferences',
        name: 'Preferences',
        locked: false,
        description:
            'Remembers small choices such as light/dark mode so you don\u2019t have to reset them on every visit.',
    },
    {
        id: 'analytics',
        name: 'Analytics',
        locked: false,
        description:
            'Helps us understand which pages are useful, such as which academic pages or notices get visited most, so we can improve the site.',
    },
];

const STORAGE_KEY = 'hcms_cookie_preferences';

function loadPreferences() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        /* ignore */
    }
    return { essential: true, preferences: true, analytics: false };
}

function CookiePreferencesPanel() {
    const [prefs, setPrefs] = useState(loadPreferences);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSaved(false);
    }, [prefs]);

    const toggle = (id) => {
        if (id === 'essential') return;
        setPrefs((p) => ({ ...p, [id]: !p[id] }));
    };

    const persist = (next) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            /* ignore */
        }
        setSaved(true);
    };

    const save = () => persist(prefs);

    const acceptAll = () => {
        const all = { essential: true, preferences: true, analytics: true };
        setPrefs(all);
        persist(all);
    };

    return (
        <div className="cookie-panel">
            <div className="cookie-panel-header">
                <h2>Manage your preferences</h2>
                <p>Turn categories on or off, then save your choice.</p>
            </div>

            <div className="cookie-rows">
                {COOKIE_CATEGORIES.map((c) => (
                    <div className="cookie-row" key={c.id}>
                        <div className="cookie-row-copy">
                            <strong>{c.name}</strong>
                            <span>{c.description}</span>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={prefs[c.id]}
                            aria-label={`${c.name} cookies`}
                            className={`cookie-switch ${prefs[c.id] ? 'is-on' : ''} ${c.locked ? 'is-locked' : ''}`}
                            onClick={() => toggle(c.id)}
                            disabled={c.locked}
                        >
                            <span className="cookie-switch-knob" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="cookie-panel-actions">
                <button type="button" className="cookie-btn cookie-btn-ghost" onClick={save}>
                    Save preferences
                </button>
                <button type="button" className="cookie-btn cookie-btn-solid" onClick={acceptAll}>
                    Accept all
                </button>
                {saved && <span className="cookie-saved-note">Saved</span>}
            </div>
        </div>
    );
}

export default function CookiesSettings() {
    return (
        <>
            <LegalPage
                eyebrow="Legal"
                title="Cookies Settings"
                effectiveDate="1 June 2026"
                intro="This page explains the cookies used on the Holy Cross Matriculation Higher Secondary School website and lets you choose which optional categories to allow."
                sections={[
                    {
                        id: 'what-are-cookies',
                        heading: 'What cookies are',
                        paragraphs: [
                            'Cookies are small pieces of data stored in your browser. We use them to keep you signed in, remember your preferences, and understand how the website is used.',
                        ],
                    },
                    {
                        id: 'categories',
                        heading: 'Cookie categories',
                        paragraphs: [
                            'We use three categories of cookies, described below. Essential cookies are always on because the site cannot function without them; the other two are optional and can be switched off in the panel below.',
                        ],
                    },
                    {
                        id: 'browser-controls',
                        heading: 'Controlling cookies in your browser',
                        paragraphs: [
                            'Most browsers also let you block or delete cookies directly in their settings. Doing so may affect ERP login and other features on this site that depend on essential cookies.',
                        ],
                    },
                ]}
                contactNote="Questions about cookies can be sent to hcms2002@gmail.com."
            />

            <div className="cookie-panel-wrap">
                <CookiePreferencesPanel />
            </div>
        </>
    );
}
