import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import EmployeeSidebar from '../components/EmployeeSidebar';
import './EmployeeDashboard.css';
import PayslipViewer from './PayslipViewer';
import axios from 'axios';
import { FaUserCircle, FaBuilding, FaBriefcase, FaCalendarAlt, FaEnvelope, FaPhone, FaMoneyBill, FaClipboardList, FaBell } from 'react-icons/fa';

const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState(null);
  const email = localStorage.getItem('userEmail');
  const employeeId = localStorage.getItem("employeeId");
  // Leave state
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveStats, setLeaveStats] = useState({});
  // Payment hold state
  const [paymentHoldStatus, setPaymentHoldStatus] = useState(null);
  // Notification management state (AdminDashboard style)
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [latestPayslipId, setLatestPayslipId] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [performance, setPerformance] = useState(null);
  // Notification logic (AdminDashboard style)
  const getSystemNotifications = () => {
    const notifications = [];
    // Payment hold
    if (paymentHoldStatus && paymentHoldStatus.isOnHold) {
      notifications.push({
        id: 'payment-hold',
        message: `Your payment is currently on hold. Reason: ${paymentHoldStatus.holdReason || 'Administrative review'}`,
        type: 'warning',
        priority: 'high',
        timestamp: paymentHoldStatus.holdDate || new Date(),
        action: 'Contact HR for details'
      });
    }
    // Recent leave status
    leaveHistory.slice(-3).forEach((leave, idx) => {
      let dateText = leave.startDate ? `on ${leave.startDate}` : '';
      notifications.push({
        id: `leave-${leave.leaveId || idx}`,
        message: `${leave.type} leave ${leave.status.toLowerCase()}${dateText ? ' ' + dateText : ''}`,
        type: leave.status === 'ACCEPTED' ? 'success' : (leave.status === 'REJECTED' ? 'warning' : 'info'),
        priority: leave.status === 'ACCEPTED' ? 'low' : 'medium',
        timestamp: leave.endDate || new Date(),
        action: 'View leave details'
      });
    });
  // Do not add upcoming holidays to notifications
    // Recent activities
    recentActivities.slice(0, 3).forEach((activity, idx) => {
      notifications.push({
        id: `activity-${idx}`,
        message: activity.description,
        type: 'info',
        priority: 'low',
        timestamp: activity.date,
        action: 'View activity'
      });
    });
    // Default notification
    if (notifications.length === 0) {
      notifications.push({
        id: 'system-operational',
        message: 'All systems operational',
        type: 'success',
        priority: 'low',
        timestamp: new Date(),
        action: 'Continue monitoring'
      });
    }
    return notifications;
  };

  // Notification action handlers
  const handleDismissNotification = (index) => {
    setDismissedNotifications(prev => new Set([...prev, index]));
  };

  const handleMarkAllAsRead = () => {
    const allIndices = allNotifications.map((_, index) => index);
    setDismissedNotifications(new Set(allIndices));
  };

  const handleViewAllNotifications = () => {
    setShowAllNotifications(true);
  };

  const handleCloseNotificationsModal = () => {
    setShowAllNotifications(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '🔔';
    }
  };

  const getNotificationTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Get notifications and filter out dismissed
  const allNotifications = getSystemNotifications();
  const notifications = allNotifications.filter((_, index) => !dismissedNotifications.has(index));
  const notificationMessages = notifications.map(notif => notif.message);
  const unreadCount = notifications.length;

// Fetch latest payslip ID for the logged-in employee
useEffect(() => {
  const fetchPayslipId = async () => {
    // const employeeId = localStorage.getItem("employeeId");
    try {
      const res = await fetch(
        `http://localhost:8080/api/ctc-management/payslip/employee/${employeeId}`
      );
      if (!res.ok) throw new Error("Failed to fetch payslip list");
      const payslips = await res.json();

      if (payslips.length > 0) {
        // assuming backend returns sorted list
        setLatestPayslipId(payslips[0].payslipId);
      }
    } catch (err) {
      console.error("Error fetching payslip ID:", err);
    }
  };

  fetchPayslipId();
}, [employeeId]);

