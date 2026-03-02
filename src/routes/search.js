const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();

/** Public discovery – no auth required. Only public fields returned. */
router.get('/therapists', searchController.searchTherapists);
router.get('/clinics', searchController.searchClinics);

module.exports = router;
