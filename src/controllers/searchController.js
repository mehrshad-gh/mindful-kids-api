const Psychologist = require('../models/Psychologist');
const ProfessionalCredential = require('../models/ProfessionalCredential');
const TherapistClinic = require('../models/TherapistClinic');
const Clinic = require('../models/Clinic');

/**
 * GET /search/therapists – public discovery.
 * Query: country, language, specialty, verified_only (ignored; always verified), clinic_id, limit, offset.
 * Returns only verification_status = 'verified', is_active = true. Public fields only.
 */
async function searchTherapists(req, res, next) {
  try {
    const verifiedOnly = req.query.verified_only !== 'false';
    const limit = req.query.limit != null ? Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100) : 20;
    const offset = req.query.offset != null ? Math.max(parseInt(req.query.offset, 10) || 0, 0) : 0;
    const filters = {
      country: req.query.country?.trim() || undefined,
      language: req.query.language?.trim() || undefined,
      specialty: req.query.specialty?.trim() || undefined,
      clinic_id: req.query.clinic_id?.trim() || undefined,
      limit,
      offset,
    };
    const rows = await Psychologist.search(filters);
    const ids = rows.map((p) => p.id);
    const [countryMap, clinicNamesMap] = await Promise.all([
      ProfessionalCredential.getVerifiedCountryByPsychologistIds(ids),
      TherapistClinic.getClinicNamesByPsychologistIds(ids),
    ]);
    const therapists = rows.map((p) => ({
      id: p.id,
      name: p.name,
      specialty: p.specialty || null,
      country: countryMap[p.id] || null,
      verified_status: p.verification_status || 'verified',
      verified_at: p.verified_at || null,
      clinic_names: clinicNamesMap[p.id] || [],
      profile_image_url: p.profile_image || p.avatar_url || null,
    }));
    res.json({ therapists });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /search/clinics – public discovery.
 * Query: country, verified_only (default true), limit, offset.
 */
async function searchClinics(req, res, next) {
  try {
    const verifiedOnly = req.query.verified_only !== 'false';
    const limit = req.query.limit != null ? Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100) : 20;
    const offset = req.query.offset != null ? Math.max(parseInt(req.query.offset, 10) || 0, 0) : 0;
    const clinics = await Clinic.findAll({
      is_active: true,
      verification_status: verifiedOnly ? 'verified' : undefined,
      country: req.query.country?.trim() || undefined,
      limit,
      offset,
    });
    const ids = clinics.map((c) => c.id);
    const countMap = await TherapistClinic.getTherapistCountByClinicIds(ids);
    const result = clinics.map((c) => ({
      id: c.id,
      name: c.name,
      country: c.country || null,
      verification_status: c.verification_status || null,
      verified_at: c.verified_at || null,
      therapist_count: countMap[c.id] ?? 0,
      website: c.website || null,
      logo_url: c.logo_url || null,
    }));
    res.json({ clinics: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  searchTherapists,
  searchClinics,
};
