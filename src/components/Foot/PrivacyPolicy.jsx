import React from 'react';
import LegalPage from './LegalPage';

export default function PrivacyPolicy() {
    return (
        <LegalPage
            eyebrow="Legal"
            title="Privacy Policy"
            effectiveDate="1 June 2026"
            intro="This policy explains what information Holy Cross Matriculation Higher Secondary School collects through this website — including the admissions portal and student ERP — and how we use, store, and protect it."
            sections={[
                {
                    id: 'information-we-collect',
                    heading: 'Information we collect',
                    paragraphs: [
                        "We collect information that parents, students, and staff provide directly, and a small amount of technical information collected automatically when you use the site.",
                    ],
                    list: [
                        'Admissions details: student and parent/guardian name, date of birth, contact number, email, address, and previous school records submitted through the admission form.',
                        'ERP and account details: login credentials, class and section, attendance, and academic records for enrolled students.',
                        'Communication details: messages sent through contact forms or email, including your reply address.',
                        'Technical details: browser type, device type, and pages visited, collected automatically to keep the site working correctly.',
                    ],
                },
                {
                    id: 'how-we-use-it',
                    heading: 'How we use this information',
                    list: [
                        'To process and respond to admission applications.',
                        'To operate the student ERP, including attendance, academic records, and transport or hostel allocation.',
                        'To contact parents or guardians about school updates, events, or fees.',
                        'To maintain the security and proper functioning of the website.',
                    ],
                },
                {
                    id: 'sharing',
                    heading: 'How we share information',
                    paragraphs: [
                        'We do not sell or rent personal information. Information is shared only with school staff who need it to do their work (such as admissions or class teachers), and with service providers who host our website and database (Firebase), under standard confidentiality terms.',
                        'We may disclose information where required by law or by an education authority with lawful jurisdiction over the school.',
                    ],
                },
                {
                    id: 'data-retention',
                    heading: 'How long we keep information',
                    paragraphs: [
                        'Student academic records are retained for as long as required by school record-keeping norms. Admission enquiries that do not result in enrolment are retained for one academic year, after which they are deleted.',
                    ],
                },
                {
                    id: 'your-choices',
                    heading: 'Your choices',
                    list: [
                        'Parents and students may request a copy of the information we hold about them.',
                        'You may ask us to correct inaccurate information.',
                        'You may withdraw consent for optional communications (such as newsletters) at any time.',
                    ],
                },
                {
                    id: 'security',
                    heading: 'How we protect information',
                    paragraphs: [
                        'The admissions portal and ERP are access-controlled, and data is stored with Firebase using industry-standard encryption in transit. Access to student records is limited to authorised staff.',
                    ],
                },
                {
                    id: 'children',
                    heading: "Information about students",
                    paragraphs: [
                        'Because our students are minors, all admission and academic information about a student is submitted and managed by a parent or guardian, and is used strictly for education-related purposes.',
                    ],
                },
                {
                    id: 'changes',
                    heading: 'Changes to this policy',
                    paragraphs: [
                        'We may update this policy from time to time. The effective date at the top of this page will always reflect the latest version.',
                    ],
                },
            ]}
            contactNote="Questions about this policy can be sent to hcms2002@gmail.com or by calling 0431 260 7175."
        />
    );
}
