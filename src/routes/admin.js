const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const adminTherapistController = require('../controllers/adminTherapistController');
const Clinic = require('../models/Clinic');
const ClinicAdmin = require('../models/ClinicAdmin');
const User = require('../models/User');
const Psychologist = require('../models/Psychologist');

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
    const { name, slug, description, location, address, country, website, logo_url } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const clinic = await Clinic.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      location,
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

// Assign clinic_admin to a clinic (user gains access to manage that clinic)
router.post('/clinics/:id/admins', async (req, res, next) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    if (user.role !== 'admin' && user.role !== 'clinic_admin') {
      await User.updateRole(user_id, 'clinic_admin');
    }
    await ClinicAdmin.add(user_id, req.params.id);
    const admins = await ClinicAdmin.findByClinicId(req.params.id);
    res.status(201).json({ message: 'Clinic admin assigned', admins });
  } catch (err) {
    next(err);
  }
});

router.get('/clinics/:id/admins', async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    const admins = await ClinicAdmin.findByClinicId(req.params.id);
    res.json({ admins });
  } catch (err) {
    next(err);
  }
});

router.delete('/clinics/:id/admins/:userId', async (req, res, next) => {
  try {
    const removed = await ClinicAdmin.remove(req.params.userId, req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'User is not an admin of this clinic' });
    }
    res.json({ message: 'Clinic admin removed' });
  } catch (err) {
    next(err);
  }
});

// Update psychologist verification (admin): is_verified (boolean) or verification_status (pending|verified|rejected|suspended|expired)
router.patch('/psychologists/:id', async (req, res, next) => {
  try {
    const { is_verified, verification_status } = req.body;
    const psychologist = await Psychologist.findById(req.params.id);
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }
    if (verification_status !== undefined) {
      const allowed = ['pending', 'verified', 'rejected', 'suspended', 'expired'];
      if (!allowed.includes(verification_status)) {
        return res.status(400).json({ error: `verification_status must be one of: ${allowed.join(', ')}` });
      }
      const updated = await Psychologist.update(req.params.id, { verification_status });
      return res.json({ message: 'Verification status updated.', psychologist: updated });
    }
    if (typeof is_verified === 'boolean') {
      const updated = await Psychologist.update(req.params.id, { is_verified });
      return res.json({
        message: is_verified ? 'Verified badge assigned.' : 'Verified badge removed.',
        psychologist: updated,
      });
    }
    return res.status(400).json({ error: 'Body must include is_verified (boolean) or verification_status' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
