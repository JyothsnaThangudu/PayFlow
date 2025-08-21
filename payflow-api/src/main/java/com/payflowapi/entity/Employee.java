package com.payflowapi.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
public class Employee {
    // Bank and statutory details
    private String uan;
    private String pfNo;
    private String esiNo;
    private String bank;
    private String accountNo;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String dob;
    private String gender;
    @Column(name = "joining_date")
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
    private String position; // JUNIOR, SENIOR - employee position level
    private Long managerId; // Manager's user ID

    private String hasExperience;

    // For multiple experiences
    @ElementCollection
    @CollectionTable(name = "employee_experiences", joinColumns = @JoinColumn(name = "employee_id"))
    private java.util.List<Experience> experiences;

    @Embeddable
    public static class Experience {
        private String years;
        private String role;
        private String company;
        private String fromDate;
        private String toDate;

        // Getters and Setters for Experience
        public String getYears() { return years; }
        public void setYears(String years) { this.years = years; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getCompany() { return company; }
        public void setCompany(String company) { this.company = company; }
        public String getFromDate() { return fromDate; }
        public void setFromDate(String fromDate) { this.fromDate = fromDate; }
        public String getToDate() { return toDate; }
        public void setToDate(String toDate) { this.toDate = toDate; }
    }

    private String certifications;
    private String skills;
    private String languages;

    // Getters and Setters
    public String getUan() { return uan; }
    public void setUan(String uan) { this.uan = uan; }
    public String getPfNo() { return pfNo; }
    public void setPfNo(String pfNo) { this.pfNo = pfNo; }
    public String getEsiNo() { return esiNo; }
    public void setEsiNo(String esiNo) { this.esiNo = esiNo; }
    public String getBank() { return bank; }
    public void setBank(String bank) { this.bank = bank; }
    public String getAccountNo() { return accountNo; }
    public void setAccountNo(String accountNo) { this.accountNo = accountNo; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    
    public LocalDate getJoiningDate() { return joiningDate; }
    public void setJoiningDate(LocalDate joiningDate) { this.joiningDate = joiningDate; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
    
    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }
    
    public String getInstitution() { return institution; }
    public void setInstitution(String institution) { this.institution = institution; }
    
    public String getGraduationYear() { return graduationYear; }
    public void setGraduationYear(String graduationYear) { this.graduationYear = graduationYear; }
    
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
    
    public String getHasExperience() { return hasExperience; }
    public void setHasExperience(String hasExperience) { this.hasExperience = hasExperience; }
    
    public java.util.List<Experience> getExperiences() { return experiences; }
    public void setExperiences(java.util.List<Experience> experiences) { this.experiences = experiences; }
    
    public String getCertifications() { return certifications; }
    public void setCertifications(String certifications) { this.certifications = certifications; }
    
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    
    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }
}