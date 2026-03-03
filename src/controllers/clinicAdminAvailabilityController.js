const AvailabilitySlot = require('../models/AvailabilitySlot');
const AvailabilitySlotAuditLog = require('../models/AvailabilitySlotAuditLog');
const ClinicAdmin = require('../models/ClinicAdmin');
const TherapistClinic = require('../models/TherapistClinic');
const Psychologist = require('../models/Psychologist');

const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 120;

/** Helper: get clinic IDs for current clinic_admin user. */
async function getClinicIdsForAdmin(userId) {
  return ClinicAdmin.getManagedClinicIds(userId);
}

/** Helper: ensure clinic_admin has access to psychologist (active affiliation). Returns { hasAccess, clinicId } or 403. */
async function requireClinicAccessToPsychologist(req, res, psychologistId) {
  const clinicIds = await getClinicIdsForAdmin(req.user.id);
  const access = await TherapistClinic.getClinicAccessToPsychologist(clinicIds, psychologistId);
  if (!access.hasAccess) {
    res.status(403).json({ error: 'You do not have access to this psychologist; they must be actively affiliated with one of your clinics.' });
    return null;
  }
  return access.clinicId;
}

/** POST /clinic-admin/psychologists/:id/availability – create slot for affiliated psychologist. */
async function createSlot(req, res, next) {
  try {
    const psychologistId = req.params.id;
    const psychologist = await Psychologist.findById(psychologistId);
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }
    const clinicId = await requireClinicAccessToPsychologist(req, res, psychologistId);
    if (clinicId == null) return;

    const { starts_at_utc, ends_at_utc } = req.body;
    if (!starts_at_utc || !ends_at_utc) {
      return res.status(400).json({ error: 'starts_at_utc and ends_at_utc are required' });
    }
    const start = new Date(starts_at_utc);
    const end = new Date(ends_at_utc);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ error: 'Invalid or reversed time range' });
    }
    const durationMinutes = (end - start) / (60 * 1000);
    if (durationMinutes < MIN_DURATION_MINUTES || durationMinutes > MAX_DURATION_MINUTES) {
      return res.status(400).json({
        error: `Slot must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes`,
      });
    }
    const now = new Date();
    if (start < now) {
      return res.status(400).json({ error: 'Slot must be in the future' });
    }
    const overlapping = await AvailabilitySlot.findOverlapping(
      'psychologist',
      psychologistId,
      start.toISOString(),
      end.toISOString()
    );
    if (overlapping.length > 0) {
      return res.status(409).json({ error: 'Slot overlaps with an existing open or booked slot' });
    }
    const slot = await AvailabilitySlot.create({
      owner_type: 'psychologist',
      owner_id: psychologistId,
      starts_at_utc: start.toISOString(),
      ends_at_utc: end.toISOString(),
      created_by_user_id: req.user.id,
      created_by_role: 'clinic_admin',
      managed_by_clinic_id: clinicId,
    });
    await AvailabilitySlotAuditLog.insert({
      slotId: slot.id,
      actorUserId: req.user.id,
      actorRole: 'clinic_admin',
      clinicId,
      actionType: 'slot_created',
      details: { psychologist_id: psychologistId, starts_at_utc: slot.starts_at_utc, ends_at_utc: slot.ends_at_utc },
    });
    res.status(201).json({ slot });
  } catch (err) {
    next(err);
  }
}

/** GET /clinic-admin/psychologists/:id/availability?from=&to= – list that psychologist's slots (only if access). */
async function listSlots(req, res, next) {
  try {
    const psychologistId = req.params.id;
    const psychologist = await Psychologist.findById(psychologistId);
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }
    const clinicId = await requireClinicAccessToPsychologist(req, res, psychologistId);
    if (clinicId == null) return;

    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate <= fromDate) {
      return res.status(400).json({ error: 'Valid from and to query params required' });
    }
    const slots = await AvailabilitySlot.listByOwner(
      'psychologist',
      psychologistId,
      fromDate.toISOString(),
      toDate.toISOString()
    );
    res.json({ slots });
  } catch (err) {
    next(err);
  }
}

/** DELETE /clinic-admin/availability/:slotId – delete slot (open + future only; optional expectedVersion). */
async function deleteSlot(req, res, next) {
  try {
    const slotId = req.params.slotId;
    const expectedVersion = req.query.expectedVersion != null ? parseInt(req.query.expectedVersion, 10) : null;
    const slot = await AvailabilitySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    if (slot.owner_type !== 'psychologist') {
      return res.status(400).json({ error: 'Slot is not a psychologist slot' });
    }
    if (slot.status !== 'open') {
      return res.status(400).json({ error: 'Can only delete open slots' });
    }
    if (new Date(slot.starts_at_utc) <= new Date()) {
      return res.status(400).json({ error: 'Can only delete future slots' });
    }
    const clinicId = await requireClinicAccessToPsychologist(req, res, slot.owner_id);
    if (clinicId == null) return;

    const deleted = await AvailabilitySlot.remove(slotId, expectedVersion);
    if (expectedVersion != null && !deleted) {
      return res.status(409).json({ error: 'Slot was modified; please refresh and try again' });
    }
    await AvailabilitySlotAuditLog.insert({
      slotId,
      actorUserId: req.user.id,
      actorRole: 'clinic_admin',
      clinicId,
      actionType: 'slot_deleted',
      details: { reason: req.body?.reason || null, owner_id: slot.owner_id },
    });
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSlot,
  listSlots,
  deleteSlot,
};
