import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import PopupMessage from '../components/PopupMessage';

const UnifiedLogin = () => {
    const [emailOrId, setEmailOrId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [popup, setPopup] = useState({ show: false, title: '', message: '', type: 'success' });

    // Clear localStorage on login page load to remove any previous role
    React.useEffect(() => {
        localStorage.removeItem('role');
        localStorage.removeItem('authToken');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        localStorage.removeItem('userId');
        localStorage.removeItem('managerId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('employeeId');
    }, []);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        // Admin shortcut login (frontend-only)
        if (emailOrId === 'admin' && password === 'admin123') {
            localStorage.setItem('role', 'ADMIN');
            localStorage.setItem('authToken', 'static-admin-token'); // if needed
            setPopup({ show: true, title: 'Login Successful', message: 'Welcome Admin!', type: 'success' });
            setTimeout(() => {
                setPopup({ ...popup, show: false });
                navigate('/admin-dashboard');
            }, 1200);
            return;
        }

        // Optional: Map employee ID to email
        const employeeIdToEmail = {
            "E001": "john@example.com",
            "E002": "sarah@example.com"
            // add as needed
        };

        let finalEmail = emailOrId;
        if (employeeIdToEmail[emailOrId]) {
            finalEmail = employeeIdToEmail[emailOrId];
        }

        try {
            const res = await axios.post("http://localhost:8080/api/login", {
                username: finalEmail,
                password: password,
            });
            const { token, role, firstLogin, name, id, managerId } = res.data;
            localStorage.setItem("authToken", token);
            localStorage.setItem("role", role);
            localStorage.setItem("email", finalEmail);
            localStorage.setItem("name", name || "User");
            localStorage.setItem("userId", id); // Store user ID
            // Store managerId for manager dashboard/leave requests
            if (role === "MANAGER") {
                if (managerId && managerId !== "null") {
                    localStorage.setItem("managerId", managerId);
                } else if (id && id !== "null") {
                    localStorage.setItem("managerId", id);
                }
            }
            // Store userEmail for employee dashboard fetch
            if (role === "EMPLOYEE") {
                localStorage.setItem("userEmail", finalEmail);
                
                // Also fetch and store employeeId for the employee
                try {
                    const employeeRes = await axios.get(`http://localhost:8080/api/employee?email=${finalEmail}`);
                    if (employeeRes.data && employeeRes.data.id) {
                        localStorage.setItem("employeeId", employeeRes.data.id);
                        console.log('Stored employeeId:', employeeRes.data.id);
                    }
                } catch (empError) {
                    console.error('Error fetching employee details during login:', empError);
                }
            } else {
                localStorage.removeItem("userEmail");
                localStorage.removeItem("employeeId");
            }

            setPopup({ show: true, title: 'Login Successful', message: `Welcome ${res.data.name || role}!`, type: 'success' });
            setTimeout(() => {
                setPopup({ ...popup, show: false });
                if (firstLogin) {
                    navigate("/reset-password");
                } else {
                    if (role === "HR") navigate("/hr-dashboard");
                    else if (role === "MANAGER") navigate("/manager-dashboard");
                    else if (role === "EMPLOYEE") navigate("/employee-dashboard");
                    else navigate("/");
                }
            }, 1200);
        } catch (err) {
            setPopup({ show: true, title: 'Login Failed', message: 'Invalid credentials. Please try again.', type: 'error' });
        }
    };

    return (
        <div className="login-container">
            <h2>PayFlow AI - Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Email"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    required
                    className="login-input"
                />
                <div className="login-password-wrapper">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="login-input"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="login-password-eye"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={0}
                    >
                        {showPassword ? <FaEye style={{ color: '#6366f1' }} /> : <FaEyeSlash style={{ color: '#6366f1' }} />}
                    </button>
                </div>
                {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Login</button>
            </form>
            {popup.show && (
                <PopupMessage title={popup.title} message={popup.message} type={popup.type} onClose={() => setPopup({ ...popup, show: false })} />
            )}
        </div>
    );
};

export default UnifiedLogin;





