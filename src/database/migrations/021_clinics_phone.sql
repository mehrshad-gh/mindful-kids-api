-- Add phone to clinics for clinic profile management
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
COMMENT ON COLUMN clinics.phone IS 'Clinic contact phone for public display.';
