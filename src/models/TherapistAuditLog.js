const { query } = require('../database/connection');

/**
 * Log therapist actions for trust and compliance (credential_uploaded, credential_renewal_requested, therapist_viewed_reports).
 */
async function insert({ therapistUserId, actionType, targetType = null, targetId = null, details = null }) {
  await query(
    `INSERT INTO therapist_audit_log (therapist_user_id, action_type, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [therapistUserId, actionType, targetType || null, targetId || null, details ? JSON.stringify(details) : null]
  );
}

module.exports = {
  insert,
};
