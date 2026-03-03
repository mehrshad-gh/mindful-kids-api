-- =============================================================================
-- B-Lite: audit log for appointment lifecycle (requested, confirmed, declined, cancelled)
-- =============================================================================

CREATE TABLE IF NOT EXISTS appointment_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type     VARCHAR(50) NOT NULL
    CHECK (action_type IN ('appointment_requested', 'appointment_confirmed', 'appointment_declined', 'appointment_cancelled', 'appointment_completed')),
  details         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE appointment_audit_log IS 'Audit trail for booking actions.';
CREATE INDEX idx_appointment_audit_log_appointment ON appointment_audit_log (appointment_id);
