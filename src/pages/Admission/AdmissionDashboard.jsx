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
        { id: 'procedure', label: 'Admission Procedure', shortLabel: 'Procedure', hint: 'What you need to know', icon: <ClipboardList size={19} /> },
        { id: 'fee', label: 'Fee Structure', shortLabel: 'Fees', hint: 'Class-wise charges', icon: <CreditCard size={19} /> },
        { id: 'apply', label: 'Online Application', shortLabel: 'Apply', hint: 'Fill in the form', icon: <UserCheck size={19} /> },
        { id: 'track', label: 'Track Status', shortLabel: 'Track', hint: 'Check your progress', icon: <Search size={19} /> }
    ];

    const steps = [
        { icon: <ClipboardList size={20} />, title: 'Read the procedure', desc: 'See the documents and dates you need before you start.' },
        { icon: <CreditCard size={20} />, title: 'Check the fees', desc: 'Look up the fee for your child\'s class.' },
        { icon: <UserCheck size={20} />, title: 'Submit the form', desc: 'Fill in the online application and keep your acknowledgement number.' },
        { icon: <Search size={20} />, title: 'Follow your application', desc: 'Enter the acknowledgement number to see where it stands.' }
    ];

    const whyItems = [
        { icon: <BookOpen size={24} />, tone: 'teal', size: 'wide', title: 'Learning from LKG to Class XII', desc: 'One continuous curriculum takes children from their first classroom to senior secondary, so they never have to start over.', tag: 'LKG – Class XII' },
        { icon: <Award size={24} />, tone: 'sun', size: 'tall', title: 'A school parents trust', desc: 'Years of steady results, built on discipline and values.', tag: 'Reputed school' },
        { icon: <Users size={24} />, tone: 'coral', size: 'base', title: 'Teachers who know each child', desc: 'Qualified staff who care about growth, not just marks.', tag: 'Qualified staff' },
        { icon: <Building2 size={24} />, tone: 'sky', size: 'base', title: 'A safe, well-kept campus', desc: 'Bright classrooms and secure facilities.', tag: 'Secure campus' },
        { icon: <HeartHandshake size={24} />, tone: 'leaf', size: 'base', title: 'Sports, arts and activities', desc: 'Confidence grows outside the classroom too.', tag: 'All-round growth' },
        { icon: <ShieldCheck size={24} />, tone: 'plum', size: 'wide', title: 'An admission process that is easy to follow', desc: 'Clear steps from first enquiry to enrolment, with a number you can use to check progress at any time.', tag: 'Guided process' }
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
        document.querySelector('.adm-dashboard-wrapper')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const scrollToWhy = () => {
        document.querySelector('.adm-why-section')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    return (
        <div className="adm-page">
            {/* ---------- Floating navigation ---------- */}
            <header className="adm-navbar">
                <div className="adm-navbar-inner">
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
                    </button>
                </div>
            </header>

            {/* ---------- Hero ---------- */}
            <section className="adm-hero-section">
                <div className="adm-hero-copy">
                    <span className="adm-badge">
                        <span className="adm-badge-dot" />
                        Admissions are open for 2026–2027
                    </span>

                    <h1>A good school year begins with a simple first step.</h1>

                    <p>
                        Read how admissions work, apply online in a few minutes, and follow
                        your application from one place. No queues, no guesswork.
                    </p>

                    <div className="adm-hero-actions">
                        <button className="adm-primary-action" onClick={() => goToTab('apply')}>
                            Start your application
                            <ArrowRight size={18} />
                        </button>

                        <button className="adm-secondary-action" onClick={() => goToTab('track')}>
                            Track an application
                        </button>
                    </div>

                    <ul className="adm-trust-row">
                        <li><CheckCircle2 size={16} /> Secure online form</li>
                        <li><CheckCircle2 size={16} /> Instant acknowledgement number</li>
                        <li><CheckCircle2 size={16} /> LKG to Class XII</li>
                    </ul>
                </div>

                <div className="adm-hero-visual" aria-hidden="false">
                    <div className="adm-hero-shape adm-hero-shape-a" />
                    <div className="adm-hero-shape adm-hero-shape-b" />

                    <div className="adm-hero-panel">
                        <div className="adm-panel-head">
                            <span className="adm-panel-icon"><GraduationCap size={22} /></span>
                            <div>
                                <strong>Your admission path</strong>
                                <span>Four steps, about ten minutes</span>
                            </div>
                        </div>

                        <ol className="adm-panel-list">
                            <li><button type="button" onClick={() => goToTab('procedure')}><span>Read the procedure</span><ArrowUpRight size={16} /></button></li>
                            <li><button type="button" onClick={() => goToTab('fee')}><span>Check the fees</span><ArrowUpRight size={16} /></button></li>
                            <li><button type="button" onClick={() => goToTab('apply')}><span>Submit the form</span><ArrowUpRight size={16} /></button></li>
                            <li><button type="button" onClick={() => goToTab('track')}><span>Follow your application</span><ArrowUpRight size={16} /></button></li>
                        </ol>
                    </div>

                    <div className="adm-float-chip">
                        <span className="adm-live-dot" />
                        Applications open
                    </div>
                </div>
            </section>

            <div className="adm-dashboard-wrapper">

                {/* ---------- Process timeline ---------- */}
                <section className="adm-process-section">
                    <div className="adm-section-heading">
                        <h2>Four steps from enquiry to enrolment</h2>
                        <p>Follow them in order, or jump to any step using the menu above.</p>
                    </div>

                    <ol className="adm-process-grid">
                        {steps.map((step, idx) => (
                            <li key={step.title} className="adm-process-card">
                                <div className="adm-process-top">
                                    <span className="adm-process-badge">{idx + 1}</span>
                                    <span className="adm-process-icon">{step.icon}</span>
                                </div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* ---------- Portal: side rail + content ---------- */}
                <main className="adm-main-portal">
                    <div className="adm-portal-layout">
                        <aside className="adm-portal-rail">
                            <h2 className="adm-rail-title">Admission desk</h2>

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

                            <div className="adm-rail-note">
                                <Phone size={16} />
                                <p>Keep your acknowledgement number safe. You will need it to track your application.</p>
                            </div>
                        </aside>

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
                    </div>
                </main>

                {/* ---------- Why Holy Cross: bento grid ---------- */}
                <section className="adm-why-section">
                    <div className="adm-section-heading">
                        <h2>Why families choose Holy Cross</h2>
                        <p>A learning environment built on trust, care and steady academic quality.</p>
                    </div>

                    <div className="adm-why-grid">
                        {whyItems.map((item, idx) => (
                            <article key={idx} className={`adm-why-card tone-${item.tone} size-${item.size}`}>
                                <div className="adm-why-icon">{item.icon}</div>
                                <h3>{item.title}</h3>
                                <p>{item.desc}</p>
                                <span className="adm-why-tag">{item.tag}</span>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ---------- Closing call to action ---------- */}
                <section className="adm-cta-band">
                    <div>
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