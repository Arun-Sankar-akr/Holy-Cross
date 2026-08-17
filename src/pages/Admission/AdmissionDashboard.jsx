// AdmissionDashboard.jsx
import React, { useState } from 'react';
import { ClipboardList, CreditCard, UserCheck } from 'lucide-react';
import AdmissionProcedure from './AdmissionProcedure';
import FeeStructure from './FeeStructure';
import AdmissionForm from './AdmissionForm';
import './AdmissionDashboard.css';

export default function AdmissionDashboard() {
    const [activeTab, setActiveTab] = useState('procedure');

    const tabs = [
        { id: 'procedure', label: 'Admission Procedure', icon: <ClipboardList size={18} /> },
        { id: 'fee', label: 'Fee Structure', icon: <CreditCard size={18} /> },
        { id: 'apply', label: 'Online Application', icon: <UserCheck size={18} /> },
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Admissions 2026–2027</h2>
                <p>Welcome to Holy Cross Admissions. Explore procedures, fee structures, and apply online.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="dashboard-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Active Component View */}
            <div className="dashboard-content">
                {activeTab === 'procedure' && <AdmissionProcedure />}
                {activeTab === 'fee' && <FeeStructure />}
                {activeTab === 'apply' && <AdmissionForm />}
            </div>
        </div>
    );
}