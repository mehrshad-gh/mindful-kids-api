-- =============================================================================
-- Mindful Kids – PostgreSQL Schema
-- Mobile app: parents, child profiles, psychology-based activities,
-- daily advice, psychologist directory with reviews, activity progress.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. USERS (parents; admins optional)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  role              VARCHAR(50) NOT NULL DEFAULT 'parent'
                    CHECK (role IN ('parent', 'admin')),
  avatar_url        VARCHAR(500),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_users_email UNIQUE (email)
);

COMMENT ON TABLE users IS 'Parent (and optional admin) accounts; one account per adult.';
COMMENT ON COLUMN users.role IS 'parent: normal user; admin: platform management.';

-- -----------------------------------------------------------------------------
-- 2. CHILDREN (profiles linked to a parent)
-- -----------------------------------------------------------------------------
CREATE TABLE children (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  birth_date        DATE,
  age_group         VARCHAR(50)
                    CHECK (age_group IN ('3-5', '6-8', '9-12', '13+')),
  avatar_url        VARCHAR(500),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE children IS 'Child profiles; each belongs to exactly one parent.';
COMMENT ON COLUMN children.age_group IS 'Used to filter age-appropriate activities and content.';

-- -----------------------------------------------------------------------------
-- 3. ACTIVITIES (psychology-based, kid-facing)
-- -----------------------------------------------------------------------------
CREATE TABLE activities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               VARCHAR(255) NOT NULL,
  slug                VARCHAR(255) NOT NULL,
  description         TEXT,
  activity_type       VARCHAR(50) NOT NULL
                      CHECK (activity_type IN ('cprt', 'cbt', 'dbt', 'act', 'other')),
  age_groups          TEXT[] DEFAULT '{}',
  psychology_basis    TEXT,
  for_parents_notes   TEXT,
  duration_minutes    INT CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  sort_order          INT NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_activities_slug UNIQUE (slug)
);

COMMENT ON TABLE activities IS 'Psychology-based activities for children (CPRT, CBT, DBT, ACT).';
COMMENT ON COLUMN activities.activity_type IS 'cprt: Child-Parent Relationship; cbt: Cognitive Behavioral; dbt: Dialectical Behavior; act: Acceptance and Commitment.';
COMMENT ON COLUMN activities.psychology_basis IS 'Why this activity works (for transparency).';
COMMENT ON COLUMN activities.for_parents_notes IS 'How parents can support the child during/after the activity.';

-- -----------------------------------------------------------------------------
-- 4. ADVICE (daily and general content for parents)
-- -----------------------------------------------------------------------------
CREATE TABLE advice (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(255) NOT NULL,
  content           TEXT NOT NULL,
  category          VARCHAR(100),
  is_daily          BOOLEAN NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE advice IS 'Short tips and articles for parents; can be flagged as daily advice.';

-- -----------------------------------------------------------------------------
-- 5. PSYCHOLOGISTS (directory for find-a-psychologist)
-- -----------------------------------------------------------------------------
CREATE TABLE psychologists (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  email             VARCHAR(255),
  phone             VARCHAR(50),
  specialization    TEXT[] DEFAULT '{}',
  bio               TEXT,
  location          VARCHAR(255),
  video_urls        TEXT[] DEFAULT '{}',
  avatar_url        VARCHAR(500),
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE psychologists IS 'Directory of psychologists; used for reviews and (future) booking.';

-- -----------------------------------------------------------------------------
-- 6. REVIEWS (parent reviews of psychologists)
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  psychologist_id   UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  rating            INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_reviews_user_psychologist UNIQUE (user_id, psychologist_id)
);

COMMENT ON TABLE reviews IS 'One review per parent per psychologist; rating 1–5.';

-- -----------------------------------------------------------------------------
-- 7. PROGRESS (activity completion and streaks per child)
-- -----------------------------------------------------------------------------
CREATE TABLE progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  activity_id       UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  stars             INT NOT NULL DEFAULT 0 CHECK (stars >= 0 AND stars <= 5),
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  streak_days       INT NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_progress_child_activity UNIQUE (child_id, activity_id)
);

COMMENT ON TABLE progress IS 'One row per child per activity; stars and streak for gamification.';

-- -----------------------------------------------------------------------------
-- 8. BOOKINGS (optional: parent bookings with psychologists)
-- -----------------------------------------------------------------------------
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  psychologist_id   UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  slot_at           TIMESTAMPTZ NOT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bookings IS 'Future: appointment slots for parent–psychologist sessions.';

-- =============================================================================
-- RELATIONSHIPS (summary)
-- =============================================================================
--
-- users (1) ──────────< children          (one parent, many children)
-- users (1) ──────────< reviews            (one parent, many reviews)
-- users (1) ──────────< bookings           (one parent, many bookings)
--
-- psychologists (1) ──< reviews            (one psychologist, many reviews)
-- psychologists (1) ──< bookings           (one psychologist, many bookings)
--
-- children (1) ───────< progress           (one child, many progress rows)
-- activities (1) ─────< progress           (one activity, many progress rows)
--
-- advice, activities                  (standalone content; no FKs to users/children)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

-- Users: lookup by email (login), filter by role
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Children: by parent (list my children), filter by age
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_children_age_group ON children(age_group);

-- Activities: by slug (URL), by type and active flag
CREATE UNIQUE INDEX idx_activities_slug ON activities(slug);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
CREATE INDEX idx_activities_is_active ON activities(is_active);
CREATE INDEX idx_activities_sort_order ON activities(sort_order);
-- Age filter: GIN for array containment
CREATE INDEX idx_activities_age_groups ON activities USING GIN(age_groups);

-- Advice: daily flag, category, publish date
CREATE INDEX idx_advice_is_daily ON advice(is_daily);
CREATE INDEX idx_advice_category ON advice(category);
CREATE INDEX idx_advice_published_at ON advice(published_at);

-- Psychologists: active, search by specialization
CREATE INDEX idx_psychologists_is_active ON psychologists(is_active);
CREATE INDEX idx_psychologists_specialization ON psychologists USING GIN(specialization);
CREATE INDEX idx_psychologists_name ON psychologists(name);

-- Reviews: by psychologist (listing), by user (my reviews)
CREATE INDEX idx_reviews_psychologist_id ON reviews(psychologist_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- Progress: by child (dashboard), by activity (analytics), by completed_at (streaks)
CREATE INDEX idx_progress_child_id ON progress(child_id);
CREATE INDEX idx_progress_activity_id ON progress(activity_id);
CREATE INDEX idx_progress_completed_at ON progress(completed_at);
CREATE INDEX idx_progress_metadata ON progress USING GIN(metadata);

-- Bookings: by user, by psychologist, by time
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_psychologist_id ON bookings(psychologist_id);
CREATE INDEX idx_bookings_slot_at ON bookings(slot_at);
CREATE INDEX idx_bookings_status ON bookings(status);

-- -----------------------------------------------------------------------------
-- UPDATED_AT TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON children FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER advice_updated_at
  BEFORE UPDATE ON advice FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER psychologists_updated_at
  BEFORE UPDATE ON psychologists FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON progress FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
