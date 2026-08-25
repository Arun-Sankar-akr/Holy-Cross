import React from 'react';
import { HeartHandshake, Shield, BookOpen, Sparkles } from 'lucide-react';
import './StaffCommittees.css';

export default function StaffCommittees() {
    const committees = [
        {
            title: 'Academic & Curriculum Cell',
            icon: <BookOpen size={22} />,
            convener: 'Dr. R. Meenakshi',
            responsibilities: 'Oversees exam scheduling, syllabus progression, and inter-disciplinary academic initiatives.'
        },
        {
            title: 'Staff Welfare Association',
            icon: <HeartHandshake size={22} />,
            convener: 'Mr. K. Anand',
            responsibilities: 'Manages faculty benefits, recreational activities, professional development workshops, and wellness programs.'
        },
        {
            title: 'Discipline & Grievance Cell',
            icon: <Shield size={22} />,
            convener: 'Mrs. S. Lakshmi',
            responsibilities: 'Ensures campus decorum, resolves staff/student grievances, and maintains safety guidelines.'
        },
        {
            title: 'Cultural & Co-Curricular Committee',
            icon: <Sparkles size={22} />,
            convener: 'Mrs. P. Revathi',
            responsibilities: 'Organizes annual school functions, inter-school competitions, and cultural celebrations.'
        }
    ];

    return (
        <div className="staff-container">
            <div className="page-header premium-page-header committee-page-header">
                <h2><HeartHandshake size={28} /> Committees & Staff Welfare</h2>
                <p>Staff governing bodies promoting faculty growth, welfare, and operational harmony</p>
            </div>

            <div className="committee-grid premium-committee-grid">
                {committees.map((item, idx) => (
                    <div key={idx} className="committee-card premium-committee-card">
                        <div className="committee-header">
                            <div className="committee-icon">{item.icon}</div>
                            <h3>{item.title}</h3>
                        </div>

                        <div className="committee-convener">
                            <strong>Convener:</strong> {item.convener}
                        </div>

                        <p className="committee-desc">{item.responsibilities}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}