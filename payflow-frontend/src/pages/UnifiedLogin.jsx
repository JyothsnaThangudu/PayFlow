import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import Swal from 'sweetalert2';

const UnifiedLogin = () => {
    const [emailOrId, setEmailOrId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        // Admin shortcut login (frontend-only)
        if (emailOrId === 'admin' && password === 'admin123') {
            localStorage.setItem('role', 'ADMIN');
            localStorage.setItem('authToken', 'static-admin-token'); // if needed
            Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: 'Welcome Admin!',
                timer: 2000,
                showConfirmButton: false,
            });
            setTimeout(() => {
                navigate('/admin-dashboard');
            }, 2000);
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

            const { token, role, firstLogin, name } = res.data;

            localStorage.setItem("authToken", token);
            localStorage.setItem("role", role);
            localStorage.setItem("email", finalEmail);
            localStorage.setItem("name", name || "User");

            Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: `Welcome ${res.data.name || role}!`,
                timer: 2000,
                showConfirmButton: false,
            });

            setTimeout(() => {
                if (firstLogin) {
                    navigate("/reset-password");
                } else {
                    if (role === "HR") navigate("/hr-dashboard");
                    else if (role === "MANAGER") navigate("/manager-dashboard");
                    else if (role === "EMPLOYEE") navigate("/employee-dashboard");
                    else navigate("/");
                }
            }, 2000);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: 'Invalid credentials. Please try again.',
            });
        }
    };

    return (
        <div className="login-container">
            <h2>PayFlow AI - Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Email / Employee ID"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    required
                />
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <label style={{ display: "block", marginTop: "1px", fontSize: "14px", marginRight: "280px" }}>
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={() => setShowPassword(!showPassword)}
                        style={{ marginRight: "5px" }}
                    />
                    Show Password
                </label>

                {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default UnifiedLogin;





// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import './Login.css';
// import Swal from 'sweetalert2';
//
//
// const UnifiedLogin = () => {
//     const [emailOrId, setEmailOrId] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const navigate = useNavigate();
//
//     const handleLogin = async (e) => {
//         e.preventDefault();
//         setError("");
//
//         // Admin shortcut login (frontend-only)
//         if (emailOrId === 'admin@payflow.com' && password === 'admin123') {
//             localStorage.setItem('role', 'ADMIN');
//             localStorage.setItem('authToken', 'static-admin-token'); // if needed
//             Swal.fire({
//                 icon: 'success',
//                 title: 'Login Successful',
//                 text: 'Welcome Admin!',
//                 timer: 2000,
//                 showConfirmButton: false,
//             });
//
//             navigate('/admin-dashboard');
//             return;
//         }
//
//         // Optional: Map employee ID to email
//         const employeeIdToEmail = {
//             "E001": "john@example.com",
//             "E002": "sarah@example.com"
//             // add as needed
//         };
//
//         let finalEmail = emailOrId;
//         if (employeeIdToEmail[emailOrId]) {
//             finalEmail = employeeIdToEmail[emailOrId];
//         }
//
//         try {
//             const res = await axios.post("http://localhost:8080/api/login", {
//                 username: finalEmail,
//                 password: password,
//             });
//
//             const { token, role, firstLogin } = res.data;
//
//             localStorage.setItem("authToken", token);
//             localStorage.setItem("role", role);
//             localStorage.setItem("email", finalEmail);
//
//             if (firstLogin) {
//                 navigate("/reset-password");
//             } else {
//                 if (role === "HR") navigate("/hr-dashboard");
//                 else if (role === "MANAGER") navigate("/manager-dashboard");
//                 else if (role === "EMPLOYEE") navigate("/employee-dashboard");
//                 else navigate("/");
//             }
//         } catch (err) {
//             setError("Invalid credentials. Please try again.");
//         }
//     };
//
//
//
//     return (
//         <div className="login-container">
//             <h2>PayFlow AI - Login</h2>
//             <form onSubmit={handleLogin}>
//                 <input
//                     type="text"
//                     placeholder="Email / Employee ID"
//                     value={emailOrId}
//                     onChange={(e) => setEmailOrId(e.target.value)}
//                     required
//                 />
//                 <input
//                     type="password"
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                 />
//                 {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
//                 <button type="submit">Login</button>
//             </form>
//         </div>
//     );
// };
//
// export default UnifiedLogin;
