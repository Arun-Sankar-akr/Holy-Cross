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
    ClipboardCheck
} from 'lucide-react';
import './AdmissionForm.css';

const STEP_META = [
    { key: 1, label: 'Personal Details', tag: 'PERSONAL INFO', icon: <FileText size={18} />, bullets: ['Name, Grade & DOB', 'Parent & Contact'] },
    { key: 2, label: 'Background', tag: 'ELIGIBILITY INFO', icon: <BadgeCheck size={18} />, bullets: ['Identity & Community', 'Physical Ability'] },
    { key: 3, label: 'Documents', tag: 'FILE UPLOAD', icon: <Upload size={18} />, bullets: ['ID Proof & TC', 'Community Certificate'] },
    { key: 4, label: 'Review', tag: 'FINAL STEP', icon: <ClipboardCheck size={18} />, bullets: ['Verify Details', 'Submit Application'] },
];

/*
 * IMPORTANT STORAGE DESIGN
 * ------------------------
 * Firebase Storage is NOT used.
 *
 * Firestore has a ~1 MiB limit PER DOCUMENT, not per collection.
 * Previously all three Base64 files were stored inside the same admission
 * document, so the combined Base64 payload could exceed the limit.
 *
 * This version keeps Base64 but stores each uploaded document separately:
 *
 * admissions/{admissionDocId}/documents/aadhar
 * admissions/{admissionDocId}/documents/community
 * admissions/{admissionDocId}/documents/tc
 *
 * Therefore the admission record stays small and each file has its own
 * Firestore document. No Firebase Storage is required.
 *
 * The existing main admission document keeps only small metadata fields:
 * aadharFileStored, communityFileStored, tcFileStored.
 *
 * If your Admin Dashboard currently reads aadharFileUrl/communityFileUrl/
 * tcFileUrl directly from the admission document, it must also read the
 * documents subcollection. A ready-to-use helper is included below.
 */

const MAX_BASE64_CHARS_PER_FILE = 700000;
const MAX_PDF_BYTES = 180 * 1024;

const DOCUMENT_KEYS = {
    aadharFile: 'aadhar',
    communityFile: 'community',
    tcFile: 'tc'
};

const isPdf = (value) => typeof value === 'string' && value.startsWith('data:application/pdf');
const isBase64DataUrl = (value) => typeof value === 'string' && value.startsWith('data:');

const getBase64ApproxKB = (base64) => {
    if (!base64) return 0;
    return Math.round((base64.length * 0.75) / 1024);
};

