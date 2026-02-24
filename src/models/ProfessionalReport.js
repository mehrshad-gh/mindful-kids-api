const { query } = require('../database/connection');

const COLS = 'id, reporter_id, psychologist_id, reason, details, status, action_taken, created_at, updated_at';

const ACTION_TRIGGERS_VERIFICATION_UPDATE = ['temporary_suspension', 'verification_revoked'];

async function create({ reporterId, psychologistId, reason, details }) {
  const result = await query(
    `INSERT INTO professional_reports (reporter_id, psychologist_id, reason, details)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLS}`,
    [reporterId, psychologistId, reason || 'other', details || null]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await query(`SELECT ${COLS} FROM professional_reports WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function findByPsychologistId(psychologistId) {
  const result = await query(
    `SELECT ${COLS} FROM professional_reports WHERE psychologist_id = $1 ORDER BY created_at DESC`,
    [psychologistId]
  );
  return result.rows;
}

/** List reports for admin (optional status filter). */
async function findAllForAdmin(options = {}) {
  let sql = `SELECT ${COLS} FROM professional_reports WHERE 1=1`;
  const params = [];
  let i = 1;
  if (options.status) {
    sql += ` AND status = $${i++}`;
    params.push(options.status);
  }
  sql += ' ORDER BY created_at DESC';
  if (options.limit) {
    sql += ` LIMIT $${i++}`;
    params.push(options.limit);
  }
  const result = await query(sql, params);
  return result.rows;
}

/** Update report (e.g. status, action_taken). When action_taken is temporary_suspension or verification_revoked, updates psychologist.verification_status. */
async function update(id, data) {
  const updates = [];
  const values = [];
  let i = 1;
  if (data.status !== undefined) {
    updates.push(`status = $${i++}`);
    values.push(data.status);
  }
  if (data.action_taken !== undefined) {
    updates.push(`action_taken = $${i++}`);
    values.push(data.action_taken);
  }
  if (updates.length === 0) return findById(id);
  values.push(id);
  const result = await query(
    `UPDATE professional_reports SET ${updates.join(', ')} WHERE id = $${i} RETURNING ${COLS}`,
    values
  );
  const row = result.rows[0];
  if (row && data.action_taken && ACTION_TRIGGERS_VERIFICATION_UPDATE.includes(data.action_taken)) {
    const Psychologist = require('./Psychologist');
    const newStatus = data.action_taken === 'verification_revoked' ? 'rejected' : 'suspended';
    await Psychologist.update(row.psychologist_id, { verification_status: newStatus });
  }
  return row;
}

module.exports = {
  create,
  findById,
  findByPsychologistId,
  findAllForAdmin,
  update,
};
