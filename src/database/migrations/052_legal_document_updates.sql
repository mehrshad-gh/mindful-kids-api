-- =============================================================================
-- Audit trail for legal document version updates (admin bump)
-- =============================================================================

CREATE TABLE legal_document_updates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  old_version  TEXT NOT NULL,
  new_version  TEXT NOT NULL,
  updated_by    UUID NOT NULL REFERENCES users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE legal_document_updates IS 'Audit log of legal document version changes via PATCH /admin/legal-documents/:document_type.';
