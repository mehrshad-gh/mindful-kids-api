const Review = require('../models/Review');

async function create(req, res, next) {
  try {
    const { psychologist_id, rating, comment } = req.body;
    const review = await Review.create({
      userId: req.user.id,
      psychologistId: psychologist_id,
      rating,
      comment,
    });
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await Review.remove(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  remove,
};
