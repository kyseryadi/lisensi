process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://test:test@localhost:3306/test';
process.env.JWT_SECRET = 'test-secret-minimal-32-characters-long';
process.env.JWT_EXPIRES_IN = '8h';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createApp = require('../src/app');

const authorization = `Bearer ${jwt.sign(
  { email: 'admin@gmail.com' },
  process.env.JWT_SECRET,
  { subject: '1', expiresIn: '8h' }
)}`;

function matchesWhere(row, where) {
  if (where.kode !== undefined && row.kode !== where.kode) return false;
  if (!where.OR) return true;
  return where.OR.some((condition) => row.kode2 === condition.kode2);
}

function createFakeDatabase(seed = [], userSeed = []) {
  const rows = seed.map((row, index) => ({ id: BigInt(index + 1), ...row }));
  const users = userSeed.map((user, index) => ({ id: BigInt(index + 1), ...user }));

  const database = {
    rows,
    users,
    user: {
      async findUnique({ where }) {
        return users.find((user) => user.email === where.email) || null;
      }
    },
    lisensi: {
      async findFirst({ where }) {
        return rows.find((row) => matchesWhere(row, where)) || null;
      },
      async updateMany({ where, data }) {
        const matches = rows.filter((row) => matchesWhere(row, where));
        matches.forEach((row) => Object.assign(row, data));
        return { count: matches.length };
      },
      async findUnique({ where }) {
        return rows.find((row) => row.id === where.id) || null;
      },
      async findMany({ skip = 0, take = 20, orderBy = [] }) {
        const sorted = [...rows];
        sorted.sort((left, right) => {
          for (const order of orderBy) {
            const [field, direction] = Object.entries(order)[0];
            const leftValue = left[field];
            const rightValue = right[field];
            if (leftValue === rightValue) continue;
            if (leftValue == null) return direction === 'asc' ? -1 : 1;
            if (rightValue == null) return direction === 'asc' ? 1 : -1;
            const comparison = leftValue < rightValue ? -1 : 1;
            return direction === 'asc' ? comparison : -comparison;
          }
          return 0;
        });
        return sorted.slice(skip, skip + take);
      },
      async count({ where } = {}) {
        if (!where?.tglExpired) return rows.length;
        const { gte, lt } = where.tglExpired;
        return rows.filter((row) => {
          if (gte !== undefined) return row.tglExpired >= gte;
          if (lt !== undefined) return row.tglExpired < lt;
          return true;
        }).length;
      },
      async update({ where, data }) {
        const row = rows.find((item) => item.id === where.id);
        if (!row) throw new Error('Record not found');
        Object.assign(row, data);
        return row;
      },
      async create({ data }) {
        const row = { id: BigInt(rows.length + 1), versi: null, tglStatus: null, modul: null, ...data };
        rows.push(row);
        return row;
      },
      async delete({ where }) {
        const index = rows.findIndex((row) => row.id === where.id);
        if (index === -1) throw new Error('Record not found');
        return rows.splice(index, 1)[0];
      }
    }
  };

  return database;
}

test('POST /auth/login mengembalikan JWT untuk password bcrypt yang benar', async () => {
  const password = await bcrypt.hash('Alh4mdul!ll4hAm4n', 4);
  const database = createFakeDatabase([], [{ email: 'admin@gmail.com', password }]);

  const response = await request(createApp({ database }))
    .post('/auth/login')
    .send({ email: 'admin@gmail.com', password: 'Alh4mdul!ll4hAm4n' });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'success');
  assert.equal(response.body.data.token_type, 'Bearer');
  assert.equal(jwt.verify(response.body.data.token, process.env.JWT_SECRET).email, 'admin@gmail.com');
});

test('POST /auth/login menolak password yang salah', async () => {
  const password = await bcrypt.hash('Alh4mdul!ll4hAm4n', 4);
  const database = createFakeDatabase([], [{ email: 'admin@gmail.com', password }]);

  const response = await request(createApp({ database }))
    .post('/auth/login')
    .send({ email: 'admin@gmail.com', password: 'password-salah' });

  assert.equal(response.status, 401);
});

test('GET /docs dan /openapi.json menyediakan dokumentasi API', async () => {
  const app = createApp({ database: createFakeDatabase() });
  const docsResponse = await request(app).get('/docs/');
  const specResponse = await request(app).get('/openapi.json');

  assert.equal(docsResponse.status, 200);
  assert.match(docsResponse.text, /License Addon Bank API Docs/);
  assert.equal(specResponse.status, 200);
  assert.equal(specResponse.body.openapi, '3.0.3');
  assert.ok(specResponse.body.paths['/lisensi/post/{id}']);
  assert.ok(specResponse.body.paths['/auth/login']);
  assert.ok(specResponse.body.paths['/lisensi']);
  assert.ok(specResponse.body.paths['/lisensi/summary']);
  assert.ok(specResponse.body.components.securitySchemes.bearerAuth);
});

