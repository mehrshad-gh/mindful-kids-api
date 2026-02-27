const { query } = require('../database/connection');

/**
 * Append an admin action to the audit log (who approved/rejected/suspended, when).
 */
async function insert({ adminUserId, actionType, targetType, targetId, details = null }) {
  await query(
    `INSERT INTO admin_audit_log (admin_user_id, action_type, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminUserId, actionType, targetType, targetId || null, details ? JSON.stringify(details) : null]
  );
}

module.exports = {
  insert,
};
