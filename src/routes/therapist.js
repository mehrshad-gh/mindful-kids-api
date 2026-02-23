const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const therapistApplicationController = require('../controllers/therapistApplicationController');

const router = express.Router();

router.use(authenticate);
router.use(requireRole('therapist'));

const applicationUpsertValidation = [
  body('professional_name').trim().notEmpty().withMessage('Professional name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('credentials').optional().isArray().withMessage('Credentials must be an array'),
];

router.get('/application', therapistApplicationController.getMine);
router.put('/application', applicationUpsertValidation, handleValidationErrors, therapistApplicationController.upsert);
router.post('/application/submit', therapistApplicationController.submit);

module.exports = router;
