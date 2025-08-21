import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PopupMessage from '../components/PopupMessage';
import SidebarManager from '../components/SidebarManager';
import axios from '../utils/axios';
import './ManagerDashboard.css';
import {
    FaClipboardList, FaHistory, FaUsers, FaFileAlt, 
    FaHourglassHalf, FaCheckCircle, FaTimesCircle, 
    FaUserTie, FaCalendarAlt
} from 'react-icons/fa';

function ManagerLeaveRequests() {
    const { managerId: routeManagerId } = useParams();
    const navigate = useNavigate();
    // Use managerId from route params if available, else from localStorage
    const managerId = routeManagerId || localStorage.getItem('managerId');
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [denyingId, setDenyingId] = useState(null);
    const [denyReason, setDenyReason] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [popupMsg, setPopupMsg] = useState({ title: '', message: '', type: 'success' });
    const [currentPage, setCurrentPage] = useState(1);
    const [sortStatus, setSortStatus] = useState('');
    const pageSize = 5;

    // Calculate dynamic statistics
    const totalRequests = leaves.length;
    const pendingRequests = useMemo(() => leaves.filter(l => l.status === 'PENDING').length, [leaves]);
    const approvedRequests = useMemo(() => leaves.filter(l => l.status === 'ACCEPTED').length, [leaves]);
    const rejectedRequests = useMemo(() => leaves.filter(l => l.status === 'DENIED' || l.status === 'REJECTED').length, [leaves]);
    const uniqueEmployees = useMemo(() => new Set(leaves.map(l => l.employeeId)).size, [leaves]);
    
    // Pagination and sorting
    const filteredLeaves = useMemo(() => {
        let sortedLeaves = [...leaves];
        // Sort by ID - newest first (chronological order)
        sortedLeaves.sort((a, b) => b.id - a.id);
        
        if (sortStatus === 'REJECTED') {
            return sortedLeaves.filter(l => l.status === 'DENIED' || l.status === 'REJECTED');
        }
        return sortStatus ? sortedLeaves.filter(l => l.status === sortStatus) : sortedLeaves;
    }, [leaves, sortStatus]);
    
    const totalPages = Math.ceil(filteredLeaves.length / pageSize);
    const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Function to show popup notification
    const showNotification = (title, message, type = 'success') => {
        setPopupMsg({ title, message, type });
        setShowPopup(true);
    };

    // If managerId is not set, redirect to login
    useEffect(() => {
        if (!managerId) {
            navigate('/manager-login');
        }
    }, [managerId, navigate]);

    useEffect(() => {
        console.log('ManagerLeaveRequests: managerId used for API call:', managerId);
        setLoading(true);
        axios.get(`/api/manager/${managerId}/leaves`)
            .then(res => setLeaves(res.data))
            .catch(() => setLeaves([]))
            .finally(() => setLoading(false));
    }, [managerId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredLeaves]);

    const handleAction = async (leaveId, action) => {
        try {
            const leaveToUpdate = leaves.find(l => l.id === leaveId);
            await axios.post(`/api/employee/leave/${leaveId}/action`, { action });
            setLeaves(leaves => leaves.map(l => l.id === leaveId ? { ...l, status: action === 'ACCEPT' ? 'ACCEPTED' : 'DENIED' } : l));
            setDenyingId(null);
            setDenyReason('');
            
            // Show success notification with employee name
            const employeeName = leaveToUpdate?.employeeName || `Employee ID: ${leaveToUpdate?.employeeId}`;
            const actionText = action === 'ACCEPT' ? 'accepted' : 'denied';
            showNotification(
                'Success',
                `Leave request for ${employeeName} has been ${actionText} successfully!`,
                'success'
            );
        } catch (err) {
            showNotification('Error', 'Error updating leave status. Please try again.', 'error');
        }
    };

    const handleDeny = async (e, leaveId) => {
        e.preventDefault();
        if (!denyReason.trim()) {
            showNotification('Error', 'Please provide a reason for denial.', 'error');
            return;
        }
        
        try {
            const leaveToUpdate = leaves.find(l => l.id === leaveId);
            await axios.post(`/api/employee/leave/${leaveId}/action`, { action: 'DENY', reason: denyReason });
            setLeaves(leaves => leaves.map(l => l.id === leaveId ? { ...l, status: 'DENIED', denialReason: denyReason } : l));
            setDenyingId(null);
            setDenyReason('');
            
            // Show success notification with employee name and reason
            const employeeName = leaveToUpdate?.employeeName || `Employee ID: ${leaveToUpdate?.employeeId}`;
            showNotification(
                'Leave Denied',
                `Leave request for ${employeeName} has been denied. Reason: "${denyReason}"`,
                'success'
            );
        } catch (err) {
            showNotification('Error', 'Error denying leave request. Please try again.', 'error');
        }
    };

    return (
        <div className="manager-dashboard-layout">
            <SidebarManager />
            <main className="manager-dashboard-main">
                <h2 className="leave-page-title">
                    <FaClipboardList style={{ marginRight: 8 }} />
                    Team Leave Requests
                </h2>
                
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
                        Loading team leave requests...
                    </div>
                ) : (
                    <>
                        {/* Statistics Cards */}
                        <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                            {[
                                {
                                    icon: <FaClipboardList size={32} color="#6366f1" style={{ marginBottom: 8 }} />,
                                    label: 'Total Requests',
                                    value: totalRequests,
                                    sub: '',
                                    border: '2px solid #6366f1',
                                    bg: 'linear-gradient(135deg,#f5f6fa 80%,#e0e7ff 100%)',
                                },
                                {
                                    icon: <FaUsers size={32} color="#8b5cf6" style={{ marginBottom: 8 }} />,
                                    label: 'Team Members',
                                    value: uniqueEmployees,
                                    sub: 'employees',
                                    border: '2px solid #8b5cf6',
                                    bg: 'linear-gradient(135deg,#f3e8ff 80%,#f5f6fa 100%)',
                                },
                                {
                                    icon: <FaHourglassHalf size={32} color="#fbbf24" style={{ marginBottom: 8 }} />,
                                    label: 'Pending',
                                    value: pendingRequests,
                                    sub: 'awaiting action',
                                    border: '2px solid #fbbf24',
                                    bg: 'linear-gradient(135deg,#fef9c3 80%,#f5f6fa 100%)',
                                },
                                {
                                    icon: <FaCheckCircle size={32} color="#22c55e" style={{ marginBottom: 8 }} />,
                                    label: 'Accepted',
                                    value: approvedRequests,
                                    sub: '',
                                    border: '2px solid #22c55e',
                                    bg: 'linear-gradient(135deg,#dcfce7 80%,#f5f6fa 100%)',
                                },
                                {
                                    icon: <FaTimesCircle size={32} color="#f87171" style={{ marginBottom: 8 }} />,
                                    label: 'Rejected',
                                    value: rejectedRequests,
                                    sub: '',
                                    border: '2px solid #f87171',
                                    bg: 'linear-gradient(135deg,#fee2e2 80%,#f5f6fa 100%)',
                                },
                            ].map((card, idx) => (
                                <div
                                    key={card.label}
                                    style={{
                                        flex: '1 1 180px', minWidth: 180, maxWidth: 220,
                                        background: card.bg, borderRadius: 16, padding: 24,
                                        boxShadow: '0 4px 16px #e0e7ef', display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', border: card.border,
                                        transition: 'transform 0.15s,box-shadow 0.15s',
                                        cursor: 'default', position: 'relative',
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'}
                                    onMouseOut={e => e.currentTarget.style.transform = ''}
                                >
                                    {card.icon}
                                    <div style={{ fontWeight: 700, fontSize: 17, color: '#222', marginBottom: 2 }}>{card.label}</div>
                                    <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700 }}>{card.value}</div>
                                    {card.sub && <div style={{ fontSize: 13, marginTop: 4, color: '#888' }}>{card.sub}</div>}
                                </div>
                            ))}
                        </div>

                        {/* Leave Requests Table */}
                        <div className="leave-history-card dashboard-card leave-card" style={{
                            background: 'linear-gradient(135deg, #E3E6FD 0%, #F8F9FF 100%)',
                            boxShadow: '0 8px 32px rgba(91,44,152,0.15)',
                            borderRadius: '28px',
                            padding: '48px 40px',
                            marginBottom: '40px',
                            width: '100%',
                            maxWidth: '1200px',
                            minHeight: '350px',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                        }}>
                            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: '430px' }}>
                                <h2 style={{ color: '#5B2C98', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center' }}>
                                    &#8635; Leave Requests <span style={{ fontSize: '16px', fontWeight: 'normal', marginLeft: '8px' }}>({leaves.length} total)</span>
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Filter by Status:</span>
                                    <select value={sortStatus} onChange={e => setSortStatus(e.target.value)} style={{ padding: '7px 18px', borderRadius: '8px', border: '1.5px solid #6366f1', background: '#f5f6fa', color: '#222', fontWeight: 600, fontSize: 15, boxShadow: '0 2px 8px #e0e7ef', outline: 'none', cursor: 'pointer' }}>
                                        <option value="">All Requests</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="ACCEPTED">Accepted</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            {filteredLeaves.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' }}>
                                    <FaFileAlt size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                                    <div>No leave requests found.</div>
                                </div>
                            ) : (
                                <div className="leave-requests-container">
                                    {filteredLeaves.length > pageSize && (
                                        <button 
                                            className="pagination-side-btn left"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                            disabled={currentPage === 1}
                                            title="Previous page"
                                        >
                                            ‹
                                        </button>
                                    )}
                                    <div className="leave-history-table-container">
                                        <table className="leave-history-table">
                                            <thead>
                                                <tr>
                                                    <th>Employee</th>
                                                    <th>Start Date</th>
                                                    <th>End Date</th>
                                                    <th>Duration</th>
                                                    <th>Leave Type</th>
                                                    <th>Type</th>
                                                    <th>Reason</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedLeaves.map((leave, idx) => {
                                                    let statusClass = 'leave-history-status';
                                                    let statusText = leave.status;
                                                    if (leave.status === 'ACCEPTED') statusClass += ' approved';
                                                    else if (leave.status === 'PENDING') statusClass += ' pending';
                                                    else if (leave.status === 'DENIED' || leave.status === 'REJECTED') {
                                                        statusClass += ' rejected';
                                                        statusText = 'REJECTED';
                                                    }

                                                    // Helper to count leave days excluding Sundays
                                                    const countLeaveDaysExcludingSundays = (fromDate, toDate) => {
                                                        let count = 0;
                                                        let current = new Date(fromDate);
                                                        let end = new Date(toDate);
                                                        while (current <= end) {
                                                            if (current.getDay() !== 0) count++;
                                                            current.setDate(current.getDate() + 1);
                                                        }
                                                        return count;
                                                    };
                                                    let duration = '-';
                                                    if (leave.fromDate && leave.toDate) {
                                                        duration = countLeaveDaysExcludingSundays(leave.fromDate, leave.toDate) + ' day(s)';
                                                    }

                                                    // Format dates
                                                    const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
                                                    const formattedFrom = leave.fromDate ? new Date(leave.fromDate).toLocaleDateString('en-GB', dateOptions) : '-';
                                                    const formattedTo = leave.toDate ? new Date(leave.toDate).toLocaleDateString('en-GB', dateOptions) : '-';

                                                    return (
                                                        <tr key={leave.id || idx}>
                                                            <td style={{ fontWeight: 600 }}>
                                                                <FaUserTie style={{ marginRight: 6, color: '#6366f1' }} />
                                                                {leave.employeeName || `Employee ${leave.employeeId}`}
                                                            </td>
                                                            <td>{formattedFrom}</td>
                                                            <td>{formattedTo}</td>
                                                            <td style={{ fontWeight: 600 }}>{duration}</td>
                                                            <td>
                                                                {(() => {
                                                                    let leaveTypeDisplay = '';
                                                                    if (typeof leave.paidDays === 'number' && typeof leave.unpaidDays === 'number') {
                                                                        if (leave.paidDays > 0 && leave.unpaidDays > 0) {
                                                                            leaveTypeDisplay = `Paid/Unpaid (${leave.paidDays}/${leave.unpaidDays})`;
                                                                        } else if (leave.paidDays > 0) {
                                                                            leaveTypeDisplay = 'Paid';
                                                                        } else if (leave.unpaidDays > 0) {
                                                                            leaveTypeDisplay = 'Unpaid';
                                                                        }
                                                                    } else {
                                                                        leaveTypeDisplay = leave.isPaid === false ? 'Unpaid' : 'Paid';
                                                                    }
                                                                    return (
                                                                        <span style={{
                                                                            padding: '4px 8px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '12px',
                                                                            fontWeight: '500',
                                                                            background: leaveTypeDisplay.includes('Unpaid') ? '#fef3c7' : '#dbeafe',
                                                                            color: leaveTypeDisplay.includes('Unpaid') ? '#d97706' : '#1d4ed8'
                                                                        }}>
                                                                            {leaveTypeDisplay}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td>{leave.type || 'Annual'}</td>
                                                            <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>{leave.reason || '-'}</td>
                                                            <td><span className={statusClass}>{statusText}</span></td>
                                                            <td>
                                                                {leave.status === 'PENDING' && (
                                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                        <button 
                                                                            onClick={() => handleAction(leave.id, 'ACCEPT')}
                                                                            style={{ 
                                                                                background: '#22c55e', color: '#fff', border: 'none', 
                                                                                padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                                                                                fontSize: 12, fontWeight: 600
                                                                            }}
                                                                        >
                                                                            ✓ Accept
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => setDenyingId(leave.id)}
                                                                            style={{ 
                                                                                background: '#f87171', color: '#fff', border: 'none', 
                                                                                padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                                                                                fontSize: 12, fontWeight: 600
                                                                            }}
                                                                        >
                                                                            ✗ Deny
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {denyingId === leave.id && (
                                                                    <form onSubmit={e => handleDeny(e, leave.id)} style={{ marginTop: 8 }}>
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="Enter denial reason" 
                                                                            value={denyReason} 
                                                                            onChange={e => setDenyReason(e.target.value)} 
                                                                            style={{ 
                                                                                padding: '6px 8px', width: '160px', 
                                                                                marginBottom: 6, border: '1px solid #ddd', 
                                                                                borderRadius: 4, fontSize: 12
                                                                            }} 
                                                                            required 
                                                                        />
                                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                                            <button 
                                                                                type="submit" 
                                                                                style={{ 
                                                                                    background: '#f87171', color: '#fff', border: 'none', 
                                                                                    padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11
                                                                                }}
                                                                            >
                                                                                Submit
                                                                            </button>
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => {setDenyingId(null); setDenyReason('');}}
                                                                                style={{ 
                                                                                    background: '#6b7280', color: '#fff', border: 'none', 
                                                                                    padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11
                                                                                }}
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </form>
                                                                )}
                                                                {leave.status !== 'PENDING' && (
                                                                    <span style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                                                                        {leave.status === 'ACCEPTED' ? 'Approved' : 'No action needed'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {filteredLeaves.length > pageSize && (
                                        <button 
                                            className="pagination-side-btn right"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                            disabled={currentPage === totalPages}
                                            title="Next page"
                                        >
                                            ›
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
                
                {/* Popup Message */}
                {showPopup && (
                    <PopupMessage
                        title={popupMsg.title}
                        message={popupMsg.message}
                        type={popupMsg.type}
                        onClose={() => setShowPopup(false)}
                    />
                )}
            </main>
        </div>
    );
}

export default ManagerLeaveRequests;
