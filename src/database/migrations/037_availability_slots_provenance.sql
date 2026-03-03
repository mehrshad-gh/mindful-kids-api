-- =============================================================================
-- Availability slots: provenance and concurrency for clinic_admin + therapist
-- =============================================================================

ALTER TABLE availability_slots
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_role TEXT CHECK (created_by_role IN ('therapist', 'clinic_admin', 'admin')),
  ADD COLUMN IF NOT EXISTS managed_by_clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN availability_slots.created_by_user_id IS 'User who created the slot (therapist or clinic_admin).';
COMMENT ON COLUMN availability_slots.created_by_role IS 'Role of creator: therapist | clinic_admin | admin.';
COMMENT ON COLUMN availability_slots.managed_by_clinic_id IS 'Set when slot was created/managed by a clinic (on behalf of psychologist).';
COMMENT ON COLUMN availability_slots.version IS 'Incremented on change; used for optimistic concurrency on delete/update.';

CREATE INDEX IF NOT EXISTS idx_availability_slots_managed_clinic_start
  ON availability_slots (managed_by_clinic_id, starts_at_utc)
  WHERE managed_by_clinic_id IS NOT NULL;
