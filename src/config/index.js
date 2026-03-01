require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8080,
  baseUrl: process.env.BASE_URL || null, // e.g. https://your-api.up.railway.app (for upload URL in responses)
  /** Base URL for clinic set-password links. In production, defaults to app deep link (mindfulkids://app) so invite links open the mobile app; host "app" avoids "invalid address" on iOS. */
  clinicInviteBaseUrl:
    process.env.CLINIC_INVITE_BASE_URL ||
    process.env.BASE_URL ||
    (process.env.NODE_ENV === 'production' ? 'mindfulkids://app' : null),
  uploadDir: process.env.UPLOAD_DIR || null, // default: ./uploads
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/mindful_kids',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    expiresInAdmin: process.env.JWT_EXPIRES_IN_ADMIN || '8h',
  },
  /** Optional SMTP for sending clinic approval emails. If not set, invite link is logged and returned in API response. */
  email: {
    enabled: !!(process.env.SMTP_HOST && process.env.SMTP_FROM),
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM,
  },
};
