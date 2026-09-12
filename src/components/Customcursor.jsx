import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

// Higher = snappier/faster catch-up, lower = laggier/smoother trail. 0-1 range.
const SPEED = 0.35;

const INTERACTIVE_SELECTOR =
    'a, button, select, summary, [role="button"], input[type="button"], ' +
    'input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"]';

export default function CustomCursor() {
    const cursorRef = useRef(null);
    const pos = useRef({ x: -100, y: -100 });
    const target = useRef({ x: -100, y: -100 });
    const rafId = useRef(null);

    const [isPointer, setIsPointer] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const isFinePointer = window.matchMedia('(pointer: fine)').matches;
        if (!isFinePointer) return undefined; // touch devices keep the native cursor

        setEnabled(true);
        document.documentElement.classList.add('custom-cursor-active');

        const handleMove = (e) => {
            target.current.x = e.clientX;
            target.current.y = e.clientY;

            setIsVisible(true);
            setIsPointer(!!e.target.closest(INTERACTIVE_SELECTOR));
        };

        const handleLeaveWindow = () => setIsVisible(false);
        const handleEnterWindow = () => setIsVisible(true);

        window.addEventListener('mousemove', handleMove, { passive: true });
        document.addEventListener('mouseleave', handleLeaveWindow);
        document.addEventListener('mouseenter', handleEnterWindow);

        const animate = () => {
            pos.current.x += (target.current.x - pos.current.x) * SPEED;
            pos.current.y += (target.current.y - pos.current.y) * SPEED;

            if (cursorRef.current) {
                cursorRef.current.style.transform =
                    `translate3d(${pos.current.x - 6}px, ${pos.current.y - 4}px, 0)`;
            }

            rafId.current = requestAnimationFrame(animate);
        };

        rafId.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseleave', handleLeaveWindow);
            document.removeEventListener('mouseenter', handleEnterWindow);
            cancelAnimationFrame(rafId.current);
            document.documentElement.classList.remove('custom-cursor-active');
        };
    }, []);

    if (!enabled) return null;

    return (
        <div
            ref={cursorRef}
            className={`custom-cursor${isPointer ? ' is-pointer' : ''}${isVisible ? ' is-visible' : ''}`}
            aria-hidden="true"
        >
            <svg viewBox="0 0 32 32" width="32" height="32">
                <defs>
                    <linearGradient id="customCursorGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={isPointer ? '#fbbf24' : '#3b82f6'} />
                        <stop offset="100%" stopColor={isPointer ? '#d97706' : '#0f172a'} />
                    </linearGradient>
                </defs>

                <path
                    d="M8 5 27 16 16.5 18.5 12.5 29Z"
                    fill="#0f172a"
                    opacity="0.25"
                />

                <path
                    d="M7 4 26 15 15.5 17.5 11.5 28Z"
                    fill="url(#customCursorGradient)"
                    stroke={isPointer ? '#0f172a' : '#ffffff'}
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                />

                <circle
                    cx={isPointer ? 8 : 24.5}
                    cy={isPointer ? 5 : 9}
                    r={isPointer ? 2.1 : 2.3}
                    fill={isPointer ? '#ffffff' : '#f59e0b'}
                    stroke={isPointer ? 'none' : '#ffffff'}
                    strokeWidth="0.8"
                />
            </svg>
        </div>
    );
}