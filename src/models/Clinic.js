const { query } = require('../database/connection');

const COLUMNS = 'id, name, slug, description, address, country, website, logo_url, is_active, created_at, updated_at';

async function findAll(filters = {}) {
  let sql = `SELECT ${COLUMNS} FROM clinics WHERE 1=1`;
  const params = [];
  let i = 1;
  if (filters.is_active !== undefined) {
    sql += ` AND is_active = $${i++}`;
    params.push(filters.is_active);
  }
  if (filters.country) {
    sql += ` AND country = $${i++}`;
    params.push(filters.country);
  }
  if (filters.search) {
    sql += ` AND (name ILIKE $${i++} OR description ILIKE $${i++})`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  sql += ' ORDER BY name ASC';
  if (filters.limit) {
    sql += ` LIMIT $${i++}`;
    params.push(filters.limit);
  }
  const result = await query(sql, params);
  return result.rows;
}

async function findById(id) {
  const result = await query(`SELECT ${COLUMNS} FROM clinics WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function findBySlug(slug) {
  const result = await query(`SELECT ${COLUMNS} FROM clinics WHERE slug = $1`, [slug]);
  return result.rows[0] || null;
}

async function create({ name, slug, description, address, country, website, logoUrl, isActive = true }) {
  const result = await query(
    `INSERT INTO clinics (name, slug, description, address, country, website, logo_url, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${COLUMNS}`,
    [name, slug || name.toLowerCase().replace(/\s+/g, '-'), description || null, address || null, country || null, website || null, logoUrl || null, isActive !== false]
  );
  return result.rows[0];
}

module.exports = {
  findAll,
  findById,
  findBySlug,
  create,
};
