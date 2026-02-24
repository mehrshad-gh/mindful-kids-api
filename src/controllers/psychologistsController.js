const Psychologist = require('../models/Psychologist');
const ProfessionalCredential = require('../models/ProfessionalCredential');
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
    const ids = psychologists.map((p) => p.id);
    const [countryMap, ...ratingResults] = await Promise.all([
      ProfessionalCredential.getVerifiedCountryByPsychologistIds(ids),
      ...psychologists.map((p) => Psychologist.getAverageRating(p.id)),
    ]);
    let withRatings = psychologists.map((p, i) => ({
      ...p,
      verified_country: countryMap[p.id] || null,
      avg_rating: parseFloat(ratingResults[i].avg_rating),
      review_count: ratingResults[i].review_count,
    }));
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
    const [credentials, { avg_rating, review_count }, reviews, clinics] = await Promise.all([
      ProfessionalCredential.findByPsychologistId(psychologist.id),
      Psychologist.getAverageRating(psychologist.id),
      Review.findByPsychologistId(psychologist.id, { limit: 20 }),
      TherapistClinic.findByPsychologistId(psychologist.id),
    ]);
    const verified_country = credentials.length && credentials[0].issuing_country ? credentials[0].issuing_country : null;
    res.json({
      psychologist: {
        ...psychologist,
        verified_country,
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