test('CORS mengizinkan request dan preflight dari origin lain', async () => {
  const app = createApp({ database: createFakeDatabase() });
  const response = await request(app)
    .options('/lisensi')
    .set('Origin', 'https://frontend.example.com')
    .set('Access-Control-Request-Method', 'GET')
    .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

  assert.equal(response.status, 204);
  assert.equal(response.headers['access-control-allow-origin'], '*');
  assert.match(response.headers['access-control-allow-methods'], /GET/);
  assert.match(response.headers['access-control-allow-headers'], /Authorization/i);
});

test('POST /test_lisensi mengembalikan format invalid form dari API lama', async () => {
  const response = await request(createApp({ database: createFakeDatabase() }))
    .post('/test_lisensi')
    .type('form')
    .send({ kode: 'ABC' });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    nama: 'Invalid form',
    status: 0,
    tgl_expired: '',
    tgl_daftar: '',
    modul: ''
  });
});

test('POST /test_lisensi memperbarui versi dan mengembalikan lisensi aktif', async () => {
  const database = createFakeDatabase([{
    kode: 'ABC',
    kode2: '',
    nama: 'Bank Contoh',
    versi: '1.0',
    tglStatus: null,
    tglExpired: new Date('2999-12-31T00:00:00'),
    tglDaftar: new Date('2026-07-14T10:30:00'),
    modul: 'transfer'
  }]);

  const response = await request(createApp({ database }))
    .post('/test_lisensi')
    .send({ kode: 'ABC', kode2: 'DEVICE-1', versi: '2.0' });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, '20');
  assert.equal(response.body.nama, 'Bank Contoh');
  assert.equal(response.body.modul, 'transfer');
  assert.equal(database.rows[0].versi, '2.0');
  assert.ok(database.rows[0].tglStatus instanceof Date);
});

test('POST /test_lisensi fallback berdasarkan kode dan menandai lisensi kedaluwarsa', async () => {
  const database = createFakeDatabase([{
    kode: 'ABC',
    kode2: 'DEVICE-LAIN',
    nama: 'Bank Lama',
    versi: null,
    tglStatus: null,
    tglExpired: new Date('2020-01-01T00:00:00'),
    tglDaftar: new Date('2019-01-01T00:00:00'),
    modul: null
  }]);

  const response = await request(createApp({ database }))
    .post('/test_lisensi')
    .type('form')
    .send({ kode: 'ABC', kode2: 'DEVICE-BARU', versi: '1.0' });

  assert.equal(response.body.status, '50');
  assert.equal(response.body.nama, 'Bank Lama');
  assert.equal(database.rows[0].tglStatus, null);
});

test('POST /post_lisensi membuat lisensi baru dengan status 0', async () => {
  const database = createFakeDatabase();
  const response = await request(createApp({ database }))
    .post('/post_lisensi')
    .send({ kode: 'NEW', kode2: 'DEVICE-1', nama: 'Bank Baru' });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, '0');
  assert.equal(response.body.nama, 'Bank Baru');
  assert.equal(database.rows.length, 1);
  assert.equal(database.rows[0].kode2, 'DEVICE-1');
});

test('POST /post_lisensi memperbarui nama lisensi yang cocok', async () => {
  const database = createFakeDatabase([{
    kode: 'ABC',
    kode2: null,
    nama: 'Nama Lama',
    tglExpired: new Date('2999-12-31T00:00:00'),
    tglDaftar: new Date(),
    modul: null
  }]);

  const response = await request(createApp({ database }))
    .post('/post_lisensi')
    .type('form')
    .send({ kode: 'ABC', kode2: 'DEVICE-1', nama: 'Nama Baru' });

  assert.equal(response.body.status, '20');
  assert.equal(response.body.nama, 'Nama Baru');
  assert.equal(database.rows[0].nama, 'Nama Baru');
});

test('POST /lisensi/post/:id memperbarui data dari front-end lama', async () => {
  const database = createFakeDatabase([{
    kode: 'ABC',
    kode2: null,
    nama: 'Nama Lama',
    tglExpired: new Date('2026-01-01T00:00:00'),
    tglDaftar: new Date(),
    modul: 'lama'
  }]);

  const response = await request(createApp({ database }))
    .post('/lisensi/post/1')
    .set('Authorization', authorization)
    .type('form')
    .send({ nama: 'Nama Baru', tgl: '2027-12-31', modul: 'transfer,mutasi' });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'success');
  assert.deepEqual(response.body.data, {
    id: '1',
    nama: 'Nama Baru',
    tgl_expired: '2027-12-31 00:00:00',
    modul: 'transfer,mutasi'
  });
  assert.equal(database.rows[0].nama, 'Nama Baru');
  assert.equal(database.rows[0].modul, 'transfer,mutasi');
});

