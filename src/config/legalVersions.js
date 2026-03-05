/**
 * Current required versions for each legal document type.
 * Single source of truth for "must accept this version" checks.
 * Bump a version when you publish updated terms; users who haven't accepted
 * the new version will be gated until they do.
 */
const CURRENT_LEGAL = {
  terms: '2026-03-04',
  privacy_policy: '2026-03-04',
  professional_disclaimer: '2026-03-04',
  provider_terms: '2026-03-04',
};

/**
 * Which document types are required for each role. Used to build required list
 * and missing list for GET /auth/me/required-acceptances and enforcement.
 */
function getRequiredDocTypesForRole(role) {
  switch (role) {
    case 'therapist':
    case 'clinic_admin':
      return ['terms', 'privacy_policy', 'professional_disclaimer', 'provider_terms'];
    case 'admin':
      return ['terms', 'privacy_policy'];
    case 'parent':
    default:
      return ['terms', 'privacy_policy'];
  }
}

module.exports = {
  CURRENT_LEGAL,
  getRequiredDocTypesForRole,
};
