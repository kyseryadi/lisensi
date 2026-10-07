const jwt = require('jsonwebtoken');
const env = require('../config/env');

function authenticate(req, res, next) {
  const authorization = req.get('authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Token autentikasi diperlukan'
    });
  }

  const token = authorization.slice(7).trim();

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.sub,
      email: payload.email
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token tidak valid atau sudah kedaluwarsa'
    });
  }
}

module.exports = authenticate;
