-- =============================================================================
-- Legal document version source: admin-managed current versions (no code deploy)
-- =============================================================================

CREATE TABLE legal_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  current_version TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_type)
);

COMMENT ON TABLE legal_documents IS 'Current required version per legal document type. Admin can bump versions via PATCH /admin/legal-documents/:document_type.';

INSERT INTO legal_documents (document_type, current_version) VALUES
  ('terms', '2026-03-04'),
  ('privacy_policy', '2026-03-04'),
  ('professional_disclaimer', '2026-03-04'),
  ('provider_terms', '2026-03-04')
ON CONFLICT (document_type) DO NOTHING;
