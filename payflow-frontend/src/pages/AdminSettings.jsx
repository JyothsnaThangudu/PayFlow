import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/SidebarAdmin';
import { 
    FaSave, 
    FaUndo, 
    FaUser, 
    FaBell, 
    FaLock, 
    FaPalette, 
    FaDatabase, 
    FaEnvelope, 
    FaGlobe,
    FaCog,
    FaCheck,
    FaTimes,
    FaUserPlus,
    FaUserCheck
} from 'react-icons/fa';
import './AdminSettings.css';

const AdminSettings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');
    const [saveStatus, setSaveStatus] = useState('');
    const [settings, setSettings] = useState({
        // General Settings
        companyName: 'PayFlow AI',
        companyEmail: 'admin@payflow.ai',
        timezone: 'UTC',
        dateFormat: 'DD/MM/YYYY',
        language: 'en',
        
        // Notification Settings
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        weeklyReports: true,
        monthlyReports: true,
        
        // Security Settings
        passwordMinLength: 8,
        requireSpecialChars: true,
        sessionTimeout: 30,
        twoFactorAuth: false,
        loginAttempts: 5,
        
        // System Settings
        autoBackup: true,
        backupFrequency: 'daily',
        maintenanceMode: false,
        debugMode: false,
        logLevel: 'info',
        
        // Email Settings
        smtpServer: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        smtpSecure: true,
        
        // UI Settings
        theme: 'light',
        primaryColor: '#4f46e5',
        sidebarCollapsed: false,
        dashboardLayout: 'default'
    });

    useEffect(() => {
        // Load settings from localStorage or API
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
            setSettings({ ...settings, ...JSON.parse(savedSettings) });
        }
    }, []);

    const handleSettingChange = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = () => {
        try {
            localStorage.setItem('adminSettings', JSON.stringify(settings));
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 3000);
        }
    };

    const handleReset = () => {
        const defaultSettings = {
            companyName: 'PayFlow AI',
            companyEmail: 'admin@payflow.ai',
            timezone: 'UTC',
            dateFormat: 'DD/MM/YYYY',
            language: 'en',
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            weeklyReports: true,
            monthlyReports: true,
            passwordMinLength: 8,
            requireSpecialChars: true,
            sessionTimeout: 30,
            twoFactorAuth: false,
            loginAttempts: 5,
            autoBackup: true,
            backupFrequency: 'daily',
            maintenanceMode: false,
            debugMode: false,
            logLevel: 'info',
            smtpServer: 'smtp.gmail.com',
            smtpPort: 587,
            smtpUsername: '',
            smtpPassword: '',
            smtpSecure: true,
            theme: 'light',
            primaryColor: '#4f46e5',
            sidebarCollapsed: false,
            dashboardLayout: 'default'
        };
        setSettings(defaultSettings);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: FaCog },
        { id: 'notifications', label: 'Notifications', icon: FaBell },
        { id: 'security', label: 'Security', icon: FaLock },
        { id: 'system', label: 'System', icon: FaDatabase },
        { id: 'email', label: 'Email', icon: FaEnvelope },
        { id: 'appearance', label: 'Appearance', icon: FaPalette }
    ];

    const renderGeneralSettings = () => (
        <div className="settings-section">
            <h3 className="settings-section-title">
                <FaGlobe />
                General Settings
            </h3>
            
            {/* Quick Actions Panel */}
            <div className="quick-actions-panel">
                <h4>Quick Actions</h4>
                <div className="quick-actions-grid">
                    <button 
                        className="quick-action-card"
                        onClick={() => navigate('/user-management')}
                    >
                        <FaUser className="quick-action-icon" />
                        <div className="quick-action-content">
                            <span className="quick-action-title">User Management</span>
                            <span className="quick-action-desc">Manage users, roles & permissions</span>
                        </div>
                    </button>
                    <button 
                        className="quick-action-card"
                        onClick={() => navigate('/create-user')}
                    >
                        <FaUserPlus className="quick-action-icon" />
                        <div className="quick-action-content">
                            <span className="quick-action-title">Add New User</span>
                            <span className="quick-action-desc">Create new user accounts</span>
                        </div>
                    </button>
                    <button 
                        className="quick-action-card"
                        onClick={() => navigate('/employee-overview')}
                    >
                        <FaUserCheck className="quick-action-icon" />
                        <div className="quick-action-content">
                            <span className="quick-action-title">Employee Overview</span>
                            <span className="quick-action-desc">View all employee data</span>
                        </div>
                    </button>
                </div>
            </div>

            <div className="settings-grid">
                <div className="setting-item">
                    <label>Company Name</label>
                    <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                        className="setting-input"
                    />
                </div>
                <div className="setting-item">
                    <label>Company Email</label>
                    <input
                        type="email"
                        value={settings.companyEmail}
                        onChange={(e) => handleSettingChange('general', 'companyEmail', e.target.value)}
                        className="setting-input"
                    />
                </div>
                <div className="setting-item">
                    <label>Timezone</label>
                    <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                        className="setting-select"
                    >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="CST">Central Time</option>
                        <option value="IST">India Standard Time</option>
                    </select>
                </div>
                <div className="setting-item">
                    <label>Date Format</label>
                    <select
                        value={settings.dateFormat}
                        onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                        className="setting-select"
                    >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                </div>
                <div className="setting-item">
                    <label>Language</label>
                    <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                        className="setting-select"
                    >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderNotificationSettings = () => (
        <div className="settings-section">
            <h3 className="settings-section-title">
                <FaBell />
                Notification Preferences
            </h3>
            <div className="settings-grid">
                <div className="setting-toggle">
                    <label>Email Notifications</label>
                    <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
                <div className="setting-toggle">
                    <label>SMS Notifications</label>
                    <input
                        type="checkbox"
                        checked={settings.smsNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
                <div className="setting-toggle">
                    <label>Push Notifications</label>
                    <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
                <div className="setting-toggle">
                    <label>Weekly Reports</label>
                    <input
                        type="checkbox"
                        checked={settings.weeklyReports}
                        onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
                <div className="setting-toggle">
                    <label>Monthly Reports</label>
                    <input
                        type="checkbox"
                        checked={settings.monthlyReports}
                        onChange={(e) => handleSettingChange('notifications', 'monthlyReports', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
            </div>
        </div>
    );

    const renderSecuritySettings = () => (
        <div className="settings-section">
            <h3 className="settings-section-title">
                <FaLock />
                Security Configuration
            </h3>
            <div className="settings-grid">
                <div className="setting-item">
                    <label>Minimum Password Length</label>
                    <input
                        type="number"
                        min="6"
                        max="20"
                        value={settings.passwordMinLength}
                        onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                        className="setting-input"
                    />
                </div>
                <div className="setting-toggle">
                    <label>Require Special Characters</label>
                    <input
                        type="checkbox"
                        checked={settings.requireSpecialChars}
                        onChange={(e) => handleSettingChange('security', 'requireSpecialChars', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
                <div className="setting-item">
                    <label>Session Timeout (minutes)</label>
                    <input
                        type="number"
                        min="5"
                        max="480"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="setting-input"
                    />
                </div>
                <div className="setting-toggle">
                    <label>Two-Factor Authentication</label>
                    <input
                        type="checkbox"
                        checked={settings.twoFactorAuth}
                        onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
                <div className="setting-item">
                    <label>Max Login Attempts</label>
                    <input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.loginAttempts}
                        onChange={(e) => handleSettingChange('security', 'loginAttempts', parseInt(e.target.value))}
                        className="setting-input"
                    />
                </div>
            </div>
        </div>
    );

    const renderSystemSettings = () => (
        <div className="settings-section">
            <h3 className="settings-section-title">
                <FaDatabase />
                System Configuration
            </h3>
            <div className="settings-grid">
                <div className="setting-toggle">
                    <label>Auto Backup</label>
                    <input
                        type="checkbox"
                        checked={settings.autoBackup}
                        onChange={(e) => handleSettingChange('system', 'autoBackup', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
                <div className="setting-item">
                    <label>Backup Frequency</label>
                    <select
                        value={settings.backupFrequency}
                        onChange={(e) => handleSettingChange('system', 'backupFrequency', e.target.value)}
                        className="setting-select"
                        disabled={!settings.autoBackup}
                    >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div className="setting-toggle">
                    <label>Maintenance Mode</label>
                    <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => handleSettingChange('system', 'maintenanceMode', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
                <div className="setting-toggle">
                    <label>Debug Mode</label>
                    <input
                        type="checkbox"
                        checked={settings.debugMode}
                        onChange={(e) => handleSettingChange('system', 'debugMode', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
                <div className="setting-item">
                    <label>Log Level</label>
                    <select
                        value={settings.logLevel}
                        onChange={(e) => handleSettingChange('system', 'logLevel', e.target.value)}
                        className="setting-select"
                    >
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderEmailSettings = () => (
        <div className="settings-section">
            <h3 className="settings-section-title">
                <FaEnvelope />
                Email Configuration
            </h3>
            <div className="settings-grid">
                <div className="setting-item">
                    <label>SMTP Server</label>
                    <input
                        type="text"
                        value={settings.smtpServer}
                        onChange={(e) => handleSettingChange('email', 'smtpServer', e.target.value)}
                        className="setting-input"
                    />
                </div>
                <div className="setting-item">
                    <label>SMTP Port</label>
                    <input
                        type="number"
                        value={settings.smtpPort}
                        onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
                        className="setting-input"
                    />
                </div>
                <div className="setting-item">
                    <label>SMTP Username</label>
                    <input
                        type="text"
                        value={settings.smtpUsername}
                        onChange={(e) => handleSettingChange('email', 'smtpUsername', e.target.value)}
                        className="setting-input"
                    />
                </div>
                <div className="setting-item">
                    <label>SMTP Password</label>
                    <input
                        type="password"
                        value={settings.smtpPassword}
                        onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                        className="setting-input"
                    />
                </div>
                <div className="setting-toggle">
                    <label>Use Secure Connection (TLS)</label>
                    <input
                        type="checkbox"
                        checked={settings.smtpSecure}
                        onChange={(e) => handleSettingChange('email', 'smtpSecure', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
            </div>
        </div>
    );

    const renderAppearanceSettings = () => (
        <div className="settings-section">
            <h3 className="settings-section-title">
                <FaPalette />
                Appearance & UI
            </h3>
            <div className="settings-grid">
                <div className="setting-item">
                    <label>Theme</label>
                    <select
                        value={settings.theme}
                        onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                        className="setting-select"
                    >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                    </select>
                </div>
                <div className="setting-item">
                    <label>Primary Color</label>
                    <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                        className="setting-color"
                    />
                </div>
                <div className="setting-toggle">
                    <label>Collapsed Sidebar by Default</label>
                    <input
                        type="checkbox"
                        checked={settings.sidebarCollapsed}
                        onChange={(e) => handleSettingChange('appearance', 'sidebarCollapsed', e.target.checked)}
                        className="setting-checkbox"
                    />
                </div>
                <div className="setting-item">
                    <label>Dashboard Layout</label>
                    <select
                        value={settings.dashboardLayout}
                        onChange={(e) => handleSettingChange('appearance', 'dashboardLayout', e.target.value)}
                        className="setting-select"
                    >
                        <option value="default">Default</option>
                        <option value="compact">Compact</option>
                        <option value="expanded">Expanded</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return renderGeneralSettings();
            case 'notifications':
                return renderNotificationSettings();
            case 'security':
                return renderSecuritySettings();
            case 'system':
                return renderSystemSettings();
            case 'email':
                return renderEmailSettings();
            case 'appearance':
                return renderAppearanceSettings();
            default:
                return renderGeneralSettings();
        }
    };

    return (
        <div className="admin-dashboard-layout" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', fontFamily: 'Segoe UI, Roboto, Arial, sans-serif', color: '#222' }}>
            <Sidebar />
            <main className="admin-dashboard-main" style={{ padding: '32px 36px 36px 36px', maxWidth: 1400, margin: '0 auto' }}>
                {/* Header */}
                <div className="settings-header">
                    <div className="settings-header-content">
                        <div className="settings-title-section">
                            <h1 className="settings-title">
                                <FaCog />
                                Admin Settings
                            </h1>
                            <p className="settings-subtitle">Configure system preferences and application settings</p>
                        </div>
                        <div className="settings-actions">
                            <button 
                                className="settings-btn reset-btn" 
                                onClick={handleReset}
                                title="Reset to defaults"
                            >
                                <FaUndo />
                                Reset
                            </button>
                            <button 
                                className="settings-btn save-btn" 
                                onClick={handleSave}
                                title="Save changes"
                            >
                                <FaSave />
                                Save Changes
                            </button>
                        </div>
                    </div>
                    {saveStatus && (
                        <div className={`save-status ${saveStatus}`}>
                            {saveStatus === 'success' ? (
                                <>
                                    <FaCheck />
                                    Settings saved successfully!
                                </>
                            ) : (
                                <>
                                    <FaTimes />
                                    Failed to save settings. Please try again.
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Settings Content */}
                <div className="settings-container">
                    {/* Sidebar Tabs */}
                    <div className="settings-sidebar">
                        <div className="settings-tabs">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="settings-content">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminSettings;
