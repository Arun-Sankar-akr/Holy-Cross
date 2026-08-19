import React, { useState } from 'react';
import { ClipboardList, CreditCard, UserCheck, Search, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import AdmissionProcedure from './AdmissionProcedure';
import FeeStructure from './FeeStructure';
import AdmissionForm from './AdmissionForm';
import { db } from '../../service/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import './AdmissionDashboard.css';

export default function AdmissionDashboard() {
    const [activeTab, setActiveTab] = useState('procedure');

    // Tracking states
    const [trackAck, setTrackAck] = useState('');
    const [trackingResult, setTrackingResult] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const tabs = [
        { id: 'procedure', label: 'Admission Procedure', icon: <ClipboardList size={18} /> },
        { id: 'fee', label: 'Fee Structure', icon: <CreditCard size={18} /> },
        { id: 'apply', label: 'Online Application', icon: <UserCheck size={18} /> },
        { id: 'track', label: 'Track Status', icon: <Search size={18} /> },
    ];

    const handleTrackStatus = async (e) => {
        e.preventDefault();
        if (!trackAck.trim()) return;

        setTrackingLoading(true);
        setHasSearched(true);
        setTrackingResult(null);

        try {
            const q = query(collection(db, "admissions"), where("acknowledgementNumber", "==", trackAck.trim()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                setTrackingResult(docData);
            } else {
                setTrackingResult(null);
            }
        } catch (error) {
            console.error("Error tracking application:", error);
            alert("Failed to fetch status. Please try again.");
        } finally {
            setTrackingLoading(false);
        }
    };

    return (
        <div className="adm-dashboard-wrapper">
            <div className="adm-hero-section">
                <span className="adm-badge">Academic Year 2026–2027</span>
                <h2>Admissions Dashboard</h2>
                <p>Welcome to Holy Cross Admissions. Explore procedures, fee structures, apply online, and track your application status seamlessly.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="adm-tabs-container">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`adm-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Active Component View */}
            <div className="adm-tab-content-area">
                {activeTab === 'procedure' && <AdmissionProcedure />}
                {activeTab === 'fee' && <FeeStructure />}
                {activeTab === 'apply' && <AdmissionForm />}
                
                {activeTab === 'track' && (
                    <div className="adm-premium-card" style={{ maxWidth: '650px', margin: '0 auto', textAlign: 'center' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <h3>Track Your Admission Application</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enter your unique acknowledgement number below to view your real-time status.</p>
                        </div>

                        <form onSubmit={handleTrackStatus} style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center' }}>
                            <input
                                type="text"
                                placeholder="Enter Ack No. (e.g. HCMS20260001)"
                                value={trackAck}
                                onChange={(e) => setTrackAck(e.target.value)}
                                required
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.95jpem',
                                    width: '65%',
                                    outline: 'none',
                                    fontFamily: 'Outfit, sans-serif'
                                }}
                            />
                            <button
                                type="submit"
                                className="submit-action-btn"
                                disabled={trackingLoading}
                                style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                            >
                                <Search size={16} /> {trackingLoading ? 'Searching...' : 'Check Status'}
                            </button>
                        </form>

                        {hasSearched && !trackingLoading && (
                            <div>
                                {trackingResult ? (
                                    <div style={{ background: '#faf5ff', border: '1px solid #f3e5f5', borderRadius: '16px', padding: '24px', textAlign: 'left' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                                            <div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8004c7', textTransform: 'uppercase' }}>Acknowledgement No</span>
                                                <h4 style={{ margin: '2px 0 0 0', fontFamily: 'monospace', color: '#2c0344' }}>{trackingResult.acknowledgementNumber}</h4>
                                            </div>
                                            <div>
                                                {trackingResult.status === 'Approved' && (
                                                    <span className="status-pill approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '50px', fontWeight: 700, fontSize: '0.8rem' }}>
                                                        <CheckCircle2 size={14} /> Approved
                                                    </span>
                                                )}
                                                {trackingResult.status === 'Rejected' && (
                                                    <span className="status-pill rejected" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff1f2', color: '#e11d48', padding: '6px 12px', borderRadius: '50px', fontWeight: 700, fontSize: '0.8rem' }}>
                                                        <XCircle size={14} /> Rejected
                                                    </span>
                                                )}
                                                {(!trackingResult.status || trackingResult.status === 'Pending') && (
                                                    <span className="status-pill pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#d97706', padding: '6px 12px', borderRadius: '50px', fontWeight: 700, fontSize: '0.8rem' }}>
                                                        <Clock size={14} /> Pending Review
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.9rem' }}>
                                            <p style={{ margin: 0 }}><strong>Student Name:</strong> {trackingResult.firstName} {trackingResult.lastName}</p>
                                            <p style={{ margin: 0 }}><strong>Grade Applied:</strong> {trackingResult.grade}</p>
                                            <p style={{ margin: 0 }}><strong>Parent Name:</strong> {trackingResult.parentName}</p>
                                            <p style={{ margin: 0 }}><strong>Phone:</strong> {trackingResult.phone}</p>
                                        </div>

                                        {trackingResult.status === 'Approved' && (
                                            <div style={{ marginTop: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '10px', color: '#065f46', fontSize: '0.85rem' }}>
                                                🎉 Congratulations! Your application has been approved and automatically enrolled into the Student ERP records.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', color: '#64748b' }}>
                                        <AlertCircle size={32} style={{ marginBottom: '8px', color: '#94a3b8' }} />
                                        <h4 style={{ margin: '0 0 4px 0', color: '#334155' }}>No Application Found</h4>
                                        <p style={{ margin: 0, fontSize: '0.88rem' }}>No records match the acknowledgement number "{trackAck}". Please double-check your reference code.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}