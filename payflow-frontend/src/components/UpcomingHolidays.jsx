import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeSidebar from "../components/EmployeeSidebar";
import "./UpcomingHolidays.css";

export default function UpcomingHolidays() {
  const [holidays, setHolidays] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
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
      .catch((err) => console.error(err));
  }, []);

  // Pagination calculations
  const indexOfLastHoliday = currentPage * rowsPerPage;
  const indexOfFirstHoliday = indexOfLastHoliday - rowsPerPage;
  const currentHolidays = holidays.slice(indexOfFirstHoliday, indexOfLastHoliday);
  const totalPages = Math.ceil(holidays.length / rowsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div style={{ display: "flex" }}>
      <EmployeeSidebar />
      <div className="content-area">
        <div className="holidays-section">
          <h2>Upcoming Public Holidays in India</h2>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '18px' }}>
            <label style={{ fontWeight: 500, color: '#6366f1', marginRight: '12px' }}>
              Rows per page:
            </label>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
            >
              {[5, 10, 20, 50].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <table className="holidays-table">
            <thead>
              <tr>
                <th>Holiday</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentHolidays.map((holiday, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 500, color: '#6366f1' }}>{holiday.summary}</td>
                  <td style={{ color: '#334155' }}>{holiday.start.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-controls">
            <button onClick={handlePrev} disabled={currentPage === 1}>
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={handleNext} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
