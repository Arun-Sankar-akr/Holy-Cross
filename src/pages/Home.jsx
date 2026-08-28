import React, { useEffect, useState } from 'react';
import { db } from '../service/firebase';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import {
    ArrowRight,
    ArrowUp,
    BookOpen,
    CheckCircle2,
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
    // campusBg6,
    // campusBg7,
    // campusBg8,
    // campusBg9,
];

function SectionHeading({ eyebrow, title, description, action }) {
    return (
        <div className="section-heading">
            <div>
                <span className="section-kicker">{eyebrow}</span>
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
            {action}
        </div>
    );
}

function IconBadge({ children, tone = 'green' }) {
    return <span className={`icon-badge icon-badge-${tone}`}>{children}</span>;
}

export default function Home({ setActivePage }) {
    const navigate = useNavigate();

    const [showScrollTop, setShowScrollTop] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [toppersList, setToppersList] = useState([]);

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

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToGallery = () => navigate('/gallery');

    return (
        <main className="home-page">
            <section className="home-hero">
                <div className="hero-media">
                    {heroImages.map((image, index) => (
                        <div
                            key={index}
                            className={`hero-image ${index === currentSlide ? 'is-active' : ''}`}
                            style={{ backgroundImage: `url(${image})` }}
                        />
                    ))}
                    <div className="hero-overlay" />
                    <div className="hero-glow hero-glow-one" />
                    <div className="hero-glow hero-glow-two" />
                </div>

                <div className="hero-inner">
                    <div className="hero-copy">
                        <div className="hero-pill">
                            <Sparkles size={14} />
                            <span>Established 2002 · Trichy</span>
                        </div>

                        <h1>
                            Welcome to
                            <span>Holy Cross Matriculation Higher Secondary School.</span>
                        </h1>
                        <p id='place'>Somarasampettai</p>

                        <p>
                            A value-based learning community nurturing every child
                            towards a bright future.
                        </p>

                        <div className="hero-actions">
                            <button className="hero-primary" onClick={goToGallery}>
                                Explore Campus <ArrowRight size={17} />
                            </button>

                        </div>

                        <div className="hero-trust">
                            <span><CheckCircle2 size={15} /> Holistic education</span>
                            <span><CheckCircle2 size={15} /> Value-based learning</span>
                            <span><CheckCircle2 size={15} /> Student excellence</span>
                        </div>
                    </div>

                    <div className="hero-side-card">
                        <span className="side-card-label">Our philosophy</span>
                        <Quote size={28} />
                        <p>Education of mind and heart.</p>
                        <small>Inspired by Blessed Basil Antony Moreau</small>
                    </div>
                </div>

                <div className="hero-stats">
                    <div><strong>2002</strong><span>Founded</span></div>
                    <div><strong>2.7+</strong><span>Acres campus</span></div>
                    <div><strong>X–XII</strong><span>Senior grades</span></div>
                    <div><strong>360°</strong><span>Student growth</span></div>
                </div>

                <div className="hero-dots">
                    {heroImages.slice(0, 6).map((_, index) => (
                        <button
                            key={index}
                            className={index === currentSlide ? 'active' : ''}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Show campus image ${index + 1}`}
                        />
                    ))}
                </div>
            </section>

            <div className="home-content">
                <section className="notice-section scroll-animate">
                    <HomeNoticeBoard onNavigate={setActivePage} />
                </section>

                <section className="section-block scroll-animate">
                    <SectionHeading
                        eyebrow="What guides us"
                        title="A school built around strong values"
                        description="Our learning environment brings academics, character, service and personal excellence together."
                    />

                    <div className="value-grid">
                        <article className="value-card">
                            <IconBadge><HeartHandshake size={22} /></IconBadge>
                            <span className="card-number">01</span>
                            <h3>Love &amp; Service</h3>
                            <p>Quality education rooted in mutual respect, compassion and service to humanity.</p>
                        </article>

                        <article className="value-card value-card-featured">
                            <IconBadge tone="light"><Compass size={22} /></IconBadge>
                            <span className="card-number">02</span>
                            <h3>Mind &amp; Heart</h3>
                            <p>Developing students intellectually, morally and spiritually for a purposeful life.</p>
                        </article>

                        <article className="value-card">
                            <IconBadge tone="gold"><Target size={22} /></IconBadge>
                            <span className="card-number">03</span>
                            <h3>Bright Future</h3>
                            <p>Encouraging excellence through academics, culture, sports and enrichment.</p>
                        </article>
                    </div>
                </section>

                <section className="principal-section principal-editorial scroll-animate">

                    <div className="principal-copy">
                        <div className="principal-topline">
                            <span className="principal-label">Principal's message</span>
                            <span className="principal-rule" />
                            <span className="principal-year">2026</span>
                        </div>

                        <h2>Preparing children<br /><em>for life, not only exams.</em></h2>

                        <div className="principal-message-grid">
                            <Quote className="quote-icon" size={38} />
                            <p className="principal-quote">
                                Education is not merely about preparing for a living, but building a foundation
                                for life. At Holy Cross, we strive to cultivate intellectual curiosity, emotional
                                strength, and spiritual grounding in every child. We invite you to partner with us
                                as we guide your children toward soaring into a bright, purposeful future.
                            </p>
                        </div>

                        <div className="principal-bottom">
                            <div className="principal-sign">
                                <strong>Fr. A. Arokia Sahayaraj</strong>
                                <span><br />Principal <br /> Holy Cross Matriculation Higher Secondary School</span>
                            </div>
                            
                        </div>
                    </div>

                    <div className="principal-photo">
                        <div className="principal-photo-frame">
                            <img src={photo} alt="Principal, Holy Cross Matriculation Higher Secondary School" />
                        </div>
                        <div className="photo-label">
                            <strong>Principal's Desk</strong>
                        </div>
                        <div className="photo-accent" />
                    </div>
                </section>

                <section className="section-block about-section scroll-animate">
                    <div className="about-layout">
                        <div className="about-copy">
                            <span className="section-kicker">About Holy Cross</span>
                            <h2>A journey of growth since 2002.</h2>
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

                        <div className="journey-card">
                            <div className="journey-header">
                                <Globe2 size={20} />
                                <span>Our journey</span>
                            </div>
                            <div className="journey-item">
                                <strong>2002</strong>
                                <div><span>01</span><p>Started with a thatched roof</p></div>
                            </div>
                            <div className="journey-item">
                                <strong>2011</strong>
                                <div><span>02</span><p>Upgraded to High School</p></div>
                            </div>
                            <div className="journey-item">
                                <strong>2014</strong>
                                <div><span>03</span><p>Upgraded to Higher Secondary</p></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mission-section scroll-animate">
                    <div className="mission-main">
                        <span className="section-kicker">Mission &amp; vision</span>
                        <h2>Growing capable minds with compassionate hearts.</h2>
                        <p>
                            Molding students into intellectually competent, morally upright and compassionate
                            individuals dedicated to society.
                        </p>
                    </div>
                    <div className="mission-points">
                        <span><CheckCircle2 size={17} /> Value-based education</span>
                        <span><CheckCircle2 size={17} /> Respect for all religions</span>
                        <span><CheckCircle2 size={17} /> Focus on Grades X, XI &amp; XII</span>
                        <span><CheckCircle2 size={17} /> Holistic talent development</span>
                        <span><CheckCircle2 size={17} /> Soaring towards Bright Future</span>
                    </div>
                </section>

                <section className="section-block scroll-animate">
                    <SectionHeading
                        eyebrow="School calendar"
                        title="Upcoming events"
                        description="Stay connected with activities, programmes and important moments on campus."
                        action={
                            <button className="outline-action" onClick={() => setActivePage('calendar')}>
                                View calendar <ArrowRight size={15} />
                            </button>
                        }
                    />

                    <div className="events-grid">
                        {upcomingEvents.length === 0 ? (
                            <div className="empty-state">No upcoming events published at the moment.</div>
                        ) : (
                            upcomingEvents.map((event) => (
                                <article className="event-card" key={event.id}>
                                    <div className="event-date">
                                        <span>{event.month}</span>
                                        <strong>{event.day}</strong>
                                    </div>
                                    <div className="event-content">
                                        <span className="event-type">School activity</span>
                                        <h3>{event.title}</h3>
                                        <p>{event.description}</p>
                                        <span className="event-time"><Clock size={14} /> {event.time}</span>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>

                <section className="section-block achievers-section scroll-animate">
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

                    <div className="achievers-grid">
                        {toppersList.length === 0 ? (
                            <div className="empty-state">No toppers published yet.</div>
                        ) : (
                            toppersList.map((topper, index) => (
                                <article className="achiever-card" key={topper.id}>
                                    <div className="achiever-rank">#{index + 1}</div>
                                    <IconBadge tone="gold"><Trophy size={21} /></IconBadge>
                                    <h3>{topper.name}</h3>
                                    <span>{topper.streamOrGrade}</span>
                                    <strong>{topper.scoreOrPercentage}</strong>
                                </article>
                            ))
                        )}
                    </div>
                </section>

                <section className="campus-showcase scroll-animate">
                    <div className="campus-showcase-top">
                        <div className="campus-showcase-intro">
                            <span className="section-kicker">Campus life</span>
                            <h2>Explore our campus.</h2>
                            <p>Take a look at the school buildings, spaces and surroundings.</p>
                        </div>
                        <button className="campus-gallery-button" onClick={goToGallery}>
                            <span>Explore full gallery</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="campus-all-images">
                        {heroImage.map((image, index) => (
                            <div className={`campus-all-image campus-all-image-${index + 1}`} key={index}>
                                <img src={image} alt={`Holy Cross campus view ${index + 1}`} loading={index > 2 ? 'lazy' : 'eager'} />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="section-block scroll-animate">
                    <SectionHeading
                        eyebrow="Student life"
                        title="Discover, participate, excel."
                        description="Co-curricular opportunities help students build confidence beyond the classroom."
                    />

                    <div className="clubs-grid">
                        <article className="club-card">
                            <IconBadge><BookOpen size={20} /></IconBadge>
                            <h3>Science &amp; IT Club</h3>
                            <p>Hands-on experiments, robotics models and foundational computer coding training.</p>
                        </article>
                        <article className="club-card">
                            <IconBadge tone="gold"><Trophy size={20} /></IconBadge>
                            <h3>Sports &amp; Athletics</h3>
                            <p>Football, cricket, basketball, track events and indoor games with coaching.</p>
                        </article>
                        <article className="club-card">
                            <IconBadge tone="purple"><Sparkles size={20} /></IconBadge>
                            <h3>Cultural &amp; Arts</h3>
                            <p>Dance, instrumental music, choir, dramatics and fine arts activities.</p>
                        </article>
                        <article className="club-card">
                            <IconBadge tone="blue"><Users size={20} /></IconBadge>
                            <h3>Eco &amp; Service Corps</h3>
                            <p>Green drives, community outreach and value education for social responsibility.</p>
                        </article>
                    </div>
                </section>

                <section className="section-block faq-section scroll-animate">
                    <SectionHeading
                        eyebrow="Need to know"
                        title="Frequently asked questions"
                        description="A few quick answers for parents and students."
                    />

                    <div className="faq-list">
                        <details open>
                            <summary><span>01</span> What curricula and grades are offered?<Plus size={18} /></summary>
                            <p>We offer State Board and Matriculation syllabi, focused on high-performance training for Grades X, XI and XII.</p>
                        </details>
                        <details>
                            <summary><span>02</span> Where is the school located?<Plus size={18} /></summary>
                            <p>Our campus is in Somarasampettai, Tiruchirappalli (Trichy), Tamil Nadu — peaceful and easy to reach.</p>
                        </details>
                        <details>
                            <summary><span>03</span> Are transport facilities available?<Plus size={18} /></summary>
                            <p>Yes — safe, reliable school bus routes cover much of the Trichy district for student convenience.</p>
                        </details>
                    </div>
                </section>

                <section className="section-block visit-section scroll-animate">
                    <SectionHeading
                        eyebrow="Visit us"
                        title="Find your way to campus"
                        description="Come and experience the Holy Cross learning environment."
                        action={
                            <a
                                href="https://www.google.com/maps/place/Holy+Cross+Matriculation+Higher+Secondary+School/@10.8121744,78.6360259,280m"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="outline-action"
                            >
                                <Navigation size={14} /> Get directions
                            </a>
                        }
                    />

                    <div className="visit-layout">
                        <div className="address-card">
                            <div className="address-icon"><MapPin size={24} /></div>
                            <span className="address-label">Campus address</span>
                            <h3>Holy Cross Matriculation Higher Secondary School</h3>
                            <p>Somarasampettai, Tiruchirappalli, Tamil Nadu 620102</p>
                            <div className="contact-lines">
                                <span><Phone size={15} /> Admissions helpdesk active</span>
                                <span><Clock size={15} /> Mon – Sat, 8:30 AM – 4:00 PM</span>
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
            </div>

            {showScrollTop && (
                <button className="scroll-top" onClick={scrollToTop} aria-label="Scroll to top">
                    <ArrowUp size={18} />
                </button>
            )}
        </main>
    );
}