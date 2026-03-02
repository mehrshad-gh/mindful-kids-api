const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const LegalAcceptance = require('../models/LegalAcceptance');

function generateToken(user) {
  const expiresIn = user.role === 'admin' ? config.jwt.expiresInAdmin : config.jwt.expiresIn;
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn }
  );
}

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const role = ['therapist', 'clinic_admin'].includes(req.body.role) ? req.body.role : 'parent';
    const user = await User.create({
      email,
      passwordHash,
      name,
      role,
    });
    const expiresIn = user.role === 'admin' ? config.jwt.expiresInAdmin : config.jwt.expiresIn;
    const token = generateToken(user);
    res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const expiresIn = user.role === 'admin' ? config.jwt.expiresInAdmin : config.jwt.expiresIn;
    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, created_at: user.created_at } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/set-password-from-invite
 * Body: { token, password }
 * For clinic invites: creates user (clinic_admin), links to clinic, returns JWT.
 */
async function setPasswordFromInvite(req, res, next) {
  try {
    const { token, password } = req.body;
    const ClinicInvite = require('../models/ClinicInvite');
    const ClinicAdmin = require('../models/ClinicAdmin');

    const invite = await ClinicInvite.findByToken(token);
    if (!invite) {
      return res.status(401).json({ error: 'Invalid or expired invite link. Request a new one from the admin.' });
    }

    const existing = await User.findByEmail(invite.contact_email);
    if (existing) {
      await ClinicInvite.removeByToken(token);
      return res.status(409).json({
        error: 'An account with this email already exists. Sign in with your password.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const name = `Clinic (${invite.contact_email})`;
    const user = await User.create({
      email: invite.contact_email,
      passwordHash,
      name,
      role: 'clinic_admin',
    });

    await ClinicAdmin.add(user.id, invite.clinic_id);
    await ClinicInvite.removeByToken(token);

    const jwtToken = generateToken(user);
    const expiresIn = config.jwt.expiresIn;
    res.status(201).json({
      message: 'Password set. You can now sign in.',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: jwtToken,
      expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /auth/me/legal-acceptance – record that current user accepted a document (terms | privacy_policy | professional_disclaimer). Optional document_version (e.g. 2026-03-01); if omitted, server default is used. */
async function recordLegalAcceptance(req, res, next) {
  try {
    const { document_type: documentType, document_version: documentVersion } = req.body;
    if (!documentType || !LegalAcceptance.DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({
        error: `document_type must be one of: ${LegalAcceptance.DOCUMENT_TYPES.join(', ')}`,
      });
    }
    await LegalAcceptance.record(req.user.id, documentType, documentVersion);
    res.status(201).json({
      message: 'Acceptance recorded',
      document_type: documentType,
      document_version: documentVersion || LegalAcceptance.DEFAULT_DOCUMENT_VERSION,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /auth/me/legal-acceptances – return latest acceptance per document type (accepted_at, document_version) for current user. For future use: if current terms version > stored document_version, show "Please review and accept updated Terms" and optionally block until accepted. */
async function getLegalAcceptances(req, res, next) {
  try {
    const acceptances = await LegalAcceptance.getLatestByUserId(req.user.id);
    res.json({ acceptances });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  me,
  setPasswordFromInvite,
  recordLegalAcceptance,
  getLegalAcceptances,
};
