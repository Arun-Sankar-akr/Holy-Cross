import React, { useEffect, useState } from 'react';
import { db } from '../../service/firebase';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore';
import {
    CheckCircle2,
    Send,
    ArrowLeft,
    ArrowRight,
    Upload,
    FileText,
    Check,
    ShieldCheck,
    BadgeCheck,
    ClipboardCheck,
    User,
    Pencil,
    AlertCircle
} from 'lucide-react';
import './AdmissionForm.css';

/*
 * FORM STRUCTURE
 * 1. Personal Details  (1.1 Student, 1.2 Class, 1.3 Parent / Guardian)
 * 2. Background        (2.1 Document numbers, 2.2 Physical ability)
 * 3. Documents         (file uploads)
 * 4. Preview           (read-only review with Edit links)
 * 5. Final Submit      (declaration + submit)
 */
const STEP_META = [
    { key: 1, label: 'Personal Details', tag: 'About the student', icon: <User size={18} />, bullets: ['Student, Class & Previous School', 'Parent / Guardian'] },
    { key: 2, label: 'Background', tag: 'Eligibility details', icon: <BadgeCheck size={18} />, bullets: ['Aadhaar & Community Numbers', 'Physical Ability'] },
    { key: 3, label: 'Documents', tag: 'Upload files', icon: <Upload size={18} />, bullets: ['Photo, Aadhaar, DOB & Community', 'TC (UKG onwards)'] },
    { key: 4, label: 'Preview', tag: 'Check your application', icon: <FileText size={18} />, bullets: ['Review every detail', 'Edit any section'] },
    { key: 5, label: 'Final Submit', tag: 'Confirm and submit', icon: <ClipboardCheck size={18} />, bullets: ['Declaration', 'Submit Application'] }
];

const TOTAL_STEPS = STEP_META.length;

const GRADES = [
    'LKG', 'UKG', '1st Std', '2nd Std', '3rd Std', '4th Std', '5th Std', '6th Std',
    '7th Std', '8th Std', '9th Std', '10th Std', '11th Std', '12th Std'
];

/* Previous school + Transfer Certificate are needed for every class except LKG */
const requiresPreviousSchool = (grade) => !!grade && grade !== 'LKG';
const requiresTC = requiresPreviousSchool;

/*
 * IMPORTANT STORAGE DESIGN
 * ------------------------
 * Firebase Storage is NOT used. Each uploaded file is stored as Base64 in its
 * own Firestore document so the admission record stays small:
 *
 * admissions/{admissionDocId}/documents/{auto-id}  ->  { fieldName, base64, contentType }
 */

const MAX_BASE64_CHARS_PER_FILE = 700000;
const MAX_PDF_BYTES = 180 * 1024;

const DOCUMENT_KEYS = {
    aadharFile: 'aadhar',
    communityFile: 'community',
    dobFile: 'dob',
    tcFile: 'tc',
    studentPhoto: 'studentPhoto'
};

const FILE_LABELS = {
    studentPhoto: 'Student Photo',
    aadharFile: 'Aadhaar Card',
    communityFile: 'Community Certificate',
    dobFile: 'Date of Birth Certificate',
    tcFile: 'Transfer Certificate (TC)'
};

const isPdf = (value) => typeof value === 'string' && value.startsWith('data:application/pdf');
const isBase64DataUrl = (value) => typeof value === 'string' && value.startsWith('data:');

const getBase64ApproxKB = (base64) => {
    if (!base64) return 0;
    return Math.round((base64.length * 0.75) / 1024);
};

/**
 * Helper for the Admin panel.
 * const files = await getAdmissionDocuments(admissionDocId);
 * files.aadharFile / communityFile / dobFile / tcFile / studentPhoto are Base64 data URLs.
 */
export const getAdmissionDocuments = async (admissionDocId) => {
    if (!admissionDocId) return {};

    const snapshot = await getDocs(
        collection(db, 'admissions', admissionDocId, 'documents')
    );

    const result = {};

    snapshot.forEach((item) => {
        const data = item.data();
        const key = data.fieldName || item.id;

        if (key === 'aadhar' || key === 'aadharFile') {
            result.aadharFile = data.base64 || null;
        } else if (key === 'community' || key === 'communityFile') {
            result.communityFile = data.base64 || null;
        } else if (key === 'dob' || key === 'dobFile') {
            result.dobFile = data.base64 || null;
        } else if (key === 'tc' || key === 'tcFile') {
            result.tcFile = data.base64 || null;
        } else if (key === 'studentPhoto') {
            result.studentPhoto = data.base64 || null;
        }
    });

    return result;
};

/* Build the empty / initial form state. Also maps older applications
 * (single parentName + relationship) onto the new father / mother / guardian fields. */
const buildFormState = (initialData) => {
    const d = initialData || {};
    const rel = (d.parentRelationship || '').toLowerCase();
    const legacyName = d.parentName || '';
    const legacyPhone = d.parentPhone || d.phone || '';

    const legacyFather = !d.fatherName && rel === 'father';
    const legacyMother = !d.motherName && rel === 'mother';
    const legacyGuardian = !d.guardianName && !!legacyName && rel !== 'father' && rel !== 'mother';

    return {
        firstName: d.firstName || '',
        middleName: d.middleName || '',
        lastName: d.lastName || '',
        dob: d.dob || '',
        gender: d.gender || '',
        aadharNumber: d.aadharNumber || d.idNumber || '',
        religion: d.religion || '',
        caste: d.caste || '',
        subCaste: d.subCaste || '',

        grade: d.grade || 'LKG',
        previousSchool: d.previousSchool || '',

        fatherName: d.fatherName || (legacyFather ? legacyName : ''),
        fatherMobile: d.fatherMobile || (legacyFather ? legacyPhone : ''),
        motherName: d.motherName || (legacyMother ? legacyName : ''),
        motherMobile: d.motherMobile || (legacyMother ? legacyPhone : ''),
        hasGuardian: !!d.hasGuardian || legacyGuardian,
        guardianName: d.guardianName || (legacyGuardian ? legacyName : ''),
        guardianMobile: d.guardianMobile || (legacyGuardian ? legacyPhone : ''),

        communityCertNo: d.communityCertNo || '',
        physicalAbility: d.physicalAbility || 'Normal',
        disabilityDetails: d.disabilityDetails || '',

        studentPhoto: d.studentPhoto || null,
        aadharFile: d.aadharFile || null,
        communityFile: d.communityFile || null,
        dobFile: d.dobFile || null,
        tcFile: d.tcFile || null
    };
};

