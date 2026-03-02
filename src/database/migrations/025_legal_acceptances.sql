-- =============================================================================
-- Phase 5 Trust & Legal: store acceptance timestamps for Terms, Privacy, Disclaimer
-- =============================================================================

CREATE TABLE IF NOT EXISTS legal_acceptances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('terms', 'privacy_policy', 'professional_disclaimer')),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE legal_acceptances IS 'Timestamps when a user accepted Terms of Service, Privacy Policy, or Professional Disclaimer.';
CREATE INDEX idx_legal_acceptances_user_id ON legal_acceptances(user_id);
CREATE INDEX idx_legal_acceptances_user_document ON legal_acceptances(user_id, document_type);
