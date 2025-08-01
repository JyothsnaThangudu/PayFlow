
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const email = localStorage.getItem('email');

    const handleReset = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const res = await fetch('http://localhost:8080/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + email, // required by backend
                },
                body: JSON.stringify({ newPassword })
            });

            if (!res.ok) {
                const errText = await res.text(); // handle HTML errors
                throw new Error(errText);
            }

            const data = await res.json();
            alert('Password updated successfully');

            navigate('/');
        } catch (error) {
            console.error('Reset error:', error.message);
            alert('Reset failed: ' + error.message);
        }
    };

    return (
        <div className="reset-container">
            <h2>Reset Password</h2>
            <form onSubmit={handleReset}>
                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit">Reset Password</button>
            </form>
        </div>
    );
};

export default ResetPassword;
