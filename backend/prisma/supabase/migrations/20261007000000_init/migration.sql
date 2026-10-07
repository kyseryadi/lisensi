-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "x_lisensi" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(255) NOT NULL,
    "kode2" VARCHAR(255),
    "nama" VARCHAR(255) NOT NULL,
    "versi" VARCHAR(100),
    "tgl_status" TIMESTAMP(0),
    "tgl_expired" TIMESTAMP(0) NOT NULL,
    "tgl_daftar" TIMESTAMP(0) NOT NULL,
    "modul" TEXT,

    CONSTRAINT "x_lisensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "x_lisensi_kode_idx" ON "x_lisensi"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- JWT authentication and authorization are handled by the backend.
-- Browser clients must not access these tables via the Supabase Data API.
ALTER TABLE "x_lisensi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "x_lisensi", "users" FROM anon, authenticated;
REVOKE ALL ON SEQUENCE "x_lisensi_id_seq", "users_id_seq" FROM anon, authenticated;
