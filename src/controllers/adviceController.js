const Advice = require('../models/Advice');

async function list(req, res, next) {
  try {
    const { category, limit, daily_only } = req.query;
    const advice = await Advice.findAll({
      category: category || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      dailyOnly: daily_only === 'true',
    });
    res.json({ advice });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const item = await Advice.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Advice not found' });
    }
    res.json({ advice: item });
  } catch (err) {
    next(err);
  }
}

async function getDaily(req, res, next) {
  try {
    const advice = await Advice.getDailyAdvice();
    if (!advice) {
      return res.status(404).json({ error: 'No daily advice available' });
    }
    res.json({ advice });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  getDaily,
};
