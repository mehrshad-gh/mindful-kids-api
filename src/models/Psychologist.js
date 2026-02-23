const { query } = require('../database/connection');

const PSYCHOLOGIST_COLUMNS = `id, name, specialty, specialization, bio, rating, location, languages,
  profile_image, avatar_url, contact_info, email, phone, video_urls, is_verified, is_active, created_at, updated_at`;

/** Build contact_info from row: use contact_info JSONB if non-empty, else { email, phone }. */
function normalizeContact(row) {
  const ci = row.contact_info;
  if (ci && typeof ci === 'object' && Object.keys(ci).length > 0) return ci;
  const out = {};
  if (row.email) out.email = row.email;
  if (row.phone) out.phone = row.phone;
  return out;
}

/** Map DB row to supported shape: name, specialty, bio, rating, location, languages, profile_image, contact_info, created_at + rest. */
function toPsychologist(row) {
  if (!row) return null;
  const profile_image = row.profile_image || row.avatar_url || null;
  const contact_info = normalizeContact(row);
  return {
    ...row,
    profile_image,
    contact_info,
  };
}

async function findAll(filters = {}) {
  let sql = `
    SELECT ${PSYCHOLOGIST_COLUMNS}
    FROM psychologists WHERE is_active = true`;
  const params = [];
  let i = 1;
  if (filters.specialization) {
    sql += ` AND $${i++} = ANY(specialization)`;
    params.push(filters.specialization);
  }
  if (filters.specialty) {
    sql += ` AND (specialty ILIKE $${i++} OR $${i} = ANY(specialization))`;
    params.push(`%${filters.specialty}%`, filters.specialty);
  }
  if (filters.search) {
    sql += ` AND (name ILIKE $${i++} OR bio ILIKE $${i++})`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  sql += ' ORDER BY is_verified DESC, name ASC';
  if (filters.limit) {
    sql += ` LIMIT $${i++}`;
    params.push(filters.limit);
  }
  const result = await query(sql, params);
  return result.rows.map(toPsychologist);
}

async function findById(id) {
  const result = await query(
    `SELECT ${PSYCHOLOGIST_COLUMNS} FROM psychologists WHERE id = $1`,
    [id]
  );
  return toPsychologist(result.rows[0] || null);
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
