const { query } = require('../database/connection');

const PSYCHOLOGIST_COLUMNS = `id, user_id, name, specialty, specialization, bio, rating, location, languages,
  profile_image, avatar_url, contact_info, email, phone, video_urls, verification_status, verification_expires_at, last_verification_review_at, verified_at, is_active, created_at, updated_at`;

/** Build contact_info from row: use contact_info JSONB if non-empty, else { email, phone }. */
function normalizeContact(row) {
  const ci = row.contact_info;
  if (ci && typeof ci === 'object' && Object.keys(ci).length > 0) return ci;
  const out = {};
  if (row.email) out.email = row.email;
  if (row.phone) out.phone = row.phone;
  return out;
}

/** Map DB row to supported shape. Exposes is_verified (boolean) for API compatibility from verification_status. */
function toPsychologist(row) {
  if (!row) return null;
  const profile_image = row.profile_image || row.avatar_url || null;
  const contact_info = normalizeContact(row);
  return {
    ...row,
    profile_image,
    contact_info,
    is_verified: row.verification_status === 'verified',
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
  sql += ` AND verification_status = 'verified'`;
  sql += ' ORDER BY verified_at DESC NULLS LAST, name ASC';
  if (filters.limit) {
    sql += ` LIMIT $${i++}`;
    params.push(filters.limit);
  }
  const result = await query(sql, params);
  return result.rows.map(toPsychologist);
}

/**
 * Search for public directory: verified + active only.
 * Filters: country (via verified credential issuing_country), language, specialty, clinic_id.
 */
async function search(filters = {}) {
  let sql = `
    SELECT ${PSYCHOLOGIST_COLUMNS}
    FROM psychologists p
    WHERE p.is_active = true AND p.verification_status = 'verified'`;
  const params = [];
  let i = 1;
  if (filters.country && String(filters.country).trim()) {
    sql += ` AND EXISTS (
      SELECT 1 FROM professional_credentials pc
      WHERE pc.psychologist_id = p.id AND pc.verification_status = 'verified' AND pc.issuing_country = $${i++}
    )`;
    params.push(String(filters.country).trim());
  }
  if (filters.language && String(filters.language).trim()) {
    sql += ` AND p.languages && $${i++}::text[]`;
    params.push([String(filters.language).trim()]);
  }
  if (filters.specialty && String(filters.specialty).trim()) {
    sql += ` AND (p.specialty ILIKE $${i++} OR $${i} = ANY(p.specialization))`;
    params.push(`%${String(filters.specialty).trim()}%`, String(filters.specialty).trim());
  }
  if (filters.clinic_id && String(filters.clinic_id).trim()) {
    sql += ` AND EXISTS (
      SELECT 1 FROM therapist_clinics tc
      WHERE tc.psychologist_id = p.id AND tc.clinic_id = $${i++} AND tc.status = 'active'
    )`;
    params.push(filters.clinic_id.trim());
  }
  sql += ' ORDER BY p.verified_at DESC NULLS LAST, p.name ASC';
  if (filters.limit != null) {
    sql += ` LIMIT $${i++}`;
    params.push(Math.min(Math.max(parseInt(filters.limit, 10) || 20, 1), 100));
  }
  if (filters.offset != null) {
    sql += ` OFFSET $${i++}`;
    params.push(Math.max(parseInt(filters.offset, 10) || 0, 0));
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

async function findByUserId(userId) {
  const result = await query(
    `SELECT ${PSYCHOLOGIST_COLUMNS} FROM psychologists WHERE user_id = $1`,
    [userId]
  );
  return toPsychologist(result.rows[0] || null);
}

async function findByEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  const result = await query(
    `SELECT ${PSYCHOLOGIST_COLUMNS} FROM psychologists WHERE LOWER(TRIM(email)) = $1 AND is_active = true`,
    [normalized]
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
  const verificationStatus = data.verification_status || (data.is_verified !== false ? 'verified' : 'pending');
  const result = await query(
    `INSERT INTO psychologists (
      user_id, name, email, phone, specialty, specialization, bio, location, video_urls,
      profile_image, avatar_url, contact_info, languages, verification_status, verification_expires_at, last_verification_review_at, verified_at, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, true)
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
      verificationStatus,
      data.verification_expires_at || null,
      data.last_verification_review_at || (verificationStatus === 'verified' ? new Date() : null),
      data.verified_at || (verificationStatus === 'verified' ? new Date() : null),
    ]
  );
  return toPsychologist(result.rows[0]);
}

/** Update psychologist (admin: verification_status, is_active, re-verification timestamps). */
async function update(id, data) {
  const updates = [];
  const values = [];
  let i = 1;
  if (data.verification_status !== undefined) {
    updates.push(`verification_status = $${i++}`);
    values.push(data.verification_status);
    if (data.verification_status === 'verified') {
      updates.push('verified_at = COALESCE(verified_at, NOW())');
      updates.push('last_verification_review_at = NOW()');
    }
  } else if (data.is_verified !== undefined) {
    const status = data.is_verified ? 'verified' : 'suspended';
    updates.push(`verification_status = $${i++}`);
    values.push(status);
    if (data.is_verified) {
      updates.push('verified_at = COALESCE(verified_at, NOW())');
      updates.push('last_verification_review_at = NOW()');
    }
  }
  if (data.verification_expires_at !== undefined) {
    updates.push(`verification_expires_at = $${i++}`);
    values.push(data.verification_expires_at);
  }
  if (data.last_verification_review_at !== undefined) {
    updates.push(`last_verification_review_at = $${i++}`);
    values.push(data.last_verification_review_at);
  }
  if (data.is_active !== undefined) {
    updates.push(`is_active = $${i++}`);
    values.push(!!data.is_active);
  }
  if (updates.length === 0) return findById(id);
  values.push(id);
  const result = await query(
    `UPDATE psychologists SET ${updates.join(', ')} WHERE id = $${i} RETURNING ${PSYCHOLOGIST_COLUMNS}`,
    values
  );
  return toPsychologist(result.rows[0] || null);
}

module.exports = {
  findAll,
  search,
  findById,
  findByUserId,
  findByEmail,
  getAverageRating,
  create,
  update,
};
