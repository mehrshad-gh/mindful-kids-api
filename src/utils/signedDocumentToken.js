/**
 * Signed JWT tokens for secure clinic application document access.
 * Uses dedicated DOCUMENT_TOKEN_SECRET (not JWT auth secret). Payload: { clinic_application_id, file_path }.
 */
const jwt = require('jsonwebtoken');

const DEFAULT_EXPIRES_IN_SECONDS = 300; // 5 minutes

if (!process.env.DOCUMENT_TOKEN_SECRET || process.env.DOCUMENT_TOKEN_SECRET.trim() === '') {
  throw new Error('DOCUMENT_TOKEN_SECRET is required');
}

/**
 * @param {object} payload - { clinic_application_id, file_path }
 * @param {number} [expiresInSeconds] - default 300 (5 min)
 * @returns {string} JWT token
 */
function generateDocumentToken(payload, expiresInSeconds = DEFAULT_EXPIRES_IN_SECONDS) {
  return jwt.sign(
    {
      clinic_application_id: payload.clinic_application_id,
      file_path: payload.file_path,
    },
    process.env.DOCUMENT_TOKEN_SECRET,
    { expiresIn: expiresInSeconds }
  );
}

/**
 * @param {string} token - JWT from link
 * @returns {{ clinic_application_id: string, file_path: string }} decoded payload
 * @throws if token invalid or expired (use e.name === 'TokenExpiredError' to distinguish)
 */
function verifyDocumentToken(token) {
  const decoded = jwt.verify(token, process.env.DOCUMENT_TOKEN_SECRET);
  if (!decoded.clinic_application_id || decoded.file_path == null) {
    throw new Error('Invalid token payload');
  }
  return {
    clinic_application_id: decoded.clinic_application_id,
    file_path: decoded.file_path,
  };
}

module.exports = {
  generateDocumentToken,
  verifyDocumentToken,
};
