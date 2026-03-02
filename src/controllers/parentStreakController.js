const ParentStreak = require('../models/ParentStreak');

/** GET /parent/streak – (authenticated) return current and longest streak for the parent. */
async function getStreak(req, res, next) {
  try {
    const { current_streak, longest_streak } = await ParentStreak.getByUserId(req.user.id);
    res.json({ current_streak, longest_streak });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStreak,
};
