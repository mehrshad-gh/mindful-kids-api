const express = require('express');
const { authenticate } = require('../middleware/auth');
const parentStreakController = require('../controllers/parentStreakController');

const router = express.Router();

router.use(authenticate);

router.get('/streak', parentStreakController.getStreak);

module.exports = router;
