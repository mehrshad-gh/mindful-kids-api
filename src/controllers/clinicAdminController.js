const ClinicAdmin = require('../models/ClinicAdmin');
const Clinic = require('../models/Clinic');
const TherapistClinic = require('../models/TherapistClinic');
const Psychologist = require('../models/Psychologist');

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

/** PATCH /api/clinic-admin/clinics/:clinicId – update clinic profile (name, description, location, address, country, website) */
async function updateClinic(req, res, next) {
  try {
    const { clinicId } = req.params;
    const body = req.body || {};
    const allowed = ['name', 'description', 'location', 'address', 'country', 'website'];
    const data = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        data[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
      }
    }
    const clinic = await Clinic.updateProfile(clinicId, data);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    res.json({ clinic });
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
  removeTherapist,
};
