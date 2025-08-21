
package com.payflowapi.repository;

import java.util.List;
import java.time.LocalDate;

import com.payflowapi.entity.EmployeeLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeLeaveRepository extends JpaRepository<EmployeeLeave, Long> {
    List<EmployeeLeave> findByEmployeeIdIn(List<Long> employeeIds);

    List<EmployeeLeave> findByEmployeeId(Long employeeId);

    List<EmployeeLeave> findByManagerId(Long managerId);

    List<EmployeeLeave> findByEmployeeIdAndStatus(Long employeeId, String status);

// Total accepted paid leaves
@Query("SELECT COALESCE(SUM(e.paidDays), 0) FROM EmployeeLeave e WHERE e.employeeId = :employeeId AND e.status='ACCEPTED'")
int sumUsedPaidLeaves(@Param("employeeId") Long employeeId);

// Total accepted unpaid leaves this year
@Query("SELECT COALESCE(SUM(e.unpaidDays), 0) FROM EmployeeLeave e WHERE e.employeeId = :employeeId AND e.status='ACCEPTED' AND YEAR(e.fromDate) = YEAR(CURRENT_DATE)")
int sumUsedUnpaidLeavesThisYear(@Param("employeeId") Long employeeId);

// Total accepted unpaid leaves this month
@Query("SELECT COALESCE(SUM(e.unpaidDays), 0) FROM EmployeeLeave e WHERE e.employeeId = :employeeId AND e.status='ACCEPTED' AND YEAR(e.fromDate) = YEAR(CURRENT_DATE) AND MONTH(e.fromDate) = MONTH(CURRENT_DATE)")
int sumUsedUnpaidLeavesThisMonth(@Param("employeeId") Long employeeId);

    @Query("SELECT el FROM EmployeeLeave el WHERE el.employeeId = :employeeId AND el.status = 'ACCEPTED' " +
            "AND el.toDate >= :startDate AND el.fromDate <= :endDate")
    List<EmployeeLeave> findApprovedLeavesInMonth(@Param("employeeId") Long employeeId,
                                                  @Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate);

    // Find approved paid leaves for the current year (including null values as paid for legacy data)
    @Query("SELECT el FROM EmployeeLeave el WHERE el.employeeId = :employeeId AND el.status = 'ACCEPTED' " +
            "AND (el.isPaid = true OR el.isPaid IS NULL) AND YEAR(el.fromDate) = :year")
    List<EmployeeLeave> findApprovedPaidLeavesInYear(@Param("employeeId") Long employeeId,
                                                     @Param("year") int year);

    // Find approved unpaid leaves for a specific month
    @Query("SELECT el FROM EmployeeLeave el WHERE el.employeeId = :employeeId AND el.status = 'ACCEPTED' " +
            "AND el.isPaid = false AND YEAR(el.fromDate) = :year AND MONTH(el.fromDate) = :month")
    List<EmployeeLeave> findApprovedUnpaidLeavesInMonth(@Param("employeeId") Long employeeId,
                                                        @Param("year") int year,
                                                        @Param("month") int month);

    // Find all approved unpaid leaves for the current year
    @Query("SELECT el FROM EmployeeLeave el WHERE el.employeeId = :employeeId AND el.status = 'ACCEPTED' " +
            "AND el.isPaid = false AND YEAR(el.fromDate) = :year")
    List<EmployeeLeave> findApprovedUnpaidLeavesInYear(@Param("employeeId") Long employeeId,
                                                       @Param("year") int year);

    // Find overlapping leave requests for the same employee
    @Query("SELECT el FROM EmployeeLeave el WHERE el.employeeId = :employeeId " +
            "AND el.status != 'DENIED' " +
            "AND ((el.fromDate <= :toDate AND el.toDate >= :fromDate))")
    List<EmployeeLeave> findOverlappingLeaves(@Param("employeeId") Long employeeId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    // Find previous paid leaves in the same year before a specific date (for migration)
    @Query("SELECT el FROM EmployeeLeave el WHERE el.employeeId = :employeeId " +
            "AND el.status = 'ACCEPTED' AND el.isPaid = true " +
            "AND YEAR(el.fromDate) = :year AND el.fromDate < :beforeDate " +
            "ORDER BY el.fromDate")
    List<EmployeeLeave> findPreviousPaidLeavesInYear(@Param("employeeId") Long employeeId,
                                                     @Param("year") int year,
                                                     @Param("beforeDate") LocalDate beforeDate);

    // Find all leaves without paid status set (for migration)
    @Query("SELECT el FROM EmployeeLeave el WHERE el.isPaid IS NULL")
    List<EmployeeLeave> findLeavesWithoutPaidStatus();

    // Find unpaid leaves in a specific date range
    @Query("SELECT el FROM EmployeeLeave el WHERE el.employeeId = :employeeId " +
            "AND el.status = :status AND el.isPaid = :isPaid " +
            "AND ((el.fromDate >= :startDate AND el.fromDate <= :endDate) " +
            "OR (el.toDate >= :startDate AND el.toDate <= :endDate) " +
            "OR (el.fromDate <= :startDate AND el.toDate >= :endDate))")
    List<EmployeeLeave> findByEmployeeIdAndStatusAndIsPaidAndDateRange(
            @Param("employeeId") Long employeeId,
            @Param("status") String status,
            @Param("isPaid") Boolean isPaid,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
