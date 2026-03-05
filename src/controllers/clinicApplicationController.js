/**
 * Clinic application submission + admin review.
 *
 * STORAGE VERIFICATION (security):
 * 1. Uploaded documents: stored under RAILWAY_VOLUME_MOUNT_PATH/uploads/clinic-applications (or /data when set).
 *    When Railway volume is mounted, files persist across deploys. Fallback: local ./uploads.
 * 2. Signed document link: GET /admin/clinic-applications/:id/document-link (authenticate + requireRole('admin') + requireLegalAcceptances)
 *    returns { url: "/clinic-documents/<token>" }. Token is a JWT with clinic_application_id and file_path; 5 min expiry.
 * 3. GET /clinic-documents/:token (public) verifies token and streams file; invalid/expired tokens rejected.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');
const { generateDocumentToken, verifyDocumentToken } = require('../utils/signedDocumentToken');
const ClinicApplication = require('../models/ClinicApplication');
const Clinic = require('../models/Clinic');
const ClinicInvite = require('../models/ClinicInvite');
const AdminAuditLog = require('../models/AdminAuditLog');
const { buildSetPasswordUrl, sendClinicApprovalInvite } = require('../services/clinicInviteEmail');

const UPLOAD_SUBDIR = 'clinic-applications';
const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const VOLUME_ROOT = process.env.RAILWAY_VOLUME_MOUNT_PATH || '/data';
const PERSISTENT_PATH = path.join(VOLUME_ROOT, 'uploads', UPLOAD_SUBDIR);
const localBase = config.uploadDir || path.join(process.cwd(), 'uploads');
const LOCAL_PATH = path.join(localBase, UPLOAD_SUBDIR);

let _uploadsDir = null;

function resolveUploadsDir() {
  if (_uploadsDir) return _uploadsDir;
  const volumeRoot = path.isAbsolute(VOLUME_ROOT) ? VOLUME_ROOT : path.resolve(process.cwd(), VOLUME_ROOT);
  if (fs.existsSync(volumeRoot) && fs.statSync(volumeRoot).isDirectory()) {
    try {
      if (!fs.existsSync(PERSISTENT_PATH)) {
        fs.mkdirSync(PERSISTENT_PATH, { recursive: true });
      }
      _uploadsDir = path.resolve(PERSISTENT_PATH);
      return _uploadsDir;
    } catch {
      // ignore
    }
  }
  const dir = path.resolve(LOCAL_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  _uploadsDir = dir;
  return _uploadsDir;
}

function ensureUploadDir() {
  const dir = resolveUploadsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getUploadDir() {
  return resolveUploadsDir();
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, ensureUploadDir());
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || '.bin';
    const name = `${crypto.randomUUID()}${ext}`;
    cb(null, name);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Use: PDF, JPEG, PNG, or WebP.'));
    }
  },
}).single('document');

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 5000);
}

function sanitizeShort(str, max = 255) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, max);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(str) {
  return typeof str === 'string' && EMAIL_REGEX.test(str.trim()) && str.trim().length <= 255;
}

/**
 * POST /api/clinic-applications (public)
 * Multipart: document (file) + clinic_name, country, contact_email, contact_phone, description.
 * Uploads document to secure storage, creates application with status pending.
 */
