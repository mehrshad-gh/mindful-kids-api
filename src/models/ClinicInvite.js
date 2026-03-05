const crypto = require('crypto');
const { query } = require('../database/connection');

/** Create invite. Returns { id, token, expires_at }. */
async function create({ clinicId, contactEmail, expiresAt }) {
  const token = crypto.randomBytes(32).toString('hex');
  const result = await query(
    `INSERT INTO clinic_invites (clinic_id, contact_email, token, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, token, expires_at`,
    [clinicId, contactEmail, token, expiresAt]
  );
  const row = result.rows[0];
  return { id: row.id, token: row.token, expires_at: row.expires_at };
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

async function findById(id) {
  const result = await query(
    `SELECT id, clinic_id, contact_email, token, expires_at, created_at
     FROM clinic_invites WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/** Pending invites for a clinic (expires_at > NOW()). */
async function findPendingByClinicId(clinicId) {
  const result = await query(
    `SELECT id, clinic_id, contact_email, expires_at, created_at
     FROM clinic_invites WHERE clinic_id = $1 AND expires_at > NOW() ORDER BY created_at DESC`,
    [clinicId]
  );
  return result.rows;
}

async function removeByToken(token) {
  const result = await query(
    'DELETE FROM clinic_invites WHERE token = $1',
    [token]
  );
  return result.rowCount > 0;
}

async function removeById(id) {
  const result = await query('DELETE FROM clinic_invites WHERE id = $1', [id]);
  return result.rowCount > 0;
}

/** New token, extend expiry by 7 days. Returns { token, expires_at }. */
async function rotate(id) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const result = await query(
    `UPDATE clinic_invites SET token = $1, expires_at = $2 WHERE id = $3
     RETURNING token, expires_at`,
    [token, expiresAt, id]
  );
  return result.rows[0] || null;
}

module.exports = {
  create,
  findByToken,
  findById,
  findPendingByClinicId,
  removeByToken,
  removeById,
  rotate,
};
