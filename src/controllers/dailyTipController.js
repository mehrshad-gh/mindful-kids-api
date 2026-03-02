const DailyTip = require('../models/DailyTip');
const DailyTipView = require('../models/DailyTipView');

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

/** POST /daily-tip/viewed – (authenticated) record that the user viewed the tip today. */
async function recordViewed(req, res, next) {
  try {
    await DailyTipView.record(req.user.id, new Date());
    res.json({ message: 'Viewed recorded' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDailyTip,
  recordViewed,
};
