const { query } = require('../database/connection');

const DOCUMENT_TYPES = ['terms', 'privacy_policy', 'professional_disclaimer'];

/** Record that user accepted a document. */
async function record(userId, documentType) {
  if (!DOCUMENT_TYPES.includes(documentType)) {
    throw new Error(`document_type must be one of: ${DOCUMENT_TYPES.join(', ')}`);
  }
  await query(
    `INSERT INTO legal_acceptances (user_id, document_type) VALUES ($1, $2)`,
    [userId, documentType]
  );
}

/** Get latest acceptance timestamp per document type for a user. */
async function getLatestByUserId(userId) {
  const result = await query(
    `SELECT document_type, MAX(accepted_at) AS accepted_at
     FROM legal_acceptances
     WHERE user_id = $1
     GROUP BY document_type`,
    [userId]
  );
  const map = {};
  for (const row of result.rows) {
    map[row.document_type] = row.accepted_at;
  }
  return map;
}

module.exports = {
  record,
  getLatestByUserId,
  DOCUMENT_TYPES,
};
