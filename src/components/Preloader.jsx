import React from 'react';
import logo from "../assets/logo.png"
import './Preloader.css';

export default function Preloader({ fadeOut }) {
    return (
        <div className={`preloader-overlay ${fadeOut ? 'fade-out' : ''}`}>
            <div className="preloader-content">

                {/* Crest Logo with soft ambient glow */}
                <div className="crest-container">
                    <div className="crest-glow"></div>
                    <img
                        src={logo}
                        alt="Holy Cross Matriculation Higher Secondary School crest"
                        className="preloader-logo"
                    />
                </div>

                {/* Title & Subtitle */}
                <div className="preloader-text">
                    <h1 className="school-title">Holy Cross Matric. Hr. Sec. School</h1>
                    <div className="title-divider">
                        <span className="divider-line"></span>
                        <span className="divider-dot"></span>
                        <span className="divider-line"></span>
                    </div>
                    <p className="school-subtitle">Somarasampettai &nbsp;•&nbsp; Tiruchirappalli</p>
                </div>

                {/* Loading Bar */}
                <div className="loading-bar-container">
                    <div className="loading-bar-progress"></div>
                </div>
                <p className="loading-label">Loading</p>
            </div>
        </div>
    );
}