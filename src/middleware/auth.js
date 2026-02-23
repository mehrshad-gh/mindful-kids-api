const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Verify JWT and attach user id and role to req.user.
 * Use on routes that require authentication.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Optional auth: attach user if token present, don't fail if missing.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.sub, role: decoded.role };
  } catch {
    req.user = null;
  }
  next();
}

/**
 * Require one of the given roles (e.g. 'admin' or ['admin', 'therapist']).
 */
function requireRole(roleOrRoles) {
  const allowed = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Require that the user can access the clinic (admin or clinic_admin for this clinic).
 * Expects req.params.clinicId to be set (e.g. from route /clinics/:clinicId/...).
 */
function requireClinicAccess(ClinicAdminModel) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const clinicId = req.params.clinicId || req.params.id;
    if (!clinicId) {
      return res.status(400).json({ error: 'Clinic ID required' });
    }
    if (req.user.role === 'admin') {
      return next();
    }
    if (req.user.role === 'clinic_admin') {
      const isAdmin = await ClinicAdminModel.isAdminOfClinic(req.user.id, clinicId);
      if (isAdmin) return next();
    }
    res.status(403).json({ error: 'You do not have access to this clinic' });
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireClinicAccess,
};
