import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './EmployeeList.css';

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8080/api/employee')
            .then(response => setEmployees(response.data))
            .catch(error => console.error('Error fetching employees:', error));
    }, []);

    return (
        <div  className="employee-list-container">
            <h2>All Employees</h2>
            <table className="employee-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Phone</th>
                    <th>Joining Date</th>
                </tr>
                </thead>
                <tbody>
                {employees.map(emp => (
                    <tr key={emp.id}>
                        <td>{emp.id}</td>
                        <td>{emp.fullName}</td>
                        <td>{emp.email}</td>
                        <td>{emp.role}</td>
                        <td>{emp.department}</td>
                        <td>{emp.phone}</td>
                        <td>{emp.joiningDate}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default EmployeeList;

