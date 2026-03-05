/**
 * Admin clinic control: list (filtered/paginated), detail (clinic + therapists + admins + invites),
 * add/remove clinic admins, rotate/revoke invites. All routes require authenticate + requireRole('admin').
 */

const Clinic = require('../models/Clinic');
const ClinicAdmin = require('../models/ClinicAdmin');
const ClinicInvite = require('../models/ClinicInvite');
const TherapistClinic = require('../models/TherapistClinic');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const { buildSetPasswordUrl } = require('../services/clinicInviteEmail');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ['verified', 'pending', 'suspended', 'rejected', 'all'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUuid(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

/** GET /admin/clinics - list with status, country, q, limit, offset. Returns clinics with therapist_count. */
async function list(req, res, next) {
  try {
    const status = req.query.status && VALID_STATUSES.includes(req.query.status) ? req.query.status : 'all';
    const country = req.query.country ? String(req.query.country).trim() : null;
    const q = req.query.q ? String(req.query.q).trim() : null;
    const limit = req.query.limit;
    const offset = req.query.offset;
    const clinics = await Clinic.findAllForAdmin({ status, country, q, limit, offset });
    const shape = clinics.map((c) => ({
      id: c.id,
      name: c.name,
      country: c.country,
      verification_status: c.verification_status,
      is_active: c.is_active,
      verified_at: c.verified_at,
      website: c.website,
      phone: c.phone,
      logo_url: c.logo_url,
      therapist_count: c.therapist_count ?? 0,
    }));
    res.json({ clinics: shape });
  } catch (err) {
    next(err);
  }
}

/** GET /admin/clinics/:id - full clinic + therapists (active) + clinic_admins + invite_status (pending invites). */
async function getOne(req, res, next) {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    const [therapists, clinic_admins, pending_invites] = await Promise.all([
      TherapistClinic.findByClinicId(req.params.id),
      ClinicAdmin.findByClinicId(req.params.id),
      ClinicInvite.findPendingByClinicId(req.params.id),
    ]);
    const therapistsShape = therapists.map((t) => ({
      id: t.id,
      name: t.name,
      specialty: t.specialty,
      verification_status: t.verification_status,
    }));
    const adminsShape = clinic_admins.map((a) => ({
      user_id: a.user_id,
      name: a.name,
      email: a.email,
      created_at: a.created_at,
    }));
    const invite_status =
      pending_invites.length > 0
        ? pending_invites.map((inv) => ({
            invite_id: inv.id,
            contact_email: inv.contact_email,
            expires_at: inv.expires_at,
          }))
        : undefined;
    res.json({
      clinic: {
        ...clinic,
        therapist_count: therapists.length,
      },
      therapists: therapistsShape,
      clinic_admins: adminsShape,
      invite_status,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /admin/clinics/:id/admins - body { email, name? }. Add existing user or create invite (7 days). Audit. */
async function addClinicAdmin(req, res, next) {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const name = req.body.name != null ? String(req.body.name).trim() : null;
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    const user = await User.findByEmail(email);
    if (user) {
      if (user.role !== 'admin' && user.role !== 'clinic_admin') {
        await User.updateRole(user.id, 'clinic_admin');
      }
      await ClinicAdmin.add(user.id, req.params.id);
      await AdminAuditLog.insert({
        adminUserId: req.user.id,
        actionType: 'clinic_admin_added',
        targetType: 'clinic',
        targetId: req.params.id,
        details: { user_id: user.id, email: user.email },
      });
      const admins = await ClinicAdmin.findByClinicId(req.params.id);
      return res.status(201).json({
        message: 'Clinic admin added.',
        added: { user_id: user.id, email: user.email, name: user.name },
        admins: admins.map((a) => ({ user_id: a.user_id, name: a.name, email: a.email, created_at: a.created_at })),
      });
    }
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = await ClinicInvite.create({
      clinicId: req.params.id,
      contactEmail: email,
      expiresAt,
    });
    const invite_link = buildSetPasswordUrl(invite.token);
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'clinic_admin_invited',
      targetType: 'clinic',
      targetId: req.params.id,
      details: { contact_email: email, invite_id: invite.id },
    });
    return res.status(201).json({
      message: 'Invite created; user does not exist yet. Share the link so they can set a password.',
      invite_link,
      invite_id: invite.id,
      contact_email: email,
      expires_at: invite.expires_at,
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /admin/clinics/:id/admins/:userId - remove from clinic_admins. Audit clinic_admin_removed. Fails if this would leave the clinic with no admins. */
async function removeClinicAdmin(req, res, next) {
  try {
    if (!isValidUuid(req.params.id) || !isValidUuid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid clinic ID or user ID' });
    }
    const count = await ClinicAdmin.countByClinicId(req.params.id);
    if (count <= 1) {
      return res.status(400).json({
        error: 'A clinic must have at least one admin. Add another admin before removing the last one.',
      });
    }
    const removed = await ClinicAdmin.remove(req.params.userId, req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'User is not an admin of this clinic' });
    }
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'clinic_admin_removed',
      targetType: 'clinic',
      targetId: req.params.id,
      details: { user_id: req.params.userId },
    });
    res.json({ message: 'Clinic admin removed' });
  } catch (err) {
    next(err);
  }
}

/** POST /admin/clinic-invites/:inviteId/rotate - new token, extend 7 days. Returns invite_link. Audit clinic_invite_rotated. */
async function rotateInvite(req, res, next) {
  try {
    if (!isValidUuid(req.params.inviteId)) {
      return res.status(400).json({ error: 'Invalid invite ID' });
    }
    const invite = await ClinicInvite.findById(req.params.inviteId);
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    const rotated = await ClinicInvite.rotate(req.params.inviteId);
    if (!rotated) {
      return res.status(500).json({ error: 'Failed to rotate invite' });
    }
    const invite_link = buildSetPasswordUrl(rotated.token);
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'clinic_invite_rotated',
      targetType: 'clinic_invite',
      targetId: req.params.inviteId,
      details: { clinic_id: invite.clinic_id },
    });
    res.json({
      message: 'Invite rotated; new link generated.',
      invite_link,
      expires_at: rotated.expires_at,
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /admin/clinic-invites/:inviteId - revoke invite. Audit clinic_invite_revoked. */
async function revokeInvite(req, res, next) {
  try {
    if (!isValidUuid(req.params.inviteId)) {
      return res.status(400).json({ error: 'Invalid invite ID' });
    }
    const invite = await ClinicInvite.findById(req.params.inviteId);
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    await ClinicInvite.removeById(req.params.inviteId);
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'clinic_invite_revoked',
      targetType: 'clinic_invite',
      targetId: req.params.inviteId,
      details: { clinic_id: invite.clinic_id, contact_email: invite.contact_email },
    });
    res.json({ message: 'Invite revoked' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  addClinicAdmin,
  removeClinicAdmin,
  rotateInvite,
  revokeInvite,
};
