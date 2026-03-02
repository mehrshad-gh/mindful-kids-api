-- =============================================================================
-- Phase 7 Daily engagement: rotating daily parenting tips
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_tips (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  psychology_basis TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active     BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE daily_tips IS 'Rotating daily tips for parent dashboard; GET /daily-tip returns today’s tip by rotation.';
CREATE INDEX idx_daily_tips_active ON daily_tips(is_active) WHERE is_active = true;
