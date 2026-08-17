import React from 'react';
import logo from "../assets/logo.png"
import logo1 from "../assets/logo1.jpg"
import './Preloader.css';

export default function Preloader({ fadeOut }) {
    return (
        <div className={`preloader-overlay ${fadeOut ? 'fade-out' : ''}`}>
            <div className="preloader-content">
                {/* Crest/Logo Container with Glowing Ring */}
                <div className="logo-ring-container">
                    <div className="glowing-ring"></div>
                    <img
                        src={logo}
                        alt="College Logo"
                        className="preloader-logo"
                    />
                </div>

                {/* Title & Subtitle */}
                <h1 className="college-title">HOLY CROSS MATRIC. HR. SEC. SCHOOL</h1>
                <p className="college-subtitle">SOMARASAMPETTAI • TIRUCHIRAPPALLI
                </p>

                {/* Animated Progress / Loading Bar */}
                <div className="loading-bar-container">
                    <div className="loading-bar-progress"></div>
                </div>
            </div>
        </div>
    );
}