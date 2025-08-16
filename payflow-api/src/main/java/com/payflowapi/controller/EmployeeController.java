package com.payflowapi.controller;
import com.payflowapi.util.PdfGenerator;

import com.payflowapi.entity.Payslip;
import com.payflowapi.service.PayslipService;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;

import java.io.ByteArrayOutputStream;
import java.util.Optional;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Locale;


import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.payflowapi.service.PayslipService;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Locale;
import java.util.ArrayList;
import java.util.HashMap;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import com.payflowapi.dto.EmployeeDto;
import com.payflowapi.dto.EmployeeUpdateDto;
import com.payflowapi.dto.LeaveRequestDto;
import com.payflowapi.dto.LeaveStatsDto;
import com.payflowapi.entity.Employee;
import com.payflowapi.entity.Project;
import com.payflowapi.entity.EmployeeLeave;
import com.payflowapi.entity.EmployeePositionHistory;
import com.payflowapi.repository.EmployeeRepository;
import com.payflowapi.repository.EmployeePositionHistoryRepository;
import com.payflowapi.entity.User;
import com.payflowapi.repository.UserRepository;
import com.payflowapi.service.EmailService;
import com.payflowapi.service.LeaveService;
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


    @Autowired
    private PayslipService payslipService;

    @GetMapping("/ping")
public String ping() {
    return "pong";
}


@GetMapping("/payslip/download/{employeeId}")
public ResponseEntity<Resource> downloadEmployeePayslip(@PathVariable Long employeeId) {
    // Get current month and year
    LocalDate now = LocalDate.now();
    String month = now.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    int year = now.getYear();

    // Example: fetch from service (replace with your logic)
    byte[] fileData = payslipService.getEmployeePayslip(employeeId, month, year);

    if (fileData == null || fileData.length == 0) {
        return ResponseEntity.notFound().build();
    }

    // Convert to Resource
    Resource resource = new ByteArrayResource(fileData);

    return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payslip_" + month + "_" + year + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(resource);
}


// @GetMapping("/payslip/download/{employeeId}")
// public ResponseEntity<String> downloadEmployeePayslip(@PathVariable Long employeeId) {
//     return ResponseEntity.ok("Payslip for employee ID: " + employeeId);
// }


//  @GetMapping("/payslip/download/{employeeId}")
//     public ResponseEntity<Resource> downloadEmployeePayslip(@PathVariable Long employeeId) {

//         // Get current month and year
//         LocalDate now = LocalDate.now();
//         String month = now.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
//         int year = now.getYear();

//         // Fetch payslip file as byte[]
//         byte[] fileData = payslipService.getEmployeePayslip(employeeId, month, year);

//         if (fileData == null || fileData.length == 0) {
//             return ResponseEntity.notFound().build();
//         }

//         // Return as downloadable PDF
//         Resource resource = new ByteArrayResource(fileData);

