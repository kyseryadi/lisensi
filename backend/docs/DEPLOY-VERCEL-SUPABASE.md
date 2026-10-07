# Deploy backend dan frontend

Backend Express dan frontend Vite menggunakan dua project Vercel. Database menggunakan Supabase PostgreSQL. Login aplikasi tetap memakai JWT dan tabel `users` milik backend.

## Backend

1. Pilih/buat project Supabase khusus aplikasi ini.
2. Ambil URL transaction pooler (port 6543) untuk `DATABASE_URL`, dan session pooler (port 5432) untuk `DIRECT_URL`. Password pada URL harus di-URL-encode. Contoh variabel ada di `.env.supabase.example`.
3. Atur variabel environment backend: `DATABASE_URL`, `DIRECT_URL`, `NODE_ENV=production`, `JWT_SECRET` acak minimal 32 karakter, dan `JWT_EXPIRES_IN=8h`.
4. Jalankan `npm run supabase:deploy` dengan variabel tersebut untuk membuat tabel. Perintah ini khusus PostgreSQL; migration MySQL lama tetap terpisah.
5. Jalankan `npm run build:vercel`, lalu seeder dengan `NODE_ENV=production`, `ADMIN_EMAIL`, dan `ADMIN_PASSWORD` yang unik. Seeder tidak mengganti password user yang sudah ada.
6. Deploy folder backend ke Vercel. `vercel.json` menjalankan generate Prisma PostgreSQL saat build, tanpa menjalankan migration atau seed otomatis.
7. Periksa `/health`, login, lalu CRUD lisensi untuk memastikan koneksi database berfungsi. `/health` saja tidak memeriksa database.

Tabel memiliki RLS dan akses `anon`/`authenticated` dicabut. Koneksi backend harus menggunakan role database dengan akses yang sesuai (misalnya koneksi postgres bawaan project). Jangan mengirim URL database atau JWT secret ke frontend.

## Frontend

1. Deploy folder `D:/Workfile/Project/React/lisensi-addon-react` sebagai project Vercel terpisah.
2. Set `VITE_API_BASE_URL` ke URL backend Vercel tanpa trailing slash sebelum build.
3. Build memakai `npm run build`; output ada di `dist`. Rewrite pada `vercel.json` mendukung refresh halaman SPA.
4. Periksa login, dashboard, dan CRUD dari URL frontend.

Data MySQL yang sudah ada tidak otomatis disalin ke Supabase. Migrasi data perlu dilakukan terpisah jika ingin mempertahankannya. Untuk kembali menjalankan backend dengan MySQL lokal setelah generate PostgreSQL, jalankan `npm run prisma:generate`.

Referensi: https://vercel.com/docs/frameworks/backend/express dan https://supabase.com/docs/guides/database/prisma.
