/**
 * Safety escalation audit: insert-only. Do NOT store raw user text.
 * list() for admin viewer: metadata only, join users for email/name.
 */
const { query } = require('../database/connection');

const MAX_LIMIT = 100;

/**
 * @param {{ userId: string, route: string, field: string, matches: string[] }}
 */
async function insert({ userId, route, field, matches }) {
  await query(
    `INSERT INTO safety_escalations (user_id, route, field, matches)
     VALUES ($1, $2, $3, $4)`,
    [userId, route, field, matches]
  );
}

/**
 * List escalations for admin viewer. Joins users for email + name. No raw user text.
 * @param {{ limit?: number, offset?: number, userId?: string, from?: string, to?: string }}
 * @returns {{ rows: Array<{ id, user_id, user_email, user_name, route, field, matches, created_at }>, total: number }}
 */
async function list({ limit = 50, offset = 0, userId, from, to } = {}) {
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), MAX_LIMIT);
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);
  const conditions = [];
  const params = [];
  let idx = 1;
  if (userId) {
    conditions.push(`s.user_id = $${idx}`);
    params.push(userId);
    idx += 1;
  }
  if (from) {
    conditions.push(`s.created_at >= $${idx}`);
    params.push(from);
    idx += 1;
  }
  if (to) {
    conditions.push(`s.created_at <= $${idx}`);
    params.push(to);
    idx += 1;
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM safety_escalations s ${whereClause}`,
    params
  );
  const total = countResult.rows[0]?.total ?? 0;
  params.push(safeLimit, safeOffset);
  const listResult = await query(
    `SELECT s.id, s.user_id, u.email AS user_email, u.name AS user_name,
            s.route, s.field, s.matches, s.created_at
     FROM safety_escalations s
     LEFT JOIN users u ON u.id = s.user_id
     ${whereClause}
     ORDER BY s.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  );
  const rows = listResult.rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    user_email: r.user_email ?? null,
    user_name: r.user_name ?? null,
    route: r.route,
    field: r.field,
    matches: r.matches ?? [],
    created_at: r.created_at,
  }));
  return { rows, total };
}

module.exports = {
  insert,
  list,
};
