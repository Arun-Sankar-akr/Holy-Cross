import React from "react";
import logo from "../assets/logo.png";
import "./Preloader.css";

export default function Preloader({ fadeOut }) {
    return (
        <div className={`preloader-overlay ${fadeOut ? "fade-out" : ""}`}>
            <div className="preloader-card">

                {/* Logo */}
                <div className="logo-wrapper">
                    <div className="logo-halo"></div>

                    <img
                        src={logo}
                        alt="Holy Cross Matriculation Higher Secondary School"
                        className="preloader-logo"
                    />
                </div>

                {/* School Name */}
                <div className="school-info">

                    <span className="welcome">
                        WELCOME
                    </span>

                    <h1>
                        Holy Cross
                    </h1>

                    <p>
                        Matric. Hr. Sec. School
                    </p>

                    <div className="location">
                        Somarasampettai
                        <span>•</span>
                        Tiruchirappalli
                    </div>

                </div>

                {/* Loader */}
                <div className="loader">

                    <div className="loader-track">
                        <div className="loader-progress"></div>
                    </div>

                    <div className="loader-text">
                        <span>Loading</span>

                        <div className="dots">
                            <i></i>
                            <i></i>
                            <i></i>
                        </div>
                    </div>

                </div>

            </div>

            {/* Small bottom accent */}
            <div className="bottom-mark">
                <span></span>
                <b></b>
                <span></span>
            </div>

        </div>
    );
}