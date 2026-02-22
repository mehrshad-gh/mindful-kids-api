const { query } = require('../database/connection');

async function findByParentId(parentId) {
  const result = await query(
    `SELECT id, parent_id, name, birth_date, age_group, avatar_url, created_at, updated_at
     FROM children WHERE parent_id = $1 ORDER BY created_at ASC`,
    [parentId]
  );
  return result.rows;
}

async function findById(id, parentId = null) {
  let sql = 'SELECT id, parent_id, name, birth_date, age_group, avatar_url, created_at, updated_at FROM children WHERE id = $1';
  const params = [id];
  if (parentId) {
    sql += ' AND parent_id = $2';
    params.push(parentId);
  }
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function create({ parentId, name, birthDate, ageGroup, avatarUrl }) {
  const result = await query(
    `INSERT INTO children (parent_id, name, birth_date, age_group, avatar_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, parent_id, name, birth_date, age_group, avatar_url, created_at, updated_at`,
    [parentId, name, birthDate || null, ageGroup || null, avatarUrl || null]
  );
  return result.rows[0];
}

async function update(id, parentId, data) {
  const fields = [];
  const values = [];
  let i = 1;
  if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name); }
  if (data.birthDate !== undefined) { fields.push(`birth_date = $${i++}`); values.push(data.birthDate); }
  if (data.ageGroup !== undefined) { fields.push(`age_group = $${i++}`); values.push(data.ageGroup); }
  if (data.avatarUrl !== undefined) { fields.push(`avatar_url = $${i++}`); values.push(data.avatarUrl); }
  if (fields.length === 0) return findById(id, parentId);
  values.push(id, parentId);
  const result = await query(
    `UPDATE children SET ${fields.join(', ')} WHERE id = $${i++} AND parent_id = $${i}
     RETURNING id, parent_id, name, birth_date, age_group, avatar_url, created_at, updated_at`,
    values
  );
  return result.rows[0] || null;
}

async function remove(id, parentId) {
  const result = await query('DELETE FROM children WHERE id = $1 AND parent_id = $2 RETURNING id', [id, parentId]);
  return result.rowCount > 0;
}

module.exports = {
  findByParentId,
  findById,
  create,
  update,
  remove,
};
