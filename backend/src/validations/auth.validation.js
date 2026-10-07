const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required(),
  password: Joi.string().min(8).max(255).required()
});

module.exports = { loginSchema };
