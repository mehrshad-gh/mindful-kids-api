const { query } = require('../database/connection');

const ADVICE_COLUMNS = 'id, title, content, category, psychology_basis, age_range, related_activity_id, is_daily, published_at, created_at, updated_at';

async function findAll(filters = {}) {
  let sql = `
    SELECT ${ADVICE_COLUMNS}
    FROM advice WHERE 1=1`;
  const params = [];
  let i = 1;
  if (filters.dailyOnly) {
    sql += ' AND is_daily = true';
  }
  if (filters.category) {
    sql += ` AND category = $${i++}`;
    params.push(filters.category);
  }
  sql += ' ORDER BY published_at DESC NULLS LAST, created_at DESC';
  if (filters.limit) {
    sql += ` LIMIT $${i++}`;
    params.push(filters.limit);
  }
  const result = await query(sql, params);
  return result.rows;
}

async function findById(id) {
  const result = await query(
    `SELECT ${ADVICE_COLUMNS} FROM advice WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function getDailyAdvice() {
  const result = await query(
    `SELECT ${ADVICE_COLUMNS}
     FROM advice WHERE is_daily = true AND (published_at IS NULL OR published_at <= NOW())
     ORDER BY published_at DESC NULLS LAST LIMIT 1`
  );
  return result.rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  getDailyAdvice,
};
