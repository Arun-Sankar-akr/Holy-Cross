import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn, ArrowRight, FileText, KeyRound, Check } from 'lucide-react';
import './Admissionapply.css';

export default function AdmissionApply() {
    const navigate = useNavigate();

    return (
        <div className="adm-apply-landing">
            <div className="adm-apply-heading">
                <span className="adm-card-kicker">Online application</span>
                <h3>Start a new application or pick up where you left off</h3>
                <p>New applicants fill in a fresh form. If you have already registered, log in with your acknowledgement number to review or update it.</p>
            </div>

            <div className="adm-apply-grid">
                <div className="adm-apply-option is-new">
                    <div className="adm-apply-icon"><UserPlus size={24} /></div>
                    <h4>New applicant</h4>
                    <p>Start a fresh application and fill in the complete multi-step form.</p>
                    <ul>
                        <li><Check size={16} /> Personal, background and document details</li>
                        <li><Check size={16} /> You get a unique acknowledgement number</li>
                    </ul>
                    <button type="button" className="adm-apply-btn primary" onClick={() => navigate('/admission/register')}>
                        Register now <ArrowRight size={17} />
                    </button>
                </div>

                <div className="adm-apply-option is-existing">
                    <div className="adm-apply-icon"><LogIn size={24} /></div>
                    <h4>Existing applicant</h4>
                    <p>Log in with your acknowledgement number to review or update your application.</p>
                    <ul>
                        <li><KeyRound size={16} /> Acknowledgement number and phone number</li>
                        <li><FileText size={16} /> Review and edit any step</li>
                    </ul>
                    <button type="button" className="adm-apply-btn secondary" onClick={() => navigate('/admission/login')}>
                        Log in <ArrowRight size={17} />
                    </button>
                </div>
            </div>
        </div>
    );
}