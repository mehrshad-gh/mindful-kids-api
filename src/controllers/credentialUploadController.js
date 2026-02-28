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

function getUploadDir() {
  const base = config.uploadDir || path.join(process.cwd(), 'uploads');
  return path.join(base, UPLOAD_SUBDIR);
}

function ensureUploadDir() {
  const dir = getUploadDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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
 * Serve a previously uploaded credential document (therapist or admin).
 */
function serve(req, res, next) {
  const { filename } = req.params;
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const dir = getUploadDir();
  const filepath = path.join(dir, filename);
  if (!fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(filepath, (err) => {
    if (err) next(err);
  });
}

module.exports = {
  upload,
  serve,
  multerUpload,
  getUploadDir: ensureUploadDir,
  ALLOWED_MIMES,
  UPLOAD_SUBDIR,
};
