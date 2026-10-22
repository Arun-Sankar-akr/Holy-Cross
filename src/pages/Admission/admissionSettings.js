import { createContext, useContext } from 'react';

// Class ids are exactly the values the application form saves in `grade`.
export const ADMISSION_CLASSES = [
    'LKG', 'UKG', '1st Std', '2nd Std', '3rd Std', '4th Std', '5th Std', '6th Std',
    '7th Std', '8th Std', '9th Std', '10th Std', '11th Std', '12th Std',
];

export const classLabel = (c) => c;

export const DEFAULT_ADMISSION_SETTINGS = {
    open: false,
    academicYear: '2026–27',
    classFrom: 'LKG',
    classTo: '12th Std',
    closedClasses: [],
};

// Turns whatever is stored in Firestore into safe, complete settings.
export function normalizeAdmissionSettings(data = {}) {
    const d = DEFAULT_ADMISSION_SETTINGS;
    const from = ADMISSION_CLASSES.includes(data.classFrom) ? data.classFrom : d.classFrom;
    const to = ADMISSION_CLASSES.includes(data.classTo) ? data.classTo : d.classTo;
    return {
        open: data.open === true,
        academicYear: String(data.academicYear || '').trim() || d.academicYear,
        classFrom: from,
        classTo: to,
        closedClasses: Array.isArray(data.closedClasses)
            ? data.closedClasses.filter((c) => ADMISSION_CLASSES.includes(c))
            : [],
    };
}

export const getClassesInRange = (s) => {
    const a = ADMISSION_CLASSES.indexOf(s.classFrom);
    const b = ADMISSION_CLASSES.indexOf(s.classTo);
    return a <= b ? ADMISSION_CLASSES.slice(a, b + 1) : [];
};

// Classes that are inside the range and not manually closed.
export const getOpenClasses = (s) => getClassesInRange(s).filter((c) => !s.closedClasses.includes(c));

export const formatClassRange = (s) =>
    s.classFrom === s.classTo ? classLabel(s.classFrom) : `${s.classFrom} – ${s.classTo}`;

// Settings plus the derived values pages usually need.
export function buildAdmissionConfig(data) {
    const s = normalizeAdmissionSettings(data);
    const inRange = getClassesInRange(s);
    return {
        ...s,
        classesInRange: inRange,
        openClasses: getOpenClasses(s),
        closedInRange: inRange.filter((c) => s.closedClasses.includes(c)),
        rangeLabel: formatClassRange(s),
    };
}

export const AdmissionConfigContext = createContext(
    buildAdmissionConfig({ ...DEFAULT_ADMISSION_SETTINGS, open: true })
);

// Use inside any page wrapped by <AdmissionGate>:
//   const { academicYear, openClasses, isClassOpen } = useAdmissionConfig();
export const useAdmissionConfig = () => {
    const cfg = useContext(AdmissionConfigContext);
    return { ...cfg, isClassOpen: (c) => cfg.openClasses.includes(c) };
};