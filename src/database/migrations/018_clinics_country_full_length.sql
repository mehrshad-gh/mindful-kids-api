-- Allow full country names in clinics (e.g. "United States", "United Kingdom") to match clinic applications.
ALTER TABLE clinics ALTER COLUMN country TYPE VARCHAR(255);
COMMENT ON COLUMN clinics.country IS 'Country name or code; full length for display and matching clinic applications.';
