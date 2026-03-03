-- =============================================================================
-- Cancellation/decline reason for appointments (parent cancel, therapist decline/cancel)
-- =============================================================================

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

COMMENT ON COLUMN appointments.cancellation_reason IS 'Reason when appointment is declined or cancelled (therapist or parent).';
