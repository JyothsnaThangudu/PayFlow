import React, { useState, useEffect } from 'react';
import './Header.css';
import { FaBell, FaEnvelope } from 'react-icons/fa';

export default function Header() {
    const [hrName, setHrName] = useState("");

    useEffect(() => {
        const storedName = localStorage.getItem("name");
        if (storedName) {
            setHrName(storedName.toUpperCase());
        }
    }, []);

    return (
        <div className="header-container">
            {/* Search bar, bell icon, mail icon, profile icon, and username removed */}
        </div>
    );
}
