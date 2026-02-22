ALTER TABLE activities ADD COLUMN IF NOT EXISTS instructions TEXT;
COMMENT ON COLUMN activities.instructions IS 'Step-by-step instructions for the child/caregiver.';
