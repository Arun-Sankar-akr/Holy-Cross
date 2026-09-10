import React, { useEffect, useRef, useState, useMemo } from 'react';
import { db } from '../service/firebase';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import {
    ArrowRight,
    ArrowUp,
    Award,
    BookOpen,
    Calendar,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Compass,
    Copy,
    ExternalLink,
    Globe2,
    GraduationCap,
    HeartHandshake,
    MapPin,
    Megaphone,
    Navigation,
    Pause,
    Phone,
    Play,
    Plus,
    Quote,
    Sparkles,
    Star,
    Target,
    Trophy,
    Users,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

// Stylised approach path used purely for the animated "motion tracer" on the map —
// a decorative arrival route converging on the campus marker, not turn-by-turn directions.
const routeToSchool = [
    [10.8181, 78.6291],
    [10.8163, 78.6312],
    [10.8149, 78.6328],
    [10.8136, 78.6344],
    [10.8129, 78.6353],
    schoolCoordinates,
];

const heroImages = [
    { src: campusBg1, caption: 'Main Academic Quadrangle', subtitle: 'Where character meets knowledge every morning' },
    { src: campusBg2, caption: 'Senior Secondary Wing', subtitle: 'Nurturing future doctors, engineers & leaders' },
    { src: campusBg3, caption: 'Lush Serene Campus', subtitle: '2.7+ acres of peaceful learning environment' },
    { src: campusBg10, caption: 'High-Tech Science Laboratories', subtitle: 'Hands-on inquiry and scientific discovery' },
    { src: campusBg4, caption: 'Sports Ground & Pavilion', subtitle: 'Building agility, teamwork and sportsmanship' },
    { src: campusBg5, caption: 'Smart Digital Classrooms', subtitle: 'Technology-enabled modern pedagogy' },
    { src: campusBg6, caption: 'Library & Reading Hall', subtitle: 'Cultivating curiosity and lifelong learning' },
    { src: campusBg7, caption: 'Cultural & Assembly Arena', subtitle: 'Celebrating student expression & talents' },
    { src: campusBg8, caption: 'Eco Green Pathways', subtitle: 'Clean, green eco-conscious campus lifestyle' },
    { src: campusBg9, caption: 'Spiritual Sanctuary & Chapel', subtitle: 'Grounded in moral values and reflection' },
];

const campusGalleries = [
    { img: campusBg1, title: 'Academic Complex', tag: 'Academics', col: 'wide' },
    { img: campusBg2, title: 'Science Labs', tag: 'Innovation', col: 'normal' },
    { img: campusBg3, title: 'Campus Greenery', tag: 'Environment', col: 'normal' },
    { img: campusBg10, title: 'Digital Classrooms', tag: 'Technology', col: 'wide' },
    { img: campusBg4, title: 'Sports Ground', tag: 'Athletics', col: 'normal' },
    { img: campusBg5, title: 'Student Assembly', tag: 'Community', col: 'normal' },
];

function SectionHeading({ eyebrow, title, description, action, badge }) {
    return (
        <div className="section-heading">
            <div className="section-heading-copy">
                {eyebrow && (
                    <div className="section-kicker-wrapper">
                        <span className="section-kicker">{eyebrow}</span>
                        {badge && <span className="section-kicker-pill">{badge}</span>}
                    </div>
                )}
                <h2>{title}</h2>
                <span className="heading-trace" aria-hidden="true">
                    <svg viewBox="0 0 100 4" preserveAspectRatio="none">
                        <path className="heading-trace-path" d="M0,2 L100,2" />
                    </svg>
                </span>
                {description && <p>{description}</p>}
            </div>
            {action && <div className="section-heading-action">{action}</div>}
        </div>
    );
}

function IconBadge({ children, tone = 'blue' }) {
    return <span className={`icon-badge icon-badge-${tone}`}>{children}</span>;
}

// MOTION TRACER — animated dot that travels along a path on the Leaflet map,
// looping smoothly using real-world distances so its speed stays constant.
function RouteMotionTracer({ path, durationMs = 5200 }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !path || path.length < 2) return;

        const icon = L.divIcon({
            className: 'route-mover-icon',
            html: '<span class="route-mover-ring"></span><span class="route-mover-dot"></span>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
        });

        const marker = L.marker(path[0], {
            icon,
            interactive: false,
            keyboard: false,
            zIndexOffset: 800,
        }).addTo(map);

        const latlngs = path.map((point) => L.latLng(point));
        const segmentLengths = [];
        let totalLength = 0;
        for (let i = 0; i < latlngs.length - 1; i++) {
            const dist = latlngs[i].distanceTo(latlngs[i + 1]);
            segmentLengths.push(dist);
            totalLength += dist;
        }

        let rafId;
        let startTime = null;

        const step = (timestamp) => {
            if (startTime === null) startTime = timestamp;
            const elapsed = (timestamp - startTime) % durationMs;
            const progress = elapsed / durationMs;
            const targetDistance = progress * totalLength;

            let covered = 0;
            let point = latlngs[latlngs.length - 1];
            for (let i = 0; i < segmentLengths.length; i++) {
                const segLength = segmentLengths[i];
                if (targetDistance <= covered + segLength || i === segmentLengths.length - 1) {
                    const segProgress = segLength === 0 ? 0 : (targetDistance - covered) / segLength;
                    const a = latlngs[i];
                    const b = latlngs[i + 1];
                    point = L.latLng(
                        a.lat + (b.lat - a.lat) * segProgress,
                        a.lng + (b.lng - a.lng) * segProgress
                    );
                    break;
                }
                covered += segLength;
            }

            marker.setLatLng(point);
            rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame(step);

        return () => {
            cancelAnimationFrame(rafId);
            map.removeLayer(marker);
        };
    }, [map, path, durationMs]);

    return null;
}