const onlyDigits = (value, max) => String(value || '').replace(/\D/g, '').slice(0, max);

const fullName = (f) => [f.firstName, f.middleName, f.lastName].filter(Boolean).join(' ');

export default function AdmissionForm({
    mode = 'create',
    docId = null,
    initialData = null,
    onUpdated
}) {
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [ackNumber, setAckNumber] = useState(
        initialData?.acknowledgementNumber || ''
    );
    const [compressionStatus, setCompressionStatus] = useState('');
    const [documentLoading, setDocumentLoading] = useState(false);
    const [stepError, setStepError] = useState('');
    const [declared, setDeclared] = useState(false);

    const [formData, setFormData] = useState(() => buildFormState(initialData));

    const setField = (name, value) =>
        setFormData((prev) => ({ ...prev, [name]: value }));

    /*
     * When editing an existing application, load Base64 documents from the
     * separate Firestore subcollection.
     */
    useEffect(() => {
        let cancelled = false;

        const loadExistingDocuments = async () => {
            if (mode !== 'edit' || !docId) return;

            setDocumentLoading(true);

            try {
                const files = await getAdmissionDocuments(docId);

                if (!cancelled) {
                    setFormData((prev) => ({
                        ...prev,
                        aadharFile: files.aadharFile || prev.aadharFile || null,
                        communityFile: files.communityFile || prev.communityFile || null,
                        dobFile: files.dobFile || prev.dobFile || null,
                        tcFile: files.tcFile || prev.tcFile || null,
                        studentPhoto: files.studentPhoto || prev.studentPhoto || null
                    }));
                }
            } catch (error) {
                console.error('Error loading existing Base64 documents:', error);
                if (!cancelled) {
                    setCompressionStatus(
                        'Could not load existing documents. You can re-upload them.'
                    );
                }
            } finally {
                if (!cancelled) setDocumentLoading(false);
            }
        };

        loadExistingDocuments();

        return () => {
            cancelled = true;
        };
    }, [mode, docId]);

    /**
     * Compress images into JPEG Base64.
     *
     * The output target is deliberately much smaller than the Firestore
     * per-document limit because Base64 has overhead and Firestore also
     * stores field/document metadata.
     */
    const compressImage = (file, maxWidth = 900, quality = 0.28) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onerror = (error) => reject(error);

            reader.onload = (event) => {
                const img = new Image();

                img.onerror = (error) => reject(error);

                img.onload = () => {
                    try {
                        let width = img.width;
                        let height = img.height;

                        if (!width || !height) {
                            reject(new Error('Invalid image dimensions.'));
                            return;
                        }

                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d', {
                            alpha: false
                        });

                        if (!ctx) {
                            reject(new Error('Could not create image canvas.'));
                            return;
                        }

                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);

                        const compressed = canvas.toDataURL(
                            'image/jpeg',
                            quality
                        );

                        resolve(compressed);
                    } catch (error) {
                        reject(error);
                    }
                };

                img.src = event.target.result;
            };

            reader.readAsDataURL(file);
        });
    };

    /*
     * If an image is still larger than our safe Base64 size after compression,
     * compress it again using smaller dimensions/quality.
     */
    const compressImageToSafeSize = async (file) => {
        const attempts = [
            { width: 900, quality: 0.28 },
            { width: 750, quality: 0.22 },
            { width: 600, quality: 0.18 },
            { width: 480, quality: 0.15 }
        ];

        let smallest = '';

        for (const attempt of attempts) {
            const result = await compressImage(
                file,
                attempt.width,
                attempt.quality
            );

            smallest = result;

            if (result.length <= MAX_BASE64_CHARS_PER_FILE) {
                return result;
            }
        }

        if (smallest.length > MAX_BASE64_CHARS_PER_FILE) {
            throw new Error(
                'Image remains too large after compression. Please upload a clearer but smaller/cropped image.'
            );
        }

        return smallest;
    };

    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setCompressionStatus('Compressing file...');

        try {
            if (file.type.startsWith('image/')) {
                const compressedBase64 = await compressImageToSafeSize(file);

                if (compressedBase64.length > MAX_BASE64_CHARS_PER_FILE) {
                    throw new Error(
                        'The compressed image is still too large.'
                    );
                }

                const approxSizeKB =
                    getBase64ApproxKB(compressedBase64);

                setFormData((prev) => ({
                    ...prev,
                    [fieldName]: compressedBase64
                }));

                setCompressionStatus(
                    `Image compressed & attached (~${approxSizeKB} KB).`
                );
            } else if (file.type === 'application/pdf') {
                /*
                 * Keep PDFs as Base64, but limit their original binary size
                 * more aggressively so the resulting Base64 document stays
                 * safely below the Firestore document limit.
                 */
                if (file.size > MAX_PDF_BYTES) {
                    alert(
                        'PDF is too large. Please upload a PDF under 180 KB, or take a photo/screenshot and upload it as JPG/PNG.'
                    );

                    setCompressionStatus(
                        'PDF exceeded the 180 KB safe limit.'
                    );

                    e.target.value = '';
                    return;
                }

                const reader = new FileReader();

                reader.onerror = () => {
                    setCompressionStatus('Failed to read PDF.');
                };

                reader.onload = () => {
                    const base64 = reader.result;

                    if (
                        typeof base64 !== 'string' ||
                        base64.length > MAX_BASE64_CHARS_PER_FILE
                    ) {
                        alert(
                            'This PDF becomes too large when converted to Base64. Please use a smaller PDF.'
                        );
                        setCompressionStatus(
                            'PDF Base64 size exceeded the safe limit.'
                        );
                        e.target.value = '';
                        return;
                    }

                    setFormData((prev) => ({
                        ...prev,
                        [fieldName]: base64
                    }));

                    setCompressionStatus(
                        `PDF attached (~${getBase64ApproxKB(base64)} KB).`
                    );
                };

                reader.readAsDataURL(file);
            } else {
                alert('Please upload only JPG, PNG, or PDF files.');
                setCompressionStatus('');
                e.target.value = '';
            }
        } catch (error) {
            console.error('Error processing file:', error);
            alert(
                error?.message ||
                'Could not process this file. Please choose a smaller file.'
            );
            setCompressionStatus('Failed to process file.');
            e.target.value = '';
        }
    };

    const generateAcknowledgementNumber = async () => {
        try {
            const q = query(
                collection(db, 'admissions'),
                orderBy('createdAt', 'desc'),
                limit(1)
            );

            const querySnapshot = await getDocs(q);

            let nextSeq = 1;

            if (!querySnapshot.empty) {
                const lastDoc = querySnapshot.docs[0].data();
                const lastAck = lastDoc.acknowledgementNumber;

                if (lastAck && lastAck.startsWith('HCMS2026')) {
                    const seqPart = parseInt(
                        lastAck.replace('HCMS2026', ''),
                        10
                    );

                    if (!Number.isNaN(seqPart)) {
                        nextSeq = seqPart + 1;
                    }
                }
            }

            return `HCMS2026${String(nextSeq).padStart(4, '0')}`;
        } catch (error) {
            console.error(
                'Error generating acknowledgement number:',
                error
            );

            const fallbackSeq = Math.floor(
                1000 + Math.random() * 9000
            );

            return `HCMS2026${fallbackSeq}`;
        }
    };

    /*
     * Save one Base64 document in its own Firestore document.
     *
     * This is the key fix:
     * - admission metadata = one small Firestore document
     * - aadhar Base64 = separate Firestore document
     * - community Base64 = separate Firestore document
     * - TC Base64 = separate Firestore document
     *
     * No Firebase Storage is used.
     */
    const saveBase64Document = async (
        admissionId,
        fieldName,
        base64,
        existingDocumentIds = {}
    ) => {
        if (!base64) return;

        if (!isBase64DataUrl(base64)) {
            throw new Error(
                `${fieldName} contains invalid file data. Please re-upload it.`
            );
        }

        if (base64.length > MAX_BASE64_CHARS_PER_FILE) {
            throw new Error(
                `${fieldName} is too large for Firestore. Please re-upload a smaller file.`
            );
        }

        const documentKey = DOCUMENT_KEYS[fieldName];

        if (!documentKey) return;

        const filePayload = {
            fieldName: documentKey,
            base64,
            contentType: isPdf(base64)
                ? 'application/pdf'
                : 'image/jpeg',
            updatedAt: serverTimestamp()
        };

        const existingId = existingDocumentIds[documentKey];

        if (existingId) {
            await updateDoc(
                doc(
                    db,
                    'admissions',
                    admissionId,
                    'documents',
                    existingId
                ),
                filePayload
            );
        } else {
            await addDoc(
                collection(
                    db,
                    'admissions',
                    admissionId,
                    'documents'
                ),
                {
                    ...filePayload,
                    createdAt: serverTimestamp()
                }
            );
        }
    };

    const getExistingDocumentIds = async (admissionId) => {
        const snapshot = await getDocs(
            collection(db, 'admissions', admissionId, 'documents')
        );

        const ids = {};

        snapshot.forEach((item) => {
            const data = item.data();

            if (data.fieldName) {
                ids[data.fieldName] = item.id;
            }
        });

        return ids;
    };

    /* ------------------------------------------------------------------ */
    /* Validation                                                          */
    /* ------------------------------------------------------------------ */

    const validateFiles = () => {
        const files = [
            ['studentPhoto', formData.studentPhoto],
            ['aadharFile', formData.aadharFile],
            ['dobFile', formData.dobFile],
            ['communityFile', formData.communityFile]
        ];

        if (requiresTC(formData.grade)) {
            files.push(['tcFile', formData.tcFile]);
        }

        for (const [key, value] of files) {
            const label = FILE_LABELS[key];

            if (!value) return `${label} is required.`;
            if (!isBase64DataUrl(value)) return `${label} is invalid. Please upload it again.`;
            if (value.length > MAX_BASE64_CHARS_PER_FILE) {
                return `${label} is too large. Please upload a smaller file.`;
            }
        }

        return '';
    };

    const validateStep = (stepNo) => {
        const f = formData;

        if (stepNo === 1) {
            if (!f.firstName.trim() || !f.lastName.trim()) return 'Please enter the student\'s first and last name.';
            if (!f.dob) return 'Please select the date of birth.';
            if (!f.gender) return 'Please select the gender.';
            if (f.aadharNumber.length !== 12) return 'Aadhaar number must be exactly 12 digits.';
            if (!f.religion.trim() || !f.caste.trim()) return 'Please enter religion and caste.';

            if (requiresPreviousSchool(f.grade) && !f.previousSchool.trim()) {
                return `Previous school name is required for ${f.grade}.`;
            }

            if (f.hasGuardian) {
                if (!f.guardianName.trim()) return 'Please enter the guardian\'s name.';
                if (f.guardianMobile.length !== 10) return 'Guardian mobile number must be 10 digits.';
            } else {
                if (!f.fatherName.trim()) return 'Please enter the father\'s name.';
                if (!f.motherName.trim()) return 'Please enter the mother\'s name.';
                if (!f.fatherMobile && !f.motherMobile) {
                    return 'Please enter a mobile number for the father or the mother (at least one).';
                }
            }

            if (f.fatherMobile && f.fatherMobile.length !== 10) return 'Father\'s mobile number must be 10 digits.';
            if (f.motherMobile && f.motherMobile.length !== 10) return 'Mother\'s mobile number must be 10 digits.';
        }

        if (stepNo === 2) {
            if (f.aadharNumber.length !== 12) return 'Aadhaar number must be exactly 12 digits.';
            if (!f.communityCertNo.trim()) return 'Please enter the community certificate number.';
            if (f.physicalAbility !== 'Normal' && !f.disabilityDetails.trim()) {
                return 'Please describe the disability / medical consideration.';
            }
        }

        if (stepNo === 3) return validateFiles();

        return '';
    };

    const scrollToPanel = () => {
        const el = document.querySelector('.adm-reg-panel');
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const goToStep = (target) => {
        setStep(target);
        setStepError('');
        setCompressionStatus('');
        scrollToPanel();
    };

    const handleNext = (e) => {
        e.preventDefault();

        const error = validateStep(step);
        if (error) {
            setStepError(error);
            scrollToPanel();
            return;
        }

        goToStep(Math.min(step + 1, TOTAL_STEPS));
    };

    const handlePrev = () => goToStep(Math.max(step - 1, 1));

    /* ------------------------------------------------------------------ */
    /* Submit                                                              */
    /* ------------------------------------------------------------------ */

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        for (const s of [1, 2, 3]) {
            const error = validateStep(s);
            if (error) {
                setStep(s);
                setStepError(error);
                scrollToPanel();
                return;
            }
        }

        if (!declared) {
            setStepError('Please tick the declaration before submitting.');
            return;
        }

        setStepError('');
        setLoading(true);
        setCompressionStatus('Preparing application...');

        const f = formData;
        const guardian = f.hasGuardian;
        const parentName = guardian ? f.guardianName.trim() : (f.fatherName.trim() || f.motherName.trim());
        const parentRelationship = guardian ? 'Guardian' : (f.fatherName.trim() ? 'Father' : 'Mother');
        const contactPhone = guardian ? f.guardianMobile : (f.fatherMobile || f.motherMobile);

        const payload = {
            firstName: f.firstName.trim(),
            middleName: f.middleName.trim(),
            lastName: f.lastName.trim(),
            dob: f.dob,
            gender: f.gender,
            aadharNumber: f.aadharNumber,
            idNumber: f.aadharNumber, // kept so older admin screens still find it
            religion: f.religion.trim(),
            caste: f.caste.trim(),
            subCaste: f.subCaste.trim(),

            grade: f.grade,
            previousSchool: requiresPreviousSchool(f.grade) ? f.previousSchool.trim() : '',

            hasGuardian: guardian,
            fatherName: guardian ? '' : f.fatherName.trim(),
            fatherMobile: guardian ? '' : f.fatherMobile,
            motherName: guardian ? '' : f.motherName.trim(),
            motherMobile: guardian ? '' : f.motherMobile,
            guardianName: guardian ? f.guardianName.trim() : '',
            guardianMobile: guardian ? f.guardianMobile : '',

            // Compatibility fields used by the login page and the admin panel
            parentName,
            parentRelationship,
            parentPhone: contactPhone,
            phone: contactPhone,

            communityCertNo: f.communityCertNo.trim(),
            physicalAbility: f.physicalAbility,
            disabilityDetails: f.physicalAbility === 'Normal' ? '' : f.disabilityDetails.trim(),

            /*
             * IMPORTANT: DO NOT put Base64 strings here.
             * Only small flags are stored in the main admission document.
             */
            studentPhotoStored: !!f.studentPhoto,
            aadharFileStored: !!f.aadharFile,
            dobFileStored: !!f.dobFile,
            communityFileStored: !!f.communityFile,
            tcFileStored: requiresTC(f.grade) ? !!f.tcFile : false,

            updatedAt: serverTimestamp()
        };

        let admissionId = docId;
        let createdNewAdmission = false;

        try {
            if (mode === 'edit' && docId) {
                setCompressionStatus('Saving application details...');
                await updateDoc(doc(db, 'admissions', docId), payload);
            } else {
                const generatedAck = await generateAcknowledgementNumber();
                setAckNumber(generatedAck);
                setCompressionStatus('Creating application record...');

                const admissionRef = await addDoc(collection(db, 'admissions'), {
                    ...payload,
                    acknowledgementNumber: generatedAck,
                    status: 'Pending',
                    createdAt: serverTimestamp()
                });

                admissionId = admissionRef.id;
                createdNewAdmission = true;
            }

            /* Each file gets its own Firestore document. */
            setCompressionStatus('Saving uploaded documents...');

            const existingDocumentIds =
                mode === 'edit' && docId ? await getExistingDocumentIds(admissionId) : {};

            await saveBase64Document(admissionId, 'studentPhoto', f.studentPhoto, existingDocumentIds);
            await saveBase64Document(admissionId, 'aadharFile', f.aadharFile, existingDocumentIds);
            await saveBase64Document(admissionId, 'dobFile', f.dobFile, existingDocumentIds);
            await saveBase64Document(admissionId, 'communityFile', f.communityFile, existingDocumentIds);

            if (requiresTC(f.grade)) {
                await saveBase64Document(admissionId, 'tcFile', f.tcFile, existingDocumentIds);
            }

            setCompressionStatus('');
            setSubmitted(true);

            if (onUpdated) onUpdated();
        } catch (error) {
            console.error('Error submitting application:', error);

            /* Remove an incomplete record if a document upload failed. */
            if (createdNewAdmission && admissionId) {
                try {
                    await deleteDoc(doc(db, 'admissions', admissionId));
                } catch (cleanupError) {
                    console.error('Could not clean up incomplete admission:', cleanupError);
                }
            }

            if (error?.code === 'permission-denied') {
                alert('Submission failed because Firestore Security Rules rejected the request. Please update the Firestore rules for admissions and admissions/{admissionId}/documents.');
            } else if (error?.code === 'unauthenticated') {
                alert('Your Firebase session expired. Please refresh the page and try again.');
            } else if (
                error?.message?.includes('maximum allowed size') ||
                error?.message?.includes('longer than') ||
                error?.message?.includes('exceeds')
            ) {
                alert('One uploaded document is still too large for Firestore. Please upload a smaller image/PDF.');
            } else if (error?.code === 'unavailable') {
                alert('Submission failed because the server could not be reached. Please check your internet connection and try again.');
            } else {
                alert(`Submission failed: ${error?.message || 'Unknown error'}`);
            }

            setCompressionStatus('');
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------------------------------------------ */
    /* Success screens                                                     */
    /* ------------------------------------------------------------------ */

    if (submitted) {
        if (mode === 'edit') {
            return (
                <div className="adm-premium-card success-card-view">
                    <div className="success-icon-badge">
                        <CheckCircle2 size={48} color="#0E8F68" />
                    </div>
                    <h3>Application Updated Successfully!</h3>
                    <p>Your changes have been saved against acknowledgement number:</p>
                    <div className="ack-badge-box">{ackNumber}</div>
                    <p className="sub-text">
                        You can log in again any time to review or update your details further.
                    </p>
                </div>
            );
        }

        return (
            <div className="adm-premium-card success-card-view">
                <div className="success-icon-badge">
                    <CheckCircle2 size={48} color="#0E8F68" />
                </div>
                <h3>Application Submitted Successfully!</h3>
                <p>Welcome. Your unique tracking acknowledgement number is:</p>
                <div className="ack-badge-box">{ackNumber}</div>
                <p className="sub-text">
                    Please save this reference code. You can check the progress inside the Admin Portal.
                </p>
                <button
                    className="reset-form-btn"
                    onClick={() => {
                        setSubmitted(false);
                        setStep(1);
                        setAckNumber('');
                        setDeclared(false);
                        setStepError('');
                        setFormData(buildFormState(null));
                    }}
                >
                    Submit Another Application
                </button>
            </div>
        );
    }

    /* ------------------------------------------------------------------ */
    /* Render helpers                                                      */
    /* ------------------------------------------------------------------ */

    const currentMeta = STEP_META[step - 1];
    const needsTC = requiresTC(formData.grade);

    const renderUpload = (fieldName, label, { accept = '.pdf,.jpg,.jpeg,.png', help, hint } = {}) => {
        const value = formData[fieldName];

        return (
            <div className="form-group full-width upload-card-container" key={fieldName}>
                <label>
                    <Upload size={16} />
                    {label} *
                </label>
                {hint && <small className="field-help">{hint}</small>}

                <div className="upload-row">
                    {value && (
                        <div className="upload-thumb">
                            {isPdf(value) ? (
                                <span><FileText size={20} />PDF</span>
                            ) : (
                                <img src={value} alt={label} />
                            )}
                        </div>
                    )}

                    <div className="file-drop-zone">
                        <input
                            type="file"
                            accept={accept}
                            required={!value}
                            onChange={(e) => handleFileUpload(e, fieldName)}
                        />
                        <div className="drop-zone-text">
                            <span>
                                {value ? 'File attached — click to replace' : 'Click to browse or drop file here'}
                            </span>
                            <small>{help || 'JPG/PNG are compressed automatically. PDF must be under 180 KB.'}</small>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const PreviewItem = ({ label, value }) => (
        <div className="summary-item">
            <span className="sum-label">{label}</span>
            <span className="sum-val">{value || '—'}</span>
        </div>
    );

    const PreviewSection = ({ title, editStep, children }) => (
        <div className="preview-section">
            <div className="preview-head">
                <h5>{title}</h5>
                <button type="button" className="preview-edit-btn" onClick={() => goToStep(editStep)}>
                    <Pencil size={13} /> Edit
                </button>
            </div>
            <div className="summary-card-grid">{children}</div>
        </div>
    );

    const docList = [
        ['studentPhoto', true],
        ['aadharFile', true],
        ['dobFile', true],
        ['communityFile', true],
        ['tcFile', needsTC]
    ].filter(([, show]) => show);

    return (
        <div className="adm-reg-shell">
            <div className="adm-reg-grid">

                <aside className="adm-reg-sidenav">
                    <div className="adm-reg-side-head">
                        <span className="adm-reg-side-kicker">
                            {mode === 'edit' ? 'Update application' : 'New application'}
                        </span>
                        <strong>Admissions 2026–2027</strong>
                        <div className="adm-reg-side-bar">
                            <span style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
                        </div>
                        <small>Step {step} of {TOTAL_STEPS} · {currentMeta.label}</small>
                    </div>

                    {STEP_META.map((s) => {
                        const isActive = step === s.key;
                        const isDone = step > s.key;

                        return (
                            <div
                                key={s.key}
                                className={`adm-reg-navitem ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                            >
                                <div className="adm-reg-navnum">
                                    {isDone ? <Check size={14} /> : s.key}
                                </div>
                                <div className="adm-reg-navtext">
                                    <strong>{s.label}</strong>
                                    <span>{s.tag}</span>
                                    <ul>
                                        {s.bullets.map((b, i) => (
                                            <li key={i}>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </aside>

                <div className="adm-reg-panel">

                    <div className="adm-reg-panel-head">
                        <div className="adm-reg-panel-title">
                            <span className="adm-reg-panel-icon">
                                <FileText size={18} />
                            </span>
                            <div>
                                <h3>{mode === 'edit' ? 'Application Flow' : 'Registration Flow'}</h3>
                                <p>
                                    {mode === 'edit'
                                        ? 'Review and update your submitted details'
                                        : 'Follow steps to complete your application'}
                                </p>
                            </div>
                        </div>
                        <span className="adm-reg-secure-pill">
                            <ShieldCheck size={14} />
                            Secure Portal
                        </span>
                    </div>

                    <div className="adm-reg-stepper">
                        {STEP_META.map((s, idx) => {
                            const isActive = step === s.key;
                            const isDone = step > s.key;

                            return (
                                <React.Fragment key={s.key}>
                                    <div className={`adm-reg-step-node ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                                        <div className="adm-reg-step-circle">
                                            {isDone ? <Check size={16} /> : s.icon}
                                        </div>
                                        <span>{s.label}</span>
                                    </div>
                                    {idx < STEP_META.length - 1 && (
                                        <div className={`adm-reg-step-line ${step > s.key ? 'filled' : ''}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <form
                        onSubmit={step === TOTAL_STEPS ? handleSubmit : handleNext}
                        className="adm-real-form"
                        noValidate={false}
                    >
                        <div className="adm-reg-step-heading">
                            <div>
                                <h4>{currentMeta.label}</h4>
                                <span className="adm-reg-step-tag">{currentMeta.tag}</span>
                            </div>
                            <span className="adm-reg-step-count">
                                Step {step} of {TOTAL_STEPS}
                            </span>
                        </div>

                        {stepError && (
                            <div className="form-error-banner" role="alert">
                                <AlertCircle size={16} />
                                <span>{stepError}</span>
                            </div>
                        )}

                        {/* ================= STEP 1 — PERSONAL DETAILS ================= */}
                        {step === 1 && (
                            <div className="form-grid fade-in-section admission-personal-step">

                                {/* 1.1 Student details */}
                                <div className="form-section-label full-width">
                                    <span className="form-section-kicker">1.1 Student details</span>
                                    <h5>Personal Details</h5>
                                    <p>Enter the student's details exactly as they appear in official records.</p>
                                </div>

                                <div className="form-group full-width student-name-row">
                                    <label>Student Name *</label>
                                    <div className="name-fields">
                                        <input type="text" required placeholder="First Name"
                                            value={formData.firstName}
                                            onChange={(e) => setField('firstName', e.target.value)} />
                                        <input type="text" placeholder="Middle Name"
                                            value={formData.middleName}
                                            onChange={(e) => setField('middleName', e.target.value)} />
                                        <input type="text" required placeholder="Last Name"
                                            value={formData.lastName}
                                            onChange={(e) => setField('lastName', e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Date of Birth *</label>
                                    <input type="date" required value={formData.dob}
                                        onChange={(e) => setField('dob', e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label>Gender *</label>
                                    <select required value={formData.gender}
                                        onChange={(e) => setField('gender', e.target.value)}>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>Aadhaar Number *</label>
                                    <input type="text" inputMode="numeric" required maxLength={12}
                                        pattern="[0-9]{12}" placeholder="12-digit Aadhaar number"
                                        value={formData.aadharNumber}
                                        onChange={(e) => setField('aadharNumber', onlyDigits(e.target.value, 12))} />
                                </div>

                                <div className="form-group">
                                    <label>Religion *</label>
                                    <input type="text" required placeholder="e.g. Christian"
                                        value={formData.religion}
                                        onChange={(e) => setField('religion', e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label>Caste *</label>
                                    <input type="text" required placeholder="Caste"
                                        value={formData.caste}
                                        onChange={(e) => setField('caste', e.target.value)} />
                                </div>

                                <div className="form-group full-width">
                                    <label>Sub-Caste</label>
                                    <input type="text" placeholder="Optional"
                                        value={formData.subCaste}
                                        onChange={(e) => setField('subCaste', e.target.value)} />
                                </div>

                                {/* 1.2 Class applying for */}
                                <div className="form-section-label parent-section-heading full-width">
                                    <span className="form-section-kicker">1.2 Class</span>
                                    <h5>Class Applying For</h5>
                                    <p>Previous school details are needed for every class from UKG onwards.</p>
                                </div>

                                <div className="form-group full-width">
                                    <label>Select Class *</label>
                                    <select required value={formData.grade}
                                        onChange={(e) => setField('grade', e.target.value)}>
                                        {GRADES.map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                                {requiresPreviousSchool(formData.grade) && (
                                    <div className="form-group full-width conditional-box">
                                        <label>Previous School Name *</label>
                                        <input type="text" required placeholder="Name of the school last attended"
                                            value={formData.previousSchool}
                                            onChange={(e) => setField('previousSchool', e.target.value)} />
                                    </div>
                                )}

                                {/* 1.3 Parent / guardian */}
                                <div className="form-section-label full-width">
                                    <span className="form-section-kicker">1.3 Parent details</span>
                                    <h5>Parent / Guardian</h5>
                                    <p>Give a mobile number for at least one parent. This number is used to log in and continue the application.</p>
                                </div>

                                <label className="check-row full-width">
                                    <input type="checkbox" checked={formData.hasGuardian}
                                        onChange={(e) => setField('hasGuardian', e.target.checked)} />
                                    <span>Father and mother are not alive — I will enter a Guardian instead</span>
                                </label>

                                {!formData.hasGuardian ? (
                                    <>
                                        <div className="form-group">
                                            <label>Father's Name *</label>
                                            <input type="text" required placeholder="Father's full name"
                                                value={formData.fatherName}
                                                onChange={(e) => setField('fatherName', e.target.value)} />
                                        </div>

                                        <div className="form-group">
                                            <label>Father's Mobile No.</label>
                                            <input type="tel" inputMode="numeric" maxLength={10} pattern="[0-9]{10}"
                                                placeholder="10-digit mobile number"
                                                value={formData.fatherMobile}
                                                onChange={(e) => setField('fatherMobile', onlyDigits(e.target.value, 10))} />
                                        </div>

                                        <div className="form-group">
                                            <label>Mother's Name *</label>
                                            <input type="text" required placeholder="Mother's full name"
                                                value={formData.motherName}
                                                onChange={(e) => setField('motherName', e.target.value)} />
                                        </div>

                                        <div className="form-group">
                                            <label>Mother's Mobile No.</label>
                                            <input type="tel" inputMode="numeric" maxLength={10} pattern="[0-9]{10}"
                                                placeholder="10-digit mobile number"
                                                value={formData.motherMobile}
                                                onChange={(e) => setField('motherMobile', onlyDigits(e.target.value, 10))} />
                                        </div>

                                        <small className="field-help full-width">
                                            At least one of the two mobile numbers is required.
                                        </small>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group conditional-box">
                                            <label>Guardian's Name *</label>
                                            <input type="text" required placeholder="Guardian's full name"
                                                value={formData.guardianName}
                                                onChange={(e) => setField('guardianName', e.target.value)} />
                                        </div>

                                        <div className="form-group conditional-box">
                                            <label>Guardian's Mobile No. *</label>
                                            <input type="tel" inputMode="numeric" required maxLength={10} pattern="[0-9]{10}"
                                                placeholder="10-digit mobile number"
                                                value={formData.guardianMobile}
                                                onChange={(e) => setField('guardianMobile', onlyDigits(e.target.value, 10))} />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ================= STEP 2 — BACKGROUND ================= */}
                        {step === 2 && (
                            <div className="form-grid fade-in-section">
                                <div className="form-section-label full-width">
                                    <span className="form-section-kicker">2.1 Document numbers</span>
                                    <h5>Identity &amp; Community</h5>
                                    <p>These numbers must match the documents you upload in the next step.</p>
                                </div>

                                <div className="form-group">
                                    <label>Aadhaar Number *</label>
                                    <input type="text" inputMode="numeric" required maxLength={12}
                                        pattern="[0-9]{12}" placeholder="12-digit Aadhaar number"
                                        value={formData.aadharNumber}
                                        onChange={(e) => setField('aadharNumber', onlyDigits(e.target.value, 12))} />
                                    <small className="field-help">Same number as entered in Personal Details.</small>
                                </div>

                                <div className="form-group">
                                    <label>Community Certificate Number *</label>
                                    <input type="text" required placeholder="e.g. CC-2026-XXXX"
                                        value={formData.communityCertNo}
                                        onChange={(e) => setField('communityCertNo', e.target.value)} />
                                </div>

                                <div className="form-section-label parent-section-heading full-width">
                                    <span className="form-section-kicker">2.2 Physical ability</span>
                                    <h5>Physical Ability</h5>
                                </div>

                                <div className="form-group full-width">
                                    <label>Physical Ability Status *</label>
                                    <select value={formData.physicalAbility}
                                        onChange={(e) => setField('physicalAbility', e.target.value)}>
                                        <option value="Normal">Normal</option>
                                        <option value="Physically Challenged">Physically Challenged</option>
                                        <option value="Other">Other Medical Considerations</option>
                                    </select>
                                </div>

                                {formData.physicalAbility !== 'Normal' && (
                                    <div className="form-group full-width conditional-box">
                                        <label>Please Specify Disability / Medical Considerations *</label>
                                        <input type="text" required placeholder="Provide detailed description"
                                            value={formData.disabilityDetails}
                                            onChange={(e) => setField('disabilityDetails', e.target.value)} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ================= STEP 3 — DOCUMENTS ================= */}
                        {step === 3 && (
                            <div className="form-grid fade-in-section">
                                {compressionStatus && (
                                    <div className="compression-toast-banner">
                                        <FileText size={16} />
                                        <span>{compressionStatus}</span>
                                    </div>
                                )}

                                {documentLoading && (
                                    <div className="compression-toast-banner">
                                        <FileText size={16} />
                                        <span>Loading existing documents...</span>
                                    </div>
                                )}

                                <div className="form-group full-width upload-card-container student-photo-upload">
                                    <label>
                                        <Upload size={16} />
                                        Student Photo *
                                    </label>

                                    <div className="photo-upload-layout">
                                        <div className="student-photo-preview">
                                            {formData.studentPhoto ? (
                                                <img src={formData.studentPhoto} alt="Student preview" />
                                            ) : (
                                                <div className="photo-placeholder">
                                                    <FileText size={26} />
                                                    <span>Photo</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="file-drop-zone">
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png"
                                                required={!formData.studentPhoto}
                                                onChange={(e) => handleFileUpload(e, 'studentPhoto')}
                                            />
                                            <div className="drop-zone-text">
                                                <span>{formData.studentPhoto ? 'Student photo attached' : 'Click to upload student photo'}</span>
                                                <small>JPG/PNG only. Use a clear recent passport-size photo.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {renderUpload('aadharFile', 'Aadhaar Card')}
                                {renderUpload('dobFile', 'Date of Birth Certificate')}
                                {renderUpload('communityFile', 'Community Certificate')}

                                {needsTC ? (
                                    renderUpload('tcFile', `Transfer Certificate (TC) — required for ${formData.grade}`)
                                ) : (
                                    <small className="field-help full-width">
                                        A Transfer Certificate is not required for LKG.
                                    </small>
                                )}
                            </div>
                        )}

                        {/* ================= STEP 4 — PREVIEW ================= */}
                        {step === 4 && (
                            <div className="form-summary-review fade-in-section">
                                <h4>Preview Your Application</h4>
                                <p className="summary-subtitle">
                                    Check every detail. Use Edit to go back and correct a section.
                                </p>

                                <PreviewSection title="Student Details" editStep={1}>
                                    <PreviewItem label="Full Name" value={fullName(formData)} />
                                    <PreviewItem label="Date of Birth" value={formData.dob} />
                                    <PreviewItem label="Gender" value={formData.gender} />
                                    <PreviewItem label="Aadhaar Number" value={formData.aadharNumber} />
                                    <PreviewItem label="Religion" value={formData.religion} />
                                    <PreviewItem label="Caste" value={formData.caste} />
                                    <PreviewItem label="Sub-Caste" value={formData.subCaste} />
                                </PreviewSection>

                                <PreviewSection title="Class Applying For" editStep={1}>
                                    <PreviewItem label="Class" value={formData.grade} />
                                    {requiresPreviousSchool(formData.grade) && (
                                        <PreviewItem label="Previous School" value={formData.previousSchool} />
                                    )}
                                </PreviewSection>

                                <PreviewSection title={formData.hasGuardian ? 'Guardian Details' : 'Parent Details'} editStep={1}>
                                    {formData.hasGuardian ? (
                                        <>
                                            <PreviewItem label="Guardian's Name" value={formData.guardianName} />
                                            <PreviewItem label="Guardian's Mobile" value={formData.guardianMobile} />
                                        </>
                                    ) : (
                                        <>
                                            <PreviewItem label="Father's Name" value={formData.fatherName} />
                                            <PreviewItem label="Father's Mobile" value={formData.fatherMobile} />
                                            <PreviewItem label="Mother's Name" value={formData.motherName} />
                                            <PreviewItem label="Mother's Mobile" value={formData.motherMobile} />
                                        </>
                                    )}
                                </PreviewSection>

                                <PreviewSection title="Background" editStep={2}>
                                    <PreviewItem label="Aadhaar Number" value={formData.aadharNumber} />
                                    <PreviewItem label="Community Certificate No." value={formData.communityCertNo} />
                                    <PreviewItem
                                        label="Physical Ability"
                                        value={
                                            formData.physicalAbility +
                                            (formData.physicalAbility !== 'Normal' && formData.disabilityDetails
                                                ? ` — ${formData.disabilityDetails}`
                                                : '')
                                        }
                                    />
                                </PreviewSection>

                                <div className="preview-section">
                                    <div className="preview-head">
                                        <h5>Uploaded Documents</h5>
                                        <button type="button" className="preview-edit-btn" onClick={() => goToStep(3)}>
                                            <Pencil size={13} /> Edit
                                        </button>
                                    </div>

                                    <div className="preview-docs">
                                        {docList.map(([key]) => {
                                            const value = formData[key];
                                            return (
                                                <div className={`preview-doc ${value ? '' : 'missing'}`} key={key}>
                                                    <div className="preview-doc-thumb">
                                                        {!value ? (
                                                            <span>Missing</span>
                                                        ) : isPdf(value) ? (
                                                            <span><FileText size={22} />PDF</span>
                                                        ) : (
                                                            <img src={value} alt={FILE_LABELS[key]} />
                                                        )}
                                                    </div>
                                                    <strong>{FILE_LABELS[key]}</strong>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= STEP 5 — FINAL SUBMIT ================= */}
                        {step === 5 && (
                            <div className="form-summary-review fade-in-section">
                                <h4>Final Submit</h4>
                                <p className="summary-subtitle">
                                    {mode === 'edit'
                                        ? 'Confirm to save your changes.'
                                        : 'One last step — confirm and submit your application.'}
                                </p>

                                <div className="summary-card-grid">
                                    <PreviewItem label="Student" value={fullName(formData)} />
                                    <PreviewItem label="Class" value={formData.grade} />
                                    <PreviewItem
                                        label="Contact Mobile"
                                        value={
                                            formData.hasGuardian
                                                ? formData.guardianMobile
                                                : formData.fatherMobile || formData.motherMobile
                                        }
                                    />
                                </div>

                                <label className="check-row declaration-row">
                                    <input type="checkbox" checked={declared} required
                                        onChange={(e) => setDeclared(e.target.checked)} />
                                    <span>
                                        I declare that all the information and documents provided are true and
                                        correct to the best of my knowledge. I understand that incorrect
                                        information may lead to cancellation of the application.
                                    </span>
                                </label>

                                {compressionStatus && (
                                    <div className="compression-toast-banner">
                                        <FileText size={16} />
                                        <span>{compressionStatus}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="adm-reg-footer">
                            <div className="adm-reg-progress">
                                <span className="adm-reg-progress-label">Progress</span>
                                <div className="adm-reg-progress-track">
                                    <div
                                        className="adm-reg-progress-fill"
                                        style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                                    />
                                </div>
                                <span className="adm-reg-progress-count">
                                    {step} of {TOTAL_STEPS}
                                </span>
                            </div>

                            <div className="adm-reg-footer-actions">
                                {step > 1 && (
                                    <button type="button" onClick={handlePrev} className="secondary-nav-btn">
                                        <ArrowLeft size={16} />
                                        Back
                                    </button>
                                )}

                                {step < TOTAL_STEPS ? (
                                    <button type="submit" className="submit-action-btn">
                                        {step === 4 ? 'Continue to Final Submit' : 'Next Step'}
                                        <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        className="submit-action-btn final-submit-btn"
                                        disabled={loading}
                                    >
                                        <Send size={16} />
                                        {loading
                                            ? mode === 'edit'
                                                ? 'Saving Changes...'
                                                : 'Processing Submission...'
                                            : mode === 'edit'
                                                ? 'Save Changes'
                                                : 'Confirm & Submit Application'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}