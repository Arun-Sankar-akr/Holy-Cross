import React, { useState, useEffect } from 'react';
import { GraduationCap, Mail, Award, BookOpen, Briefcase, UserCheck, X } from 'lucide-react';
import { db } from '../../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './TeachingStaff.css';

export default function TeachingStaff() {
    const [filter, setFilter] = useState('All');
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    const fallbackTeachers = [
        { id: '1', name: 'Dr. R. Meenakshi', department: 'Science', role: 'Head of Department (Physics)', qualification: 'M.Sc., Ph.D., B.Ed.', experience: '18 Years', email: 'meenakshi.r@holycross.edu' },
        { id: '2', name: 'Mr. K. Anand', department: 'Mathematics', role: 'Senior PGT Teacher', qualification: 'M.Sc., M.Phil., B.Ed.', experience: '14 Years', email: 'anand.k@holycross.edu' },
        { id: '3', name: 'Mrs. S. Lakshmi', department: 'English', role: 'Head of Department (English)', qualification: 'M.A., M.Ed.', experience: '15 Years', email: 'lakshmi.s@holycross.edu' },
        { id: '4', name: 'Mr. V. Suresh', department: 'Computer Science', role: 'PGT Computer Science', qualification: 'M.C.A., M.Tech., B.Ed.', experience: '10 Years', email: 'suresh.v@holycross.edu' },
        { id: '5', name: 'Mrs. P. Revathi', department: 'Social Studies', role: 'TGT Social Science', qualification: 'M.A., B.Ed.', experience: '12 Years', email: 'revathi.p@holycross.edu' },
        { id: '6', name: 'Mr. T. Saravanan', department: 'Tamil', role: 'Head of Department (Tamil)', qualification: 'M.A., M.Phil., B.Ed.', experience: '16 Years', email: 'saravanan.t@holycross.edu' }
    ];

    useEffect(() => {
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
                        <div 
                            key={teacher.id} 
                            className="teacher-card clickable"
                            onClick={() => setSelectedTeacher(teacher)}
                        >
                            <div className="teacher-avatar">
                                <UserCheck size={22} color="#8004c7" />
                            </div>
                            <div className="teacher-info">
                                <h3>{teacher.name}</h3>
                                <p className="teacher-role">
                                    <Briefcase size={12} /> {teacher.role || teacher.department || 'Faculty Member'}
                                </p>

                                <div className="teacher-details">
                                    {(teacher.department || teacher.dept) && (
                                        <p><BookOpen size={12} /> {teacher.department || teacher.dept}</p>
                                    )}
                                    {teacher.qualification && (
                                        <p><Award size={12} /> {teacher.qualification}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Card Preview Modal (Side-by-Side: Avatar Left, Details Right) */}
            {selectedTeacher && (
                <div 
                    className="modal-backdrop"
                    onClick={() => setSelectedTeacher(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '16px'
                    }}
                >
                    <div 
                        className="preview-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: '#ffffff',
                            width: '100%',
                            maxWidth: '520px',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: '20px'
                        }}
                    >
                        {/* Close Button */}
                        <button 
                            className="close-preview-btn" 
                            onClick={() => setSelectedTeacher(null)}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#64748b',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>

                        {/* LEFT COLUMN: Profile Avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4px' }}>
                            <div 
                                style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f8eefc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '3px solid #e2bbf5',
                                    flexShrink: 0
                                }}
                            >
                                <UserCheck size={38} color="#8004c7" />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Details & Info */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingRight: '12px' }}>
                            <h2 style={{ color: '#8004c7', margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 800 }}>
                                {selectedTeacher.name}
                            </h2>
                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#475569', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Briefcase size={14} color="#8004c7" /> {selectedTeacher.role || selectedTeacher.department || 'Faculty Member'}
                            </span>

                            <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(selectedTeacher.department || selectedTeacher.dept) && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        <BookOpen size={16} color="#8004c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 700 }}>Department</span>
                                            <p style={{ margin: '1px 0 0 0', fontSize: '0.88rem', color: '#1e293b', fontWeight: 600 }}>{selectedTeacher.department || selectedTeacher.dept}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedTeacher.qualification && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        <Award size={16} color="#8004c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 700 }}>Qualification</span>
                                            <p style={{ margin: '1px 0 0 0', fontSize: '0.88rem', color: '#1e293b', fontWeight: 600 }}>{selectedTeacher.qualification}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedTeacher.experience && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        <Briefcase size={16} color="#8004c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 700 }}>Experience</span>
                                            <p style={{ margin: '1px 0 0 0', fontSize: '0.88rem', color: '#1e293b', fontWeight: 600 }}>{selectedTeacher.experience}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedTeacher.email && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        <Mail size={16} color="#8004c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 700 }}>Email</span>
                                            <p style={{ margin: '1px 0 0 0', fontSize: '0.88rem', color: '#8004c7', fontWeight: 600, wordBreak: 'break-all' }}>
                                                <a href={`mailto:${selectedTeacher.email}`} style={{ color: '#8004c7', textDecoration: 'none' }}>
                                                    {selectedTeacher.email}
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}