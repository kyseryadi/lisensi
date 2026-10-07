# License Addon Bank API

REST API Node.js pengganti fungsi `test_lisensi` dan `post_lisensi` dari CodeIgniter. Aplikasi menggunakan Express, Prisma (MySQL), Joi, dan Winston.

CORS diaktifkan secara global untuk seluruh origin sehingga API dapat dipanggil dari front-end pada domain atau port yang berbeda. Request preflight `OPTIONS`, header `Authorization`, dan `Content-Type` didukung.

## Menjalankan aplikasi

Prasyarat: Node.js 20+ dan MySQL.

Panduan instalasi, konfigurasi database, mode development/production, verifikasi, dan troubleshooting tersedia di [Cara Menjalankan Aplikasi](docs/CARA-MENJALANKAN.md).

```bash
npm install
copy .env.example .env
```

Buat database yang masih kosong:

```sql
CREATE DATABASE license_addon_bank
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Sesuaikan `DATABASE_URL` di `.env`, lalu jalankan:

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm start
```

Server berjalan secara default di `http://localhost:3000`. Endpoint health check tersedia di `GET /health`.

## Dokumentasi API

Setelah server berjalan, dokumentasi Swagger interaktif dapat dibuka di:

```text
http://localhost:3000/docs
```

Di halaman tersebut request dapat dicoba langsung melalui tombol **Try it out**. Spesifikasi OpenAPI mentah tersedia di:

```text
http://localhost:3000/openapi.json
```

File sumber dokumentasi berada di `docs/openapi.json` dan dapat diimpor ke Postman, Insomnia, atau API client lain yang mendukung OpenAPI 3.

## Login dan manajemen lisensi

Jalankan `npm run prisma:seed` setelah migration untuk membuat user admin awal. Login melalui `POST /auth/login`, lalu gunakan `data.token` sebagai header `Authorization: Bearer <token>`.

Endpoint CRUD yang memerlukan token:

- `GET /lisensi` — daftar, pagination, pencarian, dan sorting lisensi. Gunakan `sort_by=tgl_status` (atau `tanggal_aktivitas`) serta `sort_order=asc|desc`.
- `GET /lisensi/summary` — total lisensi serta jumlah aktif dan expired.
- `GET /lisensi/:id` — detail lisensi.
- `POST /lisensi` — membuat lisensi.
- `PUT /lisensi/:id` — memperbarui lisensi.
- `DELETE /lisensi/:id` — menghapus lisensi.

Kredensial awal seeder adalah `admin@gmail.com` / `Alh4mdul!ll4hAm4n`. Password disimpan sebagai hash bcrypt. Ganti kredensial default sebelum deployment production.

## Endpoint

Kedua endpoint menerima JSON dan form URL-encoded. Respons sengaja mempertahankan status bisnis versi lama (`"0"`, `"20"`, dan `"50"`) dan menggunakan HTTP 200 untuk form yang tidak valid agar kompatibel dengan klien lama.

### POST /test_lisensi

Field wajib: `kode`, `versi`. Field opsional: `kode2`, `nama`.

```bash
curl -X POST http://localhost:3000/test_lisensi \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "kode=ABC123&kode2=DEVICE01&versi=1.0.0"
```

Arti status:

- `20`: lisensi ditemukan dan masih aktif.
- `50`: lisensi ditemukan tetapi sudah kedaluwarsa.
- `0`: kode lisensi tidak ditemukan.

### POST /post_lisensi

Field wajib: `kode`, `nama`. Field opsional: `kode2`.

```bash
curl -X POST http://localhost:3000/post_lisensi \
  -H "Content-Type: application/json" \
  -d '{"kode":"ABC123","kode2":"DEVICE01","nama":"Bank Contoh"}'
```

Lisensi baru dibuat dengan `tgl_expired` pada pukul 00:00 hari ini, sama seperti implementasi PHP sumber. Status `0` berarti record baru dibuat; status `20` berarti record yang cocok sudah ada dan namanya diperbarui.

### POST /lisensi/post/:id

Memperbarui lisensi dari halaman admin lama. Alias `POST /update_lisensi/:id` juga tersedia. Field `nama`, `tgl`, dan `modul` wajib dikirim; `tgl` menggunakan format `YYYY-MM-DD`, sedangkan nilai `modul` boleh berupa string kosong.

```bash
curl -X POST http://localhost:3000/lisensi/post/1 \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "nama=Bank Contoh&tgl=2027-12-31&modul=transfer,mutasi"
```

Endpoint mengembalikan HTTP `404` bila ID tidak ditemukan dan HTTP `422` bila data tidak valid.

## Perintah pengembangan

```bash
npm run dev
npm test
npm run prisma:validate
```

Di production, Winston menulis log JSON ke console dan `logs/app.log`. Jangan commit file `.env`.
