const express = require('express');
const { body } = require('express-validator');
const emotionLogsController = require('../controllers/emotionLogsController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

const createValidation = [
  body('emotion_id').trim().notEmpty().withMessage('emotion_id is required'),
  body('child_id').isUUID().withMessage('child_id must be a valid UUID'),
];

router.post('/', createValidation, handleValidationErrors, emotionLogsController.create);
router.get('/children/:child_id', emotionLogsController.list);

module.exports = router;
