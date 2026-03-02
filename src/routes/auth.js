const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

// Limit set-password-from-invite attempts per IP to reduce brute force / token guessing
const setPasswordFromInviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['parent', 'therapist', 'clinic_admin']).withMessage('Role must be parent, therapist, or clinic_admin'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const setPasswordFromInviteValidation = [
  body('token').notEmpty().trim().withMessage('Invite token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

router.post('/register', registerValidation, handleValidationErrors, authController.register);
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.get('/me', authenticate, authController.me);
router.post(
  '/me/legal-acceptance',
  authenticate,
  [body('document_type').isIn(['terms', 'privacy_policy', 'professional_disclaimer']).withMessage('document_type must be terms, privacy_policy, or professional_disclaimer')],
  handleValidationErrors,
  authController.recordLegalAcceptance
);
router.get('/me/legal-acceptances', authenticate, authController.getLegalAcceptances);
router.post('/set-password-from-invite', setPasswordFromInviteLimiter, setPasswordFromInviteValidation, handleValidationErrors, authController.setPasswordFromInvite);

module.exports = router;
