-- =============================================================================
-- Phase 2 Professional Trust Controls: therapist audit log, credential renewal.
-- =============================================================================

-- Therapist audit log (credential_uploaded, credential_renewal_requested, therapist_viewed_reports)
CREATE TABLE IF NOT EXISTS therapist_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type       VARCHAR(80) NOT NULL,
  target_type       VARCHAR(40),
  target_id         VARCHAR(80),
  details           JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE therapist_audit_log IS 'Audit trail for therapist actions: credential upload, renewal request, viewing reports.';
CREATE INDEX idx_therapist_audit_log_therapist_user_id ON therapist_audit_log(therapist_user_id);
CREATE INDEX idx_therapist_audit_log_action_type ON therapist_audit_log(action_type);
CREATE INDEX idx_therapist_audit_log_created_at ON therapist_audit_log(created_at);

-- Credential renewal request (therapist can mark credential as needing re-verification)
ALTER TABLE professional_credentials
  ADD COLUMN IF NOT EXISTS renewal_requested_at TIMESTAMPTZ;

COMMENT ON COLUMN professional_credentials.renewal_requested_at IS 'When therapist requested re-verification for this credential.';
