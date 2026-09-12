import React from 'react';
import {
    MapPin,
    Mail,
    Phone
} from 'lucide-react';
import './Footer.css';
import logo from "../assets/logo.png"

const SocialIcon = ({ path }) => (
    <svg viewBox="0 0 24 24" width={17} height={17} fill="currentColor" aria-hidden="true">
        <path d={path} />
    </svg>
);

const SOCIAL_ICONS = {
    facebook: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z',
    instagram: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.43.4a4.9 4.9 0 0 1 1.77 1.15 4.9 4.9 0 0 1 1.15 1.77c.16.46.35 1.26.4 2.43.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.4 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.46.16-1.26.35-2.43.4-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.43-.4a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.16-.46-.35-1.26-.4-2.43C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.24-1.97.4-2.43A4.9 4.9 0 0 1 3.78 3.9 4.9 4.9 0 0 1 5.55 2.75c.46-.16 1.26-.35 2.43-.4C9.25 2.29 9.63 2.28 12 2.28V2.16zm0 1.85c-3.15 0-3.5.01-4.74.07-1.02.05-1.58.22-1.95.36-.49.19-.84.42-1.2.79a3.15 3.15 0 0 0-.79 1.2c-.14.37-.31.93-.36 1.95-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.02.22 1.58.36 1.95.19.49.42.84.79 1.2.36.36.71.6 1.2.79.37.14.93.31 1.95.36 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.02-.05 1.58-.22 1.95-.36.49-.19.84-.43 1.2-.79.36-.36.6-.71.79-1.2.14-.37.31-.93.36-1.95.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.02-.22-1.58-.36-1.95a3.15 3.15 0 0 0-.79-1.2 3.15 3.15 0 0 0-1.2-.79c-.37-.14-.93-.31-1.95-.36-1.24-.06-1.59-.07-4.74-.07zm0 3.15a4.84 4.84 0 1 1 0 9.68 4.84 4.84 0 0 1 0-9.68zm0 7.98a3.14 3.14 0 1 0 0-6.28 3.14 3.14 0 0 0 0 6.28zm6.16-8.17a1.13 1.13 0 1 1-2.26 0 1.13 1.13 0 0 1 2.26 0z',
    linkedin: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45C23.2 24 24 23.22 24 22.25V1.75C24 .78 23.2 0 22.22 0z',
    x: 'M18.9 2.1h3.4l-7.4 8.4 8.7 11.4h-6.8l-5.3-6.9-6.1 6.9H1.9l7.9-9-8.4-10.8h7l4.8 6.3 5.7-6.3zm-1.2 17.8h1.9L7.4 4h-2l12.3 15.9z',
    youtube: 'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z'
};

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">

            {/* =====================================================
                TOP UTILITY BAR
            ===================================================== */}
            <div className="footer-topbar">
                <span className="footer-topbar-name">
                    Holy Cross Matric. Hr. Sec. School
                </span>

                <span className="footer-topbar-tags">
                    <span>Education</span>
                    <span>Values</span>
                    <span className="is-strong">A Brighter Tomorrow</span>
                </span>
            </div>


            {/* =====================================================
                CARD
            ===================================================== */}
            <div className="footer-card">

                <div className="footer-card-top">

                    {/* BRAND */}
                    <section className="footer-brand">

                        <div className="footer-brand-mark"><img src={logo} alt="holy cross" id='logoed' /></div>

                        <div className="footer-brand-copy">
                            <h2>
                                Holy Cross
                                <span>Matric. Hr. Sec. School</span>
                            </h2>

                            <p className="footer-tagline">
                                Inspiring young minds. Building strong values.
                                Shaping a brighter tomorrow.
                            </p>

                            <div className="footer-socials">
                                <a href="#" aria-label="Facebook">
                                    <SocialIcon path={SOCIAL_ICONS.facebook} />
                                </a>
                                <a href="#" aria-label="Instagram">
                                    <SocialIcon path={SOCIAL_ICONS.instagram} />
                                </a>
                                <a href="#" aria-label="LinkedIn">
                                    <SocialIcon path={SOCIAL_ICONS.linkedin} />
                                </a>
                                <a href="#" aria-label="X">
                                    <SocialIcon path={SOCIAL_ICONS.x} />
                                </a>
                                <a href="#" aria-label="YouTube">
                                    <SocialIcon path={SOCIAL_ICONS.youtube} />
                                </a>
                            </div>
                        </div>
                    </section>

                    <span className="footer-divider" />

                    {/* QUICK LINKS */}
                    <section className="footer-column">
                        <h3>Quick Links</h3>

                        <nav className="footer-links">
                            <a href="/">Home</a>
                            <a href="/about">About Us</a>
                            <a href="/academics">Academics</a>
                            <a href="/staff">Our Staff</a>
                            <a href="/gallery">Gallery</a>
                            <a href="/admissions">Admissions 2026</a>
                        </nav>
                    </section>


                    {/* OUR SERVICES */}
                    <section className="footer-column">
                        <h3>Our Services</h3>

                        <nav className="footer-links">
                            <a href="/library">Library</a>
                            <a href="/transport">Transport</a>
                            <a href="/hostel">Hostel</a>
                            <a href="/alumni">Alumni Network</a>
                            <a href="/erp">Student ERP</a>
                            <a href="/holidays">School Holidays</a>
                        </nav>
                    </section>


                    {/* CONTACT */}
                    <section className="footer-column footer-contact-column">
                        <h3>Contact</h3>

                        <div className="footer-contact-list">

                            <div className="footer-contact-item">
                                <div className="contact-icon">
                                    <span id='iconsss'><MapPin size={16} strokeWidth={1.8} /></span>
                                </div>
                                <div>
                                    <strong>Address</strong>
                                    <span>
                                        Somarasampettai, Tiruchirappalli,
                                        Tamil Nadu
                                    </span>
                                </div>
                            </div>

                            <a href="mailto:hcms2002@gmail.com" className="footer-contact-item">
                                <div className="contact-icon">
                                    <span id='iconsss'><Mail size={16} strokeWidth={1.8} /></span>
                                </div>
                                <div>
                                    <strong>Email</strong>
                                    <span>hcms2002@gmail.com</span>
                                </div>
                            </a>

                            <div className="footer-contact-item">
                                <div className="contact-icon">
                                    <span id='iconsss'><Phone size={16} strokeWidth={1.8} /></span>
                                </div>
                                <div>
                                    <strong>Phone</strong>
                                    <span>
                                        <a href="tel:9597172383">9597172383</a>
                                        {' '}|{' '}
                                        <a href="tel:04312607175">0431 260 7175</a>
                                    </span>
                                </div>
                            </div>

                        </div>
                    </section>

                </div>


                {/* BOTTOM BAR */}
                <div className="footer-card-bottom">
                    <p>
                        © {currentYear} Holy Cross Matric. Hr. Sec. School. All rights reserved.
                    </p>

                    <div className="footer-bottom-right">

                        <div className="footer-legal-links">
                            <a href="/privacy">Privacy Policy</a>
                            <a href="/terms">Terms of Service</a>
                            <a href="/cookies">Cookies Settings</a>
                        </div>

                        <span className="footer-credit-divider" />

                        <div className="footer-credit">
                            <span>Designed & Developed by</span>

                            <a
                                href="https://arunakr.netlify.app"
                                target="_blank"
                                rel="noreferrer"
                            >
                                AKR Developer
                            </a>
                        </div>

                    </div>
                </div>

            </div>

            {/* WATERMARK */}
            <div className="footer-watermark" aria-hidden="true">
                <span>Holy Cross</span>
            </div>

        </footer>
    );
}