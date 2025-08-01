package com.payflowapi.controller;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import com.payflowapi.dto.EmployeeDto;
import com.payflowapi.dto.LeaveRequestDto;
import com.payflowapi.entity.Employee;
import com.payflowapi.entity.Project;
import com.payflowapi.entity.EmployeeLeave;
import com.payflowapi.repository.EmployeeRepository;
import com.payflowapi.entity.User;
import com.payflowapi.repository.UserRepository;
import com.payflowapi.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import java.security.SecureRandom;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/employee")
@CrossOrigin(origins = "http://localhost:3000") // Allow frontend access
public class EmployeeController {
    // Accept/Deny leave request and send email notification
    @PostMapping("/leave/{leaveId}/action")
    public ResponseEntity<String> handleLeaveAction(@PathVariable Long leaveId, @RequestBody Map<String, String> body) {
        String action = body.get("action"); // ACCEPT or DENY
        String denialReason = body.get("reason"); // Only for DENY
        EmployeeLeave leave = employeeLeaveRepository.findById(leaveId).orElse(null);
        if (leave == null)
            return ResponseEntity.badRequest().body("Leave request not found");
        if ("ACCEPT".equalsIgnoreCase(action)) {
            leave.setStatus("ACCEPTED");
            employeeLeaveRepository.save(leave);
            // Send email to employee
            Employee emp = employeeRepository.findById(leave.getEmployeeId()).orElse(null);
            if (emp != null) {
                emailService.sendNotificationEmail(
                        emp.getEmail(),
                        "Leave Request Accepted",
                        "Hello " + emp.getFullName() + ",\n\nYour leave request has been accepted.\n" +
                                "Type: " + leave.getType() + "\n" +
                                "From: " + leave.getFromDate() + "\n" +
                                "To: " + leave.getToDate() + "\n" +
                                (leave.getReason() != null && !leave.getReason().isEmpty()
                                        ? ("Reason: " + leave.getReason() + "\n")
                                        : "")
                                +
                                "\n- PayFlow Team");
            }
            return ResponseEntity.ok("Leave accepted and email sent");
        } else if ("DENY".equalsIgnoreCase(action)) {
            leave.setStatus("DENIED");
            leave.setDenialReason(denialReason); // Store manager's denial reason
            employeeLeaveRepository.save(leave);
            // Send email to employee with both reasons
            Employee emp = employeeRepository.findById(leave.getEmployeeId()).orElse(null);
            if (emp != null) {
                StringBuilder denialMsg = new StringBuilder();
                denialMsg.append("Hello ").append(emp.getFullName())
                        .append(",\n\nYour leave request has been denied.\n");
                denialMsg.append("Type: ").append(leave.getType()).append("\n");
                denialMsg.append("From: ").append(leave.getFromDate()).append("\n");
                denialMsg.append("To: ").append(leave.getToDate()).append("\n");
                if (leave.getReason() != null && !leave.getReason().isEmpty()) {
                    denialMsg.append("Your Reason: ").append(leave.getReason()).append("\n");
                }
                if (denialReason != null && !denialReason.isEmpty()) {
                    denialMsg.append("Manager's Denial Reason: ").append(denialReason).append("\n");
                }
                denialMsg.append("\n- PayFlow Team");
                emailService.sendNotificationEmail(
                        emp.getEmail(),
                        "Leave Request Denied",
                        denialMsg.toString());
            }
            return ResponseEntity.ok("Leave denied and email sent");
        }
        return ResponseEntity.badRequest().body("Invalid action");
    }

    // List all employees and their managerId for verification
    @GetMapping("/all-employees")
    public List<Employee> getAllEmployeesWithManagerId() {
        return employeeRepository.findAll();
    }

    // FIX: Update all leave requests with correct managerId from employee table
    @PostMapping("/leaves/fix-manager-ids")
    public String fixLeaveManagerIds() {
        List<EmployeeLeave> leaves = employeeLeaveRepository.findAll();
        int updated = 0;
        for (EmployeeLeave leave : leaves) {
            Employee emp = employeeRepository.findById(leave.getEmployeeId()).orElse(null);
            if (emp != null && (leave.getManagerId() == null || !leave.getManagerId().equals(emp.getManagerId()))) {
                leave.setManagerId(emp.getManagerId());
                employeeLeaveRepository.save(leave);
                updated++;
            }
        }
        return "Updated managerId for " + updated + " leave requests.";
    }

