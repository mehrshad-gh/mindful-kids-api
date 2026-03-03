-- =============================================================================
-- Emotional skill domains: tag content and activities; kid_tool_sessions per domain
-- =============================================================================

-- content_items: optional domain (emotional_awareness | self_regulation | problem_solving | social_connection | resilience)
ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS domain_id TEXT NULL;

COMMENT ON COLUMN content_items.domain_id IS 'Emotional domain for skill-building; matches EMOTIONAL_DOMAINS ids.';

-- activities: optional domain (used for kid tools and domain-progress)
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS domain_id TEXT NULL;

COMMENT ON COLUMN activities.domain_id IS 'Emotional domain for this activity; used for domain-progress and kid home.';

-- Backfill known activities -> domain
UPDATE activities SET domain_id = 'emotional_awareness' WHERE slug IN ('emotion-wheel', 'emotion-identification-cbt');
UPDATE activities SET domain_id = 'self_regulation' WHERE slug IN ('calm-breathing-dbt');

-- kid_tool_sessions: one row per completion (session) with domain_id for aggregation
CREATE TABLE IF NOT EXISTS kid_tool_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  activity_id  UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  domain_id    TEXT NOT NULL,
  stars        INT DEFAULT 0 CHECK (stars >= 0 AND stars <= 5),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE kid_tool_sessions IS 'One row per tool/activity completion; domain_id for emotional domain progress.';
CREATE INDEX idx_kid_tool_sessions_child ON kid_tool_sessions(child_id);
CREATE INDEX idx_kid_tool_sessions_domain ON kid_tool_sessions(child_id, domain_id);
CREATE INDEX idx_kid_tool_sessions_completed ON kid_tool_sessions(completed_at);

-- Backfill kid_tool_sessions from existing progress (use activity's domain_id; where null use emotional_awareness as default)
INSERT INTO kid_tool_sessions (child_id, activity_id, domain_id, stars, completed_at, created_at)
SELECT p.child_id, p.activity_id,
  COALESCE(a.domain_id, 'emotional_awareness'),
  COALESCE(p.stars, 0),
  p.completed_at,
  p.created_at
FROM progress p
JOIN activities a ON a.id = p.activity_id
WHERE NOT EXISTS (
  SELECT 1 FROM kid_tool_sessions k
  WHERE k.child_id = p.child_id AND k.activity_id = p.activity_id AND k.completed_at = p.completed_at
);

-- daily_tips: optional domain for "suggest tool in this domain" when tip is viewed
ALTER TABLE daily_tips
  ADD COLUMN IF NOT EXISTS domain_id TEXT NULL;

COMMENT ON COLUMN daily_tips.domain_id IS 'Optional emotional domain; when tip is viewed, suggest practicing a tool in this domain.';
