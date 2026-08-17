// NonTeachingStaff.jsx
import React from 'react';
import { Users, Phone, ShieldCheck, Wrench, HardDrive } from 'lucide-react';
import './NonTeachingStaff.css';

export default function NonTeachingStaff() {
    const staffList = [
        { name: 'M. Selvaraj', role: 'Office Superintendent', dept: 'Administration', contact: '+91 431 2400110', icon: <Users size={20} /> },
        { name: 'A. Francis Xavier', role: 'Head Accountant', dept: 'Accounts & Finance', contact: '+91 431 2400111', icon: <Users size={20} /> },
        { name: 'S. Ganesan', role: 'Senior System Administrator', dept: 'IT & Lab Services', contact: '+91 431 2400112', icon: <HardDrive size={20} /> },
        { name: 'R. Pandian', role: 'Campus Estate Manager', dept: 'Maintenance & Operations', contact: '+91 431 2400113', icon: <Wrench size={20} /> },
        { name: 'K. Mary Roseline', role: 'Chief Librarian Assistant', dept: 'Library Services', contact: '+91 431 2400114', icon: <Users size={20} /> },
        { name: 'P. Arumugam', role: 'Transport Safety Officer', dept: 'Transport Logistics', contact: '+91 431 2400115', icon: <ShieldCheck size={20} /> },
    ];

    return (
        <div className="staff-container">
            <div className="page-header">
                <h2><Users size={28} /> Administrative & Support Staff</h2>
                <p>Ensuring smooth daily operations, administrative efficiency, and campus safety</p>
            </div>

            <div className="support-card">
                <table className="support-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Designation / Role</th>
                            <th>Department</th>
                            <th>Office Phone</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.map((member, idx) => (
                            <tr key={idx}>
                                <td className="staff-name-cell">
                                    <span className="staff-icon-box">{member.icon}</span>
                                    {member.name}
                                </td>
                                <td className="staff-role-cell">{member.role}</td>
                                <td><span className="dept-tag">{member.dept}</span></td>
                                <td className="staff-contact"><Phone size={14} /> {member.contact}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}