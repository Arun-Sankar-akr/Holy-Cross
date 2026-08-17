import React from 'react';
import { MapPin, Mail, Phone, Eye } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-top-accent"></div>

            <div className="footer-container">
                {/* Address Section */}
                <div className="footer-col">
                    <div className="col-header">
                        <div className="icon-badge">
                            <MapPin className="col-icon" size={18} />
                        </div>
                        <h4>Address</h4>
                    </div>
                    <div className="col-content">
                        <p>Vayalur Main Road,</p>
                        <p>Somarasampettai,</p>
                        <p>Tiruchirappalli,</p>
                        <p>Tamil Nadu, 620102</p>
                    </div>
                </div>

                {/* Email / Website Section */}
                <div className="footer-col">
                    <div className="col-header">
                        <div className="icon-badge">
                            <Mail className="col-icon" size={18} />
                        </div>
                        <h4>Email & Web</h4>
                    </div>
                    <div className="col-content">
                        <p>
                            <a href="mailto:hcms2002@gmail.com" className="footer-link">hcms2002@gmail.com</a>
                            <span className="sub-label"> (Office)</span>
                        </p>
                        <p className="link-item">
                            <a href="https://holycrosssmpt.org" target="_blank" rel="noreferrer" className="footer-link">holycrosssmpt.org</a>
                            <span className="sub-label"> (Official)</span>
                        </p>
                        <p className="link-item">
                            <a href="https://app.holycrosssmpt.org" target="_blank" rel="noreferrer" className="footer-link">app.holycrosssmpt.org</a>
                            <span className="sub-label"> (ERP)</span>
                        </p>
                    </div>
                </div>

                {/* Mobile / Landline Section */}
                <div className="footer-col">
                    <div className="col-header">
                        <div className="icon-badge">
                            <Phone className="col-icon" size={18} />
                        </div>
                        <h4>Contact Us</h4>
                    </div>
                    <div className="col-content">
                        <p>
                            <a href="tel:9597172383" className="footer-link">9597172383</a>
                            <span className="sub-label"> (School Office)</span>
                        </p>
                        <p className="link-item">
                            <a href="tel:04312607175" className="footer-link">04312607175</a>
                            <span className="sub-label"> (Landline)</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            {/* <div className="views-counter">
                        <Eye size={16} className="views-icon" />
                        <span>Views : <strong className="counter-badge">987,326</strong></span>
                    </div> */}
            <div className="footer-bottom-bar">
                <div className="footer-bottom-container">

                    <div className="copyright-info">
                        <p>Copyright © <strong>Holy Cross Matric. Hr. Sec. School</strong></p>
                        <p className="developer-tag">Designed & Developed by <span className="dev-brand"><a className='dev' href="https://arunakr.netlify.app" target="_blank">AKR Developer</a></span></p>
                    </div>
                </div>
            </div>
        </footer>
    );
}