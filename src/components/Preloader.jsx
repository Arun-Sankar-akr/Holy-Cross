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
                        alt="School Logo"
                        className="preloader-logo"
                    />
                </div>

                {/* Title & Subtitle */}
                <h1 className="school-title">Holy Cross Matric. Hr. Sec. School</h1>
                <p className="school-subtitle">Somarasampettai • Tiruchirappalli
                </p>

                {/* Animated Progress / Loading Bar */}
                <div className="loading-bar-container">
                    <div className="loading-bar-progress"></div>
                </div>
            </div>
        </div>
    );
}