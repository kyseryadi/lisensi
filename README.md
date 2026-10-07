# Lisensi Addon Bank

Aplikasi manajemen lisensi addon bank.

- `backend/`: API Express, Prisma, konfigurasi Vercel dan schema Supabase PostgreSQL.
- `frontend/`: Dashboard React dan Vite, konfigurasi Vercel.

## Deployment

Buat dua project Vercel dari repository ini: root directory `backend` untuk API dan `frontend` untuk dashboard. Atur `VITE_API_BASE_URL` frontend ke URL backend.

Panduan database dan environment tersedia di `backend/docs/DEPLOY-VERCEL-SUPABASE.md`. File `.env` tidak disertakan.
