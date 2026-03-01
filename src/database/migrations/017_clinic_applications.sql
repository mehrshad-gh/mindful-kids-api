-- =============================================================================
-- Clinic onboarding: applications with document upload, admin review,
-- approval creates clinic row with verification_status = 'verified'.
-- =============================================================================

CREATE TABLE IF NOT EXISTS clinic_applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name           TEXT NOT NULL,
  country               TEXT NOT NULL,
  contact_email         TEXT NOT NULL,
  contact_phone         TEXT,
  description           TEXT,
  document_storage_path TEXT NOT NULL,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at          TIMESTAMPTZ,
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clinic_applications IS 'Clinic onboarding applications; on approve a row is created in clinics with verification_status = verified.';
COMMENT ON COLUMN clinic_applications.document_storage_path IS 'Server-side path/filename for uploaded document; never exposed to client.';
COMMENT ON COLUMN clinic_applications.status IS 'pending | approved | rejected.';
COMMENT ON COLUMN clinic_applications.reviewed_at IS 'Approval audit: when the application was reviewed (approved or rejected).';
COMMENT ON COLUMN clinic_applications.reviewed_by IS 'Approval audit: admin user id who reviewed (approved or rejected) the application.';

CREATE INDEX idx_clinic_applications_status ON clinic_applications(status);
CREATE INDEX idx_clinic_applications_country ON clinic_applications(country);
CREATE INDEX idx_clinic_applications_submitted_at ON clinic_applications(submitted_at);

CREATE TRIGGER clinic_applications_updated_at
  BEFORE UPDATE ON clinic_applications FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
