// PupilStrength.jsx
import React from 'react';
import { Users, GraduationCap, Award } from 'lucide-react';
import './PupilStrength.css';

export default function PupilStrength() {
    const strengthData = [
        { level: "Primary Section (Classes I - V)", boys: 420, girls: 380, total: 800 },
        { level: "Middle Section (Classes VI - VIII)", boys: 310, girls: 290, total: 600 },
        { level: "High School (Classes IX - X)", boys: 250, girls: 230, total: 480 },
        { level: "Higher Secondary (Classes XI - XII)", boys: 210, girls: 210, total: 420 },
    ];

    const grandTotal = strengthData.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="strength-container">
            <div className="page-header">
                <h2><Users size={28} /> Pupil Strength (2025–2026)</h2>
                <p>Demographic summary of student enrolment across academic divisions</p>
            </div>

            <div className="total-highlight-card">
                <GraduationCap size={36} />
                <div>
                    <h3>{grandTotal.toLocaleString()}</h3>
                    <p>Total Enrolled Students</p>
                </div>
            </div>

            <div className="strength-card">
                <table className="strength-table">
                    <thead>
                        <tr>
                            <th>Academic Level</th>
                            <th>Boys</th>
                            <th>Girls</th>
                            <th>Total Students</th>
                        </tr>
                    </thead>
                    <tbody>
                        {strengthData.map((row, idx) => (
                            <tr key={idx}>
                                <td className="level-name">{row.level}</td>
                                <td>{row.boys}</td>
                                <td>{row.girls}</td>
                                <td className="row-total">{row.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}