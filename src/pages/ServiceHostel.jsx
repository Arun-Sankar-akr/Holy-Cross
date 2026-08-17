// ServiceHostel.jsx
import React from 'react';
import { Home, Coffee, Shield, Wifi, Utensils } from 'lucide-react';
import './ServiceHostel.css';

export default function ServiceHostel() {
    const features = [
        { icon: <Utensils size={22} />, title: 'Hygienic Dining', desc: 'Nutritious vegetarian & non-vegetarian meals prepared in steam kitchens.' },
        { icon: <Shield size={22} />, title: '24/7 Security', desc: 'CCTV surveillance and round-the-clock resident wardens.' },
        { icon: <Wifi size={22} />, title: 'High-Speed Wi-Fi', desc: 'Managed internet access available during study hours.' },
        { icon: <Coffee size={22} />, title: 'Recreation Hall', desc: 'Common room equipped with indoor games, TV, and reading materials.' },
    ];

    return (
        <div className="amenity-container">
            <div className="page-header">
                <h2><Home size={28} /> Residential Hostel</h2>
                <p>A home away from home providing safe, comfortable, and disciplined accommodation</p>
            </div>

            <div className="hostel-features-grid">
                {features.map((feat, idx) => (
                    <div key={idx} className="feature-card">
                        <div className="icon-wrapper">{feat.icon}</div>
                        <h4>{feat.title}</h4>
                        <p>{feat.desc}</p>
                    </div>
                ))}
            </div>

            <div className="amenity-card">
                <h3>Hostel Rules & Admission Guidelines</h3>
                <ul className="amenity-list">
                    <li><strong>Admission:</strong> Hostel allotment is done on a first-come, first-served basis during annual school admissions.</li>
                    <li><strong>Study Hours:</strong> Mandatory quiet study hours from 6:30 PM to 8:30 PM daily under warden supervision.</li>
                    <li><strong>Outing Permissibility:</strong> Students are permitted weekend outings only with prior parental consent.</li>
                </ul>
            </div>
        </div>
    );
}