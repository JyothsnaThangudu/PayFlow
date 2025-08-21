import React, { useEffect, useState } from 'react';
import SidebarManager from '../components/SidebarManager';
import { useNavigate } from 'react-router-dom';
import { 
    FaBell, 
    FaUsers, 
    FaProjectDiagram, 
    FaCalendarCheck, 
    FaClipboardList,
    FaTasks,
    FaClock,
    FaCheckCircle,
    FaUserClock,
    FaPlus,
    FaEye,
    FaChartBar,
    FaCalendarAlt,
    FaPaperPlane
} from 'react-icons/fa';
import './ManagerDashboard.css';
import axios from '../utils/axios';


function ManagerDashboard() {
    // Use managerId from localStorage (set after login)
    const managerId = localStorage.getItem('managerId');
    // Get manager name dynamically from API
    const [managerName, setManagerName] = useState('Manager');
    const [team, setTeam] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNotif, setShowNotif] = useState(false);
    const [reminder, setReminder] = useState("");
    const [reminderDate, setReminderDate] = useState("");
    const [reminderTime, setReminderTime] = useState("");
    const [reminders, setReminders] = useState([]);
    const [notifyLoading, setNotifyLoading] = useState(null); // id of reminder being notified
    const [activeTab, setActiveTab] = useState('overview');
    
    // Pagination states
    const [currentActivityPage, setCurrentActivityPage] = useState(1);
    const [currentLeavePage, setCurrentLeavePage] = useState(1);
    const activitiesPerPage = 5;
    const leavesPerPage = 6;

    const navigate = useNavigate();

    // Dynamic notifications based on actual data
    const generateDynamicNotifications = () => {
        const notifications = [];
        
        // Add pending leave notifications
        const pendingLeaves = leaves.filter(l => l.status === 'PENDING');
        pendingLeaves.slice(0, 3).forEach(leave => {
            const emp = team.find(e => e.id === leave.employeeId);
            notifications.push({
                id: `leave_${leave.id}`,
                message: `Leave request from ${emp?.fullName || 'Employee'} needs approval`,
                date: leave.createdAt || new Date().toISOString().split('T')[0],
                type: 'leave',
                priority: 'high',
                data: leave
            });
        });
        
        // Add project deadline notifications
        const urgentProjects = projects.filter(p => {
            if (p.deadline) {
                const deadline = new Date(p.deadline);
                const today = new Date();
                const daysDiff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                return daysDiff <= 3 && daysDiff >= 0;
            }
            return false;
        });
        
        urgentProjects.slice(0, 2).forEach(project => {
            const deadline = new Date(project.deadline);
            const today = new Date();
            const daysDiff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            notifications.push({
                id: `project_${project.id}`,
                message: `Project "${project.name}" deadline ${daysDiff === 0 ? 'today' : `in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`}`,
                date: new Date().toISOString().split('T')[0],
                type: 'project',
                priority: daysDiff === 0 ? 'high' : 'medium',
                data: project
            });
        });
        
        // Add team notifications
        const recentJoiners = team.filter(member => {
            if (member.joiningDate) {
                const joinDate = new Date(member.joiningDate);
                const today = new Date();
                const daysDiff = Math.ceil((today - joinDate) / (1000 * 60 * 60 * 24));
                return daysDiff <= 7 && daysDiff >= 0;
            }
            return false;
        });
        
        recentJoiners.slice(0, 2).forEach(member => {
            notifications.push({
                id: `team_${member.id}`,
                message: `Welcome new team member ${member.fullName}`,
                date: member.joiningDate,
                type: 'team',
                priority: 'low',
                data: member
            });
        });
        
        // Add general reminders
        if (reminders.length > 0) {
            notifications.push({
                id: 'reminders',
                message: `You have ${reminders.length} pending reminder${reminders.length > 1 ? 's' : ''}`,
                date: new Date().toISOString().split('T')[0],
                type: 'reminder',
                priority: 'medium'
            });
        }
        
        // Sort by priority and date
        return notifications.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(b.date) - new Date(a.date);
        });
    };

    const dynamicNotifications = generateDynamicNotifications();



    const handleViewAllNotifications = () => {
        const dynamicNotifications = generateDynamicNotifications();
        navigate('/notifications', { state: { notifications: dynamicNotifications } });
    };

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [managerRes, teamRes, leavesRes, projectsRes, remindersRes] = await Promise.all([
                    axios.get(`/api/manager/${managerId}/details`),
                    axios.get(`/api/manager/${managerId}/team`),
                    axios.get(`/api/manager/${managerId}/leaves`),
                    axios.get(`/api/manager/${managerId}/projects`),
                    axios.get(`/api/reminders/manager/${managerId}`)
                ]);
                setManagerName(managerRes.data?.name || 'Manager');
                setTeam(teamRes.data);
                setLeaves(leavesRes.data);
                setProjects(projectsRes.data);
                setReminders(remindersRes.data || []);
            } catch (err) {
                console.error("Error fetching manager data", err);
                setManagerName(localStorage.getItem('managerName') || 'Manager');
            }
            setLoading(false);
        }
        fetchData();
    }, [managerId]);

    // Remove localStorage sync for reminders, now handled by backend
    // Add reminder handler
    const handleAddReminder = async (e) => {
        e.preventDefault();
        if (!reminder || !reminderDate || !reminderTime) return;
        try {
            await axios.post('/api/reminders/add', {
                managerId,
                text: reminder,
                date: reminderDate,
                time: reminderTime,
                notified: false
            });
            setReminder("");
            setReminderDate("");
            setReminderTime("");
            // Refetch reminders from backend
            const remindersRes = await axios.get(`/api/reminders/manager/${managerId}`);
            setReminders(remindersRes.data || []);
        } catch (err) {
            console.error('Error adding reminder', err);
        }
    };

    // Notify employees handler
    const handleNotifyEmployees = async (reminderObj) => {
        setNotifyLoading(reminderObj.id);
        try {
            // Fetch team member IDs
            const teamRes = await axios.get(`/api/manager/${managerId}/team`);
            const employeeIds = teamRes.data.map(emp => emp.id);
            await axios.post(`/api/reminders/notify/${managerId}`, {
                employeeIds,
                reminder: reminderObj
            });
            // Optionally update UI or show notification
        } catch (err) {
            console.error('Error notifying employees', err);
        }
        setNotifyLoading(null);
    };

    const handleReminderAdd = (e) => {
        e.preventDefault();
        if (reminder.trim()) {
            const newReminder = {
                id: Date.now(),
                text: reminder,
                date: reminderDate && reminderTime ? `${reminderDate} ${reminderTime}` : new Date().toLocaleString(),
                createdAt: new Date().toISOString(),
                notified: false
            };
            setReminders([newReminder, ...reminders]);
            setReminder("");
            setReminderDate("");
            setReminderTime("");
        }
    };

    // Notify team: Save reminder to each employee's localStorage reminders
    const handleNotifyTeam = async (reminderObj) => {
        setNotifyLoading(reminderObj.id);
        try {
            // Get employee IDs from team
            const employeeIds = team.map(emp => emp.id);
            await axios.post(`/api/reminders/notify/${managerId}`, {
                employeeIds,
                reminder: reminderObj
            });
            // Refetch reminders from backend to update notified status
            const remindersRes = await axios.get(`/api/reminders/manager/${managerId}`);
            setReminders(remindersRes.data || []);
        } catch (err) {
            console.error('Error notifying employees', err);
        }
        setNotifyLoading(null);
    };

    const handleReminderRemove = (reminderId) => {
        setReminders(reminders.filter(r => r.id !== reminderId));
    };

    // Employees on leave today
    const today = new Date().toISOString().slice(0, 10);
    const employeesOnLeave = leaves.filter(l => l.fromDate <= today && l.toDate >= today);

    // Enhanced statistics calculations
    const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
    const approvedLeaves = leaves.filter(l => l.status === 'ACCEPTED').length;
    const activeProjects = projects.filter(p => p.status === 'ACTIVE' || !p.status).length;
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    
    // Calculate employees who joined this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newJoinersThisMonth = team.filter(member => {
        if (member.joiningDate) {
            const joinDate = new Date(member.joiningDate);
            return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
        }
        return false;
    }).length;
    
    // Get recent activities with pagination (sorted chronologically - newest first)
    const allRecentActivities = [
        ...leaves.map(l => ({
            type: 'leave',
            message: `Leave request from ${l.employeeName || team.find(t => t.id === l.employeeId)?.fullName || 'Employee'}`,
            time: l.createdAt || new Date().toISOString(),

            status: l.status,
            id: l.id,
            sortKey: `leave_${l.id}`
        })),
        ...projects.map(p => ({
            type: 'project',
            message: `Project "${p.name || 'update'}" ${p.status === 'COMPLETED' ? 'completed' : 'updated'}`,
            time: p.updatedAt || 'Recently',
            status: p.status || 'ACTIVE',
            id: p.id,
            sortKey: `project_${p.id}`
        })),
        ...reminders.map(r => ({
            type: 'reminder',
            message: `Reminder: ${r.text}`,
            time: r.date,
            status: 'ACTIVE',
            id: r.id,
            sortKey: `reminder_${r.id}`
        }))
    ].sort((a, b) => {
        // Sort by ID within each type, then by type priority (leaves first, then projects, then reminders)
        if (a.type !== b.type) {
            const typePriority = { 'leave': 3, 'project': 2, 'reminder': 1 };
            return typePriority[b.type] - typePriority[a.type];
        }
        return b.id - a.id; // Newest first within same type
    });

    // Pagination for activities
    const totalActivityPages = Math.ceil(allRecentActivities.length / activitiesPerPage);
    const startActivityIndex = (currentActivityPage - 1) * activitiesPerPage;
    const paginatedActivities = allRecentActivities.slice(startActivityIndex, startActivityIndex + activitiesPerPage);

    // Pagination for leaves (sorted chronologically - newest first)
    const sortedLeaves = [...leaves].sort((a, b) => {
        // Sort by ID (newest/highest ID first since auto-generated)
        return b.id - a.id;
    });
    const totalLeavePages = Math.ceil(sortedLeaves.length / leavesPerPage);
    const startLeaveIndex = (currentLeavePage - 1) * leavesPerPage;
    const paginatedLeaves = sortedLeaves.slice(startLeaveIndex, startLeaveIndex + leavesPerPage);

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'leave': return <FaCalendarCheck />;
            case 'project': return <FaProjectDiagram />;
            case 'team': return <FaUsers />;
            case 'meeting': return <FaClock />;
            case 'hr': return <FaClipboardList />;
            case 'reminder': return <FaTasks />;
            default: return <FaBell />;
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6366f1';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Date not available';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        // Always show full date and time for reminders
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };



    
    return (
        <div className="manager-dashboard-layout">
            <SidebarManager />
            <main className="manager-dashboard-main">
                {/* Enhanced Header */}
                <div className="manager-dashboard-header">
                    <div className="header-left">
                        <h1>Welcome {managerName}!</h1>
                        <p className="header-subtitle">Here's what's happening with your team today</p>
                    </div>
                    <div className="header-right">
                        <div className="quick-actions">
                            <button 
                                className="quick-action-btn"
                                onClick={() => navigate(`/manager/${managerId}/leaves`)}
                                title="View All Leave Requests"
                            >
                                <FaCalendarCheck /> Leaves
                                {pendingLeaves > 0 && <span className="quick-action-badge">{pendingLeaves}</span>}
                            </button>
                            <button 
                                className="quick-action-btn"
                                onClick={() => navigate('/team-members')}
                                title="Manage Team"
                            >
                                <FaUsers /> Team
                            </button>
                        </div>
                        <div className="manager-dashboard-bell-wrapper">
                            <div
                                className="manager-dashboard-bell"
                                onMouseEnter={() => setShowNotif(true)}
                                onMouseLeave={() => setShowNotif(false)}
                                onClick={() =>
        navigate('/manager-notifications', {
            state: { notifications: generateDynamicNotifications() }
        })
    }
                                style={{ cursor: 'pointer', position: 'relative' }}
                            >
                                <FaBell size={22} />
                                {dynamicNotifications.length > 0 && (
                                    <span className="manager-dashboard-bell-count">{dynamicNotifications.length}</span>
                                )}
                                {showNotif && (
                                    <div className="manager-dashboard-notif-list">
                                        <div className="notif-header">
                                            <h4>Recent Notifications</h4>
                                        </div>
                                        <ul>
                                            {dynamicNotifications.slice(0, 5).map(n => (
                                                <li key={n.id} className={`notif-item priority-${n.priority}`}>
                                                    <div className="notif-icon" style={{color: getPriorityColor(n.priority)}}>
                                                        {getNotificationIcon(n.type)}
                                                    </div>
                                                    <div className="notif-content">
                                                        <span className="notif-message">{n.message}</span>
                                                        <span className="notif-date">{formatDate(n.date)}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="notif-footer">
                                            {/*<button onClick={() => navigate('/manager-notifications')}>
                                                View All Notifications ({dynamicNotifications.length})
                                            </button> */}
                                            <button
    onClick={() =>
        navigate('/manager-notifications', {
            state: { notifications: generateDynamicNotifications() }
        })
    }
>
    View All Notifications ({dynamicNotifications.length})
</button>





                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="dashboard-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FaChartBar /> Overview
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                        onClick={() => setActiveTab('team')}
                    >
                        <FaUsers /> Team Activity
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reminders')}
                    >
                        <FaTasks /> Reminders
                    </button>
                </div>
                {/* Dashboard Content */}
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading dashboard data...</p>
                    </div>
                ) : (
                    <div className="dashboard-content">
                        {activeTab === 'overview' && (
                            <>
                                {/* Enhanced Statistics Cards */}
                                <div className="stats-grid">
                                    <div className="stat-card primary">
                                        <div className="stat-icon">
                                            <FaUsers />
                                        </div>
                                        <div className="stat-content">
                                            <h3>{team.length}</h3>
                                            <p>Team Members</p>
                                            <span className="stat-trend">+{newJoinersThisMonth} this month</span>
                                        </div>
                                    </div>
                                    
                                    <div className="stat-card success">
                                        <div className="stat-icon">
                                            <FaProjectDiagram />
                                        </div>
                                        <div className="stat-content">
                                            <h3>{activeProjects}</h3>
                                            <p>Active Projects</p>
                                            <span className="stat-trend">{completedProjects} completed</span>
                                        </div>
                                    </div>
                                    
                                    <div className="stat-card warning">
                                        <div className="stat-icon">
                                            <FaCalendarCheck />
                                        </div>
                                        <div className="stat-content">
                                            <h3>{pendingLeaves}</h3>
                                            <p>Pending Leaves</p>
                                            <span className="stat-trend">{approvedLeaves} approved</span>
                                        </div>
                                    </div>
                                    
                                    <div className="stat-card info">
                                        <div className="stat-icon">
                                            <FaUserClock />
                                        </div>
                                        <div className="stat-content">
                                            <h3>{employeesOnLeave.length}</h3>
                                            <p>On Leave Today</p>
                                            <span className="stat-trend">
                                                {employeesOnLeave.length === 0 ? 'Full attendance' : 'Check coverage'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="quick-actions-section">
                                    <h3>Quick Actions</h3>
                                    <div className="action-cards">
                                        <div className="action-card" onClick={() => navigate(`/manager/${managerId}/leaves`)}>
                                            <FaEye />
                                            <span>Review Leave Requests</span>
                                            {pendingLeaves > 0 && <div className="action-badge">{pendingLeaves}</div>}
                                        </div>
                                        <div className="action-card" onClick={() => navigate('/team-members')}>
                                            <FaUsers />
                                            <span>Manage Team</span>
                                        </div>
                                        <div className="action-card" onClick={() => navigate('/projects')}>
                                            <FaProjectDiagram />
                                            <span>View Projects</span>
                                        </div>
                                        <div className="action-card" onClick={() => setActiveTab('reminders')}>
                                            <FaPlus />
                                            <span>Add Reminder</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activities */}
                                <div className="recent-activities">
                                    <div className="section-header">
                                        <h3>Recent Activities</h3>
                                        <div className="pagination-info">
                                            Page {currentActivityPage} of {totalActivityPages || 1} ({allRecentActivities.length} total)
                                        </div>
                                    </div>
                                    <div className="activity-container">
                                        {totalActivityPages > 1 && (
                                            <button 
                                                className="pagination-side-btn left"
                                                onClick={() => setCurrentActivityPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentActivityPage === 1}
                                                title="Previous page"
                                            >
                                                ‹
                                            </button>
                                        )}
                                        <div className="activity-list">
                                            {paginatedActivities.length > 0 ? paginatedActivities.map((activity, idx) => (
                                                <div key={idx} className="activity-item">
                                                    <div className={`activity-icon ${activity.type}`}>
                                                        {getNotificationIcon(activity.type)}
                                                    </div>
                                                    <div className="activity-content">
                                                        <p>{activity.message}</p>
                                                        {/*<span className="activity-time">{formatDate(activity.time)}</span>*/}
                                                    </div>
                                                    <div className={`activity-status ${activity.status?.toLowerCase()}`}>
                                                        {activity.status}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="no-activities">
                                                    <FaClipboardList />
                                                    <p>No recent activities</p>
                                                </div>
                                            )}
                                        </div>
                                        {totalActivityPages > 1 && (
                                            <button 
                                                className="pagination-side-btn right"
                                                onClick={() => setCurrentActivityPage(prev => Math.min(prev + 1, totalActivityPages))}
                                                disabled={currentActivityPage === totalActivityPages}
                                                title="Next page"
                                            >
                                                ›
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'team' && (
                            <div className="team-section">
                                <div className="section-header">
                                    <h3>Team Overview</h3>
                                    <button className="btn-secondary" onClick={() => navigate('/team-members')}>
                                        <FaEye /> View All
                                    </button>
                                </div>
                                
                                {/* Employees on Leave Today */}
                                {employeesOnLeave.length > 0 && (
                                    <div className="leave-today-section">
                                        <h4><FaCalendarAlt /> Employees on Leave Today</h4>
                                        <div className="leave-cards-grid">
                                            {employeesOnLeave.map(lv => {
                                                const emp = team.find(e => e.id === lv.employeeId);
                                                return (
                                                    <div className="leave-card" key={lv.id}>
                                                        <div className="leave-card-header">
                                                            <h5>{emp ? emp.fullName : 'Employee #' + lv.employeeId}</h5>
                                                            <span className={`leave-type ${lv.type?.toLowerCase()}`}>
                                                                {lv.type}
                                                            </span>
                                                        </div>
                                                        <div className="leave-card-details">
                                                            <p><FaCalendarAlt /> {lv.fromDate} to {lv.toDate}</p>
                                                            <p><FaCheckCircle /> Status: {lv.status}</p>
                                                            {lv.reason && <p className="leave-reason">"{lv.reason}"</p>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* All Leave Requests with Pagination */}
                                <div className="all-leaves-section" style={{ marginTop: '60px' }}>
                                    <div className="section-header" style={{ marginBottom: '32px' }}>
                                        <h4><FaClipboardList /> All Leave Requests</h4>
                                        <div className="pagination-info">
                                            Page {currentLeavePage} of {totalLeavePages || 1} ({sortedLeaves.length} total)
                                        </div>
                                    </div>
                                    
                                    {leaves.length > 0 ? (
                                        <>
                                            <div className="leave-container">
                                                {totalLeavePages > 1 && (
                                                    <button 
                                                        className="pagination-side-btn left"
                                                        onClick={() => setCurrentLeavePage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentLeavePage === 1}
                                                        title="Previous page"
                                                    >
                                                        ‹
                                                    </button>
                                                )}
                                                <div className="leave-requests-table">
                                                    <div className="table-header">
                                                        <div className="table-cell">Employee</div>
                                                        <div className="table-cell">Type</div>
                                                        <div className="table-cell">Dates</div>
                                                        <div className="table-cell">Status</div>
                                                        <div className="table-cell">Applied</div>
                                                    </div>
                                                    {paginatedLeaves.map(leave => {
                                                        const emp = team.find(e => e.id === leave.employeeId);
                                                        return (
                                                            <div key={leave.id} className="table-row">
                                                                <div className="table-cell">
                                                                    <div className="employee-info">
                                                                        <span className="employee-name">
                                                                            {emp ? emp.fullName : 'Employee #' + leave.employeeId}
                                                                        </span>
                                                                        <span className="employee-dept">
                                                                            {emp?.department || 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="table-cell">
                                                                    <span className={`leave-type-badge ${leave.type?.toLowerCase()}`}>
                                                                        {leave.type}
                                                                    </span>
                                                                </div>
                                                                <div className="table-cell">
                                                                    <div className="date-range">
                                                                        <span>{leave.fromDate}</span>
                                                                        <span className="date-separator">to</span>
                                                                        <span>{leave.toDate}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="table-cell">
                                                                    <span className={`status-badge ${leave.status?.toLowerCase()}`}>
                                                                        {leave.status}
                                                                    </span>
                                                                </div>
                                                                <div className="table-cell">
                                                                    <span className="applied-date">
                                                                        {formatDate(leave.createdAt)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {totalLeavePages > 1 && (
                                                    <button 
                                                        className="pagination-side-btn right"
                                                        onClick={() => setCurrentLeavePage(prev => Math.min(prev + 1, totalLeavePages))}
                                                        disabled={currentLeavePage === totalLeavePages}
                                                        title="Next page"
                                                    >
                                                        ›
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="no-leaves">
                                            <FaCalendarAlt />
                                            <p>No leave requests found</p>
                                        </div>
                                    )}
                                </div>

                                {/* Team Statistics */}
                                <div className="team-stats">
                                    <h4>Team Statistics</h4>
                                    <div className="team-stats-grid">
                                        <div className="team-stat">
                                            <span className="stat-number">{team.length}</span>
                                            <span className="stat-label">Total Members</span>
                                        </div>
                                        <div className="team-stat">
                                            <span className="stat-number">{team.length - employeesOnLeave.length}</span>
                                            <span className="stat-label">Present Today</span>
                                        </div>
                                        <div className="team-stat">
                                            <span className="stat-number">{employeesOnLeave.length}</span>
                                            <span className="stat-label">On Leave</span>
                                        </div>
                                        <div className="team-stat">
                                            <span className="stat-number">{activeProjects}</span>
                                            <span className="stat-label">Active Projects</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reminders' && (
                            <div className="reminders-section">
                                <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h3>Reminders & Tasks</h3>
                                    <div 
                                        className="reminders-count"
                                        style={{
                                            background: '#6366f1',
                                            color: '#fff',
                                            borderRadius: '20px',
                                            padding: '6px 18px',
                                            fontWeight: 500,
                                            fontSize: '1rem',
                                            marginLeft: 'auto'
                                        }}
                                    >
                                        {reminders.length} active reminder{reminders.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                
                                <div className="reminder-form-card" style={{ marginTop: 16 }}>
                                    <h4 style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.3rem', color: '#222' }}>
                                        <FaPlus style={{ color: '#6366f1', fontSize: 22 }} /> Add New Reminder
                                    </h4>
                                    <form onSubmit={handleAddReminder} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                                        <input
                                            type="text"
                                            value={reminder}
                                            onChange={e => setReminder(e.target.value)}
                                            placeholder="Enter your reminder..."
                                            className="reminder-input"
                                            required
                                            maxLength={200}
                                            style={{
                                                width: '100%',
                                                maxWidth: 340,
                                                padding: '14px 16px',
                                                borderRadius: 10,
                                                border: '1.5px solid #d1d5db',
                                                fontSize: '1.08rem',
                                                marginBottom: 10,
                                                boxShadow: '0 2px 8px rgba(99,102,241,0.04)'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 340, justifyContent: 'center' }}>
                                            <input
                                                type="date"
                                                value={reminderDate}
                                                onChange={e => setReminderDate(e.target.value)}
                                                className="reminder-date-input"
                                                style={{
                                                    flex: 1,
                                                    padding: '12px 14px',
                                                    borderRadius: 10,
                                                    border: '1.5px solid #d1d5db',
                                                    fontSize: '1.08rem',
                                                    background: '#f8fafc',
                                                    marginRight: 8
                                                }}
                                            />
                                            <input
                                                type="time"
                                                value={reminderTime}
                                                onChange={e => setReminderTime(e.target.value)}
                                                className="reminder-time-input"
                                                style={{
                                                    flex: 1,
                                                    padding: '12px 14px',
                                                    borderRadius: 10,
                                                    border: '1.5px solid #d1d5db',
                                                    fontSize: '1.08rem',
                                                    background: '#f8fafc'
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="reminder-btn"
                                            style={{
                                                background: 'linear-gradient(90deg, #6366f1 60%, #60a5fa 100%)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 10,
                                                padding: '14px 32px',
                                                fontWeight: 700,
                                                fontSize: '1.08rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
                                                cursor: 'pointer',
                                                marginTop: 8,
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <FaPlus style={{ fontSize: 18 }} /> Add Reminder
                                        </button>
                                        <div className="form-hint" style={{ marginTop: 6, textAlign: 'center' }}>
                                            <small style={{ color: '#6366f1', fontStyle: 'italic', fontSize: '0.98rem' }}>
                                                Tip: Be specific and actionable with your reminders
                                            </small>
                                        </div>
                                    </form>
                                </div>

                                <div className="reminders-list-card">
                                    <h4><FaTasks /> Your Reminders</h4>
                                    {reminders.length > 0 ? (
                                        <div className="reminders-list">
                                            {reminders
                                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                                .map((r) => (
                                                <div key={r.id} className="reminder-item">
                                                    <div className="reminder-content">
                                                        <p className="reminder-text">{r.text}</p>
                                                        <div className="reminder-meta">
                                                            <span className="reminder-date">
                                                                <FaClock /> Created {r.createdAt ? formatDate(r.createdAt) : 'Date not available'}
                                                            </span>
                                                            {(r.date || r.time) && (
                                                                <span className="reminder-date">
                                                                    <FaCalendarAlt /> Scheduled: {r.date ? r.date : ''}{r.time ? `, ${r.time}` : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="reminder-actions" style={{ display: 'flex', gap: 8 }}>
                                                        <button 
                                                            className="notify-team-btn"
                                                            onClick={() => handleNotifyTeam(r)}
                                                            disabled={r.notified || notifyLoading === r.id}
                                                            title={r.notified ? "Already notified" : "Notify team"}
                                                            style={{
                                                                background: r.notified ? "#10b981" : "#6366f1",
                                                                color: "#fff",
                                                                border: "none",
                                                                borderRadius: "50%",
                                                                width: 32,
                                                                height: 32,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                cursor: r.notified ? "not-allowed" : "pointer"
                                                            }}
                                                        >
                                                            {notifyLoading === r.id ? (
                                                                <span className="loading-spinner" style={{ width: 18, height: 18 }}></span>
                                                            ) : (
                                                                <FaPaperPlane />
                                                            )}
                                                        </button>
                                                        <button 
                                                            className="remove-reminder"
                                                            onClick={() => handleReminderRemove(r.id)}
                                                            title="Remove reminder"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-reminders">
                                            <FaTasks />
                                            <p>No reminders yet. Add one above!</p>
                                            <small>Stay organized by setting reminders for important tasks</small>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Reminder Templates */}
                                <div className="reminder-templates">
                                    <h4>Quick Templates</h4>
                                    <div className="template-buttons">
                                        <button 
                                            className="template-btn"
                                            onClick={() => setReminder("Review team performance reports")}
                                        >
                                            Performance Review
                                        </button>
                                        <button 
                                            className="template-btn"
                                            onClick={() => setReminder("Schedule one-on-one meetings with team")}
                                        >
                                            Team Meetings
                                        </button>
                                        <button 
                                            className="template-btn"
                                            onClick={() => setReminder("Update project status and timelines")}
                                        >
                                            Project Updates
                                        </button>
                                        <button 
                                            className="template-btn"
                                            onClick={() => setReminder("Review pending leave requests")}
                                        >
                                            Leave Reviews
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
export default ManagerDashboard;