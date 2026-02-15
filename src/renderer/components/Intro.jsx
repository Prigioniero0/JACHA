import React, { useState } from 'react';
import './Intro.css';

const Intro = ({ onEnter }) => {
    const [isOpen, setIsOpen] = useState(false);
    const logoUrl = new URL('../assets/logo.png', import.meta.url).href;

    const handleClick = () => {
        setIsOpen(true);
        // Wait for animation (1.5s) to finish before unmounting
        setTimeout(() => {
            if (onEnter) onEnter();
        }, 1500);
    };

    return (
        <div className={`intro-container ${isOpen ? 'open' : 'closed'}`}>
            <div className="door-left"></div>
            <div className="door-right"></div>
            <div className="door-gap"></div>

            <div className="intro-icon-container" onClick={handleClick}>
                <img src={logoUrl} alt="Enter System" className="intro-icon" />
            </div>
        </div>
    );
};

export default Intro;
