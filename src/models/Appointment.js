const { query } = require('../database/connection');

const STATUSES = ['requested', 'confirmed', 'declined', 'cancelled', 'completed'];

/** Create appointment (after slot is locked and set to booked). */
async function create(data) {
  const {
    parent_user_id,
    psychologist_id,
    clinic_id,
    availability_slot_id,
    starts_at_utc,
    ends_at_utc,
    parent_notes,
  } = data;
  const result = await query(
    `INSERT INTO appointments (
      parent_user_id, psychologist_id, clinic_id, availability_slot_id,
      starts_at_utc, ends_at_utc, status, parent_notes, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'requested', $7, NOW())
    RETURNING id, parent_user_id, psychologist_id, clinic_id, availability_slot_id,
              starts_at_utc, ends_at_utc, status, parent_notes, created_at, updated_at`,
    [
      parent_user_id,
      psychologist_id,
      clinic_id || null,
      availability_slot_id,
      starts_at_utc,
      ends_at_utc,
      parent_notes || null,
    ]
  );
  return result.rows[0];
}

/** Get by id with slot and psychologist info. */
async function findById(id) {
  const result = await query(
    `SELECT a.id, a.parent_user_id, a.psychologist_id, a.clinic_id, a.availability_slot_id,
            a.starts_at_utc, a.ends_at_utc, a.status, a.parent_notes, a.cancellation_reason, a.created_at, a.updated_at,
            p.name AS psychologist_name,
            s.starts_at_utc AS slot_starts, s.ends_at_utc AS slot_ends, s.status AS slot_status
     FROM appointments a
     JOIN psychologists p ON p.id = a.psychologist_id
     LEFT JOIN availability_slots s ON s.id = a.availability_slot_id
     WHERE a.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/** List for psychologist (therapist view). Optional status filter. */
async function listByPsychologist(psychologistId, statusFilter = null) {
  let sql = `
    SELECT a.id, a.parent_user_id, a.psychologist_id, a.clinic_id, a.availability_slot_id,
           a.starts_at_utc, a.ends_at_utc, a.status, a.parent_notes, a.cancellation_reason, a.created_at, a.updated_at,
           p.name AS psychologist_name,
           u.name AS parent_name, u.email AS parent_email
    FROM appointments a
    JOIN psychologists p ON p.id = a.psychologist_id
    JOIN users u ON u.id = a.parent_user_id
    WHERE a.psychologist_id = $1`;
  const params = [psychologistId];
  if (statusFilter && STATUSES.includes(statusFilter)) {
    sql += ` AND a.status = $${params.length + 1}`;
    params.push(statusFilter);
  }
  sql += ' ORDER BY a.starts_at_utc DESC';
  const result = await query(sql, params);
  return result.rows;
}

/** List for parent. */
async function listByParent(parentUserId) {
  const result = await query(
    `SELECT a.id, a.parent_user_id, a.psychologist_id, a.clinic_id, a.availability_slot_id,
            a.starts_at_utc, a.ends_at_utc, a.status, a.parent_notes, a.cancellation_reason, a.created_at, a.updated_at,
            p.name AS psychologist_name
     FROM appointments a
     JOIN psychologists p ON p.id = a.psychologist_id
     WHERE a.parent_user_id = $1
     ORDER BY a.starts_at_utc DESC`,
    [parentUserId]
  );
  return result.rows;
}

/** Count appointments by status for a psychologist (e.g. requested count for badge). */
async function countByPsychologistStatus(psychologistId, status) {
  if (!STATUSES.includes(status)) throw new Error(`status must be one of: ${STATUSES.join(', ')}`);
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM appointments WHERE psychologist_id = $1 AND status = $2`,
    [psychologistId, status]
  );
  return result.rows[0]?.count ?? 0;
}

/** Update status (optional cancellation_reason for decline/cancel). */
async function updateStatus(id, status, cancellationReason = null) {
  if (!STATUSES.includes(status)) throw new Error(`status must be one of: ${STATUSES.join(', ')}`);
  const result = await query(
    `UPDATE appointments SET status = $1, cancellation_reason = $2, updated_at = NOW() WHERE id = $3
     RETURNING id, parent_user_id, psychologist_id, clinic_id, availability_slot_id,
               starts_at_utc, ends_at_utc, status, parent_notes, cancellation_reason, created_at, updated_at`,
    [status, cancellationReason, id]
  );
  return result.rows[0] || null;
}

module.exports = {
  STATUSES,
  create,
  findById,
  listByPsychologist,
  listByParent,
  countByPsychologistStatus,
  updateStatus,
};
