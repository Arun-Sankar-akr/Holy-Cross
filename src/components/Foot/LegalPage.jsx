import React, { useEffect, useState } from 'react';
import './LegalPage.css';

/**
 * Shared layout for Privacy Policy / Terms of Service / Cookies Settings.
 *
 * Props:
 *  - eyebrow: small mono label above the title (e.g. "Legal")
 *  - title: page heading (e.g. "Privacy Policy")
 *  - effectiveDate: string, e.g. "1 June 2026"
 *  - intro: short paragraph under the title
 *  - sections: [{ id, heading, paragraphs?: string[], list?: string[] }]
 *  - contactNote: optional closing line (defaults to school contact copy)
 */
export default function LegalPage({
    eyebrow = 'Legal',
    title,
    effectiveDate,
    intro,
    sections = [],
    contactNote,
}) {
    const [activeId, setActiveId] = useState(sections[0]?.id);

    useEffect(() => {
        const headings = sections
            .map((s) => document.getElementById(s.id))
            .filter(Boolean);

        if (!headings.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((e) => e.isIntersecting);
                if (visible) setActiveId(visible.target.id);
            },
            { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
        );

        headings.forEach((h) => observer.observe(h));
        return () => observer.disconnect();
    }, [sections]);

    const handleJump = (e, id) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveId(id);
        }
    };

    return (
        <main className="legal-page">
            <header className="legal-hero">
                <span className="legal-eyebrow">{eyebrow}</span>
                <h1>{title}</h1>
                {effectiveDate && (
                    <p className="legal-date">Effective {effectiveDate}</p>
                )}
                {intro && <p className="legal-intro">{intro}</p>}
            </header>

            <div className="legal-body">
                <nav className="legal-toc" aria-label="Sections">
                    <span className="legal-toc-label">On this page</span>
                    <ol>
                        {sections.map((s, i) => (
                            <li key={s.id}>
                                <a
                                    href={`#${s.id}`}
                                    className={activeId === s.id ? 'is-active' : ''}
                                    onClick={(e) => handleJump(e, s.id)}
                                >
                                    <span className="legal-toc-index">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    {s.heading}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="legal-content">
                    {sections.map((s, i) => (
                        <section key={s.id} id={s.id} className="legal-section">
                            <h2>
                                <span className="legal-section-index">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                {s.heading}
                            </h2>

                            {s.paragraphs?.map((p, idx) => (
                                <p key={idx}>{p}</p>
                            ))}

                            {s.list && (
                                <ul>
                                    {s.list.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}

                    {contactNote && (
                        <section className="legal-section legal-contact-note">
                            <p>{contactNote}</p>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
