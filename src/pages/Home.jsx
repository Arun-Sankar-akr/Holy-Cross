import React, { useState, useEffect } from 'react';
import { db } from '../service/firebase';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import {
    HeartHandshake, BookOpen, Users, ArrowRight,
    Compass, CheckCircle2, Target, Globe2,
    Trophy, Megaphone, MapPin,
    Navigation, Phone, ArrowUp, Sparkles, Clock, Quote, Plus
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import campusBg1 from '../assets/bg2.png';
import campusBg2 from '../assets/bg3.png';
import campusBg3 from '../assets/bg4.png';
import campusBg4 from '../assets/bg5.png';
import campusBg5 from '../assets/bg6.png';
import campusBg6 from '../assets/bg7.jpg';
import campusBg7 from '../assets/bg8.jpg';
import campusBg8 from '../assets/bg9.jpg';
import campusBg9 from '../assets/bg10.jpg';
import campusBg10 from '../assets/image.png';

import photo from '../assets/photo1.png';

import HomeNoticeBoard from './HomeNoticeBoard';
import './Home.css';

const schoolCoordinates = [10.8124016, 78.6360993];

const heroImages = [
    campusBg1,
    campusBg2,
    campusBg3,
    campusBg10,
    campusBg4,
    campusBg5,
    campusBg6,
    campusBg7,
    campusBg8,
    campusBg9,
];

/* -----------------------------------------------------------------------
   SealBadge — the page's one signature element: a scalloped, wax-seal /
   medallion mark. Reused for section eyebrows, milestone points, and
   achievement medals so the whole page reads as one coherent "honours"
   system rather than borrowed icon-in-a-circle defaults.
------------------------------------------------------------------------*/
function SealBadge({ children, className = '' }) {
    return (
        <span className={`seal-badge ${className}`}>
            <svg viewBox="0 0 100 100" className="seal-badge-ring" aria-hidden="true">
                <path d="M50 2 L59 9 L69 3 L72 14 L84 12 L83 24 L94 27 L89 37 L98 45 L89 53 L94 63 L83 66 L84 78 L72 76 L69 87 L59 81 L50 88 L41 81 L31 87 L28 76 L16 78 L17 66 L6 63 L11 53 L2 45 L11 37 L6 27 L17 24 L16 12 L28 14 L31 3 L41 9 Z" />
            </svg>
            <span className="seal-badge-inner">{children}</span>
        </span>
    );
}

export default function Home({ setActivePage }) {

    const navigate = useNavigate();

    const [showScrollTop, setShowScrollTop] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [toppersList, setToppersList] = useState([]);

    // Scroll-to-top button visibility listener
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer for scroll reveal animations
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.12
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                } else {
                    entry.target.classList.remove('is-visible');
                }
            });
        }, observerOptions);

        const animatedElements = document.querySelectorAll('.scroll-animate');
        animatedElements.forEach(el => observer.observe(el));

        return () => {
            animatedElements.forEach(el => observer.unobserve(el));
        };
    }, [upcomingEvents, toppersList]);

    useEffect(() => {
        if (heroImages.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const unsubEvents = onSnapshot(collection(db, 'upcoming_events'), (snapshot) => {
            setUpcomingEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubToppers = onSnapshot(collection(db, 'exam_toppers'), (snapshot) => {
            setToppersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubEvents();
            unsubToppers();
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <div className="home-wrapper">

            {/* 1. Brass Rail Ticker */}
            <div className="ticker-rail">
                <div className="ticker-rail-label">
                    <Megaphone size={13} />
                    <span>NOTICES</span>
                </div>
                <div className="ticker-rail-track">
                    <div className="ticker-rail-content">
                        <p>
                            <span>Academic Year Theme — "Soaring towards Bright Future"</span>
                            <span className="ticker-rail-dot">✦</span>
                            <span>Admissions open for Grade X, XI &amp; XII</span>
                            <span className="ticker-rail-dot">✦</span>
                            <span>Annual cultural &amp; sports calendar released</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Hero — Full-Bleed Background Carousel, Centered Content */}
            <section className="hero-crest-section">
                <div className="hero-bg-carousel">
                    {heroImages.map((img, index) => (
                        <div
                            key={index}
                            className={`hero-bg-slide ${index === currentSlide ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))}
                    <div className="hero-bg-tint" />
                </div>

                <div className="hero-content-center">
                    <div className="hero-crest-row">
                        <SealBadge className="seal-badge-lg seal-badge-onphoto">
                            <span className="seal-year">2002</span>
                            <span className="seal-caption">Est.</span>
                        </SealBadge>
                        <span className="hero-eyebrow hero-eyebrow-onphoto">Holy Cross Fathers · Province of Tamil Nadu</span>
                    </div>

                    <h1 className="hero-heading hero-heading-onphoto">
                        <span className="hero-heading-script">Welcome to</span>
                        Holy Cross Matriculation
                        <span className="hero-heading-accent">Higher Secondary School</span>
                    </h1>

                    <p className="hero-lede hero-lede-onphoto">
                        A campus in <strong>Somarasampettai, Trichy</strong>, built on value-based,
                        holistic education — nurturing intellect, character, and faith since 2002.
                    </p>

                    <div className="hero-cta-row">
                        <button className="btn-primary" onClick={() => navigate('/gallery')}>
                            <span>Explore the campus</span>
                            <ArrowRight size={15} />
                        </button>
                        <button className="btn-secondary btn-secondary-onphoto" onClick={() => navigate('school/calendar')}>
                            Academic calendar
                        </button>
                    </div>

                    <div className="hero-plaque-row hero-plaque-row-center">
                        <div className="hero-plaque hero-plaque-onphoto">
                            <span className="plaque-num">2002</span>
                            <span className="plaque-label">Founded</span>
                        </div>
                        <div className="hero-plaque hero-plaque-onphoto plaque-emerald">
                            <span className="plaque-num">100%</span>
                            <span className="plaque-label">Board-exam focus</span>
                        </div>
                        <div className="hero-plaque hero-plaque-onphoto plaque-gold">
                            <span className="plaque-num">2.7+</span>
                            <span className="plaque-label">Acres of campus</span>
                        </div>
                        <div className="hero-plaque hero-plaque-onphoto">
                            <span className="plaque-num">XII</span>
                            <span className="plaque-label">Grades taught</span>
                        </div>
                    </div>

                    <span className="hero-frame-tag">
                        <Sparkles size={13} /> Life at HCMHSS
                    </span>
                </div>
            </section>

            {/* 3. Notice Board */}
            <div className="scroll-animate anim-fade-up">
                <HomeNoticeBoard onNavigate={setActivePage} />
            </div>

            {/* 4. Core Pillars — Shelf of Plaques */}
            <section className="rail-section scroll-animate anim-slide-left">
                <div className="pillars-shelf">
                    <div className="plaque-card">
                        <div className="plaque-card-top">
                            <span className="plaque-tag">Motto</span>
                            <SealBadge><HeartHandshake size={16} /></SealBadge>
                        </div>
                        <h3>Love &amp; Service to Humanity</h3>
                        <p>Quality education for every student, with mutual respect for diverse religious backgrounds and cultural heritage.</p>
                    </div>

                    <div className="plaque-card plaque-featured">
                        <div className="plaque-card-top">
                            <span className="plaque-tag plaque-tag-light">Vision</span>
                            <SealBadge><Compass size={16} /></SealBadge>
                        </div>
                        <h3>Education of Mind &amp; Heart</h3>
                        <p>Inspired by Blessed Basil Antony Moreau to form youth intellectually, morally, and spiritually.</p>
                    </div>

                    <div className="plaque-card">
                        <div className="plaque-card-top">
                            <span className="plaque-tag plaque-tag-gold">Theme</span>
                            <SealBadge><Target size={16} /></SealBadge>
                        </div>
                        <h3>Soaring Towards Bright Future</h3>
                        <p>Nurturing personal excellence through academics, cultural festivals, athletic meets, and enrichment programs.</p>
                    </div>
                </div>
            </section>

            {/* Principal's Desk — Letter on Parchment */}
            <section className="rail-section scroll-animate anim-slide-right">
                <div className="letter-section">
                    <div className="letter-portrait">
                        <img src={photo} alt="Principal, Holy Cross Matriculation Higher Secondary School" />
                        <span className="letter-portrait-frame" />
                    </div>
                    <div className="letter-content">
                        <span className="eyebrow-line">Leadership message</span>
                        <h3>From the Principal's Desk</h3>
                        <span className="letter-subtitle">Holy Cross Fathers, Province of Tamil Nadu</span>
                        <Quote size={24} className="letter-quote-mark" />
                        <p className="letter-quote">
                            Education is not merely about preparing for a living, but building a foundation
                            for life. At Holy Cross, we strive to cultivate intellectual curiosity, emotional
                            strength, and spiritual grounding in every child. We invite you to partner with us
                            as we guide your children toward soaring into a bright, purposeful future.
                        </p>
                        <div className="letter-signature">
                            Fr. A. Arokia Sahayaraj <span className="letter-role">Principal</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. About Us + Ledger Timeline */}
            <section className="rail-section scroll-animate anim-blur-zoom">
                <div className="about-grid">
                    <div className="about-main">
                        <span className="eyebrow-line">About us</span>
                        <h2>Holy Cross Matriculation Hr. Sec. School</h2>

                        <p className="about-lead">
                            Owned and managed by an international congregation, the school is committed to the
                            cause of value-based education as insisted by Blessed Basil Antony Moreau, a French
                            diocesan priest who founded the congregation in 1837.
                        </p>

                        <p className="about-body">
                            He envisioned education that empowers the young for a better, brighter world. Holy
                            Cross Matriculation Hr. Sec. School at Somarasampettai is open to all pupils,
                            regardless of faith, in the pursuit of good and quality education.
                        </p>

                        <p className="about-body">
                            The congregation continues to invest its people and resources into the infrastructure
                            of the school. Our teaching and non-teaching staff together deliver curricular and
                            co-curricular programmes toward the holistic development of every student.
                        </p>

                        <div className="ledger-timeline">
                            <div className="ledger-item">
                                <SealBadge className="seal-badge-sm"><span>1</span></SealBadge>
                                <div>
                                    <span className="ledger-year">2002</span>
                                    <span className="ledger-desc">Started with a thatched roof</span>
                                </div>
                            </div>
                            <div className="ledger-item">
                                <SealBadge className="seal-badge-sm"><span>2</span></SealBadge>
                                <div>
                                    <span className="ledger-year">2011</span>
                                    <span className="ledger-desc">Upgraded to High School</span>
                                </div>
                            </div>
                            <div className="ledger-item">
                                <SealBadge className="seal-badge-sm"><span>3</span></SealBadge>
                                <div>
                                    <span className="ledger-year">2014</span>
                                    <span className="ledger-desc">Upgraded to Higher Secondary</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mission-plate">
                        <div className="mission-plate-header">
                            <Globe2 size={17} />
                            <h3>Mission &amp; Vision</h3>
                        </div>
                        <p>
                            Molding students into intellectually competent, morally upright, compassionate
                            individuals dedicated to society.
                        </p>
                        <ul className="mission-list">
                            <li><CheckCircle2 size={15} /> Value-based education</li>
                            <li><CheckCircle2 size={15} /> Respect for all religions</li>
                            <li><CheckCircle2 size={15} /> Focus on Grades X, XI &amp; XII</li>
                            <li><CheckCircle2 size={15} /> Holistic talent development</li>
                            <li><CheckCircle2 size={15} /> "Soaring towards Bright Future"</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Upcoming Events — Ticket Stubs */}
            <section className="rail-section scroll-animate anim-fade-up">
                <div className="rail-header">
                    <div>
                        <span className="eyebrow-line">School calendar</span>
                        <h2>Upcoming Events &amp; Activities</h2>
                    </div>
                    <button className="rail-view-all" onClick={() => setActivePage('calendar')}>
                        View full calendar <ArrowRight size={14} />
                    </button>
                </div>

                <div className="tickets-grid">
                    {upcomingEvents.length === 0 ? (
                        <p className="empty-note">No upcoming events published at the moment.</p>
                    ) : (
                        upcomingEvents.map((ev) => (
                            <div className="ticket-card" key={ev.id}>
                                <div className="ticket-date">
                                    <span className="ticket-month">{ev.month}</span>
                                    <span className="ticket-day">{ev.day}</span>
                                </div>
                                <div className="ticket-perforation" />
                                <div className="ticket-details">
                                    <h3>{ev.title}</h3>
                                    <p>{ev.description}</p>
                                    <span className="ticket-time"><Clock size={13} /> {ev.time}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Board Exam Toppers — Medals */}
            <section className="rail-section scroll-animate anim-scale-up">
                <div className="rail-header">
                    <div>
                        <span className="eyebrow-line">Excellence</span>
                        <h2>Board Exam Toppers &amp; Achievers</h2>
                    </div>
                    <button className="rail-view-all" onClick={() => setActivePage('progress-report')}>
                        View all scorecards <ArrowRight size={14} />
                    </button>
                </div>

                <div className="medals-grid">
                    {toppersList.length === 0 ? (
                        <p className="empty-note">No toppers published yet.</p>
                    ) : (
                        toppersList.map((topper) => (
                            <div className="medal-card" key={topper.id}>
                                <SealBadge className="seal-badge-lg medal-seal">
                                    <span className="medal-initial">{topper.name?.charAt(0) || '★'}</span>
                                </SealBadge>
                                <h3>{topper.name}</h3>
                                <span className="medal-grade">{topper.streamOrGrade}</span>
                                <div className="medal-score">{topper.scoreOrPercentage}</div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Campus Gallery — Album */}
            <section className="album-band scroll-animate anim-slide-left">
                <div className="rail-section-inner">
                    <div className="rail-header">
                        <div>
                            <span className="eyebrow-line">Life at Holy Cross</span>
                            <h2>Campus Gallery Highlights</h2>
                        </div>
                    </div>

                    <div className="album-grid">
                        <div className="album-thumb">
                            <img src={campusBg5} alt="Main Gate, campus infrastructure" />
                            <span className="album-caption">Main Gate</span>
                        </div>
                        <div className="album-thumb">
                            <img src={campusBg1} alt="Andre Block, science laboratories" />
                            <span className="album-caption">Andre Block</span>
                        </div>
                        <div className="album-thumb">
                            <img src={campusBg2} alt="Moreau Block, sports ground" />
                            <span className="album-caption">Moreau Block</span>
                        </div>
                        <div className="album-thumb">
                            <img src={campusBg3} alt="The Giving Hands, cultural events" />
                            <span className="album-caption">The Giving Hands</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Co-Curricular Clubs */}
            <section className="rail-section scroll-animate anim-slide-right">
                <div className="rail-header">
                    <div>
                        <span className="eyebrow-line">Student life</span>
                        <h2>Co-Curricular Clubs &amp; Activities</h2>
                    </div>
                </div>

                <div className="clubs-shelf">
                    <div className="club-plaque">
                        <SealBadge><BookOpen size={18} /></SealBadge>
                        <h3>Science &amp; IT Club</h3>
                        <p>Hands-on experiments, robotics models, and foundational computer coding training.</p>
                    </div>
                    <div className="club-plaque">
                        <SealBadge><Trophy size={18} /></SealBadge>
                        <h3>Sports &amp; Athletics</h3>
                        <p>Professional coaching in football, cricket, basketball, track events, and indoor games.</p>
                    </div>
                    <div className="club-plaque">
                        <SealBadge><Sparkles size={18} /></SealBadge>
                        <h3>Cultural &amp; Arts</h3>
                        <p>Classical &amp; folk dance, instrumental music, choir singing, dramatics, and fine arts.</p>
                    </div>
                    <div className="club-plaque">
                        <SealBadge><Users size={18} /></SealBadge>
                        <h3>Eco &amp; Service Corps</h3>
                        <p>Campus green drives, community outreach, and value education for social responsibility.</p>
                    </div>
                </div>
            </section>

            {/* FAQ — Ledger Rows */}
            <section className="rail-section scroll-animate anim-fade-up">
                <div className="rail-header">
                    <div>
                        <span className="eyebrow-line">Support</span>
                        <h2>Frequently Asked Questions</h2>
                    </div>
                </div>

                <div className="faq-ledger">
                    <div className="faq-row">
                        <span className="faq-q"><Plus size={14} /></span>
                        <div>
                            <h3>What curricula and grades are offered?</h3>
                            <p>We offer State Board and Matriculation syllabi, focused on high-performance training for Grades X, XI, and XII.</p>
                        </div>
                    </div>
                    <div className="faq-row">
                        <span className="faq-q"><Plus size={14} /></span>
                        <div>
                            <h3>Where is the school located?</h3>
                            <p>Our campus is in Somarasampettai, Tiruchirappalli (Trichy), Tamil Nadu — peaceful and easy to reach.</p>
                        </div>
                    </div>
                    <div className="faq-row">
                        <span className="faq-q"><Plus size={14} /></span>
                        <div>
                            <h3>Are transport facilities available?</h3>
                            <p>Yes — safe, reliable school bus routes cover much of the Trichy district for student convenience.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Campus Location */}
            <section className="rail-section register-section scroll-animate anim-blur-zoom">
                <div className="rail-header">
                    <div>
                        <span className="eyebrow-line">Campus location</span>
                        <h2>Find &amp; Visit Our Campus</h2>
                    </div>
                    <a
                        href="https://www.google.com/maps/place/Holy+Cross+Matriculation+Higher+Secondary+School/@10.8121744,78.6360259,280m"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rail-view-all"
                    >
                        <Navigation size={13} />
                        <span>Get directions</span>
                    </a>
                </div>

                <div className="register-card-wrapper">
                    <div className="register-card">
                        <h3>Campus Address</h3>
                        <p><MapPin size={15} /> Somarasampettai, Tiruchirappalli, Tamil Nadu 620102</p>
                        <div className="register-contact">
                            <p><Phone size={14} /> Admissions helpdesk active</p>
                            <p><Clock size={14} /> Mon – Sat, 8:30 AM – 4:00 PM</p>
                        </div>
                    </div>

                    <div className="map-frame">
                        <MapContainer
                            center={schoolCoordinates}
                            zoom={16}
                            scrollWheelZoom={false}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <TileLayer
                                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                maxZoom={19}
                            />
                            <Marker position={schoolCoordinates}>
                                <Popup>
                                    Holy Cross Matric. Hr. Sec. School <br /> Somarasampettai, Trichy.
                                </Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                </div>
            </section>

            {/* 8. Scroll to Top */}
            {showScrollTop && (
                <button
                    className="scroll-to-top-seal"
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                >
                    <ArrowUp size={16} />
                </button>
            )}
        </div>
    );
}