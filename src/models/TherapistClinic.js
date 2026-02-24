const { query } = require('../database/connection');

async function add(psychologistId, clinicId, roleLabel = null, isPrimary = false) {
  await query(
    `INSERT INTO therapist_clinics (psychologist_id, clinic_id, role_label, is_primary)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (psychologist_id, clinic_id) DO UPDATE SET role_label = $3, is_primary = $4`,
    [psychologistId, clinicId, roleLabel, isPrimary]
  );
}

async function findByPsychologistId(psychologistId) {
  const result = await query(
    `SELECT c.id, c.name, c.slug, c.description, c.address, c.country, c.website, c.logo_url,
            tc.role_label, tc.is_primary
     FROM therapist_clinics tc
     JOIN clinics c ON c.id = tc.clinic_id AND c.is_active = true
     WHERE tc.psychologist_id = $1
     ORDER BY tc.is_primary DESC, c.name`,
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
     WHERE tc.clinic_id = $1
     ORDER BY tc.is_primary DESC, p.name
     LIMIT $2`,
    [clinicId, limit]
  );
  return result.rows.map((r) => ({
    ...r,
    is_verified: r.verification_status === 'verified',
  }));
}

async function remove(psychologistId, clinicId) {
  const result = await query(
    'DELETE FROM therapist_clinics WHERE psychologist_id = $1 AND clinic_id = $2',
    [psychologistId, clinicId]
  );
  return result.rowCount > 0;
}

module.exports = {
  add,
  findByPsychologistId,
  findByClinicId,
  remove,
};
