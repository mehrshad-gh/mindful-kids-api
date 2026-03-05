const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireLegalAcceptances } = require('../middleware/requireLegalAcceptances');
const appointmentsController = require('../controllers/appointmentsController');

const router = express.Router();

router.use(authenticate);
// Force re-acceptance when CURRENT_LEGAL versions change (returns 428 LEGAL_REACCEPT_REQUIRED)
router.use(requireLegalAcceptances);
router.post('/', appointmentsController.create);
router.get('/', appointmentsController.listMine);
router.patch('/:id', appointmentsController.cancelMine);

module.exports = router;
