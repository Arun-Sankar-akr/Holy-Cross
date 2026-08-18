import React, { useState, useEffect } from 'react';
import {
    HeartHandshake, BookOpen, Users, ArrowRight,
    Compass, CheckCircle2, Target, Globe2,
    GraduationCap, Trophy, Megaphone, MapPin,
    Navigation, Phone, ArrowUp, Sparkles, Clock, Award, Sparkle
} from 'lucide-react';
import campusBg from '../assets/image.png';
import HomeNoticeBoard from './HomeNoticeBoard';
import './Home.css';

const mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1217.4431145839242!2d78.63602594809008!3d10.81217436534207!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baa5f9fba5a591b%3A0x1754db7db8c5c932!2sHoly%20Cross%20Matriculation%20Higher%20Secondary%20School!5e1!3m2!1sen!2sin!4v1786864178052!5m2!1sen!2sin";

export default function Home({ setActivePage }) {
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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

            {/* 2. Hero Section */}
            <section
                className="hero-section"
                style={{ '--hero-bg-image': `url(${campusBg})` }}
            >
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <div className="hero-tag">
                        <Sparkles size={13} className="hero-sparkle" />
                        <span>ESTD 2002 • TRICHY, TAMIL NADU</span>
                    </div>
                    <h2>Holy Cross Matric. Hr. Sec. School</h2>
                    <p>
                        Managed by the <strong>Holy Cross Fathers</strong> (Province of Tamil Nadu). Dedicated to value-based holistic education and empowering future leaders.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn-primary" onClick={() => setActivePage('admissions')}>
                            <span>Admission Portal</span>
                            <ArrowRight size={14} />
                        </button>
                        <button className="btn-secondary" onClick={() => setActivePage('calendar')}>
                            <span>Academic Calendar</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* 3. Quick Action Portals */}
            <section className="quick-portals-wrapper">
                <div className="portal-grid">
                    <div className="portal-card portal-purple" onClick={() => setActivePage('admissions')}>
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
            </section>

            {/* 4. Notice Board / Circulars */}
            <HomeNoticeBoard onNavigate={setActivePage} />

            {/* 5. Core Pillars Grid */}
            <section className="section-container">
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

            {/* 6. Updated About Us Section */}
            <section className="section-container">
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

                        {/* Milestones Timeline */}
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

                    {/* Mission Sidebar */}
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

            {/* 7. Campus Location Section */}
            <section className="section-container map-section-container">
                <div className="map-header">
                    <div>
                        <span className="section-badge">CAMPUS LOCATION</span>
                        <h2>Find & Visit Our Campus</h2>
                    </div>
                    <a
                        href="https://www.google.com/maps/place/Holy+Cross+Matriculation+Higher+Secondary+School/@10.8121744,78.6360259,280m/data=!3m1!1e3!4m6!3m5!1s0x3baa5f9fba5a591b:0x1754db7db8c5c932!8m2!3d10.8124016!4d78.6360993!16s%2Fg%2F1tdwt34q"
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

                    <div className="map-frame-container">
                        <iframe
                            title="Holy Cross School Location Map"
                            src={mapEmbedUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                        ></iframe>
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