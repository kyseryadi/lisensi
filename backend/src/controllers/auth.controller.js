class AuthController {
  constructor(service) {
    this.service = service;
  }

  login = async (req, res, next) => {
    try {
      const result = await this.service.login(req.validatedBody);

      if (!result) {
        return res.status(401).json({
          status: 'error',
          message: 'Email atau password salah'
        });
      }

      return res.json({
        status: 'success',
        message: 'Login berhasil',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = AuthController;
