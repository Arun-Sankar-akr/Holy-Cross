import React, { useEffect, useRef, useState } from 'react';
import { db } from '../service/firebase';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import {
    ArrowRight,
    ArrowUp,
    BookOpen,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Compass,
    Globe2,
    HeartHandshake,
    MapPin,
    Megaphone,
    Navigation,
    Phone,
    Plus,
    Quote,
    Sparkles,
    Target,
    Trophy,
    Users,
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

const heroImage = [
    campusBg1,
    campusBg2,
    campusBg3,
    campusBg10,
    campusBg4,
    campusBg5,
];

function SectionHeading({ eyebrow, title, description, action }) {
    return (
        <div className="section-heading">
            <div className="section-heading-copy">
                <span className="section-kicker">{eyebrow}</span>
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
            {action}
        </div>
    );
}

function IconBadge({ children, tone = 'blue' }) {
    return <span className={`icon-badge icon-badge-${tone}`}>{children}</span>;
}

export default function Home({ setActivePage }) {
    const navigate = useNavigate();

    const [showScrollTop, setShowScrollTop] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [toppersList, setToppersList] = useState([]);

    const eventsSectionRef = useRef(null);
    const eventsScrollRef = useRef(null);
    const eventsPausedRef = useRef(false);

    const achieversSectionRef = useRef(null);
    const achieversScrollRef = useRef(null);
    const achieversPausedRef = useRef(false);

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add('is-visible');
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );

        const animatedElements = document.querySelectorAll('.scroll-animate');
        animatedElements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [upcomingEvents, toppersList]);

    useEffect(() => {
        if (heroImages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const unsubEvents = onSnapshot(collection(db, 'upcoming_events'), (snapshot) => {
            setUpcomingEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });

        const unsubToppers = onSnapshot(collection(db, 'exam_toppers'), (snapshot) => {
            setToppersList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubEvents();
            unsubToppers();
        };
    }, []);

    useEffect(() => {
        const el = eventsScrollRef.current;
        if (!el) return;

        let rafId;
        let lastTime = null;
        const pixelsPerSecond = 28;

        const step = (time) => {
            if (lastTime === null) lastTime = time;
            const delta = time - lastTime;
            lastTime = time;

            if (!eventsPausedRef.current && el.scrollHeight > el.clientHeight) {
                el.scrollTop += (pixelsPerSecond * delta) / 1000;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
                    el.scrollTop = 0;
                }
            }
            rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafId);
    }, [upcomingEvents]);

    useEffect(() => {
        const node = eventsSectionRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) eventsPausedRef.current = false;
            },
            { threshold: 0 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const handleEventClick = () => {
        eventsPausedRef.current = true;
    };

    useEffect(() => {
        const el = achieversScrollRef.current;
        if (!el) return;

        let rafId;
        let lastTime = null;
        const pixelsPerSecond = 40;

        const step = (time) => {
            if (lastTime === null) lastTime = time;
            const delta = time - lastTime;
            lastTime = time;

            if (!achieversPausedRef.current && el.scrollWidth > el.clientWidth) {
                el.scrollLeft += (pixelsPerSecond * delta) / 1000;
                if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
                    el.scrollLeft = 0;
                }
            }
            rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafId);
    }, [toppersList]);

    useEffect(() => {
        const node = achieversSectionRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) achieversPausedRef.current = false;
            },
            { threshold: 0 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const scrollAchievers = (direction) => {
        const el = achieversScrollRef.current;
        if (!el) return;
        achieversPausedRef.current = true;
        const cardWidth = el.querySelector('.achiever-card')?.offsetWidth || 260;
        el.scrollBy({ left: direction * (cardWidth + 20), behavior: 'smooth' });
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToGallery = () => navigate('/gallery');

    return (
        <main className="home-page">
            {/* NEW HERO: editorial split layout */}
            <section className="home-hero">
                <div className="hero-background">
                    {heroImages.map((image, index) => (
                        <div
                            key={index}
                            className={`hero-image ${index === currentSlide ? 'is-active' : ''}`}
                            style={{ backgroundImage: `url(${image})` }}
                        />
                    ))}
                    <div className="hero-wash" />
                </div>

                <div className="hero-layout">
                    <div className="hero-copy">
                        <div className="hero-index">01 / 10</div>
                        <p className="hero-eyebrow">A place to learn, belong &amp; become</p>
                        <h1>
                            Holy Cross Matriculation
                            <span>Higher Secondary School .</span>
                        </h1>
                        <span id='locs'>Somarasampettai</span>
                        <p className="hero-description">
                            A value-based learning community nurturing every child towards a bright,
                            purposeful future.
                        </p>

                        <div className="hero-actions">
                            <button className="hero-primary" onClick={goToGallery}>
                                Explore the campus <ArrowRight size={17} />
                            </button>
                        </div>

                        <div className="hero-mini-proof">
                            <div><strong>2002</strong><span>Founded</span></div>
                            <div><strong>2.7+</strong><span>Acres</span></div>
                            <div><strong>X–XII</strong><span>Senior grades</span></div>
                        </div>
                    </div>

                    <div className="hero-visual-column">
                        <div className="hero-feature-image">
                            <img src={heroImages[currentSlide]} alt="Holy Cross campus" />
                            <div className="hero-image-caption">
                                <span>Campus view</span>
                                <strong>Where every day begins with possibility.</strong>
                            </div>
                        </div>

                        <div className="hero-philosophy">
                            <Quote size={22} />
                            <p>Education of mind and heart.</p>
                            <small>Inspired by Blessed Basil Antony Moreau</small>
                        </div>
                    </div>
                </div>

                <div className="hero-slide-controls">
                    <span>Scroll to explore</span>
                    <div className="hero-progress">
                        {heroImages.slice(0, 10).map((_, index) => (
                            <button
                                key={index}
                                className={index === currentSlide ? 'active' : ''}
                                onClick={() => setCurrentSlide(index)}
                                aria-label={`Show campus image ${index + 1}`}
                            />
                        ))}
                    </div>
                    <span>{String(currentSlide + 1).padStart(2, '0')}</span>
                </div>
            </section>

            {/* NOTICE + EVENTS: magazine dashboard composition */}
            <div className="home-content">
                <section className="opening-board scroll-animate">
                    {/* <div className="opening-intro">
                        <span className="section-kicker">School pulse</span>
                        <h2>What’s happening<br /><em>right now.</em></h2>
                        <p>Announcements, notices and upcoming moments gathered in one place.</p>
                    </div> */}

                    <div className="notice-panel">
                        <div className="notice-panel-head">
                            <span><Megaphone size={16} /> Notice board</span>
                            <span className="panel-dot"><i /> Live</span>
                        </div>
                        <HomeNoticeBoard onNavigate={setActivePage} />
                    </div>

                    <div className="events-panel" ref={eventsSectionRef}>
                        <div className="events-panel-head">
                            <div>
                                <span className="section-kicker">Calendar</span>
                                <h3>Upcoming events</h3>
                            </div>
                            <Calendar size={20} />
                        </div>

                        <div
                            className="events-grid"
                            ref={eventsScrollRef}
                            onMouseEnter={() => { eventsPausedRef.current = true; }}
                            onMouseLeave={() => { eventsPausedRef.current = false; }}
                        >
                            {upcomingEvents.length === 0 ? (
                                <div className="empty-state">No upcoming events published at the moment.</div>
                            ) : (
                                upcomingEvents.map((event) => (
                                    <article className="event-card" key={event.id} onClick={handleEventClick}>
                                        <div className="event-date">
                                            <span>{event.month}</span>
                                            <strong>{event.day}</strong>
                                        </div>
                                        <div className="event-content">
                                            <span className="event-type">School activity</span>
                                            <h3>{event.title}</h3>
                                            <p>{event.description}</p>
                                            <span className="event-time"><Clock size={13} /> {event.time}</span>
                                        </div>
                                        <ArrowRight className="event-arrow" size={17} />
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* VALUES: asymmetric bento */}
                <section className="values-section section-block scroll-animate">
                    <div className="values-title">
                        <span className="section-kicker">Our foundation</span>
                        <h2>Three ideas.<br /><em>One complete education.</em></h2>
                    </div>

                    <div className="values-bento">
                        <article className="value-card value-card-large">
                            <div className="value-card-top">
                                <span className="value-number">01</span>
                                <IconBadge><HeartHandshake size={21} /></IconBadge>
                            </div>
                            <div>
                                <h3>Love &amp; Service</h3>
                                <p>Quality education rooted in mutual respect, compassion and service to humanity.</p>
                            </div>
                            <span className="value-watermark">01</span>
                        </article>

                        <article className="value-card value-card-featured">
                            <div className="value-card-top">
                                <span className="value-number">02</span>
                                <IconBadge tone="purple"><Compass size={21} /></IconBadge>
                            </div>
                            <div>
                                <h3>Mind &amp; Heart</h3>
                                <p>Developing students intellectually, morally and spiritually for a purposeful life.</p>
                            </div>
                            <span className="value-watermark">02</span>
                        </article>

                        <article className="value-card value-card-accent">
                            <div className="value-card-top">
                                <span className="value-number">03</span>
                                <IconBadge tone="gold"><Target size={21} /></IconBadge>
                            </div>
                            <div>
                                <h3>Bright Future</h3>
                                <p>Encouraging excellence through academics, culture, sports and enrichment.</p>
                            </div>
                            <span className="value-watermark">03</span>
                        </article>
                    </div>
                </section>

                {/* PRINCIPAL: photo-led editorial layout */}
                <section className="principal-section scroll-animate">
                    <div className="principal-image-side">
                        <img src={photo} alt="Principal, Holy Cross Matriculation Higher Secondary School" />
                        <div className="principal-image-tag">
                            <span>Principal's Desk</span>
                            <strong>2026</strong>
                        </div>
                        <div className="principal-image-stamp">HCMS</div>
                    </div>

                    <div className="principal-content">
                        <div className="principal-heading-line">
                            <span className="section-kicker">A message from our principal</span>
                            <span>02</span>
                        </div>
                        <h2>Preparing children<br /><em>for life, not only exams.</em></h2>

                        <div className="principal-quote-row">
                            <Quote className="quote-icon" size={42} />
                            <p>
                                Education is not merely about preparing for a living, but building a foundation
                                for life. At Holy Cross, we strive to cultivate intellectual curiosity, emotional
                                strength, and spiritual grounding in every child. We invite you to partner with us
                                as we guide your children toward soaring into a bright, purposeful future.
                            </p>
                        </div>

                        <div className="principal-signature">
                            <strong>Fr. A. Arokia Sahayaraj</strong>
                            <span>Principal · Holy Cross Matriculation Higher Secondary School</span>
                        </div>
                    </div>
                </section>

                {/* ABOUT + JOURNEY */}
                <section className="about-section section-block scroll-animate">
                    <div className="about-layout">
                        <div className="about-copy">
                            <span className="section-kicker">Since 2002</span>
                            <h2>A journey that keeps moving forward.</h2>
                            <p className="about-lead">
                                Holy Cross Matriculation Hr. Sec. School at Somarasampettai is committed
                                to value-based education and is open to all pupils in the pursuit of good,
                                quality education.
                            </p>
                            <p>
                                The school follows the educational vision of Blessed Basil Antony Moreau,
                                founder of the congregation in 1837, with a focus on empowering young people
                                for a better and brighter world.
                            </p>
                            <p>
                                Teaching and non-teaching staff work together across curricular and
                                co-curricular programmes to support the holistic development of every student.
                            </p>
                        </div>

                        <div className="journey-timeline">
                            <div className="journey-title">
                                <Globe2 size={18} />
                                <span>Our journey</span>
                            </div>
                            <div className="journey-item">
                                <span className="journey-year">2002</span>
                                <div><b>01</b><p>Started with a thatched roof</p></div>
                            </div>
                            <div className="journey-item">
                                <span className="journey-year">2011</span>
                                <div><b>02</b><p>Upgraded to High School</p></div>
                            </div>
                            <div className="journey-item">
                                <span className="journey-year">2014</span>
                                <div><b>03</b><p>Upgraded to Higher Secondary</p></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MISSION: horizontal manifesto */}
                <section className="mission-section scroll-animate">
                    <div className="mission-number">03</div>
                    <div className="mission-main">
                        <span className="section-kicker">Mission &amp; vision</span>
                        <h2>Growing capable minds with compassionate hearts.</h2>
                        <p>
                            Molding students into intellectually competent, morally upright and compassionate
                            individuals dedicated to society.
                        </p>
                    </div>
                    <div className="mission-points">
                        <span><CheckCircle2 size={16} /> Value-based education</span>
                        <span><CheckCircle2 size={16} /> Respect for all religions</span>
                        <span><CheckCircle2 size={16} /> Focus on Grades X, XI &amp; XII</span>
                        <span><CheckCircle2 size={16} /> Holistic talent development</span>
                        <span><CheckCircle2 size={16} /> Soaring towards Bright Future</span>
                    </div>
                </section>

                {/* ACHIEVERS */}
                <section className="achievers-section section-block scroll-animate" ref={achieversSectionRef}>
                    <SectionHeading
                        eyebrow="Excellence"
                        title="Board exam toppers & achievers"
                        description="Celebrating students who turn dedication into achievement."
                        action={
                            <button className="outline-action" onClick={() => setActivePage('progress-report')}>
                                View scorecards <ArrowRight size={15} />
                            </button>
                        }
                    />

                    {toppersList.length === 0 ? (
                        <div className="empty-states">No toppers published yet.</div>
                    ) : (
                        <div className="achievers-carousel">
                            <button
                                type="button"
                                className="achievers-carousel-btn achievers-carousel-btn-prev"
                                onClick={() => scrollAchievers(-1)}
                                aria-label="Scroll to previous achievers"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div
                                className="achievers-grid"
                                ref={achieversScrollRef}
                                onMouseEnter={() => { achieversPausedRef.current = true; }}
                                onMouseLeave={() => { achieversPausedRef.current = false; }}
                                onTouchStart={() => { achieversPausedRef.current = true; }}
                            >
                                {[...toppersList]
                                    .sort((a, b) => {
                                        const classRank = (v = '') => {
                                            const value = String(v).toUpperCase();
                                            if (value.includes('XII')) return 2;
                                            if (value.includes('X')) return 1;
                                            return 99;
                                        };
                                        const rankNum = (r) => {
                                            const n = parseInt(r, 10);
                                            return Number.isFinite(n) ? n : 99;
                                        };
                                        const classDiff = classRank(a.streamOrGrade) - classRank(b.streamOrGrade);
                                        if (classDiff !== 0) return classDiff;
                                        return rankNum(a.rank) - rankNum(b.rank);
                                    })
                                    .map((topper) => (
                                        <article className="achiever-card" key={topper.id}>
                                            <div className="achiever-rank">#{topper.rank || 3}</div>
                                            {topper.photo ? (
                                                <div className="achiever-photo-wrap">
                                                    <img src={topper.photo} alt={topper.name} className="achiever-photo" />
                                                    <span className="achiever-photo-badge"><Trophy size={13} /></span>
                                                </div>
                                            ) : (
                                                <IconBadge tone="gold"><Trophy size={21} /></IconBadge>
                                            )}
                                            <span className="achiever-grade">{topper.streamOrGrade}</span>
                                            <h3>{topper.name}</h3>
                                            <strong>{topper.scoreOrPercentage}</strong>
                                        </article>
                                    ))}
                            </div>

                            <button
                                type="button"
                                className="achievers-carousel-btn achievers-carousel-btn-next"
                                onClick={() => scrollAchievers(1)}
                                aria-label="Scroll to next achievers"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </section>

                {/* CAMPUS: full-width visual strip */}
                <section className="campus-section scroll-animate">
                    <div className="campus-heading">
                        <div>
                            <span className="section-kicker">Campus life</span>
                            <h2>Spaces that make<br /><em>school feel alive.</em></h2>
                        </div>
                        <button className="campus-gallery-button" onClick={goToGallery}>
                            Explore full gallery <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="campus-mosaic">
                        {heroImage.map((image, index) => (
                            <div className={`campus-mosaic-item campus-mosaic-${index + 1}`} key={index}>
                                <img src={image} alt={`Holy Cross campus view ${index + 1}`} loading={index > 2 ? 'lazy' : 'eager'} />
                                <span>{String(index + 1).padStart(2, '0')}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* STUDENT LIFE */}
                <section className="student-life section-block scroll-animate">
                    <SectionHeading
                        eyebrow="Student life"
                        title="Discover. Participate. Excel."
                        description="Co-curricular opportunities help students build confidence beyond the classroom."
                    />

                    <div className="clubs-grid">
                        <article className="club-card club-blue">
                            <div className="club-card-number">01</div>
                            <IconBadge><BookOpen size={20} /></IconBadge>
                            <h3>Science &amp; IT Club</h3>
                            <p>Hands-on experiments, robotics models and foundational computer coding training.</p>
                        </article>
                        <article className="club-card club-gold">
                            <div className="club-card-number">02</div>
                            <IconBadge tone="gold"><Trophy size={20} /></IconBadge>
                            <h3>Sports &amp; Athletics</h3>
                            <p>Football, cricket, basketball, track events and indoor games with coaching.</p>
                        </article>
                        <article className="club-card club-purple">
                            <div className="club-card-number">03</div>
                            <IconBadge tone="purple"><Sparkles size={20} /></IconBadge>
                            <h3>Cultural &amp; Arts</h3>
                            <p>Dance, instrumental music, choir, dramatics and fine arts activities.</p>
                        </article>
                        <article className="club-card club-coral">
                            <div className="club-card-number">04</div>
                            <IconBadge tone="coral"><Users size={20} /></IconBadge>
                            <h3>Eco &amp; Service Corps</h3>
                            <p>Green drives, community outreach and value education for social responsibility.</p>
                        </article>
                    </div>
                </section>

                {/* FAQ */}
                <section className="faq-section section-block scroll-animate">
                    <div className="faq-heading">
                        <span className="section-kicker">Need to know</span>
                        <h2>Questions,<br /><em>answered simply.</em></h2>
                    </div>

                    <div className="faq-list">
                        <details open>
                            <summary><span>01</span><b>What curricula and grades are offered?</b><Plus size={18} /></summary>
                            <p>We offer State Board and Matriculation syllabi, focused on high-performance training for Grades X, XI and XII.</p>
                        </details>
                        <details>
                            <summary><span>02</span><b>Where is the school located?</b><Plus size={18} /></summary>
                            <p>Our campus is in Somarasampettai, Tiruchirappalli (Trichy), Tamil Nadu — peaceful and easy to reach.</p>
                        </details>
                        <details>
                            <summary><span>03</span><b>Are transport facilities available?</b><Plus size={18} /></summary>
                            <p>No — local vans and vehicles are arranged for student convenience and the school bus initiating soon.</p>
                        </details>
                    </div>
                </section>

                {/* VISIT */}
                <section className="visit-section section-block scroll-animate">
                    <div className="visit-card">
                        <div className="visit-info">
                            <div className="visit-top">
                                <span className="section-kicker">Visit us</span>
                                <Navigation size={18} />
                            </div>
                            <h2>Come see where<br /><em>the journey happens.</em></h2>
                            <p>Come and experience the Holy Cross learning environment.</p>

                            <div className="visit-address">
                                <MapPin size={19} />
                                <div>
                                    <strong>Holy Cross Matriculation Higher Secondary School</strong>
                                    <span>Somarasampettai, Tiruchirappalli, Tamil Nadu 620102</span>
                                </div>
                            </div>

                            <div className="contact-lines">
                                <span><Phone size={14} /> Admissions helpdesk active</span>
                                <span><Clock size={14} /> Mon – Sat, 8:30 AM – 4:00 PM</span>
                            </div>

                            <a
                                href="https://www.google.com/maps/place/Holy+Cross+Matriculation+Higher+Secondary+School/@10.8121744,78.6360259,280m"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-direction"
                            >
                                Get directions <ArrowRight size={15} />
                            </a>
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
            </div>

            {showScrollTop && (
                <button className="scroll-top" onClick={scrollToTop} aria-label="Scroll to top">
                    <ArrowUp size={18} />
                </button>
            )}
        </main>
    );
}