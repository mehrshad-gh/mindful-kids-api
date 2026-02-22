const { query } = require('../database/connection');

async function findAll(filters = {}) {
  let sql = `
    SELECT id, title, slug, description, activity_type, age_groups, psychology_basis,
           for_parents_notes, duration_minutes, sort_order, is_active, instructions, created_at, updated_at
    FROM activities WHERE 1=1`;
  const params = [];
  let i = 1;
  if (filters.active !== undefined) {
    sql += ` AND is_active = $${i++}`;
    params.push(filters.active);
  }
  if (filters.activityType) {
    sql += ` AND activity_type = $${i++}`;
    params.push(filters.activityType);
  }
  if (filters.ageGroup) {
    sql += ` AND $${i++} = ANY(age_groups)`;
    params.push(filters.ageGroup);
  }
  sql += ' ORDER BY sort_order ASC, created_at ASC';
  const result = await query(sql, params);
  return result.rows;
}

async function findById(id) {
  const result = await query(
    `SELECT id, title, slug, description, activity_type, age_groups, psychology_basis,
            for_parents_notes, duration_minutes, sort_order, is_active, instructions, created_at, updated_at
     FROM activities WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function findBySlug(slug) {
  const result = await query(
    `SELECT id, title, slug, description, activity_type, age_groups, psychology_basis,
            for_parents_notes, duration_minutes, sort_order, is_active, instructions, created_at, updated_at
     FROM activities WHERE slug = $1 AND is_active = true`,
    [slug]
  );
  return result.rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  findBySlug,
};
