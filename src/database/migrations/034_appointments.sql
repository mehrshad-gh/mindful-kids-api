-- =============================================================================
-- B-Lite: appointments (parent books a slot; therapist confirms/declines)
-- =============================================================================

CREATE TABLE IF NOT EXISTS appointments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  psychologist_id       UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  clinic_id             UUID REFERENCES clinics(id) ON DELETE SET NULL,
  availability_slot_id  UUID NOT NULL REFERENCES availability_slots(id) ON DELETE CASCADE,
  starts_at_utc         TIMESTAMPTZ NOT NULL,
  ends_at_utc           TIMESTAMPTZ NOT NULL,
  status                VARCHAR(20) NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'confirmed', 'declined', 'cancelled', 'completed')),
  parent_notes         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE appointments IS 'Booked sessions: parent requests slot; therapist confirms/declines.';
CREATE INDEX idx_appointments_psychologist_start ON appointments (psychologist_id, starts_at_utc);
CREATE INDEX idx_appointments_parent_start ON appointments (parent_user_id, starts_at_utc);
CREATE INDEX idx_appointments_status ON appointments (status);
