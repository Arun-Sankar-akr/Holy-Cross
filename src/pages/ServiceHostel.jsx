import React from 'react';
import { Home, Coffee, Shield, Wifi, Utensils, CheckCircle2 } from 'lucide-react';
import './ServiceHostel.css';

import hostelHero from '../assets/bg1.jpg';
import hostelDining from '../assets/bg2.png';
import hostelRoom from '../assets/bg2.png';

export default function ServiceHostel() {
    const features = [
        { icon: <Utensils size={21} />, title: 'Hygienic Dining', desc: 'Nutritious vegetarian & non-vegetarian meals prepared in steam kitchens.' },
        { icon: <Shield size={21} />, title: '24/7 Security', desc: 'CCTV surveillance and round-the-clock resident wardens.' },
        { icon: <Wifi size={21} />, title: 'High-Speed Wi-Fi', desc: 'Managed internet access available during study hours.' },
        { icon: <Coffee size={21} />, title: 'Recreation Hall', desc: 'Common room equipped with indoor games, TV, and reading materials.' },
    ];

    const gallery = [
        { img: hostelDining, caption: 'Dining Hall' },
        { img: hostelRoom, caption: 'Resident Rooms' },
    ];

    return (
        <div className="hostel-page">
            <section className="hostel-hero" style={{ backgroundImage: `url(${hostelHero})` }}>
                <div className="hostel-hero-content">
                    <div className="hostel-eyebrow"><Home size={14} /> Campus Living</div>
                    <h2><Home size={34} /> Residential Hostel</h2>
                    <p>A home away from home providing safe, comfortable, and disciplined accommodation.</p>
                </div>
            </section>

            <section className="hostel-feature-grid">
                {features.map((feat, idx) => (
                    <article key={idx} className="hostel-feature-card">
                        <div className="hostel-icon">{feat.icon}</div>
                        <h4>{feat.title}</h4>
                        <p>{feat.desc}</p>
                    </article>
                ))}
            </section>

            <div className="hostel-section-heading">
                <h3>Hostel Spaces</h3>
                <span>Comfortable campus living</span>
            </div>

            <section className="hostel-gallery">
                {gallery.map((item, idx) => (
                    <div key={idx} className="hostel-gallery-item">
                        <img src={item.img} alt={item.caption} />
                        <span>{item.caption}</span>
                    </div>
                ))}
            </section>

            <section className="hostel-rules">
                <div className="hostel-rules-header">
                    <div className="hostel-rules-header-icon"><CheckCircle2 size={21} /></div>
                    <h3>Hostel Rules & Admission Guidelines</h3>
                </div>
                <ul className="hostel-rule-list">
                    <li><strong>Admission</strong>Hostel allotment is done on a first-come, first-served basis during annual school admissions.</li>
                    <li><strong>Study Hours</strong>Mandatory quiet study hours from 6:30 PM to 8:30 PM daily under warden supervision.</li>
                    <li><strong>Outing Permissibility</strong>Students are permitted weekend outings only with prior parental consent.</li>
                </ul>
            </section>
        </div>
    );
}
