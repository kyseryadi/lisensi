# Lisensi Addon Bank

Aplikasi manajemen lisensi addon bank.

## Production

- Dashboard: https://lisensi-frontend.vercel.app
- API health: https://lisensi-backend.vercel.app/health
- Supabase: project `license-addon-bank`, region Singapore.

Deployment sudah diverifikasi dengan login, CRUD lisensi, routing frontend, dan CORS. Data uji sudah dihapus. Database baru tidak berisi salinan data MySQL lama.

- `backend/`: API Express, Prisma, konfigurasi Vercel dan schema Supabase PostgreSQL.
- `frontend/`: Dashboard React dan Vite, konfigurasi Vercel.

## Deployment

Buat dua project Vercel dari repository ini: root directory `backend` untuk API dan `frontend` untuk dashboard. Atur `VITE_API_BASE_URL` frontend ke URL backend.

Panduan database dan environment tersedia di `backend/docs/DEPLOY-VERCEL-SUPABASE.md`. File `.env` tidak disertakan.
