const Psychologist = require('../models/Psychologist');
const Review = require('../models/Review');

async function list(req, res, next) {
  try {
    const { specialization, search, limit } = req.query;
    const psychologists = await Psychologist.findAll({
      specialization: specialization || undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    const withRatings = await Promise.all(
      psychologists.map(async (p) => {
        const { avg_rating, review_count } = await Psychologist.getAverageRating(p.id);
        return { ...p, avg_rating: parseFloat(avg_rating), review_count };
      })
    );
    res.json({ psychologists: withRatings });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const psychologist = await Psychologist.findById(req.params.id);
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }
    const { avg_rating, review_count } = await Psychologist.getAverageRating(psychologist.id);
    const reviews = await Review.findByPsychologistId(psychologist.id, { limit: 20 });
    res.json({
      psychologist: {
        ...psychologist,
        avg_rating: parseFloat(avg_rating),
        review_count,
      },
      reviews,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
};
