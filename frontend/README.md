# Lisensi Addon React

Frontend manajemen lisensi addon bank, dibangun sebagai React SPA dengan Vite, Tailwind CSS, dan gaya komponen seperti shadcn/ui.

## Fitur

- Login administrator melalui `POST /auth/login`
- Sesi JWT disimpan selama tab browser aktif melalui `sessionStorage`
- Ringkasan lisensi aktif, kedaluwarsa, dan modul
- Pencarian dan pagination daftar lisensi
- Tambah, ubah, dan hapus lisensi
- Proxy development Vite ke backend agar tidak memerlukan konfigurasi CORS lokal
- Layout responsif untuk desktop dan mobile

## Menjalankan project

Gunakan Node.js 22.13 atau lebih baru.

1. Jalankan backend `license-addon-bank` pada `http://localhost:3000`.
2. Salin `.env.example` menjadi `.env` jika URL backend berbeda.
3. Instal dependency dengan `npm install`.
4. Jalankan frontend dengan `npm run dev`.

Variabel lingkungan:

```env
VITE_PROXY_TARGET=http://127.0.0.1:3000
```

Frontend menggunakan endpoint backend berikut:

- `POST /auth/login`
- `GET /lisensi`
- `GET /lisensi/:id`
- `POST /lisensi`
- `PUT /lisensi/:id`
- `DELETE /lisensi/:id`

Build produksi dibuat dengan `npm run build` dan tersedia di folder `dist`. Pada deployment, arahkan `/api/*` ke backend atau isi `VITE_API_BASE_URL` dengan URL publik backend yang telah mengaktifkan CORS.
