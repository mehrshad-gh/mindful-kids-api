const Child = require('../models/Child');
const EmotionLog = require('../models/EmotionLog');

async function create(req, res, next) {
  try {
    const { child_id: childId, emotion_id: emotionId } = req.body;
    if (!emotionId || typeof emotionId !== 'string' || !emotionId.trim()) {
      return res.status(400).json({ error: 'emotion_id is required' });
    }
    if (!childId) {
      return res.status(400).json({ error: 'child_id is required' });
    }
    const child = await Child.findById(childId, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    const log = await EmotionLog.create({
      childId,
      emotionId: emotionId.trim(),
    });
    res.status(201).json({ emotion_log: log });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { child_id: childId } = req.params;
    const child = await Child.findById(childId, req.user.id);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    const logs = await EmotionLog.findByChildId(childId);
    res.json({ emotion_logs: logs });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
};
