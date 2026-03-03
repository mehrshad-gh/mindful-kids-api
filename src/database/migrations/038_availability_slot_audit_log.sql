-- =============================================================================
-- Audit log for availability slot create/delete (therapist vs clinic_admin)
-- =============================================================================

CREATE TABLE IF NOT EXISTS availability_slot_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id         UUID NOT NULL,
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role      VARCHAR(20) NOT NULL,
  clinic_id       UUID REFERENCES clinics(id) ON DELETE SET NULL,
  action_type     VARCHAR(30) NOT NULL
    CHECK (action_type IN ('slot_created', 'slot_deleted')),
  details         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE availability_slot_audit_log IS 'Audit trail for who created/deleted availability slots.';
CREATE INDEX IF NOT EXISTS idx_availability_slot_audit_log_slot ON availability_slot_audit_log (slot_id);
CREATE INDEX IF NOT EXISTS idx_availability_slot_audit_log_created ON availability_slot_audit_log (created_at);
