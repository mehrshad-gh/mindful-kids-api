-- =============================================================================
-- Make legal_acceptances one row per (user_id, document_type) so POST
-- /auth/me/legal-acceptance can be idempotent (UPSERT). Safe to call multiple
-- times; repeated calls update the same row.
-- =============================================================================

-- Dedupe: keep only the latest row per (user_id, document_type)
DELETE FROM legal_acceptances
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, document_type) id
  FROM legal_acceptances
  ORDER BY user_id, document_type, accepted_at DESC
);

-- One row per user + document type
ALTER TABLE legal_acceptances
  ADD CONSTRAINT uq_legal_acceptances_user_document UNIQUE (user_id, document_type);

COMMENT ON CONSTRAINT uq_legal_acceptances_user_document ON legal_acceptances IS
  'Ensures idempotent recording: repeated acceptance for same document updates the row.';
