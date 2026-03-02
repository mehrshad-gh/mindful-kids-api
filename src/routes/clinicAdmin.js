const express = require('express');
const { authenticate, requireRole, requireClinicAccess, resolveClinicMe } = require('../middleware/auth');
const ClinicAdmin = require('../models/ClinicAdmin');
const clinicAdminController = require('../controllers/clinicAdminController');

const router = express.Router();

router.use(authenticate);
router.use(requireRole('clinic_admin'));

router.get('/clinics', clinicAdminController.listMyClinics);
// /me resolves to first managed clinic; must come before :clinicId
router.get('/clinics/me', resolveClinicMe(ClinicAdmin), requireClinicAccess(ClinicAdmin), clinicAdminController.getClinic);
router.patch('/clinics/me', resolveClinicMe(ClinicAdmin), requireClinicAccess(ClinicAdmin), clinicAdminController.updateClinic);
router.get('/clinics/:clinicId', requireClinicAccess(ClinicAdmin), clinicAdminController.getClinic);
router.patch('/clinics/:clinicId', requireClinicAccess(ClinicAdmin), clinicAdminController.updateClinic);
router.get('/clinics/:clinicId/therapists', requireClinicAccess(ClinicAdmin), clinicAdminController.listTherapists);
router.post('/clinics/:clinicId/therapists', requireClinicAccess(ClinicAdmin), clinicAdminController.addTherapist);
router.delete('/clinics/:clinicId/therapists/:psychologistId', requireClinicAccess(ClinicAdmin), clinicAdminController.removeTherapist);

module.exports = router;
