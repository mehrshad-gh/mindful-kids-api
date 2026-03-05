-- =============================================================================
-- Allow provider_terms as a document type for therapist/clinic_admin legal
-- acceptance tracking (provider-specific terms).
-- Constraint name matches PostgreSQL default for inline CHECK (table_column_check).
-- If your DB used a different name, adjust the DROP accordingly.
-- =============================================================================

ALTER TABLE legal_acceptances
  DROP CONSTRAINT IF EXISTS legal_acceptances_document_type_check;

ALTER TABLE legal_acceptances
  ADD CONSTRAINT legal_acceptances_document_type_check
  CHECK (document_type IN ('terms', 'privacy_policy', 'professional_disclaimer', 'provider_terms'));
