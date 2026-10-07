const Joi = require('joi');

const optionalText = Joi.string().allow('', null).max(255);

const testLisensiSchema = Joi.object({
  kode: Joi.string().trim().max(255).required(),
  kode2: optionalText,
  nama: optionalText,
  versi: Joi.string().trim().max(100).required()
}).unknown(true);

const postLisensiSchema = Joi.object({
  kode: Joi.string().trim().max(255).required(),
  kode2: optionalText,
  nama: Joi.string().trim().max(255).required()
}).unknown(true);

const updateLisensiParamsSchema = Joi.object({
  id: Joi.string().pattern(/^\d+$/).required()
});

const updateLisensiSchema = Joi.object({
  nama: Joi.string().trim().max(255).required(),
  tgl: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const isValid = date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;

      return isValid ? value : helpers.error('date.invalid');
    })
    .required()
    .messages({
      'string.pattern.base': 'tgl harus menggunakan format YYYY-MM-DD',
      'date.invalid': 'tgl bukan tanggal yang valid'
    }),
  modul: Joi.string().allow('', null).max(65535).required()
}).unknown(true);

const validDate = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
      ? value
      : helpers.error('date.invalid');
  })
  .messages({
    'string.pattern.base': 'tanggal harus menggunakan format YYYY-MM-DD',
    'date.invalid': 'tanggal tidak valid'
  });

const listLisensiSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow('').max(255).default(''),
  sort_by: Joi.string()
    .valid('tgl_status', 'tanggal_aktivitas', 'tgl_daftar')
    .default('tgl_daftar'),
  sort_order: Joi.string().lowercase().valid('asc', 'desc').default('desc')
});

const createManagedLisensiSchema = Joi.object({
  kode: Joi.string().trim().max(255).required(),
  kode2: optionalText,
  nama: Joi.string().trim().max(255).required(),
  versi: Joi.string().trim().allow('', null).max(100),
  tgl_expired: validDate.required(),
  modul: Joi.string().allow('', null).max(65535)
});

const updateManagedLisensiSchema = Joi.object({
  kode: Joi.string().trim().max(255),
  kode2: optionalText,
  nama: Joi.string().trim().max(255),
  versi: Joi.string().trim().allow('', null).max(100),
  tgl_expired: validDate,
  modul: Joi.string().allow('', null).max(65535)
}).min(1);

module.exports = {
  testLisensiSchema,
  postLisensiSchema,
  updateLisensiParamsSchema,
  updateLisensiSchema,
  listLisensiSchema,
  createManagedLisensiSchema,
  updateManagedLisensiSchema
};
