import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import AdmissionForm from './AdmissionForm';
import './Admissionstandalone.css';


export default function AdmissionRegisterPage() {
    return (
        <div className="adm-standalone-page">
            <header className="adm-standalone-topbar">
                <div className="adm-standalone-brand">
                    <div className="adm-standalone-mark">
                        <GraduationCap size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <strong>Holy Cross</strong>
                        <span>New Application</span>
                    </div>
                </div>
                <div className="adm-standalone-meta">
                    <span>Admissions Portal</span>
                    <small>Academic Year 2026–2027</small>
                </div>
            </header>

            <div className="adm-standalone-body">
                <Link to="/admission" className="adm-back-link">
                    <ArrowLeft size={15} /> Back to Admissions Home
                </Link>

                <AdmissionForm mode="create" />
            </div>
        </div>
    );
}