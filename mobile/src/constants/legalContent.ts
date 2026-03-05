/**
 * Static legal and safety content for in-app display.
 * Replace with full legal text or load from API/CMS when available.
 *
 * When you publish new Terms/Privacy/Disclaimer, bump LEGAL_DOCUMENT_VERSION
 * (e.g. to '2026-03-01'). Backend stores which version the user accepted;
 * later you can force re-accept when current version > stored version.
 */

/** Version of legal documents. Bump when terms/privacy/disclaimer change; used when recording acceptance. */
export const LEGAL_DOCUMENT_VERSION = '2026-03-04';

export const TERMS_OF_SERVICE = `
Terms of Service

Last updated: [Date]

1. Acceptance
By creating an account or using MindfulKids, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service.

2. Educational Purpose
MindfulKids is an educational emotional skill-building platform. It does not provide medical, psychological, or clinical services. It does not diagnose, treat, or prevent any condition. Use of the platform does not create a therapist–client or other professional relationship between you and MindfulKids.

3. Professional Independence
Professionals (including therapists) listed on the platform are independent. MindfulKids does not supervise, control, or provide their professional services. Any therapeutic or other professional services are solely between you and that professional. MindfulKids is not responsible for the conduct, advice, or outcomes of any listed professional.

4. Appointment Booking
MindfulKids acts only as a scheduling platform for appointments. It does not employ therapists or other professionals. It does not control availability, scheduling decisions, or the provision of services. MindfulKids is not responsible for cancellations, no-shows, outcomes of sessions, or disputes between you and a professional.

5. No Guaranteed Outcomes
Emotional development and skill-building vary by individual. No specific results or outcomes from use of the platform are guaranteed.

6. Parental Responsibility
Parents or legal guardians are responsible for supervising their child’s use of the platform. Child profiles must be created and managed by a parent or legal guardian. MindfulKids is not responsible for unsupervised or inappropriate use of the platform by a child.

7. Accounts
You must provide accurate information when registering. You are responsible for keeping your password secure and for all activity under your account. You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account.

8. Acceptable Use
You agree to use the service only for lawful purposes and in a way that does not harm others or the service. You may not misuse the platform, attempt to gain unauthorized access, or use it to harass or harm minors.

9. Content and Intellectual Property
Content provided by MindfulKids (activities, advice, design) is owned by us or our licensors. You may use it only within the app for personal, non-commercial use. User-generated content remains yours; you grant us a license to use it to operate and improve the service.

10. Disclaimers
The service is provided "as is." We do not guarantee uninterrupted or error-free service. We are not liable for decisions you make based on content in the app. For professional advice, consult a qualified professional.

11. Limitation of Liability
To the maximum extent permitted by law, MindfulKids and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of the platform.

12. Changes
We may update these terms. We will notify you of material changes (e.g. in-app or by email). Continued use after changes constitutes acceptance.

13. Contact
For questions about these terms, contact us via the app or the contact details on our website.
`.trim();

export const PRIVACY_POLICY = `
Privacy Policy

Last updated: [Date]

1. Who we are
MindfulKids ("we," "our") operates the MindfulKids app and related services. This policy describes how we collect, use, and protect your information. We comply with applicable privacy laws in the jurisdictions where we operate.

2. What data we collect
• Account information: name, email, and password (stored securely; passwords are never stored in plain text).
• Child profile data: name, age group, and optional birth date when you add a child; used to personalize activities and progress.
• Activity progress: activity completions, emotion check-ins, and similar data so we can provide the service and show progress.
• Booking data: information related to scheduling appointments with professionals (e.g. selected professional, requested time) to facilitate appointment scheduling.

3. Why we collect it
We collect this data to: provide structured emotional skill practice; track progress; personalize the experience; facilitate appointment scheduling; maintain your account; improve our content and product; communicate with you about important updates; and comply with legal obligations. We do not sell your personal data.

4. Who controls child data
Parents or legal guardians control their child’s profile and data. Child profiles are created and managed through the parent account.

5. Your rights and deletion
You can access, correct, or delete your account and associated data from within the app or by contacting us. You may request deletion of your data at any time; we will process such requests in line with our policies and applicable law. In some jurisdictions you have additional rights (e.g. data portability, objection). Contact us to exercise them.

6. Sharing
We may share data with service providers who help us operate (e.g. hosting, analytics) under strict confidentiality. We may disclose information if required by law or to protect rights and safety. We do not sell your data.

7. Security
We use industry-standard measures to protect your data (e.g. encryption, access controls). No system is 100% secure; we encourage a strong password and keeping your device secure.

8. Children
The service is intended for use by parents/guardians. We do not knowingly collect data from children under 13 without parental consent. Child profiles are set up and controlled by the parent account.

9. International
Data may be processed in countries where we or our providers operate. We take steps to ensure appropriate safeguards where required by applicable law.

10. Changes
We may update this policy. We will notify you of material changes (e.g. in-app or by email). Continued use after changes constitutes acceptance.

11. Contact
For privacy questions or requests, contact us via the app or the contact details on our website.
`.trim();

export const PROFESSIONAL_DISCLAIMER = `
Professional Disclaimer

This platform is not therapy. It is an educational tool for structured emotional skill practice. It is not a substitute for professional mental health, medical, or legal advice or care.

If you have concerns about your or your child’s mental health, please consult a qualified professional. In an emergency, contact local emergency services or a crisis helpline in your area.

By using the app, you acknowledge that you have read this disclaimer and understand the limits of the service.
`.trim();

export const PROVIDER_TERMS = `
Provider Terms

Last updated: [Date]

These terms apply to professionals (therapists, clinic administrators) who use MindfulKids to deliver or manage services.

1. Professional use
You agree to use the platform in accordance with your professional obligations and applicable law. You are responsible for the accuracy of your profile, credentials, and availability.

2. Listing and verification
MindfulKids may verify your credentials and clinic information. You must provide accurate information and update it when it changes. Listing does not imply endorsement by MindfulKids.

3. Appointments and clients
You are solely responsible for the professional services you provide. MindfulKids is a scheduling and tool platform only. The therapeutic or professional relationship is between you and the client.

4. Data and privacy
You must handle client and user data in accordance with our Privacy Policy and applicable data protection laws. Do not use platform data for purposes outside the service.

5. Termination
We may suspend or remove access for breach of these terms or for operational reasons. You may stop using the platform at any time.

6. Contact
For provider-specific questions, contact us via the app or the contact details on our website.
`.trim();
