const { getClient } = require('../database/connection');
const Psychologist = require('../models/Psychologist');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const Appointment = require('../models/Appointment');
const AppointmentAuditLog = require('../models/AppointmentAuditLog');
const { detectSafetyRisk, buildSafetyResponse } = require('../utils/safetyText');
const SafetyEscalation = require('../models/SafetyEscalation');

/** POST /appointments – parent books a slot. Transaction: lock slot, ensure open, create appointment, set booked, audit. */
async function create(req, res, next) {
  const client = await getClient();
  try {
    const { therapist_id, availability_slot_id, parent_notes } = req.body;
    if (!therapist_id || !availability_slot_id) {
      return res.status(400).json({ error: 'therapist_id and availability_slot_id are required' });
    }
    // Safety guardrail: do not persist or log raw high-risk text; store minimal audit only
    const notesText = parent_notes != null ? String(parent_notes) : '';
    const safety = detectSafetyRisk(notesText);
    if (safety.flagged) {
      await SafetyEscalation.insert({
        userId: req.user.id,
        route: '/appointments',
        field: 'parent_notes',
        matches: safety.matches,
      });
      return res.status(422).json({
        ...buildSafetyResponse(),
        field: 'parent_notes',
      });
    }
    const psychologist = await Psychologist.findById(therapist_id);
    if (!psychologist) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    if (!psychologist.is_verified) {
      return res.status(403).json({ error: 'You can only book verified therapists' });
    }
    await client.query('BEGIN');
    const slotRow = await client.query(
      `SELECT id, owner_type, owner_id, starts_at_utc, ends_at_utc, status
       FROM availability_slots WHERE id = $1 FOR UPDATE`,
      [availability_slot_id]
    );
    const slot = slotRow.rows[0];
    if (!slot) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Availability slot not found' });
    }
    if (slot.status !== 'open') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This slot is no longer available' });
    }
    if (slot.owner_type !== 'psychologist' || slot.owner_id !== psychologist.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Slot does not belong to this therapist' });
    }
    const appRow = await client.query(
      `INSERT INTO appointments (
        parent_user_id, psychologist_id, clinic_id, availability_slot_id,
        starts_at_utc, ends_at_utc, status, parent_notes, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'requested', $7, NOW())
      RETURNING id, parent_user_id, psychologist_id, clinic_id, availability_slot_id,
                starts_at_utc, ends_at_utc, status, parent_notes, created_at, updated_at`,
      [
        req.user.id,
        psychologist.id,
        null,
        availability_slot_id,
        slot.starts_at_utc,
        slot.ends_at_utc,
        parent_notes || null,
      ]
    );
    const appointment = appRow.rows[0];
    await client.query(
      `UPDATE availability_slots SET status = 'booked', updated_at = NOW() WHERE id = $1`,
      [availability_slot_id]
    );
    await client.query(
      `INSERT INTO appointment_audit_log (appointment_id, actor_user_id, action_type) VALUES ($1, $2, 'appointment_requested')`,
      [appointment.id, req.user.id]
    );
    await client.query('COMMIT');
    const full = await Appointment.findById(appointment.id);
    res.status(201).json({ appointment: full || appointment });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

/** GET /appointments – parent's appointments. */
async function listMine(req, res, next) {
  try {
    const appointments = await Appointment.listByParent(req.user.id);
    res.json({ appointments });
  } catch (err) {
    next(err);
  }
}

/** PATCH /appointments/:id – parent cancels a requested appointment. */
async function cancelMine(req, res, next) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    if (action !== 'cancel') {
      return res.status(400).json({ error: 'Only action "cancel" is allowed for parents' });
    }
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (appointment.parent_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your appointment' });
    }
    if (appointment.status !== 'requested') {
      return res.status(400).json({ error: 'You can only cancel an appointment that is still pending (requested)' });
    }
    const cancellationReason = reason != null ? String(reason).trim() || null : null;
    await Appointment.updateStatus(appointment.id, 'cancelled', cancellationReason);
    await AppointmentAuditLog.insert({
      appointmentId: appointment.id,
      actorUserId: req.user.id,
      actionType: 'appointment_cancelled',
      details: { previous_status: 'requested', reason: cancellationReason },
    });
    if (Date.now() < new Date(appointment.starts_at_utc).getTime()) {
      const AvailabilitySlot = require('../models/AvailabilitySlot');
      await AvailabilitySlot.updateStatus(appointment.availability_slot_id, 'open');
    }
    const updated = await Appointment.findById(appointment.id);
    res.json({ appointment: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  listMine,
  cancelMine,
};
