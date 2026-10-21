import React from 'react';
import { Info } from 'lucide-react';
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
                <h3>Annual tuition and fees</h3>
                <p>A clear breakdown of fees for each class group in the upcoming school year.</p>
            </div>

            <div className="fee-card-wrapper">
                <table className="fee-table">
                    <thead>
                        <tr>
                            <th>Grade level</th>
                            <th>Tuition fee</th>
                            <th>Development fund</th>
                            <th>Total annual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feeData.map((row, index) => (
                            <tr key={index}>
                                <td className="grade-cell" data-label="Grade level">{row.grade}</td>
                                <td data-label="Tuition fee">{row.tuition}</td>
                                <td data-label="Development fund">{row.development}</td>
                                <td className="annual-cell" data-label="Total annual"><span>{row.annual}</span></td>
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