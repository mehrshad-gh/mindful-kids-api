-- Extend advice for psychology_basis, age_range, and optional related activity
ALTER TABLE advice ADD COLUMN IF NOT EXISTS psychology_basis TEXT;
ALTER TABLE advice ADD COLUMN IF NOT EXISTS age_range VARCHAR(100);
ALTER TABLE advice ADD COLUMN IF NOT EXISTS related_activity_id UUID REFERENCES activities(id) ON DELETE SET NULL;

COMMENT ON COLUMN advice.psychology_basis IS 'Underlying psychology or method (e.g. CBT, CPRT).';
COMMENT ON COLUMN advice.age_range IS 'Target age range (e.g. 3-5, 6-8).';
COMMENT ON COLUMN advice.related_activity_id IS 'Optional link to an activity.';

CREATE INDEX IF NOT EXISTS idx_advice_related_activity ON advice(related_activity_id);
