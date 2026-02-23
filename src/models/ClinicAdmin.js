const { query } = require('../database/connection');

async function getManagedClinicIds(userId) {
  const result = await query(
    'SELECT clinic_id FROM clinic_admins WHERE user_id = $1',
    [userId]
  );
  return result.rows.map((r) => r.clinic_id);
}

async function findByUserId(userId) {
  const result = await query(
    `SELECT ca.id, ca.user_id, ca.clinic_id, ca.created_at,
            c.name AS clinic_name, c.slug AS clinic_slug
     FROM clinic_admins ca
     JOIN clinics c ON c.id = ca.clinic_id
     WHERE ca.user_id = $1
     ORDER BY c.name`,
    [userId]
  );
  return result.rows;
}

async function findByClinicId(clinicId) {
  const result = await query(
    `SELECT ca.id, ca.user_id, ca.clinic_id, ca.created_at,
            u.email, u.name
     FROM clinic_admins ca
     JOIN users u ON u.id = ca.user_id
     WHERE ca.clinic_id = $1
     ORDER BY u.name`,
    [clinicId]
  );
  return result.rows;
}

async function isAdminOfClinic(userId, clinicId) {
  const result = await query(
    'SELECT 1 FROM clinic_admins WHERE user_id = $1 AND clinic_id = $2',
    [userId, clinicId]
  );
  return result.rowCount > 0;
}

async function add(userId, clinicId) {
  await query(
    `INSERT INTO clinic_admins (user_id, clinic_id) VALUES ($1, $2)
     ON CONFLICT (user_id, clinic_id) DO NOTHING`,
    [userId, clinicId]
  );
}

async function remove(userId, clinicId) {
  const result = await query(
    'DELETE FROM clinic_admins WHERE user_id = $1 AND clinic_id = $2',
    [userId, clinicId]
  );
  return result.rowCount > 0;
}

module.exports = {
  getManagedClinicIds,
  findByUserId,
  findByClinicId,
  isAdminOfClinic,
  add,
  remove,
};
