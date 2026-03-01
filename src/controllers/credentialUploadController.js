/**
 * Therapist credential document upload + serve.
 *
 * STORAGE VERIFICATION: Same as clinic-applications — uploads go to
 * RAILWAY_VOLUME_MOUNT_PATH/uploads/credentials when volume is mounted. Document serve is admin-only
 * (GET /therapist/credential-document/:filename uses requireRole('admin')). No signed URL; admin
 * requests the file directly (auth required).
 */
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const config = require('../config');

const UPLOAD_SUBDIR = 'credentials';
const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

// Railway volume: use RAILWAY_VOLUME_MOUNT_PATH if set (e.g. /data), else /data. Fallback to local when volume not mounted.
const VOLUME_ROOT = process.env.RAILWAY_VOLUME_MOUNT_PATH || '/data';
const PERSISTENT_PATH = path.join(VOLUME_ROOT, 'uploads', UPLOAD_SUBDIR);
const localBase = config.uploadDir || path.join(process.cwd(), 'uploads');
const LOCAL_PATH = path.join(localBase, UPLOAD_SUBDIR);

let _uploadsDir = null;

/** Resolve upload dir once on first use (so volume is mounted at runtime). Use persistent path only if volume root exists. */
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
      // e.g. read-only volume
    }
  }
  const dir = path.resolve(LOCAL_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  _uploadsDir = dir;
  return _uploadsDir;
}

function getUploadDir() {
  return resolveUploadsDir();
}

function ensureUploadDir() {
  const dir = resolveUploadsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}


const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, ensureUploadDir());
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || '.bin';
    const name = `${require('crypto').randomUUID()}${ext}`;
    cb(null, name);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Use: PDF, JPEG, PNG, or WebP.`));
    }
  },
}).single('document');

/**
 * POST /api/therapist/credential-document
 * Multer puts file in req.file. Respond with { url } for use as document_url.
 */
function upload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Send a single file in field "document".' });
  }
  const filename = req.file.filename;
  // Prefer BASE_URL (e.g. https://your-api.up.railway.app). Else use request (respect x-forwarded-proto for HTTPS).
  const baseUrl = config.baseUrl || `${req.get('x-forwarded-proto') || req.protocol}://${req.get('x-forwarded-host') || req.get('host')}`;
  const url = `${baseUrl}/api/therapist/credential-document/${filename}`;
  res.status(201).json({ url });
}

/**
 * GET /api/therapist/credential-document/:filename
 * Serve a previously uploaded credential document (admin only, for application verification).
 * Uses same uploadsDir as multer so files on the volume are found.
 */
function serve(req, res, next) {
  const { filename } = req.params;
  const safeName = path.basename(filename);
  if (!safeName || filename.includes('..') || filename !== safeName) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const resolvedDir = path.resolve(getUploadDir());
  const filepath = path.join(resolvedDir, safeName);
  if (!filepath.startsWith(resolvedDir)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  if (!fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(safeName, { root: resolvedDir }, (err) => {
    if (err) next(err);
  });
}

module.exports = {
  upload,
  serve,
  multerUpload,
  get uploadsDir() {
    return resolveUploadsDir();
  },
  getUploadDir: ensureUploadDir,
  ALLOWED_MIMES,
  UPLOAD_SUBDIR,
};
