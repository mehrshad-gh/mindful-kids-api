/**
 * Admin user management – list (with pagination, search, sort), summary, user detail,
 * deactivate, reactivate, hard delete (parent only).
 * GET /admin/users?role=...&limit=&offset=&q=&sort=&include_deactivated=
 * GET /admin/users/summary
 * GET /admin/users/:id
 * POST /admin/users/:id/deactivate
 * POST /admin/users/:id/reactivate
 * DELETE /admin/users/:id  (parent only; CASCADE removes children + progress)
 */

const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');

const VALID_ROLES = ['parent', 'therapist', 'clinic_admin', 'admin'];
const VALID_SORT = ['created_at_desc', 'created_at_asc', 'name_asc', 'name_desc', 'email_asc', 'email_desc'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

async function list(req, res, next) {
  try {
    const role = req.query.role;
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: 'Query param role is required and must be one of: parent, therapist, clinic_admin, admin',
      });
    }
    const limit = req.query.limit;
    const offset = req.query.offset;
    const q = req.query.q;
    const sort = req.query.sort && VALID_SORT.includes(req.query.sort) ? req.query.sort : undefined;
    const includeDeactivated = req.query.include_deactivated === 'true' || req.query.include_deactivated === '1';
    const { rows, total } = await User.listByRole(role, { limit, offset, q, sort, includeDeactivated });
    res.json({ users: rows, total });
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const counts = await User.getCountsByRole();
    res.json(counts);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const detail = await User.getDetailForAdmin(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.deactivated_at) {
      return res.status(400).json({ error: 'User is already deactivated' });
    }
    const updated = await User.deactivate(req.params.id);
    if (!updated) {
      return res.status(400).json({ error: 'User could not be deactivated' });
    }
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'user_deactivated',
      targetType: 'user',
      targetId: req.params.id,
      details: { email: user.email, role: user.role },
    });
    res.json({ message: 'User deactivated. They can no longer sign in.', user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role, deactivated_at: updated.deactivated_at } });
  } catch (err) {
    next(err);
  }
}

async function reactivate(req, res, next) {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.deactivated_at) {
      return res.status(400).json({ error: 'User is not deactivated' });
    }
    const updated = await User.reactivate(req.params.id);
    if (!updated) {
      return res.status(400).json({ error: 'User could not be reactivated' });
    }
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'user_reactivated',
      targetType: 'user',
      targetId: req.params.id,
      details: { email: user.email, role: user.role },
    });
    res.json({ message: 'User reactivated. They can sign in again.', user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role } });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const result = await User.deleteUser(req.params.id).catch((err) => {
      if (err.message && err.message.includes('only allowed for parent')) {
        return null;
      }
      throw err;
    });
    if (!result) {
      return res.status(400).json({
        error: 'Hard delete is only allowed for parent accounts. Use deactivate for other roles.',
      });
    }
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'user_deleted',
      targetType: 'user',
      targetId: req.params.id,
      details: { email: user.email, role: user.role },
    });
    res.json({ message: 'User and their data (children, progress) have been permanently deleted.', deleted_id: req.params.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, summary, getOne, deactivate, reactivate, deleteUser };
