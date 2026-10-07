const express = require('express');
const validate = require('../middlewares/validate');
const {
  testLisensiSchema,
  postLisensiSchema,
  updateLisensiParamsSchema,
  updateLisensiSchema,
  listLisensiSchema,
  createManagedLisensiSchema,
  updateManagedLisensiSchema
} = require('../validations/lisensi.validation');

const invalidTestResponse = {
  nama: 'Invalid form',
  status: 0,
  tgl_expired: '',
  tgl_daftar: '',
  modul: ''
};

const invalidPostResponse = {
  nama: 'Invalid form',
  status: 0,
  tgl_expired: ''
};

const invalidUpdateResponse = (error) => ({
  status: 'error',
  message: 'Data update lisensi tidak valid',
  errors: error.details.map((detail) => detail.message)
});

const invalidManagementResponse = (error) => ({
  status: 'error',
  message: 'Data lisensi tidak valid',
  errors: error.details.map((detail) => detail.message)
});

function createLisensiRouter(controller, authenticate) {
  const router = express.Router();

  router.post(
    '/test_lisensi',
    validate(testLisensiSchema, invalidTestResponse),
    controller.testLisensi
  );
  router.post(
    '/post_lisensi',
    validate(postLisensiSchema, invalidPostResponse),
    controller.postLisensi
  );

  const updateMiddlewares = [
    authenticate,
    validate(updateLisensiParamsSchema, invalidUpdateResponse, 422, 'params'),
    validate(updateLisensiSchema, invalidUpdateResponse, 422),
    controller.updateLisensi
  ];

  router.post('/lisensi/post/:id', ...updateMiddlewares);
  router.post('/update_lisensi/:id', ...updateMiddlewares);

  router.get(
    '/lisensi',
    authenticate,
    validate(listLisensiSchema, invalidManagementResponse, 422, 'query'),
    controller.list
  );
  router.get('/lisensi/summary', authenticate, controller.summary);
  router.get(
    '/lisensi/:id',
    authenticate,
    validate(updateLisensiParamsSchema, invalidManagementResponse, 422, 'params'),
    controller.getById
  );
  router.post(
    '/lisensi',
    authenticate,
    validate(createManagedLisensiSchema, invalidManagementResponse, 422),
    controller.create
  );
  router.put(
    '/lisensi/:id',
    authenticate,
    validate(updateLisensiParamsSchema, invalidManagementResponse, 422, 'params'),
    validate(updateManagedLisensiSchema, invalidManagementResponse, 422),
    controller.update
  );
  router.delete(
    '/lisensi/:id',
    authenticate,
    validate(updateLisensiParamsSchema, invalidManagementResponse, 422, 'params'),
    controller.remove
  );

  return router;
}

module.exports = createLisensiRouter;
