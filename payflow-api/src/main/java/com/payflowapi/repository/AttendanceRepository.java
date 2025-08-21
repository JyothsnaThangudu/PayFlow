package com.payflowapi.repository;

import com.payflowapi.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByEmployeeId(Long employeeId);

    List<Attendance> findByEmployeeIdAndDateBetween(Long employeeId, LocalDate start, LocalDate end);

    Attendance findByEmployeeIdAndDate(Long employeeId, LocalDate date);
}
