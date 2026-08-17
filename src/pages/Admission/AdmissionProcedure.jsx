import React from 'react';
import { ClipboardList, FileText, CheckCircle2, UserCheck } from 'lucide-react';
import './AdmissionProcedure.css';

export default function AdmissionProcedure() {
    const steps = [
        {
            icon: <FileText size={24} />,
            title: "1. Online/Offline Application",
            desc: "Fill out the registration form either through the online portal or collect it directly from the school administration office."
        },
        {
            icon: <ClipboardList size={24} />,
            title: "2. Document Submission",
            desc: "Submit mandatory documents including Transfer Certificate (TC), birth certificate, community certificate, and previous mark sheets."
        },
        {
            icon: <UserCheck size={24} />,
            title: "3. Interactive Assessment & Interview",
            desc: "A short interaction/assessment for the student along with a parent meeting with the admission committee."
        },
        {
            icon: <CheckCircle2 size={24} />,
            title: "4. Confirmation & Fee Payment",
            desc: "Upon selection, confirm admission by paying the prescribed term fees within the designated timeframe."
        }
    ];

    return (
        <div className="admission-container">
            <div className="page-header">
                <h2><ClipboardList size={28} /> Admission Procedure (2026–2027)</h2>
                <p>Step-by-step guidance for enrolling your child at Holy Cross</p>
            </div>

            <div className="steps-wrapper">
                {steps.map((step, idx) => (
                    <div key={idx} className="procedure-card">
                        <div className="step-icon-box">{step.icon}</div>
                        <div className="step-content">
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="eligibility-box">
                <h3>Age & Eligibility Criteria</h3>
                <ul>
                    <li><strong>LKG / Kindergarten:</strong> Child must complete 3 years by March 31 of the admission year.</li>
                    <li><strong>Class I:</strong> Child must complete 5 years by March 31 of the admission year.</li>
                    <li><strong>Class XI:</strong> Admissions are based on Class X Board Examination marks and stream preference.</li>
                </ul>
            </div>
        </div>
    );
}