    // DEBUG: List all leave requests and their managerId
    @GetMapping("/leaves/all")
    public List<EmployeeLeave> getAllLeaves() {
        return employeeLeaveRepository.findAll();
    }

    // Endpoint to get leave history for an employee
    @GetMapping("/leave/history")
    public List<EmployeeLeave> getLeaveHistory(@RequestParam String email) {
        Employee employee = employeeRepository.findByEmail(email).orElse(null);
        if (employee == null) {
            return List.of();
        }
        return employeeLeaveRepository.findByEmployeeId(employee.getId());
    }

    // Endpoint to apply for leave
    @PostMapping("/leave/apply")
    public ResponseEntity<?> applyForLeave(@RequestBody LeaveRequestDto dto) {
        // Find employee by email
        Employee employee = employeeRepository.findByEmail(dto.getEmail()).orElse(null);
        if (employee == null) {
            return ResponseEntity.badRequest().body("Employee not found");
        }

        // Parse dates
        java.time.LocalDate fromDate = java.time.LocalDate.parse(dto.getStartDate());
        java.time.LocalDate toDate = java.time.LocalDate.parse(dto.getEndDate());

        // Validate date range
        if (fromDate.isAfter(toDate)) {
            return ResponseEntity.badRequest().body("Start date cannot be after end date");
        }

        // Calculate days requested
        long daysRequested = java.time.temporal.ChronoUnit.DAYS.between(fromDate, toDate) + 1;

        // Check leave balance - count accepted leaves for this employee
        List<EmployeeLeave> acceptedLeaves = employeeLeaveRepository.findByEmployeeIdAndStatus(employee.getId(),
                "ACCEPTED");
        long usedLeaves = 0;
        for (EmployeeLeave leave : acceptedLeaves) {
            if (leave.getFromDate() != null && leave.getToDate() != null) {
                usedLeaves += java.time.temporal.ChronoUnit.DAYS.between(leave.getFromDate(), leave.getToDate()) + 1;
            }
        }

        final int TOTAL_ANNUAL_LEAVES = 12;
        long remainingLeaves = TOTAL_ANNUAL_LEAVES - usedLeaves;

        // Check if employee has any remaining leaves
        if (remainingLeaves <= 0) {
            return ResponseEntity.badRequest().body("You have no remaining leaves. You have already used all "
                    + TOTAL_ANNUAL_LEAVES + " annual leaves.");
        }

        // Check if requested days exceed remaining leaves
        if (daysRequested > remainingLeaves) {
            return ResponseEntity.badRequest().body("You are requesting " + daysRequested + " days but only have "
                    + remainingLeaves + " leaves remaining.");
        }

        // Check for overlapping leave requests
        List<EmployeeLeave> overlappingLeaves = employeeLeaveRepository.findOverlappingLeaves(
                employee.getId(), fromDate, toDate);

        if (!overlappingLeaves.isEmpty()) {
            StringBuilder conflictMessage = new StringBuilder("Leave request conflicts with existing leave(s): ");
            for (EmployeeLeave existing : overlappingLeaves) {
                conflictMessage.append(existing.getFromDate().toString())
                        .append(" to ")
                        .append(existing.getToDate().toString())
                        .append(" (")
                        .append(existing.getStatus())
                        .append("), ");
            }
            // Remove trailing comma and space
            String message = conflictMessage.toString();
            if (message.endsWith(", ")) {
                message = message.substring(0, message.length() - 2);
            }
            return ResponseEntity.badRequest().body(message);
        }

        // Create new leave request
        EmployeeLeave leave = new EmployeeLeave();
        leave.setEmployeeId(employee.getId());
        leave.setManagerId(employee.getManagerId());
        leave.setEmployeeName(employee.getFullName());
        leave.setType(dto.getType());
        leave.setFromDate(fromDate);
        leave.setToDate(toDate);
        leave.setReason(dto.getReason());
        leave.setStatus("PENDING");

        EmployeeLeave savedLeave = employeeLeaveRepository.save(leave);
        return ResponseEntity.ok(savedLeave);
    }

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.payflowapi.repository.EmployeeLeaveRepository employeeLeaveRepository;

    @Autowired
    private com.payflowapi.repository.ProjectRepository projectRepository;

