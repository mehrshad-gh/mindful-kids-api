const express = require('express');
const { body } = require('express-validator');
const reviewsController = require('../controllers/reviewsController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

const createValidation = [
  body('psychologist_id').isUUID().withMessage('Valid psychologist id required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('comment').optional().trim().isLength({ max: 2000 }),
];

router.post('/', authenticate, createValidation, handleValidationErrors, reviewsController.create);
router.delete('/:id', authenticate, reviewsController.remove);

module.exports = router;
