const { query } = require('../database/connection');

const ACTION_TYPES = ['slot_created', 'slot_deleted'];

async function insert({ slotId, actorUserId, actorRole, clinicId = null, actionType, details = null }) {
  if (!ACTION_TYPES.includes(actionType)) throw new Error(`actionType must be one of: ${ACTION_TYPES.join(', ')}`);
  await query(
    `INSERT INTO availability_slot_audit_log (slot_id, actor_user_id, actor_role, clinic_id, action_type, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [slotId, actorUserId || null, actorRole, clinicId || null, actionType, details ? JSON.stringify(details) : null]
  );
}

/** List audit entries for admin/debugging. By slotId or recent (limit). Returns actor email/name when available. */
async function listForAdmin({ slotId = null, limit = 100 } = {}) {
  let sql = `
    SELECT l.id, l.slot_id, l.actor_user_id, l.actor_role, l.clinic_id, l.action_type, l.details, l.created_at,
           u.email AS actor_email, u.name AS actor_name,
           c.name AS clinic_name
    FROM availability_slot_audit_log l
    LEFT JOIN users u ON u.id = l.actor_user_id
    LEFT JOIN clinics c ON c.id = l.clinic_id`;
  const params = [];
  if (slotId) {
    sql += ` WHERE l.slot_id = $1`;
    params.push(slotId);
  }
  sql += ` ORDER BY l.created_at DESC`;
  if (limit) {
    sql += ` LIMIT $${params.length + 1}`;
    params.push(limit);
  }
  const result = await query(sql, params);
  return result.rows;
}

module.exports = {
  insert,
  listForAdmin,
  ACTION_TYPES,
};
