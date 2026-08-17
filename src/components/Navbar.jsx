import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';
import './Navbar.css';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 30);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [mobileMenuOpen]);

    const navItems = [
        { title: 'Home', path: '/', type: 'link' },
        {
            title: 'About Us', id: 'school', type: 'dropdown',
            items: [
                { name: 'Administrators', path: '/school/administrators' },
                { name: 'Rules & Regulations', path: '/school/rules' },
                { name: 'School Strength', path: '/school/pupil-strength' },
            ]
        },
        {
            title: 'Academics', id: 'academics', type: 'dropdown',
            items: [
                { name: 'Academic Calendar', path: '/school/calendar' },
                { name: 'Holidays List', path: '/school/holiday' },
                { name: 'Exam Toppers', path: '/school/toppers' },
            ]
        },
        {
            title: 'Staffs', id: 'staffs', type: 'dropdown',
            items: [
                { name: 'Teaching Staff', path: '/staffs/teaching' },
                { name: 'Non-Teaching Staff', path: '/staffs/non-teaching' },
                { name: 'Staff Committees', path: '/staffs/committees' },
            ]
        },
        {
            title: 'ERP', id: 'erp', type: 'dropdown',
            items: [
                { name: 'Staff', path: '/erp/staff' },
                { name: 'Student', path: '/erp/student' },
            ]
        },
        { title: 'Gallery', path: '/gallery', type: 'link' },
        {
            title: 'Services & Amenities', id: 'service', type: 'dropdown',
            items: [
                { name: 'Library', path: '/school/service-library' },
                { name: 'Transport', path: '/school/service-transport' },
                { name: 'Hostel', path: '/school/service-hostel' },
            ]
        },
        {
            title: 'Alumni Network', id: 'alumni', type: 'dropdown',
            items: [
                { name: 'About Alumni', path: '/alumni/notable' },
                { name: 'Registration', path: '/alumni/registration' },
                { name: 'Alumni Meets', path: '/alumni/meets' },
            ]
        },
        { title: 'Admissions 2026', path: '/admissions', type: 'link' },
    ];

    const toggleDropdown = (id) => {
        setOpenDropdown(openDropdown === id ? null : id);
    };

    return (
        <header ref={navRef} className={`header-root ${scrolled ? 'is-scrolled' : ''}`}>
            <div className="header-container">

                <Link to="/" className="header-brand" onClick={() => setMobileMenuOpen(false)}>
                    <img src={logo} alt="Holy Cross Logo" className="brand-crest" />
                    <div className="brand-details">
                        <h1 className="brand-title">HOLY CROSS MATRIC. HR. SEC. SCHOOL</h1>
                        <div className="brand-subline">
                            <span className="subline-divider"></span>
                            <span className="subline-text">SOMARASAMPETTAI • TIRUCHIRAPPALLI</span>
                            <span className="subline-divider"></span>
                        </div>
                    </div>
                </Link>

                <nav className={`header-nav ${mobileMenuOpen ? 'is-mobile-open' : ''}`}>
                    {navItems.map((nav, index) => (
                        nav.type === 'link' ? (
                            <Link
                                key={nav.path}
                                to={nav.path}
                                className={`nav-link ${location.pathname === nav.path ? 'is-active' : ''}`}
                            >
                                {nav.title}
                            </Link>
                        ) : (
                            <div key={nav.id || index} className="nav-dropdown-group">
                                <button
                                    className={`nav-link ${openDropdown === nav.id ? 'is-active' : ''}`}
                                    onClick={() => toggleDropdown(nav.id)}
                                >
                                    <span>{nav.title}</span>
                                    <ChevronDown size={14} className={`arrow-indicator ${openDropdown === nav.id ? 'is-rotated' : ''}`} />
                                </button>

                                {openDropdown === nav.id && (
                                    <div className="dropdown-panel">
                                        {nav.items.map((item) => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`dropdown-link ${location.pathname === item.path ? 'is-active' : ''}`}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    ))}
                </nav>

                <button className="mobile-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                </button>

            </div>
        </header>
    );
}