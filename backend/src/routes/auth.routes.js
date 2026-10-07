const express = require('express');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validations/auth.validation');

const invalidLoginResponse = (error) => ({
  status: 'error',
  message: 'Data login tidak valid',
  errors: error.details.map((detail) => detail.message)
});

function createAuthRouter(controller) {
  const router = express.Router();

  router.post(
    '/auth/login',
    validate(loginSchema, invalidLoginResponse, 422),
    controller.login
  );

  return router;
}

module.exports = createAuthRouter;
