import React from 'react';
import { ClipboardList, FileText, CheckCircle2, UserCheck, CalendarDays } from 'lucide-react';
import './AdmissionProcedure.css';

export default function AdmissionProcedure() {
    const steps = [
        {
            icon: <FileText size={20} />,
            title: "Online or offline application",
            desc: "Fill out the registration form seamlessly through our digital portal or pick up a physical copy directly from the main administrative office."
        },
        {
            icon: <ClipboardList size={20} />,
            title: "Secure document submission",
            desc: "Provide necessary verification paperwork, including your Transfer Certificate (TC), official birth certificate, and prior academic report cards."
        },
        {
            icon: <UserCheck size={20} />,
            title: "Interactive assessment and meeting",
            desc: "A friendly, low-stress developmental check-in for the child alongside a brief personal discussion between parents and the admissions board."
        },
        {
            icon: <CheckCircle2 size={20} />,
            title: "Seat confirmation and payment",
            desc: "Upon successful selection, lock in your spot by submitting the required term admission payments within the designated schedule window."
        }
    ];

    const eligibility = [
        { grade: "LKG / Kindergarten", rule: "Must complete 3 years of age by March 31 of the target academic admission year." },
        { grade: "Class I", rule: "Must complete 5 years of age by March 31 of the target academic admission year." },
        { grade: "Class XI", rule: "Placements are evaluated directly using Class X Board Examination marks and chosen stream tracks." }
    ];

    return (
        <div className="proc-container">
            <div className="proc-header">
                <h3>Step-by-step enrollment guide</h3>
                <p>Follow these simple milestones to secure your child's place for 2026–2027.</p>
            </div>

            <ol className="proc-steps-grid">
                {steps.map((step, idx) => (
                    <li key={idx} className="proc-card">
                        <span className="proc-number">{idx + 1}</span>
                        <div className="proc-text-content">
                            <div className="proc-title-row">
                                <h4>{step.title}</h4>
                                <span className="proc-icon-wrap">{step.icon}</span>
                            </div>
                            <p>{step.desc}</p>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="proc-eligibility-card">
                <div className="proc-eligibility-header">
                    <span className="proc-eligibility-icon"><CalendarDays size={22} /></span>
                    <h4>Age and general eligibility guidelines</h4>
                </div>

                <div className="proc-eligibility-grid">
                    {eligibility.map((item) => (
                        <div key={item.grade} className="proc-eligibility-item">
                            <strong>{item.grade}</strong>
                            <p>{item.rule}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}