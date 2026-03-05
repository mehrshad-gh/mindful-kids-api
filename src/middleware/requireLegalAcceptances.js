const { getCurrentLegalVersions, getRequiredDocTypesForRole } = require('../config/legalVersions');
const LegalAcceptance = require('../models/LegalAcceptance');

/**
 * Middleware: ensure current user has accepted all required legal documents at
 * current versions (role-based). If any are missing, respond 428 Precondition
 * Required with code LEGAL_REACCEPT_REQUIRED and missing list. Use after
 * authenticate so req.user is set (req.user.role is from DB, not only JWT).
 */
async function requireLegalAcceptances(req, res, next) {
  try {
    const versions = await getCurrentLegalVersions();
    const role = req.user?.role || 'parent';
    const docTypes = getRequiredDocTypesForRole(role);
    const required = docTypes
      .map((document_type) => ({
        document_type,
        document_version: versions[document_type] || null,
      }))
      .filter((r) => r.document_version != null);

    const missing = [];
    for (const { document_type, document_version } of required) {
      const accepted = await LegalAcceptance.hasAcceptedVersion(
        req.user.id,
        document_type,
        document_version
      );
      if (!accepted) {
        missing.push({ document_type, document_version });
      }
    }

    if (missing.length > 0) {
      return res.status(428).json({
        code: 'LEGAL_REACCEPT_REQUIRED',
        missing,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireLegalAcceptances };
