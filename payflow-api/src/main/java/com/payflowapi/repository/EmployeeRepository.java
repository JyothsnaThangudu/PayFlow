package com.payflowapi.repository;

import com.payflowapi.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // Find employee by email
    Optional<Employee> findByEmail(String email);

    // Find employees by manager ID
    List<Employee> findByManagerId(Long managerId);

    // Find employees by joining date after a specific date
    List<Employee> findByJoiningDateAfter(LocalDate date);
}
