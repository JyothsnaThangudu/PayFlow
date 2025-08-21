package com.payflowapi.service;

import com.payflowapi.entity.Attendance;
import com.payflowapi.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AttendanceService {
    @Autowired
    private AttendanceRepository attendanceRepository;

    public Attendance markAttendance(Long employeeId, boolean present) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today);
        if (attendance == null) {
            attendance = new Attendance(employeeId, today, present);
        } else {
            attendance.setPresent(present);
        }
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getAttendanceForMonth(Long employeeId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, start, end);
    }

    public Attendance getTodayAttendance(Long employeeId) {
        return attendanceRepository.findByEmployeeIdAndDate(employeeId, LocalDate.now());
    }
}