//         return ResponseEntity.ok()
//                 .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payslip_" + month + "_" + year + ".pdf")
//                 .contentType(MediaType.APPLICATION_PDF)
//                 .body(resource);
//     }



   @GetMapping("/payslip/download")
    public ResponseEntity<Resource> downloadCurrentMonthPayslip() {
        Long employeeId = getCurrentEmployeeId();
        String currentMonth = getCurrentMonth();
        int currentYear = LocalDate.now().getYear();

        Optional<Payslip> optionalPayslip = payslipService.getPayslipForEmployee(employeeId, currentMonth, currentYear);

        if (optionalPayslip.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Payslip payslip = optionalPayslip.get();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfGenerator.generatePayslipPDF(payslip, baos);

        ByteArrayResource resource = new ByteArrayResource(baos.toByteArray());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"Payslip_" + currentMonth + "_" + currentYear + ".pdf\"")
                .body(resource);
    }

    // Helper methods
    private Long getCurrentEmployeeId() {
        return 1L; // Replace with actual logged-in employee ID logic
    }

    private String getCurrentMonth() {
        return LocalDate.now().getMonth().name();
    }


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



    @GetMapping("/leaves/{employeeId}")
    public ResponseEntity<List<EmployeeLeave>> getLeavesByEmployee(@PathVariable Long employeeId) {
        List<EmployeeLeave> leaves = leaveService.getLeavesByEmployee(employeeId);
        return ResponseEntity.ok(leaves);
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

    // FIX: Migrate existing leave data to include isPaid and leaveDays fields using smart logic
    @PostMapping("/leaves/migrate-data")
    public ResponseEntity<String> migrateLeaveData() {
        try {
            leaveService.migrateExistingLeaveRecords();
            return ResponseEntity.ok("Leave data migration completed successfully. Historical leaves have been properly categorized as paid/unpaid based on annual limits.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Leave migration failed: " + e.getMessage());
        }
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

    // Endpoint to get leave statistics for an employee
    @GetMapping("/leave/stats")
    public ResponseEntity<LeaveStatsDto> getLeaveStats(@RequestParam String email) {
        Employee employee = employeeRepository.findByEmail(email).orElse(null);
        if (employee == null) {
            return ResponseEntity.badRequest().build();
        }
        LeaveStatsDto stats = leaveService.getLeaveStats(employee.getId());
        return ResponseEntity.ok(stats);
    }

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

    // Paid leave tracking
    int totalPaidLeaves = 12; // ideally fetch from employee record
    int usedPaidLeaves = employeeLeaveRepository.sumUsedPaidLeaves(employee.getId());
    int remainingPaidLeaves = Math.max(0, totalPaidLeaves - usedPaidLeaves);

    // Calculate days requested
    int daysRequested = leaveService.calculateLeaveDays(fromDate, toDate);

    // Split into paid and unpaid
    int paidDays = Math.min(remainingPaidLeaves, daysRequested);
    int unpaidDays = Math.max(0, daysRequested - remainingPaidLeaves);

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
        String message = conflictMessage.toString();
        if (message.endsWith(", ")) {
            message = message.substring(0, message.length() - 2);
        }
        return ResponseEntity.badRequest().body(message);
    }

    // --- SAVE PAID + UNPAID LEAVES SEPARATELY ---
    List<EmployeeLeave> savedLeaves = new ArrayList<>();

    if (paidDays > 0) {
        EmployeeLeave paidLeave = new EmployeeLeave();
        paidLeave.setEmployeeId(employee.getId());
        paidLeave.setManagerId(employee.getManagerId());
        paidLeave.setEmployeeName(employee.getFullName());
        paidLeave.setType(dto.getType());
        paidLeave.setFromDate(fromDate);
        paidLeave.setToDate(fromDate.plusDays(paidDays - 1)); // split actual dates
        paidLeave.setReason(dto.getReason());
        paidLeave.setStatus("PENDING");
        paidLeave.setLeaveDays(paidDays);
        paidLeave.setPaidDays(paidDays);
        paidLeave.setUnpaidDays(0);
        paidLeave.setIsPaid(true);

        savedLeaves.add(employeeLeaveRepository.save(paidLeave));
    }

    if (unpaidDays > 0) {
        EmployeeLeave unpaidLeave = new EmployeeLeave();
        unpaidLeave.setEmployeeId(employee.getId());
        unpaidLeave.setManagerId(employee.getManagerId());
        unpaidLeave.setEmployeeName(employee.getFullName());
        unpaidLeave.setType(dto.getType());
        unpaidLeave.setFromDate(fromDate.plusDays(paidDays)); // unpaid starts after paid ends
        unpaidLeave.setToDate(toDate);
        unpaidLeave.setReason(dto.getReason());
        unpaidLeave.setStatus("PENDING");
        unpaidLeave.setLeaveDays(unpaidDays);
        unpaidLeave.setPaidDays(0);
        unpaidLeave.setUnpaidDays(unpaidDays);
        unpaidLeave.setIsPaid(false);

        savedLeaves.add(employeeLeaveRepository.save(unpaidLeave));
    }

    // Calculate summary again
    int totalUnpaidLeaves = employeeLeaveRepository.sumUsedUnpaidLeavesThisYear(employee.getId());
    int unpaidLeavesThisMonth = employeeLeaveRepository.sumUsedUnpaidLeavesThisMonth(employee.getId());

    Map<String, Object> response = new HashMap<>();
    response.put("paidLeaves", Map.of(
            "total", totalPaidLeaves,
            "used", totalPaidLeaves - remainingPaidLeaves,
            "remaining", remainingPaidLeaves
    ));
    response.put("unpaidLeaves", Map.of(
            "yearTotal", totalUnpaidLeaves,
            "thisMonth", unpaidLeavesThisMonth
    ));
    response.put("message", String.format("Leave submitted: %d paid, %d unpaid", paidDays, unpaidDays));
    response.put("leaves", savedLeaves);

    return ResponseEntity.ok(response);
}


    // Endpoint to apply for leave
