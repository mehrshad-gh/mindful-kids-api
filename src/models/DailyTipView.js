const { query } = require('../database/connection');

/** Record that user viewed the daily tip on the given date (idempotent: one row per user per day). */
async function record(userId, viewedDate) {
  const dateStr = typeof viewedDate === 'string' ? viewedDate : viewedDate.toISOString().slice(0, 10);
  await query(
    `INSERT INTO daily_tip_views (user_id, viewed_date) VALUES ($1, $2::date)
     ON CONFLICT (user_id, viewed_date) DO NOTHING`,
    [userId, dateStr]
  );
}

/** Check if user has already viewed the tip today. */
async function hasViewedToday(userId) {
  const result = await query(
    `SELECT 1 FROM daily_tip_views WHERE user_id = $1 AND viewed_date = CURRENT_DATE`,
    [userId]
  );
  return result.rows.length > 0;
}

module.exports = {
  record,
  hasViewedToday,
};
