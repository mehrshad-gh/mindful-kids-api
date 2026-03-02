const ContentItem = require('../models/ContentItem');

/** GET /content – list published items; query: type (article|video|activity), age_range */
async function list(req, res, next) {
  try {
    const { type, age_range: ageRange } = req.query;
    const filters = {};
    if (type && ContentItem.TYPES.includes(type)) filters.type = type;
    if (ageRange) filters.age_range = ageRange;
    const items = await ContentItem.findAll(filters);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

/** GET /content/:id – get one published item */
async function getOne(req, res, next) {
  try {
    const item = await ContentItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
};
