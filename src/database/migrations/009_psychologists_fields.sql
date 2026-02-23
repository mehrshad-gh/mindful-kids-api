-- Add and align psychologist fields: specialty, rating, languages, profile_image, contact_info
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS specialty VARCHAR(255);
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}';

COMMENT ON COLUMN psychologists.specialty IS 'Primary specialty (e.g. Child Psychology).';
COMMENT ON COLUMN psychologists.rating IS 'Cached average rating from reviews; can be updated by app.';
COMMENT ON COLUMN psychologists.languages IS 'Languages spoken.';
COMMENT ON COLUMN psychologists.profile_image IS 'Profile image URL.';
COMMENT ON COLUMN psychologists.contact_info IS 'Structured contact (e.g. email, phone, website).';

-- Backfill profile_image from avatar_url where profile_image is null
UPDATE psychologists SET profile_image = avatar_url WHERE profile_image IS NULL AND avatar_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_psychologists_specialty ON psychologists(specialty);
