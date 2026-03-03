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

module.exports = {
  insert,
  ACTION_TYPES,
};
