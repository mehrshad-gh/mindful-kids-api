-- Add display location to clinics (e.g. "San Francisco, CA" or "London, UK")
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS location VARCHAR(255);
COMMENT ON COLUMN clinics.location IS 'Display location for public page (city, region, or address summary).';
