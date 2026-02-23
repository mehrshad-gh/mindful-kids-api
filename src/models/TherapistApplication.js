const { query } = require('../database/connection');

const COLS = `id, user_id, professional_name, email, phone, specialty, specialization, bio, location, languages,
  profile_image_url, video_urls, contact_info, credentials, status, submitted_at, reviewed_at, reviewed_by, rejection_reason, psychologist_id, created_at, updated_at`;

function toApp(row) {
  if (!row) return null;
  return {
    ...row,
    specialization: row.specialization || [],
    languages: row.languages || [],
    video_urls: row.video_urls || [],
    contact_info: row.contact_info || {},
    credentials: row.credentials || [],
  };
}

async function findByUserId(userId) {
  const result = await query(`SELECT ${COLS} FROM therapist_applications WHERE user_id = $1`, [userId]);
  return toApp(result.rows[0] || null);
}

async function findById(id) {
  const result = await query(`SELECT ${COLS} FROM therapist_applications WHERE id = $1`, [id]);
  return toApp(result.rows[0] || null);
}

async function findAllByStatus(status, options = {}) {
  let sql = `SELECT ${COLS} FROM therapist_applications WHERE 1=1`;
  const params = [];
  let i = 1;
  if (status) {
    sql += ` AND status = $${i++}`;
    params.push(status);
  }
  sql += ' ORDER BY submitted_at DESC NULLS LAST, created_at DESC';
  if (options.limit) {
    sql += ` LIMIT $${i++}`;
    params.push(options.limit);
  }
  if (options.offset) {
    sql += ` OFFSET $${i++}`;
    params.push(options.offset);
  }
  const result = await query(sql, params);
  return result.rows.map(toApp);
}

async function create(userId, data) {
  const result = await query(
    `INSERT INTO therapist_applications (
      user_id, professional_name, email, phone, specialty, specialization, bio, location, languages,
      profile_image_url, video_urls, contact_info, credentials, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft')
    RETURNING ${COLS}`,
    [
      userId,
      data.professional_name || '',
      data.email || '',
      data.phone || null,
      data.specialty || null,
      data.specialization ? (Array.isArray(data.specialization) ? data.specialization : []) : [],
      data.bio || null,
      data.location || null,
      data.languages ? (Array.isArray(data.languages) ? data.languages : []) : [],
      data.profile_image_url || null,
      data.video_urls ? (Array.isArray(data.video_urls) ? data.video_urls : []) : [],
      JSON.stringify(data.contact_info || {}),
      JSON.stringify(data.credentials || []),
    ]
  );
  return toApp(result.rows[0]);
}

async function update(id, data) {
  const updates = [];
  const values = [];
  let i = 1;
  const fields = [
    'professional_name', 'email', 'phone', 'specialty', 'bio', 'location', 'profile_image_url',
    'specialization', 'languages', 'video_urls', 'contact_info', 'credentials',
  ];
  fields.forEach((f) => {
    if (data[f] !== undefined) {
      if (f === 'specialization' || f === 'languages' || f === 'video_urls') {
        updates.push(`${f} = $${i++}`);
        values.push(Array.isArray(data[f]) ? data[f] : []);
      } else if (f === 'contact_info' || f === 'credentials') {
        updates.push(`${f} = $${i++}`);
        values.push(typeof data[f] === 'string' ? data[f] : JSON.stringify(data[f] || (f === 'credentials' ? [] : {})));
      } else {
        updates.push(`${f} = $${i++}`);
        values.push(data[f]);
      }
    }
  });
  if (updates.length === 0) return findById(id);
  values.push(id);
  const result = await query(
    `UPDATE therapist_applications SET ${updates.join(', ')} WHERE id = $${i} RETURNING ${COLS}`,
    values
  );
  return toApp(result.rows[0] || null);
}

async function submit(id) {
  const result = await query(
    `UPDATE therapist_applications SET status = 'pending', submitted_at = NOW() WHERE id = $1 AND status = 'draft' RETURNING ${COLS}`,
    [id]
  );
  return toApp(result.rows[0] || null);
}

async function setReviewed(id, status, reviewedBy, rejectionReason = null) {
  const result = await query(
    `UPDATE therapist_applications SET status = $1, reviewed_at = NOW(), reviewed_by = $2, rejection_reason = $3 WHERE id = $4 RETURNING ${COLS}`,
    [status, reviewedBy, rejectionReason, id]
  );
  return toApp(result.rows[0] || null);
}

async function setPsychologistId(applicationId, psychologistId) {
  await query(
    'UPDATE therapist_applications SET psychologist_id = $1 WHERE id = $2',
    [psychologistId, applicationId]
  );
}

async function getApplicationClinicIds(applicationId) {
  const result = await query(
    `SELECT clinic_id, role_label, is_primary FROM therapist_application_clinics WHERE therapist_application_id = $1`,
    [applicationId]
  );
  return result.rows;
}

async function addApplicationClinic(applicationId, clinicId, roleLabel = null, isPrimary = false) {
  await query(
    `INSERT INTO therapist_application_clinics (therapist_application_id, clinic_id, role_label, is_primary)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (therapist_application_id, clinic_id) DO UPDATE SET role_label = $3, is_primary = $4`,
    [applicationId, clinicId, roleLabel, isPrimary]
  );
}

async function setApplicationClinics(applicationId, clinics) {
  await query('DELETE FROM therapist_application_clinics WHERE therapist_application_id = $1', [applicationId]);
  for (const c of clinics || []) {
    await addApplicationClinic(applicationId, c.clinic_id, c.role_label || null, c.is_primary || false);
  }
}

module.exports = {
  findByUserId,
  findById,
  findAllByStatus,
  create,
  update,
  submit,
  setReviewed,
  setPsychologistId,
  getApplicationClinicIds,
  addApplicationClinic,
  setApplicationClinics,
};
