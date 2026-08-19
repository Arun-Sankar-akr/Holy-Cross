import React from 'react';
import { Info, CreditCard } from 'lucide-react';
import './FeeStructure.css';

export default function FeeStructure() {
    const feeData = [
        { grade: 'LKG / UKG', tuition: '₹35,000', development: '₹5,000', annual: '₹40,000' },
        { grade: 'Class I – V', tuition: '₹45,000', development: '₹6,000', annual: '₹51,000' },
        { grade: 'Class VI – VIII', tuition: '₹55,000', development: '₹7,000', annual: '₹62,000' },
        { grade: 'Class IX – X', tuition: '₹65,000', development: '₹8,000', annual: '₹73,000' },
        { grade: 'Class XI – XII', tuition: '₹75,000', development: '₹10,000', annual: '₹85,000' },
    ];

    return (
        <div className="fee-container">
            <div className="fee-header-text">
                <h3><CreditCard size={24} /> Annual Tuition & Fee Blueprint</h3>
                <p>Transparent fee allocations breakdown by tier for the upcoming school cycle.</p>
            </div>

            <div className="fee-card-wrapper">
                <table className="fee-table">
                    <thead>
                        <tr>
                            <th>Grade Level</th>
                            <th>Tuition Fee</th>
                            <th>Development Fund</th>
                            <th>Total Annual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feeData.map((row, index) => (
                            <tr key={index}>
                                <td className="grade-cell">{row.grade}</td>
                                <td>{row.tuition}</td>
                                <td>{row.development}</td>
                                <td className="annual-cell">{row.annual}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="fee-notice-box">
                <Info size={20} />
                <p><strong>Note:</strong> Optional fees like transportation, uniform kits, and specialized extracurricular charges are calculated independently based on selected routes and student paths.</p>
            </div>
        </div>
    );
}