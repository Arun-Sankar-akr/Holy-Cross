import React, { useState } from 'react';
import {
    ClipboardList,
    CreditCard,
    UserCheck,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    ShieldCheck,
    GraduationCap,
    Phone,
    Award,
    BookOpen,
    Users,
    Building2,
    HeartHandshake
} from 'lucide-react';
import AdmissionProcedure from './AdmissionProcedure';
import FeeStructure from './FeeStructure';
import AdmissionApply from './Admissionapply';
import { db } from '../../service/firebase';
import logo from "../../assets/logo.png"
import { collection, getDocs, query, where } from 'firebase/firestore';
import './AdmissionDashboard.css';

export default function AdmissionDashboard() {
    const [activeTab, setActiveTab] = useState('procedure');

    // Tracking states — existing logic preserved
    const [trackAck, setTrackAck] = useState('');
    const [trackingResult, setTrackingResult] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const tabs = [
        { id: 'procedure', label: 'Admission Procedure', shortLabel: 'Procedure', hint: 'What you need to know', icon: <ClipboardList size={20} /> },
        { id: 'fee', label: 'Fee Structure', shortLabel: 'Fees', hint: 'Class-wise charges', icon: <CreditCard size={20} /> },
        { id: 'apply', label: 'Online Application', shortLabel: 'Apply', hint: 'Fill in the form', icon: <UserCheck size={20} /> },
        { id: 'track', label: 'Track Status', shortLabel: 'Track', hint: 'Check your progress', icon: <Search size={20} /> }
    ];

    const stats = [
        { value: 'LKG – XII', label: 'Classes offered' },
        { value: '2026–27', label: 'Academic year' },
        { value: 'Online', label: 'Application form' },
        { value: 'Instant', label: 'Acknowledgement number' }
    ];

    const steps = [
        { icon: <ClipboardList size={22} />, title: 'Read the procedure', desc: 'See the documents and dates you need before you start.' },
        { icon: <CreditCard size={22} />, title: 'Check the fees', desc: 'Look up the fee for your child\'s class.' },
        { icon: <UserCheck size={22} />, title: 'Submit the form', desc: 'Fill in the online application and keep your acknowledgement number.' },
        { icon: <Search size={22} />, title: 'Follow your application', desc: 'Enter the acknowledgement number to see where it stands.' }
    ];

    const whyItems = [
        { icon: <BookOpen size={22} />, tone: 'teal', title: 'Learning from LKG to Class XII', desc: 'One continuous curriculum takes children from their first classroom to senior secondary, so they never have to start over.', tag: 'LKG – Class XII' },
        { icon: <Award size={22} />, tone: 'sun', title: 'A school parents trust', desc: 'Years of steady results, built on discipline and values.', tag: 'Reputed school' },
        { icon: <Users size={22} />, tone: 'coral', title: 'Teachers who know each child', desc: 'Qualified staff who care about growth, not just marks.', tag: 'Qualified staff' },
        { icon: <Building2 size={22} />, tone: 'sky', title: 'A safe, well-kept campus', desc: 'Bright classrooms and secure facilities.', tag: 'Secure campus' },
        { icon: <HeartHandshake size={22} />, tone: 'leaf', title: 'Sports, arts and activities', desc: 'Confidence grows outside the classroom too.', tag: 'All-round growth' },
        { icon: <ShieldCheck size={22} />, tone: 'plum', title: 'An admission process that is easy to follow', desc: 'Clear steps from first enquiry to enrolment, with a number you can use to check progress at any time.', tag: 'Guided process' }
    ];

    const handleTrackStatus = async (e) => {
        e.preventDefault();
        if (!trackAck.trim()) return;

        setTrackingLoading(true);
        setHasSearched(true);
        setTrackingResult(null);

        try {
            const q = query(
                collection(db, 'admissions'),
                where('acknowledgementNumber', '==', trackAck.trim())
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                setTrackingResult(docData);
            } else {
                setTrackingResult(null);
            }
        } catch (error) {
            console.error('Error tracking application:', error);
            alert('Failed to fetch status. Please try again.');
        } finally {
            setTrackingLoading(false);
        }
    };

    const scrollToPortal = () => {
        document.querySelector('.adm-main-portal')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const goToTab = (tabId) => {
        setActiveTab(tabId);
        scrollToPortal();
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToWhy = () => {
        document.querySelector('.adm-why-section')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    return (
        <div className="adm-page">
            {/* ---------- Floating top bar ---------- */}
            <header className="adm-navbar">
                <div className="adm-brand">
                    <div className="adm-brand-mark">
                        <img src={logo} alt="" className="logo" />
                    </div>
                    <div className="adm-brand-text">
                        <strong>Holy Cross Matric. Hr. Sec. School</strong>
                        <span>Admissions 2026–2027</span>
                    </div>
                </div>

                <nav className="adm-navlinks" aria-label="Admission page sections">
                    <button type="button" onClick={() => goToTab('procedure')}>Procedure</button>
                    <button type="button" onClick={() => goToTab('fee')}>Fees</button>
                    <button type="button" onClick={scrollToWhy}>Why Holy Cross</button>
                    <button type="button" onClick={() => goToTab('track')}>Track status</button>
                </nav>

                <button type="button" className="adm-nav-cta" onClick={() => goToTab('apply')}>
                    Apply online
                    <ArrowUpRight size={16} />
                </button>
            </header>

            {/* ---------- Hero: bento grid ---------- */}
            <section className="adm-hero-section">
                <div className="adm-bento">
                    <div className="adm-bento-main">
                        <span className="adm-badge">
                            <span className="adm-badge-dot" />
                            Admissions open for 2026–2027
                        </span>

                        <h1>
                            Start your child's <span>bright future</span> with one simple step.
                        </h1>

                        <p>
                            Read how admissions work, apply online in a few minutes and follow
                            your application from one friendly place. No queues, no guesswork.
                        </p>

                        <div className="adm-hero-actions">
                            <button className="adm-primary-action" onClick={() => goToTab('apply')}>
                                Start application
                                <ArrowRight size={18} />
                            </button>

                            <button className="adm-secondary-action" onClick={() => goToTab('track')}>
                                Track an application
                            </button>
                        </div>
                    </div>

                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`adm-bento-tile tile-${tab.id}`}
                            onClick={() => goToTab(tab.id)}
                        >
                            <span className="adm-bento-tile-icon">{tab.icon}</span>
                            <ArrowUpRight size={20} className="adm-bento-tile-arrow" />
                            <span className="adm-bento-tile-text">
                                <strong>{tab.label}</strong>
                                <small>{tab.hint}</small>
                            </span>
                        </button>
                    ))}

                    {stats.map((s) => (
                        <div key={s.label} className="adm-stat">
                            <strong>{s.value}</strong>
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            <div className="adm-dashboard-wrapper">

                {/* ---------- Portal ---------- */}
                <main className="adm-main-portal">
                    <div className="adm-portal-head">
                        <div>
                            <span className="adm-eyebrow">Admission desk</span>
                            <h2>Everything you need, in one place</h2>
                        </div>
                        <p><Phone size={15} /> Keep your acknowledgement number safe. You will need it to track your application.</p>
                    </div>

                    <div className="adm-tabs-container" role="tablist" aria-label="Admission sections">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={`adm-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="adm-tab-icon">{tab.icon}</span>
                                <span className="adm-tab-text">
                                    <span className="adm-tab-label-full">{tab.label}</span>
                                    <span className="adm-tab-label-short">{tab.shortLabel}</span>
                                    <small>{tab.hint}</small>
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="adm-tab-content-area" key={activeTab}>
                        {activeTab === 'procedure' && <AdmissionProcedure />}
                        {activeTab === 'fee' && <FeeStructure />}
                        {activeTab === 'apply' && <AdmissionApply />}

                        {activeTab === 'track' && (
                            <div className="adm-track-callout">
                                <div className="adm-track-heading">
                                    <span className="adm-card-kicker">Application status</span>
                                    <h3>Where is my application?</h3>
                                    <p>
                                        Enter the acknowledgement number you received after
                                        applying to see its current status.
                                    </p>
                                </div>

                                <form onSubmit={handleTrackStatus} className="adm-track-form">
                                    <div className="adm-input-wrap">
                                        <Search size={18} />
                                        <input
                                            type="text"
                                            placeholder="Enter acknowledgement number"
                                            value={trackAck}
                                            onChange={(e) => setTrackAck(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="submit-action-btn"
                                        disabled={trackingLoading}
                                    >
                                        {trackingLoading ? 'Searching...' : 'Check status'}
                                        {!trackingLoading && <ArrowRight size={17} />}
                                    </button>
                                </form>

                                <div className="adm-track-help">
                                    <Phone size={15} />
                                    <span>Keep your acknowledgement number ready for future reference.</span>
                                </div>

                                {hasSearched && !trackingLoading && (
                                    <div className="adm-result-area">
                                        {trackingResult ? (
                                            <div className="adm-result-card">
                                                <div className="adm-result-header">
                                                    <div>
                                                        <span className="adm-result-label">Acknowledgement no.</span>
                                                        <h4>{trackingResult.acknowledgementNumber}</h4>
                                                    </div>

                                                    <div>
                                                        {trackingResult.status === 'Approved' && (
                                                            <span className="status-pill approved">
                                                                <CheckCircle2 size={14} /> Approved
                                                            </span>
                                                        )}

                                                        {trackingResult.status === 'Rejected' && (
                                                            <span className="status-pill rejected">
                                                                <XCircle size={14} /> Rejected
                                                            </span>
                                                        )}

                                                        {(!trackingResult.status || trackingResult.status === 'Pending') && (
                                                            <span className="status-pill pending">
                                                                <Clock size={14} /> Pending review
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="adm-result-grid">
                                                    <div>
                                                        <span>Student name</span>
                                                        <strong>{trackingResult.firstName} {trackingResult.lastName}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Grade applied</span>
                                                        <strong>{trackingResult.grade}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Parent name</span>
                                                        <strong>{trackingResult.parentName}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Phone</span>
                                                        <strong>{trackingResult.phone}</strong>
                                                    </div>
                                                </div>

                                                {trackingResult.status === 'Approved' && (
                                                    <div className="adm-approved-message">
                                                        <CheckCircle2 size={18} />
                                                        <span>
                                                            Congratulations! Your application has been approved
                                                            and automatically enrolled into the Student ERP records.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="adm-no-result">
                                                <AlertCircle size={30} />
                                                <h4>No application found</h4>
                                                <p>
                                                    Nothing matches "{trackAck}". Check the number for typos
                                                    and try again.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* ---------- How it works ---------- */}
                <section className="adm-process-section">
                    <div className="adm-section-heading">
                        <span className="adm-eyebrow">How it works</span>
                        <h2>Four easy steps from enquiry to enrolment</h2>
                        <p>Follow them in order, or jump to any step from the admission desk.</p>
                        <button type="button" className="adm-why-cta" onClick={() => goToTab('apply')}>
                            Apply online <ArrowRight size={17} />
                        </button>
                    </div>

                    <ol className="adm-process-grid">
                        {steps.map((step, idx) => (
                            <li key={step.title} className="adm-process-card">
                                <span className="adm-process-number">{String(idx + 1).padStart(2, '0')}</span>
                                <div className="adm-process-text">
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
                                </div>
                                <span className="adm-process-icon">{step.icon}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* ---------- Why Holy Cross ---------- */}
                <section className="adm-why-section">
                    <div className="adm-why-intro">
                        <span className="adm-eyebrow">Why Holy Cross</span>
                        <h2>Why families choose Holy Cross</h2>
                        <p>A learning environment built on trust, care and steady academic quality.</p>
                    </div>

                    <div className="adm-why-grid">
                        {whyItems.map((item, idx) => (
                            <article key={idx} className={`adm-why-card tone-${item.tone}`}>
                                <div className="adm-why-icon">{item.icon}</div>
                                <div className="adm-why-body">
                                    <h3>{item.title}</h3>
                                    <p>{item.desc}</p>
                                    <span className="adm-why-tag">{item.tag}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ---------- Closing call to action ---------- */}
                <section className="adm-cta-band">
                    <div className="adm-cta-copy">
                        <h2>Ready to apply for 2026–2027?</h2>
                        <p>The form takes a few minutes. You get an acknowledgement number as soon as you submit.</p>
                    </div>
                    <div className="adm-cta-actions">
                        <button type="button" className="adm-cta-primary" onClick={() => goToTab('apply')}>
                            Apply online <ArrowRight size={18} />
                        </button>
                        <button type="button" className="adm-cta-ghost" onClick={scrollToTop}>
                            Back to top
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
}