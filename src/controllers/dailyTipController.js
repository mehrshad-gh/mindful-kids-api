const DailyTip = require('../models/DailyTip');
const DailyTipView = require('../models/DailyTipView');
const ParentStreak = require('../models/ParentStreak');
const ContentItem = require('../models/ContentItem');

/** GET /daily-tip – today’s tip (rotated daily). Response: title, content, psychology_basis. Optional: viewed_today if authenticated. */
async function getDailyTip(req, res, next) {
  try {
    const tip = await DailyTip.getTodayTip();
    if (!tip) {
      return res.status(404).json({ error: 'No daily tip available' });
    }
    const payload = {
      title: tip.title,
      content: tip.content,
      psychology_basis: tip.psychology_basis ?? null,
    };
    if (req.user) {
      const viewedToday = await DailyTipView.hasViewedToday(req.user.id);
      payload.viewed_today = viewedToday;
    }
    res.json({ tip: payload });
  } catch (err) {
    next(err);
  }
}

/** POST /daily-tip/viewed – (authenticated) record that the user viewed the tip today; update streak. */
async function recordViewed(req, res, next) {
  try {
    const viewedDate = new Date();
    await DailyTipView.record(req.user.id, viewedDate);
    await ParentStreak.updateStreak(req.user.id, viewedDate);
    res.json({ message: 'Viewed recorded' });
  } catch (err) {
    next(err);
  }
}

/**
 * True if tip's psychology_basis (string) overlaps with item's psychology_basis (array).
 * Uses substring contains; fine for MVP.
 * Later: make daily_tips.psychology_basis an array (like content_items) and match by exact tokens.
 */
function psychologyOverlap(tipBasis, itemBasisArray) {
  if (!tipBasis || !Array.isArray(itemBasisArray) || itemBasisArray.length === 0) return false;
  const tipLower = tipBasis.toLowerCase();
  return itemBasisArray.some((b) => b && typeof b === 'string' && tipLower.includes(b.toLowerCase().trim()));
}

/**
 * GET /daily-tip/suggestions – 1 related activity and 1 related article by psychology_basis overlap with today's tip.
 * Picks first match in list order.
 * Later: randomize among matches; avoid repeating yesterday's suggestion per user (e.g. store last_suggested in backend).
 */
async function getSuggestions(req, res, next) {
  try {
    const tip = await DailyTip.getTodayTip();
    if (!tip) {
      return res.json({ suggested_activity: null, suggested_article: null });
    }
    const [activities, articles] = await Promise.all([
      ContentItem.findAll({ type: 'activity' }),
      ContentItem.findAll({ type: 'article' }),
    ]);
    const tipBasis = tip.psychology_basis || '';
    const suggested_activity = activities.find((a) => psychologyOverlap(tipBasis, a.psychology_basis)) || null;
    const suggested_article = articles.find((a) => psychologyOverlap(tipBasis, a.psychology_basis)) || null;
    res.json({
      suggested_activity: suggested_activity
        ? { id: suggested_activity.id, type: 'activity', title: suggested_activity.title, summary: suggested_activity.summary, age_range: suggested_activity.age_range }
        : null,
      suggested_article: suggested_article
        ? { id: suggested_article.id, type: 'article', title: suggested_article.title, summary: suggested_article.summary, age_range: suggested_article.age_range }
        : null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDailyTip,
  recordViewed,
  getSuggestions,
};
