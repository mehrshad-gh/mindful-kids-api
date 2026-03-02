-- =============================================================================
-- Phase 8 Streak & habit tracking: parent daily-tip viewing streaks
-- =============================================================================

CREATE TABLE IF NOT EXISTS parent_streaks (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_viewed_date  DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE parent_streaks IS 'Tracks consecutive days of daily-tip views for parent engagement. Updated on POST /daily-tip/viewed.';
