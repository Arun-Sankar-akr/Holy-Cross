import React from "react";
import logo from "../assets/logo.png";
import "./Preloader.css";

export default function Preloader({ fadeOut }) {
    return (
        <div className={`preloader-overlay ${fadeOut ? "fade-out" : ""}`}>
            {/* Ambient background */}
            <div className="preloader-orb orb-one"></div>
            <div className="preloader-orb orb-two"></div>

            {/* Floating particles */}
            <div className="preloader-particles">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>

            <div className="preloader-content">

                {/* Premium Logo */}
                <div className="premium-logo-wrapper">

                    <div className="logo-ring ring-one"></div>
                    <div className="logo-ring ring-two"></div>
                    <div className="logo-ring ring-three"></div>

                    <div className="logo-glow"></div>

                    <div className="logo-card">
                        <img
                            src={logo}
                            alt="Holy Cross Matriculation Higher Secondary School crest"
                            className="preloader-logo"
                        />
                    </div>

                    <div className="orbit-dot orbit-one"></div>
                    <div className="orbit-dot orbit-two"></div>
                </div>

                {/* School Information */}
                <div className="preloader-text">

                    <div className="eyebrow">
                        <span></span>
                        WELCOME
                        <span></span>
                    </div>

                    <h1 className="school-title">
                        Holy Cross
                        <strong>Matric. Hr. Sec. School</strong>
                    </h1>

                    <div className="title-divider">
                        <span className="divider-line"></span>
                        <span className="divider-diamond">◆</span>
                        <span className="divider-line"></span>
                    </div>

                    <p className="school-subtitle">
                        Somarasampettai <b>•</b> Tiruchirappalli
                    </p>
                </div>

                {/* Premium Loader */}
                <div className="loader-section">

                    <div className="loader-status">
                        <span>Preparing your experience</span>
                        <span className="loader-dots">
                            <i></i>
                            <i></i>
                            <i></i>
                        </span>
                    </div>

                    <div className="premium-loading-bar">
                        <div className="loading-bar-track">
                            <div className="loading-bar-progress">
                                <span></span>
                            </div>
                        </div>
                    </div>

                    <div className="loading-bottom">
                        <span>PLEASE WAIT</span>
                        <span className="loading-percentage">LOADING</span>
                    </div>

                </div>

            </div>

            <div className="preloader-bottom-line"></div>
        </div>
    );
}