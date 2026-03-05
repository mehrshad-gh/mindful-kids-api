/**
 * Current required versions for each legal document type.
 * Versions are loaded from legal_documents table (admin-managed); in-memory cache 60s.
 * getRequiredDocTypesForRole(role) defines which document types each role must accept.
 */
const { query } = require('../database/connection');

const CACHE_TTL_MS = 60 * 1000; // 60 seconds
let _cache = null;
let _cacheExpiry = 0;

/**
 * Returns { terms, privacy_policy, professional_disclaimer, provider_terms } from DB.
 * Cached in memory for 60 seconds.
 */
async function getCurrentLegalVersions() {
  if (_cache != null && Date.now() < _cacheExpiry) {
    return _cache;
  }
  const result = await query(
    `SELECT document_type, current_version FROM legal_documents`
  );
  const versions = {
    terms: null,
    privacy_policy: null,
    professional_disclaimer: null,
    provider_terms: null,
  };
  for (const row of result.rows) {
    if (versions.hasOwnProperty(row.document_type)) {
      versions[row.document_type] = row.current_version;
    }
  }
  _cache = versions;
  _cacheExpiry = Date.now() + CACHE_TTL_MS;
  return versions;
}

/** Invalidate in-memory cache (e.g. after admin updates a version). */
function invalidateLegalVersionsCache() {
  _cache = null;
  _cacheExpiry = 0;
}

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
  getCurrentLegalVersions,
  getRequiredDocTypesForRole,
  invalidateLegalVersionsCache,
};