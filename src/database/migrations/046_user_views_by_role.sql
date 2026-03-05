-- =============================================================================
-- User separation by role: views over users for cleaner querying and reporting.
-- All login accounts live in `users`; role discriminates type. Children are
-- in `children` (no login); clinics are in `clinics` (organizations).
-- =============================================================================

-- Parents: app users who manage children and use family features
CREATE OR REPLACE VIEW v_parents AS
SELECT id, email, name, created_at, updated_at
FROM users
WHERE role = 'parent';

COMMENT ON VIEW v_parents IS 'Parents: users with role=parent. Use for parent-only lists and reports.';

-- Therapists: professionals with psychologist profile (psychologists.user_id)
CREATE OR REPLACE VIEW v_therapists AS
SELECT id, email, name, created_at, updated_at
FROM users
WHERE role = 'therapist';

COMMENT ON VIEW v_therapists IS 'Therapists: users with role=therapist. Link to psychologists via psychologists.user_id.';

-- Clinic admins: users who manage one or more clinics (see clinic_admins junction)
CREATE OR REPLACE VIEW v_clinic_admins AS
SELECT id, email, name, created_at, updated_at
FROM users
WHERE role = 'clinic_admin';

COMMENT ON VIEW v_clinic_admins IS 'Clinic admins: users with role=clinic_admin. Which clinics in clinic_admins table.';

-- Admins: platform administrators
CREATE OR REPLACE VIEW v_admins AS
SELECT id, email, name, created_at, updated_at
FROM users
WHERE role = 'admin';

COMMENT ON VIEW v_admins IS 'Platform admins: users with role=admin.';

-- Document users table role values
COMMENT ON COLUMN users.role IS 'Account type: parent | therapist | clinic_admin | admin. Use v_parents, v_therapists, v_clinic_admins, v_admins for role-scoped queries.';
