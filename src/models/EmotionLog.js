const { query } = require('../database/connection');

async function create({ childId, emotionId }) {
  const result = await query(
    `INSERT INTO emotion_logs (child_id, emotion_id) VALUES ($1, $2)
     RETURNING id, child_id, emotion_id, recorded_at, created_at`,
    [childId, emotionId]
  );
  return result.rows[0];
}

async function findByChildId(childId, limit = 50) {
  const result = await query(
    `SELECT id, child_id, emotion_id, recorded_at, created_at
     FROM emotion_logs WHERE child_id = $1 ORDER BY recorded_at DESC LIMIT $2`,
    [childId, limit]
  );
  return result.rows;
}

module.exports = {
  create,
  findByChildId,
};