const [employeePayslip, setEmployeePayslip] = useState(null);

useEffect(() => {
  const fetchEmployeePayslip = async () => {
    try {
      const empId = localStorage.getItem("employeeId");
      if (!empId) return;

      const res = await fetch(`http://localhost:8080/api/ctc-management/payslip/employee/${empId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setEmployeePayslip(data[0]); // Take the first payslip
      }
    } catch (error) {
      console.error("Error fetching employee payslip:", error);
    }
  };

  fetchEmployeePayslip();
}, []);





const handleFetchPayslip = async (payslipId) => {
    try {
      // Fetch payslip JSON from backend
      const res = await fetch(
        `http://localhost:8080/api/ctc-management/payslip/download/${payslipId}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch payslip. Status: ${res.status}`);
      }

      const data = await res.json();
      const { payslip: fullPayslip, employee } = data;
      console.log("Employee", employee)
      // Initialize PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Outer border
      doc.setLineWidth(1.5);
      doc.rect(15, 15, pageWidth - 30, 250);

      // Header with logo
      doc.setLineWidth(1);
      doc.rect(15, 15, pageWidth - 30, 50);
      doc.setFillColor(70, 130, 180);
      doc.rect(25, 25, 25, 30, "F");
      doc.setTextColor(0,0,0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.setFillColor(230, 230, 230); // light gray background
      doc.rect(25, 25, 25, 25, "F");
      doc.setTextColor(0, 0, 0);
      doc.text("PFS", 37, 42, { align: "center" });



      // Company details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text("PayFlow Solutions", pageWidth / 2, 35, { align: "center" });
      doc.setFontSize(9);
      doc.text(
        "123 Business District, Tech City, State - 123456",
        pageWidth / 2,
        45,
        { align: "center" }
      );
      doc.setFontSize(12);
      
      doc.text(
        `Pay Slip for ${fullPayslip.cycle || "August 2025"}`,
        pageWidth / 2,
        57,
        { align: "center" }
      );

      const employeeDetails = [
        ["Employee ID", fullPayslip.employeeId?.toString() || "-", "UAN", "-"],
        ["Employee Name", employee?.fullName || "-", "PF No.", "-"],
        ["Designation", employee?.role || "-", "ESI No.", "-"],
        ["Department", employee?.department || "-", "Bank", "-"],
        ["Date of Joining", employee?.joiningDate || "-", "Account No.", "-"],
      ];

      doc.autoTable({
        startY: 75,
        body: employeeDetails,
        theme: "grid",
        styles: {
          fontSize: 10,
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.5,          // Border thickness
    lineColor: [0, 0, 0]   
        //   fillColor: [240, 240, 240],
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: "bold" },
          1: { cellWidth: 45 },
          2: { cellWidth: 40, fontStyle: "bold" },
          3: { cellWidth: 45 },
        },
        margin: { left: 20, right: 20 },
      });

      // Working days section
      let startY = doc.lastAutoTable.finalY + 2;
      const workingDaysData = [
        ["Gross Wages", `₹${fullPayslip.grossSalary || 0}`, "", ""],
        ["Total Working Days", fullPayslip.workingDays?.toString() || "-", "Leaves", fullPayslip.leaveDays?.toString() || "0"],
        ["LOP Days", "-", "Paid Days", fullPayslip.presentDays?.toString() || "-"],
      ];
      doc.autoTable({
        startY,
        body: workingDaysData,
        theme: "grid",
        styles: {
          fontSize: 10,
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.5,          // Border thickness
    lineColor: [0, 0, 0]
        //   fillColor: [240, 240, 240],
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: "bold" },
          1: { cellWidth: 45 },
          2: { cellWidth: 40, fontStyle: "bold" },
          3: { cellWidth: 45 },
        },
        margin: { left: 20, right: 20 },
      });

      // Earnings / Deductions header
      startY = doc.lastAutoTable.finalY + 2;
      doc.autoTable({
        startY,
        body: [["Earnings", "", "Deductions", ""]],
        theme: "grid",
        styles: {
          fontSize: 10,
          fontStyle: "bold",
          halign: "center",
          fillColor: [240, 240, 240],
          lineWidth: 0.5,          // Border thickness
      lineColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 45 },
          2: { cellWidth: 40 },
          3: { cellWidth: 45 },
        },
        margin: { left: 20, right: 20 },
      });

      // Earnings / Deductions details
      startY = doc.lastAutoTable.finalY;
      const earningsDeductionsData = [
        ["Basic", `₹${fullPayslip.basicSalary || 0}`, "EPF", `₹${fullPayslip.pfDeduction || 0}`],
        ["HRA", `₹${fullPayslip.hra || 0}`, "Tax", `₹${fullPayslip.taxDeduction || 0}`],
        ["Allowances", `₹${fullPayslip.allowances || 0}`, "Other Deductions", `₹${fullPayslip.otherDeductions || 0}`],
        ["Bonuses", `₹${fullPayslip.bonuses || 0}`, "", ""],
      ];
      doc.autoTable({
        startY,
        body: earningsDeductionsData,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.5,          // Border thickness
     lineColor: [0, 0, 0]    },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 45, halign: "center" },
          2: { cellWidth: 40 },
          3: { cellWidth: 45, halign: "center" },
        },
        margin: { left: 20, right: 20 },
      });

      // Totals row
      startY = doc.lastAutoTable.finalY;
      doc.autoTable({
        startY,
        body: [["Total Earnings", "₹61,166.67", "Total Deductions", "₹4,533.33"]],
        theme: "grid",
        styles: { fontSize: 9, fontStyle: "bold", fillColor: [245, 245, 245], lineWidth: 0.5,          // Border thickness
      lineColor: [0, 0, 0]   },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 45, halign: "center" },
          2: { cellWidth: 40 },
          3: { cellWidth: 45, halign: "center" },
        },
        margin: { left: 20, right: 20 },
      });

      // Net Salary row
      startY = doc.lastAutoTable.finalY;
      doc.autoTable({
        startY,
        body: [["Net Salary", "₹56,633.34"]],
        theme: "grid",
        styles: {
          fontSize: 11,
          fontStyle: "bold",
          halign: "center",
          
          fillColor: [235, 235, 235],
          lineWidth: 0.5,          // Border thickness
          lineColor: [0, 0, 0]   
        },
        columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 85 } },
        margin: { left: 20, right: 20 },
      });

      // Save the PDF
      doc.save(
        `Payslip-${employee?.fullName || "Employee"}-${
          fullPayslip.cycle || "August-2025"
        }.pdf`
      );
    } catch (error) {
      console.error("Error generating payslip PDF:", error);
      alert("Failed to generate payslip PDF. Please try again.");
    }
  };


