const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const config = require('../config');
const ClinicApplication = require('../models/ClinicApplication');
const Clinic = require('../models/Clinic');
const AdminAuditLog = require('../models/AdminAuditLog');

const UPLOAD_SUBDIR = 'clinic-applications';
const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const DOCUMENT_TOKEN_EXPIRY = '5m';

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
 * GET /api/admin/clinic-applications/:id – full application (no document path exposed)
 */
async function getOne(req, res, next) {
  try {
    const application = await ClinicApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Clinic application not found' });
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
      const clinic = await Clinic.create({
        name: application.clinic_name,
        slug: uniqueSlug,
        description: application.description,
        country: application.country,
        isActive: true,
      });
      await Clinic.update(clinic.id, {
        verification_status: 'verified',
        verified_by: adminUserId,
      });
      const updatedClinic = await Clinic.findById(clinic.id);

      await ClinicApplication.update(req.params.id, {
        status: 'approved',
        reviewed_at: reviewedAt,
        reviewed_by: adminUserId,
      });

      await AdminAuditLog.insert({
        adminUserId,
        actionType: 'clinic_application_approved',
        targetType: 'clinic_application',
        targetId: application.id,
        details: { clinic_id: clinic.id },
      });

      return res.json({
        message: 'Application approved and clinic created.',
        application: await ClinicApplication.findById(req.params.id),
        clinic: updatedClinic,
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
 * GET /api/admin/clinic-applications/:id/document
 * Admin only. Returns JSON { url } where url is a signed URL valid for 5 minutes. Never exposes storage path.
 */
async function getDocumentUrl(req, res, next) {
  try {
    const application = await ClinicApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Clinic application not found' });
    }
    if (!application.document_storage_path) {
      return res.status(404).json({ error: 'No document for this application.' });
    }
    const baseUrl = config.baseUrl || `${req.get('x-forwarded-proto') || req.protocol}://${req.get('x-forwarded-host') || req.get('host')}`;
    const token = jwt.sign(
      { sub: application.id },
      config.jwt.secret,
      { expiresIn: DOCUMENT_TOKEN_EXPIRY }
    );
    const url = `${baseUrl}/api/admin/clinic-applications/document?token=${token}`;
    res.json({ url, expires_in_seconds: 300 });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/clinic-applications/document?token=...
 * No auth header; token in query. Verifies JWT (5 min expiry), serves file. Never exposes storage path.
 */
async function serveDocumentByToken(req, res, next) {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ error: 'Token required.' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Link expired. Request a new document link.' });
      }
      return res.status(401).json({ error: 'Invalid token.' });
    }
    const applicationId = decoded.sub;
    const application = await ClinicApplication.findById(applicationId);
    if (!application || !application.document_storage_path) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    const filename = path.basename(application.document_storage_path);
    if (filename !== application.document_storage_path || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid path.' });
    }
    const resolvedDir = path.resolve(getUploadDir());
    const filepath = path.join(resolvedDir, filename);
    if (!filepath.startsWith(resolvedDir) || !fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) {
      return res.status(404).json({ error: 'File not found.' });
    }
    res.sendFile(filename, { root: resolvedDir }, (err) => {
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
  getDocumentUrl,
  serveDocumentByToken,
  multerUpload,
  getUploadDir,
  ALLOWED_MIMES,
  UPLOAD_SUBDIR,
};
