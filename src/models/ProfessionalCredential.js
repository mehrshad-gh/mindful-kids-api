const { query } = require('../database/connection');

const COLS = `id, psychologist_id, credential_type, issuing_country, issuer, license_number, expires_at,
  verification_status, verified_by, verified_at, document_url, renewal_requested_at, created_at, updated_at`;

/** Insert a credential (from application approval, admin add, or therapist upload). */
async function create(data) {
  const result = await query(
    `INSERT INTO professional_credentials (
      psychologist_id, credential_type, issuing_country, issuer, license_number, expires_at,
      verification_status, verified_by, verified_at, document_url, renewal_requested_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING ${COLS}`,
    [
      data.psychologist_id,
      data.credential_type || 'license',
      data.issuing_country || null,
      data.issuer || null,
      data.license_number || null,
      data.expires_at || null,
      data.verification_status || 'verified',
      data.verified_by || null,
      data.verified_at || null,
      data.document_url || null,
      data.renewal_requested_at || null,
    ]
  );
  return result.rows[0];
}

/** Create structured credentials from therapist_application.credentials JSONB (on approve). */
async function createFromApplicationCredentials(psychologistId, credentialsJson, verifiedBy = null) {
  const credentials = Array.isArray(credentialsJson) ? credentialsJson : [];
  const verifiedAt = new Date();
  for (const c of credentials) {
    const type = (c.type || 'license').toString().trim();
    if (!type) continue;
    await create({
      psychologist_id: psychologistId,
      credential_type: type,
      issuing_country: c.issuing_country || c.country || null,
      issuer: c.issuer || null,
      license_number: c.number || null,
      expires_at: c.expires_at || null,
      document_url: c.document_url || null,
      verification_status: 'verified',
      verified_by: verifiedBy,
      verified_at: verifiedAt,
    });
  }
}

async function findByPsychologistId(psychologistId) {
  const result = await query(
    `SELECT ${COLS} FROM professional_credentials WHERE psychologist_id = $1 ORDER BY verified_at DESC NULLS LAST`,
    [psychologistId]
  );
  return result.rows;
}

/** Update credential (document_url, or set renewal_requested_at for re-verification). */
async function update(id, data) {
  const updates = [];
  const values = [];
  let i = 1;
  if (data.document_url !== undefined) {
    updates.push(`document_url = $${i++}`);
    values.push(data.document_url);
  }
  if (data.verification_status !== undefined) {
    updates.push(`verification_status = $${i++}`);
    values.push(data.verification_status);
  }
  if (data.renewal_requested_at !== undefined) {
    updates.push(`renewal_requested_at = $${i++}`);
    values.push(data.renewal_requested_at);
  }
  if (updates.length === 0) return null;
  values.push(id);
  const result = await query(
    `UPDATE professional_credentials SET updated_at = NOW(), ${updates.join(', ')} WHERE id = $${i} RETURNING ${COLS}`,
    values
  );
  return result.rows[0] || null;
}

/** Get credential by id (for ownership check). */
async function findById(id) {
  const result = await query(`SELECT ${COLS} FROM professional_credentials WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

/** Get first issuing_country per psychologist (for verified_country in list/detail). */
async function getVerifiedCountryByPsychologistIds(psychologistIds) {
  if (!psychologistIds || psychologistIds.length === 0) return {};
  const result = await query(
    `SELECT DISTINCT ON (psychologist_id) psychologist_id, issuing_country
     FROM professional_credentials
     WHERE psychologist_id = ANY($1) AND verification_status = 'verified' AND issuing_country IS NOT NULL
     ORDER BY psychologist_id, verified_at DESC NULLS LAST`,
    [psychologistIds]
  );
  const map = {};
  for (const row of result.rows) {
    map[row.psychologist_id] = row.issuing_country;
  }
  return map;
}

module.exports = {
  create,
  createFromApplicationCredentials,
  findByPsychologistId,
  findById,
  update,
  getVerifiedCountryByPsychologistIds,
};
