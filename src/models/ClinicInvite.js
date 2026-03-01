const crypto = require('crypto');
const { query } = require('../database/connection');

async function create({ clinicId, contactEmail, expiresAt }) {
  const token = crypto.randomBytes(32).toString('hex');
  await query(
    `INSERT INTO clinic_invites (clinic_id, contact_email, token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [clinicId, contactEmail, token, expiresAt]
  );
  return token;
}

async function findByToken(token) {
  const result = await query(
    `SELECT id, clinic_id, contact_email, token, expires_at, created_at
     FROM clinic_invites
     WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );
  return result.rows[0] || null;
}

async function removeByToken(token) {
  const result = await query(
    'DELETE FROM clinic_invites WHERE token = $1',
    [token]
  );
  return result.rowCount > 0;
}

module.exports = {
  create,
  findByToken,
  removeByToken,
};
