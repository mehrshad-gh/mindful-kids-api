const { query } = require('../database/connection');

function toUser(row) {
  if (!row) return null;
  const { password_hash, ...user } = row;
  return user;
}

async function findByEmail(email) {
  const result = await query(
    'SELECT id, email, password_hash, name, role, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
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

module.exports = {
  toUser,
  findByEmail,
  findById,
  create,
  updateRole,
};
