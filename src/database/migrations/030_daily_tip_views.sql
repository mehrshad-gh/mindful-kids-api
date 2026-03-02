-- =============================================================================
-- Phase 7: record when a user viewed the daily tip (for "Seen today" and analytics)
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_tip_views (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_date DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, viewed_date)
);

COMMENT ON TABLE daily_tip_views IS 'One row per user per day when they viewed the daily tip.';
CREATE INDEX idx_daily_tip_views_user_date ON daily_tip_views(user_id, viewed_date);
