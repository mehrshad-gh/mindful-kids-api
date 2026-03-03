const { query } = require('../database/connection');

const OWNER_TYPES = ['psychologist', 'clinic'];
const STATUSES = ['open', 'blocked', 'booked'];

const CREATED_BY_ROLES = ['therapist', 'clinic_admin', 'admin'];

/** Create a slot with optional provenance (created_by_user_id, created_by_role, managed_by_clinic_id). */
async function create({
  owner_type,
  owner_id,
  starts_at_utc,
  ends_at_utc,
  created_by_user_id = null,
  created_by_role = null,
  managed_by_clinic_id = null,
}) {
  if (!OWNER_TYPES.includes(owner_type)) throw new Error(`owner_type must be one of: ${OWNER_TYPES.join(', ')}`);
  if (created_by_role && !CREATED_BY_ROLES.includes(created_by_role)) {
    throw new Error(`created_by_role must be one of: ${CREATED_BY_ROLES.join(', ')}`);
  }
  const result = await query(
    `INSERT INTO availability_slots (
       owner_type, owner_id, starts_at_utc, ends_at_utc, status,
       created_by_user_id, created_by_role, managed_by_clinic_id, version, updated_at
     ) VALUES ($1, $2, $3, $4, 'open', $5, $6, $7, 0, NOW())
     RETURNING id, owner_type, owner_id, starts_at_utc, ends_at_utc, status,
               created_by_user_id, created_by_role, managed_by_clinic_id, version, created_at, updated_at`,
    [owner_type, owner_id, starts_at_utc, ends_at_utc, created_by_user_id || null, created_by_role || null, managed_by_clinic_id || null]
  );
  return result.rows[0];
}

/** Find overlapping open or booked slots (for validation). */
async function findOverlapping(owner_type, owner_id, starts_at_utc, ends_at_utc, excludeSlotId = null) {
  let sql = `
    SELECT id, owner_type, owner_id, starts_at_utc, ends_at_utc, status
    FROM availability_slots
    WHERE owner_type = $1 AND owner_id = $2
      AND (status = 'open' OR status = 'booked')
      AND (starts_at_utc, ends_at_utc) OVERLAPS ($3::timestamptz, $4::timestamptz)`;
  const params = [owner_type, owner_id, starts_at_utc, ends_at_utc];
  if (excludeSlotId) {
    sql += ` AND id != $${params.length + 1}`;
    params.push(excludeSlotId);
  }
  const result = await query(sql, params);
  return result.rows;
}

/** List slots for owner in [from, to]. Optional status filter (default: all). */
async function listByOwner(owner_type, owner_id, from_utc, to_utc, statusFilter = null) {
  let sql = `
    SELECT id, owner_type, owner_id, starts_at_utc, ends_at_utc, status,
           created_by_user_id, created_by_role, managed_by_clinic_id, version, created_at, updated_at
    FROM availability_slots
    WHERE owner_type = $1 AND owner_id = $2
      AND starts_at_utc >= $3::timestamptz AND starts_at_utc < $4::timestamptz`;
  const params = [owner_type, owner_id, from_utc, to_utc];
  if (statusFilter && STATUSES.includes(statusFilter)) {
    sql += ` AND status = $${params.length + 1}`;
    params.push(statusFilter);
  }
  sql += ' ORDER BY starts_at_utc ASC';
  const result = await query(sql, params);
  return result.rows;
}

/** Get one by id. */
async function findById(id) {
  const result = await query(
    `SELECT id, owner_type, owner_id, starts_at_utc, ends_at_utc, status,
            created_by_user_id, created_by_role, managed_by_clinic_id, version, created_at, updated_at
     FROM availability_slots WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/** Update status (e.g. to 'booked'). */
async function updateStatus(id, status) {
  if (!STATUSES.includes(status)) throw new Error(`status must be one of: ${STATUSES.join(', ')}`);
  const result = await query(
    `UPDATE availability_slots SET status = $1, version = version + 1, updated_at = NOW() WHERE id = $2
     RETURNING id, owner_type, owner_id, starts_at_utc, ends_at_utc, status,
               created_by_user_id, created_by_role, managed_by_clinic_id, version, created_at, updated_at`,
    [status, id]
  );
  return result.rows[0] || null;
}

/**
 * Delete slot (only if status = 'open'). If expectedVersion provided, delete only when version matches; else 409.
 * Returns deleted slot row or null when version mismatch.
 */
async function remove(id, expectedVersion = null) {
  let sql = `DELETE FROM availability_slots WHERE id = $1 AND status = 'open'`;
  const params = [id];
  if (expectedVersion != null) {
    sql += ` AND version = $2`;
    params.push(expectedVersion);
  }
  sql += ` RETURNING id, version`;
  const result = await query(sql, params);
  const row = result.rows[0] || null;
  if (expectedVersion != null && !row) return null;
  return row;
}

module.exports = {
  OWNER_TYPES,
  STATUSES,
  CREATED_BY_ROLES,
  create,
  findOverlapping,
  listByOwner,
  findById,
  updateStatus,
  remove,
};
