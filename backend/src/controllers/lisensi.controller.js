class LisensiController {
  constructor(service) {
    this.service = service;
  }

  testLisensi = async (req, res, next) => {
    try {
      const result = await this.service.testLisensi(req.validatedBody);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  };

  postLisensi = async (req, res, next) => {
    try {
      const result = await this.service.postLisensi(req.validatedBody);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  };

  updateLisensi = async (req, res, next) => {
    try {
      const result = await this.service.updateLisensi(
        req.validatedParams.id,
        req.validatedBody
      );

      if (!result) {
        return res.status(404).json({
          status: 'error',
          message: 'Data lisensi tidak ditemukan'
        });
      }

      return res.json({
        status: 'success',
        message: 'Data lisensi berhasil diperbarui',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const result = await this.service.listLisensi(req.validatedQuery);
      return res.json({ status: 'success', data: result.items, pagination: result.pagination });
    } catch (error) {
      return next(error);
    }
  };

  summary = async (req, res, next) => {
    try {
      const result = await this.service.summaryLisensi();
      return res.json({ status: 'success', data: result });
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.service.getLisensi(req.validatedParams.id);
      if (!result) return this.notFound(res);
      return res.json({ status: 'success', data: result });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const result = await this.service.createManagedLisensi(req.validatedBody);
      return res.status(201).json({
        status: 'success',
        message: 'Data lisensi berhasil dibuat',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const result = await this.service.updateManagedLisensi(
        req.validatedParams.id,
        req.validatedBody
      );
      if (!result) return this.notFound(res);
      return res.json({
        status: 'success',
        message: 'Data lisensi berhasil diperbarui',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      const deleted = await this.service.deleteLisensi(req.validatedParams.id);
      if (!deleted) return this.notFound(res);
      return res.json({ status: 'success', message: 'Data lisensi berhasil dihapus' });
    } catch (error) {
      return next(error);
    }
  };

  notFound(res) {
    return res.status(404).json({
      status: 'error',
      message: 'Data lisensi tidak ditemukan'
    });
  }
}

module.exports = LisensiController;
