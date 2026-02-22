const config = require('../config');

function notFound(req, res, next) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  const payload = { error: message };

  if (config.env === 'development' && status === 500) {
    payload.stack = err.stack;
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists (duplicate)' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Invalid reference (foreign key)' });
  }

  res.status(status).json(payload);
}

module.exports = {
  notFound,
  errorHandler,
};