/**
 * Optional helper for AdminDashboard / AdmissionDashboard.
 *
 * Usage:
 * const files = await getAdmissionDocuments(admissionDocId);
 * files.aadharFile / files.communityFile / files.tcFile are Base64 data URLs.
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
        } else if (key === 'tc' || key === 'tcFile') {
            result.tcFile = data.base64 || null;
        }
    });

    return result;
};

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

    const [formData, setFormData] = useState({
        firstName: initialData?.firstName || '',
        middleName: initialData?.middleName || '',
        lastName: initialData?.lastName || '',
        grade: initialData?.grade || 'LKG',
        parentName: initialData?.parentName || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        religion: initialData?.religion || '',
        caste: initialData?.caste || '',
        subCaste: initialData?.subCaste || '',
        idNumber: initialData?.idNumber || '',
        communityCertNo: initialData?.communityCertNo || '',
        physicalAbility: initialData?.physicalAbility || 'Normal',
        disabilityDetails: initialData?.disabilityDetails || '',
        aadharFile: initialData?.aadharFile || null,
        communityFile: initialData?.communityFile || null,
        tcFile: initialData?.tcFile || null
    });

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
                        tcFile: files.tcFile || prev.tcFile || null
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

    const validateFilesBeforeSubmit = () => {
        const files = [
            ['Official Identity Document', formData.aadharFile],
            ['Community Certificate', formData.communityFile]
        ];

        const requiresTC = [
            'UKG',
            '1st Std',
            '2nd Std',
            '3rd Std',
            '4th Std',
            '5th Std',
            '6th Std',
            '7th Std',
            '8th Std',
            '9th Std',
            '10th Std',
            '11th Std',
            '12th Std'
        ].includes(formData.grade);

        if (requiresTC) {
            files.push(['Transfer Certificate', formData.tcFile]);
        }

        for (const [label, value] of files) {
            if (!value) {
                return `${label} is required.`;
            }

            if (!isBase64DataUrl(value)) {
                return `${label} is invalid. Please upload it again.`;
            }

            if (value.length > MAX_BASE64_CHARS_PER_FILE) {
                return `${label} is too large. Please upload a smaller file.`;
            }
        }

        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        const fileError = validateFilesBeforeSubmit();

        if (fileError) {
            alert(fileError);
            setStep(3);
            return;
        }

        setLoading(true);
        setCompressionStatus('Preparing application...');

        const payload = {
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

            /*
             * IMPORTANT:
             * DO NOT put Base64 strings here.
             * Only small metadata is stored in the main admission document.
             */
            aadharFileStored: !!formData.aadharFile,
            communityFileStored: !!formData.communityFile,
            tcFileStored: !!formData.tcFile,

            updatedAt: serverTimestamp()
        };

        let admissionId = docId;
        let createdNewAdmission = false;

        try {
            if (mode === 'edit' && docId) {
                setCompressionStatus('Saving application details...');

                await updateDoc(
                    doc(db, 'admissions', docId),
                    payload
                );
            } else {
                const generatedAck =
                    await generateAcknowledgementNumber();

                setAckNumber(generatedAck);

                setCompressionStatus(
                    'Creating application record...'
                );

                const admissionRef = await addDoc(
                    collection(db, 'admissions'),
                    {
                        ...payload,
                        acknowledgementNumber: generatedAck,
                        status: 'Pending',
                        createdAt: serverTimestamp()
                    }
                );

                admissionId = admissionRef.id;
                createdNewAdmission = true;
            }

            /*
             * Save Base64 files AFTER the main document has been created.
             * Each file gets a separate Firestore document.
             */
            setCompressionStatus('Saving uploaded documents...');

            const existingDocumentIds =
                mode === 'edit' && docId
                    ? await getExistingDocumentIds(admissionId)
                    : {};

            await saveBase64Document(
                admissionId,
                'aadharFile',
                formData.aadharFile,
                existingDocumentIds
            );

            await saveBase64Document(
                admissionId,
                'communityFile',
                formData.communityFile,
                existingDocumentIds
            );

            if (
                [
                    'UKG',
                    '1st Std',
                    '2nd Std',
                    '3rd Std',
                    '4th Std',
                    '5th Std',
                    '6th Std',
                    '7th Std',
                    '8th Std',
                    '9th Std',
                    '10th Std',
                    '11th Std',
                    '12th Std'
                ].includes(formData.grade)
            ) {
                await saveBase64Document(
                    admissionId,
                    'tcFile',
                    formData.tcFile,
                    existingDocumentIds
                );
            }

            setCompressionStatus('');
            setSubmitted(true);

            if (onUpdated) {
                onUpdated();
            }
        } catch (error) {
            console.error('Error submitting application:', error);

            /*
             * If a newly created admission was made but one of its document
             * uploads failed, remove the empty/incomplete admission record.
             */
            if (createdNewAdmission && admissionId) {
                try {
                    await deleteDoc(
                        doc(db, 'admissions', admissionId)
                    );
                } catch (cleanupError) {
                    console.error(
                        'Could not clean up incomplete admission:',
                        cleanupError
                    );
                }
            }

            if (error?.code === 'permission-denied') {
                alert(
                    'Submission failed because Firestore Security Rules rejected the request. Your Base64 files are now stored separately, so if this message remains, update the Firestore rules for admissions and admissions/{admissionId}/documents.'
                );
            } else if (error?.code === 'unauthenticated') {
                alert(
                    'Your Firebase session expired. Please refresh the page and try again.'
                );
            } else if (
                error?.message?.includes('maximum allowed size') ||
                error?.message?.includes('longer than') ||
                error?.message?.includes('exceeds')
            ) {
                alert(
                    'One uploaded document is still too large for Firestore. Please upload a smaller image/PDF.'
                );
            } else if (error?.code === 'unavailable') {
                alert(
                    'Submission failed because the server could not be reached. Please check your internet connection and try again.'
                );
            } else {
                alert(
                    `Submission failed: ${
                        error?.message ||
                        'Unknown error'
                    }`
                );
            }

            setCompressionStatus('');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        if (mode === 'edit') {
            return (
                <div className="adm-premium-card success-card-view">
                    <div className="success-icon-badge">
                        <CheckCircle2 size={48} color="#123A70" />
                    </div>

                    <h3>Application Updated Successfully!</h3>

                    <p>
                        Your changes have been saved against
                        acknowledgement number:
                    </p>

                    <div className="ack-badge-box">
                        {ackNumber}
                    </div>

                    <p className="sub-text">
                        You can log in again any time to review or
                        update your details further.
                    </p>
                </div>
            );
        }

        return (
            <div className="adm-premium-card success-card-view">
                <div className="success-icon-badge">
                    <CheckCircle2 size={48} color="#123A70" />
                </div>

                <h3>Application Submitted Successfully!</h3>

                <p>
                    Welcome. Your unique tracking acknowledgement
                    number is:
                </p>

                <div className="ack-badge-box">
                    {ackNumber}
                </div>

                <p className="sub-text">
                    Please save this reference code. You can check
                    the progress inside the Admin Portal.
                </p>

                <button
                    className="reset-form-btn"
                    onClick={() => {
                        setSubmitted(false);
                        setStep(1);
                        setAckNumber('');
                        setFormData((prev) => ({
                            ...prev,
                            firstName: '',
                            middleName: '',
                            lastName: '',
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
                        }));
                    }}
                >
                    Submit Another Application
                </button>
            </div>
        );
    }

    const currentMeta = STEP_META[step - 1];

    return (
        <div className="adm-reg-shell">
            <div className="adm-reg-grid">

                <aside className="adm-reg-sidenav">
                    {STEP_META.map((s) => {
                        const isActive = step === s.key;
                        const isDone = step > s.key;

                        return (
                            <div
                                key={s.key}
                                className={`adm-reg-navitem ${
                                    isActive ? 'active' : ''
                                } ${
                                    isDone ? 'completed' : ''
                                }`}
                            >
                                <div className="adm-reg-navnum">
                                    {isDone ? (
                                        <Check size={14} />
                                    ) : (
                                        s.key
                                    )}
                                </div>

                                <div className="adm-reg-navtext">
                                    <strong>{s.label}</strong>
                                    <span>{s.tag}</span>

                                    <ul>
                                        {s.bullets.map(
                                            (b, i) => (
                                                <li key={i}>
                                                    {b}
                                                </li>
                                            )
                                        )}
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
                                <h3>
                                    {mode === 'edit'
                                        ? 'Application Flow'
                                        : 'Registration Flow'}
                                </h3>

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
                            const isActive =
                                step === s.key;
                            const isDone =
                                step > s.key;

                            return (
                                <React.Fragment key={s.key}>
                                    <div
                                        className={`adm-reg-step-node ${
                                            isActive
                                                ? 'active'
                                                : ''
                                        } ${
                                            isDone
                                                ? 'done'
                                                : ''
                                        }`}
                                    >
                                        <div className="adm-reg-step-circle">
                                            {isDone ? (
                                                <Check size={16} />
                                            ) : (
                                                s.icon
                                            )}
                                        </div>

                                        <span>{s.label}</span>
                                    </div>

                                    {idx <
                                        STEP_META.length - 1 && (
                                        <div
                                            className={`adm-reg-step-line ${
                                                step > s.key
                                                    ? 'filled'
                                                    : ''
                                            }`}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <form
                        onSubmit={
                            step === 4
                                ? handleSubmit
                                : handleNext
                        }
                        className="adm-real-form"
                    >
                        <div className="adm-reg-step-heading">
                            <div>
                                <h4>
                                    {currentMeta.label}
                                </h4>

                                <span className="adm-reg-step-tag">
                                    {currentMeta.tag}
                                </span>
                            </div>

                            <span className="adm-reg-step-count">
                                STEP {step} / 4
                            </span>
                        </div>

                        {step === 1 && (
                            <div className="form-grid fade-in-section">
                                <div className="form-group">
                                    <label>
                                        First Name *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Alex"
                                        value={
                                            formData.firstName
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                firstName:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Middle Name
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="e.g. Kumar"
                                        value={
                                            formData.middleName
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                middleName:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Last Name *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Johnson"
                                        value={
                                            formData.lastName
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                lastName:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Grade Applying For *
                                    </label>

                                    <select
                                        value={formData.grade}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                grade: e.target.value
                                            })
                                        }
                                    >
                                        <option value="LKG">LKG</option>
                                        <option value="UKG">UKG</option>
                                        <option value="1st Std">1st Std</option>
                                        <option value="2nd Std">2nd Std</option>
                                        <option value="3rd Std">3rd Std</option>
                                        <option value="4th Std">4th Std</option>
                                        <option value="5th Std">5th Std</option>
                                        <option value="6th Std">6th Std</option>
                                        <option value="7th Std">7th Std</option>
                                        <option value="8th Std">8th Std</option>
                                        <option value="9th Std">9th Std</option>
                                        <option value="10th Std">10th Std</option>
                                        <option value="11th Std">11th Std</option>
                                        <option value="12th Std">12th Std</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Parent / Guardian Name *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Robert Johnson"
                                        value={
                                            formData.parentName
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                parentName:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Phone Number *
                                    </label>

                                    <input
                                        type="tel"
                                        required
                                        placeholder="+91 98765 43210"
                                        value={
                                            formData.phone
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phone:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>
                                        Residential Address *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        placeholder="House no, Street name, City, Pincode"
                                        value={
                                            formData.address
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                address:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Religion *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Christian / Hindu / Muslim"
                                        value={
                                            formData.religion
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                religion:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Caste *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. BC / MBC / SC / General"
                                        value={
                                            formData.caste
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                caste:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Sub-Caste
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="Enter sub-caste if applicable"
                                        value={
                                            formData.subCaste
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                subCaste:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="form-grid fade-in-section">
                                <div className="form-group full-width">
                                    <label>
                                        Official Identity Document Number *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter valid official identity card number"
                                        value={
                                            formData.idNumber
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                idNumber:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Community Certificate Number *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. CC-2026-XXXX"
                                        value={
                                            formData.communityCertNo
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                communityCertNo:
                                                    e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Physical Ability Status *
                                    </label>

                                    <select
                                        value={
                                            formData.physicalAbility
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                physicalAbility:
                                                    e.target.value
                                            })
                                        }
                                    >
                                        <option value="Normal">
                                            Normal
                                        </option>

                                        <option value="Physically Challenged">
                                            Physically Challenged
                                        </option>

                                        <option value="Other">
                                            Other Medical Considerations
                                        </option>
                                    </select>
                                </div>

                                {(
                                    formData.physicalAbility ===
                                        'Physically Challenged' ||
                                    formData.physicalAbility ===
                                        'Other'
                                ) && (
                                    <div className="form-group full-width conditional-box">
                                        <label>
                                            Please Specify Disability / Medical Considerations *
                                        </label>

                                        <input
                                            type="text"
                                            required
                                            placeholder="Provide detailed description"
                                            value={
                                                formData.disabilityDetails
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    disabilityDetails:
                                                        e.target.value
                                                })
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="form-grid fade-in-section">
                                {compressionStatus && (
                                    <div className="compression-toast-banner">
                                        <FileText size={16} />
                                        <span>
                                            {compressionStatus}
                                        </span>
                                    </div>
                                )}

                                {documentLoading && (
                                    <div className="compression-toast-banner">
                                        <FileText size={16} />
                                        <span>
                                            Loading existing documents...
                                        </span>
                                    </div>
                                )}

                                <div className="form-group full-width upload-card-container">
                                    <label>
                                        <Upload size={16} />
                                        Upload Official Identity Document *
                                    </label>

                                    <div className="file-drop-zone">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            required={
                                                !formData.aadharFile
                                            }
                                            onChange={(e) =>
                                                handleFileUpload(
                                                    e,
                                                    'aadharFile'
                                                )
                                            }
                                        />

                                        <div className="drop-zone-text">
                                            <span>
                                                {formData.aadharFile
                                                    ? 'File attached successfully'
                                                    : 'Click to browse or drop file here'}
                                            </span>

                                            <small>
                                                JPG/PNG are compressed to Base64.
                                                PDF must be under 180 KB.
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group full-width upload-card-container">
                                    <label>
                                        <Upload size={16} />
                                        Upload Community Certificate *
                                    </label>

                                    <div className="file-drop-zone">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            required={
                                                !formData.communityFile
                                            }
                                            onChange={(e) =>
                                                handleFileUpload(
                                                    e,
                                                    'communityFile'
                                                )
                                            }
                                        />

                                        <div className="drop-zone-text">
                                            <span>
                                                {formData.communityFile
                                                    ? 'File attached successfully'
                                                    : 'Click to browse or drop file here'}
                                            </span>

                                            <small>
                                                JPG/PNG are compressed to Base64.
                                                PDF must be under 180 KB.
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                {[
                                    'UKG',
                                    '1st Std',
                                    '2nd Std',
                                    '3rd Std',
                                    '4th Std',
                                    '5th Std',
                                    '6th Std',
                                    '7th Std',
                                    '8th Std',
                                    '9th Std',
                                    '10th Std',
                                    '11th Std',
                                    '12th Std'
                                ].includes(formData.grade) && (
                                    <div className="form-group full-width upload-card-container">
                                        <label>
                                            <Upload size={16} />
                                            Transfer Certificate (TC) —
                                            Required for {formData.grade} *
                                        </label>

                                        <div className="file-drop-zone">
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                required={
                                                    !formData.tcFile
                                                }
                                                onChange={(e) =>
                                                    handleFileUpload(
                                                        e,
                                                        'tcFile'
                                                    )
                                                }
                                            />

                                            <div className="drop-zone-text">
                                                <span>
                                                    {formData.tcFile
                                                        ? 'File attached successfully'
                                                        : 'Click to browse or drop file here'}
                                                </span>

                                                <small>
                                                    JPG/PNG are compressed to Base64.
                                                    PDF must be under 180 KB.
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 4 && (
                            <div className="form-summary-review fade-in-section">
                                <h4>
                                    Review Application Details
                                </h4>

                                <p className="summary-subtitle">
                                    Please verify your details before final submission.
                                </p>

                                <div className="summary-card-grid">
                                    <div className="summary-item">
                                        <span className="sum-label">
                                            Full Name
                                        </span>
                                        <span className="sum-val">
                                            {formData.firstName}{' '}
                                            {formData.middleName}{' '}
                                            {formData.lastName}
                                        </span>
                                    </div>

                                    <div className="summary-item">
                                        <span className="sum-label">
                                            Grade Applied
                                        </span>
                                        <span className="sum-val">
                                            {formData.grade}
                                        </span>
                                    </div>

                                    <div className="summary-item">
                                        <span className="sum-label">
                                            Parent / Guardian
                                        </span>
                                        <span className="sum-val">
                                            {formData.parentName}
                                        </span>
                                    </div>

                                    <div className="summary-item">
                                        <span className="sum-label">
                                            Phone Number
                                        </span>
                                        <span className="sum-val">
                                            {formData.phone}
                                        </span>
                                    </div>

                                    <div className="summary-item full-span">
                                        <span className="sum-label">
                                            Address
                                        </span>
                                        <span className="sum-val">
                                            {formData.address}
                                        </span>
                                    </div>

                                    <div className="summary-item">
                                        <span className="sum-label">
                                            Religion & Caste
                                        </span>
                                        <span className="sum-val">
                                            {formData.religion} /{' '}
                                            {formData.caste}
                                        </span>
                                    </div>

                                    <div className="summary-item">
                                        <span className="sum-label">
                                            Community Cert No.
                                        </span>
                                        <span className="sum-val">
                                            {formData.communityCertNo}
                                        </span>
                                    </div>

                                    <div className="summary-item full-span">
                                        <span className="sum-label">
                                            Physical Status
                                        </span>

                                        <span className="sum-val">
                                            {formData.physicalAbility}{' '}
                                            {formData.disabilityDetails
                                                ? `— ${formData.disabilityDetails}`
                                                : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="adm-reg-footer">
                            <div className="adm-reg-progress">
                                <span className="adm-reg-progress-label">
                                    PROGRESS
                                </span>

                                <div className="adm-reg-progress-track">
                                    <div
                                        className="adm-reg-progress-fill"
                                        style={{
                                            width: `${
                                                (step / 4) *
                                                100
                                            }%`
                                        }}
                                    />
                                </div>

                                <span className="adm-reg-progress-count">
                                    {step} of 4
                                </span>
                            </div>

                            <div className="adm-reg-footer-actions">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="secondary-nav-btn"
                                    >
                                        <ArrowLeft size={16} />
                                        Back
                                    </button>
                                )}

                                {step < 4 ? (
                                    <button
                                        type="submit"
                                        className="submit-action-btn"
                                    >
                                        Next Step
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
