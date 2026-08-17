import React from 'react';
import { Star, Award, Briefcase } from 'lucide-react';
import './NotableAlumni.css';

export default function NotableAlumni() {
    const alumniList = [
        {
            name: 'Dr. Anita Sundaram',
            batch: 'Batch of 2005',
            role: 'Lead AI Researcher',
            organization: 'Stanford Health Care',
            achievements: 'Pioneered machine learning applications in cardiac diagnostic imaging.'
        },
        {
            name: 'R. Rajesh Kumar',
            batch: 'Batch of 2010',
            role: 'IAS Officer',
            organization: 'Government of Tamil Nadu',
            achievements: 'Secured All India Rank 14 in the UPSC Civil Services Examination.'
        },
        {
            name: 'Priyanka Mohan',
            batch: 'Batch of 2014',
            role: 'Founder & CEO',
            organization: 'EcoTech Solutions',
            achievements: 'Recognized in Forbes 30 Under 30 for sustainable water purification tech.'
        }
    ];

    return (
        <div className="alumni-container">
            <div className="page-header">
                <h2><Star size={28} /> Notable Alumni</h2>
                <p>Celebrating the remarkable accomplishments of our distinguished graduates</p>
            </div>

            <div className="notable-grid">
                {alumniList.map((alumnus, idx) => (
                    <div key={idx} className="notable-card">
                        <div className="notable-badge"><Award size={20} /></div>
                        <h3 className="notable-name">{alumnus.name}</h3>
                        <span className="notable-batch">{alumnus.batch}</span>

                        <div className="notable-role">
                            <Briefcase size={15} />
                            <span><strong>{alumnus.role}</strong> — {alumnus.organization}</span>
                        </div>

                        <p className="notable-desc">{alumnus.achievements}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}