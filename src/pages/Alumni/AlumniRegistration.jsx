import React, { useState } from 'react';
import { UserPlus, Send, CheckCircle2 } from 'lucide-react';
import './AlumniRegistration.css';

export default function AlumniRegistration() {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        passoutYear: '',
        email: '',
        phone: '',
        currentOccupation: '',
        city: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="alumni-container">
            <div className="page-header">
                <h2><UserPlus size={28} /> Alumni Registration</h2>
                <p>Stay connected with your alma mater and join our growing global alumni network</p>
            </div>

            <div className="form-card">
                {submitted ? (
                    <div className="success-message">
                        <CheckCircle2 size={48} />
                        <h3>Registration Successful!</h3>
                        <p>Thank you for registering. We will notify you about upcoming alumni meets and network events.</p>
                        <button className="reset-btn" onClick={() => setSubmitted(false)}>Register Another Alumnus</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="alumni-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" />
                            </div>
                            <div className="form-group">
                                <label>Year of Passing *</label>
                                <input type="number" name="passoutYear" required value={formData.passoutYear} onChange={handleChange} placeholder="e.g. 2018" min="1950" max="2026" />
                            </div>
                            <div className="form-group">
                                <label>Email Address *</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="your.name@example.com" />
                            </div>
                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                            </div>
                            <div className="form-group">
                                <label>Current Designation & Organization</label>
                                <input type="text" name="currentOccupation" value={formData.currentOccupation} onChange={handleChange} placeholder="e.g. Software Engineer at Tech Corp" />
                            </div>
                            <div className="form-group">
                                <label>Current City / Country</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Chennai, India" />
                            </div>
                        </div>
                        <button type="submit" className="submit-btn"><Send size={16} /> Submit Registration</button>
                    </form>
                )}
            </div>
        </div>
    );
}