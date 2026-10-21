# Production deployment

- Frontend Vercel: https://lisensi-frontend.vercel.app
- Backend Vercel: https://lisensi-backend.vercel.app
- Supabase project: `mxvxhmlarecazmjzolgd` (`license-addon-bank`), organisasi `kyse-app`, Singapore.
- GitHub: https://github.com/kyseryadi/lisensi, branch `main`.
- Root directory Vercel: `frontend` dan `backend`, masing-masing pada project terpisah.

Schema awal dipasang melalui Supabase migrations `init_license_schema` dan `backend_database_role`. Runtime menggunakan role `license_api` dengan izin pada dua tabel aplikasi dan sequence terkait. RLS aktif; `anon` dan `authenticated` tidak mendapat akses. Password role dan JWT secret hanya dipasang sebagai secret Vercel.

`DATABASE_URL` memakai transaction pooler Singapore dengan `pgbouncer=true`, `connection_limit=1`, dan SSL. `DIRECT_URL` memakai session pooler. Role runtime tidak memiliki izin membuat tabel atau menjalankan migration. Jika kelak memakai Prisma Migrate untuk database yang sudah diinisialisasi ini, lakukan baseline migration lebih dulu dengan kredensial administrasi; jangan menjalankan init lagi.

Kredensial admin dibuat acak dan disimpan lokal, tidak di repository. Pengujian production mencakup health, login, query database, create/read/update/delete lisensi, CORS, routing `/login`, dan URL API pada bundle frontend. Data uji sudah dihapus. Data MySQL lama belum dimigrasikan.
