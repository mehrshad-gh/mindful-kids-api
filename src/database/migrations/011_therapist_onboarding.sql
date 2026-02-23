-- =============================================================================
-- Therapist onboarding: professional registration, credentials, verification,
-- clinic affiliation, admin approval, public profile (psychologist) generation.
-- =============================================================================

-- Allow 'therapist' role on users (for therapist self-service registration)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('parent', 'admin', 'therapist'));

-- Link psychologist directory row to a user when created via onboarding
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_psychologists_user_id ON psychologists(user_id);
COMMENT ON COLUMN psychologists.user_id IS 'Set when psychologist is created from an approved therapist application.';

-- -----------------------------------------------------------------------------
-- Clinics (organizations therapists can affiliate with)
-- -----------------------------------------------------------------------------
CREATE TABLE clinics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) NOT NULL,
  description       TEXT,
  address           TEXT,
  country           VARCHAR(2),
  website           VARCHAR(500),
  logo_url          VARCHAR(500),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_clinics_slug UNIQUE (slug)
);

COMMENT ON TABLE clinics IS 'Clinics/organizations that therapists can affiliate with for directory listing.';

CREATE INDEX idx_clinics_slug ON clinics(slug);
CREATE INDEX idx_clinics_is_active ON clinics(is_active);
CREATE INDEX idx_clinics_country ON clinics(country);

CREATE TRIGGER clinics_updated_at
  BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- -----------------------------------------------------------------------------
-- Therapist applications (registration + credentials + approval workflow)
-- -----------------------------------------------------------------------------
CREATE TABLE therapist_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Professional registration (mirrors psychologist profile when approved)
  professional_name   VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  phone               VARCHAR(50),
  specialty           VARCHAR(255),
  specialization      TEXT[] DEFAULT '{}',
  bio                 TEXT,
  location            VARCHAR(255),
  languages           TEXT[] DEFAULT '{}',
  profile_image_url   VARCHAR(500),
  video_urls          TEXT[] DEFAULT '{}',
  contact_info        JSONB DEFAULT '{}',

  -- Credential submission (stored for admin verification)
  credentials         JSONB NOT NULL DEFAULT '[]',
  -- Example credential: { "type": "license", "issuer": "State Board", "number": "XYZ", "document_url": "https://...", "verified": false }

  -- Verification & workflow
  status              VARCHAR(50) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  submitted_at         TIMESTAMPTZ,
  reviewed_at          TIMESTAMPTZ,
  reviewed_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason     TEXT,

  -- After approval: link to generated public profile
  psychologist_id     UUID REFERENCES psychologists(id) ON DELETE SET NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_therapist_applications_user UNIQUE (user_id)
);

COMMENT ON TABLE therapist_applications IS 'Therapist onboarding: draft/pending/approved/rejected; on approve a psychologist row is created.';
COMMENT ON COLUMN therapist_applications.credentials IS 'Array of { type, issuer, number, document_url, verified } for licenses/certifications.';
COMMENT ON COLUMN therapist_applications.psychologist_id IS 'Set when application is approved; points to the created psychologist profile.';

CREATE INDEX idx_therapist_applications_user_id ON therapist_applications(user_id);
CREATE INDEX idx_therapist_applications_status ON therapist_applications(status);
CREATE INDEX idx_therapist_applications_submitted_at ON therapist_applications(submitted_at);

CREATE TRIGGER therapist_applications_updated_at
  BEFORE UPDATE ON therapist_applications FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Application’s chosen clinic affiliations (copied to therapist_clinics on approval)
CREATE TABLE therapist_application_clinics (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_application_id UUID NOT NULL REFERENCES therapist_applications(id) ON DELETE CASCADE,
  clinic_id                UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role_label               VARCHAR(100),
  is_primary               BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_app_clinics_application_clinic UNIQUE (therapist_application_id, clinic_id)
);

CREATE INDEX idx_therapist_application_clinics_application ON therapist_application_clinics(therapist_application_id);

-- -----------------------------------------------------------------------------
-- Therapist–clinic affiliation (many-to-many; used when building public profile)
-- -----------------------------------------------------------------------------
CREATE TABLE therapist_clinics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id   UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  clinic_id         UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role_label        VARCHAR(100),
  is_primary        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_therapist_clinics_psychologist_clinic UNIQUE (psychologist_id, clinic_id)
);

COMMENT ON TABLE therapist_clinics IS 'Affiliations between psychologists (therapists) and clinics for directory display.';

CREATE INDEX idx_therapist_clinics_psychologist_id ON therapist_clinics(psychologist_id);
CREATE INDEX idx_therapist_clinics_clinic_id ON therapist_clinics(clinic_id);

CREATE TRIGGER therapist_clinics_updated_at
  BEFORE UPDATE ON therapist_clinics FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
