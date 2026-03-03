const { query } = require('../database/connection');

const VALID_DOMAINS = ['emotional_awareness', 'self_regulation', 'problem_solving', 'social_connection', 'resilience'];

function clampStars(value) {
  if (value == null || value === '') return 0;
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.min(5, Math.max(0, Math.round(n)));
}

async function insert({ childId, activityId, domainId, stars = 0, completedAt = null }) {
  if (!VALID_DOMAINS.includes(domainId)) {
    throw new Error(`domainId must be one of: ${VALID_DOMAINS.join(', ')}`);
  }
  const completed = completedAt || new Date().toISOString();
  const starsValue = clampStars(stars);
  await query(
    `INSERT INTO kid_tool_sessions (child_id, activity_id, domain_id, stars, completed_at)
     VALUES ($1, $2, $3, $4, $5::timestamptz)`,
    [childId, activityId, domainId, starsValue, completed]
  );
}

/**
 * Most recent session for (child, activity) — used to avoid duplicate star awarding when client sends complete twice.
 */
async function findMostRecent(childId, activityId) {
  const result = await query(
    `SELECT id, completed_at FROM kid_tool_sessions
     WHERE child_id = $1 AND activity_id = $2
     ORDER BY completed_at DESC LIMIT 1`,
    [childId, activityId]
  );
  return result.rows[0] || null;
}

/**
 * Get domain progress for a child: sessions_completed, total_stars, last_practiced_at per domain_id.
 */
async function getDomainProgressByChildId(childId) {
  const result = await query(
    `SELECT domain_id,
            COUNT(*)::int AS sessions_completed,
            COALESCE(SUM(stars), 0)::int AS total_stars,
            MAX(completed_at) AS last_practiced_at
     FROM kid_tool_sessions
     WHERE child_id = $1
     GROUP BY domain_id
     ORDER BY domain_id`,
    [childId]
  );
  return result.rows;
}

module.exports = {
  insert,
  findMostRecent,
  getDomainProgressByChildId,
  VALID_DOMAINS,
};
