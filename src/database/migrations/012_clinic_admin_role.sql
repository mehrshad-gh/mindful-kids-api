-- =============================================================================
-- Add clinic_admin role and clinic_admins: clinic can have multiple admins,
-- clinic_admin user can manage multiple clinics (role-based auth).
-- =============================================================================

-- Allow 'clinic_admin' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('parent', 'admin', 'therapist', 'clinic_admin'));

-- -----------------------------------------------------------------------------
-- Clinic admins: which users manage which clinics (many-to-many)
-- -----------------------------------------------------------------------------
CREATE TABLE clinic_admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_clinic_admins_user_clinic UNIQUE (user_id, clinic_id)
);

COMMENT ON TABLE clinic_admins IS 'Users with role clinic_admin can manage these clinics; one user can manage many clinics, one clinic can have many admins.';

CREATE INDEX idx_clinic_admins_user_id ON clinic_admins(user_id);
CREATE INDEX idx_clinic_admins_clinic_id ON clinic_admins(clinic_id);
