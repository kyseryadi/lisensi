# Cara Menjalankan License Addon Bank API

Panduan ini ditujukan untuk Windows dan PowerShell. Perintah yang sama dapat dijalankan di Linux/macOS dengan menyesuaikan perintah penyalinan file environment.

## 1. Persyaratan

Pastikan perangkat sudah memiliki:

- Node.js versi 20 atau lebih baru.
- npm, biasanya terpasang bersama Node.js.
- MySQL 8 atau server MySQL/MariaDB yang kompatibel.
- Akses ke user MySQL yang dapat membuat tabel dan index.

Periksa versi Node.js dan npm:

```powershell
node --version
npm --version
```

Versi Node.js harus menampilkan `v20.x.x` atau lebih baru.

## 2. Masuk ke folder aplikasi

Buka PowerShell, lalu jalankan:

```powershell
Set-Location "C:\WorkFile\Project\NodeJS\license-addon-bank"
```

Jika aplikasi dipindahkan, ganti path tersebut dengan lokasi aplikasi yang baru.

## 3. Pasang dependency

```powershell
npm install
```

Perintah ini membaca `package.json` dan memasang Express, Prisma, Joi, Winston, Swagger UI, serta dependency lainnya ke folder `node_modules`.

## 4. Siapkan database MySQL

Masuk ke MySQL menggunakan MySQL CLI, phpMyAdmin, HeidiSQL, atau aplikasi database lain. Buat database baru:

```sql
CREATE DATABASE license_addon_bank
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Contoh membuat user khusus aplikasi:

```sql
CREATE USER 'license_app'@'localhost' IDENTIFIED BY 'ganti_password_kuat';
GRANT ALL PRIVILEGES ON license_addon_bank.* TO 'license_app'@'localhost';
FLUSH PRIVILEGES;
```

Untuk production, gunakan password yang kuat dan batasi host user database sesuai kebutuhan server.

### Menggunakan database lama

Migration bawaan membuat tabel `x_lisensi`. Jika database tujuan sudah memiliki tabel tersebut dari aplikasi CodeIgniter, jangan langsung menjalankan migration pada database production. Lakukan backup dan bandingkan kolom tabel lama dengan `prisma/schema.prisma` terlebih dahulu.

Kolom yang dibutuhkan aplikasi:

- `id`
- `kode`
- `kode2`
- `nama`
- `versi`
- `tgl_status`
- `tgl_expired`
- `tgl_daftar`
- `modul`

## 5. Buat dan atur file environment

Salin contoh konfigurasi:

```powershell
Copy-Item .env.example .env
```

Buka `.env`, kemudian sesuaikan isinya:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL="mysql://license_app:ganti_password_kuat@localhost:3306/license_addon_bank"
LOG_LEVEL=info
JWT_SECRET="ganti-dengan-random-secret-minimal-32-karakter"
JWT_EXPIRES_IN=8h
```

Keterangan:

| Variable | Kegunaan | Contoh |
| --- | --- | --- |
| `NODE_ENV` | Mode aplikasi: `development`, `test`, atau `production` | `development` |
| `PORT` | Port HTTP aplikasi | `3000` |
| `DATABASE_URL` | Alamat koneksi MySQL untuk Prisma | `mysql://user:password@localhost:3306/database` |
| `LOG_LEVEL` | Level minimum log Winston | `info` |
| `JWT_SECRET` | Secret penandatanganan token login, minimal 32 karakter | nilai acak yang kuat |
| `JWT_EXPIRES_IN` | Lama masa berlaku token login | `8h` |

Jika username atau password database mengandung karakter khusus seperti `@`, `:`, `/`, `#`, atau `%`, karakter tersebut harus di-URL-encode di dalam `DATABASE_URL`.

File `.env` berisi kredensial dan sudah masuk `.gitignore`. Jangan commit atau membagikannya.

## 6. Siapkan Prisma

Hasilkan Prisma Client:

```powershell
npm run prisma:generate
```

Validasi konfigurasi schema:

```powershell
npm run prisma:validate
```

Terapkan migration pada database baru:

```powershell
npm run prisma:deploy
```

Migration akan membuat tabel `x_lisensi`, tabel `users`, serta index yang dibutuhkan.

Jalankan seeder untuk membuat user admin awal:

```powershell
npm run prisma:seed
```

Kredensial awal:

```text
Email    : admin@gmail.com
Password : Alh4mdul!ll4hAm4n
```

Password disimpan sebagai hash bcrypt. Seeder bersifat idempotent: user hanya dibuat jika email belum tersedia dan password user yang sudah ada tidak ditimpa. Karena kredensial awal ini diketahui, ganti nilainya sebelum deployment production.

## 7. Jalankan aplikasi

### Mode development

```powershell
npm run dev
```

Mode development memakai `node --watch`. Server akan dimulai ulang otomatis ketika file sumber berubah.

### Mode normal atau production

Atur `NODE_ENV=production` di `.env`, lalu jalankan:

```powershell
npm start
```

Jika berhasil, console menampilkan informasi bahwa server berjalan pada port yang dikonfigurasi. Biarkan terminal tetap terbuka selama aplikasi digunakan. Pada production, jalankan aplikasi di balik process manager atau Windows service agar otomatis hidup kembali setelah server restart.

