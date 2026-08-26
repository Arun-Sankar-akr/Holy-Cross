import React, { useState, useEffect } from 'react';
import { db } from '../service/firebase';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import {
    HeartHandshake, BookOpen, Users, ArrowRight,
    Compass, CheckCircle2, Target, Globe2,
    GraduationCap, Trophy, Megaphone, MapPin,
    Navigation, Phone, ArrowUp, Sparkles, Clock, Quote
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
            {/* 1. Live Ticker Bar */}
            <div className="news-ticker-bar">
                <div className="ticker-label">
                    <Megaphone size={13} />
                    <span>UPDATES</span>
                </div>
                <div className="ticker-wrapper">
                    <div className="ticker-content">
                        <p>
                            <span>Academic Year Theme: "Soaring towards Bright Future"</span>
                            <span className="ticker-bullet">•</span>
                            <span>Admissions Open for Grade X, XI & XII</span>
                            <span className="ticker-bullet">•</span>
                            <span>Annual Cultural & Sports Events Schedules Released</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Hero Section — Playful Split Layout */}
            <section className="hero-section">
                <div className="hero-bg-carousel">
                    {heroImages.map((img, index) => (
                        <div
                            key={index}
                            className={`hero-bg-slide ${index === currentSlide ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))}
                    <div className="hero-bg-tint"></div>
                </div>

                <span className="hero-deco hero-deco-triangle">
                    <svg viewBox="0 0 40 40" width="28" height="28" fill="none"><path d="M20 4 L36 34 H4 Z" stroke="#22A06B" strokeWidth="3" strokeLinejoin="round" /></svg>
                </span>
                <span className="hero-deco hero-deco-calc">
                    <svg viewBox="0 0 40 40" width="30" height="30" fill="none"><rect x="6" y="4" width="28" height="32" rx="4" stroke="#F4823C" strokeWidth="3" /><circle cx="14" cy="14" r="2.4" fill="#F4823C" /><circle cx="22" cy="14" r="2.4" fill="#F4823C" /><circle cx="30" cy="14" r="2.4" fill="#F4823C" /><circle cx="14" cy="22" r="2.4" fill="#F4823C" /><circle cx="22" cy="22" r="2.4" fill="#F4823C" /></svg>
                </span>

                <div className="hero-grid">
                    <div className="hero-text-col">
                        <span className="hero-eyebrow">BEST QUALITY EDUCATION</span>

                        <h2 className="hero-heading">
                            <h2 className="hero-heading"> <span className="line-pink">Welcome to </span> <span className="line-dark"><br />Holy Cross Matriculation Higher Secondary</span> <span className="line-dark">&nbsp;School</span><br /> <span className="line-accent">Somarasampettai</span> </h2>
                        </h2>

                        <div className="hero-cta-row">
                            <button className="btn-primary" onClick={() => { navigate("/gallery"); }}>
                                <span>Explore Campus</span>
                                <ArrowRight size={14} />
                            </button>

                           
                        </div>

                        <p>
                            Managed by the <strong>Holy Cross Fathers</strong> (Province of Tamil Nadu). Dedicated to value-based holistic education and empowering future leaders.
                        </p>

                        <button className="btn-secondary" >
                            <span onClick={() => { navigate("school/calendar"); }}>Academic Calendar</span>
                        </button>

                        <div className="hero-stats-row">
                            <div className="hero-stat-box box-blue">
                                <span className="hs-num">2002</span>
                                <span className="hs-label">Established Year</span>
                            </div>
                            <div className="hero-stat-box box-cream">
                                <span className="hs-num">100%</span>
                                <span className="hs-label">Board Exam Focus</span>
                            </div>
                            <div className="hero-stat-box box-amber">
                                <span className="hs-num">2.7+</span>
                                <span className="hs-label">Acres Campus</span>
                            </div>
                            <div className="hero-stat-box box-peach">
                                <span className="hs-num">n+</span>
                                <span className="hs-label">Expert Faculty</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Quick Action Portals (Scale Up Animation) */}
            {/* <section className="quick-portals-wrapper scroll-animate anim-scale-up">
                <div className="portal-grid">
                    {/* <div className="portal-card portal-purple" onClick={() => setActivePage('admissions')}>
                        <div className="portal-icon-wrapper">
                            <GraduationCap size={20} />
                        </div>
                        <div className="portal-text">
                            <h4>Online Admission</h4>
                            <p>Grade X, XI & XII Application</p>
                        </div>
                    </div> 

                    <div className="portal-card portal-pink" onClick={() => setActivePage('progress-report')}>
                        <div className="portal-icon-wrapper">
                            <Trophy size={20} />
                        </div>
                        <div className="portal-text">
                            <h4>Academic Results</h4>
                            <p>Scorecards & Toppers</p>
                        </div>
                    </div>

                    <div className="portal-card portal-emerald" onClick={() => setActivePage('school-activities')}>
                        <div className="portal-icon-wrapper">
                            <BookOpen size={20} />
                        </div>
                        <div className="portal-text">
                            <h4>Co-curricular</h4>
                            <p>Sports, Clubs & Culture</p>
                        </div>
                    </div>

                    <div className="portal-card portal-amber" onClick={() => setActivePage('contact-us')}>
                        <div className="portal-icon-wrapper">
                            <Users size={20} />
                        </div>
                        <div className="portal-text">
                            <h4>Campus Helpdesk</h4>
                            <p>Somarasampettai Center</p>
                        </div>
                    </div>
                </div>
            </section> */}

            {/* 4. Notice Board / Circulars (Fade Up Animation) */}
            <div className="scroll-animate anim-fade-up">
                <HomeNoticeBoard onNavigate={setActivePage} />
            </div>

            {/* 5. Core Pillars Grid (Slide From Left Animation) */}
            <section className="section-container scroll-animate anim-slide-left">
                <div className="cards-grid-3">
                    <div className="info-card">
                        <div className="card-header-flex">
                            <span className="card-tag tag-purple">Motto</span>
                            <div className="card-mini-icon">
                                <HeartHandshake size={16} />
                            </div>
                        </div>
                        <h3>Love & Service to Humanity</h3>
                        <p>Providing quality education to all students with mutual respect for diverse religious backgrounds and cultural heritage.</p>
                    </div>

                    <div className="info-card featured">
                        <div className="card-header-flex">
                            <span className="card-tag tag-white">Vision</span>
                            <div className="card-mini-icon">
                                <Compass size={16} />
                            </div>
                        </div>
                        <h3>Education of Mind & Heart</h3>
                        <p>Inspired by Blessed Basil Antony Moreau to empower youth through complete intellectual, moral, and spiritual formation.</p>
                    </div>

                    <div className="info-card">
                        <div className="card-header-flex">
                            <span className="card-tag tag-amber">Theme</span>
                            <div className="card-mini-icon">
                                <Target size={16} />
                            </div>
                        </div>
                        <h3>Soaring Towards Bright Future</h3>
                        <p>Nurturing personal excellence through scholastic training, cultural festivals, athletic meets, and enrichment programs.</p>
                    </div>
                </div>
            </section>

            {/* Principal's Desk Feature Section (Slide From Right Animation) */}
            <section className="section-container scroll-animate anim-slide-right">
                <div className="principal-desk-wrapper">
                    <div className="principal-card-img">
                        <img src={photo} alt="" />
                    </div>
                    <div className="principal-content">
                        <span className="section-badge">LEADERSHIP MESSAGE</span>
                        <h3>From the Principal's Desk</h3>
                        <span className="principal-title-sub">Holy Cross Fathers, Province of Tamilnadu</span>
                        <Quote size={26} style={{ color: 'var(--primary)', opacity: 0.35, marginBottom: '4px' }} />
                        <p className="principal-quote">
                            "Education is not merely about preparing for a living, but building a foundation for life. At Holy Cross, we strive to cultivate intellectual curiosity, emotional strength, and spiritual grounding in every child. We invite you to partner with us as we guide your children toward soaring into a bright, purposeful future."
                        </p>
                        <div className="principal-signature">
                            - Fr. A. AROKIA SAHAYARAJ <span id='roles'>(Principal)</span></div>
                    </div>
                </div>
            </section>

            {/* 6. Updated About Us Section (Blur Zoom Animation) */}
            <section className="section-container scroll-animate anim-blur-zoom">
                <div className="institution-grid">
                    <div className="institution-main">
                        <span className="section-badge">ABOUT US</span>
                        <h2>Holy Cross Matriculation Hr. Sec. School</h2>

                        <p className="lead-para">
                            Holy Cross Matric. Hr. Sec. School, Somarasampettai, Trichy is owned and managed by an International Congregation. The congregation is committed to the cause of value-based education as insisted by Blessed Basil Antony Moreau, a French diocesan priest, who founded this congregation in the year 1837.
                        </p>

                        <p className="body-para">
                            He envisioned education to empower the young for a better and brighter world. According to his vision, Holy Cross as a religious community should be dedicated to the service of society. Thus, Holy Cross Matriculation Hr. Sec. School at Somarasampettai is open to all pupils to provide good and quality education. We show due respect to the religious feelings and sentiments of students from all religions.
                        </p>

                        <p className="body-para">
                            Holy Cross Matriculation Hr. Sec. School, Somarasampettai was started in the year 2002. Initially, the school began with a thatched roof and after two years, decent infrastructure was built for the school. Year by year the school got upgraded to High School (2011) and Higher Secondary (2014). This school management rests with the <strong>Holy Cross Fathers, Province of Tamilnadu</strong>.
                        </p>

                        <p className="body-para">
                            The Congregation is investing its personnel and resources to provide the required infrastructure for the school. Excellent facilities are provided to impart quality education to the students. The school with an excellent teaching and non-teaching staff provides curricular and co-curricular activities toward the holistic development of all the students.
                        </p>

                        <p className="body-para">
                            Our dream is to develop HCMHSS into a reputed Higher Secondary School in Trichy District. Every student, especially X, XI, and XII students are trained and motivated to produce historical results every year. The annual magazine, annual cultural programmes, sports and co-curricular activities in the school help students to exhibit their talents and skills.
                        </p>

                        <div className="timeline-milestones">
                            <div className="milestone-item">
                                <div className="milestone-year">2002</div>
                                <div className="milestone-desc">Started with Thatched Roof</div>
                            </div>
                            <div className="milestone-item">
                                <div className="milestone-year">2011</div>
                                <div className="milestone-desc">Upgraded to High School</div>
                            </div>
                            <div className="milestone-item">
                                <div className="milestone-year">2014</div>
                                <div className="milestone-desc">Upgraded to Higher Secondary</div>
                            </div>
                        </div>
                    </div>

                    <div className="mission-sidebar">
                        <div className="widget-header">
                            <Globe2 size={18} />
                            <h3>Core Mission & Vision</h3>
                        </div>
                        <p className="mission-text-body">
                            Committed to molding students into intellectually competent, morally upright, and compassionate individuals dedicated to society.
                        </p>

                        <div className="mission-bullets">
                            <div className="m-bullet"><CheckCircle2 size={15} /> Value-Based Education</div>
                            <div className="m-bullet"><CheckCircle2 size={15} /> Respect for All Religions</div>
                            <div className="m-bullet"><CheckCircle2 size={15} /> Focus on Grades X, XI & XII</div>
                            <div className="m-bullet"><CheckCircle2 size={15} /> Holistic Talent Development</div>
                            <div className="m-bullet"><CheckCircle2 size={15} /> Academic Theme: "Soaring towards Bright Future"</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upcoming Events Section (Fade Up Animation) */}
            <section className="section-container scroll-animate anim-fade-up">
                <div className="events-section-header">
                    <div>
                        <span className="section-badge">SCHOOL CALENDAR</span>
                        <h2>Upcoming Events & Activities</h2>
                    </div>
                    <button className="events-view-all" onClick={() => setActivePage('calendar')}>
                        View Full Calendar &rarr;
                    </button>
                </div>

                <div className="events-grid-3">
                    {upcomingEvents.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No upcoming events published at the moment.</p>
                    ) : (
                        upcomingEvents.map((ev) => (
                            <div className="event-card" key={ev.id}>
                                <div className="event-date-badge">
                                    <span className="event-month">{ev.month}</span>
                                    <span className="event-day">{ev.day}</span>
                                </div>
                                <div className="event-details">
                                    <h3>{ev.title}</h3>
                                    <p>{ev.description}</p>
                                    <div className="event-meta">
                                        <span className="event-time"><Clock size={13} /> {ev.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Board Exam Toppers Section (Scale Up Animation) */}
            <section className="section-container scroll-animate anim-scale-up">
                <div className="events-section-header">
                    <div>
                        <span className="section-badge">EXCELLENCE</span>
                        <h2>Board Exam Toppers & Achievers</h2>
                    </div>
                    <button className="events-view-all" onClick={() => setActivePage('progress-report')}>
                        View All Scorecards &rarr;
                    </button>
                </div>

                <div className="achievements-grid">
                    {toppersList.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No toppers published yet.</p>
                    ) : (
                        toppersList.map((topper) => (
                            <div className="achievement-card" key={topper.id}>
                                <div className="achievement-avatar">{topper.name?.charAt(0) || '★'}</div>
                                <h3>{topper.name}</h3>
                                <span className="achievement-grade">{topper.streamOrGrade}</span>
                                <div className="achievement-score">{topper.scoreOrPercentage}</div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Campus Photo Gallery Preview (Slide Left Animation) — Peach Band */}
            <section className="gallery-band scroll-animate anim-slide-left">
                <div className="section-container">
                    <div className="events-section-header">
                        <div>
                            <span className="section-badge">LIFE AT HOLY CROSS</span>
                            <h2>Campus Gallery Highlights</h2>
                        </div>
                    </div>

                    <div className="gallery-grid">
                        <div className="gallery-thumb">
                            <img src={campusBg5} alt="Campus Infrastructure" />
                            <div className="gallery-overlay-caption">Main Gate</div>
                        </div>
                        <div className="gallery-thumb">
                            <img src={campusBg1} alt="Science Laboratories" />
                            <div className="gallery-overlay-caption">Andre Block</div>
                        </div>
                        <div className="gallery-thumb">
                            <img src={campusBg2} alt="Sports Ground" />
                            <div className="gallery-overlay-caption">Moreau Block</div>
                        </div>
                        <div className="gallery-thumb">
                            <img src={campusBg3} alt="Cultural Events" />
                            <div className="gallery-overlay-caption">The Giving Hands</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Co-Curricular & Student Clubs (Slide Right Animation) */}
            <section className="section-container scroll-animate anim-slide-right">
                <div className="events-section-header">
                    <div>
                        <span className="section-badge">STUDENT LIFE</span>
                        <h2>Co-Curricular Clubs & Activities</h2>
                    </div>
                </div>

                <div className="clubs-grid">
                    <div className="club-card">
                        <div className="club-icon">
                            <BookOpen size={20} />
                        </div>
                        <h3>Science & IT Club</h3>
                        <p>Encouraging hands-on experiments, robotics models, and foundational computer coding training.</p>
                    </div>

                    <div className="club-card">
                        <div className="club-icon">
                            <Trophy size={20} />
                        </div>
                        <h3>Sports & Athletics</h3>
                        <p>Professional coaching in football, cricket, basketball, track events, and indoor board games.</p>
                    </div>

                    <div className="club-card">
                        <div className="club-icon">
                            <Sparkles size={20} />
                        </div>
                        <h3>Cultural & Arts</h3>
                        <p>Training in classical & folk dance, instrumental music, choir singing, dramatics, and fine arts.</p>
                    </div>

                    <div className="club-card">
                        <div className="club-icon">
                            <Users size={20} />
                        </div>
                        <h3>Eco & Service Corps</h3>
                        <p>Instilling social responsibility through campus green drives, community outreach, and value education.</p>
                    </div>
                </div>
            </section>

            {/* FAQ (Fade Up Animation) */}
            <section className="section-container scroll-animate anim-fade-up">
                <div className="events-section-header">
                    <div>
                        <span className="section-badge">SUPPORT</span>
                        <h2>Frequently Asked Questions</h2>
                    </div>
                </div>

                <div className="faq-grid">
                    <div className="faq-card">
                        <h3><span>Q.</span> What curricula and grades are offered?</h3>
                        <p>We offer State Board and Matriculation syllabi focusing extensively on high-performance training for Grades X, XI, and XII.</p>
                    </div>

                    <div className="faq-card">
                        <h3><span>Q.</span> Where is the school located?</h3>
                        <p>Our campus is situated in Somarasampettai, Tiruchirappalli (Trichy), Tamil Nadu, offering a peaceful and accessible learning environment.</p>
                    </div>

                    <div className="faq-card">
                        <h3><span>Q.</span> Are transport facilities available?</h3>
                        <p>Yes, safe and reliable school bus transportation covers various routes across the Trichy district for student convenience.</p>
                    </div>
                </div>
            </section>

            {/* 7. Campus Location Section (Blur Zoom Animation) */}
            <section className="section-container map-section-container scroll-animate anim-blur-zoom">
                <div className="map-header">
                    <div>
                        <span className="section-badge">CAMPUS LOCATION</span>
                        <h2>Find & Visit Our Campus</h2>
                    </div>
                    <a
                        href="https://www.google.com/maps/place/Holy+Cross+Matriculation+Higher+Secondary+School/@10.8121744,78.6360259,280m"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-directions-btn"
                    >
                        <Navigation size={13} />
                        <span>Get Directions</span>
                    </a>
                </div>

                <div className="map-card-wrapper">
                    <div className="map-info-card">
                        <h3>Campus Address</h3>
                        <p><MapPin size={15} /> Somarasampettai, Tiruchirappalli, Tamil Nadu 620102</p>
                        <div className="map-contact-details">
                            <p><Phone size={14} /> Admissions Helpdesk Active</p>
                            <p><Clock size={14} /> Mon - Sat: 8:30 AM - 4:00 PM</p>
                        </div>
                    </div>

                    <div className="map-frame-container" style={{ width: '100%', height: '350px', position: 'relative' }}>
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

            {/* 8. Scroll to Top Floating Button */}
            {showScrollTop && (
                <button
                    className="scroll-to-top"
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                >
                    <ArrowUp size={16} />
                </button>
            )}
        </div>
    );
}