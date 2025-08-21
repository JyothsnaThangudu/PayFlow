import React from 'react';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';
import './UpcomingHolidays.css';

const UpcomingHolidaysModal = ({ isOpen, onClose, holidays = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="announcement-modal-overlay">
      <div className="announcement-modal card-style" style={{ position: 'relative', minWidth: 400 }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#6366f1', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}
          title="Close"
        >
          <FaTimes />
        </button>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaCalendarAlt 
              style={{ 
                color: '#ff9800', 
                fontSize: '2.5rem', 
                filter: 'drop-shadow(0 4px 12px #ffd700)', 
                background: 'linear-gradient(135deg, #fffbe6 60%, #ffe0b2 100%)',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 2px 8px rgba(255, 152, 0, 0.18)'
              }} 
            />
          </span>
          <h2 style={{ fontWeight: 700, fontSize: '1.6rem', color: '#fff', letterSpacing: '1px', textShadow: '0 2px 8px rgba(60,60,120,0.18)' }}>All Upcoming Holidays</h2>
        </div>
        <div className="announcement-list">
          {holidays.length === 0 ? (
            <div className="no-announcements">No upcoming holidays found.</div>
          ) : (
            <div className="holidays-center-list">
              {holidays.map((h, idx) => (
                <div key={idx} className="announcement-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '18px' }}>
                  <div className="announcement-message" style={{ fontSize: '1.15rem', fontWeight: 600, color: '#4b55df', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaCalendarAlt style={{ color: '#ff9800', fontSize: '1.6rem', filter: 'drop-shadow(0 2px 6px #ffd700)' }} />
                    {h.summary}
                  </div>
                  <div className="announcement-meta" style={{ color: '#6366f1', fontWeight: 500, fontSize: '1rem', marginTop: '4px' }}>
                    <span>{new Date(h.start.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingHolidaysModal;
