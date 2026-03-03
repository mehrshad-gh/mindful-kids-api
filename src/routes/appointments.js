const express = require('express');
const { authenticate } = require('../middleware/auth');
const appointmentsController = require('../controllers/appointmentsController');

const router = express.Router();

router.use(authenticate);
router.post('/', appointmentsController.create);
router.get('/', appointmentsController.listMine);
router.patch('/:id', appointmentsController.cancelMine);

module.exports = router;
