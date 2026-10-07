const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

class AuthService {
  constructor(repository) {
    this.repository = repository;
  }

  async login({ email, password }) {
    const user = await this.repository.findByEmail(email.toLowerCase());
    if (!user || !await bcrypt.compare(password, user.password)) return null;

    const token = jwt.sign(
      { email: user.email },
      env.jwtSecret,
      { subject: user.id.toString(), expiresIn: env.jwtExpiresIn }
    );

    return {
      token,
      token_type: 'Bearer',
      expires_in: env.jwtExpiresIn,
      user: {
        id: user.id.toString(),
        email: user.email
      }
    };
  }
}

module.exports = AuthService;
