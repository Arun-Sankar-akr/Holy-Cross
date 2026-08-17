import React from 'react';
import { CreditCard, Info } from 'lucide-react';
import './FeeStructure.css';

export default function FeeStructure() {
    const fees = [
        { grade: "Primary (Classes I - V)", tuition: "₹ 12,000", term: "₹ 4,000", annual: "₹ 24,000" },
        { grade: "Middle School (Classes VI - VIII)", tuition: "₹ 14,500", term: "₹ 4,500", annual: "₹ 28,000" },
        { grade: "High School (Classes IX - X)", tuition: "₹ 16,500", term: "₹ 5,000", annual: "₹ 33,000" },
        { grade: "Higher Secondary (Classes XI - XII)", tuition: "₹ 19,000", term: "₹ 6,000", annual: "₹ 38,000" },
    ];

    return (
        <div className="admission-container">
            <div className="page-header">
                <h2><CreditCard size={28} /> Fee Structure (2026–2027)</h2>
                <p>Transparent fee schedule for academic and non-academic activities</p>
            </div>

            <div className="fee-card">
                <table className="fee-table">
                    <thead>
                        <tr>
                            <th>Grade / Level</th>
                            <th>Tuition Fee (Per Term)</th>
                            <th>Special & Activity Fee</th>
                            <th>Total Annual Fee</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fees.map((row, idx) => (
                            <tr key={idx}>
                                <td className="grade-cell">{row.grade}</td>
                                <td>{row.tuition}</td>
                                <td>{row.term}</td>
                                <td className="annual-cell">{row.annual}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="fee-note">
                <Info size={20} />
                <p><strong>Note:</strong> Fees can be paid in three installments (June, October, and January). Transport and hostel fees are billed separately based on route and accommodation selection.</p>
            </div>
        </div>
    );
}