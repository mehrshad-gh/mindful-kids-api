-- =============================================================================
-- Account deactivation: soft-deactivate users (reversible); supports controlled
-- delete-account flows. Login and listings exclude deactivated by default.
-- =============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN users.deactivated_at IS 'When set, user cannot log in. Use for soft delete / deactivate account. NULL = active.';

-- Views: expose deactivated_at so admin can filter (active-only by default) or list deactivated
CREATE OR REPLACE VIEW v_parents AS
SELECT id, email, name, created_at, updated_at, deactivated_at
FROM users
WHERE role = 'parent';

CREATE OR REPLACE VIEW v_therapists AS
SELECT id, email, name, created_at, updated_at, deactivated_at
FROM users
WHERE role = 'therapist';

CREATE OR REPLACE VIEW v_clinic_admins AS
SELECT id, email, name, created_at, updated_at, deactivated_at
FROM users
WHERE role = 'clinic_admin';

CREATE OR REPLACE VIEW v_admins AS
SELECT id, email, name, created_at, updated_at, deactivated_at
FROM users
WHERE role = 'admin';
