const { query } = require('../database/connection');

async function findAll(filters = {}) {
  let sql = `
    SELECT id, name, email, phone, specialization, bio, location, video_urls, avatar_url,
           is_verified, is_active, created_at, updated_at
    FROM psychologists WHERE is_active = true`;
  const params = [];
  let i = 1;
  if (filters.specialization) {
    sql += ` AND $${i++} = ANY(specialization)`;
    params.push(filters.specialization);
  }
  if (filters.search) {
    sql += ` AND (name ILIKE $${i++} OR bio ILIKE $${i})`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  sql += ' ORDER BY is_verified DESC, name ASC';
  if (filters.limit) {
    sql += ` LIMIT $${i++}`;
    params.push(filters.limit);
  }
  const result = await query(sql, params);
  return result.rows;
}

async function findById(id) {
  const result = await query(
    `SELECT id, name, email, phone, specialization, bio, location, video_urls, avatar_url,
            is_verified, is_active, created_at, updated_at
     FROM psychologists WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function getAverageRating(psychologistId) {
  const result = await query(
    'SELECT COALESCE(AVG(rating), 0)::numeric(3,2) as avg_rating, COUNT(*)::int as review_count FROM reviews WHERE psychologist_id = $1',
    [psychologistId]
  );
  return result.rows[0];
}

module.exports = {
  findAll,
  findById,
  getAverageRating,
};
