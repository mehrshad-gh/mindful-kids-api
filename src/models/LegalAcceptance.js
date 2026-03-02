const { query } = require('../database/connection');

const DOCUMENT_TYPES = ['terms', 'privacy_policy', 'professional_disclaimer'];

/** Default version when client does not send one (e.g. legacy clients). Bump when you publish new terms. */
const DEFAULT_DOCUMENT_VERSION = '2026-02-01';

/** Record that user accepted a document. Stores document_version so we know who accepted which version (for future "force re-accept on major update"). */
async function record(userId, documentType, documentVersion = DEFAULT_DOCUMENT_VERSION) {
  if (!DOCUMENT_TYPES.includes(documentType)) {
    throw new Error(`document_type must be one of: ${DOCUMENT_TYPES.join(', ')}`);
  }
  await query(
    `INSERT INTO legal_acceptances (user_id, document_type, document_version) VALUES ($1, $2, $3)`,
    [userId, documentType, documentVersion]
  );
}

/** Get latest acceptance per document type for a user (timestamp + version). */
async function getLatestByUserId(userId) {
  const result = await query(
    `SELECT DISTINCT ON (document_type) document_type, accepted_at, document_version
     FROM legal_acceptances
     WHERE user_id = $1
     ORDER BY document_type, accepted_at DESC`,
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
  getLatestByUserId,
  DOCUMENT_TYPES,
  DEFAULT_DOCUMENT_VERSION,
};
