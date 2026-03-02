const { query } = require('../database/connection');

/** Get current and longest streak for a user. Returns { current_streak, longest_streak } (defaults 0). */
async function getByUserId(userId) {
  const result = await query(
    `SELECT current_streak, longest_streak FROM parent_streaks WHERE user_id = $1`,
    [userId]
  );
  const row = result.rows[0];
  if (!row) {
    return { current_streak: 0, longest_streak: 0 };
  }
  return {
    current_streak: row.current_streak ?? 0,
    longest_streak: row.longest_streak ?? 0,
  };
}

/**
 * Update streak after user viewed the daily tip on viewedDate.
 * - If yesterday viewed → increment current_streak.
 * - If gap > 1 day or first time → reset current_streak to 1.
 * - If already viewed today (idempotent) → no change.
 * - longest_streak = max(longest_streak, current_streak).
 */
async function updateStreak(userId, viewedDate) {
  const dateStr = typeof viewedDate === 'string' ? viewedDate : viewedDate.toISOString().slice(0, 10);
  await query(
    `INSERT INTO parent_streaks (user_id, current_streak, longest_streak, last_viewed_date, updated_at)
     VALUES ($1, 1, GREATEST(1, COALESCE((SELECT longest_streak FROM parent_streaks WHERE user_id = $1), 0)), $2::date, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       current_streak = CASE
         WHEN parent_streaks.last_viewed_date = $2::date THEN parent_streaks.current_streak
         WHEN parent_streaks.last_viewed_date = $2::date - INTERVAL '1 day' THEN parent_streaks.current_streak + 1
         ELSE 1
       END,
       longest_streak = GREATEST(
         parent_streaks.longest_streak,
         CASE
           WHEN parent_streaks.last_viewed_date = $2::date THEN parent_streaks.current_streak
           WHEN parent_streaks.last_viewed_date = $2::date - INTERVAL '1 day' THEN parent_streaks.current_streak + 1
           ELSE 1
         END
       ),
       last_viewed_date = $2::date,
       updated_at = NOW()`,
    [userId, dateStr]
  );
}

module.exports = {
  getByUserId,
  updateStreak,
};
