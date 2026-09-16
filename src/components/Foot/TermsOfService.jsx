import React from 'react';
import LegalPage from './LegalPage';

export default function TermsOfService() {
    return (
        <LegalPage
            eyebrow="Legal"
            title="Terms of Service"
            effectiveDate="1 June 2026"
            intro="These terms govern your use of the Holy Cross Matriculation Higher Secondary School website, admissions portal, and student ERP. By using this site, you agree to the terms below."
            sections={[
                {
                    id: 'use-of-site',
                    heading: 'Use of this website',
                    paragraphs: [
                        'This website is provided to share information about the school, accept admission applications, and give enrolled students and parents access to the student ERP. You agree to use it only for these purposes and not to attempt to disrupt, misuse, or gain unauthorised access to any part of the site.',
                    ],
                },
                {
                    id: 'accounts',
                    heading: 'Accounts and access',
                    list: [
                        'ERP and portal access is issued to parents, students, and staff for their own use only and may not be shared or transferred.',
                        'You are responsible for keeping your login credentials confidential and for all activity under your account.',
                        'The school may suspend an account if it is misused or if information provided is found to be inaccurate.',
                    ],
                },
                {
                    id: 'admissions',
                    heading: 'Admission applications',
                    paragraphs: [
                        'Submitting an application through the admissions portal does not guarantee a seat. All applications are reviewed against the school\u2019s admission procedure and available capacity, and applicants will be informed of the outcome directly.',
                        'Information submitted during admission must be accurate and complete. The school reserves the right to withdraw an offer if information is later found to be false.',
                    ],
                },
                {
                    id: 'fees',
                    heading: 'Fees',
                    paragraphs: [
                        'Fee structures published on this website are indicative and may be revised for each academic year. The applicable fee schedule communicated at the time of admission or renewal governs actual payment.',
                    ],
                },
                {
                    id: 'content',
                    heading: 'Website content',
                    paragraphs: [
                        'Text, images, and the school logo on this site belong to Holy Cross Matriculation Higher Secondary School and may not be copied or reused without permission, other than for personal, non-commercial reference.',
                    ],
                },
                {
                    id: 'availability',
                    heading: 'Availability',
                    paragraphs: [
                        'We aim to keep the website and ERP available at all times but do not guarantee uninterrupted access. The site may be temporarily unavailable for maintenance or due to circumstances outside our control.',
                    ],
                },
                {
                    id: 'liability',
                    heading: 'Limitation of liability',
                    paragraphs: [
                        'The school is not liable for indirect or incidental loss arising from use of this website, to the extent permitted by law. Nothing in these terms limits any liability that cannot be limited under applicable law.',
                    ],
                },
                {
                    id: 'changes-to-terms',
                    heading: 'Changes to these terms',
                    paragraphs: [
                        'We may update these terms from time to time. Continued use of the website after an update means you accept the revised terms.',
                    ],
                },
            ]}
            contactNote="For questions about these terms, contact hcms2002@gmail.com or call 0431 260 7175."
        />
    );
}
