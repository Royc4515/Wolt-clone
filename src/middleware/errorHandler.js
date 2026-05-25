function errorHandler(err, _req, res, _next) {
  const status = Number.isInteger(err && err.status) ? err.status : 500;
  const message = (err && err.message) || 'Internal Server Error';
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
