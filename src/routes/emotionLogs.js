const express = require('express');
const { body } = require('express-validator');
const emotionLogsController = require('../controllers/emotionLogsController');
const { authenticate } = require('../middleware/auth');
const { requireLegalAcceptances } = require('../middleware/requireLegalAcceptances');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
// Force re-acceptance when CURRENT_LEGAL versions change (returns 428 LEGAL_REACCEPT_REQUIRED)
router.use(requireLegalAcceptances);

const createValidation = [
  body('emotion_id').trim().notEmpty().withMessage('emotion_id is required'),
  body('child_id').isUUID().withMessage('child_id must be a valid UUID'),
];

router.post('/', createValidation, handleValidationErrors, emotionLogsController.create);
router.get('/children/:child_id', emotionLogsController.list);

module.exports = router;