test('POST /update_lisensi/:id menolak tanggal yang tidak valid', async () => {
  const response = await request(createApp({ database: createFakeDatabase() }))
    .post('/update_lisensi/1')
    .set('Authorization', authorization)
    .send({ nama: 'Bank', tgl: '2026-02-30', modul: '' });

  assert.equal(response.status, 422);
  assert.equal(response.body.status, 'error');
});

test('POST /update_lisensi/:id mengembalikan 404 jika id tidak ditemukan', async () => {
  const response = await request(createApp({ database: createFakeDatabase() }))
    .post('/update_lisensi/999')
    .set('Authorization', authorization)
    .send({ nama: 'Bank', tgl: '2026-12-31', modul: '' });

  assert.equal(response.status, 404);
  assert.equal(response.body.status, 'error');
});

test('endpoint manajemen lisensi menolak request tanpa token', async () => {
  const response = await request(createApp({ database: createFakeDatabase() }))
    .get('/lisensi');

  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Token autentikasi diperlukan');
});

test('GET /lisensi/summary menghitung total, aktif, dan expired', async () => {
  const database = createFakeDatabase([
    {
      kode: 'ACTIVE-1', kode2: null, nama: 'Aktif 1',
      tglExpired: new Date('2999-12-31T00:00:00'), tglDaftar: new Date(), modul: null
    },
    {
      kode: 'ACTIVE-2', kode2: null, nama: 'Aktif 2',
      tglExpired: new Date('2998-12-31T00:00:00'), tglDaftar: new Date(), modul: null
    },
    {
      kode: 'EXPIRED-1', kode2: null, nama: 'Expired 1',
      tglExpired: new Date('2020-01-01T00:00:00'), tglDaftar: new Date(), modul: null
    }
  ]);

  const response = await request(createApp({ database }))
    .get('/lisensi/summary')
    .set('Authorization', authorization);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, {
    total_lisensi: 3,
    status_aktif: 2,
    status_expired: 1
  });
});

test('GET /lisensi dapat diurutkan berdasarkan tgl_status atau tanggal_aktivitas', async () => {
  const database = createFakeDatabase([
    {
      kode: 'OLD', kode2: null, nama: 'Aktivitas Lama', versi: null,
      tglStatus: new Date('2026-01-01T08:00:00'),
      tglExpired: new Date('2999-12-31T00:00:00'), tglDaftar: new Date(), modul: null
    },
    {
      kode: 'NEW', kode2: null, nama: 'Aktivitas Baru', versi: null,
      tglStatus: new Date('2026-08-31T08:00:00'),
      tglExpired: new Date('2999-12-31T00:00:00'), tglDaftar: new Date(), modul: null
    }
  ]);
  const app = createApp({ database });

  const descending = await request(app)
    .get('/lisensi?sort_by=tgl_status&sort_order=desc')
    .set('Authorization', authorization);
  assert.equal(descending.status, 200);
  assert.deepEqual(descending.body.data.map((item) => item.kode), ['NEW', 'OLD']);

  const ascendingAlias = await request(app)
    .get('/lisensi?sort_by=tanggal_aktivitas&sort_order=asc')
    .set('Authorization', authorization);
  assert.equal(ascendingAlias.status, 200);
  assert.deepEqual(ascendingAlias.body.data.map((item) => item.kode), ['OLD', 'NEW']);
});

test('user terautentikasi dapat melakukan CRUD lisensi', async () => {
  const database = createFakeDatabase();
  const app = createApp({ database });

  const created = await request(app)
    .post('/lisensi')
    .set('Authorization', authorization)
    .send({
      kode: 'CRUD-001',
      kode2: 'DEVICE-01',
      nama: 'Bank CRUD',
      versi: '1.0.0',
      tgl_expired: '2027-12-31',
      modul: 'transfer'
    });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.id, '1');

  const list = await request(app)
    .get('/lisensi?page=1&limit=20')
    .set('Authorization', authorization);
  assert.equal(list.status, 200);
  assert.equal(list.body.pagination.total, 1);

  const detail = await request(app)
    .get('/lisensi/1')
    .set('Authorization', authorization);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.kode, 'CRUD-001');

  const updated = await request(app)
    .put('/lisensi/1')
    .set('Authorization', authorization)
    .send({ nama: 'Bank CRUD Update', modul: 'transfer,mutasi' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.nama, 'Bank CRUD Update');

  const deleted = await request(app)
    .delete('/lisensi/1')
    .set('Authorization', authorization);
  assert.equal(deleted.status, 200);
  assert.equal(database.rows.length, 0);
});
