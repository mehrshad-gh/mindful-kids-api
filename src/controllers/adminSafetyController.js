/**
 * Admin read-only safety escalations viewer. No raw user text is stored or returned.
 */
const SafetyEscalation = require('../models/SafetyEscalation');
const AdminAuditLog = require('../models/AdminAuditLog');

/**
 * GET /api/admin/safety-escalations
 * Query: limit (1..100), offset (>=0), user_id (UUID optional), from, to (ISO date optional)
 */
async function list(req, res, next) {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (Number.isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;

    let offset = parseInt(req.query.offset, 10);
    if (Number.isNaN(offset) || offset < 0) offset = 0;

    const userId = req.query.user_id && req.query.user_id.trim() ? req.query.user_id.trim() : undefined;
    const from = req.query.from && req.query.from.trim() ? req.query.from.trim() : undefined;
    const to = req.query.to && req.query.to.trim() ? req.query.to.trim() : undefined;

    const { rows, total } = await SafetyEscalation.list({
      limit,
      offset,
      userId,
      from,
      to,
    });

    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'admin_viewed_safety_escalations',
      targetType: 'safety_escalations',
      targetId: null,
      details: { limit, offset, user_id: userId ?? null, from: from ?? null, to: to ?? null },
    });

    res.json({ escalations: rows, total });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
};
