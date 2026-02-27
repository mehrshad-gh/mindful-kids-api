const TherapistApplication = require('../models/TherapistApplication');
const Psychologist = require('../models/Psychologist');
const TherapistClinic = require('../models/TherapistClinic');

/** GET /api/therapist/application – get current user's application (therapist only) */
async function getMine(req, res, next) {
  try {
    const app = await TherapistApplication.findByUserId(req.user.id);
    if (!app) {
      return res.json({ application: null });
    }
    const clinics = await TherapistApplication.getApplicationClinicIds(app.id);
    let psychologist_verification_status = null;
    if (app.psychologist_id) {
      const psychologist = await Psychologist.findById(app.psychologist_id);
      if (psychologist) psychologist_verification_status = psychologist.verification_status;
    }
    res.json({
      application: { ...app, psychologist_verification_status },
      clinic_affiliations: clinics,
    });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/therapist/application – create or update draft (therapist only) */
async function upsert(req, res, next) {
  try {
    const userId = req.user.id;
    let app = await TherapistApplication.findByUserId(userId);
    const payload = req.body;

    if (app) {
      if (app.status !== 'draft') {
        return res.status(400).json({ error: 'Application already submitted; cannot edit.' });
      }
      app = await TherapistApplication.update(app.id, {
        professional_name: payload.professional_name,
        email: payload.email,
        phone: payload.phone,
        specialty: payload.specialty,
        specialization: payload.specialization,
        bio: payload.bio,
        location: payload.location,
        languages: payload.languages,
        profile_image_url: payload.profile_image_url,
        video_urls: payload.video_urls,
        contact_info: payload.contact_info,
        credentials: payload.credentials,
      });
      if (payload.clinic_affiliations && Array.isArray(payload.clinic_affiliations)) {
        await TherapistApplication.setApplicationClinics(app.id, payload.clinic_affiliations);
      }
    } else {
      app = await TherapistApplication.create(userId, {
        professional_name: payload.professional_name,
        email: payload.email,
        phone: payload.phone,
        specialty: payload.specialty,
        specialization: payload.specialization,
        bio: payload.bio,
        location: payload.location,
        languages: payload.languages,
        profile_image_url: payload.profile_image_url,
        video_urls: payload.video_urls,
        contact_info: payload.contact_info,
        credentials: payload.credentials,
      });
      if (payload.clinic_affiliations && Array.isArray(payload.clinic_affiliations)) {
        await TherapistApplication.setApplicationClinics(app.id, payload.clinic_affiliations);
      }
    }

    const clinicAffiliations = await TherapistApplication.getApplicationClinicIds(app.id);
    res.json({
      application: app,
      clinic_affiliations: clinicAffiliations,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/therapist/application/submit – submit for review (therapist only) */
async function submit(req, res, next) {
  try {
    const app = await TherapistApplication.findByUserId(req.user.id);
    if (!app) {
      return res.status(404).json({ error: 'No application found. Create a draft first.' });
    }
    if (app.status !== 'draft') {
      return res.status(400).json({ error: 'Application already submitted or reviewed.' });
    }
    const submitted = await TherapistApplication.submit(app.id);
    res.json({
      message: 'Application submitted for review.',
      application: submitted,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/therapist/profile – linked public profile (psychologist) when approved */
async function getProfile(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.json({ profile: null, message: 'No public profile yet. Complete and submit your application for approval.' });
    }
    const { avg_rating, review_count } = await Psychologist.getAverageRating(psychologist.id);
    const clinics = await TherapistClinic.findByPsychologistId(psychologist.id);
    res.json({
      profile: {
        ...psychologist,
        avg_rating: parseFloat(avg_rating),
        review_count,
        clinics,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMine,
  upsert,
  submit,
  getProfile,
};
