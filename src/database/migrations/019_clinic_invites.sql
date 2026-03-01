-- =============================================================================
-- Clinic invite: when admin approves a clinic application we create an invite
-- so the clinic can set a password and get a clinic_admin user linked to the clinic.
-- =============================================================================

CREATE TABLE clinic_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  contact_email VARCHAR(255) NOT NULL,
  token         VARCHAR(255) NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clinic_invites IS 'One-time invite for clinic contact to set password; created when admin approves clinic application.';

CREATE INDEX idx_clinic_invites_token ON clinic_invites(token);
CREATE INDEX idx_clinic_invites_clinic_id ON clinic_invites(clinic_id);
CREATE INDEX idx_clinic_invites_expires_at ON clinic_invites(expires_at);