//     @PostMapping("/leave/apply")
//     public ResponseEntity<?> applyForLeave(@RequestBody LeaveRequestDto dto) {
//         // Find employee by email
//         Employee employee = employeeRepository.findByEmail(dto.getEmail()).orElse(null);
//         if (employee == null) {
//             return ResponseEntity.badRequest().body("Employee not found");
//         }

//         // Parse dates
//         java.time.LocalDate fromDate = java.time.LocalDate.parse(dto.getStartDate());
//         java.time.LocalDate toDate = java.time.LocalDate.parse(dto.getEndDate());

//         // Validate date range
//         if (fromDate.isAfter(toDate)) {
//             return ResponseEntity.badRequest().body("Start date cannot be after end date");
//         }

//         // Calculate days requested
// //         int daysRequested = leaveService.calculateLeaveDays(fromDate, toDate);

// //         // Get remaining paid leaves for this employee
// // int remainingPaidLeaves = leaveService.getRemainingPaidLeaves(employee.getId());

// // // Split requested days into paid and unpaid
// // int paidDays = Math.min(remainingPaidLeaves, daysRequested);
// // int unpaidDays = Math.max(0, daysRequested - remainingPaidLeaves);



//         int totalPaidLeaves = 12; // or fetch from employee record
// int usedPaidLeaves = employeeLeaveRepository.sumUsedPaidLeaves(employee.getId()); // only approved/accepted paid leaves

// int remainingPaidLeaves = Math.max(0, totalPaidLeaves - usedPaidLeaves);
// int daysRequested = leaveService.calculateLeaveDays(fromDate, toDate);

// // Split into paid and unpaid
// int paidDays = Math.min(remainingPaidLeaves, daysRequested);
// int unpaidDays = Math.max(0, daysRequested - remainingPaidLeaves);
//         // Check for overlapping leave requests
//         List<EmployeeLeave> overlappingLeaves = employeeLeaveRepository.findOverlappingLeaves(
//                 employee.getId(), fromDate, toDate);

//         if (!overlappingLeaves.isEmpty()) {
//             StringBuilder conflictMessage = new StringBuilder("Leave request conflicts with existing leave(s): ");
//             for (EmployeeLeave existing : overlappingLeaves) {
//                 conflictMessage.append(existing.getFromDate().toString())
//                         .append(" to ")
//                         .append(existing.getToDate().toString())
//                         .append(" (")
//                         .append(existing.getStatus())
//                         .append("), ");
//             }
//             // Remove trailing comma and space
//             String message = conflictMessage.toString();
//             if (message.endsWith(", ")) {
//                 message = message.substring(0, message.length() - 2);
//             }
//             return ResponseEntity.badRequest().body(message);
//         }

//         // Determine if this should be paid or unpaid leave
//         // boolean isPaidLeave = leaveService.shouldBePaidLeave(employee.getId(), daysRequested);
        
//         // Create new leave request
//         EmployeeLeave leave = new EmployeeLeave();
//         leave.setEmployeeId(employee.getId());
//         leave.setManagerId(employee.getManagerId());
//         leave.setEmployeeName(employee.getFullName());
//         leave.setType(dto.getType());
//         leave.setFromDate(fromDate);
//         leave.setToDate(toDate);
//         leave.setReason(dto.getReason());
//         leave.setStatus("PENDING");
//         leave.setLeaveDays(daysRequested);
// leave.setPaidDays(paidDays);      // <-- Add these new fields in your EmployeeLeave entity
// leave.setUnpaidDays(unpaidDays);
// leave.setIsPaid(paidDays > 0);    // optional, just for UI
// leave.setPaidDays(paidDays);
// leave.setUnpaidDays(unpaidDays);


//         // leave.setIsPaid(isPaidLeave);
//         // leave.setLeaveDays(daysRequested);

//         EmployeeLeave savedLeave = employeeLeaveRepository.save(leave);
        
// int totalUnpaidLeaves = employeeLeaveRepository.sumUsedUnpaidLeavesThisYear(employee.getId());
// int unpaidLeavesThisMonth = employeeLeaveRepository.sumUsedUnpaidLeavesThisMonth(employee.getId());

