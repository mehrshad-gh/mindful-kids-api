const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireLegalAcceptances } = require('../middleware/requireLegalAcceptances');
const adminTherapistController = require('../controllers/adminTherapistController');
const adminReportsController = require('../controllers/adminReportsController');
const adminSafetyController = require('../controllers/adminSafetyController');
const adminDashboardController = require('../controllers/adminDashboardController');
const adminContentController = require('../controllers/adminContentController');
const adminUsersController = require('../controllers/adminUsersController');
const adminClinicsController = require('../controllers/adminClinicsController');
const clinicApplicationController = require('../controllers/clinicApplicationController');
const adminClinicApplicationsRoutes = require('./adminClinicApplications');
const Clinic = require('../models/Clinic');
const ClinicAdmin = require('../models/ClinicAdmin');
const User = require('../models/User');
const Psychologist = require('../models/Psychologist');
const AdminAuditLog = require('../models/AdminAuditLog');
const AvailabilitySlotAuditLog = require('../models/AvailabilitySlotAuditLog');
const { query } = require('../database/connection');
const { invalidateLegalVersionsCache } = require('../config/legalVersions');

const ALLOWED_LEGAL_DOCUMENT_TYPES = ['terms', 'privacy_policy', 'professional_disclaimer', 'provider_terms'];

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));
// Force re-acceptance when legal_documents versions change (returns 428 LEGAL_REACCEPT_REQUIRED)
router.use(requireLegalAcceptances);

// Dashboard overview (counts)
router.get('/dashboard', adminDashboardController.getDashboard);

// Safety escalations (read-only; no raw user text)
router.get('/safety-escalations', adminSafetyController.list);

// User management by role (uses role-based views; list supports limit, offset, q, sort, include_deactivated)
router.get('/users/summary', adminUsersController.summary);
router.get('/users', adminUsersController.list);
router.post('/users/:id/deactivate', adminUsersController.deactivate);
router.post('/users/:id/reactivate', adminUsersController.reactivate);
router.delete('/users/:id', adminUsersController.deleteUser);
router.get('/users/:id', adminUsersController.getOne);

// Content (articles, videos, activities)
router.get('/content', adminContentController.list);
router.get('/content/:id', adminContentController.getOne);
router.post('/content', adminContentController.create);
router.patch('/content/:id', adminContentController.update);

// Legal document versions (admin bump without code deploy); audit in legal_document_updates
router.patch('/legal-documents/:document_type', async (req, res, next) => {
  try {
    const { document_type } = req.params;
    const { version } = req.body;
    if (!ALLOWED_LEGAL_DOCUMENT_TYPES.includes(document_type)) {
      return res.status(400).json({ error: `document_type must be one of: ${ALLOWED_LEGAL_DOCUMENT_TYPES.join(', ')}` });
    }
    if (!version || typeof version !== 'string' || !version.trim()) {
      return res.status(400).json({ error: 'Body must include version (non-empty string).' });
    }
    const newVersion = version.trim();
    const oldRow = await query(
      `SELECT current_version FROM legal_documents WHERE document_type = $1`,
      [document_type]
    );
    if (oldRow.rowCount === 0) {
      return res.status(404).json({ error: 'Legal document type not found.' });
    }
    const oldVersion = oldRow.rows[0].current_version;
    const result = await query(
      `UPDATE legal_documents SET current_version = $1, updated_at = NOW() WHERE document_type = $2 RETURNING current_version`,
      [newVersion, document_type]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Legal document type not found.' });
    }
    await query(
      `INSERT INTO legal_document_updates (document_type, old_version, new_version, updated_by)
       VALUES ($1, $2, $3, $4)`,
      [document_type, oldVersion, newVersion, req.user.id]
    );
    invalidateLegalVersionsCache();
    res.json({ document_type, new_version: result.rows[0].current_version });
  } catch (err) {
    next(err);
  }
});

// Clinic onboarding: list, get one, get document URL, approve/reject
router.use('/clinic-applications', adminClinicApplicationsRoutes);

// Therapist onboarding workflow
router.get('/therapist-applications', adminTherapistController.list);
router.get('/therapist-applications/:id', adminTherapistController.getOne);
router.patch('/therapist-applications/:id', adminTherapistController.review);

// Reports (trust & safety): list, get one, set status/action_taken (triggers psychologist verification update when needed)
router.get('/reports', adminReportsController.list);
router.get('/reports/:id', adminReportsController.getOne);
router.patch('/reports/:id', adminReportsController.update);

// Clinics (admin control center: list filtered/paginated, detail, admins, invites)
router.get('/clinics', adminClinicsController.list);
router.get('/clinics/:id', adminClinicsController.getOne);

router.post('/clinics', async (req, res, next) => {
  try {
    const { name, slug, description, location, address, country, website, logo_url } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const clinic = await Clinic.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      location,
      address,
      country,
      website,
      logoUrl: logo_url,
    });
    res.status(201).json({ clinic });
  } catch (err) {
    next(err);
  }
});

