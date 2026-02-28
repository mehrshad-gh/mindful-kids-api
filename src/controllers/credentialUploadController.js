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

// Railway volume at /data survives redeploys. Fallback for local/dev when volume isn't mounted.
const PERSISTENT_PATH = path.resolve('/data', 'uploads', UPLOAD_SUBDIR);
const localBase = config.uploadDir || path.join(process.cwd(), 'uploads');
const LOCAL_PATH = path.join(localBase, UPLOAD_SUBDIR);

/** Single source of truth: use persistent path if available, else local. Exported for serving. */
const uploadsDir = (() => {
  try {
    if (!fs.existsSync(PERSISTENT_PATH)) {
      fs.mkdirSync(PERSISTENT_PATH, { recursive: true });
    }
    return path.resolve(PERSISTENT_PATH);
  } catch {
    const dir = path.resolve(LOCAL_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
})();

function getUploadDir() {
  return uploadsDir;
}

function ensureUploadDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
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
 * Serve a previously uploaded credential document (therapist or admin).
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
  uploadsDir,
  getUploadDir: ensureUploadDir,
  ALLOWED_MIMES,
  UPLOAD_SUBDIR,
};
