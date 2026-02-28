const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const clinicApplicationController = require('../controllers/clinicApplicationController');

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', clinicApplicationController.list);
router.get('/:id', clinicApplicationController.getOne);
router.get('/:id/document', clinicApplicationController.getDocumentUrl);
router.patch('/:id', clinicApplicationController.review);

module.exports = router;
