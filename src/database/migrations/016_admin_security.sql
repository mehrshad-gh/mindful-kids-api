-- Admin security & audit: role-check backing, audit log, promotion log
-- 1. admin_audit_log: who did what (approve/reject/suspend/revoke) for legal and compliance
-- 2. admin_promotions_log: who was promoted to admin (by script or later by UI), for security review

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id      UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action_type        VARCHAR(80) NOT NULL,
  target_type        VARCHAR(40) NOT NULL,
  target_id          VARCHAR(80),
  details            JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_audit_log IS 'Audit trail for admin actions: therapist approval/rejection, report action_taken (suspension/revoke).';
COMMENT ON COLUMN admin_audit_log.action_type IS 'e.g. therapist_application_approved, therapist_application_rejected, report_action_taken.';
COMMENT ON COLUMN admin_audit_log.target_type IS 'e.g. therapist_application, professional_report.';
COMMENT ON COLUMN admin_audit_log.target_id IS 'ID of the application, report, etc.';

CREATE INDEX idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX idx_admin_audit_log_action_type ON admin_audit_log(action_type);

-- Log when a user is promoted to admin (by set-admin script or future admin UI)
CREATE TABLE IF NOT EXISTS admin_promotions_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoted_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promoted_email    VARCHAR(255) NOT NULL,
  promoted_by       VARCHAR(80),  -- 'script' or admin user id (if done via API later)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_promotions_log IS 'Log of admin promotions for security review (script or future UI).';
CREATE INDEX idx_admin_promotions_log_created_at ON admin_promotions_log(created_at);
