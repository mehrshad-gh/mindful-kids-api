const AvailabilitySlot = require('../models/AvailabilitySlot');
const AvailabilitySlotAuditLog = require('../models/AvailabilitySlotAuditLog');
const Psychologist = require('../models/Psychologist');

const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 120;

/** POST /therapist/availability – create slot (auth therapist). Validate 15–120 min, future, no overlap. */
async function createSlot(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.status(403).json({ error: 'No psychologist profile linked to your account' });
    }
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
      psychologist.id,
      start.toISOString(),
      end.toISOString()
    );
    if (overlapping.length > 0) {
      return res.status(409).json({ error: 'Slot overlaps with an existing open or booked slot' });
    }
    const slot = await AvailabilitySlot.create({
      owner_type: 'psychologist',
      owner_id: psychologist.id,
      starts_at_utc: start.toISOString(),
      ends_at_utc: end.toISOString(),
      created_by_user_id: req.user.id,
      created_by_role: 'therapist',
      managed_by_clinic_id: null,
    });
    await AvailabilitySlotAuditLog.insert({
      slotId: slot.id,
      actorUserId: req.user.id,
      actorRole: 'therapist',
      clinicId: null,
      actionType: 'slot_created',
      details: { starts_at_utc: slot.starts_at_utc, ends_at_utc: slot.ends_at_utc },
    });
    res.status(201).json({ slot });
  } catch (err) {
    next(err);
  }
}

/** GET /therapist/availability?from=&to= – list my slots in range. */
async function listMySlots(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.status(403).json({ error: 'No psychologist profile linked to your account' });
    }
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate <= fromDate) {
      return res.status(400).json({ error: 'Valid from and to query params required' });
    }
    const slots = await AvailabilitySlot.listByOwner(
      'psychologist',
      psychologist.id,
      fromDate.toISOString(),
      toDate.toISOString()
    );
    res.json({ slots });
  } catch (err) {
    next(err);
  }
}

/** DELETE /therapist/availability/:id – only if status is open and future. Optional expectedVersion for 409 on conflict. */
async function deleteSlot(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.status(403).json({ error: 'No psychologist profile linked to your account' });
    }
    const slot = await AvailabilitySlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    if (slot.owner_type !== 'psychologist' || slot.owner_id !== psychologist.id) {
      return res.status(403).json({ error: 'You can only delete your own slots' });
    }
    if (slot.status !== 'open') {
      return res.status(400).json({ error: 'Can only delete open slots' });
    }
    if (new Date(slot.starts_at_utc) <= new Date()) {
      return res.status(400).json({ error: 'Can only delete future slots' });
    }
    const expectedVersion = req.query.expectedVersion != null ? parseInt(req.query.expectedVersion, 10) : null;
    const deleted = await AvailabilitySlot.remove(req.params.id, expectedVersion);
    if (expectedVersion != null && !deleted) {
      return res.status(409).json({ error: 'Slot was modified; please refresh and try again' });
    }
    await AvailabilitySlotAuditLog.insert({
      slotId: req.params.id,
      actorUserId: req.user.id,
      actorRole: 'therapist',
      clinicId: null,
      actionType: 'slot_deleted',
      details: { owner_id: slot.owner_id },
    });
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSlot,
  listMySlots,
  deleteSlot,
};