    @PostMapping("/onboard")
    public Employee onboardEmployee(@RequestBody EmployeeDto dto) {
        Employee employee = new Employee();

        // Personal & Contact Info
        employee.setFullName(dto.getFullName());
        employee.setDob(dto.getDob());
        employee.setGender(dto.getGender());
        employee.setAddress(dto.getAddress());
        employee.setEmail(dto.getEmail());
        employee.setPhone(dto.getPhone());
        employee.setEmergencyContact(dto.getEmergencyContact());

        // Education
        employee.setQualification(dto.getQualification());
        employee.setInstitution(dto.getInstitution());
        employee.setGraduationYear(dto.getGraduationYear());
        employee.setSpecialization(dto.getSpecialization());

        // Job & Work Info
        employee.setDepartment(dto.getDepartment());
        employee.setRole(dto.getRole());
        // employee.setJoiningDate(dto.getJoiningDate());
        if (dto.getJoiningDate() != null && !dto.getJoiningDate().isBlank()) {
            try {
                employee.setJoiningDate(LocalDate.parse(dto.getJoiningDate())); // expects "yyyy-MM-dd"
            } catch (DateTimeParseException e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid joiningDate format. Expected yyyy-MM-dd.",
                        e);
            }
        }
        employee.setManagerId(dto.getManagerId());

        employee.setHasExperience(dto.getHasExperience());
        // Map experiences from DTO to entity
        if (dto.getExperiences() != null && !dto.getExperiences().isEmpty()) {
            java.util.List<Employee.Experience> expList = new java.util.ArrayList<>();
            for (EmployeeDto.ExperienceDto expDto : dto.getExperiences()) {
                Employee.Experience exp = new Employee.Experience();
                exp.setYears(expDto.getYears());
                exp.setRole(expDto.getRole());
                exp.setCompany(expDto.getCompany());
                expList.add(exp);
            }
            employee.setExperiences(expList);
        }

        // Skills & Certifications
        employee.setCertifications(dto.getCertifications());
        employee.setSkills(dto.getSkills());
        employee.setLanguages(dto.getLanguages());

        Employee savedEmployee = employeeRepository.save(employee);

        // --- Create User credentials for the employee ---
        // Generate a random 8-character password
        String defaultPassword = generateRandomPassword(8);

        User user = new User();
        user.setName(employee.getFullName());
        user.setUsername(employee.getEmail());
        user.setPassword(defaultPassword); // In production, hash this!
        user.setRole("EMPLOYEE");
        user.setFirstLogin(true);
        user.setActive(true);
        userRepository.save(user);

        // Send credentials to employee's email asynchronously
        new Thread(() -> {
            emailService.sendUserCredentials(employee.getEmail(), employee.getEmail(), defaultPassword);
        }).start();

        return savedEmployee;
    }

    // Helper to generate a random password
    private String generateRandomPassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
        SecureRandom rnd = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++)
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        return sb.toString();
    }

    // --- Manager Dashboard Endpoints ---

    // 1. Get team members for a manager
    @GetMapping("/manager/{managerId}/team")
    public List<Employee> getTeamByManager(@PathVariable Long managerId) {
        return employeeRepository.findByManagerId(managerId);
    }

    // 2. Get leave requests for a manager's team
    @GetMapping("/manager/{managerId}/leaves")
    public List<EmployeeLeave> getTeamLeaves(@PathVariable Long managerId) {
        // Debug log
        System.out.println("Fetching leaves for managerId: " + managerId);
        List<EmployeeLeave> leaves = employeeLeaveRepository.findByManagerId(managerId);
        System.out.println("Found leaves: " + leaves.size());
        return leaves;
    }

    // 3. Get projects managed by a manager
    @GetMapping("/manager/{managerId}/projects")
    public List<Project> getProjectsByManager(@PathVariable Long managerId) {
        // This assumes you have ProjectRepository and Project entity with managerId
        return projectRepository.findByManagerId(managerId);
    }

    @GetMapping
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    // Endpoint to get employee by email
    @GetMapping(params = "email")
    public Employee getEmployeeByEmail(@RequestParam String email) {
        return employeeRepository.findByEmail(email).orElse(null);
    }

    // Endpoint to get the count of employees
    @GetMapping("/count")
    public long getEmployeeCount() {
        return employeeRepository.count();
    }
}