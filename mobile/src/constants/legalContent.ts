/**
 * Static legal and safety content for in-app display.
 * Replace with full legal text or load from API/CMS when available.
 *
 * When you publish new Terms/Privacy/Disclaimer, bump LEGAL_DOCUMENT_VERSION
 * (e.g. to '2026-03-01'). Backend stores which version the user accepted;
 * later you can force re-accept when current version > stored version.
 */

/** Version of legal documents. Bump when terms/privacy/disclaimer change; used when recording acceptance. */
export const LEGAL_DOCUMENT_VERSION = '2026-02-01';

export const TERMS_OF_SERVICE = `
Terms of Service

Last updated: [Date]

1. Acceptance
By creating an account or using Mindful Kids, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service.

2. Description of Service
Mindful Kids provides activities, advice, and tools to support emotional skill development and parent education. We are not a healthcare provider and do not diagnose, treat, or replace professional mental or medical care.

3. Accounts
You must provide accurate information when registering. You are responsible for keeping your password secure and for all activity under your account. You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account.

4. Acceptable Use
You agree to use the service only for lawful purposes and in a way that does not harm others or the service. You may not misuse the platform, attempt to gain unauthorized access, or use it to harass or harm minors.

5. Content and Intellectual Property
Content provided by Mindful Kids (activities, advice, design) is owned by us or our licensors. You may use it only within the app for personal, non-commercial use. User-generated content remains yours; you grant us a license to use it to operate and improve the service.

6. Disclaimers
The service is provided "as is." We do not guarantee uninterrupted or error-free service. We are not liable for decisions you make based on content in the app. For professional advice, consult a qualified professional.

7. Limitation of Liability
To the fullest extent permitted by law, Mindful Kids and its affiliates are not liable for indirect, incidental, special, or consequential damages arising from your use of the service.

8. Changes
We may update these terms. We will notify you of material changes (e.g. in-app or by email). Continued use after changes constitutes acceptance.

9. Contact
For questions about these terms, contact us via the app or the contact details on our website.
`.trim();

export const PRIVACY_POLICY = `
Privacy Policy

Last updated: [Date]

1. Who we are
Mindful Kids ("we," "our") operates the Mindful Kids app and related services. This policy describes how we collect, use, and protect your information.

2. Information we collect
• Account information: name, email, password (stored securely, never in plain text).
• Child profile (if you add a child): name, age group, and optional birth date; used only to personalize activities and progress.
• Usage and progress: activity completions, emotion check-ins, and similar data to provide and improve the service.
• Device and logs: we may collect device type and general usage data for stability and support.

3. How we use it
We use your information to: provide and personalize the service; maintain your account; improve our content and product; communicate with you (e.g. important updates); and comply with legal obligations. We do not sell your personal data.

4. Sharing
We may share data with service providers who help us operate (e.g. hosting, analytics) under strict confidentiality. We may disclose information if required by law or to protect rights and safety.

5. Security
We use industry-standard measures to protect your data (encryption, access controls). No system is 100% secure; we encourage a strong password and keeping your device secure.

6. Your rights
You can access, correct, or delete your account and associated data from within the app or by contacting us. In some jurisdictions you have additional rights (e.g. data portability, objection). Contact us to exercise them.

7. Children
The service is intended for use by parents/guardians. We do not knowingly collect data from children under 13 without parental consent. Child profiles are set up and controlled by the parent account.

8. International
Data may be processed in countries where we or our providers operate. We take steps to ensure appropriate safeguards where required.

9. Changes
We may update this policy. We will notify you of material changes (e.g. in-app or by email). Continued use after changes constitutes acceptance.

10. Contact
For privacy questions or requests, contact us via the app or the contact details on our website.
`.trim();

export const PROFESSIONAL_DISCLAIMER = `
Professional Disclaimer

Mindful Kids is an educational and support platform. It is not a substitute for professional mental health, medical, or legal advice.

• We do not diagnose, treat, or cure any condition. Our activities and advice are for general emotional skill-building and parent education only.

• If you or your child are in crisis or need clinical support, please contact a qualified professional, crisis line, or emergency services in your area.

• Professionals listed in our directory (e.g. therapists, clinics) are independent. Verification by Mindful Kids means we have reviewed submitted credentials; it is not an endorsement of their practice or outcomes. Always use your own judgment when choosing care.

• By using the app as a parent or professional, you acknowledge that you have read this disclaimer and understand the limits of the service.
`.trim();
