const { query } = require('../database/connection');
const ClinicAdmin = require('./ClinicAdmin');
const Psychologist = require('./Psychologist');

function toUser(row) {
  if (!row) return null;
  const { password_hash, ...user } = row;
  return user;
}

async function findByEmail(email) {
  const result = await query(
    `SELECT id, email, password_hash, name, role, created_at, updated_at FROM users
     WHERE email = $1 AND (deactivated_at IS NULL)`,
    [email]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    'SELECT id, email, name, role, created_at, updated_at, deactivated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function create({ email, passwordHash, name, role = 'parent' }) {
  const result = await query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, role, created_at, updated_at`,
    [email, passwordHash, name, role]
  );
  return result.rows[0];
}

async function updateRole(userId, role) {
  const result = await query(
    `UPDATE users SET role = $1 WHERE id = $2
     RETURNING id, email, name, role, created_at, updated_at`,
    [role, userId]
  );
  return result.rows[0] || null;
}

const ROLE = Object.freeze({
  parent: 'parent',
  therapist: 'therapist',
  clinic_admin: 'clinic_admin',
  admin: 'admin',
});

const SORT_OPTIONS = {
  created_at_desc: 'created_at DESC',
  created_at_asc: 'created_at ASC',
  name_asc: 'name ASC',
  name_desc: 'name DESC',
  email_asc: 'email ASC',
  email_desc: 'email DESC',
};

/**
 * List users by role with pagination, server-side search, and sorting.
 * Uses v_parents, v_therapists, v_clinic_admins, v_admins.
 * @param {string} role
 * @param {{ limit?: number, offset?: number, q?: string, sort?: string }} options
 * @returns {{ rows: Array<{id, email, name, created_at, updated_at}>, total: number }}
 */
async function listByRole(role, options = {}) {
  const viewMap = {
    [ROLE.parent]: 'v_parents',
    [ROLE.therapist]: 'v_therapists',
    [ROLE.clinic_admin]: 'v_clinic_admins',
    [ROLE.admin]: 'v_admins',
  };
  const view = viewMap[role];
  if (!view) {
    throw new Error(`Invalid role: ${role}. Use parent, therapist, clinic_admin, or admin.`);
  }
  const limit = Math.min(Math.max(1, parseInt(options.limit, 10) || 50), 100);
  const offset = Math.max(0, parseInt(options.offset, 10) || 0);
  const q = options.q && String(options.q).trim();
  const sortKey = options.sort && SORT_OPTIONS[options.sort] ? options.sort : 'created_at_desc';
  const orderBy = SORT_OPTIONS[sortKey];

  const includeDeactivated = options.includeDeactivated === true;
  const activeClause = includeDeactivated ? '' : ' AND (deactivated_at IS NULL)';
  const whereClause = q ? `AND (name ILIKE $1 OR email ILIKE $1)` : '';
  const searchArg = q ? `%${q}%` : null;
  const params = searchArg ? [searchArg, limit, offset] : [limit, offset];
  const paramLimit = searchArg ? '$2' : '$1';
  const paramOffset = searchArg ? '$3' : '$2';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM ${view} WHERE 1=1 ${whereClause}${activeClause}`,
    searchArg ? [searchArg] : []
  );
  const total = countResult.rows[0]?.total ?? 0;

  const result = await query(
    `SELECT id, email, name, created_at, updated_at, deactivated_at FROM ${view}
     WHERE 1=1 ${whereClause}${activeClause}
     ORDER BY ${orderBy}
     LIMIT ${paramLimit} OFFSET ${paramOffset}`,
    params
  );
  return { rows: result.rows, total };
}

/** Count users per role (active only: deactivated_at IS NULL). Returns { parents, therapists, clinic_admins, admins }. */
async function getCountsByRole() {
  const result = await query(
    `SELECT role, COUNT(*)::int AS count FROM users
     WHERE role IN ('parent', 'therapist', 'clinic_admin', 'admin') AND (deactivated_at IS NULL)
     GROUP BY role`,
    []
  );
  const counts = { parents: 0, therapists: 0, clinic_admins: 0, admins: 0 };
  for (const row of result.rows) {
    if (row.role === 'parent') counts.parents = row.count;
    else if (row.role === 'therapist') counts.therapists = row.count;
    else if (row.role === 'clinic_admin') counts.clinic_admins = row.count;
    else if (row.role === 'admin') counts.admins = row.count;
  }
  return counts;
}

/**
 * Admin user detail: user (no password_hash) + linked clinics if clinic_admin, psychologist_id if therapist.
 */
async function getDetailForAdmin(userId) {
  const user = await findById(userId);
  if (!user) return null;
  const out = { user: { id: user.id, email: user.email, name: user.name, role: user.role, created_at: user.created_at, updated_at: user.updated_at, deactivated_at: user.deactivated_at || null } };
  if (user.role === 'clinic_admin') {
    const admins = await ClinicAdmin.findByUserId(userId);
    out.clinics = admins.map((r) => ({ id: r.clinic_id, name: r.clinic_name }));
  }
  if (user.role === 'therapist') {
    const psych = await Psychologist.findByUserId(userId);
    if (psych) out.psychologist_id = psych.id;
  }
  return out;
}

/** Soft deactivate: user cannot log in; data kept. Reversible with reactivate. */
async function deactivate(userId) {
  const result = await query(
    `UPDATE users SET deactivated_at = NOW() WHERE id = $1 AND (deactivated_at IS NULL)
     RETURNING id, email, name, role, created_at, updated_at, deactivated_at`,
    [userId]
  );
  return result.rows[0] || null;
}

/** Reactivate a deactivated user. */
async function reactivate(userId) {
  const result = await query(
    `UPDATE users SET deactivated_at = NULL WHERE id = $1 AND (deactivated_at IS NOT NULL)
     RETURNING id, email, name, role, created_at, updated_at, deactivated_at`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Hard delete user (admin only). Use for parent accounts when requested.
 * CASCADE removes their children and progress. Audit must be written by caller.
 * Only allowed for role = 'parent' to avoid removing last admin/therapist by mistake.
 */
async function deleteUser(userId) {
  const row = await findById(userId);
  if (!row) return null;
  if (row.role !== 'parent') {
    throw new Error('Hard delete is only allowed for parent accounts. Use deactivate for other roles.');
  }
  await query('DELETE FROM users WHERE id = $1', [userId]);
  return { deleted: true, id: userId };
}

module.exports = {
  toUser,
  findByEmail,
  findById,
  create,
  updateRole,
  ROLE,
  listByRole,
  getCountsByRole,
  getDetailForAdmin,
  deactivate,
  reactivate,
  deleteUser,
};
