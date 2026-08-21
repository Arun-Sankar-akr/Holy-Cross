import React, { useState, useEffect } from 'react';
import { GraduationCap, Mail, Award, BookOpen, Briefcase, UserCheck } from 'lucide-react';
import { db } from '../../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './TeachingStaff.css';

export default function TeachingStaff() {
    const [filter, setFilter] = useState('All');
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Default static fallback list
    const fallbackTeachers = [
        { id: '1', name: 'Dr. R. Meenakshi', department: 'Science', role: 'Head of Department (Physics)', qualification: 'M.Sc., Ph.D., B.Ed.', experience: '18 Years', email: 'meenakshi.r@holycross.edu' },
        { id: '2', name: 'Mr. K. Anand', department: 'Mathematics', role: 'Senior PGT Teacher', qualification: 'M.Sc., M.Phil., B.Ed.', experience: '14 Years', email: 'anand.k@holycross.edu' },
        { id: '3', name: 'Mrs. S. Lakshmi', department: 'English', role: 'Head of Department (English)', qualification: 'M.A., M.Ed.', experience: '15 Years', email: 'lakshmi.s@holycross.edu' },
        { id: '4', name: 'Mr. V. Suresh', department: 'Computer Science', role: 'PGT Computer Science', qualification: 'M.C.A., M.Tech., B.Ed.', experience: '10 Years', email: 'suresh.v@holycross.edu' },
        { id: '5', name: 'Mrs. P. Revathi', department: 'Social Studies', role: 'TGT Social Science', qualification: 'M.A., B.Ed.', experience: '12 Years', email: 'revathi.p@holycross.edu' },
        { id: '6', name: 'Mr. T. Saravanan', department: 'Tamil', role: 'Head of Department (Tamil)', qualification: 'M.A., M.Phil., B.Ed.', experience: '16 Years', email: 'saravanan.t@holycross.edu' }
    ];

    useEffect(() => {
        // Subscribe to real-time updates from staff_members collection
        const unsubscribe = onSnapshot(collection(db, 'staff_members'), (snapshot) => {
            const fetchedStaff = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (fetchedStaff.length > 0) {
                setTeachers(fetchedStaff);
            } else {
                setTeachers(fallbackTeachers);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error loading live staff directory:", error);
            setTeachers(fallbackTeachers);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Dynamically extract departments from current staff list
    const availableDepartments = [
        'All',
        ...Array.from(new Set(teachers.map(t => t.department || t.dept).filter(Boolean)))
    ];

    const filteredTeachers = filter === 'All' 
        ? teachers 
        : teachers.filter(t => (t.department || t.dept) === filter);

    return (
        <div className="staff-container">
            <div className="page-header">
                <h2><GraduationCap size={28} /> Teaching Faculty</h2>
                <p>Our dedicated team of qualified educators committed to academic excellence</p>
            </div>

            {/* Department Filter Buttons */}
            <div className="filter-tabs">
                {availableDepartments.map((dept, i) => (
                    <button 
                        key={i} 
                        className={`filter-btn ${filter === dept ? 'active' : ''}`}
                        onClick={() => setFilter(dept)}
                    >
                        {dept}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading Faculty Directory...
                </div>
            ) : (
                <div className="teacher-grid">
                    {filteredTeachers.map((teacher) => (
                        <div key={teacher.id} className="teacher-card">
                            <div className="teacher-avatar">
                                <UserCheck size={36} color="var(--primary, #4f46e5)" />
                            </div>
                            <div className="teacher-info">
                                <h3>{teacher.name}</h3>
                                <p className="teacher-role">
                                    <Briefcase size={14} /> {teacher.role || teacher.department || 'Faculty Member'}
                                </p>

                                <div className="teacher-details">
                                    {(teacher.department || teacher.dept) && (
                                        <p><BookOpen size={14} /> <strong>Department:</strong> {teacher.department || teacher.dept}</p>
                                    )}
                                    {teacher.qualification && (
                                        <p><Award size={14} /> <strong>Qualification:</strong> {teacher.qualification}</p>
                                    )}
                                    {teacher.email && (
                                        <p><Mail size={14} /> <strong>Email:</strong> <a href={`mailto:${teacher.email}`}>{teacher.email}</a></p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}