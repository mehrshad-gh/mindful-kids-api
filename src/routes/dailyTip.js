const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const dailyTipController = require('../controllers/dailyTipController');

const router = express.Router();

// GET: today's tip; optional auth to include viewed_today in response
router.get('/', optionalAuthenticate, dailyTipController.getDailyTip);

// GET: suggestions (1 activity, 1 article) matching today's tip psychology_basis
router.get('/suggestions', dailyTipController.getSuggestions);

// POST: record that the user viewed the tip today (authenticated)
router.post('/viewed', authenticate, dailyTipController.recordViewed);

module.exports = router;
