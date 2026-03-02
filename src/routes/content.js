const express = require('express');
const contentController = require('../controllers/contentController');

const router = express.Router();

router.get('/', contentController.list);
router.get('/:id', contentController.getOne);

module.exports = router;
