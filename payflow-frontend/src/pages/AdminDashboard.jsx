import React, { useEffect, useState } from 'react';
import PopupMessage from '../components/PopupMessage';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/SidebarAdmin';
import './AdminDashboard.css';
import { FaEdit, FaBell, FaUserPlus, FaFileExport, FaBullhorn, FaSync, FaUserCheck } from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activityPage, setActivityPage] = useState(1);
    const [activityPerPage] = useState(5);

    // Fetch users on component mount
    const [popup, setPopup] = useState({ show: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                
                // Fetch all data in parallel
                const [usersRes, employeesRes, leavesRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/admin/users'),
                    axios.get('http://localhost:8080/api/employee/all-employees'),
                    axios.get('http://localhost:8080/api/employee/leaves/all')
                ]);
                
                setUsers(usersRes.data);
                setEmployees(employeesRes.data);
                setLeaves(leavesRes.data);
                // Filter employees to only count those with corresponding users
                const validEmployees = employeesRes.data.filter(emp => 
                    usersRes.data.some(user => user.name === emp.fullName)
                );
                setEmployeeCount(validEmployees.length);
                
                console.log('Valid employees:', validEmployees.length);
                console.log('Users with EMPLOYEE role:', usersRes.data.filter(user => user.role?.toUpperCase() === 'EMPLOYEE').length);
                
                console.log('Users:', usersRes.data);
                console.log('Employees:', employeesRes.data);
                console.log('Leaves:', leavesRes.data);
                
            } catch (err) {
                console.error('Failed to fetch data', err);
                // Set fallback data
                setUsers([]);
                setEmployees([]);
                setLeaves([]);
                setEmployeeCount(0);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [usersRes, employeesRes, leavesRes] = await Promise.all([
                axios.get('http://localhost:8080/api/admin/users'),
                axios.get('http://localhost:8080/api/employee/all-employees'),
                axios.get('http://localhost:8080/api/employee/leaves/all')
            ]);
            
            setUsers(usersRes.data);
            setEmployees(employeesRes.data);
            setLeaves(leavesRes.data);
            // Filter employees to only count those with corresponding users
            const validEmployees = employeesRes.data.filter(emp => 
                usersRes.data.some(user => user.name === emp.fullName)
            );
            setEmployeeCount(validEmployees.length);
            
            console.log('Data refreshed - Valid employees:', validEmployees.length);
            console.log('Users with EMPLOYEE role:', usersRes.data.filter(user => user.role?.toUpperCase() === 'EMPLOYEE').length);
            
            console.log('Data refreshed successfully');
        } catch (err) {
            console.error('Failed to refresh data', err);
        } finally {
            setLoading(false);
        }
    };



    const handleDisableUser = async (username) => {
        const confirm = window.confirm("Are you sure you want to disable this user?");
        if (!confirm) return;

        try {
            const res = await axios.put(`http://localhost:8080/api/admin/disable-user`, {
                username: username,
            });

            setPopup({ show: true, title: 'User Disabled', message: res.data.message || 'User has been disabled.', type: 'success' });

            // Refresh user list
            const updatedUsers = await axios.get('http://localhost:8080/api/admin/users');
            setUsers(updatedUsers.data);
        } catch (err) {
            setPopup({ show: true, title: 'Failed', message: 'Failed to disable user', type: 'error' });
            console.error(err);
        }
    };

    // Pagination for Employee Overview
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const totalPages = Math.ceil(users.length / rowsPerPage);
    const paginatedUsers = users.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Filter employees to only show those with corresponding user accounts
    const validEmployees = employees.filter(emp => 
        users.some(user => user.name === emp.fullName)
    );

    // Dynamic data processing functions
    const getDynamicRoleDistribution = () => {
        if (!users.length) return [];
        
        const hrUsers = users.filter(user => user.role?.toUpperCase() === 'HR');
        const managerUsers = users.filter(user => user.role?.toUpperCase() === 'MANAGER');
        const employeeUsers = users.filter(user => user.role?.toUpperCase() === 'EMPLOYEE');
        
        return [
            { name: 'HR', value: hrUsers.length },
            { name: 'Manager', value: managerUsers.length },
            { name: 'Employee', value: employeeUsers.length },
        ].filter(item => item.value > 0); // Only show roles that exist
    };

    const getDynamicMonthlyJoining = () => {
        if (!validEmployees.length) return [];
        
        const currentYear = new Date().getFullYear();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize all months with 0
        const monthlyData = monthNames.map(month => ({ month, employees: 0 }));
        
        // Count employees by joining month
        validEmployees.forEach(emp => {
            if (emp.joiningDate) {
                try {
                    const joinDate = new Date(emp.joiningDate);
                    const joinYear = joinDate.getFullYear();
                    const joinMonth = joinDate.getMonth();
                    
                    // Only count current year joinings for relevance
                    if (joinYear === currentYear) {
                        monthlyData[joinMonth].employees++;
                    }
                } catch (err) {
                    console.warn('Invalid joining date format:', emp.joiningDate);
                }
            }
        });
        
        return monthlyData;
    };

    const getDynamicRecentActivity = () => {
        const activities = [];
        const maxActivities = 10;
        
        // Recent user additions
        const recentUsers = users
            .slice(-5) // Get last 5 users
            .reverse()
            .map(user => `${user.username} registered as ${user.role}`);
        
        // Recent leave applications
        const recentLeaves = leaves
            .filter(leave => leave.status === 'PENDING' || leave.status === 'ACCEPTED')
            .slice(-5)
            .reverse()
            .map(leave => {
                const emp = validEmployees.find(e => e.id === leave.employeeId);
                const empName = emp ? emp.fullName : `Employee #${leave.employeeId}`;
                return `${empName} ${leave.status === 'ACCEPTED' ? 'approved for' : 'applied for'} ${leave.type} leave`;
            });
        
        // Recent employee onboarding
        const recentEmployees = validEmployees
            .filter(emp => emp.joiningDate)
            .sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate))
            .slice(0, 3)
            .map(emp => `${emp.fullName} joined ${emp.department || 'the company'}`);
        
        // Combine all activities
        activities.push(...recentUsers);
        activities.push(...recentLeaves);
        activities.push(...recentEmployees);
        
        // If no real activities, show meaningful default messages
        if (activities.length === 0) {
            return [
                'System initialized successfully',
                'Admin dashboard loaded',
                'Ready for employee management',
                'Monitoring system activities'
            ];
        }
        
        return activities.slice(0, maxActivities);
    };

    const getSystemNotifications = () => {
        const notifications = [];
        
        // Warning alerts (medium priority)
        const inactiveUsers = users.filter(user => !user.active).length;
        if (inactiveUsers > 0) {
            notifications.push({
                id: 'inactive-users',
                type: 'warning',
                icon: '⚠️',
                title: 'Inactive User Accounts',
                message: `${inactiveUsers} user account${inactiveUsers > 1 ? 's are' : ' is'} currently disabled`,
                timestamp: '2 hours ago'
            });
        }
        
        // Data inconsistency alerts
        const orphanedEmployees = employees.length - validEmployees.length;
        if (orphanedEmployees > 0) {
            notifications.push({
                id: 'data-inconsistency',
                type: 'warning',
                icon: '⚠️',
                title: 'Data Inconsistency Detected',
                message: `${orphanedEmployees} employee record${orphanedEmployees > 1 ? 's' : ''} without corresponding user account${orphanedEmployees > 1 ? 's' : ''}`,
                timestamp: '1 hour ago'
            });
        }
        
        // Info alerts (low priority)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthJoinings = validEmployees.filter(emp => {
            if (!emp.joiningDate) return false;
            try {
                const joinDate = new Date(emp.joiningDate);
                return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
            } catch {
                return false;
            }
        }).length;
        
        if (thisMonthJoinings > 0) {
            notifications.push({
                id: 'new-joinings',
                type: 'info',
                icon: '🎉',
                title: 'New Team Members',
                message: `${thisMonthJoinings} new employee${thisMonthJoinings > 1 ? 's' : ''} joined this month`,
                timestamp: 'Today'
            });
        }
        
        // System health notifications
        const totalActiveUsers = users.filter(user => user.active).length;
        const systemHealth = totalActiveUsers > 0 ? 'Healthy' : 'Attention Required';
        
        if (systemHealth === 'Healthy' && notifications.length === 0) {
            notifications.push({
                id: 'system-healthy',
                type: 'success',
                icon: '✅',
                title: 'All Systems Operational',
                message: `${totalActiveUsers} active users, all systems running smoothly`,
                timestamp: 'Just now'
            });
        }
        
        return notifications;
    };

    // Process the data
    const rolePieData = getDynamicRoleDistribution();
    const barData = getDynamicMonthlyJoining();
    const recentActivity = getDynamicRecentActivity();
    const notifications = getSystemNotifications();

    // Pagination for Recent Activity
    const totalActivityPages = Math.ceil(recentActivity.length / activityPerPage);
    const paginatedActivity = recentActivity.slice(
        (activityPage - 1) * activityPerPage,
        activityPage * activityPerPage
    );

    // For summary cards
    const hrUsers = users.filter(user => user.role?.toUpperCase() === 'HR');
    const managerUsers = users.filter(user => user.role?.toUpperCase() === 'MANAGER');
    const employeeUsers = users.filter(user => user.role?.toUpperCase() === 'EMPLOYEE');
    
    // Calculate active/inactive employees based on validEmployees and their corresponding user status
    const activeEmployeeCount = validEmployees.filter(emp => {
        const correspondingUser = users.find(user => user.name === emp.fullName && user.role?.toUpperCase() === 'EMPLOYEE');
        return correspondingUser && correspondingUser.active;
    }).length;
    
    const inactiveEmployeeCount = validEmployees.filter(emp => {
        const correspondingUser = users.find(user => user.name === emp.fullName && user.role?.toUpperCase() === 'EMPLOYEE');
        return correspondingUser && !correspondingUser.active;
    }).length;
    
    const activeHRs = hrUsers.filter(user => user.active).length;
    const inactiveHRs = hrUsers.filter(user => !user.active).length;
    const activeManagers = managerUsers.filter(user => user.active).length;
    const inactiveManagers = managerUsers.filter(user => !user.active).length;

    const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

    // Show loading state
    if (loading) {
        return (
            <div className="admin-dashboard-layout" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', fontFamily: 'Segoe UI, Roboto, Arial, sans-serif', color: '#222' }}>
                <Sidebar />
                <main className="admin-dashboard-main" style={{ padding: '32px 36px 36px 36px', maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                            width: '60px', 
                            height: '60px', 
                            border: '4px solid #f1f5f9',
                            borderTop: '4px solid #4f46e5',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1rem'
                        }}></div>
                        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Loading dashboard data...</p>
                    </div>
                </main>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-layout" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', fontFamily: 'Segoe UI, Roboto, Arial, sans-serif', color: '#222' }}>
            {popup.show && (
                <PopupMessage title={popup.title} message={popup.message} type={popup.type} onClose={() => setPopup({ ...popup, show: false })} />
            )}
            <Sidebar />
            <main className="admin-dashboard-main" style={{ padding: '32px 36px 36px 36px', maxWidth: 1400, margin: '0 auto' }}>
                {/* Header with Notifications Bell */}
                <div className="admin-dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1.5px solid #e5e7eb', paddingBottom: 18 }}>
                    <h1 style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: '600', 
                        color: '#4f46e5',
                        margin: 0,
                        letterSpacing: '-0.025em'
                    }}>Welcome Admin 👋</h1>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                        {/* Quick Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginRight: 24 }}>
                                    <button className="quick-action-btn add-user-btn" title="Add User" onClick={() => navigate('/create-user')}>
                                        <FaUserPlus style={{ marginRight: 6 }} /> Add User
                                    </button>
                                    <button className="quick-action-btn export-btn" title="Export Data" onClick={() => alert('Exporting data...')}>
                                        <FaFileExport style={{ marginRight: 6 }} /> Export
                                    </button>
                                    <button className="quick-action-btn announce-btn" title="Send Announcement" onClick={() => alert('Announcement sent!')}>
                                        <FaBullhorn style={{ marginRight: 6 }} /> Announce
                                    </button>
                                    <button 
                                        className="quick-action-btn refresh-btn" 
                                        title="Refresh Data" 
                                        onClick={refreshData}
                                        disabled={loading}
                                    >
                                        <FaSync style={{ marginRight: 6, animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                                    </button>
                                </div>
                        {/* Notifications Bell - always at far right */}
                        <div className="notification-bell-wrapper" style={{ position: 'relative' }}>
                            <div className="notification-bell" tabIndex={0} style={{ position: 'relative', cursor: 'pointer', marginLeft: 24 }}>
                                <FaBell size={24} />
                                {notifications.length > 0 && (
                                    <span className="notification-badge" style={{
                                        position: 'absolute',
                                        top: -6,
                                        right: -6,
                                        background: '#e74c3c',
                                        color: '#fff',
                                        borderRadius: '50%',
                                        fontSize: 12,
                                        width: 20,
                                        height: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        zIndex: 2
                                    }}>{notifications.length}</span>
                                )}
                                <div className="notifications-dropdown" style={{
                                    display: 'none',
                                    position: 'absolute',
                                    top: 32,
                                    right: 0,
                                    minWidth: 320,
                                    maxWidth: 400,
                                    background: '#fff',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                                    borderRadius: 12,
                                    zIndex: 1000,
                                    padding: 0,
                                    border: '1px solid #e1e8ed',
                                    maxHeight: '70vh',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{
                                        padding: '16px 20px 12px 20px',
                                        borderBottom: '1px solid #f1f3f4',
                                        background: '#fafbfc'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#1a202c'
                                            }}>Notifications</h4>
                                            <span style={{
                                                fontSize: '12px',
                                                color: '#64748b',
                                                background: '#e2e8f0',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontWeight: '500'
                                            }}>{notifications.length}</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '8px 0' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{
                                                padding: '24px 20px',
                                                textAlign: 'center',
                                                color: '#64748b'
                                            }}>
                                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔔</div>
                                                <div>No new notifications</div>
                                            </div>
                                        ) : (
                                            notifications.map((notification, idx) => (
                                                <div key={notification.id} style={{
                                                    padding: '12px 20px',
                                                    borderBottom: idx < notifications.length - 1 ? '1px solid #f1f3f4' : 'none',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease',
                                                    position: 'relative'
                                                }} 
                                                className="enhanced-notification-item"
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                        <div style={{
                                                            fontSize: '16px',
                                                            lineHeight: '1',
                                                            marginTop: '2px',
                                                            minWidth: '20px'
                                                        }}>
                                                            {notification.icon}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                color: '#1a202c',
                                                                marginBottom: '4px',
                                                                lineHeight: '1.3'
                                                            }}>
                                                                {notification.title}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '13px',
                                                                color: '#4a5568',
                                                                lineHeight: '1.4',
                                                                marginBottom: '6px'
                                                            }}>
                                                                {notification.message}
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'flex-start',
                                                                marginTop: '8px'
                                                            }}>
                                                                <span style={{
                                                                    fontSize: '11px',
                                                                    color: '#64748b',
                                                                    fontWeight: '500'
                                                                }}>
                                                                    {notification.timestamp}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            width: '6px',
                                                            height: '6px',
                                                            borderRadius: '50%',
                                                            backgroundColor: notification.type === 'critical' ? '#dc2626' : 
                                                                           notification.type === 'warning' ? '#d97706' : 
                                                                           notification.type === 'success' ? '#16a34a' : '#2563eb',
                                                            marginTop: '8px',
                                                            flexShrink: 0
                                                        }}></div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {notifications.length > 0 && (
                                        <div style={{
                                            padding: '12px 20px',
                                            borderTop: '1px solid #f1f3f4',
                                            background: '#fafbfc'
                                        }}>
                                            <button style={{
                                                width: '100%',
                                                padding: '8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#4f46e5',
                                                background: 'none',
                                                border: '1px solid #e0e7ff',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#e0e7ff';
                                                e.target.style.borderColor = '#c7d2fe';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'transparent';
                                                e.target.style.borderColor = '#e0e7ff';
                                            }}>
                                                View All Notifications
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <style>{`
                .quick-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 10px 22px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.08rem;
                    font-weight: 600;
                    background: #f4f4f4;
                    color: #333;
                    cursor: pointer;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
                    transition: background 0.25s, color 0.2s, box-shadow 0.2s, transform 0.18s;
                }
                .quick-action-btn:hover {
                    background: #e0e7ff;
                    color: #1e40af;
                    box-shadow: 0 4px 16px rgba(30,64,175,0.10);
                    transform: translateY(-2px) scale(1.04);
                }
                .add-user-btn {
                    background: linear-gradient(90deg, #e0f7fa 60%, #b2ebf2 100%);
                    color: #00796b;
                }
                .add-user-btn:hover {
                    background: linear-gradient(90deg, #b2ebf2 60%, #e0f7fa 100%);
                    color: #004d40;
                }
                .export-btn {
                    background: linear-gradient(90deg, #fff3e0 60%, #ffe0b2 100%);
                    color: #ef6c00;
                }
                .export-btn:hover {
                    background: linear-gradient(90deg, #ffe0b2 60%, #fff3e0 100%);
                    color: #e65100;
                }
                .announce-btn {
                    background: linear-gradient(90deg, #fce4ec 60%, #f8bbd0 100%);
                    color: #ad1457;
                }
                .announce-btn:hover {
                    background: linear-gradient(90deg, #f8bbd0 60%, #fce4ec 100%);
                    color: #880e4f;
                }
                .refresh-btn {
                    background: linear-gradient(90deg, #f3e5f5 60%, #e1bee7 100%);
                    color: #7b1fa2;
                }
                .refresh-btn:hover:not(:disabled) {
                    background: linear-gradient(90deg, #e1bee7 60%, #f3e5f5 100%);
                    color: #4a148c;
                }
                .refresh-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                }
                .admin-card-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 28px;
                    margin: 36px 0 32px 0;
                }
                .admin-card {
                    background: #fff;
                    border-radius: 14px;
                    box-shadow: 0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04);
                    padding: 28px 24px 22px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    transition: box-shadow 0.2s, transform 0.18s;
                }
                .admin-card:hover {
                    box-shadow: 0 8px 32px rgba(30,64,175,0.13), 0 2px 8px rgba(0,0,0,0.06);
                    transform: translateY(-2px) scale(1.02);
                }
                .highlight-card {
                    border-left: 6px solid #6366f1;
                }
                .info-card {
                    border-left: 6px solid #06b6d4;
                }
                .admin-section-title {
                    font-size: 1.12rem;
                    font-weight: 700;
                    color: #6366f1;
                    margin-bottom: 8px;
                }
                .admin-count {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #22223b;
                    margin-bottom: 8px;
                }
                .stats {
                    font-size: 1rem;
                    color: #64748b;
                    display: flex;
                    gap: 18px;
                }
                .dashboard-charts-row {
                    display: flex;
                    gap: 32px;
                    margin-bottom: 36px;
                    flex-wrap: wrap;
                }
                .dashboard-chart-card {
                    background: #fff;
                    border-radius: 14px;
                    box-shadow: 0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04);
                    padding: 24px 18px 18px 18px;
                    flex: 1 1 340px;
                    min-width: 320px;
                    max-width: 480px;
                    margin-bottom: 12px;
                }
                .dashboard-activity-feed {
                    background: #fff;
                    border-radius: 14px;
                    box-shadow: 0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04);
                    padding: 24px 18px 18px 18px;
                    margin-top: 18px;
                }
                .activity-list {
                    margin: 0;
                    padding: 0 0 0 18px;
                    font-size: 1.04rem;
                }
                .activity-list li {
                    margin-bottom: 8px;
                }
                .notification-bell-wrapper {
                    position: relative;
                }
                .notification-bell:hover .notifications-dropdown,
                .notification-bell:focus .notifications-dropdown {
                    display: block !important;
                }
                .notifications-dropdown {
                    display: none;
                    position: absolute;
                    top: 32px;
                    right: 0;
                    min-width: 240px;
                    background: #fff;
                    box-shadow: 0 4px 24px rgba(30,64,175,0.13), 0 2px 8px rgba(0,0,0,0.06);
                    border-radius: 12px;
                    z-index: 10;
                    padding: 12px 8px 8px 8px;
                    font-size: 1rem;
                }
                .notification-item {
                    padding: 8px 10px;
                    border-radius: 6px;
                    margin-bottom: 4px;
                    transition: background 0.18s;
                }
                .notification-item:hover {
                    background: #e0e7ff;
                }
                .notification-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #e74c3c;
                    color: #fff;
                    border-radius: 50%;
                    font-size: 12px;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    z-index: 2;
                }
                `}</style>

                {/* Enhanced Summary Cards */}
                <div className="enhanced-summary-grid">
                    <div className="enhanced-card primary-card">
                        <div className="card-icon hr-icon">
                            <FaUserPlus />
                        </div>
                        <div className="card-content">
                            <h3 className="card-title hr-title">HR Personnel</h3>
                            <div className="card-number">{hrUsers.length}</div>
                            <div className="card-stats">
                                <span className="stat-item active">
                                    <span className="stat-dot active"></span>
                                    Active: {activeHRs}
                                </span>
                                <span className="stat-item inactive">
                                    <span className="stat-dot inactive"></span>
                                    Inactive: {inactiveHRs}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="enhanced-card secondary-card">
                        <div className="card-icon manager-icon">
                            <FaUserPlus />
                        </div>
                        <div className="card-content">
                            <h3 className="card-title manager-title">Managers</h3>
                            <div className="card-number">{managerUsers.length}</div>
                            <div className="card-stats">
                                <span className="stat-item active">
                                    <span className="stat-dot active"></span>
                                    Active: {activeManagers}
                                </span>
                                <span className="stat-item inactive">
                                    <span className="stat-dot inactive"></span>
                                    Inactive: {inactiveManagers}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="enhanced-card accent-card">
                        <div className="card-icon employee-icon">
                            <FaUserPlus />
                        </div>
                        <div className="card-content">
                            <h3 className="card-title employee-count-title">Total Employees</h3>
                            <div className="card-number">{employeeCount}</div>
                            <div className="card-stats">
                                <span className="stat-item active">
                                    <span className="stat-dot active"></span>
                                    Active: {activeEmployeeCount}
                                </span>
                                <span className="stat-item inactive">
                                    <span className="stat-dot inactive"></span>
                                    Inactive: {inactiveEmployeeCount}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="enhanced-card info-card">
                        <div className="card-icon leave-icon">
                            <FaBell />
                        </div>
                        <div className="card-content">
                            <h3 className="card-title leave-title">Leave Requests</h3>
                            <div className="card-number">{leaves.filter(leave => leave.status === 'PENDING').length}</div>
                            <div className="card-stats">
                                <span className="stat-item approved">
                                    <span className="stat-dot approved"></span>
                                    Approved: {leaves.filter(leave => leave.status === 'ACCEPTED').length}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="enhanced-card success-card">
                        <div className="card-icon joining-icon">
                            <FaUserPlus />
                        </div>
                        <div className="card-content">
                            <h3 className="card-title joining-title">New Joinings This Month</h3>
                            <div className="card-number">
                                {(() => {
                                    const currentMonth = new Date().getMonth();
                                    const currentYear = new Date().getFullYear();
                                    return validEmployees.filter(emp => {
                                        if (!emp.joiningDate) return false;
                                        try {
                                            const joinDate = new Date(emp.joiningDate);
                                            return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
                                        } catch {
                                            return false;
                                        }
                                    }).length;
                                })()}
                            </div>
                            <div className="card-stats">
                                <span className="stat-item total">
                                    <span className="stat-dot total"></span>
                                    Total: {validEmployees.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Charts & Visualizations */}
                <div className="charts-section">
                    <div className="chart-container">
                        <div className="chart-header">
                            <h3 className="chart-title">
                                <span className="chart-icon">👥</span>
                                Role Distribution
                            </h3>
                            <p className="chart-subtitle">Current organizational structure breakdown</p>
                        </div>
                        {rolePieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie 
                                        data={rolePieData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        outerRadius={100} 
                                        label={({name, value, percent}) => 
                                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                                        }
                                    >
                                        {rolePieData.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e1e8ee',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty-state">
                                <div className="chart-empty-content">
                                    <div className="chart-empty-icon">👥</div>
                                    <div className="chart-empty-title">No Role Data Available</div>
                                    <div className="chart-empty-description">Add users to see role distribution</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="chart-container">
                        <div className="chart-header">
                            <h3 className="chart-title">
                                <span className="chart-icon">📈</span>
                                Monthly Hiring Trends
                            </h3>
                            <p className="chart-subtitle">Employee onboarding statistics for {new Date().getFullYear()}</p>
                        </div>
                        {barData.some(item => item.employees > 0) ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="month" 
                                        stroke="#666"
                                        fontSize={12}
                                    />
                                    <YAxis 
                                        stroke="#666"
                                        fontSize={12}
                                    />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e1e8ee',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <Legend />
                                    <Bar 
                                        dataKey="employees" 
                                        fill="#667eea"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty-state">
                                <div className="chart-empty-content">
                                    <div className="chart-empty-icon">📈</div>
                                    <div className="chart-empty-title">No Hiring Data for {new Date().getFullYear()}</div>
                                    <div className="chart-empty-description">Employee joining data will appear here once available</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="recent-activity-card">
                    <div className="chart-header" style={{marginBottom: '20px'}}>
                        <h3 className="chart-title">
                            <FaBell style={{color: '#3b82f6'}} />
                            Recent System Activity
                        </h3>
                        <p className="chart-subtitle">Latest updates and events in your organization</p>
                    </div>
                    <div className="activity-feed">
                        {recentActivity.length === 0 ? (
                            <div className="activity-item">
                                <div className="activity-icon">
                                    <FaBell />
                                </div>
                                <div className="activity-content">
                                    <p>No recent activity</p>
                                    <div className="activity-time">Check back later</div>
                                </div>
                            </div>
                        ) : (
                            paginatedActivity.map((item, idx) => (
                                <div key={idx} className="activity-item">
                                    <div className="activity-icon">
                                        {idx % 3 === 0 ? <FaUserPlus /> : idx % 3 === 1 ? <FaBell /> : <FaUserCheck />}
                                    </div>
                                    <div className="activity-content">
                                        <p>{item}</p>
                                        <div className="activity-time">
                                            {idx < 3 ? 'Just now' : (idx < 6 ? 'Today' : 'This week')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {/* Activity Pagination */}
                    {recentActivity.length > activityPerPage && (
                        <div className="pagination-controls">
                            <button 
                                className="pagination-button"
                                onClick={() => setActivityPage(prev => Math.max(prev - 1, 1))}
                                disabled={activityPage === 1}
                            >
                                Previous
                            </button>
                            <span className="pagination-info">
                                Page {activityPage} of {totalActivityPages}
                            </span>
                            <button 
                                className="pagination-button"
                                onClick={() => setActivityPage(prev => Math.min(prev + 1, totalActivityPages))}
                                disabled={activityPage === totalActivityPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
  );
};

export default AdminDashboard;