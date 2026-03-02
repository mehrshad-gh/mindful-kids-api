const TherapistApplication = require('../models/TherapistApplication');
const Psychologist = require('../models/Psychologist');
const TherapistClinic = require('../models/TherapistClinic');
const ProfessionalCredential = require('../models/ProfessionalCredential');
const ProfessionalReport = require('../models/ProfessionalReport');
const TherapistAuditLog = require('../models/TherapistAuditLog');

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
      if (!payload.professional_name?.trim() || !payload.email?.trim()) {
        return res.status(400).json({ error: 'Professional name and email are required when creating an application.' });
      }
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
/** GET /api/therapist/me/profile – same (therapist dashboard) */
async function getProfile(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.json({ profile: null, message: 'No public profile yet. Complete and submit your application for approval.' });
    }
    const { avg_rating, review_count } = await Psychologist.getAverageRating(psychologist.id);
    const clinics = await TherapistClinic.findByPsychologistId(psychologist.id, { activeOnly: true });
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

/** GET /api/therapist/me/verification-status – application + psychologist verification + timeline for dashboard */
async function getVerificationStatus(req, res, next) {
  try {
    const app = await TherapistApplication.findByUserId(req.user.id);
    let psychologist_verification_status = null;
    let psychologist_id = null;
    let verified_at = null;
    let verification_expires_at = null;
    let last_reviewed_at = null;
    if (app?.psychologist_id) {
      psychologist_id = app.psychologist_id;
      const psychologist = await Psychologist.findById(app.psychologist_id);
      if (psychologist) {
        psychologist_verification_status = psychologist.verification_status;
        verified_at = psychologist.verified_at;
        verification_expires_at = psychologist.verification_expires_at;
        last_reviewed_at = psychologist.last_verification_review_at;
      }
    }
    res.json({
      application_status: app ? app.status : null,
      psychologist_id,
      verification_status: psychologist_verification_status,
      is_verified: psychologist_verification_status === 'verified',
      verified_at: verified_at || null,
      verification_expires_at: verification_expires_at || null,
      last_reviewed_at: last_reviewed_at || null,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/therapist/me/credentials – list credentials for therapist's psychologist (status: pending_review | verified | rejected | expired) */
async function getCredentials(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.json({ credentials: [] });
    }
    const rows = await ProfessionalCredential.findByPsychologistId(psychologist.id);
    const credentials = rows.map((c) => ({
      id: c.id,
      credential_type: c.credential_type,
      issuing_country: c.issuing_country,
      issuer: c.issuer,
      license_number: c.license_number,
      expires_at: c.expires_at,
      verification_status: c.verification_status === 'pending' ? 'pending_review' : c.verification_status,
      verified_at: c.verified_at,
      document_url: c.document_url,
      renewal_requested_at: c.renewal_requested_at,
      created_at: c.created_at,
    }));
    res.json({ credentials });
  } catch (err) {
    next(err);
  }
}

/** POST /api/therapist/me/credentials – upload new credential document or mark credential as renewal request */
async function postCredentials(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.status(403).json({ error: 'No approved profile. Complete application and get approved first.' });
    }
    const { credential_id, document_url, credential_type, renewal_requested } = req.body;

    if (renewal_requested && credential_id) {
      const cred = await ProfessionalCredential.findById(credential_id);
      if (!cred || cred.psychologist_id !== psychologist.id) {
        return res.status(404).json({ error: 'Credential not found.' });
      }
      await ProfessionalCredential.update(credential_id, { renewal_requested_at: new Date() });
      await TherapistAuditLog.insert({
        therapistUserId: req.user.id,
        actionType: 'credential_renewal_requested',
        targetType: 'professional_credential',
        targetId: credential_id,
      });
      const updated = await ProfessionalCredential.findById(credential_id);
      return res.json({
        message: 'Renewal requested.',
        credential: {
          ...updated,
          verification_status: updated.verification_status === 'pending' ? 'pending_review' : updated.verification_status,
        },
      });
    }

    if (document_url && typeof document_url === 'string' && document_url.trim()) {
      const type = (credential_type && String(credential_type).trim()) || 'license';
      const cred = await ProfessionalCredential.create({
        psychologist_id: psychologist.id,
        credential_type: type,
        document_url: document_url.trim(),
        verification_status: 'pending',
      });
      await TherapistAuditLog.insert({
        therapistUserId: req.user.id,
        actionType: 'credential_uploaded',
        targetType: 'professional_credential',
        targetId: cred.id,
      });
      return res.status(201).json({
        message: 'Credential document submitted for review.',
        credential: {
          ...cred,
          verification_status: 'pending_review',
        },
      });
    }

    if (credential_id && document_url) {
      const cred = await ProfessionalCredential.findById(credential_id);
      if (!cred || cred.psychologist_id !== psychologist.id) {
        return res.status(404).json({ error: 'Credential not found.' });
      }
      await ProfessionalCredential.update(credential_id, { document_url: document_url.trim(), verification_status: 'pending' });
      await TherapistAuditLog.insert({
        therapistUserId: req.user.id,
        actionType: 'credential_uploaded',
        targetType: 'professional_credential',
        targetId: credential_id,
      });
      const updated = await ProfessionalCredential.findById(credential_id);
      return res.json({
        message: 'Credential document updated and submitted for review.',
        credential: {
          ...updated,
          verification_status: 'pending_review',
        },
      });
    }

    return res.status(400).json({
      error: 'Provide document_url (and optional credential_type) to submit a new credential, or credential_id and renewal_requested: true to request renewal.',
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/therapist/me/reports – reports targeting this therapist's profile (view only); audit therapist_viewed_reports */
async function getReports(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.json({ reports: [] });
    }
    const rows = await ProfessionalReport.findByPsychologistId(psychologist.id);
    await TherapistAuditLog.insert({
      therapistUserId: req.user.id,
      actionType: 'therapist_viewed_reports',
      targetType: 'psychologist',
      targetId: psychologist.id,
    });
    const reports = rows.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      created_at: r.created_at,
    }));
    res.json({ reports });
  } catch (err) {
    next(err);
  }
}

/** GET /api/therapist/me/clinic-affiliations – clinic name, role, status (active | pending | removed) */
async function getClinicAffiliations(req, res, next) {
  try {
    const psychologist = await Psychologist.findByUserId(req.user.id);
    if (!psychologist) {
      return res.json({ affiliations: [] });
    }
    const rows = await TherapistClinic.findByPsychologistId(psychologist.id);
    const affiliations = rows.map((r) => ({
      clinic_id: r.id,
      clinic_name: r.name,
      role: r.role_label || null,
      status: r.status && ['active', 'pending', 'removed'].includes(r.status) ? r.status : 'active',
    }));
    res.json({ affiliations });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMine,
  upsert,
  submit,
  getProfile,
  getVerificationStatus,
  getCredentials,
  postCredentials,
  getReports,
  getClinicAffiliations,
};
