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
  if (filters.location) {
    sql += ` AND location ILIKE $${i++}`;
    params.push(`%${filters.location}%`);
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

/** Create psychologist (e.g. from approved therapist application). */
async function create(data) {
  const result = await query(
    `INSERT INTO psychologists (
      user_id, name, email, phone, specialty, specialization, bio, location, video_urls,
      profile_image, avatar_url, contact_info, languages, is_verified, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
    RETURNING ${PSYCHOLOGIST_COLUMNS}`,
    [
      data.user_id || null,
      data.name,
      data.email || null,
      data.phone || null,
      data.specialty || null,
      data.specialization || [],
      data.bio || null,
      data.location || null,
      data.video_urls || [],
      data.profile_image || data.avatar_url || null,
      data.avatar_url || data.profile_image || null,
      typeof data.contact_info === 'string' ? data.contact_info : JSON.stringify(data.contact_info || {}),
      data.languages || [],
      data.is_verified !== false,
    ]
  );
  return toPsychologist(result.rows[0]);
}

module.exports = {
  findAll,
  findById,
  getAverageRating,
  create,
};
