const { query } = require('../database/connection');

const DOCUMENT_TYPES = ['terms', 'privacy_policy', 'professional_disclaimer', 'provider_terms'];

/** Default version when client does not send one (e.g. legacy clients). Bump when you publish new terms. */
const DEFAULT_DOCUMENT_VERSION = '2026-02-01';

/**
 * Record that user accepted a document. Idempotent per version: repeated calls
 * for the same (user_id, document_type, document_version) are a no-op. New
 * version inserts a new row (version history preserved). Returns whether a row
 * was inserted.
 */
async function record(userId, documentType, documentVersion = DEFAULT_DOCUMENT_VERSION) {
  if (!DOCUMENT_TYPES.includes(documentType)) {
    throw new Error(`document_type must be one of: ${DOCUMENT_TYPES.join(', ')}`);
  }
  const result = await query(
    `INSERT INTO legal_acceptances (user_id, document_type, document_version)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, document_type, document_version) DO NOTHING
     RETURNING id`,
    [userId, documentType, documentVersion]
  );
  return { inserted: result.rowCount > 0 };
}

/** True if user has accepted the given document type at the given version. */
async function hasAcceptedVersion(userId, documentType, documentVersion) {
  const result = await query(
    `SELECT 1 FROM legal_acceptances
     WHERE user_id = $1 AND document_type = $2 AND document_version = $3
     LIMIT 1`,
    [userId, documentType, documentVersion]
  );
  return result.rowCount > 0;
}

/** Get latest acceptance per document type (by accepted_at; tiebreak by document_version). */
async function getLatestByUserId(userId) {
  const result = await query(
    `SELECT DISTINCT ON (document_type) document_type, accepted_at, document_version
     FROM legal_acceptances
     WHERE user_id = $1
     ORDER BY document_type, accepted_at DESC NULLS LAST, document_version DESC`,
    [userId]
  );
  const map = {};
  for (const row of result.rows) {
    map[row.document_type] = { accepted_at: row.accepted_at, document_version: row.document_version };
  }
  return map;
}

module.exports = {
  record,
  hasAcceptedVersion,
  getLatestByUserId,
  DOCUMENT_TYPES,
  DEFAULT_DOCUMENT_VERSION,
};
