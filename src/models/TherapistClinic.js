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

module.exports = {
  add,
  findByPsychologistId,
};
