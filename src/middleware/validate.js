const { validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ error: 'Validation failed', details: extracted });
}

module.exports = { handleValidationErrors };
