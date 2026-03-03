const { query } = require('../database/connection');

const ACTION_TYPES = [
  'appointment_requested',
  'appointment_confirmed',
  'appointment_declined',
  'appointment_cancelled',
  'appointment_completed',
];

async function insert({ appointmentId, actorUserId, actionType, details = null }) {
  if (!ACTION_TYPES.includes(actionType)) throw new Error(`actionType must be one of: ${ACTION_TYPES.join(', ')}`);
  await query(
    `INSERT INTO appointment_audit_log (appointment_id, actor_user_id, action_type, details)
     VALUES ($1, $2, $3, $4)`,
    [appointmentId, actorUserId || null, actionType, details ? JSON.stringify(details) : null]
  );
}

module.exports = {
  insert,
  ACTION_TYPES,
};
