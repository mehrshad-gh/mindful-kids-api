-- =============================================================================
-- B-Lite: availability slots (therapist or clinic) for in-app booking
-- =============================================================================

CREATE TABLE IF NOT EXISTS availability_slots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type     VARCHAR(20) NOT NULL CHECK (owner_type IN ('psychologist', 'clinic')),
  owner_id       UUID NOT NULL,
  starts_at_utc  TIMESTAMPTZ NOT NULL,
  ends_at_utc    TIMESTAMPTZ NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'blocked', 'booked')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_availability_ends_after_start CHECK (ends_at_utc > starts_at_utc)
);

COMMENT ON TABLE availability_slots IS 'Time slots offered by psychologist or clinic for booking.';
CREATE UNIQUE INDEX idx_availability_slots_owner_start ON availability_slots (owner_type, owner_id, starts_at_utc);
CREATE INDEX idx_availability_slots_owner ON availability_slots (owner_type, owner_id);
CREATE INDEX idx_availability_slots_starts ON availability_slots (owner_type, owner_id, starts_at_utc);
