package com.payflowapi.service;

import com.payflowapi.dto.LeaveStatsDto;
import com.payflowapi.entity.EmployeeLeave;
import com.payflowapi.repository.EmployeeLeaveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;


@Service
public class LeaveService {

    @Autowired
    private EmployeeLeaveRepository employeeLeaveRepository;
    

    /**
     * Calculate the number of days between two dates (inclusive)
     */
    
    // In LeaveService.java
public int getRemainingPaidLeaves(Long employeeId) {
    int totalPaidLeaves = 12; // or fetch from employee record
    int usedPaidLeaves = employeeLeaveRepository.sumUsedPaidLeaves(employeeId); // implement sum query
    return totalPaidLeaves - usedPaidLeaves;
}

    
    public int calculateLeaveDays(LocalDate fromDate, LocalDate toDate) {
        return (int) ChronoUnit.DAYS.between(fromDate, toDate) + 1;
    }

    public List<EmployeeLeave> getLeavesByEmployee(Long employeeId) {
        return employeeLeaveRepository.findByEmployeeId(employeeId);
    }


    /**
     * Get comprehensive leave statistics for an employee
     */
    public LeaveStatsDto getLeaveStats(Long employeeId) {
        LeaveStatsDto stats = new LeaveStatsDto();
        int currentYear = LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();

        // Calculate used paid leaves for current year
        List<EmployeeLeave> paidLeaves = employeeLeaveRepository.findApprovedPaidLeavesInYear(employeeId, currentYear);
        int usedPaidDays = 0;
        for (EmployeeLeave leave : paidLeaves) {
            if (leave.getLeaveDays() != null) {
                usedPaidDays += leave.getLeaveDays();
            } else if (leave.getFromDate() != null && leave.getToDate() != null) {
                usedPaidDays += calculateLeaveDays(leave.getFromDate(), leave.getToDate());
            }
        }

        // Calculate used unpaid leaves for current year
        List<EmployeeLeave> unpaidLeaves = employeeLeaveRepository.findApprovedUnpaidLeavesInYear(employeeId, currentYear);
        int usedUnpaidDays = 0;
        for (EmployeeLeave leave : unpaidLeaves) {
            if (leave.getLeaveDays() != null) {
                usedUnpaidDays += leave.getLeaveDays();
            } else if (leave.getFromDate() != null && leave.getToDate() != null) {
                usedUnpaidDays += calculateLeaveDays(leave.getFromDate(), leave.getToDate());
            }
        }

        // Calculate unpaid leaves for current month
        List<EmployeeLeave> unpaidLeavesThisMonth = employeeLeaveRepository.findApprovedUnpaidLeavesInMonth(employeeId, currentYear, currentMonth);
        int unpaidDaysThisMonth = 0;
        for (EmployeeLeave leave : unpaidLeavesThisMonth) {
            if (leave.getLeaveDays() != null) {
                unpaidDaysThisMonth += leave.getLeaveDays();
            } else if (leave.getFromDate() != null && leave.getToDate() != null) {
                unpaidDaysThisMonth += calculateLeaveDays(leave.getFromDate(), leave.getToDate());
            }
        }

        stats.setUsedPaidLeaves(usedPaidDays);
        stats.setRemainingPaidLeaves(Math.max(0, 12 - usedPaidDays));
        stats.setUsedUnpaidLeaves(usedUnpaidDays);
        stats.setUnpaidLeavesThisMonth(unpaidDaysThisMonth);

        return stats;
    }

    /**
     * Check if requested leave should be paid or unpaid
     */
    public boolean shouldBePaidLeave(Long employeeId, int requestedDays) {
        LeaveStatsDto stats = getLeaveStats(employeeId);
        return stats.getRemainingPaidLeaves() >= requestedDays;
    }

    /**
     * Update leave days for an existing leave record
     */
    public void updateLeaveDays(EmployeeLeave leave) {
        if (leave.getFromDate() != null && leave.getToDate() != null) {
            int days = calculateLeaveDays(leave.getFromDate(), leave.getToDate());
            leave.setLeaveDays(days);
                // Calculate paid/unpaid split
                LeaveStatsDto stats = getLeaveStats(leave.getEmployeeId());
                int paidAvailable = stats.getRemainingPaidLeaves();
                int paidDays = Math.min(days, paidAvailable);
                int unpaidDays = days - paidDays;
                leave.setPaidDays(paidDays);
                leave.setUnpaidDays(unpaidDays);
                // Set isPaid for legacy compatibility (true if all days are paid)
                leave.setIsPaid(unpaidDays == 0);
            employeeLeaveRepository.save(leave);
        }
    }

    /**
     * Migrate existing leave records to properly set isPaid field
     * This method should be called once to fix historical data
     */
    public void migrateExistingLeaveRecords() {
        List<EmployeeLeave> allLeaves = employeeLeaveRepository.findAll();
        
        for (EmployeeLeave leave : allLeaves) {
            // Only process leaves that don't have isPaid set or have null values
            if (leave.getIsPaid() == null) {
                // Calculate leave days if not set
                if (leave.getLeaveDays() == null && leave.getFromDate() != null && leave.getToDate() != null) {
                    int days = calculateLeaveDays(leave.getFromDate(), leave.getToDate());
                    leave.setLeaveDays(days);
                }
                
                // For historical data, we'll apply the logic retroactively
                // Get the employee's leave stats up to this leave's date
                if (leave.getStatus() != null && leave.getStatus().equals("ACCEPTED")) {
                    // Check how many paid leaves were taken before this leave in the same year
                    int yearOfLeave = leave.getFromDate().getYear();
                    List<EmployeeLeave> previousPaidLeaves = employeeLeaveRepository
                        .findPreviousPaidLeavesInYear(leave.getEmployeeId(), yearOfLeave, leave.getFromDate());
                    
                    int usedPaidDays = 0;
                    for (EmployeeLeave prevLeave : previousPaidLeaves) {
                        if (prevLeave.getLeaveDays() != null) {
                            usedPaidDays += prevLeave.getLeaveDays();
                        }
                    }
                    
                    int requestedDays = leave.getLeaveDays() != null ? leave.getLeaveDays() : 0;
                    // If there's enough paid leave remaining, mark as paid, otherwise unpaid
                    leave.setIsPaid(usedPaidDays + requestedDays <= 12);
                } else {
                    // For non-accepted leaves, default to paid
                    leave.setIsPaid(true);
                }
                
                employeeLeaveRepository.save(leave);
            }
        }
    }
}
