const { query } = require('../database/connection');

async function add(psychologistId, clinicId, roleLabel = null, isPrimary = false) {
  await query(
    `INSERT INTO therapist_clinics (psychologist_id, clinic_id, role_label, is_primary, status)
     VALUES ($1, $2, $3, $4, 'active')
     ON CONFLICT (psychologist_id, clinic_id) DO UPDATE SET role_label = $3, is_primary = $4, status = 'active'`,
    [psychologistId, clinicId, roleLabel, isPrimary]
  );
}

/** @param {Object} [opts] - optional: activeOnly (default false) – when true, only return status = 'active' (e.g. for public profile). */
async function findByPsychologistId(psychologistId, opts = {}) {
  const activeOnly = opts.activeOnly === true;
  const result = await query(
    `SELECT c.id, c.name, c.slug, c.description, c.address, c.country, c.website, c.logo_url,
            tc.role_label, tc.is_primary, COALESCE(tc.status, 'active') AS status
     FROM therapist_clinics tc
     JOIN clinics c ON c.id = tc.clinic_id
     WHERE tc.psychologist_id = $1${activeOnly ? " AND COALESCE(tc.status, 'active') = 'active'" : ''}
     ORDER BY tc.status = 'active' DESC, tc.is_primary DESC, c.name`,
    [psychologistId]
  );
  return result.rows;
}

/** List psychologists (therapists) affiliated with a clinic. */
async function findByClinicId(clinicId, options = {}) {
  const limit = options.limit ? Math.min(parseInt(options.limit, 10) || 100, 100) : 100;
  const result = await query(
    `SELECT p.id, p.name, p.specialty, p.specialization, p.bio, p.location, p.profile_image, p.avatar_url,
            p.verification_status, p.user_id, tc.role_label, tc.is_primary
     FROM therapist_clinics tc
     JOIN psychologists p ON p.id = tc.psychologist_id AND p.is_active = true
     WHERE tc.clinic_id = $1 AND tc.status = 'active'
     ORDER BY tc.is_primary DESC, p.name
     LIMIT $2`,
    [clinicId, limit]
  );
  return result.rows.map((r) => ({
    ...r,
    is_verified: r.verification_status === 'verified',
  }));
}

/** Soft remove: set status = 'removed' so therapist still sees it in their affiliations list. */
async function remove(psychologistId, clinicId) {
  const result = await query(
    `UPDATE therapist_clinics SET status = 'removed', updated_at = NOW()
     WHERE psychologist_id = $1 AND clinic_id = $2 AND status != 'removed'`,
    [psychologistId, clinicId]
  );
  return result.rowCount > 0;
}

/** Return map psychologist_id -> array of clinic names (active affiliations only). */
async function getClinicNamesByPsychologistIds(psychologistIds) {
  if (!psychologistIds || psychologistIds.length === 0) return {};
  const result = await query(
    `SELECT tc.psychologist_id, c.name
     FROM therapist_clinics tc
     JOIN clinics c ON c.id = tc.clinic_id
     WHERE tc.psychologist_id = ANY($1) AND tc.status = 'active'
     ORDER BY tc.is_primary DESC, c.name`,
    [psychologistIds]
  );
  const map = {};
  for (const row of result.rows) {
    if (!map[row.psychologist_id]) map[row.psychologist_id] = [];
    map[row.psychologist_id].push(row.name);
  }
  return map;
}

/** Return map clinic_id -> therapist count (active only). */
async function getTherapistCountByClinicIds(clinicIds) {
  if (!clinicIds || clinicIds.length === 0) return {};
  const result = await query(
    `SELECT clinic_id, COUNT(*)::int AS cnt
     FROM therapist_clinics
     WHERE clinic_id = ANY($1) AND status = 'active'
     GROUP BY clinic_id`,
    [clinicIds]
  );
  const map = {};
  for (const row of result.rows) {
    map[row.clinic_id] = row.cnt;
  }
  return map;
}

module.exports = {
  add,
  findByPsychologistId,
  findByClinicId,
  remove,
  getClinicNamesByPsychologistIds,
  getTherapistCountByClinicIds,
};
