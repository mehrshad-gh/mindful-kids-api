-- =============================================================================
-- Clinic affiliation status: active | pending | removed (soft delete for history)
-- =============================================================================

ALTER TABLE therapist_clinics
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

ALTER TABLE therapist_clinics
  DROP CONSTRAINT IF EXISTS therapist_clinics_status_check;

ALTER TABLE therapist_clinics
  ADD CONSTRAINT therapist_clinics_status_check
  CHECK (status IN ('active', 'pending', 'removed'));

COMMENT ON COLUMN therapist_clinics.status IS 'active = current; pending = invite not accepted; removed = soft-deleted for therapist visibility.';

CREATE INDEX IF NOT EXISTS idx_therapist_clinics_status ON therapist_clinics(status);
