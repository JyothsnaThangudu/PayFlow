
import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [role, setRole] = useState(null);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const savedRole = localStorage.getItem('role');
        setRole(savedRole);
    }, [location.pathname]); // update role on route change

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setRole(null);
        navigate('/');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const formatDateTime = (date) => {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        return date.toLocaleDateString('en-US', options);
    };

    const isHomeOrLogin = location.pathname === '/' || location.pathname === '/login';

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="brand-section">
                    <div className="brand-icon">💼</div>
                    <span className="brand-text">PayFlow AI</span>
                </div>
            </div>

            <div className="navbar-center">
                <div className="datetime-display">
                    <div className="datetime-icon">🕒</div>
                    <span className="datetime-text">{formatDateTime(currentDateTime)}</span>
                </div>
            </div>

            <div className="navbar-right">
                {/* Only show role badge if not on home or login page */}
                {role && !isHomeOrLogin && (
                    <div className="user-info">
                        <div className="role-badge">
                            <span className="role-icon">👤</span>
                            <span className="role-text">{role}</span>
                        </div>
                    </div>
                )}
                {isHomeOrLogin ? (
                    <button className="login-btn" onClick={handleLogin}>
                        <span className="btn-icon">🔑</span>
                        Login
                    </button>
                ) : (
                    <button className="logout-btn" onClick={handleLogout}>
                        <span className="btn-icon">🚪</span>
                        Logout
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;



