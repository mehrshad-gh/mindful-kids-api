-- =============================================================================
-- Professional reports: users can report a psychologist (trust & safety).
-- =============================================================================

CREATE TABLE professional_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  psychologist_id   UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  reason            VARCHAR(100) NOT NULL,
  details           TEXT,
  status            VARCHAR(50) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE professional_reports IS 'User reports about professionals; for trust & safety and investigation workflow.';
COMMENT ON COLUMN professional_reports.reason IS 'Category: e.g. misconduct, inaccurate_info, other.';
COMMENT ON COLUMN professional_reports.status IS 'open -> under_review -> resolved | dismissed.';

CREATE INDEX idx_professional_reports_psychologist_id ON professional_reports(psychologist_id);
CREATE INDEX idx_professional_reports_reporter_id ON professional_reports(reporter_id);
CREATE INDEX idx_professional_reports_status ON professional_reports(status);
CREATE INDEX idx_professional_reports_created_at ON professional_reports(created_at);

CREATE TRIGGER professional_reports_updated_at
  BEFORE UPDATE ON professional_reports FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
