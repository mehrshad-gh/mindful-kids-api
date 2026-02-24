# Mindful Kids — Global Trust & Compliance Framework

This document defines the trust and compliance system the platform operates by. No legal jargon — the structure you build and ship against. Implement gradually; the structure exists now.

---

## 1. Platform Positioning Policy (Foundation)

**Core statement** (everywhere in app + website):

> Mindful Kids supports emotional skill development and parent education.  
> It does not diagnose, treat, or replace professional care.

**Required product elements:**

- [x] Professional disclaimer screen (onboarding + in-app)
- [x] Explanation of “verified therapist” meaning
- [x] Parental responsibility acknowledgment
- [x] Clear boundaries of service

This protects users and partners.

---

## 2. Professional Verification Policy

**Verification requirements** — a therapist must submit:

- Full legal name  
- Professional license number  
- Issuing country  
- Specialization  
- Identity verification  
- Clinic affiliation (if any)  

**Verification statuses** (psychologists.verification_status; replaces boolean):

- **Pending** — application submitted, under review  
- **Verified** — credentials reviewed, badge shown  
- **Rejected** — application declined  
- **Suspended** — temporary suspension (e.g. report under review)  
- **Expired** — verification period or license expiry passed; re-verification needed  

**Re-verification:** `verification_expires_at`, `last_verification_review_at`, `verified_at` support annual renewal and audits.

**Ongoing trust rules:**

- [ ] Profiles reviewed periodically  
- [x] Users can report professionals  
- [ ] Violations → investigation workflow  

This is the system that makes clinics comfortable partnering.

---

## 3. Child & Family Data Protection Model

**Data principles:**

- [x] Collect only necessary data  
- [x] Parent controls child account  
- [x] No data selling  
- [x] Secure storage  
- [x] Clear deletion option (child profile + account)

**Technical baseline:**

- Encrypted data transmission (HTTPS)  
- Role-based data access  
- [ ] Audit logging for sensitive actions  
- [x] Ability to delete child profile permanently  

---

## 4. Parental Consent Framework

Before child use, parent must confirm:

- [x] They are legal guardian  
- [x] They understand app purpose  
- [x] They control data  
- [x] They can revoke access anytime  

Consent is stored with timestamp.

---

## 5. Safety & Escalation System

**Risk scenarios:**

- Concerning emotional reports  
- Crisis language  
- User reports therapist misconduct  
- Harmful content discovered  

**Platform response model:**

1. Flag detected  
2. Notify parent (where applicable)  
3. Provide support resources  
4. Internal review process  

We do not provide crisis intervention — we guide safely.

---

## 6. Evidence-Based Content Governance

**Content rules:**

- [x] Every activity linked to psychological method (`activity_type`, `psychology_basis`)  
- [ ] Expert review for new content (process)  
- [ ] Version control for guidance  
- [ ] No unsupported claims  

This separates us from generic wellness apps.

---

## 7. Clinic & Partner Responsibility Model

**Clinics agree to:**

- Provide accurate professional info  
- Maintain license validity  
- Follow platform conduct rules  

**Platform provides:**

- Verified profile  
- Digital support tool for families  
- Visibility inside app  

Clear responsibilities prevent conflict later.

---

## 8. Global Expansion Readiness

Design supports (without implementing all region laws yet):

- Multi-country therapist licensing (credentials JSON, `issuing country`)  
- Language localization  
- Regional data storage if needed  
- Region-specific disclaimers  

Architecture already supports this direction.

---

## Visible Trust Features (build order)

1. [x] Therapist verification badge system  
2. [x] Professional onboarding + credential submission  
3. [x] Parental consent screen  
4. [x] Safety disclaimer module  
5. [x] Report professional feature  
6. [ ] Report content feature (future)  

---

## Enterprise verification (schema)

- **Psychologists:** `verification_status` (pending | verified | rejected | suspended | expired), `verification_expires_at`, `last_verification_review_at`, `verified_at`. Public directory filters to `verification_status = 'verified'`; API still exposes `is_verified` (boolean) for compatibility.
- **professional_credentials:** Queryable table (psychologist_id, credential_type, issuing_country, issuer, license_number, expires_at, verification_status, verified_by, verified_at, document_url). Populated from application credentials on approve; supports license expiry and country-based audits.
- **Clinics:** `verification_status`, `verified_at`, `verified_by`, `documentation_url` for partnership listing.
- **professional_reports:** `action_taken` (none | warning | temporary_suspension | verification_revoked) links resolution to trust lifecycle.

See migration `015_enterprise_verification.sql`.

---

## References

- **Disclaimer & consent:** `mobile/src/screens/onboarding/DisclaimerConsentScreen.tsx`  
- **Verified badge:** Psychologist directory and detail; “What does Verified mean?” explainer in app  
- **Therapist onboarding:** `docs/therapist-onboarding.md`, `src/database/migrations/011_therapist_onboarding.sql`  
- **Enterprise verification:** `src/database/migrations/015_enterprise_verification.sql`, `professional_credentials` table, Psychologist.verification_status  
- **Reports:** `professional_reports` table (with action_taken); Report flow on psychologist detail screen  
- **Data & deletion:** Parent can delete child profile from Dashboard; account deletion (policy)  
- **Schema:** `docs/schema.sql`, migrations in `src/database/migrations/`
