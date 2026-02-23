const express = require('express');
const { body } = require('express-validator');
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router({ mergeParams: true });

const reportProfessionalValidation = [
  body('psychologist_id').isUUID().withMessage('Valid psychologist_id required'),
  body('reason').optional().isIn(['misconduct', 'inaccurate_info', 'inappropriate_behavior', 'other']),
  body('details').optional().trim().isLength({ max: 2000 }),
];

router.use(authenticate);
router.post('/professional', reportProfessionalValidation, handleValidationErrors, reportsController.reportProfessional);

module.exports = router;
