const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const therapistApplicationController = require('../controllers/therapistApplicationController');
const credentialUploadController = require('../controllers/credentialUploadController');
const therapistAvailabilityController = require('../controllers/therapistAvailabilityController');
const therapistAppointmentsController = require('../controllers/therapistAppointmentsController');

const router = express.Router();

router.use(authenticate);

// Credential document: upload (therapist only); serve (admin only — for application verification)
router.post(
  '/credential-document',
  requireRole('therapist'),
  (req, res, next) => {
    credentialUploadController.multerUpload(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
      credentialUploadController.upload(req, res, next);
    });
  }
);
router.get('/credential-document/:filename', requireRole('admin'), credentialUploadController.serve);

router.use(requireRole('therapist'));

const applicationUpsertValidation = [
  body('professional_name').optional().trim().notEmpty().withMessage('Professional name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('credentials').optional().isArray().withMessage('Credentials must be an array'),
];

// Dashboard / me endpoints (must come before generic routes)
router.get('/me/profile', therapistApplicationController.getProfile);
router.get('/me/verification-status', therapistApplicationController.getVerificationStatus);
router.get('/me/credentials', therapistApplicationController.getCredentials);
router.post('/me/credentials', therapistApplicationController.postCredentials);
router.get('/me/reports', therapistApplicationController.getReports);
router.get('/me/clinic-affiliations', therapistApplicationController.getClinicAffiliations);

router.get('/profile', therapistApplicationController.getProfile);
router.get('/application', therapistApplicationController.getMine);
router.put('/application', applicationUpsertValidation, handleValidationErrors, therapistApplicationController.upsert);
router.post('/application/submit', therapistApplicationController.submit);

router.post('/availability', therapistAvailabilityController.createSlot);
router.get('/availability', therapistAvailabilityController.listMySlots);
router.delete('/availability/:id', therapistAvailabilityController.deleteSlot);

router.get('/appointments/counts', therapistAppointmentsController.getCounts);
router.get('/appointments', therapistAppointmentsController.list);
router.patch('/appointments/:id', therapistAppointmentsController.updateStatus);

module.exports = router;
