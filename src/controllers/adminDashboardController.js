const { query } = require('../database/connection');

/**
 * GET /admin/dashboard – overview counts for admin control center.
 * Returns: pending therapist applications, pending clinic applications,
 * verified therapists count, verified clinics count, reports pending review.
 */
async function getDashboard(req, res, next) {
  try {
    const [
      therapistPendingResult,
      clinicPendingResult,
      psychologistsVerifiedResult,
      clinicsVerifiedResult,
      reportsPendingResult,
    ] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS count FROM therapist_applications WHERE status = 'pending'`,
        []
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM clinic_applications WHERE status = 'pending'`,
        []
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM psychologists WHERE is_active = true AND verification_status = 'verified'`,
        []
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM clinics WHERE is_active = true AND verification_status = 'verified'`,
        []
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM professional_reports WHERE status IN ('open', 'under_review')`,
        []
      ),
    ]);
    res.json({
      pending_therapist_applications: therapistPendingResult.rows[0]?.count ?? 0,
      pending_clinic_applications: clinicPendingResult.rows[0]?.count ?? 0,
      verified_therapists_count: psychologistsVerifiedResult.rows[0]?.count ?? 0,
      verified_clinics_count: clinicsVerifiedResult.rows[0]?.count ?? 0,
      reports_pending_review: reportsPendingResult.rows[0]?.count ?? 0,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
};
