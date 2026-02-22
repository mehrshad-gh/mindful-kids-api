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
  body('metadata').optional().isObject(),
];

router.get('/children/:child_id', progressController.list);
router.get('/children/:child_id/streak', progressController.getStreak);
router.get('/children/:child_id/summary', progressController.getSummary);
router.put('/children/:child_id/activities/:activity_id', upsertValidation, handleValidationErrors, progressController.upsert);

module.exports = router;
