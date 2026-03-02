-- =============================================================================
-- Phase 3 Global Discovery: indexes for therapist and clinic search
-- =============================================================================

-- Psychologists: filter by verification_status + is_active (search returns verified only)
CREATE INDEX IF NOT EXISTS idx_psychologists_verification_active
  ON psychologists(verification_status, is_active)
  WHERE is_active = true AND verification_status = 'verified';

-- Clinics: filter by country and verification_status
CREATE INDEX IF NOT EXISTS idx_clinics_country_verification
  ON clinics(country, verification_status);
