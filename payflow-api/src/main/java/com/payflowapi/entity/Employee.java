package com.payflowapi.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String dob;
    private String gender;
    @Column(name = "joining_date")
    // private String joiningDate;
    private LocalDate joiningDate;

    private String address;
    private String email;
    private String phone;
    private String emergencyContact;

    private String qualification;
    private String institution;
    private String graduationYear;
    private String specialization;

    private String department;
    private String role;
    private Long managerId; // Manager's user ID

    private String hasExperience;

    // For multiple experiences
    @ElementCollection
    @CollectionTable(name = "employee_experiences", joinColumns = @JoinColumn(name = "employee_id"))
    private java.util.List<Experience> experiences;

    @Embeddable
    @lombok.Data
    public static class Experience {
        private String years;
        private String role;
        private String company;
        private String fromDate;
        private String toDate;
    }

    private String certifications;
    private String skills;
    private String languages;

    public LocalDate getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }
}