//  const [payslipData, setPayslipData] = useState(null);

//   const handleFetchPayslip = async (payslipId) => {
//     try {
//       const res = await fetch(
//         `http://localhost:8080/api/ctc-management/payslip/download/${payslipId}`
//       );

//       if (!res.ok) {
//         throw new Error(`Failed to fetch payslip. Status: ${res.status}`);
//       }

//       const data = await res.json();
//       setPayslipData(data); // This triggers PayslipViewer to run its PDF download logic
//     } catch (err) {
//       console.error("Error fetching payslip:", err);
//     }
//   };
   
    // Example: handleFetchPayslip.js
// const handleFetchPayslip = async () => {
//   try {
//     const response = await fetch("http://localhost:8080/api/employee/payslip/download", {
//       method: "GET",
//     //   headers: {
//     //     "Content-Type": "application/pdf",
//     //   },
//     });

//     if (!response.ok) throw new Error("Failed to fetch payslip");

//     const blob = await response.blob();
//     const url = window.URL.createObjectURL(new Blob([blob]));
//     const link = document.createElement("a");
//     link.href = url;
//     link.setAttribute("download", `Payslip_${new Date().toLocaleString("default", { month: "long" })}.pdf`);
//     document.body.appendChild(link);
//     link.click();
//     link.parentNode.removeChild(link);
//   } catch (error) {
//     console.error(error);
//     alert("Error downloading payslip");
//   }
// };


  const remainingLeaves = Math.max(0, (leaveStats.totalPaidLeaves ?? 0) - (leaveStats.usedPaidLeaves ?? 0));

  useEffect(() => {
    if (email) {
      // Fetch employee details
      axios.get(`http://localhost:8080/api/employee?email=${email}`)
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setEmployee(res.data[0]);
            checkPaymentHoldStatus(res.data[0].id);
          } else if (res.data) {
            setEmployee(res.data);
            checkPaymentHoldStatus(res.data.id);
          }
        })
        .catch(err => console.error('Failed to fetch employee details', err));

      // Fetch leave history
      axios.get(`http://localhost:8080/api/employee/leave/history?email=${email}`)
        .then(res => {
          setLeaveHistory(res.data || []);
        })
        .catch(() => {
          setLeaveHistory([]);
        });

      // Fetch leave statistics
      axios.get(`http://localhost:8080/api/employee/leave/stats?email=${email}`)
        .then(res => {
          setLeaveStats(res.data);
        })
        .catch(err => {
          setLeaveStats({});
        });

      // Fetch upcoming holidays from Google Calendar
      axios
        .get(
          "https://www.googleapis.com/calendar/v3/calendars/en.indian%23holiday%40group.v.calendar.google.com/events?key=AIzaSyBg2vIsbKXDUcVzPJyRIWtCE3lEiy1-Qvo"
        )
        .then((res) => {
          const today = new Date();
          const upcoming = res.data.items.filter((holiday) => {
            const holidayDate = new Date(holiday.start.date);
            return holidayDate >= today;
          });
          setHolidays(upcoming);
        })
        .catch(() => setHolidays([]));

      // Fetch recent activities
      axios.get(`http://localhost:8080/api/employee/activities?employeeId=${employeeId}`)
        .then(res => setRecentActivities(res.data || []))
        .catch(() => setRecentActivities([]));

      // Fetch performance summary
      axios.get(`http://localhost:8080/api/employee/performance?employeeId=${employeeId}`)
        .then(res => setPerformance(res.data))
        .catch(() => setPerformance(null));

      // Dynamic notifications logic
      Promise.all([
        axios.get(`http://localhost:8080/api/payment-hold/status/${employeeId}`),
        axios.get(`http://localhost:8080/api/employee/leave/history?email=${email}`),
        axios.get(`https://www.googleapis.com/calendar/v3/calendars/en.indian%23holiday%40group.v.calendar.google.com/events?key=AIzaSyBg2vIsbKXDUcVzPJyRIWtCE3lEiy1-Qvo`),
        axios.get(`http://localhost:8080/api/employee/activities?employeeId=${employeeId}`)
      ]).then(([holdRes, leaveRes, holidayRes, activityRes]) => {
        const notificationsArr = [];
        // Payment hold
        console.log('Payment Hold API Response:', holdRes.data);
        if (holdRes.data && holdRes.data.isOnHold === true) {
          notificationsArr.push({
            id: 'payment-hold',
            type: 'warning',
            title: 'Payment Hold Notice',
            message: `Your payment is currently on hold. Reason: ${holdRes.data.holdReason || 'Administrative review'}`,
            date: holdRes.data.holdDate,
            priority: 'high'
          });
        } else {
          // If not on hold, log for debugging
          console.log('No payment hold for employee:', employeeId);
        }
        // Recent leave status
        const leaves = leaveRes.data || [];
        leaves.slice(-3).forEach((leave, idx) => {
          notificationsArr.push({
            id: `leave-${leave.leaveId || idx}`,
            type: leave.status === 'ACCEPTED' ? 'success' : (leave.status === 'REJECTED' ? 'warning' : 'info'),
            title: `Leave ${leave.status}`,
            message: `${leave.type} leave ${leave.status.toLowerCase()} on ${leave.startDate}`,
            date: leave.endDate,
            priority: leave.status === 'ACCEPTED' ? 'low' : 'medium'
          });
        });
        // Upcoming holidays
        const today = new Date();
        const holidaysList = (holidayRes.data.items || []).filter((holiday) => {
          const holidayDate = new Date(holiday.start.date);
          return holidayDate >= today;
        });
        holidaysList.slice(0, 3).forEach((holiday, idx) => {
          notificationsArr.push({
            id: `holiday-${idx}`,
            type: 'info',
            title: `Upcoming Holiday`,
            message: `${holiday.summary} on ${holiday.start.date}`,
            date: holiday.start.date,
            priority: 'low'
          });
        });
        // Recent activities
        const activities = activityRes.data || [];
        activities.slice(0, 3).forEach((activity, idx) => {
          notificationsArr.push({
            id: `activity-${idx}`,
            type: 'info',
            title: `Recent Activity`,
            message: activity.description,
            date: activity.date,
            priority: 'low'
          });
        });
  // setNotifications is not needed, notifications are derived dynamically
      }).catch((err) => {
        console.error('Error fetching notifications:', err);
        // No need to setNotifications, notifications are now derived dynamically
      });
    }
  }, [email, employeeId]);

  // Check payment hold status
  const checkPaymentHoldStatus = async (employeeId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/payment-hold/status/${employeeId}`);
      setPaymentHoldStatus(response.data);
    } catch (error) {
      console.error('Error checking payment hold status:', error);
    }
  };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
    <div className="employee-dashboard-layout">
      <EmployeeSidebar />
      <div className="employee-dashboard-content">
        <div className="profile-header" style={{position: 'relative'}}>
          <div className="profile-avatar">
            <FaUserCircle size={72} color="#6366f1" />
          </div>
          <div className="profile-header-info">
            <h2>{employee ? `Welcome ${employee.fullName}!` : 'Welcome!'}</h2>
            {employee && (
              <div className="profile-header-meta">
                <span><FaBuilding /> {employee.department}</span>
                <span><FaBriefcase /> {employee.role}</span>
                <span><FaCalendarAlt /> Joined: {formatDate(employee.joiningDate)}</span>
              </div>
            )}
          </div>
          {/* Notifications Bell - AdminDashboard style */}
          <div className="notification-bell-wrapper" style={{ position: 'absolute', top: 24, right: 32, zIndex: 10000 }}>
            <div className="notification-bell" tabIndex={0} style={{ position: 'relative', cursor: 'pointer', marginLeft: 24, padding: '12px', borderRadius: '50%', transition: 'all 0.3s ease', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', boxShadow: '0 4px 16px rgba(99,102,241,0.15)', border: '1px solid #e0e7ff', zIndex: 10001 }}>
              <FaBell size={26} style={{ color: '#6366f1' }} />
              {notificationMessages.length > 0 && (
                <span className="notification-badge" style={{ position: 'absolute', top: -4, right: -4, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', borderRadius: '50%', fontSize: 12, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, zIndex: 2, boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)', border: '2px solid #fff' }}>{notificationMessages.length}</span>
              )}
              <div className="notifications-dropdown" style={{ position: 'absolute', top: 48, right: 0, width: 340, background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(99,102,241,0.15)', border: '1px solid #e0e7ff', zIndex: 9999, padding: '16px 0', display: 'none' }}>
                <div className="dropdown-header" style={{ padding: '0 24px 8px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#6366f1' }}>Notifications</h4>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    {notificationMessages.length} {notificationMessages.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="notifications-list" style={{ maxHeight: 220, overflowY: 'auto', padding: '8px 24px' }}>
                  {notificationMessages.length === 0 ? (
                    <div className="notification-item empty-state" style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                      <div className="notification-icon" style={{ fontSize: 22 }}>🔔</div>
                      <div className="notification-content">
                        <div className="notification-text" style={{ fontWeight: 600 }}>No new notifications</div>
                        <div className="notification-time" style={{ fontSize: 12 }}>All caught up!</div>
                      </div>
                    </div>
                  ) : (
                    notifications.slice(0, 3).map((note, idx) => {
                      const originalIndex = allNotifications.findIndex(n => n.message === note.message);
                      const fullNotification = allNotifications[originalIndex];
                      return (
                        <div className={`notification-item priority-${fullNotification.priority}`} key={originalIndex} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: idx < 2 ? '1px solid #e5e7eb' : 'none' }}>
                          <div className="notification-icon" style={{ fontSize: 18 }}>{getNotificationIcon(fullNotification.type)}</div>
                          <div className="notification-content" style={{ flex: 1 }}>
                            <div className="notification-text" style={{ fontWeight: 600, color: '#1f2937' }}>{note.message}</div>
                            <div className="notification-time" style={{ fontSize: 12, color: '#64748b' }}>{getNotificationTime(fullNotification.timestamp)}</div>
                          </div>
                          <div className="notification-actions">
                            <button className="action-btn dismiss-btn" title="Dismiss" style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 16, cursor: 'pointer', padding: 0 }} onClick={(e) => { e.stopPropagation(); handleDismissNotification(originalIndex); }}>✕</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="dropdown-footer" style={{ padding: '12px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="view-all-btn" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.12)' }} onClick={handleViewAllNotifications}>View All</button>
                  <button className="mark-read-btn" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: notificationMessages.length === 0 ? 'not-allowed' : 'pointer', opacity: notificationMessages.length === 0 ? 0.6 : 1, boxShadow: '0 2px 8px rgba(239,68,68,0.12)' }} onClick={handleMarkAllAsRead} disabled={notificationMessages.length === 0}>Clear All</button>
                </div>
              </div>
            </div>
            <style>{`
              .notification-bell:hover .notifications-dropdown,
              .notification-bell:focus .notifications-dropdown {
                display: block !important;
                animation: slideDown 0.3s ease-out;
              }
              @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
          {/* Modal for all notifications - improved UI */}
          {showAllNotifications && (
            <div className="notifications-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(60,72,100,0.18)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleCloseNotificationsModal}>
              <div className="notifications-modal" style={{ background: 'white', borderRadius: 20, boxShadow: '0 12px 48px rgba(99,102,241,0.18)', maxWidth: 480, width: '100%', padding: '32px 28px', position: 'relative', animation: 'fadeIn 0.3s' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 18 }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#6366f1', letterSpacing: '0.5px' }}>All Notifications</h2>
                  <button className="close-modal-btn" style={{ background: 'none', border: 'none', fontSize: 22, color: '#ef4444', cursor: 'pointer', fontWeight: 700 }} onClick={handleCloseNotificationsModal}>✕</button>
                </div>
                <div className="modal-content" style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                  {notifications.length === 0 ? (
                    <div className="empty-notifications" style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                      <div className="empty-icon" style={{ fontSize: 28 }}>🔔</div>
                      <h3 style={{ fontWeight: 700, fontSize: 18, margin: '12px 0 4px 0' }}>No Notifications</h3>
                      <p style={{ fontSize: 14 }}>You're all caught up! Check back later for updates.</p>
                    </div>
                  ) : (
                    <div className="notifications-grid" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {notifications.map((notification, index) => {
                        const isDismissed = dismissedNotifications.has(index);
                        return (
                          <div key={notification.id} className={`notification-card ${isDismissed ? 'dismissed' : ''} priority-${notification.priority || 'low'}`} style={{ background: isDismissed ? '#f3f4f6' : 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', borderRadius: 14, boxShadow: '0 2px 8px rgba(99,102,241,0.08)', padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 16, borderLeft: `5px solid ${notification.priority === 'high' ? '#ef4444' : notification.priority === 'medium' ? '#f59e0b' : '#10b981'}` }}>
                            <div className="notification-icon-large" style={{ fontSize: 28, marginRight: 8 }}>{getNotificationIcon(notification.type)}</div>
                            <div className="notification-details" style={{ flex: 1 }}>
                              <div className="notification-title" style={{ fontWeight: 700, fontSize: 16, color: '#1f2937', marginBottom: 2 }}>{notification.title || notification.message}</div>
                              <div className="notification-action" style={{ fontSize: 14, color: '#64748b', marginBottom: 2 }}>{notification.message}</div>
                              <div className="notification-timestamp" style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>{getNotificationTime(notification.timestamp || notification.date)}</div>
                            </div>
                            <div className="card-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                              {!isDismissed ? (
                                <button className="dismiss-card-btn" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(239,68,68,0.12)' }} onClick={() => handleDismissNotification(index)}>Dismiss</button>
                              ) : (
                                <span className="dismissed-label" style={{ color: '#ef4444', fontWeight: 700, fontSize: 13 }}>Dismissed</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
                  <button className="modal-action-btn clear-all" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: notifications.length === 0 ? 'not-allowed' : 'pointer', opacity: notifications.length === 0 ? 0.6 : 1, boxShadow: '0 2px 8px rgba(239,68,68,0.12)' }} onClick={handleMarkAllAsRead} disabled={notifications.length === 0}>Clear All</button>
                  <button className="modal-action-btn close" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.12)' }} onClick={handleCloseNotificationsModal}>Close</button>
                </div>
                <style>{`
                  @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                  }
                `}</style>
              </div>
            </div>
          )}
        </div>

  <div className="dashboard-cards">
          <div className="dashboard-card leave-card">
            <h3><FaClipboardList /> Paid Leaves</h3>
            <p>
              <span style={{ color: '#6366f1' }}>Total: {leaveStats.totalPaidLeaves ?? '-'}</span> | 
              <span style={{ color: 'tomato', marginLeft: '8px' }}>Used: {leaveStats.usedPaidLeaves ?? '-'}</span> | 
              <span style={{ color: '#22c55e', marginLeft: '8px' }}>Remaining: {leaveStats.remainingPaidLeaves ?? '-'}</span>
            </p>
          </div>
          <div className="dashboard-card leave-card">
            <h3><FaClipboardList /> Unpaid Leaves</h3>
            <p>
              <span style={{ color: 'orange' }}>Year Total: {leaveStats.usedUnpaidLeaves ?? '-'}</span> | 
              <span style={{ color: 'red', marginLeft: '8px' }}>This Month: {leaveStats.unpaidLeavesThisMonth ?? '-'}</span>
            </p>
          </div>
          <div className="dashboard-card payroll-card">
            <h3><FaMoneyBill /> Payroll</h3>
            <div className="payroll-info">
              <div><b>Basic Salary:</b> <span style={{ color: '#6366f1' }}>{employeePayslip?.basicSalary ? `₹${employeePayslip.basicSalary}` : "Not Available"}</span></div>
              <div><b>Net Salary:</b> <span style={{ color: '#6366f1' }}>{employeePayslip?.netPay ? `₹${employeePayslip?.netPay}` : "Not Available"}</span></div>
              <button onClick={() => handleFetchPayslip(latestPayslipId)} className="download-payslip-btn">Download Payslip</button>
              {/* Payment On Hold badge removed as requested */}
            </div>
          </div>
          <div className="dashboard-card holidays-card">
            <h3><FaCalendarAlt /> Upcoming Holidays</h3>
            <ul className="holidays-list">
              {holidays.length > 0 ? (
                holidays.slice(0, 3).map((holiday, idx) => (
                  <li key={idx}>
                    <b>{holiday.summary}</b> - {formatDate(holiday.start.date)}
                  </li>
                ))
              ) : (
                <li>No upcoming holidays.</li>
              )}
            </ul>
            {holidays.length > 3 && (
              <button className="quick-link-btn" style={{marginTop: '10px'}} onClick={() => window.location.href='/upcoming-holidays'}>
                Show All
              </button>
            )}
          </div>
          <div className="dashboard-card activities-card">
            <h3><FaClipboardList /> Recent Activities</h3>
            <ul className="activities-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, idx) => (
                  <li key={idx}>
                    <span>{activity.description}</span> <small>{formatDate(activity.date)}</small>
                  </li>
                ))
              ) : (
                <li>No recent activities.</li>
              )}
            </ul>
          </div>
          {performance && (
            <div className="dashboard-card performance-card">
              <h3><FaBriefcase /> Performance</h3>
              <p><b>Rating:</b> {performance.rating ?? '-'}</p>
              <p><b>Feedback:</b> {performance.feedback ?? '-'}</p>
            </div>
          )}
        </div>


        <div className="quick-links">
          <button className="quick-link-btn" onClick={() => window.location.href='/profile'}>Update Profile</button>
          <button className="quick-link-btn" onClick={() => window.location.href='/reset-password'}>Change Password</button>
        </div>
      </div>
    </div>
    );
};

export default EmployeeDashboard;
