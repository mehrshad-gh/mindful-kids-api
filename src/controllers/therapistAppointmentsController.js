const Psychologist = require('../models/Psychologist');
const Appointment = require('../models/Appointment');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const AppointmentAuditLog = require('../models/AppointmentAuditLog');

/** GET /therapist/appointments?status= – list appointments for my psychologist profile. */
async function list(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.status(403).json({ error: 'No psychologist profile linked to your account' });
    }
    const { status } = req.query;
    const appointments = await Appointment.listByPsychologist(psychologist.id, status || undefined);
    res.json({ appointments });
  } catch (err) {
    next(err);
  }
}

/** PATCH /therapist/appointments/:id – confirm | decline | cancel. On decline/cancel, free slot if not passed. */
async function updateStatus(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.status(403).json({ error: 'No psychologist profile linked to your account' });
    }
    const { action, reason } = req.body;
    const allowed = ['confirm', 'decline', 'cancel'];
    if (!action || !allowed.includes(action)) {
      return res.status(400).json({ error: `action must be one of: ${allowed.join(', ')}` });
    }
    const cancellationReason = reason != null ? String(reason).trim() || null : null;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (appointment.psychologist_id !== psychologist.id) {
      return res.status(403).json({ error: 'Not your appointment' });
    }
    const statusMap = { confirm: 'confirmed', decline: 'declined', cancel: 'cancelled' };
    const newStatus = statusMap[action];
    const validTransitions = {
      requested: ['confirmed', 'declined', 'cancelled'],
      confirmed: ['cancelled'],
      declined: [],
      cancelled: [],
      completed: [],
    };
    if (!validTransitions[appointment.status] || !validTransitions[appointment.status].includes(newStatus)) {
      return res.status(400).json({ error: `Cannot ${action} appointment in status ${appointment.status}` });
    }
    const reasonToStore = (newStatus === 'declined' || newStatus === 'cancelled') ? cancellationReason : null;
    await Appointment.updateStatus(appointment.id, newStatus, reasonToStore);
    const auditType =
      newStatus === 'confirmed'
        ? 'appointment_confirmed'
        : newStatus === 'declined'
          ? 'appointment_declined'
          : 'appointment_cancelled';
    await AppointmentAuditLog.insert({
      appointmentId: appointment.id,
      actorUserId: req.user.id,
      actionType: auditType,
      details: { previous_status: appointment.status, reason: reasonToStore },
    });
    if (newStatus === 'declined' || newStatus === 'cancelled') {
      const slotEnd = new Date(appointment.starts_at_utc).getTime();
      if (Date.now() < slotEnd) {
        await AvailabilitySlot.updateStatus(appointment.availability_slot_id, 'open');
      }
    }
    const updated = await Appointment.findById(appointment.id);
    res.json({ appointment: updated });
  } catch (err) {
    next(err);
  }
}

/** GET /therapist/appointments/counts – e.g. { requested: N } for dashboard badge. */
async function getCounts(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.status(403).json({ error: 'No psychologist profile linked to your account' });
    }
    const requested = await Appointment.countByPsychologistStatus(psychologist.id, 'requested');
    res.json({ requested });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getCounts,
  updateStatus,
};
