-- =============================================================================
-- Legal acceptances: preserve version history, idempotent per version.
-- One row per (user_id, document_type, document_version). Repeated POST with
-- same version is a no-op; new version inserts a new row (audit trail).
-- =============================================================================

-- 1. Remove the UNIQUE constraint from 048 if it exists (safe if 048 not applied)
ALTER TABLE legal_acceptances
  DROP CONSTRAINT IF EXISTS uq_legal_acceptances_user_document;

-- 2. Deduplicate: for same (user_id, document_type, document_version) keep only
--    the row with newest accepted_at (then newest created_at). Treat NULL accepted_at as oldest.
DELETE FROM legal_acceptances
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, document_type, document_version) id
  FROM legal_acceptances
  ORDER BY user_id, document_type, document_version,
           accepted_at DESC NULLS LAST,
           created_at DESC NULLS LAST
);

-- 3. One row per user + document type + version (idempotent per version)
ALTER TABLE legal_acceptances
  ADD CONSTRAINT uq_legal_acceptances_user_doc_version
  UNIQUE (user_id, document_type, document_version);

COMMENT ON CONSTRAINT uq_legal_acceptances_user_doc_version ON legal_acceptances IS
  'Idempotent per version: repeated acceptance for same version is no-op; new version inserts new row (history).';

-- 4. Index for "latest acceptance per document_type" (getLatestByUserId)
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_latest
  ON legal_acceptances (user_id, document_type, accepted_at DESC);