Untuk menghentikan aplikasi yang berjalan di terminal, tekan `Ctrl+C`.

### CORS untuk front-end

CORS diaktifkan secara global dan mengizinkan seluruh origin (`*`). Front-end dari domain atau port berbeda dapat memanggil API, termasuk mengirim header `Authorization: Bearer <token>`. Middleware juga menangani request preflight `OPTIONS` secara otomatis.

## 8. Verifikasi aplikasi

Buka terminal PowerShell lain dan jalankan health check:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

Respons yang diharapkan:

```json
{
  "status": "ok"
}
```

Buka dokumentasi API interaktif melalui browser:

```text
http://localhost:3000/docs
```

Spesifikasi OpenAPI mentah tersedia di:

```text
http://localhost:3000/openapi.json
```

## 9. Uji endpoint

### Login

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/auth/login" `
  -ContentType "application/json" `
  -Body (@{
    email = "admin@gmail.com"
    password = "Alh4mdul!ll4hAm4n"
  } | ConvertTo-Json)

$headers = @{
  Authorization = "Bearer $($login.data.token)"
}
```

Gunakan `$headers` untuk seluruh endpoint manajemen lisensi.

### CRUD lisensi

```powershell
# Daftar lisensi
Invoke-RestMethod -Method Get `
  -Uri "http://localhost:3000/lisensi?page=1&limit=20&search=Bank&sort_by=tgl_status&sort_order=desc" `
  -Headers $headers

# Summary lisensi
Invoke-RestMethod -Method Get `
  -Uri "http://localhost:3000/lisensi/summary" `
  -Headers $headers

# Buat lisensi
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/lisensi" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{
    kode = "ABC123"
    kode2 = "DEVICE01"
    nama = "Bank Contoh"
    versi = "1.0.0"
    tgl_expired = "2027-12-31"
    modul = "transfer,mutasi"
  } | ConvertTo-Json)

# Detail lisensi
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/lisensi/1" -Headers $headers

# Update lisensi
Invoke-RestMethod -Method Put `
  -Uri "http://localhost:3000/lisensi/1" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{ nama = "Bank Contoh Update" } | ConvertTo-Json)

# Hapus lisensi
Invoke-RestMethod -Method Delete -Uri "http://localhost:3000/lisensi/1" -Headers $headers
```

Endpoint manajemen mengembalikan HTTP `401` jika Bearer token tidak dikirim, tidak valid, atau kedaluwarsa.

### Endpoint publik aplikasi klien

Contoh mengecek lisensi menggunakan PowerShell:

```powershell
$body = @{
  kode = "ABC123"
  kode2 = "DEVICE01"
  versi = "1.0.0"
}

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/test_lisensi" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body $body
```

### Update dari front-end admin lama

Contoh memperbarui lisensi dari front-end admin:

```powershell
$body = @{
  nama = "Bank Contoh"
  tgl = "2027-12-31"
  modul = "transfer,mutasi"
}

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/lisensi/post/1" `
  -Headers $headers `
  -ContentType "application/x-www-form-urlencoded" `
  -Body $body
```

Ganti angka `1` dengan ID lisensi yang akan diperbarui.

## 10. Jalankan automated tests

```powershell
npm test
```

Test menggunakan database palsu di memory sehingga tidak mengubah data MySQL. Seluruh test harus berstatus `pass`.

## 11. Log aplikasi

Pada mode development, log ditampilkan di console. Pada mode production, log ditampilkan di console dan ditulis ke:

```text
logs/app.log
```

Level log dapat diatur melalui `LOG_LEVEL`, misalnya `error`, `warn`, `info`, `http`, atau `debug`.

## 12. Urutan menjalankan setelah instalasi awal

Setelah dependency, database, `.env`, dan migration sudah disiapkan, proses menjalankan aplikasi berikutnya cukup:

```powershell
Set-Location "C:\WorkFile\Project\NodeJS\license-addon-bank"
npm start
```

`npm install`, `prisma:generate`, dan `prisma:deploy` perlu dijalankan kembali setelah ada perubahan dependency, Prisma schema, atau migration baru.

## Troubleshooting

### `DATABASE_URL` tidak ditemukan

Pastikan file bernama tepat `.env`, berada di root aplikasi, dan memiliki variable `DATABASE_URL`.

### `P1000: Authentication failed`

Periksa username dan password MySQL di `DATABASE_URL`. Pastikan karakter khusus sudah di-URL-encode.

### `P1001: Can't reach database server`

Pastikan service MySQL berjalan, hostname dan port benar, serta firewall mengizinkan koneksi. Port default MySQL adalah `3306`.

### Port aplikasi sudah digunakan

Ubah `PORT` di `.env`, misalnya:

```dotenv
PORT=3001
```

Kemudian restart aplikasi dan akses `http://localhost:3001`.

### Migration gagal karena tabel `x_lisensi` sudah ada

Database tersebut kemungkinan database lama atau sudah pernah disiapkan. Jangan menghapus tabel jika berisi data. Backup database, cocokkan struktur tabel dengan Prisma schema, lalu tentukan proses baseline migration sebelum production digunakan.

### Perubahan `.env` tidak terbaca

Hentikan aplikasi dengan `Ctrl+C`, lalu jalankan kembali `npm start` atau `npm run dev`.
