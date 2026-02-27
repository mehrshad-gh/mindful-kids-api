const TherapistApplication = require('../models/TherapistApplication');
const Psychologist = require('../models/Psychologist');
const TherapistClinic = require('../models/TherapistClinic');
const ProfessionalCredential = require('../models/ProfessionalCredential');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');

/** GET /api/admin/therapist-applications – list applications (admin only) */
async function list(req, res, next) {
  try {
    const status = req.query.status; // draft | pending | approved | rejected
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const applications = await TherapistApplication.findAllByStatus(status, { limit });
    const withUser = await Promise.all(
      applications.map(async (app) => {
        const user = await User.findById(app.user_id);
        let psychologist_verification_status = null;
        if (app.psychologist_id) {
          const psychologist = await Psychologist.findById(app.psychologist_id);
          if (psychologist) psychologist_verification_status = psychologist.verification_status;
        }
        return {
          ...app,
          user_email: user?.email,
          user_name: user?.name,
          psychologist_verification_status,
        };
      })
    );
    res.json({ applications: withUser });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/therapist-applications/:id – get one (admin only) */
async function getOne(req, res, next) {
  try {
    const app = await TherapistApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const user = await User.findById(app.user_id);
    const clinicAffiliations = await TherapistApplication.getApplicationClinicIds(app.id);
    let psychologist_verification_status = null;
    if (app.psychologist_id) {
      const psychologist = await Psychologist.findById(app.psychologist_id);
      if (psychologist) psychologist_verification_status = psychologist.verification_status;
    }
    res.json({
      application: { ...app, psychologist_verification_status },
      user_email: user?.email,
      user_name: user?.name,
      clinic_affiliations: clinicAffiliations,
    });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/therapist-applications/:id – approve or reject (admin only) */
async function review(req, res, next) {
  try {
    const { status, rejection_reason } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Body must include status: "approved" or "rejected"' });
    }

    const app = await TherapistApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }
    if (app.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending applications can be approved or rejected' });
    }

    await TherapistApplication.setReviewed(
      app.id,
      status,
      req.user.id,
      status === 'rejected' ? rejection_reason || null : null
    );

    await AdminAuditLog.insert({
      adminUserId: req.user.id,
      actionType: status === 'approved' ? 'therapist_application_approved' : 'therapist_application_rejected',
      targetType: 'therapist_application',
      targetId: app.id,
      details: status === 'rejected' ? { rejection_reason: rejection_reason || null } : { application_id: app.id },
    });

    if (status === 'approved') {
      const psychologist = await Psychologist.create({
        user_id: app.user_id,
        name: app.professional_name,
        email: app.email,
        phone: app.phone,
        specialty: app.specialty,
        specialization: app.specialization,
        bio: app.bio,
        location: app.location,
        languages: app.languages,
        profile_image: app.profile_image_url,
        avatar_url: app.profile_image_url,
        video_urls: app.video_urls,
        contact_info: app.contact_info,
        verification_status: 'verified',
      });
      await TherapistApplication.setPsychologistId(app.id, psychologist.id);

      if (app.credentials && app.credentials.length) {
        await ProfessionalCredential.createFromApplicationCredentials(
          psychologist.id,
          app.credentials,
          req.user.id
        );
      }

      const clinicAffiliations = await TherapistApplication.getApplicationClinicIds(app.id);
      for (const aff of clinicAffiliations) {
        await TherapistClinic.add(psychologist.id, aff.clinic_id, aff.role_label, aff.is_primary);
      }
    }

    const updated = await TherapistApplication.findById(app.id);
    res.json({
      message: status === 'approved' ? 'Application approved; public profile created.' : 'Application rejected.',
      application: updated,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  review,
};
