import React, { useEffect, useState } from "react";
import axios from "../utils/axios";
import EmployeeSidebar from "../components/EmployeeSidebar";

const EmployeeReminders = () => {
  const [selfReminders, setSelfReminders] = useState([]);
  // Pagination for personal reminders
  const [selfPage, setSelfPage] = useState(1);
  const selfRemindersPerPage = 2;
  const sortedSelfReminders = [...selfReminders].sort((a, b) => {
    const dateA = a.date ? new Date(a.date + (a.time ? 'T' + a.time : '')) : new Date(8640000000000000);
    const dateB = b.date ? new Date(b.date + (b.time ? 'T' + b.time : '')) : new Date(8640000000000000);
    return dateA - dateB;
  });
  const totalSelfPages = Math.ceil(sortedSelfReminders.length / selfRemindersPerPage);
  const paginatedSelfReminders = sortedSelfReminders.slice((selfPage - 1) * selfRemindersPerPage, selfPage * selfRemindersPerPage);
  const [reminders, setReminders] = useState([]);
  // Pagination state for received reminders
  const [receivedPage, setReceivedPage] = useState(1);
  const remindersPerPage = 5;
  // Sort reminders chronologically by date and time
  const sortedReminders = [...reminders].sort((a, b) => {
    // If date is missing, treat as far future
    const dateA = a.date ? new Date(a.date + (a.time ? 'T' + a.time : '')) : new Date(8640000000000000);
    const dateB = b.date ? new Date(b.date + (b.time ? 'T' + b.time : '')) : new Date(8640000000000000);
    return dateA - dateB;
  });
  const totalReceivedPages = Math.ceil(sortedReminders.length / remindersPerPage);
  const paginatedReminders = sortedReminders.slice((receivedPage - 1) * remindersPerPage, receivedPage * remindersPerPage);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [selfText, setSelfText] = useState("");
  const [selfDate, setSelfDate] = useState("");
  const [selfTime, setSelfTime] = useState("");
  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => {
    async function fetchReminders() {
      setLoading(true);
      try {
        const res = await axios.get(`/api/reminders/employee/${employeeId}`);
        setReminders(res.data || []);
        // Personal reminders: those with managerId == null
        setSelfReminders((res.data || []).filter(r => r.managerId == null));
      } catch (err) {
        setReminders([]);
        setSelfReminders([]);
      }
      setLoading(false);
    }
    fetchReminders();
  }, [employeeId]);

  const handleAddSelfReminder = (e) => {
    e.preventDefault();
    if (!selfText || !selfDate || !selfTime) return;
    // POST to backend
    axios.post('/api/reminders/add', {
      employeeId,
      text: selfText,
      date: selfDate,
      time: selfTime,
      managerId: null // explicitly mark as personal
    }).then(() => {
      setSelfText("");
      setSelfDate("");
      setSelfTime("");
      // Refetch reminders
      axios.get(`/api/reminders/employee/${employeeId}`).then(res => {
        setReminders(res.data || []);
        setSelfReminders((res.data || []).filter(r => r.managerId == null));
      });
    });
  };

  return (
    <div style={{ display: "flex", minHeight: '100vh', background: 'linear-gradient(90deg, #f8fafc 60%, #e0e7ff 100%)' }}>
      <EmployeeSidebar />
      <div className="employee-reminders-page" style={{ flex: 1, padding: '48px 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 700, margin: '0 auto', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 0 }}>
            <button
              className={activeTab === 'received' ? 'tab-btn active' : 'tab-btn'}
              style={{
                padding: '14px 38px',
                borderRadius: '16px 0 0 16px',
                border: 'none',
                background: activeTab === 'received' ? 'linear-gradient(90deg, #6366f1 80%, #60a5fa 100%)' : '#e0e7ff',
                color: activeTab === 'received' ? '#fff' : '#6366f1',
                fontWeight: 700,
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'received' ? '0 2px 8px rgba(99,102,241,0.12)' : 'none',
                transition: 'background 0.2s',
                outline: 'none',
                borderRight: '1.5px solid #d1d5db'
              }}
              onClick={() => setActiveTab('received')}
            >
              View Received Reminders
            </button>
            <button
              className={activeTab === 'self' ? 'tab-btn active' : 'tab-btn'}
              style={{
                padding: '14px 38px',
                borderRadius: '0 16px 16px 0',
                border: 'none',
                background: activeTab === 'self' ? 'linear-gradient(90deg, #6366f1 80%, #60a5fa 100%)' : '#e0e7ff',
                color: activeTab === 'self' ? '#fff' : '#6366f1',
                fontWeight: 700,
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'self' ? '0 2px 8px rgba(99,102,241,0.12)' : 'none',
                transition: 'background 0.2s',
                outline: 'none',
                borderLeft: '1.5px solid #d1d5db'
              }}
              onClick={() => setActiveTab('self')}
            >
              Add & View My Reminders
            </button>
          </div>
        </div>
        <div style={{ width: '100%', maxWidth: 700, margin: '0 auto', background: 'rgba(255,255,255,0.98)', borderRadius: 24, boxShadow: '0 8px 32px rgba(99,102,241,0.10)', padding: '38px 32px', minHeight: 420, marginBottom: 32 }}>
          {activeTab === 'received' ? (
            <>
              <h2 style={{ fontWeight: 700, fontSize: '1.35rem', color: '#222', marginBottom: 24, letterSpacing: 0.5, textShadow: '0 2px 8px #e0e7ff', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#6366f1', marginRight: 2 }}>
                  <i className="fas fa-bell"></i>
                </span>
                All Reminders Received
              </h2>
              {loading ? (
                <div style={{ marginTop: 40, color: '#6366f1', fontWeight: 500, fontSize: '1.2rem' }}>Loading reminders...</div>
              ) : reminders.length === 0 ? (
                <div style={{ marginTop: 40, color: '#64748b', fontWeight: 500, fontSize: '1.1rem', textAlign: 'center' }}>
                  <i className="fas fa-info-circle" style={{ fontSize: 32, color: '#6366f1', marginBottom: 10 }}></i>
                  <div>No reminders received from your manager.</div>
                </div>
              ) : (
                <>
                  <ul className="reminders-list" style={{ maxWidth: 600, width: '100%', margin: '0 auto', padding: 0 }}>
                    {paginatedReminders.map((rem, idx) => (
                      <li
                        key={rem.id}
                        className="reminder-item"
                        style={{
                          marginBottom: 24,
                          padding: '22px 28px',
                          border: 'none',
                          borderRadius: 16,
                          background: 'linear-gradient(90deg, #fff 70%, #e0e7ff 100%)',
                          boxShadow: '0 4px 18px rgba(99,102,241,0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.18s, box-shadow 0.18s',
                          fontSize: '1.08rem',
                          fontWeight: 500,
                          color: '#222',
                          position: 'relative',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, color: '#6366f1', fontSize: '1.15rem', letterSpacing: 0.5 }}>
                            <i className="fas fa-tasks"></i>
                          </span>
                          <span style={{ fontWeight: 600 }}>{rem.text}</span>
                        </div>
                        <div style={{ fontSize: '1rem', color: '#374151', display: 'flex', gap: 18, alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-calendar-alt" style={{ color: '#6366f1', fontSize: 16 }}></i>
                            <span style={{ fontWeight: 500 }}>Date:</span> {rem.date || '-'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-clock" style={{ color: '#6366f1', fontSize: 16 }}></i>
                            <span style={{ fontWeight: 500 }}>Time:</span> {rem.time || '-'}
                          </span>
                        </div>
                        <div style={{ position: 'absolute', top: 12, right: 18, color: '#6366f1', fontSize: 18, opacity: 0.18 }}>
                          #{(receivedPage - 1) * remindersPerPage + idx + 1}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {/* Pagination controls */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 18 }}>
                    <button
                      onClick={() => setReceivedPage(p => Math.max(1, p - 1))}
                      disabled={receivedPage === 1}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 8,
                        border: 'none',
                        background: receivedPage === 1 ? '#e0e7ff' : 'linear-gradient(90deg, #6366f1 80%, #60a5fa 100%)',
                        color: receivedPage === 1 ? '#6366f1' : '#fff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: receivedPage === 1 ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
                        outline: 'none'
                      }}
                    >Prev</button>
                    <span style={{ fontWeight: 600, color: '#6366f1', fontSize: '1.08rem' }}>Page {receivedPage} of {totalReceivedPages}</span>
                    <button
                      onClick={() => setReceivedPage(p => Math.min(totalReceivedPages, p + 1))}
                      disabled={receivedPage === totalReceivedPages}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 8,
                        border: 'none',
                        background: receivedPage === totalReceivedPages ? '#e0e7ff' : 'linear-gradient(90deg, #6366f1 80%, #60a5fa 100%)',
                        color: receivedPage === totalReceivedPages ? '#6366f1' : '#fff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: receivedPage === totalReceivedPages ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
                        outline: 'none'
                      }}
                    >Next</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h2 style={{ fontWeight: 700, fontSize: '1.35rem', color: '#222', marginBottom: 24, letterSpacing: 0.5, textShadow: '0 2px 8px #e0e7ff', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#6366f1', marginRight: 2 }}>
                  <i className="fas fa-user-plus"></i>
                </span>
                My Personal Reminders
              </h2>
              <form onSubmit={handleAddSelfReminder} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginBottom: 24 }}>
                <input
                  type="text"
                  value={selfText}
                  onChange={e => setSelfText(e.target.value)}
                  placeholder="Enter your reminder..."
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
                    value={selfDate}
                    onChange={e => setSelfDate(e.target.value)}
                    required
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
                    value={selfTime}
                    onChange={e => setSelfTime(e.target.value)}
                    required
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
                  <i className="fas fa-plus" style={{ fontSize: 18 }}></i> Add Reminder
                </button>
                <div style={{ marginTop: 6, textAlign: 'center' }}>
                  <small style={{ color: '#6366f1', fontStyle: 'italic', fontSize: '0.98rem' }}>
                    Tip: Add personal reminders to stay organized
                  </small>
                </div>
              </form>
              <ul className="reminders-list" style={{ maxWidth: 600, width: '100%', margin: '0 auto', padding: 0 }}>
                {paginatedSelfReminders.length === 0 ? (
                  <div style={{ color: '#64748b', fontWeight: 500, fontSize: '1.1rem', textAlign: 'center', marginTop: 24 }}>
                    <i className="fas fa-info-circle" style={{ fontSize: 32, color: '#6366f1', marginBottom: 10 }}></i>
                    <div>No personal reminders added yet.</div>
                  </div>
                ) : (
                  paginatedSelfReminders.map((rem, idx) => (
                    <li
                      key={rem.id}
                      className="reminder-item"
                      style={{
                        marginBottom: 24,
                        padding: '22px 28px',
                        border: 'none',
                        borderRadius: 16,
                        background: 'linear-gradient(90deg, #fff 70%, #e0e7ff 100%)',
                        boxShadow: '0 4px 18px rgba(99,102,241,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.18s, box-shadow 0.18s',
                        fontSize: '1.08rem',
                        fontWeight: 500,
                        color: '#222',
                        position: 'relative',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: '#6366f1', fontSize: '1.15rem', letterSpacing: 0.5 }}>
                          <i className="fas fa-user-plus"></i>
                        </span>
                        <span style={{ fontWeight: 600 }}>{rem.text}</span>
                      </div>
                      <div style={{ fontSize: '1rem', color: '#374151', display: 'flex', gap: 18, alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fas fa-calendar-alt" style={{ color: '#6366f1', fontSize: 16 }}></i>
                          <span style={{ fontWeight: 500 }}>Date:</span> {rem.date || '-'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fas fa-clock" style={{ color: '#6366f1', fontSize: 16 }}></i>
                          <span style={{ fontWeight: 500 }}>Time:</span> {rem.time || '-'}
                        </span>
                      </div>
                      <div style={{ position: 'absolute', top: 12, right: 18, color: '#6366f1', fontSize: 18, opacity: 0.18 }}>
                        #{(selfPage - 1) * selfRemindersPerPage + idx + 1}
                      </div>
                    </li>
                  ))
                )}
              </ul>
              {/* Pagination controls for personal reminders */}
              {totalSelfPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 18 }}>
                  <button
                    onClick={() => setSelfPage(p => Math.max(1, p - 1))}
                    disabled={selfPage === 1}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: selfPage === 1 ? '#e0e7ff' : 'linear-gradient(90deg, #6366f1 80%, #60a5fa 100%)',
                      color: selfPage === 1 ? '#6366f1' : '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: selfPage === 1 ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
                      outline: 'none'
                    }}
                  >Prev</button>
                  <span style={{ fontWeight: 600, color: '#6366f1', fontSize: '1.08rem' }}>Page {selfPage} of {totalSelfPages}</span>
                  <button
                    onClick={() => setSelfPage(p => Math.min(totalSelfPages, p + 1))}
                    disabled={selfPage === totalSelfPages}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: selfPage === totalSelfPages ? '#e0e7ff' : 'linear-gradient(90deg, #6366f1 80%, #60a5fa 100%)',
                      color: selfPage === totalSelfPages ? '#6366f1' : '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: selfPage === totalSelfPages ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
                      outline: 'none'
                    }}
                  >Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeReminders;
