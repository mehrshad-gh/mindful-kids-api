const express = require('express');
const { body } = require('express-validator');
const progressController = require('../controllers/progressController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

const upsertValidation = [
  body('stars').optional().isInt({ min: 0, max: 5 }),
  body('streak_days').optional().isInt({ min: 0 }),
  body('metadata').optional().isObject().withMessage('metadata must be a JSON object for activity-specific results'),
];

const postProgressValidation = [
  body('child_id').isUUID().withMessage('child_id must be a valid UUID'),
  body('activity_id').isUUID().withMessage('activity_id must be a valid UUID'),
  body('stars').optional().isInt({ min: 0, max: 5 }),
  body('metadata').optional().isObject(),
  body('completed_at').optional().isISO8601().withMessage('completed_at must be ISO 8601 date string'),
];

router.get('/children/:child_id', progressController.list);
router.get('/children/:child_id/streak', progressController.getStreak);
router.get('/children/:child_id/summary', progressController.getSummary);
router.put('/children/:child_id/activities/:activity_id', upsertValidation, handleValidationErrors, progressController.upsert);
router.post('/', postProgressValidation, handleValidationErrors, progressController.create);

module.exports = router;