//         java.util.Map<String, Object> response = new java.util.HashMap<>();
// response.put("paidLeaves", Map.of(
//     "total", totalPaidLeaves,
//     "used", totalPaidLeaves - remainingPaidLeaves, // used = total - remaining
//     "remaining", remainingPaidLeaves
// ));
// response.put("unpaidLeaves", Map.of(
//     "yearTotal", totalUnpaidLeaves,
//     "thisMonth", unpaidLeavesThisMonth
// ));
// response.put("message", String.format("Leave submitted: %d paid, %d unpaid", paidDays, unpaidDays));

//         // Return response with leave type information
//         // java.util.Map<String, Object> response = new java.util.HashMap<>();
//         // response.put("leave", savedLeave);
//         // response.put("leaveType", isPaidLeave ? "Paid Leave" : "Unpaid Leave");
//         // response.put("message", String.format("Leave request submitted successfully as %s (%d days)", 
//         //         isPaidLeave ? "Paid Leave" : "Unpaid Leave", daysRequested));
        
//         return ResponseEntity.ok(response);
//     }

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private LeaveService leaveService;

    @Autowired
    private com.payflowapi.repository.EmployeeLeaveRepository employeeLeaveRepository;

    @Autowired
    private com.payflowapi.repository.ProjectRepository projectRepository;

    @Autowired
    private EmployeePositionHistoryRepository employeePositionHistoryRepository;

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
        // Set position - default to JUNIOR if not provided
        employee.setPosition(dto.getPosition() != null && !dto.getPosition().isBlank() ? dto.getPosition() : "JUNIOR");
        if (dto.getJoiningDate() != null && !dto.getJoiningDate().isBlank()) {
            try {
                employee.setJoiningDate(LocalDate.parse(dto.getJoiningDate())); // expects "yyyy-MM-dd"
            } catch (DateTimeParseException e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid joiningDate format. Expected yyyy-MM-dd.",
                        e
                );
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

     

    // Endpoint to update employee position, role, and department
    @PutMapping("/update-position")
    public ResponseEntity<?> updateEmployeePosition(@RequestBody EmployeeUpdateDto updateDto) {
        try {
            Employee employee = employeeRepository.findById(updateDto.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

            // Store current values for history
            String previousDepartment = employee.getDepartment();
            String previousRole = employee.getRole();
            String previousPosition = employee.getPosition();

            // Check if there are any changes
            boolean hasChanges = false;
            if (!previousDepartment.equals(updateDto.getDepartment()) ||
                !previousRole.equals(updateDto.getRole()) ||
                !previousPosition.equals(updateDto.getPosition())) {
                hasChanges = true;
            }

            if (hasChanges) {
                // Update employee details
                employee.setDepartment(updateDto.getDepartment());
                employee.setRole(updateDto.getRole());
                employee.setPosition(updateDto.getPosition());
                employeeRepository.save(employee);

                // Create history record
                EmployeePositionHistory history = new EmployeePositionHistory(
                        employee.getId(),
                        employee.getFullName(),
                        previousDepartment,
                        updateDto.getDepartment(),
                        previousRole,
                        updateDto.getRole(),
                        previousPosition,
                        updateDto.getPosition(),
                        updateDto.getChangedBy(),
                        updateDto.getReason()
                );
                employeePositionHistoryRepository.save(history);

                return ResponseEntity.ok(Map.of(
                        "message", "Employee position updated successfully",
                        "employee", employee
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "message", "No changes detected",
                        "employee", employee
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to update employee position: " + e.getMessage()
            ));
        }
    }

    // Endpoint to get position history for an employee
    @GetMapping("/{employeeId}/position-history")
    public ResponseEntity<List<EmployeePositionHistory>> getEmployeePositionHistory(@PathVariable Long employeeId) {
        try {
            List<EmployeePositionHistory> history = employeePositionHistoryRepository.findByEmployeeIdOrderByChangeDateDesc(employeeId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Endpoint to migrate existing employees to have default position if null
    @PostMapping("/migrate-positions")
    public ResponseEntity<String> migrateEmployeePositions() {
        try {
            List<Employee> employees = employeeRepository.findAll();
            int updated = 0;

            for (Employee employee : employees) {
                if (employee.getPosition() == null || employee.getPosition().isEmpty()) {
                    employee.setPosition("JUNIOR");
                    employeeRepository.save(employee);
                    updated++;
                }
            }

            return ResponseEntity.ok("Updated " + updated + " employees with default position 'JUNIOR'");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Migration failed: " + e.getMessage());
        }
    }

   


}