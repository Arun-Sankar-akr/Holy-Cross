import React from 'react';
import { ClipboardList, FileText, CheckCircle2, UserCheck } from 'lucide-react';
import './AdmissionProcedure.css';

export default function AdmissionProcedure() {
    const steps = [
        {
            icon: <FileText size={22} />,
            title: "1. Online or Offline Application",
            desc: "Fill out the registration form seamlessly through our digital portal or pick up a physical copy directly from the main administrative office."
        },
        {
            icon: <ClipboardList size={22} />,
            title: "2. Secure Document Submission",
            desc: "Provide necessary verification paperwork, including your Transfer Certificate (TC), official birth certificate, and prior academic report cards."
        },
        {
            icon: <UserCheck size={22} />,
            title: "3. Interactive Assessment & Meeting",
            desc: "A friendly, low-stress developmental check-in for the child alongside a brief personal discussion between parents and the admissions board."
        },
        {
            icon: <CheckCircle2 size={22} />,
            title: "4. Seat Confirmation & Payment",
            desc: "Upon successful selection, lock in your spot by submitting the required term admission payments within the designated schedule window."
        }
    ];

    return (
        <div className="proc-container">
            <div className="proc-header">
                <h3><ClipboardList size={24} /> Step-by-Step Enrollment Guide</h3>
                <p>Follow these simple milestones to secure your child's place for 2026–2027.</p>
            </div>

            <div className="proc-steps-grid">
                {steps.map((step, idx) => (
                    <div key={idx} className="proc-card">
                        <div className="proc-icon-wrap">{step.icon}</div>
                        <div className="proc-text-content">
                            <h4>{step.title}</h4>
                            <p>{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="proc-eligibility-card">
                <div className="proc-eligibility-header">
                    <CheckCircle2 size={22} color="#8004c7" />
                    <h4>Age & General Eligibility Guidelines</h4>
                </div>
                <ul>
                    <li><strong>LKG / Kindergarten:</strong> Must complete 3 years of age by March 31 of the target academic admission year.</li>
                    <li><strong>Class I:</strong> Must complete 5 years of age by March 31 of the target academic admission year.</li>
                    <li><strong>Class XI:</strong> Placements are evaluated directly using Class X Board Examination marks and chosen stream tracks.</li>
                </ul>
            </div>
        </div>
    );
}