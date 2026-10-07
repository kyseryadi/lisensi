const logger = require('../config/logger');

function notFoundHandler(req, res) {
  return res.status(404).json({
    status: 404,
    message: 'Endpoint tidak ditemukan'
  });
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error('Request gagal', {
    method: req.method,
    path: req.originalUrl,
    error
  });

  return res.status(500).json({
    status: 500,
    message: 'Terjadi kesalahan pada server'
  });
}

module.exports = { notFoundHandler, errorHandler };
