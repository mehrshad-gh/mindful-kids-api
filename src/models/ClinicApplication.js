const { query } = require('../database/connection');

const COLUMNS = `id, clinic_name, country, contact_email, contact_phone, description,
  document_storage_path, status, submitted_at, reviewed_at, reviewed_by, rejection_reason,
  invite_token, clinic_id, created_at, updated_at`;

function toCamel(row) {
  if (!row) return null;
  return {
    id: row.id,
    clinic_name: row.clinic_name,
    country: row.country,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    description: row.description,
    document_storage_path: row.document_storage_path,
    status: row.status,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    reviewed_by: row.reviewed_by,
    rejection_reason: row.rejection_reason,
    invite_token: row.invite_token || null,
    clinic_id: row.clinic_id || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function findAll(filters = {}) {
  let sql = `SELECT ${COLUMNS} FROM clinic_applications WHERE 1=1`;
  const params = [];
  let i = 1;
  if (filters.status) {
    sql += ` AND status = $${i++}`;
    params.push(filters.status);
  }
  if (filters.country) {
    sql += ` AND country = $${i++}`;
    params.push(filters.country);
  }
  sql += ' ORDER BY COALESCE(submitted_at, created_at) DESC NULLS LAST';
  if (filters.limit) {
    sql += ` LIMIT $${i++}`;
    params.push(filters.limit);
  }
  const result = await query(sql, params);
  return result.rows.map(toCamel);
}

async function findById(id) {
  const result = await query(`SELECT ${COLUMNS} FROM clinic_applications WHERE id = $1`, [id]);
  return toCamel(result.rows[0]);
}

async function create(data) {
  const result = await query(
    `INSERT INTO clinic_applications (
      clinic_name, country, contact_email, contact_phone, description,
      document_storage_path, status, submitted_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING ${COLUMNS}`,
    [
      data.clinic_name,
      data.country,
      data.contact_email,
      data.contact_phone || null,
      data.description || null,
      data.document_storage_path,
      data.status || 'pending',
      data.submitted_at || null,
    ]
  );
  return toCamel(result.rows[0]);
}

async function update(id, data) {
  const updates = [];
  const values = [];
  let i = 1;
  const allowed = ['status', 'reviewed_at', 'reviewed_by', 'rejection_reason', 'invite_token', 'clinic_id'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates.push(`${key} = $${i++}`);
      values.push(data[key]);
    }
  }
  if (updates.length === 0) return findById(id);
  values.push(id);
  const result = await query(
    `UPDATE clinic_applications SET ${updates.join(', ')} WHERE id = $${i} RETURNING ${COLUMNS}`,
    values
  );
  return toCamel(result.rows[0]);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
};
