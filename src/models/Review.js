const { query } = require('../database/connection');

async function findByPsychologistId(psychologistId, options = {}) {
  let sql = `
    SELECT r.id, r.user_id, r.psychologist_id, r.rating, r.comment, r.created_at,
           u.name as user_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.psychologist_id = $1
    ORDER BY r.created_at DESC`;
  const params = [psychologistId];
  if (options.limit) {
    sql += ` LIMIT $2`;
    params.push(options.limit);
  }
  const result = await query(sql, params);
  return result.rows;
}

async function findByUserAndPsychologist(userId, psychologistId) {
  const result = await query(
    'SELECT id, user_id, psychologist_id, rating, comment, created_at FROM reviews WHERE user_id = $1 AND psychologist_id = $2',
    [userId, psychologistId]
  );
  return result.rows[0] || null;
}

async function create({ userId, psychologistId, rating, comment }) {
  const result = await query(
    `INSERT INTO reviews (user_id, psychologist_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, psychologist_id) DO UPDATE SET rating = $3, comment = $4, updated_at = NOW()
     RETURNING id, user_id, psychologist_id, rating, comment, created_at, updated_at`,
    [userId, psychologistId, rating, comment || null]
  );
  return result.rows[0];
}

async function remove(id, userId) {
  const result = await query('DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return result.rowCount > 0;
}

module.exports = {
  findByPsychologistId,
  findByUserAndPsychologist,
  create,
  remove,
};
