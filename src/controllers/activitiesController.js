const Activity = require('../models/Activity');

async function list(req, res, next) {
  try {
    const { active, activity_type, age_group } = req.query;
    const activities = await Activity.findAll({
      active: active !== undefined ? active === 'true' : true,
      activityType: activity_type,
      ageGroup: age_group,
    });
    res.json({ activities });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json({ activity });
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const activity = await Activity.findBySlug(req.params.slug);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json({ activity });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  getBySlug,
};
