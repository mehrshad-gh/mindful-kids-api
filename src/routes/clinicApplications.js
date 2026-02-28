const express = require('express');
const rateLimit = require('express-rate-limit');
const clinicApplicationController = require('../controllers/clinicApplicationController');

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many applications from this IP. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** POST /api/clinic-applications – public submission with document upload */
router.post(
  '/',
  submitLimiter,
  (req, res, next) => {
    clinicApplicationController.multerUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Upload failed' });
      }
      next();
    });
  },
  clinicApplicationController.submit
);

module.exports = router;
