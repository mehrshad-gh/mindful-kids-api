const config = require('../config');

/**
 * Build the set-password URL for a clinic invite token.
 * Used in email body and returned in API response.
 * - Web: https://app.example.com/set-password?token=...
 * - Mobile deep link (when base is mindfulkids://): mindfulkids:///set-password?token=...
 */
function buildSetPasswordUrl(token) {
  const base = config.clinicInviteBaseUrl || `http://localhost:${config.port}`;
  const path = '/set-password';
  const separator = base.includes('?') ? '&' : '?';
  const baseNormalized = base.replace(/\/$/, '');
  return `${baseNormalized}${path}${separator}token=${encodeURIComponent(token)}`;
}

/**
 * Send "You are approved — set your password" email to the clinic contact.
 * If SMTP is not configured, logs the link and returns it for manual sending.
 * @param {string} to - contact email
 * @param {string} clinicName - clinic name
 * @param {string} setPasswordUrl - full URL to set password
 * @returns {{ sent: boolean, link?: string }} - sent true if email sent, link for manual use
 */
async function sendClinicApprovalInvite(to, clinicName, setPasswordUrl) {
  const subject = 'Your clinic has been approved – set your password';
  const text = [
    `Hello,`,
    ``,
    `Your clinic "${clinicName}" has been approved for Mindful Kids.`,
    ``,
    `Set your password to sign in and manage your clinic profile:`,
    setPasswordUrl,
    ``,
    `This link expires in 7 days. If you didn't apply, you can ignore this email.`,
    ``,
    `Mindful Kids`,
  ].join('\n');

  if (config.email.enabled) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: config.email.user && config.email.pass ? { user: config.email.user, pass: config.email.pass } : undefined,
      });
      await transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        text,
      });
      return { sent: true };
    } catch (err) {
      console.error('Clinic invite email send failed:', err.message);
      return { sent: false, link: setPasswordUrl };
    }
  }

  console.warn('[Clinic invite] SMTP not configured. Send this link to', to, ':', setPasswordUrl);
  return { sent: false, link: setPasswordUrl };
}

module.exports = {
  buildSetPasswordUrl,
  sendClinicApprovalInvite,
};