router.patch('/clinics/:id', async (req, res, next) => {
  try {
    const { verification_status, verified_by, documentation_url } = req.body;
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    const data = {};
    if (verification_status !== undefined) {
      const allowed = ['pending', 'verified', 'rejected', 'suspended'];
      if (!allowed.includes(verification_status)) {
        return res.status(400).json({ error: `verification_status must be one of: ${allowed.join(', ')}` });
      }
      data.verification_status = verification_status;
    }
    if (verified_by !== undefined) data.verified_by = verified_by;
    if (documentation_url !== undefined) data.documentation_url = documentation_url;
    const updated = await Clinic.update(req.params.id, data);
    if (data.verification_status !== undefined) {
      await AdminAuditLog.insert({
        adminUserId: req.user.id,
        actionType: 'clinic_verification_updated',
        targetType: 'clinic',
        targetId: req.params.id,
        details: { verification_status: data.verification_status },
      });
    }
    res.json({ message: 'Clinic updated.', clinic: updated });
  } catch (err) {
    next(err);
  }
});

// Clinic admins: add (by email) or remove; audit logged
router.post('/clinics/:id/admins', adminClinicsController.addClinicAdmin);
router.get('/clinics/:id/admins', async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    const admins = await ClinicAdmin.findByClinicId(req.params.id);
    res.json({ admins });
  } catch (err) {
    next(err);
  }
});
router.delete('/clinics/:id/admins/:userId', adminClinicsController.removeClinicAdmin);

// Clinic invites: rotate (new token, extend expiry) or revoke
router.post('/clinic-invites/:inviteId/rotate', adminClinicsController.rotateInvite);
router.delete('/clinic-invites/:inviteId', adminClinicsController.revokeInvite);

// Psychologist detail (admin): get one by id for therapist detail screen
router.get('/psychologists/:id', async (req, res, next) => {
  try {
    const psychologist = await Psychologist.findById(req.params.id);
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }
    res.json({ psychologist });
  } catch (err) {
    next(err);
  }
});

// Update psychologist verification (admin): is_verified (boolean) or verification_status (pending|verified|rejected|suspended|expired)
router.patch('/psychologists/:id', async (req, res, next) => {
  try {
    const { is_verified, verification_status } = req.body;
    const psychologist = await Psychologist.findById(req.params.id);
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }
    if (verification_status !== undefined) {
      const allowed = ['pending', 'verified', 'rejected', 'suspended', 'expired'];
      if (!allowed.includes(verification_status)) {
        return res.status(400).json({ error: `verification_status must be one of: ${allowed.join(', ')}` });
      }
      const updated = await Psychologist.update(req.params.id, { verification_status });
      return res.json({ message: 'Verification status updated.', psychologist: updated });
    }
    if (typeof is_verified === 'boolean') {
      const updated = await Psychologist.update(req.params.id, { is_verified });
      return res.json({
        message: is_verified ? 'Verified badge assigned.' : 'Verified badge removed.',
        psychologist: updated,
      });
    }
    return res.status(400).json({ error: 'Body must include is_verified (boolean) or verification_status' });
  } catch (err) {
    next(err);
  }
});

/** PATCH /admin/psychologists/:id/status – set status (active | suspended | rejected). Logged in admin_audit_log. */
const STATUS_PSYCHOLOGIST = { active: 'verified', suspended: 'suspended', rejected: 'rejected' };
router.patch('/psychologists/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !STATUS_PSYCHOLOGIST[status]) {
      return res.status(400).json({ error: 'status must be one of: active, suspended, rejected' });
    }
    const psychologist = await Psychologist.findById(req.params.id);
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }
    const verification_status = STATUS_PSYCHOLOGIST[status];
    const updated = await Psychologist.update(req.params.id, {
      verification_status,
      is_active: status === 'active',
    });
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'psychologist_status_updated',
      targetType: 'psychologist',
      targetId: req.params.id,
      details: { status, verification_status },
    });
    res.json({ message: 'Status updated.', psychologist: updated });
  } catch (err) {
    next(err);
  }
});

/** PATCH /admin/clinics/:id/status – set status (active | suspended | rejected). Logged in admin_audit_log. */
const STATUS_CLINIC = { active: 'verified', suspended: 'suspended', rejected: 'rejected' };
router.patch('/clinics/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !STATUS_CLINIC[status]) {
      return res.status(400).json({ error: 'status must be one of: active, suspended, rejected' });
    }
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    const verification_status = STATUS_CLINIC[status];
    const updated = await Clinic.update(req.params.id, {
      verification_status,
      is_active: status === 'active',
    });
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'clinic_status_updated',
      targetType: 'clinic',
      targetId: req.params.id,
      details: { status, verification_status },
    });
    res.json({ message: 'Status updated.', clinic: updated });
  } catch (err) {
    next(err);
  }
});

/** GET /admin/availability-slot-audit – list slot create/delete audit entries (who created/deleted). Query: slot_id? (UUID), limit? */
router.get('/availability-slot-audit', async (req, res, next) => {
  try {
    const slotIdRaw = req.query.slot_id || null;
    if (slotIdRaw !== null && slotIdRaw !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(slotIdRaw)) {
        return res.status(400).json({ error: 'slot_id must be a valid UUID' });
      }
    }
    const slotId = slotIdRaw || null;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const entries = await AvailabilitySlotAuditLog.listForAdmin({ slotId, limit });
    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
