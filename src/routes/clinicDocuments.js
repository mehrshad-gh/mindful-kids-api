/**
 * Public route for secure clinic application document access.
 * GET /clinic-documents/:token – token is a signed JWT (verify only; no auth header).
 * Invalid or expired tokens are rejected.
 */
const express = require('express');
const clinicApplicationController = require('../controllers/clinicApplicationController');

const router = express.Router();

router.get('/:token', clinicApplicationController.serveClinicDocumentByToken);

module.exports = router;
