import React, { useState, useEffect } from 'react';
import {
    HeartHandshake, BookOpen, Users, ArrowRight,
    Compass, CheckCircle2, Target, Globe2,
    GraduationCap, Trophy, Megaphone, MapPin,
    Navigation, Phone, ArrowUp
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
            <div className="news-ticker-bar">
                <div className="ticker-label">
                    <Megaphone size={14} /> ANNOUNCEMENTS
                </div>
                <div className="ticker-wrapper">
                    <div className="ticker-content">
                        <p>
                            <span>Academic Year Theme: "Soaring towards Bright Future"</span>
                            <span>•</span>
                            <span>Admissions Open for Grade X, XI & XII</span>
                            <span>•</span>
                            <span>Annual Cultural & Sports Events Schedules Released.</span>
                        </p>
                    </div>
                </div>
            </div>

            <section
                className="hero-section"
                style={{ '--hero-bg-image': `url(${campusBg})` }}
            >
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <span className="hero-tag">
                        <span className="hero-tag-dot"></span>
                        ESTABLISHED 2002 • TRICHY, TAMIL NADU
                    </span>
                    <h2>Welcome to Holy Cross Matric. Hr. Sec. School</h2>
                    <p>
                        Managed by the <strong>Holy Cross Fathers</strong> (Province of Tamil Nadu). Dedicated to value-based education and shaping champions of love, peace, and social justice.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn-primary" onClick={() => setActivePage('admissions')}>
                            <span>Online Admission Portal</span>
                            <ArrowRight size={16} />
                        </button>
                        <button className="btn-secondary" onClick={() => setActivePage('calendar')}>
                            <span>Academic Calendar</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Quick Action Portals Bar */}
            <section className="quick-portals-wrapper">
                <div className="portal-grid">
                    <div className="portal-card" onClick={() => setActivePage('admissions')}>
                        <div className="portal-icon-wrapper">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h4>Online Application</h4>
                            <p>Apply for Grade X, XI & XII</p>
                        </div>
                    </div>

                    <div className="portal-card" onClick={() => setActivePage('progress-report')}>
                        <div className="portal-icon-wrapper">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h4>Academic Results</h4>
                            <p>Track academic achievements</p>
                        </div>
                    </div>

                    <div className="portal-card" onClick={() => setActivePage('school-activities')}>
                        <div className="portal-icon-wrapper">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h4>Co-curricular & Activities</h4>
                            <p>Magazines, sports & culture</p>
                        </div>
                    </div>

                    <div className="portal-card" onClick={() => setActivePage('contact-us')}>
                        <div className="portal-icon-wrapper">
                            <Users size={24} />
                        </div>
                        <div>
                            <h4>Helpdesk & Contact</h4>
                            <p>Somarasampettai Campus</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notice Board Section */}
            <HomeNoticeBoard onNavigate={setActivePage} />

            {/* Core Pillars Grid: Motto, Vision, Mission */}
            <section className="section-container">
                <div className="cards-grid-3">
                    <div className="info-card">
                        <div className="card-header-flex">
                            <span className="card-tag purple">Motto</span>
                            <HeartHandshake className="portal-icon" size={22} />
                        </div>
                        <h3>Love and Service to Humanity</h3>
                        <p>Providing quality education to all students while demonstrating mutual respect for diverse religious backgrounds and cultural heritage.</p>
                    </div>

                    <div className="info-card featured">
                        <div className="card-header-flex">
                            <span className="card-tag light-purple">Vision</span>
                            <Compass size={22} />
                        </div>
                        <h3>Education of Mind and Heart</h3>
                        <p>Inspired by Blessed Basil Antony Moreau to empower youth for a brighter world through complete intellectual and moral formation.</p>
                    </div>

                    <div className="info-card">
                        <div className="card-header-flex">
                            <span className="card-tag purple">Academic Theme</span>
                            <Target className="portal-icon" size={22} />
                        </div>
                        <h3>Soaring Towards Bright Future</h3>
                        <p>Fostering personal growth through academic magazines, cultural programs, athletics, and skill-enrichment activities.</p>
                    </div>
                </div>
            </section>

            {/* Main Institutional Content & Sidebar */}
            <section className="section-container">
                <div className="institution-grid">
                    <div className="institution-main">
                        <span className="section-badge">ABOUT OUR INSTITUTION</span>
                        <h2>Holy Cross Matriculation Hr. Sec. School</h2>

                        <p className="lead-para">
                            Holy Cross Matric. Hr. Sec. School, Somarasampettai, Trichy is managed by an international religious congregation.
                        </p>
                        <p className="body-para">
                            Founded in 1837 by <strong>Blessed Basil Antony Moreau</strong>, a French diocesan priest, the congregation is dedicated to value-based education. Moreau envisioned education as a catalyst to empower youth to build a just and peaceful society.
                        </p>
                        <p className="body-para">
                            According to his vision, Holy Cross serves as a religious community committed to social upliftment. The school welcomes students across all communities, promoting mutual respect and tolerance.
                        </p>
                        <p className="body-para">
                            Established in 2002, the campus originated with basic infrastructure and rapidly expanded into modern facilities. Upgraded to High School status in 2011 and Higher Secondary status in 2014, management rests with the <strong>Holy Cross Fathers, Province of Tamil Nadu</strong>.
                        </p>

                        {/* Milestone History Cards */}
                        <div className="timeline-milestones">
                            <div className="milestone-item">
                                <div className="milestone-year">2002</div>
                                <div className="milestone-desc">School Founded in Somarasampettai</div>
                            </div>
                            <div className="milestone-item">
                                <div className="milestone-year">2011</div>
                                <div className="milestone-desc">Upgraded to High School</div>
                            </div>
                            <div className="milestone-item">
                                <div className="milestone-year">2014</div>
                                <div className="milestone-desc">Upgraded to Higher Secondary School</div>
                            </div>
                        </div>
                    </div>

                    {/* Mission Sidebar Card */}
                    <div className="mission-sidebar">
                        <div className="widget-header">
                            <Globe2 size={22} />
                            <h3>Our Mission</h3>
                        </div>
                        <p className="mission-text-body">
                            Forming students who are intellectually competent, psychologically integrated, physically healthy, and morally upright to fulfill their duties as responsible citizens.
                        </p>

                        <div className="mission-bullets">
                            <div className="m-bullet"><CheckCircle2 size={16} /> Intellectually Competent</div>
                            <div className="m-bullet"><CheckCircle2 size={16} /> Psychologically Integrated</div>
                            <div className="m-bullet"><CheckCircle2 size={16} /> Physically Healthy</div>
                            <div className="m-bullet"><CheckCircle2 size={16} /> Spiritually & Morally Upright</div>
                            <div className="m-bullet"><CheckCircle2 size={16} /> Champions of Love & Peace</div>
                        </div>
                    </div>
                </div>
            </section>

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
                        className="btn-secondary map-directions-btn"
                    >
                        <Navigation size={16} />
                        <span>Get Directions</span>
                    </a>
                </div>

                <div className="map-card-wrapper">
                    <div className="map-info-card">
                        <h3>Campus Address</h3>
                        <p><MapPin size={16} /> Somarasampettai, Tiruchirappalli, Tamil Nadu 620102</p>
                        <div className="map-contact-details">
                            <p><Phone size={14} /> Admissions Helpdesk Available</p>
                            <p><strong>Visiting Hours:</strong> Mon - Sat: 8:30 AM - 4:00 PM</p>
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

            {/* Back to Top Floating Button */}
            {showScrollTop && (
                <button
                    className="scroll-to-top"
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                >
                    <ArrowUp size={20} />
                </button>
            )}
        </div>
    );
}