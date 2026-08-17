// RulesRegulations.jsx
import React from 'react';
import { BookOpen, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import './RulesRegulations.css';

export default function RulesRegulations() {
    const rulesList = [
        {
            category: "General Discipline & Conduct",
            icon: <ShieldAlert size={20} />,
            items: [
                "Punctuality is strictly enforced. Students must arrive by 8:30 AM.",
                "High standards of politeness and courteous language are expected at all times.",
                "Mobile phones and unauthorized electronic devices are strictly prohibited on campus."
            ]
        },
        {
            category: "Uniform & Attendance",
            icon: <Clock size={20} />,
            items: [
                "Students must wear complete and clean prescribed uniforms with identity cards.",
                "Minimum 85% attendance is required to appear for term examinations.",
                "Leave applications must be submitted in advance and signed by a parent/guardian."
            ]
        },
        {
            category: "Campus & Asset Care",
            icon: <BookOpen size={20} />,
            items: [
                "School property and equipment must be handled with utmost care.",
                "Cleanliness of classrooms and campus premises is the responsibility of every student.",
                "Library books must be returned intact on or before the due date."
            ]
        }
    ];

    return (
        <div className="rules-container">
            <div className="page-header">
                <h2><CheckCircle size={28} /> Rules & Regulations</h2>
                <p>Guidelines ensuring safety, decorum, and academic integrity</p>
            </div>

            <div className="rules-cards">
                {rulesList.map((sec, idx) => (
                    <div key={idx} className="rules-card">
                        <div className="rules-card-header">
                            {sec.icon}
                            <h3>{sec.category}</h3>
                        </div>
                        <ul className="rules-bullet-list">
                            {sec.items.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}