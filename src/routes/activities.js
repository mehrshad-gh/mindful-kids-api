const express = require('express');
const activitiesController = require('../controllers/activitiesController');

const router = express.Router();

router.get('/', activitiesController.list);
router.get('/slug/:slug', activitiesController.getBySlug);
router.get('/:id', activitiesController.getOne);

module.exports = router;