// MOTION TRACER — a lightweight canvas cursor trail that follows the pointer
// across the whole page with a fading, glowing tail.
function CursorTracer() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        if (prefersReducedMotion || isTouchDevice) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);
        let points = [];
        let rafId;

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const handleMove = (event) => {
            points.push({ x: event.clientX, y: event.clientY, life: 1 });
            if (points.length > 26) points.shift();
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            points = points
                .map((point) => ({ ...point, life: point.life - 0.045 }))
                .filter((point) => point.life > 0);

            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(curr.x, curr.y);
                ctx.strokeStyle = `rgba(237, 75, 53, ${Math.max(curr.life, 0) * 0.32})`;
                ctx.lineWidth = Math.max(curr.life * 2.6, 0.5);
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            if (points.length) {
                const head = points[points.length - 1];
                ctx.beginPath();
                ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(237, 75, 53, ${Math.max(head.life, 0) * 0.55})`;
                ctx.fill();
            }

            rafId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMove, { passive: true });
        rafId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMove);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return <canvas ref={canvasRef} className="cursor-tracer-canvas" aria-hidden="true" />;
}

export default function Home({ setActivePage }) {
    const navigate = useNavigate();

    const [showScrollTop, setShowScrollTop] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [heroParallaxY, setHeroParallaxY] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHeroPlaying, setIsHeroPlaying] = useState(true);
    const [heroDirection, setHeroDirection] = useState('next');
    const [heroMotionKey, setHeroMotionKey] = useState(0);
    const [heroPointer, setHeroPointer] = useState({ x: 0, y: 0 });
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [toppersList, setToppersList] = useState([]);
    const [achieverFilter, setAchieverFilter] = useState('ALL');
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [isEventsPaused, setIsEventsPaused] = useState(false);
    const [isAchieversPaused, setIsAchieversPaused] = useState(false);

    const eventsSectionRef = useRef(null);
    const eventsScrollRef = useRef(null);
    const eventsPausedRef = useRef(false);

    const achieversSectionRef = useRef(null);
    const achieversScrollRef = useRef(null);
    const achieversPausedRef = useRef(false);

    // Scroll progress & back to top
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setShowScrollTop(scrollY > 400);

            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (totalHeight > 0) {
                const progress = Math.min(100, Math.max(0, (scrollY / totalHeight) * 100));
                setScrollProgress(progress);
            }

            setHeroParallaxY(Math.min(scrollY, 900));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );

        const animatedElements = document.querySelectorAll('.scroll-animate');
        animatedElements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [upcomingEvents, toppersList, achieverFilter]);

    // Hero slideshow auto-transition with play/pause state
    useEffect(() => {
        if (!isHeroPlaying || heroImages.length <= 1) return;

        const interval = setInterval(() => {
            setHeroDirection('next');
            setHeroMotionKey((key) => key + 1);
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [isHeroPlaying]);

    // Real-time Firestore Listeners
    useEffect(() => {
        const unsubEvents = onSnapshot(
            collection(db, 'upcoming_events'),
            (snapshot) => {
                setUpcomingEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            },
            (error) => console.error('Events load error:', error)
        );

        const unsubToppers = onSnapshot(
            collection(db, 'exam_toppers'),
            (snapshot) => {
                setToppersList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            },
            (error) => console.error('Toppers load error:', error)
        );

        return () => {
            unsubEvents();
            unsubToppers();
        };
    }, []);

    // Events vertical ticker
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

    // Achievers horizontal ticker
    useEffect(() => {
        const el = achieversScrollRef.current;
        if (!el) return;

        let rafId;
        let lastTime = null;
        const pixelsPerSecond = 36;

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
    }, [toppersList, achieverFilter]);

    // Achievers pause toggle
    const toggleAchieversPause = () => {
        const next = !isAchieversPaused;
        setIsAchieversPaused(next);
        achieversPausedRef.current = next;
    };

    // Events pause toggle
    const toggleEventsPause = () => {
        const next = !isEventsPaused;
        setIsEventsPaused(next);
        eventsPausedRef.current = next;
    };

    const scrollAchievers = (direction) => {
        const el = achieversScrollRef.current;
        if (!el) return;
        achieversPausedRef.current = true;
        setIsAchieversPaused(true);
        const cardWidth = el.querySelector('.achiever-card')?.offsetWidth || 280;
        el.scrollBy({ left: direction * (cardWidth + 24), behavior: 'smooth' });
    };

    const nextSlide = () => {
        setHeroDirection('next');
        setHeroMotionKey((key) => key + 1);
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    };

    const prevSlide = () => {
        setHeroDirection('prev');
        setHeroMotionKey((key) => key + 1);
        setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    };

    const selectSlide = (index) => {
        if (index === currentSlide) return;
        setHeroDirection(index > currentSlide ? 'next' : 'prev');
        setHeroMotionKey((key) => key + 1);
        setCurrentSlide(index);
    };

    const handleHeroPointerMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        setHeroPointer({ x, y });
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToGallery = () => navigate('/gallery');

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(
            'Holy Cross Matriculation Higher Secondary School, Somarasampettai, Tiruchirappalli, Tamil Nadu 620102'
        );
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2400);
    };

    // Filtered and sorted toppers list
    const filteredToppers = useMemo(() => {
        let list = [...toppersList];
        if (achieverFilter === 'XII') {
            list = list.filter((t) => String(t.streamOrGrade || '').toUpperCase().includes('XII'));
        } else if (achieverFilter === 'X') {
            list = list.filter(
                (t) =>
                    String(t.streamOrGrade || '').toUpperCase().includes('X') &&
                    !String(t.streamOrGrade || '').toUpperCase().includes('XII')
            );
        }

        return list.sort((a, b) => {
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
        });
    }, [toppersList, achieverFilter]);

    return (
        <main className="home-page">
            {/* MOTION TRACER: cursor trail overlay */}
            <CursorTracer />

            {/* AMBIENT BACKGROUND GLOWS */}
            <div className="ambient-glow ambient-glow-1" />
            <div className="ambient-glow ambient-glow-2" />



            {/* HERO SECTION: Prestige Collegiate Showcase */}
            <section className="home-hero video-hero" onMouseMove={handleHeroPointerMove} onMouseLeave={() => setHeroPointer({ x: 0, y: 0 })}>
                <div
                    className="hero-background"
                    style={{
                        '--hero-scroll-y': `${heroParallaxY * 0.28}px`,
                        '--hero-mouse-x': `${heroPointer.x * 14}px`,
                        '--hero-mouse-y': `${heroPointer.y * 10}px`
                    }}
                >
                    {heroImages.map((image, index) => (
                        <div
                            key={index}
                            className={`hero-image ${index === currentSlide ? `is-active slide-${heroDirection}` : ''}`}
                            style={{ backgroundImage: `url(${image.src})` }}
                            role="img"
                            aria-label={image.caption}
                        />
                    ))}
                </div>
                <div className="hero-wash" />
                <div className="hero-mesh-overlay" />

                <div className="hero-layout hero-layout-centered">
                    <div className="hero-copy">
                        <div className="hero-badge-row">
                            <span className="hero-institution-tag">
                                <Sparkles size={13} className="sparkle-spin" />
                                Holy Cross Congregation · Est. 2002
                            </span>
                            <span className="hero-counter-tag">
                                {String(currentSlide + 1).padStart(2, '0')} / {String(heroImages.length).padStart(2, '0')}
                            </span>
                        </div>

                        <p className="hero-eyebrow">A Sanctuary of Wisdom, Character &amp; Excellence</p>

                        <h1 className="hero-headline">
                            Holy Cross Matriculation
                            <span className="hero-headline-accent">Higher Secondary School</span>
                        </h1>

                        <div className="hero-location-wrap">
                            <MapPin size={18} className="loc-pin-icon" />
                            <span id="locs">Somarasampettai, Trichy</span>
                            <span className="loc-badge">Tamil Nadu · PIN 620102</span>
                        </div>

                        <p className="hero-description">
                            Empowering young minds with holistic academic brilliance, moral fortitude,
                            and compassionate leadership rooted in the enduring legacy of Blessed Basil Antony Moreau.
                        </p>

                        <div className="hero-actions">
                            <button className="hero-primary btn-shine" onClick={goToGallery}>
                                <span>Explore Campus</span>
                                <ArrowRight size={17} className="btn-arrow" />
                            </button>
                            <button
                                className="hero-secondary"
                                onClick={() => setActivePage ? setActivePage('contact') : navigate('/contact')}
                            >
                                <GraduationCap size={17} />
                                <span>Admissions 2026–27</span>
                            </button>
                        </div>

                        {/* STATS PROOF TILES */}
                        <div className="hero-mini-proof">
                            <div className="proof-tile">
                                <strong>2002</strong>
                                <span>Founded · 24+ Yrs</span>
                            </div>
                            <div className="proof-tile">
                                <strong>2.7+</strong>
                                <span>Acres Serene Campus</span>
                            </div>
                            <div className="proof-tile">
                                <strong>100%</strong>
                                <span>Board Exam Success</span>
                            </div>
                            <div className="proof-tile">
                                <strong>X–XII</strong>
                                <span>Senior Specialization</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* HERO SLIDE CONTROLS WITH LIVE PROGRESS BAR */}
                <div className="hero-slide-controls">
                    <div className="hero-ctrl-actions">
                        <button
                            type="button"
                            className="hero-arrow-btn"
                            onClick={prevSlide}
                            aria-label="Previous Slide"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            className="hero-pause-btn"
                            onClick={() => setIsHeroPlaying(!isHeroPlaying)}
                            aria-label={isHeroPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
                        >
                            {isHeroPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button
                            type="button"
                            className="hero-arrow-btn"
                            onClick={nextSlide}
                            aria-label="Next Slide"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="hero-progress-track">
                        {heroImages.map((_, index) => (
                            <button
                                key={index}
                                className={`hero-progress-seg ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'passed' : ''
                                    }`}
                                onClick={() => selectSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            >
                                <span className="progress-seg-fill" />
                            </button>
                        ))}
                    </div>

                    <div className="hero-slide-num">
                        <strong>{String(currentSlide + 1).padStart(2, '0')}</strong>
                        <span>/{String(heroImages.length).padStart(2, '0')}</span>
                    </div>
                </div>
            </section>

            {/* KINETIC STATEMENT: Giant Scroll Headline */}
            <section className="kinetic-statement scroll-animate">
                <span className="kinetic-statement-bg" aria-hidden="true">Holy Cross</span>
                <h2 className="kinetic-statement-text">
                    Discipline. Character. <em>Excellence.</em>
                </h2>
                <p className="kinetic-statement-lead">
                    Every classroom, playing field and quiet corridor of our campus is built
                    around one idea — that young minds rise fastest when knowledge and values grow together.
                </p>
            </section>

            <div className="home-content">
                {/* NOTICE BOARD & UPCOMING EVENTS: Dashboard Magazine */}
                <section className="opening-board scroll-animate">
                    {/* NOTICE BOARD CARD */}
                    <div className="notice-panel">
                        <div className="notice-panel-head">
                            <div className="panel-title-group">
                                <span className="panel-icon-badge">
                                    <Megaphone size={16} />
                                </span>
                                <div>
                                    <h3>Notice Board</h3>
                                    <span className="panel-sub">Official School Circulars</span>
                                </div>
                            </div>
                            <span className="panel-dot">
                                <i /> Live Broadcast
                            </span>
                        </div>
                        <div className="notice-body-wrap">
                            <HomeNoticeBoard onNavigate={setActivePage} />
                        </div>
                    </div>

                    {/* UPCOMING EVENTS CARD */}
                    <div className="events-panel" ref={eventsSectionRef}>
                        <div className="events-panel-head">
                            <div className="panel-title-group">
                                <span className="panel-icon-badge badge-blue">
                                    <Calendar size={16} />
                                </span>
                                <div>
                                    <span className="section-kicker">Academic Calendar</span>
                                    <h3>Upcoming Events</h3>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="panel-pause-pill"
                                onClick={toggleEventsPause}
                                aria-label="Toggle events scrolling"
                            >
                                {isEventsPaused ? <Play size={12} /> : <Pause size={12} />}
                                <span>{isEventsPaused ? 'Resume' : 'Pause'}</span>
                            </button>
                        </div>

                        <div
                            className="events-grid"
                            ref={eventsScrollRef}
                            onMouseEnter={() => {
                                eventsPausedRef.current = true;
                                setIsEventsPaused(true);
                            }}
                            onMouseLeave={() => {
                                eventsPausedRef.current = false;
                                setIsEventsPaused(false);
                            }}
                            onTouchStart={() => {
                                eventsPausedRef.current = true;
                                setIsEventsPaused(true);
                            }}
                        >
                            {upcomingEvents.length === 0 ? (
                                <div className="empty-state">
                                    <Calendar size={28} className="empty-icon" />
                                    <p>No upcoming events published at the moment.</p>
                                    <small>Check back shortly for new updates &amp; academic schedules.</small>
                                </div>
                            ) : (
                                upcomingEvents.map((event, idx) => (
                                    <article
                                        className="event-card"
                                        key={event.id || idx}
                                        onClick={() => {
                                            eventsPausedRef.current = true;
                                            setIsEventsPaused(true);
                                        }}
                                    >
                                        <div className="event-date">
                                            <span className="event-month">{event.month || 'AUG'}</span>
                                            <strong className="event-day">{event.day || '15'}</strong>
                                        </div>
                                        <div className="event-content">
                                            <div className="event-tag-row">
                                                <span className="event-type">School Activity</span>
                                                {event.time && (
                                                    <span className="event-time">
                                                        <Clock size={11} /> {event.time}
                                                    </span>
                                                )}
                                            </div>
                                            <h3>{event.title}</h3>
                                            {event.description && <p>{event.description}</p>}
                                        </div>
                                        <div className="event-arrow-wrap">
                                            <ArrowRight className="event-arrow" size={16} />
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* VALUES SECTION: Interactive Bento Grid */}
                <section className="values-section section-block scroll-animate">
                    <div className="values-title">
                        <span className="section-kicker">Foundational Pillars</span>
                        <h2>
                            Three Pillars.
                            <br />
                            <em>One Complete Education.</em>
                        </h2>
                        <p className="values-lead">
                            Inspired by Holy Cross tradition, we cultivate sharp intellects, steadfast
                            moral courage, and radiant futures for every student entrusted to our care.
                        </p>
                    </div>

                    <div className="values-bento">
                        <article className="value-card value-card-large">
                            <div className="value-card-top">
                                <span className="value-number">PILLAR 01</span>
                                <IconBadge tone="blue">
                                    <HeartHandshake size={24} />
                                </IconBadge>
                            </div>
                            <div className="value-card-body">
                                <h3>Love &amp; Compassionate Service</h3>
                                <p>
                                    Nurturing empathetic minds grounded in social responsibility, mutual
                                    respect, and selfless service to humanity and community.
                                </p>
                                <ul className="value-highlights">
                                    <li>
                                        <CheckCircle2 size={14} /> Community outreach initiatives
                                    </li>
                                    <li>
                                        <CheckCircle2 size={14} /> Universal brotherhood &amp; respect
                                    </li>
                                    <li>
                                        <CheckCircle2 size={14} /> Moral discernment &amp; empathy
                                    </li>
                                </ul>
                            </div>
                            <span className="value-watermark">01</span>
                        </article>

                        <article className="value-card value-card-featured">
                            <div className="value-card-top">
                                <span className="value-number">PILLAR 02</span>
                                <IconBadge tone="purple">
                                    <Compass size={22} />
                                </IconBadge>
                            </div>
                            <div className="value-card-body">
                                <h3>Mind &amp; Heart Harmony</h3>
                                <p>
                                    Cultivating intellectual curiosity alongside spiritual and moral
                                    depth to navigate modern life with wisdom and integrity.
                                </p>
                                <span className="value-micro-tag">Intellectual Rigour + Character</span>
                            </div>
                            <span className="value-watermark">02</span>
                        </article>

                        <article className="value-card value-card-accent">
                            <div className="value-card-top">
                                <span className="value-number">PILLAR 03</span>
                                <IconBadge tone="gold">
                                    <Target size={22} />
                                </IconBadge>
                            </div>
                            <div className="value-card-body">
                                <h3>Bright &amp; Purposeful Future</h3>
                                <p>
                                    Fostering academic distinction, sportsmanship, and life skills so
                                    graduates step into premier universities and impactful careers.
                                </p>
                                <span className="value-micro-tag">Board Excellence + Life Skills</span>
                            </div>
                            <span className="value-watermark">03</span>
                        </article>
                    </div>
                </section>

                {/* PRINCIPAL DESK: Heritage Archival Editorial */}
                <section className="principal-section scroll-animate">
                    <div className="principal-image-side">
                        <img
                            src={photo}
                            alt="Principal, Fr. A. Arokia Sahayaraj, Holy Cross Matriculation Higher Secondary School"
                            className="principal-portrait"
                        />
                        <div className="principal-image-tag">
                            <Award size={16} className="tag-gold-icon" />
                            <div>
                                <span>Principal's Desk</span>
                                <strong>Academic Year 2026–27</strong>
                            </div>
                        </div>
                        <div className="principal-image-stamp">
                            <svg viewBox="0 0 100 100" className="stamp-svg">
                                <path
                                    id="stampPath"
                                    d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                                    fill="none"
                                />
                                <text>
                                    <textPath href="#stampPath" startOffset="0%">
                                        HOLY CROSS MATRICULATION • EST. 2002 •
                                    </textPath>
                                </text>
                            </svg>
                            <span className="stamp-center">HCMS</span>
                        </div>
                    </div>

                    <div className="principal-content">
                        <div className="principal-heading-line">
                            <span className="section-kicker">A Message From Our Principal</span>
                            <span className="principal-index-badge">Leadership · 02</span>
                        </div>

                        <h2>
                            Preparing children
                            <br />
                            <em>for life, not only exams.</em>
                        </h2>

                        <div className="principal-quote-row">
                            <Quote className="quote-icon" size={44} />
                            <div className="quote-text-wrap">
                                <p>
                                    Education is not merely about preparing for a living, but laying an
                                    unshakable foundation for life. At Holy Cross, we strive to ignite
                                    intellectual curiosity, emotional balance, and ethical grounding in every
                                    single student.
                                </p>
                                <p className="quote-secondary">
                                    We warmly invite you to partner with us as we guide your children toward
                                    soaring into a bright, purposeful future with confidence and honor.
                                </p>
                            </div>
                        </div>

                        <div className="principal-signature">
                            <div className="signature-info">
                                <strong>Fr. A. Arokia Sahayaraj</strong>
                                <span>Principal · Holy Cross Matriculation Higher Secondary School</span>
                                <small>Somarasampettai, Tiruchirappalli</small>
                            </div>
                            <div className="signature-crest">
                                <GraduationCap size={28} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ABOUT & HISTORIC JOURNEY */}
                <section className="about-section section-block scroll-animate">
                    <div className="about-layout">
                        <div className="about-copy">
                            <span className="section-kicker">Since 2002 · Our Heritage</span>
                            <h2>A legacy that continually surges forward.</h2>
                            <p className="about-lead">
                                Holy Cross Matriculation Higher Secondary School at Somarasampettai stands
                                as a citadel of value-based learning, welcoming all students in their quest
                                for scholastic and personal triumph.
                            </p>
                            <p>
                                Grounded in the vision of Blessed Basil Antony Moreau, who established the
                                Holy Cross congregation in 1837, we are driven by the conviction that society
                                is transformed when young minds are illuminated with both knowledge and virtue.
                            </p>
                            <p>
                                Our devoted educators and modern infrastructure nurture holistic growth
                                spanning STEM fields, humanities, athletic championships, and artistic pursuits.
                            </p>
                        </div>

                        <div className="journey-timeline">
                            <div className="journey-title">
                                <Globe2 size={18} />
                                <span>Milestones of Growth</span>
                            </div>
                            <div className="journey-track-line" />

                            <div className="journey-item">
                                <span className="journey-year">2002</span>
                                <div className="journey-details">
                                    <b>01</b>
                                    <div>
                                        <strong>Humble Inception</strong>
                                        <p>Started under a thatched roof with a courageous vision for rural education.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="journey-item">
                                <span className="journey-year">2011</span>
                                <div className="journey-details">
                                    <b>02</b>
                                    <div>
                                        <strong>High School Upgrade</strong>
                                        <p>Recognized by Tamil Nadu Board; modern brick-and-mortar blocks inaugurated.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="journey-item">
                                <span className="journey-year">2014</span>
                                <div className="journey-details">
                                    <b>03</b>
                                    <div>
                                        <strong>Higher Secondary Status</strong>
                                        <p>Comprehensive Science, Commerce and Computer streams launched with state-of-art labs.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="journey-item">
                                <span className="journey-year">2026</span>
                                <div className="journey-details">
                                    <b>04</b>
                                    <div>
                                        <strong>Silver Jubilee Horizon</strong>
                                        <p>Smart classrooms, digital innovation, and top ranks across the Tiruchirappalli district.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MISSION & VISION: Panoramic Manifesto */}
                <section className="mission-section scroll-animate">
                    <div className="mission-number">03</div>
                    <div className="mission-main">
                        <span className="section-kicker">Mission &amp; Vision</span>
                        <h2>Growing capable minds with compassionate hearts.</h2>
                        <p>
                            Molding students into intellectually competent, morally upright, socially
                            conscious, and spiritually grounded individuals dedicated to the betterment of
                            our nation.
                        </p>
                    </div>
                    <div className="mission-points">
                        <div className="mission-point-item">
                            <CheckCircle2 size={18} />
                            <div>
                                <strong>Value-Centric Pedagogy</strong>
                                <span>Ethics, character, and honesty interwoven into daily lessons.</span>
                            </div>
                        </div>
                        <div className="mission-point-item">
                            <CheckCircle2 size={18} />
                            <div>
                                <strong>Inclusivity &amp; Secular Respect</strong>
                                <span>Celebrating diversity and harmonious respect for all faiths.</span>
                            </div>
                        </div>
                        <div className="mission-point-item">
                            <CheckCircle2 size={18} />
                            <div>
                                <strong>Grades X, XI &amp; XII Mastery</strong>
                                <span>Rigorous academic coaching for stellar board exam results.</span>
                            </div>
                        </div>
                        <div className="mission-point-item">
                            <CheckCircle2 size={18} />
                            <div>
                                <strong>Holistic Co-Curriculars</strong>
                                <span>Athletics, arts, speech, and robotics fostering all-round talent.</span>
                            </div>
                        </div>
                        <div className="mission-point-item">
                            <CheckCircle2 size={18} />
                            <div>
                                <strong>Soaring to a Bright Future</strong>
                                <span>Equipping every child to excel in top collegiate careers.</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ACHIEVERS & BOARD TOPPERS */}
                <section className="achievers-section section-block scroll-animate" ref={achieversSectionRef}>
                    <SectionHeading
                        eyebrow="Academic Brilliance"
                        badge="Excellence"
                        title="Board Exam Toppers & Achievers"
                        description="Celebrating the relentless hard work, discipline, and intellectual triumphs of our star performers."
                        action={
                            <div className="achievers-header-actions">
                                <div className="achiever-filter-tabs">
                                    <button
                                        type="button"
                                        className={`filter-tab ${achieverFilter === 'ALL' ? 'active' : ''}`}
                                        onClick={() => setAchieverFilter('ALL')}
                                    >
                                        All Ranks
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-tab ${achieverFilter === 'XII' ? 'active' : ''}`}
                                        onClick={() => setAchieverFilter('XII')}
                                    >
                                        Class XII
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-tab ${achieverFilter === 'X' ? 'active' : ''}`}
                                        onClick={() => setAchieverFilter('X')}
                                    >
                                        Class X
                                    </button>
                                </div>
                                <button
                                    className="outline-action"
                                    onClick={() => setActivePage ? setActivePage('progress-report') : navigate('/progress-report')}
                                >
                                    <span>Scorecards</span>
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        }
                    />

                    {filteredToppers.length === 0 ? (
                        <div className="empty-states">
                            <Trophy size={32} className="empty-icon" />
                            <p>No toppers published yet in this category.</p>
                            <small>Updated board exam results will appear here as soon as announced.</small>
                        </div>
                    ) : (
                        <div className="achievers-carousel-wrapper">
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
                                onMouseEnter={() => {
                                    achieversPausedRef.current = true;
                                    setIsAchieversPaused(true);
                                }}
                                onMouseLeave={() => {
                                    achieversPausedRef.current = false;
                                    setIsAchieversPaused(false);
                                }}
                                onTouchStart={() => {
                                    achieversPausedRef.current = true;
                                    setIsAchieversPaused(true);
                                }}
                            >
                                {filteredToppers.map((topper, idx) => {
                                    const rankNum = parseInt(topper.rank, 10);
                                    const isFirst = rankNum === 1;
                                    const isSecond = rankNum === 2;
                                    const isThird = rankNum === 3;

                                    return (
                                        <article
                                            className={`achiever-card ${isFirst ? 'rank-gold' : ''} ${isSecond ? 'rank-silver' : ''
                                                } ${isThird ? 'rank-bronze' : ''}`}
                                            key={topper.id || idx}
                                        >
                                            <div className="achiever-rank-pill">
                                                {isFirst && <Star size={12} fill="#f4b400" color="#f4b400" />}
                                                <span>Rank #{topper.rank || idx + 1}</span>
                                            </div>

                                            {topper.photo ? (
                                                <div className="achiever-photo-wrap">
                                                    <img
                                                        src={topper.photo}
                                                        alt={topper.name}
                                                        className="achiever-photo"
                                                    />
                                                    <span className="achiever-photo-badge">
                                                        <Trophy size={14} />
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="achiever-avatar-placeholder">
                                                    <IconBadge tone={isFirst ? 'gold' : isSecond ? 'purple' : 'blue'}>
                                                        <Trophy size={24} />
                                                    </IconBadge>
                                                </div>
                                            )}

                                            <span className="achiever-grade">{topper.streamOrGrade || 'Grade XII'}</span>
                                            <h3 className="achiever-name">{topper.name}</h3>
                                            <div className="achiever-score-chip">
                                                <span>{topper.scoreOrPercentage || 'Distinction'}</span>
                                            </div>
                                        </article>
                                    );
                                })}
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

                {/* CAMPUS LIFE: Visual Mosaic Gallery */}
                <section className="campus-section scroll-animate">
                    <div className="campus-heading">
                        <div>
                            <span className="section-kicker">Spaces of Growth</span>
                            <h2>
                                Spaces that make
                                <br />
                                <em>school feel alive.</em>
                            </h2>
                        </div>
                        <button className="campus-gallery-button btn-shine" onClick={goToGallery}>
                            <span>Explore Full Gallery</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="campus-mosaic">
                        {campusGalleries.map((item, index) => (
                            <div
                                className={`campus-mosaic-item campus-mosaic-${index + 1} ${item.col === 'wide' ? 'is-wide' : ''
                                    }`}
                                key={index}
                                onClick={goToGallery}
                            >
                                <img
                                    src={item.img}
                                    alt={`Holy Cross Campus ${item.title}`}
                                    loading={index > 2 ? 'lazy' : 'eager'}
                                />
                                <div className="mosaic-overlay">
                                    <div className="mosaic-tag-row">
                                        <span className="mosaic-tag">{item.tag}</span>
                                        <span className="mosaic-index">{String(index + 1).padStart(2, '0')}</span>
                                    </div>
                                    <strong className="mosaic-title">{item.title}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* STUDENT LIFE: Clubs & Enrichment */}
                <section className="student-life section-block scroll-animate">
                    <SectionHeading
                        eyebrow="Beyond The Classroom"
                        badge="Enrichment"
                        title="Discover. Participate. Excel."
                        description="Co-curricular opportunities nurture leadership, sportsmanship, and creative expression across all grades."
                    />

                    <div className="clubs-grid">
                        <article className="club-card club-blue">
                            <div className="club-card-number">01</div>
                            <IconBadge tone="blue">
                                <BookOpen size={22} />
                            </IconBadge>
                            <h3>Science &amp; IT Club</h3>
                            <p>Hands-on laboratory experiments, robotics workshops, and foundational computer coding training.</p>
                            <div className="club-pills">
                                <span>Robotics</span>
                                <span>Coding</span>
                                <span>STEM Expo</span>
                            </div>
                        </article>

                        <article className="club-card club-gold">
                            <div className="club-card-number">02</div>
                            <IconBadge tone="gold">
                                <Trophy size={22} />
                            </IconBadge>
                            <h3>Sports &amp; Athletics</h3>
                            <p>Football, cricket, basketball, sprint athletics, and indoor games with professional coaching.</p>
                            <div className="club-pills">
                                <span>Football</span>
                                <span>Athletics</span>
                                <span>State Meets</span>
                            </div>
                        </article>

                        <article className="club-card club-purple">
                            <div className="club-card-number">03</div>
                            <IconBadge tone="purple">
                                <Sparkles size={22} />
                            </IconBadge>
                            <h3>Cultural &amp; Fine Arts</h3>
                            <p>Classical dance, instrumental music, school choir, dramatics, and visual arts exhibitions.</p>
                            <div className="club-pills">
                                <span>Music Choir</span>
                                <span>Dramatics</span>
                                <span>Painting</span>
                            </div>
                        </article>

                        <article className="club-card club-coral">
                            <div className="club-card-number">04</div>
                            <IconBadge tone="coral">
                                <Users size={22} />
                            </IconBadge>
                            <h3>Eco &amp; Social Corps</h3>
                            <p>Campus tree plantation drives, environmental cleanliness campaigns, and community service missions.</p>
                            <div className="club-pills">
                                <span>Green Drive</span>
                                <span>Social Work</span>
                                <span>Recycling</span>
                            </div>
                        </article>
                    </div>
                </section>

                {/* FAQ SECTION: Interactive Accordion */}
                <section className="faq-section section-block scroll-animate">
                    <div className="faq-heading">
                        <span className="section-kicker">Frequently Asked Questions</span>
                        <h2>
                            Everything you
                            <br />
                            <em>need to know.</em>
                        </h2>
                        <p className="faq-lead">
                            Have more questions about admissions or school life? Our administration desk
                            is here to guide you every step of the way.
                        </p>
                    </div>

                    <div className="faq-list">
                        <details open>
                            <summary>
                                <span>01</span>
                                <b>What curriculum and grades are offered at Holy Cross?</b>
                                <Plus size={18} className="faq-icon" />
                            </summary>
                            <div className="faq-content">
                                <p>
                                    We offer the State Board and Matriculation curriculum from Primary through
                                    Higher Secondary, with specialized academic tracks in Pure Science, Computer
                                    Science, and Commerce for Grades X, XI and XII.
                                </p>
                            </div>
                        </details>

                        <details>
                            <summary>
                                <span>02</span>
                                <b>Where is the campus located in Tiruchirappalli?</b>
                                <Plus size={18} className="faq-icon" />
                            </summary>
                            <div className="faq-content">
                                <p>
                                    Our school is serenely situated in Somarasampettai, Tiruchirappalli (Trichy),
                                    Tamil Nadu. It is easily accessible from main city transit routes while providing
                                    a noise-free, verdant atmosphere ideal for focused study.
                                </p>
                            </div>
                        </details>

                        <details>
                            <summary>
                                <span>03</span>
                                <b>Are transport facilities available for students?</b>
                                <Plus size={18} className="faq-icon" />
                            </summary>
                            <div className="faq-content">
                                <p>
                                    Authorized private vans and designated transport routes currently serve students
                                    across Somarasampettai and neighbouring Trichy localities, with dedicated school
                                    bus services being initiated soon.
                                </p>
                            </div>
                        </details>

                        <details>
                            <summary>
                                <span>04</span>
                                <b>How does the school prepare students for Board Examinations?</b>
                                <Plus size={18} className="faq-icon" />
                            </summary>
                            <div className="faq-content">
                                <p>
                                    We conduct regular diagnostic tests, remedial mentoring, chapter-wise revisions,
                                    and simulated board model examinations. Personalized faculty counselling helps each
                                    student attain peak confidence and top scores.
                                </p>
                            </div>
                        </details>
                    </div>
                </section>

                {/* VISIT & LOCATION SECTION: Leaflet Map & Directions */}
                <section className="visit-section section-block scroll-animate">
                    <div className="visit-card">
                        <div className="visit-info">
                            <div className="visit-top">
                                <span className="section-kicker">Plan A Visit</span>
                                <Navigation size={20} className="visit-nav-icon" />
                            </div>

                            <h2>
                                Come see where
                                <br />
                                <em>the journey unfolds.</em>
                            </h2>
                            <span className="heading-trace" aria-hidden="true">
                                <svg viewBox="0 0 100 4" preserveAspectRatio="none">
                                    <path className="heading-trace-path" d="M0,2 L100,2" />
                                </svg>
                            </span>
                            <p className="visit-description">
                                Experience firsthand our campus spirit, interact with our faculty, and discover why
                                Holy Cross is the ideal haven for your child's education.
                            </p>

                            <div className="visit-address-card">
                                <MapPin size={22} className="address-pin-icon" />
                                <div>
                                    <strong>Holy Cross Matriculation Higher Secondary School</strong>
                                    <span>Somarasampettai, Tiruchirappalli, Tamil Nadu 620102</span>
                                </div>
                            </div>

                            <div className="contact-pills-row">
                                <span className="contact-pill">
                                    <Clock size={13} /> Mon – Sat: 8:30 AM – 4:00 PM
                                </span>
                            </div>

                            <div className="visit-actions-row">
                                <a
                                    href="https://www.google.com/maps/place/Holy+Cross+Matriculation+Higher+Secondary+School/@10.8121744,78.6360259,280m"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="map-direction btn-shine"
                                >
                                    <span>Get Directions</span>
                                    <ExternalLink size={15} />
                                </a>

                                <button
                                    type="button"
                                    className="copy-address-btn"
                                    onClick={handleCopyAddress}
                                >
                                    {copiedAddress ? <Check size={14} /> : <Copy size={14} />}
                                    <span>{copiedAddress ? 'Address Copied!' : 'Copy Address'}</span>
                                </button>
                            </div>
                        </div>

                        {/* LEAFLET SATELLITE MAP */}
                        <div className="map-frame">
                            <MapContainer
                                center={schoolCoordinates}
                                zoom={16}
                                scrollWheelZoom={false}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <TileLayer
                                    attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    maxZoom={19}
                                />
                                {/* MOTION TRACER: animated dashed approach route */}
                                <Polyline
                                    positions={routeToSchool}
                                    pathOptions={{
                                        className: 'route-tracer-path',
                                        color: '#ed4b35',
                                        weight: 3,
                                        opacity: 0.75,
                                        lineCap: 'round',
                                    }}
                                />
                                <RouteMotionTracer path={routeToSchool} />

                                {/* Radar pulse sitting beneath the campus marker */}
                                <Marker
                                    position={schoolCoordinates}
                                    icon={L.divIcon({
                                        className: 'radar-pulse-icon',
                                        html: '<span class="radar-ring radar-ring-1"></span><span class="radar-ring radar-ring-2"></span>',
                                        iconSize: [1, 1],
                                        iconAnchor: [0, 0],
                                    })}
                                    interactive={false}
                                    keyboard={false}
                                    zIndexOffset={-100}
                                />

                                <Marker position={schoolCoordinates}>
                                    <Popup>
                                        <div className="map-popup-card">
                                            <strong>Holy Cross Matric. Hr. Sec. School</strong>
                                            <p>Somarasampettai, Tiruchirappalli</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                            <div className="map-badge-overlay">
                                <span className="beacon-dot" />
                                <span>Holy Cross Campus, Trichy</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* FLOATING SCROLL PROGRESS TO TOP */}
            {showScrollTop && (
                <button
                    className="scroll-top"
                    onClick={scrollToTop}
                    aria-label="Scroll back to top"
                >
                    <svg className="scroll-progress-ring" width="48" height="48">
                        <circle
                            className="progress-ring-circle-bg"
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth="3"
                            fill="transparent"
                            r="20"
                            cx="24"
                            cy="24"
                        />
                        <circle
                            className="progress-ring-circle"
                            stroke="#f4b400"
                            strokeWidth="3"
                            fill="transparent"
                            r="20"
                            cx="24"
                            cy="24"
                            style={{
                                strokeDasharray: `${2 * Math.PI * 20}`,
                                strokeDashoffset: `${2 * Math.PI * 20 * (1 - scrollProgress / 100)}`,
                            }}
                        />
                    </svg>
                    <ArrowUp size={18} className="scroll-arrow-icon" />
                </button>
            )}
        </main>
    );
}