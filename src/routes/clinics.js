const express = require('express');
const Clinic = require('../models/Clinic');

const router = express.Router();

/** GET /api/clinics – list active clinics (public; used by therapist onboarding to pick affiliations) */
router.get('/', async (req, res, next) => {
  try {
    const { country, search, limit } = req.query;
    const clinics = await Clinic.findAll({
      is_active: true,
      country: country || undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    res.json({ clinics });
  } catch (err) {
    next(err);
  }
});

/** GET /api/clinics/:id – get one clinic (public) */
router.get('/:id', async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    res.json({ clinic });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
