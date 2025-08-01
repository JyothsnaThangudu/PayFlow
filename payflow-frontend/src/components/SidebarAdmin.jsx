import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaUserTie, FaUsers, FaCogs, FaChartBar, FaShieldAlt } from 'react-icons/fa';
import './SidebarAdmin.css';

const SidebarAdmin = () => {
    return (
        <div className="sidebar">
            <div className="logo-container">
                <div className="logo-icon">
                    <FaShieldAlt />
                </div>
                <h2 className="logo">PayFlow AI</h2>
                <div className="logo-subtitle">Admin Portal</div>
            </div>
            
            <div className="nav-section">
                <div className="nav-section-title">Main</div>
                <ul className="nav-list">
                    <li>
                        <NavLink to="/admin-dashboard" className={({ isActive }) => isActive ? 'nav-link active-link' : 'nav-link'} end>
                            <div className="nav-icon">
                                <FaTachometerAlt />
                            </div>
                            <span className="nav-text">Dashboard</span>
                            <div className="nav-indicator"></div>
                        </NavLink>
                    </li>
                </ul>
            </div>

            <div className="nav-section">
                <div className="nav-section-title">Management</div>
                <ul className="nav-list">
                    <li>
                        <NavLink to="/user-management" className={({ isActive }) => isActive ? 'nav-link active-link' : 'nav-link'} end>
                            <div className="nav-icon">
                                <FaUsers />
                            </div>
                            <span className="nav-text">User Management</span>
                            <div className="nav-indicator"></div>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/employee-overview" className={({ isActive }) => isActive ? 'nav-link active-link' : 'nav-link'} end>
                            <div className="nav-icon">
                                <FaUserTie />
                            </div>
                            <span className="nav-text">Employee Overview</span>
                            <div className="nav-indicator"></div>
                        </NavLink>
                    </li>
                </ul>
            </div>

            <div className="nav-section">
                <div className="nav-section-title">System</div>
                <ul className="nav-list">
                    <li>
                        <NavLink to="/admin-settings" className={({ isActive }) => isActive ? 'nav-link active-link' : 'nav-link'} end>
                            <div className="nav-icon">
                                <FaCogs />
                            </div>
                            <span className="nav-text">Settings</span>
                            <div className="nav-indicator"></div>
                        </NavLink>
                    </li>
                </ul>
            </div>

            <div className="sidebar-footer">
                <div className="admin-profile">
                    <div className="admin-avatar">
                        <FaShieldAlt />
                    </div>
                    <div className="admin-info">
                        <div className="admin-name">Administrator</div>
                        <div className="admin-status">Online</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SidebarAdmin;