const express = require('express');
const psychologistsController = require('../controllers/psychologistsController');

const router = express.Router();

router.get('/', psychologistsController.list);
router.get('/:id', psychologistsController.getOne);

module.exports = router;
