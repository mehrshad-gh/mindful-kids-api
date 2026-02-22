const express = require('express');
const { body } = require('express-validator');
const childrenController = require('../controllers/childrenController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

const createValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('birth_date').optional().isISO8601().withMessage('Invalid date'),
  body('age_group').optional().isIn(['3-5', '6-8', '9-12', '13+']).withMessage('Invalid age group'),
];

const updateValidation = [
  body('name').optional().trim().notEmpty(),
  body('birth_date').optional().isISO8601(),
  body('age_group').optional().isIn(['3-5', '6-8', '9-12', '13+']),
];

router.get('/', childrenController.list);
router.get('/:id', childrenController.getOne);
router.post('/', createValidation, handleValidationErrors, childrenController.create);
router.patch('/:id', updateValidation, handleValidationErrors, childrenController.update);
router.delete('/:id', childrenController.remove);

module.exports = router;
