const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireLegalAcceptances } = require('../middleware/requireLegalAcceptances');
const parentStreakController = require('../controllers/parentStreakController');

const router = express.Router();

router.use(authenticate);
// Force re-acceptance when CURRENT_LEGAL versions change (returns 428 LEGAL_REACCEPT_REQUIRED)
router.use(requireLegalAcceptances);

router.get('/streak', parentStreakController.getStreak);

module.exports = router;
