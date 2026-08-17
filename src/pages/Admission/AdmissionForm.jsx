// AdmissionForm.jsx
import React, { useState } from 'react';
import { db } from '../../service/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2 } from 'lucide-react';

export default function AdmissionForm() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        studentName: '',
        grade: 'LKG',
        parentName: '',
        phone: '',
        email: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "admissions"), {
                ...formData,
                status: 'Pending',
                createdAt: serverTimestamp()
            });
            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting application: ", error);
            alert("Submission failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <CheckCircle2 size={50} color="#8004c7" />
                <h3>Application Submitted Successfully!</h3>
                <p>We will review your application and contact you soon.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="contact-form">
            <h3>Online Admission Form</h3>
            <div className="form-group">
                <label>Student Name *</label>
                <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                />
            </div>
            <div className="form-group">
                <label>Grade Applying For *</label>
                <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                >
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="Class I">Class I</option>
                    <option value="Class XI">Class XI</option>
                </select>
            </div>
            <div className="form-group">
                <label>Parent/Guardian Name *</label>
                <input
                    type="text"
                    required
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                />
            </div>
            <div className="form-group">
                <label>Phone Number *</label>
                <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
            </div>
            <button type="submit" className="send-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
            </button>
        </form>
    );
}