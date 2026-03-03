const { query } = require('../database/connection');

/**
 * Get today's tip: rotate by day of year so the same tip is shown all day.
 * Fallback: latest active tip if no tips or rotation yields none.
 */
async function getTodayTip() {
  const tipsResult = await query(
    `SELECT id, title, content, psychology_basis, domain_id, created_at
     FROM daily_tips
     WHERE is_active = true
     ORDER BY id ASC`
  );
  const tips = tipsResult.rows;
  if (tips.length === 0) return null;

  // Day of year (1–366) so rotation is stable for the whole day
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % tips.length;
  const tip = tips[index];

  return {
    id: tip.id,
    title: tip.title,
    content: tip.content,
    psychology_basis: tip.psychology_basis,
    domain_id: tip.domain_id ?? null,
  };
}

module.exports = {
  getTodayTip,
};
