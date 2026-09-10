import React, { useEffect, useState } from "react";
import "./Preload.css";

// duration: total time the preloader stays fully visible + fading, in ms (3000-5000 recommended)
// onComplete: called once the fade-out transition has finished, so the parent can unmount this component
export default function Preload({ fadeOut, duration = 4000, onComplete }) {
    const [internalFadeOut, setInternalFadeOut] = useState(false);
    const isControlled = fadeOut !== undefined;
    const shouldFadeOut = isControlled ? fadeOut : internalFadeOut;
    const FADE_MS = 800; // keep in sync with .preloader-overlay transition duration

    useEffect(() => {
        if (isControlled) return; // parent is driving fadeOut directly, don't self-time

        const fadeTimer = setTimeout(() => setInternalFadeOut(true), Math.max(duration - FADE_MS, 0));
        return () => clearTimeout(fadeTimer);
    }, [isControlled, duration]);

    useEffect(() => {
        if (!shouldFadeOut || !onComplete) return;
        const doneTimer = setTimeout(onComplete, FADE_MS);
        return () => clearTimeout(doneTimer);
    }, [shouldFadeOut, onComplete]);

    return (
        <div className={`preloader-overlay ${shouldFadeOut ? "fade-out" : ""}`}>
            <div className="preloader-card">

                {/* School Wordmark */}
                <div className="school-info">
                    <h1>
                        <span className="base-text">Holy Cross</span>
                        <span className="glow-text">Holy Cross</span>
                        <span className="sweep-text">Holy Cross</span>
                    </h1>
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
        </div>
    );
}