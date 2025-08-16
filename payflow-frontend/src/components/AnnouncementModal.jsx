
import React, { useState } from 'react';
import { FaBullhorn, FaListAlt, FaCalendarAlt, FaClock, FaTimes } from 'react-icons/fa';
import './AnnouncementModal.css';

const AnnouncementModal = ({ isOpen, onClose, onSubmit, announcements = [] }) => {
  const [activeTab, setActiveTab] = useState('add');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ message, date, time });
    setMessage('');
    setDate('');
    setTime('');
    setActiveTab('view');
  };

  if (!isOpen) return null;

  return (
    <div className="announcement-modal-overlay">
      <div className="announcement-modal card-style" style={{ position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#6366f1', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}
          title="Close"
        >
          <FaTimes />
        </button>
        <div className="modal-header">
          <FaBullhorn className="modal-icon" />
          <h2>Announcements</h2>
        </div>
        <div className="modal-tabs">
          <button className={activeTab === 'add' ? 'active' : ''} onClick={() => setActiveTab('add')}><FaBullhorn /> Add</button>
          <button className={activeTab === 'view' ? 'active' : ''} onClick={() => setActiveTab('view')}><FaListAlt /> View All</button>
        </div>
        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="announcement-form">
            <label>Message<span className="required">*</span></label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required placeholder="Type your announcement..." />
            <div className="form-row">
              <div>
                <label>Date <span className="optional">(optional)</span></label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label>Time <span className="optional">(optional)</span></label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="submit" className="send-btn">Send</button>
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
        {activeTab === 'view' && (
          <div className="announcement-list">
            {announcements.length === 0 ? (
              <div className="no-announcements">No announcements found.</div>
            ) : (
              <ul>
                {announcements.map((a, idx) => (
                  <li key={idx} className="announcement-item">
                    <div className="announcement-message"><FaBullhorn /> {a.message}</div>
                    <div className="announcement-meta">
                      <span><FaCalendarAlt /> {a.date || '-'}</span>
                      <span><FaClock /> {a.time || '-'}</span>
                      <span className="created-at">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementModal;
