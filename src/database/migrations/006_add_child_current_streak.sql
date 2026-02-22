-- Store current streak per child (backend calculates and updates on each activity completion)
ALTER TABLE children ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0;
COMMENT ON COLUMN children.current_streak IS 'Consecutive days with at least one activity completion; reset when a day is missed. Updated by backend on progress upsert.';
