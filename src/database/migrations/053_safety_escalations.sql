-- =============================================================================
-- Safety escalation audit: minimal metadata when high-risk keywords detected.
-- We do NOT store the raw user text; only route, field, and matched keywords.
-- =============================================================================

CREATE TABLE safety_escalations (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route      TEXT NOT NULL,
  field      TEXT NOT NULL,
  matches    TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE safety_escalations IS 'Audit of safety guardrail triggers: route, field, matched keywords. Raw user text is never stored here.';

CREATE INDEX idx_safety_escalations_user_id ON safety_escalations(user_id);
CREATE INDEX idx_safety_escalations_created_at ON safety_escalations(created_at);
