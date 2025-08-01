import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBolt, FaUser, FaSignOutAlt, FaSignInAlt, FaChevronDown, FaClock } from 'react-icons/fa';

const Navbar = () => {
    const [role, setRole] = useState(null);
    const [userProfile, setUserProfile] = useState({ name: '', avatar: null });
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const savedRole = localStorage.getItem('role');
        const username = localStorage.getItem('username');
        setRole(savedRole);
        if (username) {
            setUserProfile({ name: username, avatar: null });
        }
    }, []);

    // Update date and time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDateTime = (date) => {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    };

    const handleLogout = () => {
        localStorage.clear();
        setRole(null);
        setUserProfile({ name: '', avatar: null });
        navigate('/');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const isHomeOrLogin = location.pathname === '/' || location.pathname === '/login';
    
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    <div className="brand-container">
                        <div className="brand-icon">
                            <FaBolt />
                        </div>
                        <div className="brand-text">
                            <span className="brand-name">PayFlow AI</span>
                            <span className="brand-tagline">Smart HR Management</span>
                        </div>
                    </div>
                </div>

                <div className="navbar-right">
                    {isHomeOrLogin ? (
                        <div className="navbar-info">
                            <div className="datetime-display">
                                <FaClock className="clock-icon" />
                                <span className="datetime-text">{formatDateTime(currentDateTime)}</span>
                            </div>
                            <button className="nav-button login-button" onClick={handleLogin}>
                                <FaSignInAlt />
                                <span>Login</span>
                            </button>
                        </div>
                    ) : (
                        <div className="user-section">
                            <div className="datetime-display">
                                <FaClock className="clock-icon" />
                                <span className="datetime-text">{formatDateTime(currentDateTime)}</span>
                            </div>
                            {userProfile.name && (
                                <div className="user-profile">
                                    <div className="user-avatar">
                                        <FaUser />
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">{userProfile.name}</span>
                                        <span className="user-role">{role}</span>
                                    </div>
                                    <FaChevronDown className="dropdown-arrow" />
                                </div>
                            )}
                            <button className="nav-button logout-button" onClick={handleLogout}>
                                <FaSignOutAlt />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;




//
// import React, { useState, useEffect } from 'react';
// import './Navbar.css';
// import { useNavigate } from 'react-router-dom';
//
// const Navbar = () => {
//     const [dropdownOpen, setDropdownOpen] = useState(false);
//     const [role, setRole] = useState(null);
//     const navigate = useNavigate();
//
//     useEffect(() => {
//         const savedRole = localStorage.getItem('role');
//         setRole(savedRole);
//     }, []);
//
//     const handleLoginAs = (selectedRole) => {
//         navigate(`/login/${selectedRole.toLowerCase()}`);
//         setDropdownOpen(false);
//     };
//
//     const handleLogout = () => {
//         localStorage.clear();
//         setRole(null);
//         navigate('/');
//     };
//
//     return (
//         <nav className="navbar">
//             <div className="navbar-left">PayFlow AI</div>
//             <div className="navbar-right">
//                 {role ? (
//                     <button onClick={handleLogout}>Logout</button>
//                 ) : (
//                     <div className="dropdown">
//                         <button
//                             className="dropdown-toggle"
//                             onClick={() => setDropdownOpen(!dropdownOpen)}
//                         >
//                             Login As ▾
//                         </button>
//                         {dropdownOpen && (
//                             <div className="dropdown-menu">
//                                 <button onClick={() => handleLoginAs('Admin')}>Admin</button>
//                                 <button onClick={() => handleLoginAs('HR')}>HR</button>
//                                 <button onClick={() => handleLoginAs('Manager')}>Manager</button>
//                                 <button onClick={() => handleLoginAs('Employee')}>Employee</button>
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </nav>
//     );
// };
//
// export default Navbar;
