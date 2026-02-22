const Child = require('../models/Child');
const Progress = require('../models/Progress');

async function list(req, res, next) {
  try {
    const { child_id } = req.params;
    const child = await Child.findById(child_id, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    const progress = await Progress.findByChildId(child_id);
    res.json({ progress });
  } catch (err) {
    next(err);
  }
}

async function upsert(req, res, next) {
  try {
    const { child_id, activity_id } = req.params;
    const child = await Child.findById(child_id, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    const { stars, streak_days, metadata } = req.body;
    const progress = await Progress.upsert({
      childId: child_id,
      activityId: activity_id,
      stars,
      streakDays: streak_days,
      metadata,
    });
    res.json({ progress });
  } catch (err) {
    next(err);
  }
}

async function getStreak(req, res, next) {
  try {
    const { child_id } = req.params;
    const child = await Child.findById(child_id, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    const current_streak = await Progress.getStreak(child_id);
    res.json({ child_id, current_streak });
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const { child_id } = req.params;
    const child = await Child.findById(child_id, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    const summary = await Progress.getSummary(child_id);
    res.json({ child_id, ...summary });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  upsert,
  getStreak,
  getSummary,
};
