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

const DEFAULT_STARS = 3;
const MIN_STARS = 0;
const MAX_STARS = 5;

function clampStars(value) {
  if (value == null || value === '') return DEFAULT_STARS;
  const n = Number(value);
  if (Number.isNaN(n)) return DEFAULT_STARS;
  return Math.min(MAX_STARS, Math.max(MIN_STARS, Math.round(n)));
}

/**
 * Upsert progress for a child+activity. Stars are assigned per completion (default 3).
 * metadata is optional and can hold activity-specific results (e.g. selectedEmotion).
 * completedAt is optional (ISO string); when omitted, server uses NOW().
 * Total stars for the child = sum of stars across all progress records (see getSummary).
 * On conflict, existing metadata is shallow-merged with the new payload.
 */
async function upsert({ childId, activityId, stars, streakDays, metadata, completedAt }) {
  const metaJson = metadata != null && typeof metadata === 'object' ? JSON.stringify(metadata) : '{}';
  const completed = completedAt || null;
  const starsValue = clampStars(stars);
  const result = await query(
    `INSERT INTO progress (child_id, activity_id, stars, streak_days, metadata, completed_at)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()))
     ON CONFLICT (child_id, activity_id) DO UPDATE SET
       stars = EXCLUDED.stars,
       streak_days = EXCLUDED.streak_days,
       metadata = progress.metadata || EXCLUDED.metadata,
       completed_at = COALESCE(EXCLUDED.completed_at, NOW()),
       updated_at = NOW()
     RETURNING id, child_id, activity_id, stars, completed_at, streak_days, metadata, created_at, updated_at`,
    [childId, activityId, starsValue, streakDays ?? 0, metaJson, completed]
  );
  await updateChildStreak(childId);
  return result.rows[0];
}

/**
 * Streak rules: increases when activity completed on consecutive (calendar) days;
 * missing a day resets streak. Uses UTC date. Backend calculates and stores per child.
 */
function toDateStr(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  return val.toISOString ? val.toISOString().slice(0, 10) : '';
}

/**
 * Compute current streak from progress: consecutive days (most recent first) with at least one completion.
 * Returns 0 if most recent completion was more than 1 day ago (missing a day resets streak).
 */
async function computeStreak(childId) {
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

/**
 * Update child's stored current_streak (called after each progress upsert).
 */
async function updateChildStreak(childId) {
  const streak = await computeStreak(childId);
  await query('UPDATE children SET current_streak = $1 WHERE id = $2', [streak, childId]);
  return streak;
}

/**
 * Return stored streak count for child (backend maintains this on each completion).
 */
async function getStreak(childId) {
  const result = await query('SELECT current_streak FROM children WHERE id = $1', [childId]);
  const row = result.rows[0];
  return row ? Math.max(0, Number(row.current_streak) || 0) : 0;
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
  const currentStreak = await getStreak(childId); // stored per child, updated on each completion

  const emotionCompletions = progress.filter((p) => p.metadata && typeof p.metadata === 'object' && p.metadata.selectedEmotion);
  const lastEmotion = emotionCompletions.length > 0
    ? { emotion: emotionCompletions[0].metadata.selectedEmotion, completed_at: emotionCompletions[0].completed_at }
    : null;

  return {
    total_stars: totalStars,
    current_streak: currentStreak,
    completed_count: progress.length,
    emotion_checkin_count: emotionCompletions.length,
    last_emotion: lastEmotion,
    recent_completions: progress.slice(0, 10).map((p) => ({
      id: p.id,
      activity_id: p.activity_id,
      activity_title: p.activity_title,
      activity_slug: p.activity_slug,
      stars: p.stars,
      completed_at: p.completed_at,
      metadata: p.metadata ?? undefined,
    })),
  };
}

module.exports = {
  findByChildId,
  findByChildAndActivity,
  upsert,
  getStreak,
  getSummary,
  computeStreak,
  updateChildStreak,
};
