-- Store invite token and clinic_id on clinic_application when approved, so admin can copy invite link and see account_created state.
ALTER TABLE clinic_applications
  ADD COLUMN IF NOT EXISTS invite_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;

COMMENT ON COLUMN clinic_applications.invite_token IS 'Set when approved; used to build set-password link for admin to copy.';
COMMENT ON COLUMN clinic_applications.clinic_id IS 'Set when approved; links application to created clinic.';

CREATE INDEX IF NOT EXISTS idx_clinic_applications_clinic_id ON clinic_applications(clinic_id);
