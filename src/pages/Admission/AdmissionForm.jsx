import React, { useState } from 'react';
import { db } from '../../service/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Send, ArrowLeft, ArrowRight, Upload, FileText, Check } from 'lucide-react';
import './AdmissionForm.css';

export default function AdmissionForm() {
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [ackNumber, setAckNumber] = useState('');
    const [compressionStatus, setCompressionStatus] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        grade: 'LKG',
        parentName: '',
        phone: '',
        address: '',
        religion: '',
        caste: '',
        subCaste: '',
        idNumber: '', 
        communityCertNo: '',
        physicalAbility: 'Normal',
        disabilityDetails: '',
        aadharFile: null,
        communityFile: null,
        tcFile: null
    });

    // Modified file upload handler to convert files locally into Base64 strings (No Storage Bucket Needed)
    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
            setCompressionStatus('Encoding file locally...');
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setFormData(prev => ({ ...prev, [fieldName]: reader.result }));
                setCompressionStatus(`File attached successfully (${(file.size / 1024).toFixed(1)} KB).`);
            };
            reader.onerror = (error) => {
                console.error("File reading error:", error);
                setCompressionStatus('Failed to read file.');
            };
        } else {
            alert('Please upload only JPG, PNG, or PDF files.');
        }
    };

    const handleNext = (e) => {
        e.preventDefault();
        setStep((prev) => Math.min(prev + 1, 4));
        setCompressionStatus('');
    };

    const handlePrev = () => {
        setStep((prev) => Math.max(prev - 1, 1));
        setCompressionStatus('');
    };

    const generateAcknowledgementNumber = async () => {
        try {
            const q = query(collection(db, "admissions"), orderBy("createdAt", "desc"), limit(1));
            const querySnapshot = await getDocs(q);
            
            let nextSeq = 1;
            if (!querySnapshot.empty) {
                const lastDoc = querySnapshot.docs[0].data();
                const lastAck = lastDoc.acknowledgementNumber;
                if (lastAck && lastAck.startsWith("HCMS2026")) {
                    const seqPart = parseInt(lastAck.replace("HCMS2026", ""), 10);
                    if (!isNaN(seqPart)) {
                        nextSeq = seqPart + 1;
                    }
                }
            }
            const paddedSeq = String(nextSeq).padStart(4, '0');
            return `HCMS2026${paddedSeq}`;
        } catch (error) {
            console.error("Error generating sequential ack number, falling back:", error);
            const fallbackSeq = Math.floor(1000 + Math.random() * 9000);
            return `HCMS2026${fallbackSeq}`;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const generatedAck = await generateAcknowledgementNumber();
            setAckNumber(generatedAck);

            // Directly save form data along with Base64 strings into Firestore
            await addDoc(collection(db, "admissions"), {
                firstName: formData.firstName,
                middleName: formData.middleName,
                lastName: formData.lastName,
                grade: formData.grade,
                parentName: formData.parentName,
                phone: formData.phone,
                address: formData.address,
                religion: formData.religion,
                caste: formData.caste,
                subCaste: formData.subCaste,
                idNumber: formData.idNumber,
                communityCertNo: formData.communityCertNo,
                physicalAbility: formData.physicalAbility,
                disabilityDetails: formData.disabilityDetails,
                aadharFileUrl: formData.aadharFile,        // Base64 string representation
                communityFileUrl: formData.communityFile, // Base64 string representation
                tcFileUrl: formData.tcFile,               // Base64 string representation
                acknowledgementNumber: generatedAck,
                status: 'Pending',
                createdAt: serverTimestamp()
            });

            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting application: ", error);
            alert("Submission failed. Please check your database connection rules.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="adm-premium-card success-card-view">
                <div className="success-icon-badge"><CheckCircle2 size={48} color="#8004c7" /></div>
                <h3>Application Submitted Successfully!</h3>
                <p>Welcome. Your unique tracking acknowledgement number is:</p>
                <div className="ack-badge-box">{ackNumber}</div>
                <p className="sub-text">Please save this reference code. You can check the progress inside the Admin Portal.</p>
                <button className="reset-form-btn" onClick={() => { setSubmitted(false); setStep(1); }}>
                    Submit Another Application
                </button>
            </div>
        );
    }

    return (
        <div className="adm-premium-card">
            <div className="form-header-area">
                <div className="form-title-group">
                    <h3>Online Admission Portal</h3>
                    <p>Academic Year 2026–2027</p>
                </div>
                <div className="step-indicator-pill">Step {step} of 4</div>
            </div>

            <div className="wizard-steps-bar">
                {['Personal Details', 'Background', 'Documents', 'Review'].map((name, idx) => {
                    const stepNum = idx + 1;
                    const isActive = step === stepNum;
                    const isCompleted = step > stepNum;
                    return (
                        <div key={idx} className={`wizard-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                            <div className="wizard-step-bubble">{isCompleted ? <Check size={14} /> : stepNum}</div>
                            <span>{name}</span>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={step === 4 ? handleSubmit : handleNext} className="adm-real-form">
                {step === 1 && (
                    <div className="form-grid fade-in-section">
                        <div className="form-group"><label>First Name *</label><input type="text" required placeholder="e.g. Alex" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} /></div>
                        <div className="form-group"><label>Middle Name</label><input type="text" placeholder="e.g. Kumar" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} /></div>
                        <div className="form-group"><label>Last Name *</label><input type="text" required placeholder="e.g. Johnson" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></div>
                        <div className="form-group">
                            <label>Grade Applying For *</label>
                            <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })}>
                                <option value="LKG">LKG</option><option value="UKG">UKG</option>
                                <option value="1st Std">1st Std</option><option value="2nd Std">2nd Std</option>
                                <option value="3rd Std">3rd Std</option><option value="4th Std">4th Std</option>
                                <option value="5th Std">5th Std</option><option value="6th Std">6th Std</option>
                                <option value="7th Std">7th Std</option><option value="8th Std">8th Std</option>
                                <option value="9th Std">9th Std</option><option value="10th Std">10th Std</option>
                                <option value="11th Std">11th Std</option><option value="12th Std">12th Std</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Parent / Guardian Name *</label><input type="text" required placeholder="e.g. Robert Johnson" value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })} /></div>
                        <div className="form-group"><label>Phone Number *</label><input type="tel" required placeholder="e.g. +91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                        <div className="form-group full-width"><label>Residential Address *</label><input type="text" required placeholder="House no, Street name, City, Pincode" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                        <div className="form-group"><label>Religion *</label><input type="text" required placeholder="e.g. Christian / Hindu / Muslim" value={formData.religion} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} /></div>
                        <div className="form-group"><label>Caste *</label><input type="text" required placeholder="e.g. BC / MBC / SC / General" value={formData.caste} onChange={(e) => setFormData({ ...formData, caste: e.target.value })} /></div>
                        <div className="form-group"><label>Sub-Caste</label><input type="text" placeholder="Enter sub-caste if applicable" value={formData.subCaste} onChange={(e) => setFormData({ ...formData, subCaste: e.target.value })} /></div>
                    </div>
                )}

                {step === 2 && (
                    <div className="form-grid fade-in-section">
                        <div className="form-group full-width"><label>Official Identity Document Number *</label><input type="text" required placeholder="Enter valid official identity card number" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} /></div>
                        <div className="form-group"><label>Community Certificate Number *</label><input type="text" required placeholder="e.g. CC-2026-XXXX" value={formData.communityCertNo} onChange={(e) => setFormData({ ...formData, communityCertNo: e.target.value })} /></div>
                        <div className="form-group">
                            <label>Physical Ability Status *</label>
                            <select value={formData.physicalAbility} onChange={(e) => setFormData({ ...formData, physicalAbility: e.target.value })}>
                                <option value="Normal">Normal</option>
                                <option value="Physically Challenged">Physically Challenged</option>
                                <option value="Other">Other Medical Considerations</option>
                            </select>
                        </div>
                        {(formData.physicalAbility === 'Physically Challenged' || formData.physicalAbility === 'Other') && (
                            <div className="form-group full-width conditional-box">
                                <label>Please Specify Disability / Medical Considerations *</label>
                                <input type="text" required placeholder="Provide detailed description" value={formData.disabilityDetails} onChange={(e) => setFormData({ ...formData, disabilityDetails: e.target.value })} />
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="form-grid fade-in-section">
                        {compressionStatus && (
                            <div className="compression-toast-banner"><FileText size={16} /><span>{compressionStatus}</span></div>
                        )}
                        <div className="form-group full-width upload-card-container">
                            <label><Upload size={16} /> Upload Official Identity Document *</label>
                            <div className="file-drop-zone">
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" required={!formData.aadharFile} onChange={(e) => handleFileUpload(e, 'aadharFile')} />
                                <div className="drop-zone-text">
                                    <span>{formData.aadharFile ? 'File attached successfully' : 'Click to browse or drop file here'}</span>
                                    <small>Supports JPG, PNG, PDF</small>
                                </div>
                            </div>
                        </div>

                        <div className="form-group full-width upload-card-container">
                            <label><Upload size={16} /> Upload Community Certificate *</label>
                            <div className="file-drop-zone">
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" required={!formData.communityFile} onChange={(e) => handleFileUpload(e, 'communityFile')} />
                                <div className="drop-zone-text">
                                    <span>{formData.communityFile ? 'File attached successfully' : 'Click to browse or drop file here'}</span>
                                    <small>Supports JPG, PNG, PDF</small>
                                </div>
                            </div>
                        </div>

                        {['UKG', '1st Std', '2nd Std', '3rd Std', '4th Std', '5th Std', '6th Std', '7th Std', '8th Std', '9th Std', '10th Std', '11th Std', '12th Std'].includes(formData.grade) && (
                            <div className="form-group full-width upload-card-container">
                                <label><Upload size={16} /> Transfer Certificate (TC) — Required for {formData.grade} *</label>
                                <div className="file-drop-zone">
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" required={!formData.tcFile} onChange={(e) => handleFileUpload(e, 'tcFile')} />
                                    <div className="drop-zone-text">
                                        <span>{formData.tcFile ? 'File attached successfully' : 'Click to browse or drop file here'}</span>
                                        <small>Previous institution Transfer Certificate is mandatory</small>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="form-summary-review fade-in-section">
                        <h4>Review Application Details</h4>
                        <p className="summary-subtitle">Please verify your details before final submission.</p>
                        
                        <div className="summary-card-grid">
                            <div className="summary-item"><span className="sum-label">Full Name</span><span className="sum-val">{formData.firstName} {formData.middleName} {formData.lastName}</span></div>
                            <div className="summary-item"><span className="sum-label">Grade Applied</span><span className="sum-val">{formData.grade}</span></div>
                            <div className="summary-item"><span className="sum-label">Parent / Guardian</span><span className="sum-val">{formData.parentName}</span></div>
                            <div className="summary-item"><span className="sum-label">Phone Number</span><span className="sum-val">{formData.phone}</span></div>
                            <div className="summary-item full-span"><span className="sum-label">Address</span><span className="sum-val">{formData.address}</span></div>
                            <div className="summary-item"><span className="sum-label">Religion & Caste</span><span className="sum-val">{formData.religion} / {formData.caste}</span></div>
                            <div className="summary-item"><span className="sum-label">Community Cert No.</span><span className="sum-val">{formData.communityCertNo}</span></div>
                            <div className="summary-item full-span"><span className="sum-label">Physical Status</span><span className="sum-val">{formData.physicalAbility} {formData.disabilityDetails ? `— ${formData.disabilityDetails}` : ''}</span></div>
                        </div>
                    </div>
                )}

                <div className="form-nav-buttons">
                    {step > 1 ? (
                        <button type="button" onClick={handlePrev} className="secondary-nav-btn"><ArrowLeft size={16} /> Back</button>
                    ) : <div />}

                    {step < 4 ? (
                        <button type="submit" className="submit-action-btn">Next Step <ArrowRight size={16} /></button>
                    ) : (
                        <button type="submit" className="submit-action-btn final-submit-btn" disabled={loading}>
                            <Send size={16} /> {loading ? 'Processing Submission...' : 'Confirm & Submit Application'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}