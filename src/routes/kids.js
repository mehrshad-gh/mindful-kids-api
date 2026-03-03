const express = require('express');
const { query, body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const kidsController = require('../controllers/kidsController');

const router = express.Router();

router.use(authenticate);

router.get(
  '/domain-progress',
  query('child_id').isUUID().withMessage('child_id must be a valid UUID'),
  handleValidationErrors,
  kidsController.getDomainProgress
);

const toolsStartValidation = [
  body('child_id').isUUID().withMessage('child_id must be a valid UUID'),
  body('tool_type').notEmpty().withMessage('tool_type is required'),
];
const toolsCompleteValidation = [
  body('child_id').isUUID().withMessage('child_id must be a valid UUID'),
  body('tool_type').notEmpty().withMessage('tool_type is required'),
  body('stars').optional().isInt({ min: 0, max: 5 }),
  body('metadata').optional().isObject(),
];

router.post('/tools/start', toolsStartValidation, handleValidationErrors, kidsController.toolsStart);
router.post('/tools/complete', toolsCompleteValidation, handleValidationErrors, kidsController.toolsComplete);

module.exports = router;
