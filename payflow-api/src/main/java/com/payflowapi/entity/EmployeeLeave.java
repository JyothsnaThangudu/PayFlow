
package com.payflowapi.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "employee_leave")
public class EmployeeLeave {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long employeeId;
    private Long managerId; // Manager's user ID
    private String type;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String status;
    private String employeeName;
    private String reason;
    private String denialReason; // Reason provided by manager when denying leave
    private Boolean isPaid = true; // Indicates if this leave is paid or unpaid
    private Integer leaveDays; // Number of actual leave days taken

    private Integer paidDays; // Number of paid leave days in this request
    private Integer unpaidDays; // Number of unpaid leave days in this request


    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }

    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getFullName() { return employeeName; } // Alias for employeeName
    public void setFullName(String fullName) { this.employeeName = fullName; }

    public String getManagerName() { return ""; } // Add if needed
    public void setManagerName(String managerName) { } // Add if needed

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDenialReason() { return denialReason; }
    public void setDenialReason(String denialReason) { this.denialReason = denialReason; }

    public Boolean getIsPaid() { return isPaid; }
    public void setIsPaid(Boolean isPaid) { this.isPaid = isPaid; }

    public Integer getLeaveDays() { return leaveDays; }
    public void setLeaveDays(Integer leaveDays) { this.leaveDays = leaveDays; }

    public Integer getPaidDays() { return paidDays; }
    public void setPaidDays(Integer paidDays) { this.paidDays = paidDays; }

    public Integer getUnpaidDays() { return unpaidDays; }
    public void setUnpaidDays(Integer unpaidDays) { this.unpaidDays = unpaidDays; }
}
