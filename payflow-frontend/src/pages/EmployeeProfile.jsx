// EmployeeProfile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    FaUserCircle, FaEnvelope, FaPhone, FaBuilding, FaBriefcase,
    FaCalendarAlt, FaGraduationCap, FaStar, FaGlobe
} from 'react-icons/fa';
import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeNavbar from "../components/Navbar";
import './EmployeeProfile.css';

const EmployeeProfile = () => {
    const [employee, setEmployee] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [successMsg, setSuccessMsg] = useState('');
    const email = localStorage.getItem('userEmail');

    useEffect(() => {
        if (email) {
            axios.get(`http://localhost:8080/api/employee?email=${email}`)
                .then(res => {
                    const emp = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : res.data;
                    setEmployee(emp);
                    setForm(emp);
                })
                .catch(err => console.error('Failed to fetch employee details', err));
        }
    }, [email]);

    return (
        <div className="employee-dashboard-layout">
            <EmployeeSidebar />
            <div className="employee-profile-main">
                <div className="profile-card-container">
                    <div className="profile-card">
                        <h3><FaUserCircle className="icon" /> My Profile</h3>
                        {successMsg && <div style={{color:'#22c55e',fontWeight:600,marginBottom:12}}>{successMsg}</div>}
                        {employee && !editing ? (
                            <>
                                <ul className="profile-list">
                                    <li><FaEnvelope /> <span><b>Email:</b> {employee.email}</span></li>
                                    <li><FaPhone /> <span><b>Phone:</b> {employee.phone}</span></li>
                                    <li><FaBuilding /> <span><b>Department:</b> {employee.department}</span></li>
                                    <li><FaBriefcase /> <span><b>Role:</b> {employee.role}</span></li>
                                    <li><FaCalendarAlt /> <span><b>Joining Date:</b> {employee.joiningDate}</span></li>
                                    <li><FaGraduationCap /> <span><b>Qualification:</b> {employee.qualification}</span></li>
                                    <li><FaStar /> <span><b>Specialization:</b> {employee.specialization}</span></li>
                                    <li><FaBriefcase /> <span><b>Experience:</b> {employee.hasExperience === 'Yes' ? `${employee.experienceYears} years` : 'Fresher'}</span></li>
                                    <li><FaBuilding /> <span><b>Previous Company:</b> {employee.previousCompany}</span></li>
                                    <li><FaStar /> <span><b>Certifications:</b> {employee.certifications}</span></li>
                                    <li><FaStar /> <span><b>Skills:</b> {employee.skills}</span></li>
                                    <li><FaGlobe /> <span><b>Languages:</b> {employee.languages}</span></li>
                                </ul>
                                <button style={{marginTop:18,background:'linear-gradient(135deg,#6366f1,#22d3ee)',color:'white',border:'none',borderRadius:8,padding:'10px 20px',fontWeight:600,fontSize:16,cursor:'pointer'}} onClick={()=>setEditing(true)}>Update Profile</button>
                            </>
                        ) : employee && editing ? (
                            <form onSubmit={async e => {
                                e.preventDefault();
                                try {
                                    const updateData = {
                                        employeeId: employee.id,
                                        department: form.department,
                                        role: form.role,
                                        position: form.position || employee.position || 'JUNIOR',
                                        reason: 'Profile update by employee',
                                        changedBy: localStorage.getItem('userEmail') || employee.email,
                                    };
                                    await axios.put('http://localhost:8080/api/employee/update-position', updateData);
                                    setSuccessMsg('Profile updated successfully!');
                                    setEditing(false);
                                    setEmployee({ ...employee, ...form });
                                } catch (err) {
                                    setSuccessMsg('Failed to update profile.');
                                }
                            }} style={{marginTop:12}}>
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
                                    <div>
                                        <label>Email</label>
                                        <input type="email" value={form.email||''} disabled style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                    <div>
                                        <label>Phone</label>
                                        <input type="text" value={form.phone||''} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                    <div>
                                        <label>Department</label>
                                        <input type="text" value={form.department||''} onChange={e=>setForm(f=>({...f,department:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                    <div>
                                        <label>Role</label>
                                        <input type="text" value={form.role||''} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                    <div>
                                        <label>Qualification</label>
                                        <input type="text" value={form.qualification||''} onChange={e=>setForm(f=>({...f,qualification:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                    <div>
                                        <label>Specialization</label>
                                        <input type="text" value={form.specialization||''} onChange={e=>setForm(f=>({...f,specialization:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                    <div>
                                        <label>Experience Years</label>
                                        <input type="number" value={form.experienceYears||''} onChange={e=>setForm(f=>({...f,experienceYears:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                    <div>
                                        <label>Previous Company</label>
                                        <input type="text" value={form.previousCompany||''} onChange={e=>setForm(f=>({...f,previousCompany:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                    <div>
                                        <label>Certifications</label>
                                        <input type="text" value={form.certifications||''} onChange={e=>setForm(f=>({...f,certifications:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                    <div>
                                        <label>Skills</label>
                                        <input type="text" value={form.skills||''} onChange={e=>setForm(f=>({...f,skills:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                    <div>
                                        <label>Languages</label>
                                        <input type="text" value={form.languages||''} onChange={e=>setForm(f=>({...f,languages:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e5e7eb'}} />
                                    </div>
                                </div>
                                <div style={{marginTop:18,display:'flex',gap:12}}>
                                    <button type="submit" style={{background:'linear-gradient(135deg,#22c55e,#6366f1)',color:'white',border:'none',borderRadius:8,padding:'10px 20px',fontWeight:600,fontSize:16,cursor:'pointer'}}>Save</button>
                                    <button type="button" style={{background:'#e5e7eb',color:'#374151',border:'none',borderRadius:8,padding:'10px 20px',fontWeight:600,fontSize:16,cursor:'pointer'}} onClick={()=>setEditing(false)}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <p>Loading profile...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfile;
