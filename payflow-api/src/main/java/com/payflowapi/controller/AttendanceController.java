package com.payflowapi.controller;

import com.payflowapi.entity.Attendance;
import com.payflowapi.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/mark")
    public Attendance markAttendance(@RequestParam Long employeeId, @RequestParam boolean present) {
        return attendanceService.markAttendance(employeeId, present);
    }

    @GetMapping("/month")
    public List<Attendance> getAttendanceForMonth(@RequestParam Long employeeId, @RequestParam int year,
            @RequestParam int month) {
        return attendanceService.getAttendanceForMonth(employeeId, year, month);
    }

    @GetMapping("/today")
    public Attendance getTodayAttendance(@RequestParam Long employeeId) {
        return attendanceService.getTodayAttendance(employeeId);
    }
}
