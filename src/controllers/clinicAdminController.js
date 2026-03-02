const ClinicAdmin = require('../models/ClinicAdmin');
const Clinic = require('../models/Clinic');
const TherapistClinic = require('../models/TherapistClinic');
const Psychologist = require('../models/Psychologist');
const AdminAuditLog = require('../models/AdminAuditLog');

/** GET /api/clinic-admin/clinics – list clinics I manage */
async function listMyClinics(req, res, next) {
  try {
    const rows = await ClinicAdmin.findByUserId(req.user.id);
    const clinics = rows.map((r) => ({
      id: r.clinic_id,
      name: r.clinic_name,
      slug: r.clinic_slug,
      created_at: r.created_at,
    }));
    res.json({ clinics });
  } catch (err) {
    next(err);
  }
}

/** GET /api/clinic-admin/clinics/:clinicId – get one clinic I manage (with therapist count) */
async function getClinic(req, res, next) {
  try {
    const clinic = await Clinic.findById(req.params.clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    const therapists = await TherapistClinic.findByClinicId(req.params.clinicId);
    res.json({ clinic, therapist_count: therapists.length });
  } catch (err) {
    next(err);
  }
}

/** GET /api/clinic-admin/clinics/:clinicId/therapists – list therapists (psychologists) in this clinic */
async function listTherapists(req, res, next) {
  try {
    const therapists = await TherapistClinic.findByClinicId(req.params.clinicId, {
      limit: req.query.limit,
    });
    const withRatings = await Promise.all(
      therapists.map(async (t) => {
        const { avg_rating, review_count } = await Psychologist.getAverageRating(t.id);
        return {
          ...t,
          profile_image: t.profile_image || t.avatar_url,
          avg_rating: parseFloat(avg_rating),
          review_count,
        };
      })
    );
    res.json({ therapists: withRatings });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/clinic-admin/clinics/:clinicId – update clinic profile (name, description, location, address, country, website, phone, logo_url) */
async function updateClinic(req, res, next) {
  try {
    const { clinicId } = req.params;
    const body = req.body || {};
    const allowed = ['name', 'description', 'location', 'address', 'country', 'website', 'phone', 'logo_url'];
    const data = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        const val = body[key];
        data[key] = typeof val === 'string' ? val.trim().slice(0, key === 'name' ? 255 : key === 'website' || key === 'logo_url' ? 500 : 255) : val;
      }
    }
    const clinic = await Clinic.updateProfile(clinicId, data);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'clinic_profile_updated',
      targetType: 'clinic',
      targetId: clinicId,
      details: { updated_fields: Object.keys(data) },
    });
    res.json({ clinic });
  } catch (err) {
    next(err);
  }
}

/** POST /api/clinic-admin/clinics/:clinicId/therapists – add therapist by email. Body: { email }. Only verified therapists. */
async function addTherapist(req, res, next) {
  try {
    const { clinicId } = req.params;
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : null;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const psychologist = await Psychologist.findByEmail(email);
    if (!psychologist) {
      return res.status(404).json({ error: 'No verified therapist found with this email' });
    }
    if (psychologist.verification_status !== 'verified') {
      return res.status(400).json({ error: 'Only verified therapists can be added to a clinic' });
    }
    try {
      await TherapistClinic.add(psychologist.id, clinicId);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'This therapist is already affiliated with this clinic' });
      }
      throw err;
    }
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'clinic_therapist_added',
      targetType: 'clinic',
      targetId: clinicId,
      details: { psychologist_id: psychologist.id, email },
    });
    const { avg_rating, review_count } = await Psychologist.getAverageRating(psychologist.id);
    const therapist = {
      ...psychologist,
      avg_rating: parseFloat(avg_rating),
      review_count,
    };
    res.status(201).json({ message: 'Therapist added to clinic', therapist });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/clinic-admin/clinics/:clinicId/therapists/:psychologistId – remove therapist from clinic */
async function removeTherapist(req, res, next) {
  try {
    const { clinicId, psychologistId } = req.params;
    const removed = await TherapistClinic.remove(psychologistId, clinicId);
    if (!removed) {
      return res.status(404).json({ error: 'Therapist is not affiliated with this clinic' });
    }
    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: 'clinic_therapist_removed',
      targetType: 'clinic',
      targetId: clinicId,
      details: { psychologist_id: psychologistId },
    });
    res.json({ message: 'Therapist removed from clinic' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMyClinics,
  getClinic,
  updateClinic,
  listTherapists,
  addTherapist,
  removeTherapist,
};
