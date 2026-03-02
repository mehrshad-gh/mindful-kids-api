-- =============================================================================
-- Legal acceptances: add document version (e.g. 2026-03-01) so we know which
-- version of Terms/Privacy/Disclaimer the user accepted. Required for future
-- "force re-accept on major update" when terms change.
-- =============================================================================

ALTER TABLE legal_acceptances
  ADD COLUMN IF NOT EXISTS document_version VARCHAR(20) NOT NULL DEFAULT '2026-02-01';

COMMENT ON COLUMN legal_acceptances.document_version IS 'Version of the document accepted (e.g. date 2026-03-01 or semver). Bump when terms/privacy/disclaimer change.';

-- Optional: index for "has user accepted current version?" queries (future re-accept flow)
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_doc_version
  ON legal_acceptances(user_id, document_type, document_version);
