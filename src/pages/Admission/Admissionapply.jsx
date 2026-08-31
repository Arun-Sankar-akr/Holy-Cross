import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn, ArrowRight, FileText, KeyRound } from 'lucide-react';
import './Admissionapply.css';

export default function AdmissionApply() {
    const navigate = useNavigate();

    return (
        <div className="adm-apply-landing">
            <div className="adm-apply-heading">
                <span className="adm-card-kicker">ONLINE APPLICATION</span>
                <h3>Register a New Application or Continue an Existing One</h3>
                <p>New applicants start a fresh application. If you've already registered, log in with your acknowledgement number to review or update it.</p>
            </div>

            <div className="adm-apply-grid">
                <div className="adm-apply-option">
                    <div className="adm-apply-icon tone-blue"><UserPlus size={22} /></div>
                    <h4>New Applicant</h4>
                    <p>Start a fresh application and fill in the complete multi-step form.</p>
                    <ul>
                        <li><FileText size={14} /> Personal, background &amp; document details</li>
                        <li><KeyRound size={14} /> Get a unique acknowledgement number</li>
                    </ul>
                    <button type="button" className="adm-apply-btn primary" onClick={() => navigate('/admission/register')}>
                        Register Now <ArrowRight size={16} />
                    </button>
                </div>

                <div className="adm-apply-option">
                    <div className="adm-apply-icon tone-indigo"><LogIn size={22} /></div>
                    <h4>Existing Applicant</h4>
                    <p>Log in with your acknowledgement number to review or update your application.</p>
                    <ul>
                        <li><KeyRound size={14} /> Acknowledgement number + phone number</li>
                        <li><FileText size={14} /> Review and edit any step</li>
                    </ul>
                    <button type="button" className="adm-apply-btn secondary" onClick={() => navigate('/admission/login')}>
                        Login <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}