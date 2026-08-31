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
    ShieldCheck,
    FileText,
    GraduationCap,
    Phone,
    Award,
    BookOpen,
    Users,
    Building2,
    HeartHandshake,
    Home as HomeIcon
} from 'lucide-react';
import AdmissionProcedure from './AdmissionProcedure';
import FeeStructure from './FeeStructure';
import AdmissionApply from './Admissionapply';
import { db } from '../../service/firebase';
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
        { id: 'procedure', label: 'Admission Procedure', shortLabel: 'Procedure', icon: <ClipboardList size={19} /> },
        { id: 'fee', label: 'Fee Structure', shortLabel: 'Fees', icon: <CreditCard size={19} /> },
        { id: 'apply', label: 'Online Application', shortLabel: 'Apply Online', icon: <UserCheck size={19} /> },
        { id: 'track', label: 'Track Status', shortLabel: 'Track Status', icon: <Search size={19} /> }
    ];

    // Distinguishing highlights — school-appropriate, no UG/PG language
    const whyItems = [
        { icon: <Award size={22} />, tone: 'blue', title: 'Trusted Institution', kicker: 'Reputed School', desc: "Decades of academic reputation built on discipline, values and consistent results.", tag: 'Est. legacy' },
        { icon: <BookOpen size={22} />, tone: 'indigo', title: 'Strong Academics', kicker: 'From LKG to Class XII', desc: 'A well-rounded curriculum guiding students from early years through senior secondary.', tag: 'LKG – Class XII' },
        { icon: <Users size={22} />, tone: 'green', title: 'Experienced Faculty', kicker: 'Dedicated Educators', desc: 'Qualified, caring teachers focused on every child\'s academic and personal growth.', tag: 'Qualified staff' },
        { icon: <Building2 size={22} />, tone: 'pink', title: 'Modern Campus', kicker: 'Safe Infrastructure', desc: 'Well-maintained classrooms and facilities designed for a safe, engaging learning space.', tag: 'Secure campus' },
        { icon: <HeartHandshake size={22} />, tone: 'orange', title: 'Holistic Development', kicker: 'Beyond the Classroom', desc: 'Sports, arts and activities that nurture confidence alongside academic learning.', tag: 'All-round growth' },
        { icon: <ShieldCheck size={22} />, tone: 'teal', title: 'Simple Admissions', kicker: 'Guided Process', desc: 'A transparent, easy-to-follow admission journey from enquiry to enrolment.', tag: 'Easy process' }
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
        <div className="adm-dashboard-wrapper">

            {/* Navy top navbar — BHC-portal-style */}
            <header className="adm-navbar">
                <div className="adm-brand">
                    <div className="adm-brand-mark">
                        <GraduationCap size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <strong>Holy Cross</strong>
                        <span>Admissions Portal &bull; 2026–2027</span>
                    </div>
                </div>

                <nav className="adm-navlinks" aria-label="Admission page sections">
                    <button type="button" onClick={scrollToTop}><HomeIcon size={15} /> Home</button>
                    <button type="button" onClick={() => goToTab('procedure')}><ClipboardList size={15} /> Procedure</button>
                    <button type="button" onClick={scrollToWhy}><Award size={15} /> Why Us</button>
                    <button type="button" onClick={() => goToTab('fee')}><CreditCard size={15} /> Fees</button>
                    <button type="button" onClick={() => goToTab('track')}><Search size={15} /> Track Status</button>
                </nav>

                <button type="button" className="adm-nav-cta" onClick={() => goToTab('apply')}>
                    <UserCheck size={16} /> Apply Online
                </button>
            </header>

            {/* Hero */}
            <section className="adm-hero-section">
                <div className="adm-hero-copy">
                    <span className="adm-badge">
                        Admissions Open • Academic Year 2026–2027
                    </span>

                    <h1>
                        Start your journey with
                        <span> Holy Cross</span>
                    </h1>

                    <p>
                        Welcome to Holy Cross Admissions. Explore the admission procedure and fee
                        structure, apply online, and track your application status through one simple portal.
                    </p>

                    <div className="adm-hero-actions">
                        <button className="adm-primary-action" onClick={() => goToTab('apply')}>
                            Apply Online
                            <ArrowRight size={17} />
                        </button>

                        <button className="adm-secondary-action" onClick={scrollToPortal}>
                            Explore Admission
                        </button>
                    </div>

                    <div className="adm-trust-row">
                        <span><CheckCircle2 size={16} /> Secure application</span>
                        <span><CheckCircle2 size={16} /> Easy status tracking</span>
                        <span><CheckCircle2 size={16} /> 2026–27 admissions</span>
                    </div>
                </div>

                <div className="adm-hero-panel">
                    <div className="adm-panel-top">
                        <span>Admission Portal</span>
                        <span className="adm-live-dot">● Live</span>
                    </div>

                    <div className="adm-panel-icon">
                        <FileText size={28} />
                    </div>

                    <h3>Everything you need in one place</h3>
                    <p>
                        Review admission information, submit your application,
                        and follow your application progress.
                    </p>

                    <div className="adm-panel-mini-grid">
                        <div>
                            <strong>01</strong>
                            <span>Explore</span>
                        </div>
                        <div>
                            <strong>02</strong>
                            <span>Apply</span>
                        </div>
                        <div>
                            <strong>03</strong>
                            <span>Track</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why choose us — BHC-inspired colourful feature grid */}
            {/* Why choose us — BHC-inspired colourful feature grid */}
            {/* Why choose us — BHC-inspired colourful feature grid */} 
            <section className="adm-why-section">
                <div className="adm-why-heading">
                    <h2>Why Choose <span>Holy Cross</span></h2>
                    <p>A learning environment built on trust, care, and consistent academic quality.</p>
                </div>

                <div className="adm-why-grid">
                    {whyItems.map((item, idx) => (
                        <div key={idx} className={`adm-why-card tone-${item.tone}`}>
                            <div className="adm-why-icon">{item.icon}</div>
                            <h3>{item.title}</h3>
                            <span className="adm-why-kicker">{item.kicker}</span>
                            <p>{item.desc}</p>
                            <div className="adm-why-tag">
                                <Clock size={13} />
                                {item.tag}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Four-step process — circular numbered badges, BHC "Application Process" style */}
            <section className="adm-process-section">
                <div className="adm-section-heading adm-section-heading-center">
                    <span>HOW IT WORKS</span>
                    <h2>Complete your admission in 4 simple steps</h2>
                    <p>Follow the same admission journey from information to application tracking.</p>
                </div>

                <div className="adm-process-grid">
                    <div className="adm-process-card">
                        <div className="adm-process-badge">01</div>
                        <div className="adm-process-icon"><ClipboardList size={20} /></div>
                        <h3>Explore</h3>
                        <p>Review the admission procedure and important requirements.</p>
                    </div>

                    <div className="adm-process-card">
                        <div className="adm-process-badge">02</div>
                        <div className="adm-process-icon"><UserCheck size={20} /></div>
                        <h3>Apply Online</h3>
                        <p>Complete the online application using the existing form.</p>
                    </div>

                    <div className="adm-process-card">
                        <div className="adm-process-badge">03</div>
                        <div className="adm-process-icon"><CreditCard size={20} /></div>
                        <h3>Review Fees</h3>
                        <p>Check the existing fee structure before completing your admission.</p>
                    </div>

                    <div className="adm-process-card">
                        <div className="adm-process-badge">04</div>
                        <div className="adm-process-icon"><Search size={20} /></div>
                        <h3>Track Status</h3>
                        <p>Use your acknowledgement number to check your application status.</p>
                    </div>
                </div>
            </section>

            {/* Existing dashboard functions remain unchanged */}
            <main className="adm-main-portal">
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
                            <span className="adm-tab-label-full">{tab.label}</span>
                            <span className="adm-tab-label-short">{tab.shortLabel}</span>
                        </button>
                    ))}
                </div>

                <div className="adm-tab-content-area">
                    {activeTab === 'procedure' && <AdmissionProcedure />}
                    {activeTab === 'fee' && <FeeStructure />}
                    {activeTab === 'apply' && <AdmissionApply />}

                    {activeTab === 'track' && (
                        <div className="adm-track-callout">
                            <div className="adm-track-heading">
                                <span className="adm-card-kicker">APPLICATION STATUS</span>
                                <h3>Track Your Admission Application</h3>
                                <p>
                                    Enter your unique acknowledgement number below to view
                                    your current application status.
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
                                    {trackingLoading ? 'Searching...' : 'Check Status'}
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
                                                    <span className="adm-result-label">Acknowledgement No</span>
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
                                                            <Clock size={14} /> Pending Review
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="adm-result-grid">
                                                <div>
                                                    <span>Student Name</span>
                                                    <strong>{trackingResult.firstName} {trackingResult.lastName}</strong>
                                                </div>
                                                <div>
                                                    <span>Grade Applied</span>
                                                    <strong>{trackingResult.grade}</strong>
                                                </div>
                                                <div>
                                                    <span>Parent Name</span>
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
                                            <h4>No Application Found</h4>
                                            <p>
                                                No records match the acknowledgement number
                                                "{trackAck}". Please double-check your reference code.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}