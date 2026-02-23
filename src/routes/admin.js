const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const adminTherapistController = require('../controllers/adminTherapistController');
const Clinic = require('../models/Clinic');

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));

// Therapist onboarding workflow
router.get('/therapist-applications', adminTherapistController.list);
router.get('/therapist-applications/:id', adminTherapistController.getOne);
router.patch('/therapist-applications/:id', adminTherapistController.review);

// Clinics (admin create for therapist affiliation)
router.get('/clinics', async (req, res, next) => {
  try {
    const clinics = await Clinic.findAll({});
    res.json({ clinics });
  } catch (err) {
    next(err);
  }
});

router.post('/clinics', async (req, res, next) => {
  try {
    const { name, slug, description, address, country, website, logo_url } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const clinic = await Clinic.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      address,
      country,
      website,
      logoUrl: logo_url,
    });
    res.status(201).json({ clinic });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
