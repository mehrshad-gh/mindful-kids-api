-- Users: parents (and optionally admin)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Children: linked to a parent (user)
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  birth_date DATE,
  age_group VARCHAR(50) CHECK (age_group IN ('3-5', '6-8', '9-12', '13+')),
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_children_parent ON children(parent_id);
CREATE INDEX idx_children_age_group ON children(age_group);

-- Activities: kid-facing, with psychology basis and parent notes
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('cprt', 'cbt', 'dbt', 'act', 'other')),
  age_groups TEXT[] DEFAULT '{}',
  psychology_basis TEXT,
  for_parents_notes TEXT,
  duration_minutes INT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_slug ON activities(slug);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_active ON activities(is_active);

-- Advice: daily tips and articles for parents
CREATE TABLE advice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  is_daily BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_advice_category ON advice(category);
CREATE INDEX idx_advice_daily ON advice(is_daily);
CREATE INDEX idx_advice_published ON advice(published_at);

-- Psychologists: for find-a-psychologist and booking
CREATE TABLE psychologists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  specialization TEXT[] DEFAULT '{}',
  bio TEXT,
  location VARCHAR(255),
  video_urls TEXT[] DEFAULT '{}',
  avatar_url VARCHAR(500),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_psychologists_active ON psychologists(is_active);
CREATE INDEX idx_psychologists_specialization ON psychologists USING GIN(specialization);

-- Reviews: parent reviews for psychologists
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, psychologist_id)
);

CREATE INDEX idx_reviews_psychologist ON reviews(psychologist_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- Progress: child activity completion and streaks
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  stars INT DEFAULT 0 CHECK (stars >= 0 AND stars <= 5),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  streak_days INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, activity_id)
);

CREATE INDEX idx_progress_child ON progress(child_id);
CREATE INDEX idx_progress_activity ON progress(activity_id);
CREATE INDEX idx_progress_completed ON progress(completed_at);

-- Optional: booking slots (for future use)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  slot_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_psychologist ON bookings(psychologist_id);
CREATE INDEX idx_bookings_slot ON bookings(slot_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER children_updated_at BEFORE UPDATE ON children FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER advice_updated_at BEFORE UPDATE ON advice FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER psychologists_updated_at BEFORE UPDATE ON psychologists FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER progress_updated_at BEFORE UPDATE ON progress FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
