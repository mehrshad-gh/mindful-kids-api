const { query } = require('../database/connection');

const COLS = 'id, reporter_id, psychologist_id, reason, details, status, created_at, updated_at';

async function create({ reporterId, psychologistId, reason, details }) {
  const result = await query(
    `INSERT INTO professional_reports (reporter_id, psychologist_id, reason, details)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLS}`,
    [reporterId, psychologistId, reason || 'other', details || null]
  );
  return result.rows[0];
}

async function findByPsychologistId(psychologistId) {
  const result = await query(
    `SELECT ${COLS} FROM professional_reports WHERE psychologist_id = $1 ORDER BY created_at DESC`,
    [psychologistId]
  );
  return result.rows;
}

module.exports = {
  create,
  findByPsychologistId,
};
