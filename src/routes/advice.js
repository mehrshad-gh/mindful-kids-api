const express = require('express');
const adviceController = require('../controllers/adviceController');

const router = express.Router();

router.get('/daily', adviceController.getDaily);
router.get('/', adviceController.list);
router.get('/:id', adviceController.getOne);

module.exports = router;
