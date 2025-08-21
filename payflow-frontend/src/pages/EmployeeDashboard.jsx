import React, { useEffect, useState, useMemo } from 'react';
import UpcomingHolidays from '../components/UpcomingHolidays';
import UpcomingHolidaysModal from '../components/UpcomingHolidaysModal';
import jsPDF from 'jspdf';
import EmployeeSidebar from '../components/EmployeeSidebar';
import './EmployeeDashboard.css';
import PayslipViewer from './PayslipViewer';
import axios from 'axios';
import { FaUserCircle, FaBuilding, FaBriefcase, FaCalendarAlt, FaEnvelope, FaPhone, FaMoneyBill, FaClipboardList, FaBell, FaCheckCircle, FaTimesCircle, FaCalendarCheck } from 'react-icons/fa';

const EmployeeDashboard = () => {
  // Attendance tracking - fetch from backend
  const [attendance, setAttendance] = useState({});
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();

  // Function to fetch attendance
  const fetchAttendance = () => {
    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) return;
    fetch(`http://localhost:8080/api/attendance/month?employeeId=${employeeId}&year=${today.getFullYear()}&month=${today.getMonth()+1}`)
      .then(res => res.json())
      .then(data => {
        console.log('Attendance API response:', data); // Debug log
        if (Array.isArray(data)) {
          data.forEach((record, idx) => {
            console.log(`Attendance record ${idx}:`, record);
          });
        }
        const att = {};
        data.forEach(record => {
          const day = new Date(record.date).getDate();
          att[day] = record.present ? 'present' : 'absent';
        });
        setAttendance(att);
      })
      .catch(() => {
        setAttendance({});
      });
  };

  // Mark today's attendance as present, then reload attendance
  useEffect(() => {
    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) return;
    // Mark attendance for today (send as request params)
    fetch(`http://localhost:8080/api/attendance/mark?employeeId=${employeeId}&present=true`, {
      method: 'POST'
    })
      .then(() => {
        fetchAttendance();
      })
      .catch(() => {
        fetchAttendance();
      });
  }, [localStorage.getItem("employeeId")]);
  const [holidays, setHolidays] = useState([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
    // Fetch upcoming holidays (real, not hardcoded)
    useEffect(() => {
        axios
          .get(
            'https://www.googleapis.com/calendar/v3/calendars/en.indian%23holiday%40group.v.calendar.google.com/events?key=AIzaSyBg2vIsbKXDUcVzPJyRIWtCE3lEiy1-Qvo'
          )
          .then((res) => {
            const today = new Date();
            const upcoming = res.data.items.filter((holiday) => {
              const holidayDate = new Date(holiday.start.date);
              return holidayDate >= today;
            });
            setHolidays(upcoming);
          })
          .catch((err) => console.error('Failed to fetch holidays', err));
    }, []);
  const [employee, setEmployee] = useState(null);
  const email = localStorage.getItem('userEmail');
  const employeeId = localStorage.getItem("employeeId");

    const [reminders, setReminders] = useState([]);
    // Leave state
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [leaveStats, setLeaveStats] = useState({
        totalPaidLeaves: 12,
        usedPaidLeaves: 0,
        remainingPaidLeaves: 12,
        usedUnpaidLeaves: 0,
        unpaidLeavesThisMonth: 0,
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear()
    });

    // Payment hold state
    const [paymentHoldStatus, setPaymentHoldStatus] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const totalLeaves = 12;

    const usedLeaves = useMemo(() => {
        return leaveHistory.filter(l => l.status === 'ACCEPTED').reduce((total, leave) => {
            if (leave.leaveDays) {
                return total + leave.leaveDays;
            } else if (leave.fromDate && leave.toDate) {
                const days = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
                return total + days;
            }
            return total;
        }, 0);
    }, [leaveHistory]);

    const [latestPayslipId, setLatestPayslipId] = useState(null);

// Fetch latest payslip ID for the logged-in employee
useEffect(() => {
  const fetchPayslipId = async () => {
  const employeeId = localStorage.getItem("employeeId");
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





    const remainingLeaves = Math.max(0, totalLeaves - leaveStats.usedPaidLeaves);

    useEffect(() => {
        if (email) {
            // Fetch employee details
            axios.get(`http://localhost:8080/api/employee?email=${email}`)
                .then(res => {
                    let emp = null;
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        emp = res.data[0];
                        setEmployee(emp);
                        checkPaymentHoldStatus(emp.id);
                    } else if (res.data) {
                        emp = res.data;
                        setEmployee(emp);
                        checkPaymentHoldStatus(emp.id);
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
                    console.error('Failed to fetch leave stats', err);
                });
        }
    }, [email]);

    useEffect(() => {
        if (employee && employee.id) {
            axios.get(`http://localhost:8080/api/reminders/employee/${employee.id}`)
                .then(remRes => {
                    setReminders(remRes.data || []);
                    console.log('Fetched reminders for employee:', employee.id, remRes.data);
                })
                .catch(err => {
                    setReminders([]);
                    console.error('Error fetching reminders for employee:', employee.id, err);
                });
        }
    }, [employee]);

    // Check payment hold status
    const checkPaymentHoldStatus = async (employeeId) => {
        try {
            const response = await axios.get(`/api/payment-hold/status/${employeeId}`);
            setPaymentHoldStatus(response.data);
            
            // Add payment hold notification if exists
            if (response.data.isOnHold) {
                const holdNotification = {
                    id: 'payment-hold',
                    type: 'warning',
                    title: 'Payment Hold Notice',
                    message: `Your payment is currently on hold. Reason: ${response.data.holdReason || 'Administrative review'}`,
                    date: response.data.holdDate,
                    priority: 'high'
                };
                setNotifications(prev => [holdNotification, ...prev]);
            }
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
                <div className="profile-header">
                    <div className="profile-avatar">
                        <FaUserCircle size={80} color="#fff" />
                    </div>
                    <div className="profile-header-info">
                        <h2>{employee ? `Welcome, ${employee.fullName}` : 'Welcome!'}</h2>
                        {employee && (
                            <div className="profile-header-meta">
                                <span><FaBuilding /> {employee.department}</span>
                                <span><FaBriefcase /> {employee.role}</span>
                                <span><FaCalendarAlt /> Joined: {employee.joiningDate}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* First row: Leave Summary & Payroll & Attendance */}
                <div className="dashboard-cards">
                  <div className="dashboard-card leave-card" style={{marginRight: '64px'}}>
                    <h3><FaClipboardList /> Leave Summary</h3>
                    <div>
                      <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: '#6366f1', fontWeight: 600 }}>Paid:</span>
                          <span style={{ color: '#6366f1' }}>Total: {leaveStats.totalPaidLeaves}</span>
                          <span style={{ color: 'tomato' }}>Used: {leaveStats.usedPaidLeaves}</span>
                          <span style={{ color: '#22c55e' }}>Remaining: {leaveStats.remainingPaidLeaves}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: 'orange', fontWeight: 600 }}>Unpaid:</span>
                          <span>Year: {leaveStats.usedUnpaidLeaves}</span>
                          <span style={{ color: 'red' }}>This Month: {leaveStats.unpaidLeavesThisMonth}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', marginTop: '8px' }}>
                        After using all paid leaves, additional requests will be unpaid.
                      </p>
                    </div>
                  </div>
                  <div className="dashboard-card payroll-card" style={{marginRight: '64px'}}>
                    <h3><FaMoneyBill /> Payroll</h3>
                    <div>
                      {paymentHoldStatus && paymentHoldStatus.isOnHold ? (
                        <div className="payment-hold-alert">
                          <div className="hold-status">
                            <span className="hold-badge">⏸️ Payment On Hold</span>
                            <p><b>Reason:</b> {paymentHoldStatus.holdReason || 'Administrative review'}</p>
                            <p><b>Hold Date:</b> {formatDate(paymentHoldStatus.holdDate)}</p>
                            <small>Please contact HR for more information.</small>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 600 }}>Basic Salary:</span>
                            <span style={{ color: '#6366f1', fontWeight: 600 }}>
                              {employeePayslip?.netPay ? `₹${employeePayslip.basicSalary}` : "Not Available"}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 600 }}>Net Salary:</span>
                            <span style={{ color: '#22c55e', fontWeight: 600 }}>
                              {employeePayslip?.netPay ? `₹${employeePayslip.netPay}` : "Not Available"}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 600 }}>Payment Status:</span>
                            <span style={{ color: employeePayslip?.status === 'Paid' ? '#22c55e' : '#f59e42', fontWeight: 600 }}>
                              {employeePayslip?.status ? employeePayslip.status : 'Pending'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 600 }}>Next Scheduled Payment:</span>
                            <span style={{ color: '#6366f1', fontWeight: 600 }}>
                              {employeePayslip?.nextPaymentDate
                                ? formatDate(employeePayslip.nextPaymentDate)
                                : (() => {
                                    const now = new Date();
                                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                                    return formatDate(lastDay);
                                  })()
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Attendance Tracking Card */}
                  <div className="dashboard-card attendance-card">
                    <h3><FaCalendarCheck /> Attendance</h3>
                    <div style={{ marginBottom: '10px', fontWeight: 600 }}>
                      Today's Status: {
                        attendance.hasOwnProperty(currentDay)
                          ? attendance[currentDay] === 'present'
                            ? (<span style={{ color: '#22c55e', display: 'inline-flex', alignItems: 'center' }}><FaCheckCircle style={{marginRight: 4}}/> Present</span>)
                            : (<span style={{ color: 'tomato', display: 'inline-flex', alignItems: 'center' }}><FaTimesCircle style={{marginRight: 4}}/> Absent</span>)
                          : (<span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center' }}><FaCalendarAlt style={{marginRight: 4}}/> Not Marked</span>)
                      }
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                      {Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => {
                        let status = attendance.hasOwnProperty(day) ? attendance[day] : 'not-marked';
                        let style = {
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          margin: '1px',
                        };
                        if (status === 'present') {
                          style.background = '#22c55e';
                          style.color = '#fff';
                          style.border = '2px solid #22c55e';
                          style.boxShadow = '0 2px 6px rgba(34,197,94,0.12)';
                        } else if (status === 'absent') {
                          style.background = '#e5e7eb';
                          style.color = 'tomato';
                          style.border = '2px solid tomato';
                        } else {
                          style.background = '#e5e7eb';
                          style.color = '#64748b';
                          style.border = '2px solid #e5e7eb';
                        }
                        return (
                          <span key={day} style={style} title={`Day ${day}: ${status}`}>{day}</span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Second row: Upcoming Holidays & Reminders */}
                <div className="dashboard-cards">
                  <div className="dashboard-card holidays-card" style={{marginRight: '64px'}}>
                    <h3><FaCalendarAlt /> Upcoming Holidays</h3>
                    <ul className="holidays-list">
                      {holidays.length > 0 ? (
                        holidays.slice(0, 2).map((holiday, idx) => (
                          <li key={idx} className="holiday-item">
                            <strong>{holiday.summary}</strong>
                            <span style={{ marginLeft: '10px', color: '#6366f1', fontWeight: 500 }}>{formatDate(holiday.start.date)}</span>
                          </li>
                        ))
                      ) : (
                        <li style={{ color: '#64748b', fontStyle: 'italic' }}>No upcoming holidays found.</li>
                      )}
                    </ul>
                    {holidays.length > 2 && (
                      <button className="quick-link-btn" onClick={() => setShowHolidayModal(true)}>View All</button>
                    )}
                  </div>
                  <div className="dashboard-card reminders-card">
                    <h3><FaBell /> Reminders</h3>
                    <ul className="reminders-list">
                      {reminders.length > 0 ? (
                        reminders.slice(0, 2).map(rem => (
                          <li key={rem.id} className="reminder-item">
                            <div className="reminder-content">
                              <strong>{rem.text}</strong>
                              <p style={{ color: '#6366f1', fontWeight: 500 }}>Date: {formatDate(rem.date)} | Time: {rem.time}</p>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li style={{ color: '#64748b', fontStyle: 'italic' }}>No reminders from your manager.</li>
                      )}
                    </ul>
                    {reminders.length > 2 && (
                      <button className="quick-link-btn" onClick={() => window.location.href = '/employee-reminders'}>View All</button>
                    )}
                  </div>
                </div>

                <div className="quick-links">
                  {/* Holidays Modal */}
                  {showHolidayModal && (
                    <UpcomingHolidaysModal
                      isOpen={showHolidayModal}
                      onClose={() => setShowHolidayModal(false)}
                      holidays={holidays}
                    />
                  )}
                </div>
            </div>
        </div>
    );

}
export default EmployeeDashboard;
