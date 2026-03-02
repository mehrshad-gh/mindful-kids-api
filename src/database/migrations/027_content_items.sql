-- =============================================================================
-- Phase 6 Content & Activities: unified content (articles, videos, activities)
-- =============================================================================

CREATE TABLE IF NOT EXISTS content_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              VARCHAR(20) NOT NULL CHECK (type IN ('article', 'video', 'activity')),
  title             VARCHAR(500) NOT NULL,
  summary           TEXT,
  body_markdown     TEXT,
  video_url         VARCHAR(1000),
  age_range         VARCHAR(50),
  tags              TEXT[] DEFAULT '{}',
  psychology_basis   TEXT[] DEFAULT '{}',
  for_parents_notes TEXT,
  evidence_notes    TEXT,
  is_published      BOOLEAN NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE content_items IS 'Articles, videos (parent resources), and activities (kids) for Library and admin.';
CREATE INDEX idx_content_items_type ON content_items(type);
CREATE INDEX idx_content_items_is_published ON content_items(is_published);
CREATE INDEX idx_content_items_published_at ON content_items(published_at) WHERE is_published = true;
CREATE INDEX idx_content_items_age_range ON content_items(age_range) WHERE age_range IS NOT NULL;
