-- =============================================================================
-- Enterprise verification: status lifecycle, re-verification, credentials table,
-- clinic verification, report enforcement link.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Psychologists: verification_status (replace boolean) + re-verification
-- -----------------------------------------------------------------------------
ALTER TABLE psychologists
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) NOT NULL DEFAULT 'pending'
  CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended', 'expired'));

-- Backfill from is_verified (before we drop it)
UPDATE psychologists
SET verification_status = CASE WHEN is_verified = true THEN 'verified' ELSE 'pending' END
WHERE verification_status = 'pending' AND is_verified IS NOT NULL;

ALTER TABLE psychologists DROP COLUMN IF EXISTS is_verified;

COMMENT ON COLUMN psychologists.verification_status IS 'Trust lifecycle: pending | verified | rejected | suspended | expired.';

ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS last_verification_review_at TIMESTAMPTZ;
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

COMMENT ON COLUMN psychologists.verification_expires_at IS 'When verification must be renewed (e.g. annual, license expiry).';
COMMENT ON COLUMN psychologists.last_verification_review_at IS 'Last time credentials were reviewed.';
COMMENT ON COLUMN psychologists.verified_at IS 'When current verification was granted (public trust transparency).';

CREATE INDEX IF NOT EXISTS idx_psychologists_verification_status ON psychologists(verification_status);
CREATE INDEX IF NOT EXISTS idx_psychologists_verification_expires_at ON psychologists(verification_expires_at) WHERE verification_expires_at IS NOT NULL;

-- Set verified_at for already-verified rows (one-time)
UPDATE psychologists SET verified_at = updated_at WHERE verification_status = 'verified' AND verified_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. professional_credentials (queryable, parallel to therapist_applications.credentials JSONB)
-- -----------------------------------------------------------------------------
CREATE TABLE professional_credentials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id     UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  credential_type     VARCHAR(100) NOT NULL,
  issuing_country     VARCHAR(2),
  issuer              VARCHAR(255),
  license_number      VARCHAR(255),
  expires_at          TIMESTAMPTZ,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending'
                        CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at         TIMESTAMPTZ,
  document_url        VARCHAR(500),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE professional_credentials IS 'Structured credentials per psychologist; queryable for expiry, country, audits.';
COMMENT ON COLUMN professional_credentials.credential_type IS 'e.g. license, certification.';
COMMENT ON COLUMN professional_credentials.issuing_country IS 'ISO 2-letter; for country-based filtering.';

CREATE INDEX idx_professional_credentials_psychologist_id ON professional_credentials(psychologist_id);
CREATE INDEX idx_professional_credentials_expires_at ON professional_credentials(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_professional_credentials_issuing_country ON professional_credentials(issuing_country) WHERE issuing_country IS NOT NULL;
CREATE INDEX idx_professional_credentials_verification_status ON professional_credentials(verification_status);

CREATE TRIGGER professional_credentials_updated_at
  BEFORE UPDATE ON professional_credentials FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Clinics: verification (partnership / official listing)
-- -----------------------------------------------------------------------------
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) NOT NULL DEFAULT 'pending'
  CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended'));
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS documentation_url VARCHAR(500);

COMMENT ON COLUMN clinics.verification_status IS 'Official listing status for clinic partnerships.';
COMMENT ON COLUMN clinics.documentation_url IS 'Link to clinic verification document.';

CREATE INDEX IF NOT EXISTS idx_clinics_verification_status ON clinics(verification_status);

-- -----------------------------------------------------------------------------
-- 4. professional_reports: action_taken (enforcement link to trust)
-- -----------------------------------------------------------------------------
ALTER TABLE professional_reports
  ADD COLUMN IF NOT EXISTS action_taken VARCHAR(50)
  CHECK (action_taken IS NULL OR action_taken IN ('none', 'warning', 'temporary_suspension', 'verification_revoked'));

COMMENT ON COLUMN professional_reports.action_taken IS 'Enforcement outcome: links report resolution to psychologist verification_status.';
