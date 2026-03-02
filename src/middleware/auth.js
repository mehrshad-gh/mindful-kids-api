const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

/** Verify JWT and set req.user. Returns 401 if missing or invalid. */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    User.findById(decoded.sub)
      .then((user) => {
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }
        req.user = user;
        next();
      })
      .catch(() => res.status(401).json({ error: 'Authentication failed' }));
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Optional auth: set req.user if valid token, otherwise leave req.user undefined. Never 401. */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    User.findById(decoded.sub)
      .then((user) => {
        req.user = user || null;
        next();
      })
      .catch(() => {
        req.user = null;
        next();
      });
  } catch {
    req.user = null;
    next();
  }
}

function requireRole(allowedRole) {
  const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
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

/** Resolve /clinics/me to the first clinic the user manages. Sets req.clinicId. */
function resolveClinicMe(ClinicAdmin) {
  return async (req, res, next) => {
    const ids = await ClinicAdmin.getManagedClinicIds(req.user.id);
    req.clinicId = ids[0] || null;
    next();
  };
}

/** Ensure user can access the clinic (req.params.clinicId or req.clinicId). */
function requireClinicAccess(ClinicAdmin) {
  return async (req, res, next) => {
    const clinicId = req.params.clinicId || req.clinicId;
    if (!clinicId) {
      return res.status(400).json({ error: 'Clinic not specified' });
    }
    const ok = await ClinicAdmin.isAdminOfClinic(req.user.id, clinicId);
    if (!ok) {
      return res.status(403).json({ error: 'Access denied to this clinic' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireRole,
  resolveClinicMe,
  requireClinicAccess,
};
