const express = require('express');
const Clinic = require('../models/Clinic');
const TherapistClinic = require('../models/TherapistClinic');
const Psychologist = require('../models/Psychologist');

const router = express.Router();

/** GET /api/clinics – list clinics (public directory: verified only). Returns verification_status, verified_at, country. */
router.get('/', async (req, res, next) => {
  try {
    const { country, search, limit } = req.query;
    const clinics = await Clinic.findAll({
      is_active: true,
      verification_status: 'verified',
      country: country || undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    res.json({ clinics });
  } catch (err) {
    next(err);
  }
});

/** GET /api/clinics/:id – get one clinic with therapists list (public: verified only) */
router.get('/:id', async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic || clinic.verification_status !== 'verified') {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    const therapistRows = await TherapistClinic.findByClinicId(req.params.id);
    const therapists = await Promise.all(
      therapistRows.map(async (t) => {
        const { avg_rating, review_count } = await Psychologist.getAverageRating(t.id);
        return {
          id: t.id,
          name: t.name,
          specialty: t.specialty,
          specialization: t.specialization,
          bio: t.bio,
          location: t.location,
          profile_image: t.profile_image || t.avatar_url,
          is_verified: t.is_verified,
          role_label: t.role_label,
          is_primary: t.is_primary,
          avg_rating: parseFloat(avg_rating),
          review_count,
        };
      })
    );
    res.json({ clinic, therapists });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
