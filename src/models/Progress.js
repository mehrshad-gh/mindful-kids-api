const { query } = require('../database/connection');

async function findByChildId(childId) {
  const result = await query(
    `SELECT p.id, p.child_id, p.activity_id, p.stars, p.completed_at, p.streak_days, p.metadata, p.created_at,
            a.title as activity_title, a.slug as activity_slug
     FROM progress p
     JOIN activities a ON a.id = p.activity_id
     WHERE p.child_id = $1
     ORDER BY p.completed_at DESC`,
    [childId]
  );
  return result.rows;
}

async function findByChildAndActivity(childId, activityId) {
  const result = await query(
    'SELECT id, child_id, activity_id, stars, completed_at, streak_days, metadata, created_at FROM progress WHERE child_id = $1 AND activity_id = $2',
    [childId, activityId]
  );
  return result.rows[0] || null;
}

async function upsert({ childId, activityId, stars, streakDays, metadata }) {
  const result = await query(
    `INSERT INTO progress (child_id, activity_id, stars, streak_days, metadata)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (child_id, activity_id) DO UPDATE SET
       stars = EXCLUDED.stars,
       streak_days = EXCLUDED.streak_days,
       metadata = progress.metadata || EXCLUDED.metadata,
       completed_at = NOW(),
       updated_at = NOW()
     RETURNING id, child_id, activity_id, stars, completed_at, streak_days, metadata, created_at, updated_at`,
    [childId, activityId, stars ?? 0, streakDays ?? 0, metadata ? JSON.stringify(metadata) : '{}']
  );
  return result.rows[0];
}

/**
 * Current streak = consecutive calendar days (most recent first) with at least one completion.
 * Uses UTC date. Streak includes today if they completed today; else counts back from most recent day.
 */
function toDateStr(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  return val.toISOString ? val.toISOString().slice(0, 10) : '';
}

async function getStreak(childId) {
  const result = await query(
    `SELECT DISTINCT DATE(completed_at AT TIME ZONE 'UTC') as day
     FROM progress WHERE child_id = $1
     ORDER BY day DESC`,
    [childId]
  );
  const days = result.rows.map((r) => toDateStr(r.day)).filter(Boolean);
  if (days.length === 0) return 0;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const mostRecentStr = days[0];
  const mostRecentDate = new Date(mostRecentStr);
  const todayDate = new Date(todayStr);
  const diffMs = todayDate.getTime() - mostRecentDate.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays > 1) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prevDate = new Date(days[i - 1]);
    const thisDate = new Date(days[i]);
    const gap = Math.round((prevDate.getTime() - thisDate.getTime()) / (24 * 60 * 60 * 1000));
    if (gap === 1) streak++;
    else break;
  }
  return streak;
}

async function getSummary(childId) {
  const listResult = await query(
    `SELECT p.id, p.child_id, p.activity_id, p.stars, p.completed_at, p.metadata,
            a.title AS activity_title, a.slug AS activity_slug
     FROM progress p
     JOIN activities a ON a.id = p.activity_id
     WHERE p.child_id = $1
     ORDER BY p.completed_at DESC`,
    [childId]
  );
  const progress = listResult.rows;
  const totalStars = progress.reduce((sum, p) => sum + (Number(p.stars) || 0), 0);
  const currentStreak = await getStreak(childId);
  return {
    total_stars: totalStars,
    current_streak: currentStreak,
    completed_count: progress.length,
    recent_completions: progress.slice(0, 10).map((p) => ({
      id: p.id,
      activity_id: p.activity_id,
      activity_title: p.activity_title,
      activity_slug: p.activity_slug,
      stars: p.stars,
      completed_at: p.completed_at,
    })),
  };
}

module.exports = {
  findByChildId,
  findByChildAndActivity,
  upsert,
  getStreak,
  getSummary,
};
