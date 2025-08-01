import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../components/Sidebar.css';
import './Onboarding.css';

// ...imports remain unchanged

export default function Onboarding() {
    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        gender: '',
        joiningDate: '',
        address: '',
        email: '',
        phone: '',
        emergencyContact: '',
        qualification: '',
        institution: '',
        graduationYear: '',
        specialization: '',
        department: '',
        role: '',
        hasExperience: 'No',
        experienceYears: '',
        previousRole: '',
        previousCompany: '',
        certifications: '',
        skills: '',
        languages: ''
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/api/employee/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert('Candidate onboarded successfully!');
                setFormData({
                    fullName: '',
                    dob: '',
                    gender: '',
                    joiningDate: '',
                    address: '',
                    email: '',
                    phone: '',
                    emergencyContact: '',
                    qualification: '',
                    institution: '',
                    graduationYear: '',
                    specialization: '',
                    department: '',
                    role: '',
                    hasExperience: 'No',
                    experienceYears: '',
                    previousRole: '',
                    previousCompany: '',
                    certifications: '',
                    skills: '',
                    languages: ''
                });
            } else {
                alert('Failed to onboard candidate.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong.');
        }
    };

    return (
        <div className="onboarding-page-layout">
            <Sidebar />
            <div className="onboarding-form-wrapper">
                <div className="onboarding-form-container">
                    <h2>Candidate Onboarding</h2>
                    <form className="onboarding-form" onSubmit={handleSubmit}>

                        {/* Personal & Contact Info */}
                        <div className="form-section">
                            <h3>Personal & Contact Information</h3>
                            <div className="form-row">
                                <label>Full Name</label>
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Date of Birth</label>
                                <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}>
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Phone Number</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Emergency Contact</label>
                                <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Educational Details */}
                        <div className="form-section">
                            <h3>Educational Details</h3>
                            <div className="form-row">
                                <label>Highest Qualification</label>
                                <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>University/Institution</label>
                                <input type="text" name="institution" value={formData.institution} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Year of Graduation</label>
                                <input type="text" name="graduationYear" value={formData.graduationYear} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Specialization</label>
                                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Job Details + Work Experience */}
                        <div className="form-section">
                            <h3>Job & Work Experience</h3>
                            <div className="form-row">
                                <label>Department</label>
                                <input type="text" name="department" value={formData.department} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Role</label>
                                <input type="text" name="role" value={formData.role} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Joining Date</label>
                                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Has Previous Experience?</label>
                                <select name="hasExperience" value={formData.hasExperience} onChange={handleChange}>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>
                            </div>

                            {formData.hasExperience === 'Yes' && (
                                <>
                                    <div className="form-row">
                                        <label>Years of Experience</label>
                                        <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} min="0" step="0.1" required />
                                    </div>
                                    <div className="form-row">
                                        <label>Previous Role</label>
                                        <input type="text" name="previousRole" value={formData.previousRole} onChange={handleChange} required />
                                    </div>
                                    <div className="form-row">
                                        <label>Previous Company Name</label>
                                        <input type="text" name="previousCompany" value={formData.previousCompany} onChange={handleChange} required />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Certifications & Skills */}
                        <div className="form-section">
                            <h3>Certifications & Skills</h3>
                            <div className="form-row">
                                <label>List of Certifications</label>
                                <input type="text" name="certifications" value={formData.certifications} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Technical Skills</label>
                                <input type="text" name="skills" value={formData.skills} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Languages Known</label>
                                <input type="text" name="languages" value={formData.languages} onChange={handleChange} />
                            </div>
                        </div>

                        <button type="submit" className="submit-btn">Submit</button>
                    </form>
                </div>
            </div>
        </div>
    );
}