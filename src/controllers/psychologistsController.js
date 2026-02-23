const Psychologist = require('../models/Psychologist');
const Review = require('../models/Review');
const TherapistClinic = require('../models/TherapistClinic');

async function list(req, res, next) {
  try {
    const { specialization, specialty, search, location, min_rating, limit } = req.query;
    const psychologists = await Psychologist.findAll({
      specialization: specialization || undefined,
      specialty: specialty || undefined,
      search: search || undefined,
      location: location || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    let withRatings = await Promise.all(
      psychologists.map(async (p) => {
        const { avg_rating, review_count } = await Psychologist.getAverageRating(p.id);
        return { ...p, avg_rating: parseFloat(avg_rating), review_count };
      })
    );
    const minRating = min_rating != null && min_rating !== '' ? parseFloat(min_rating) : NaN;
    if (!Number.isNaN(minRating)) {
      withRatings = withRatings.filter((p) => (p.avg_rating ?? p.rating ?? 0) >= minRating);
    }
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
    const [{ avg_rating, review_count }, reviews, clinics] = await Promise.all([
      Psychologist.getAverageRating(psychologist.id),
      Review.findByPsychologistId(psychologist.id, { limit: 20 }),
      TherapistClinic.findByPsychologistId(psychologist.id),
    ]);
    res.json({
      psychologist: {
        ...psychologist,
        avg_rating: parseFloat(avg_rating),
        review_count,
        clinics,
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
