import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/SidebarAdmin';
import { 
    FaUser, 
    FaEdit, 
    FaTrash, 
    FaPlus, 
    FaSearch, 
    FaFilter,
    FaUserCog,
    FaUserTie,
    FaUserCheck,
    FaEye,
    FaToggleOn,
    FaToggleOff
} from 'react-icons/fa';
import './UserManagement.css';

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, roleFilter, statusFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(user => 
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Role filter
        if (roleFilter !== 'ALL') {
            filtered = filtered.filter(user => user.role?.toUpperCase() === roleFilter);
        }

        // Status filter
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'ACTIVE') {
                filtered = filtered.filter(user => user.active);
            } else if (statusFilter === 'INACTIVE') {
                filtered = filtered.filter(user => !user.active);
            }
        }

        setFilteredUsers(filtered);
        setCurrentPage(1);
    };

    const handleToggleUserStatus = async (username, currentStatus) => {
        try {
            setActionLoading(prev => ({...prev, [username]: 'toggle'}));
            const endpoint = currentStatus ? 
                'http://localhost:8080/api/admin/disable-user' : 
                'http://localhost:8080/api/admin/enable-user';
            
            await axios.put(endpoint, { username });
            fetchUsers();
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            alert('Failed to update user status. Please try again.');
        } finally {
            setActionLoading(prev => ({...prev, [username]: null}));
        }
    };

    const handleDeleteUser = async (username) => {
        if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            try {
                setActionLoading(prev => ({...prev, [username]: 'delete'}));
                await axios.delete(`http://localhost:8080/api/admin/users/${username}`);
                fetchUsers();
            } catch (error) {
                console.error('Failed to delete user:', error);
                alert('Failed to delete user. Please try again.');
            } finally {
                setActionLoading(prev => ({...prev, [username]: null}));
            }
        }
    };

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name || '',
            email: user.email || user.username,
            role: user.role || 'EMPLOYEE'
        });
        setShowEditModal(true);
    };

    const handleUpdateUser = async () => {
        try {
            setActionLoading(prev => ({...prev, [selectedUser.username]: 'edit'}));
            await axios.put(`http://localhost:8080/api/admin/users/${selectedUser.username}`, editFormData);
            fetchUsers();
            setShowEditModal(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user. Please try again.');
        } finally {
            setActionLoading(prev => ({...prev, [selectedUser.username]: null}));
        }
    };

    const getRoleIcon = (role) => {
        switch (role?.toUpperCase()) {
            case 'ADMIN':
                return <FaUserCog className="role-icon admin" />;
            case 'HR':
                return <FaUserTie className="role-icon hr" />;
            case 'MANAGER':
                return <FaUserCheck className="role-icon manager" />;
            case 'EMPLOYEE':
                return <FaUser className="role-icon employee" />;
            default:
                return <FaUser className="role-icon default" />;
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role?.toUpperCase()) {
            case 'ADMIN':
                return 'role-badge admin';
            case 'HR':
                return 'role-badge hr';
            case 'MANAGER':
                return 'role-badge manager';
            case 'EMPLOYEE':
                return 'role-badge employee';
            default:
                return 'role-badge default';
        }
    };

    // Pagination
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    if (loading) {
        return (
            <div className="admin-dashboard-layout" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)' }}>
                <Sidebar />
                <main className="admin-dashboard-main" style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="loading-spinner">Loading users...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-layout" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)' }}>
            <Sidebar />
            <main className="admin-dashboard-main" style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
                {/* Header */}
                <div className="user-management-header">
                    <div className="header-content">
                        <div className="title-section">
                            <h1 className="page-title">
                                <FaUser />
                                User Management
                            </h1>
                            <p className="page-subtitle">Manage system users, roles, and permissions</p>
                        </div>
                        <button 
                            className="add-user-btn"
                            onClick={() => navigate('/create-user')}
                        >
                            <FaPlus />
                            Add New User
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search users by name, username, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-controls">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="HR">HR</option>
                            <option value="MANAGER">Manager</option>
                            <option value="EMPLOYEE">Employee</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="users-table-container">
                    <div className="table-header">
                        <h3>Users ({filteredUsers.length})</h3>
                    </div>
                    <div className="users-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((user) => (
                                    <tr key={user.username} className={!user.active ? 'inactive-user' : ''}>
                                        <td className="user-cell">
                                            <div className="user-info">
                                                {getRoleIcon(user.role)}
                                                <div className="user-details">
                                                    <div className="user-name">{user.name || user.username}</div>
                                                    <div className="username">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={getRoleBadgeClass(user.role)}>
                                                {user.role || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="email-cell">{user.email || 'N/A'}</td>
                                        <td>
                                            <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                                                {user.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn view-btn"
                                                    title="View Details"
                                                    onClick={() => handleViewUser(user)}
                                                    disabled={actionLoading[user.username]}
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    className="action-btn edit-btn"
                                                    title="Edit User"
                                                    onClick={() => handleEditUser(user)}
                                                    disabled={actionLoading[user.username]}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className={`action-btn toggle-btn ${user.active ? 'active' : 'inactive'}`}
                                                    title={user.active ? 'Disable User' : 'Enable User'}
                                                    onClick={() => handleToggleUserStatus(user.username, user.active)}
                                                    disabled={actionLoading[user.username]}
                                                >
                                                    {actionLoading[user.username] === 'toggle' ? (
                                                        <div className="spinner"></div>
                                                    ) : (
                                                        user.active ? <FaToggleOn /> : <FaToggleOff />
                                                    )}
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    title="Delete User"
                                                    onClick={() => handleDeleteUser(user.username)}
                                                    disabled={actionLoading[user.username]}
                                                >
                                                    {actionLoading[user.username] === 'delete' ? (
                                                        <div className="spinner"></div>
                                                    ) : (
                                                        <FaTrash />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="no-users">
                                <FaUser className="no-users-icon" />
                                <h3>No users found</h3>
                                <p>Try adjusting your search criteria or add new users.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span className="pagination-info">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* User Details Modal */}
                {showUserModal && selectedUser && (
                    <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>User Details</h3>
                                <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="user-detail-card">
                                    <div className="detail-row">
                                        <span className="detail-label">Name:</span>
                                        <span className="detail-value">{selectedUser.name || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Username:</span>
                                        <span className="detail-value">{selectedUser.username}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Email:</span>
                                        <span className="detail-value">{selectedUser.email || selectedUser.username}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Role:</span>
                                        <span className={`detail-value ${getRoleBadgeClass(selectedUser.role)}`}>
                                            {selectedUser.role || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Status:</span>
                                        <span className={`detail-value status-badge ${selectedUser.active ? 'active' : 'inactive'}`}>
                                            {selectedUser.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">First Login:</span>
                                        <span className="detail-value">{selectedUser.firstLogin ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditModal && selectedUser && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Edit User</h3>
                                <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }}>
                                    <div className="form-group">
                                        <label htmlFor="edit-name">Name:</label>
                                        <input
                                            id="edit-name"
                                            type="text"
                                            value={editFormData.name}
                                            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-email">Email:</label>
                                        <input
                                            id="edit-email"
                                            type="email"
                                            value={editFormData.email}
                                            onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-role">Role:</label>
                                        <select
                                            id="edit-role"
                                            value={editFormData.role}
                                            onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                                            className="form-select"
                                        >
                                            <option value="EMPLOYEE">Employee</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="HR">HR</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-actions">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setShowEditModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary"
                                            disabled={actionLoading[selectedUser.username] === 'edit'}
                                        >
                                            {actionLoading[selectedUser.username] === 'edit' ? 'Updating...' : 'Update User'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserManagement;
