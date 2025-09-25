import React, { useState } from 'react';
import "../App.css";
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const router = useNavigate();
    const [menuActive, setMenuActive] = useState(false);

    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>VoxBridge</h2>
                </div>
                <div className={`navlist ${menuActive ? 'active' : ''}`}>
                    <p onClick={() => {
                        router("/aljk23");
                        setMenuActive(false);
                    }}>Join as Guest</p>
                    <p onClick={() => {
                        router("/auth");
                        setMenuActive(false);
                    }}>Register</p>
                    <div onClick={() => {
                        router("/auth");
                        setMenuActive(false);
                    }} role='button'>
                        <p>Login</p>
                    </div>
                </div>
                <div className="hamburger-menu" onClick={() => setMenuActive(!menuActive)}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div className="hero-content">
                    <h1>Bridging <span style={{ color: "#FF9839" }}>hearts</span>, not just connections.</h1>
                    <p>Experience crystal clear video calls that make distance disappear.</p>
                    <div role='button' className="cta-button">
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div className="hero-image">
                    <img src="/mobile.png" alt="VoxBridge video calling app" />
                </div>
            </div>
        </div>
    );
}