async function submit(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send a single file in field "document".' });
    }
    const clinic_name = sanitizeShort(req.body.clinic_name, 255);
    const country = sanitizeShort(req.body.country, 255);
    const contact_email = sanitizeShort(req.body.contact_email, 255);
    if (!clinic_name || !country || !contact_email) {
      return res.status(400).json({
        error: 'clinic_name, country, and contact_email are required.',
      });
    }
    if (!isValidEmail(contact_email)) {
      return res.status(400).json({
        error: 'contact_email must be a valid email address.',
      });
    }
    const contact_phone = sanitizeShort(req.body.contact_phone, 50) || null;
    const description = sanitize(req.body.description) || null;
    const document_storage_path = req.file.filename;

    const application = await ClinicApplication.create({
      clinic_name,
      country,
      contact_email,
      contact_phone,
      description,
      document_storage_path,
      status: 'pending',
      submitted_at: new Date(),
    });
    res.status(201).json({
      message: 'Application submitted.',
      application: {
        id: application.id,
        status: application.status,
        submitted_at: application.submitted_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/clinic-applications – list pending, approved, rejected
 */
async function list(req, res, next) {
  try {
    const { status, country, limit } = req.query;
    const applications = await ClinicApplication.findAll({
      status: status || undefined,
      country: country || undefined,
      limit: limit ? Math.min(parseInt(limit, 10) || 50, 100) : 50,
    });
    const safe = applications.map((a) => ({
      id: a.id,
      clinic_name: a.clinic_name,
      country: a.country,
      contact_email: a.contact_email,
      contact_phone: a.contact_phone,
      description: a.description,
      status: a.status,
      submitted_at: a.submitted_at,
      reviewed_at: a.reviewed_at,
      reviewed_by: a.reviewed_by,
      rejection_reason: a.rejection_reason,
      created_at: a.created_at,
    }));
    res.json({ applications: safe });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/clinic-applications/:id – full application (no document path exposed).
 * When approved: includes invite_link (if invite_token present) and account_created (user set password).
 */
async function getOne(req, res, next) {
  try {
    const application = await ClinicApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Clinic application not found' });
    }
    let invite_link = null;
    let account_created = false;
    if (application.status === 'approved' && application.invite_token) {
      invite_link = buildSetPasswordUrl(application.invite_token);
      if (application.clinic_id) {
        const User = require('../models/User');
        const ClinicAdmin = require('../models/ClinicAdmin');
        const user = await User.findByEmail(application.contact_email);
        if (user && user.role === 'clinic_admin') {
          account_created = await ClinicAdmin.isAdminOfClinic(user.id, application.clinic_id);
        }
      }
    }
    const safe = {
      id: application.id,
      clinic_name: application.clinic_name,
      country: application.country,
      contact_email: application.contact_email,
      contact_phone: application.contact_phone,
      description: application.description,
      status: application.status,
      submitted_at: application.submitted_at,
      reviewed_at: application.reviewed_at,
      reviewed_by: application.reviewed_by,
      rejection_reason: application.rejection_reason,
      created_at: application.created_at,
      updated_at: application.updated_at,
      has_document: !!application.document_storage_path,
      invite_link: invite_link || undefined,
      account_created: account_created || undefined,
    };
    res.json({ application: safe });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/clinic-applications/:id – status = approved | rejected, optional rejection_reason
 * On approve: create clinic row, set verification_status = verified, verified_at, verified_by, audit log.
 * On reject: update status, audit log.
 *
 * AUDIT TRAIL: reviewed_by (admin user id) and reviewed_at (timestamp) are set on every review.
 * These are the approval audit fields (approved_by = reviewed_by, approved_at = reviewed_at when status = approved).
 */
async function review(req, res, next) {
  try {
    const { status, rejection_reason } = req.body;
    const allowedStatus = ['approved', 'rejected'];
    if (!status || !allowedStatus.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${allowedStatus.join(', ')}`,
      });
    }
    const application = await ClinicApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Clinic application not found' });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Application has already been reviewed.' });
    }

    const adminUserId = req.user.id;
    const reviewedAt = new Date();

    if (status === 'approved') {
      const slug = application.clinic_name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      const uniqueSlug = `${slug}-${application.id.slice(0, 8)}`;
      const country = application.country
        ? String(application.country).trim().slice(0, 255) || null
        : null;

      // Use existing clinic if this is a retry after a partial approve (e.g. clinic created then request failed)
      let clinic = await Clinic.findBySlug(uniqueSlug);
      if (!clinic) {
        clinic = await Clinic.create({
          name: application.clinic_name,
          slug: uniqueSlug,
          description: application.description,
          country,
          isActive: true,
        });
      }
      await Clinic.update(clinic.id, {
        verification_status: 'verified',
        verified_by: adminUserId,
      });
      const updatedClinic = await Clinic.findById(clinic.id);

      // Create clinic invite so contact can set password and get a clinic_admin account (before updating application with token)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const invite = await ClinicInvite.create({
        clinicId: clinic.id,
        contactEmail: application.contact_email,
        expiresAt,
      });
      const token = invite.token;

      await ClinicApplication.update(req.params.id, {
        status: 'approved',
        reviewed_at: reviewedAt,
        reviewed_by: adminUserId,
        invite_token: token,
        clinic_id: clinic.id,
      });

      await AdminAuditLog.insert({
        adminUserId,
        actionType: 'clinic_application_approved',
        targetType: 'clinic_application',
        targetId: application.id,
        details: { clinic_id: clinic.id },
      });

      const setPasswordUrl = buildSetPasswordUrl(token);
      const emailResult = await sendClinicApprovalInvite(
        application.contact_email,
        application.clinic_name,
        setPasswordUrl
      );

      return res.json({
        message: 'Application approved and clinic created. Invite sent so clinic can set password and sign in.',
        application: await ClinicApplication.findById(req.params.id),
        clinic: updatedClinic,
        set_password_link: setPasswordUrl,
        invite_email_sent: emailResult.sent,
      });
    }

    const reason = typeof rejection_reason === 'string' ? rejection_reason.trim().slice(0, 2000) : null;
    await ClinicApplication.update(req.params.id, {
      status: 'rejected',
      reviewed_at: reviewedAt,
      reviewed_by: adminUserId,
      rejection_reason: reason,
    });

    await AdminAuditLog.insert({
      adminUserId,
      actionType: 'clinic_application_rejected',
      targetType: 'clinic_application',
      targetId: application.id,
      details: reason ? { rejection_reason: reason } : null,
    });

    const updated = await ClinicApplication.findById(req.params.id);
    res.json({ message: 'Application rejected.', application: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/clinic-applications/:id/document-link
 * Admin only. Returns JSON { url } where url is a path to a signed document endpoint (token in path). Token valid 5 minutes.
 */
async function getDocumentLink(req, res, next) {
  try {
    const application = await ClinicApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Clinic application not found' });
    }
    if (!application.document_storage_path) {
      return res.status(404).json({ error: 'No document for this application.' });
    }
    const token = generateDocumentToken(
      {
        clinic_application_id: application.id,
        file_path: application.document_storage_path,
      },
      300
    );
    res.json({ url: '/clinic-documents/' + token });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /clinic-documents/:token
 * Public route. Verifies token (expired → 401, invalid → 403), validates payload against DB,
 * blocks path traversal, then streams file from STORAGE_ROOT.
 */
async function serveClinicDocumentByToken(req, res, next) {
  try {
    const token = req.params.token;
    if (!token) {
      return res.status(401).json({ error: 'Token required.' });
    }
    let payload;
    try {
      payload = verifyDocumentToken(token);
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Document link expired' });
      }
      return res.status(403).json({ error: 'Invalid document token' });
    }
    // Validate token payload against database (prevents token manipulation)
    const application = await ClinicApplication.findById(payload.clinic_application_id);
    if (!application || !application.document_storage_path) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    if (application.document_storage_path !== payload.file_path) {
      return res.status(403).json({ error: 'Invalid document token' });
    }
    const file_path = payload.file_path;
    // Prevent path traversal: reject ".." or any directory escape; never allow direct filesystem paths
    if (file_path.includes('..') || file_path.includes('/') || file_path.includes('\\')) {
      return res.status(400).json({ error: 'Invalid path.' });
    }
    const STORAGE_ROOT = path.resolve(getUploadDir());
    const fullPath = path.join(STORAGE_ROOT, file_path);
    if (!fullPath.startsWith(STORAGE_ROOT) || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      return res.status(404).json({ error: 'File not found.' });
    }
    res.sendFile(file_path, { root: STORAGE_ROOT }, (err) => {
      if (err) next(err);
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submit,
  list,
  getOne,
  review,
  getDocumentLink,
  serveClinicDocumentByToken,
  multerUpload,
  getUploadDir,
  ALLOWED_MIMES,
  UPLOAD_SUBDIR,
};
