// TeachingStaff.jsx
import React, { useState } from 'react';
import { GraduationCap, Mail, Award, BookOpen } from 'lucide-react';
import './TeachingStaff.css';

export default function TeachingStaff() {
    const [filter, setFilter] = useState('All');

    const teachers = [
        { name: 'Dr. R. Meenakshi', dept: 'Science', role: 'Head of Department (Physics)', qual: 'M.Sc., Ph.D., B.Ed.', exp: '18 Years', email: 'meenakshi.r@holycross.edu' },
        { name: 'Mr. K. Anand', dept: 'Mathematics', role: 'Senior PGT Teacher', qual: 'M.Sc., M.Phil., B.Ed.', exp: '14 Years', email: 'anand.k@holycross.edu' },
        { name: 'Mrs. S. Lakshmi', dept: 'English', role: 'Head of Department (English)', qual: 'M.A., M.Ed.', exp: '15 Years', email: 'lakshmi.s@holycross.edu' },
        { name: 'Mr. V. Suresh', dept: 'Computer Science', role: 'PGT Computer Science', qual: 'M.C.A., M.Tech., B.Ed.', exp: '10 Years', email: 'suresh.v@holycross.edu' },
        { name: 'Mrs. P. Revathi', dept: 'Social Studies', role: 'TGT Social Science', qual: 'M.A., B.Ed.', exp: '12 Years', email: 'revathi.p@holycross.edu' },
        { name: 'Mr. T. Saravanan', dept: 'Tamil', role: 'Head of Department (Tamil)', qual: 'M.A., M.Phil., B.Ed.', exp: '16 Years', email: 'saravanan.t@holycross.edu' },
    ];

    const departments = ['All', 'Science', 'Mathematics', 'English', 'Computer Science', 'Social Studies', 'Tamil'];

    const filteredTeachers = filter === 'All' 
        ? teachers 
        : teachers.filter(t => t.dept === filter);

    return (
        <div className="staff-container">
            <div className="page-header">
                <h2><GraduationCap size={28} /> Teaching Faculty</h2>
                <p>Our dedicated team of qualified educators committed to academic excellence</p>
            </div>

            {/* Department Filter Buttons */}
            <div className="filter-tabs">
                {departments.map((dept, i) => (
                    <button 
                        key={i} 
                        className={`filter-btn ${filter === dept ? 'active' : ''}`}
                        onClick={() => setFilter(dept)}
                    >
                        {dept}
                    </button>
                ))}
            </div>

            <div className="teacher-grid">
                {filteredTeachers.map((teacher, idx) => (
                    <div key={idx} className="teacher-card">
                        <div className="teacher-avatar">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="teacher-name">{teacher.name}</h3>
                        <span className="teacher-role">{teacher.role}</span>
                        <div className="teacher-qual">{teacher.qual}</div>
                        
                        <div className="teacher-meta">
                            <div><Award size={14} /> <strong>Experience:</strong> {teacher.exp}</div>
                            <div><Mail size={14} /> {teacher.email}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}