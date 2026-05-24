-- Script SQL Pembuatan Tabel Utama SI-DAMKAR di Supabase
-- Silakan copy dan jalankan script ini di menu "SQL Editor" -> "New Query" di Supabase Dashboard

-- Mengaktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL REPORTS (Laporan Darurat)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_name TEXT,
  phone_number TEXT,
  type TEXT,
  level TEXT,
  description TEXT,
  location JSONB, -- menyimpan lat, lng, address
  media_url TEXT,
  media JSONB, 
  status TEXT,
  report_number TEXT,
  created_at BIGINT, -- menyimpan epoch time
  resolved_at BIGINT,
  photos JSONB,
  documentation JSONB,
  officer_notes TEXT,
  news_generated BOOLEAN DEFAULT FALSE
);

-- 2. TABEL NEWS (Berita)
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id TEXT,
  title TEXT,
  content TEXT,
  summary TEXT,
  date BIGINT,
  location TEXT,
  type TEXT,
  status TEXT,
  is_ai_generated BOOLEAN,
  ai_prompt TEXT,
  image_url TEXT,
  photos JSONB,
  videos JSONB,
  personnel_count INTEGER,
  units_used JSONB
);

-- 3. TABEL GALLERY (Galeri)
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  type TEXT,
  url TEXT,
  created_at BIGINT,
  tags JSONB
);

-- 4. TABEL EDUCATION (Edukasi)
CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  content TEXT,
  category TEXT,
  thumbnail TEXT,
  created_at BIGINT,
  views INTEGER DEFAULT 0
);

-- 5. TABEL PROFILE_SECTIONS (Profil Instansi)
CREATE TABLE IF NOT EXISTS profile_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  content TEXT,
  slug TEXT,
  order_num INTEGER,
  is_active BOOLEAN,
  icon TEXT,
  image_url TEXT,
  updated_at BIGINT
);

-- 6. TABEL BANNERS (Banner Beranda)
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  cta_text TEXT,
  cta_link TEXT,
  overlay_opacity NUMERIC,
  background_color TEXT,
  background_image_url TEXT,
  stats JSONB,
  updated_at BIGINT
);

-- 7. TABEL BANK_DATA (Bank Data/Dokumen)
CREATE TABLE IF NOT EXISTS bank_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  category TEXT,
  file_url TEXT,
  file_type TEXT,
  description TEXT,
  department TEXT,
  uploaded_by TEXT,
  created_at BIGINT,
  size BIGINT
);

-- 8. TABEL APP_CONFIG (Pengaturan Aplikasi)
CREATE TABLE IF NOT EXISTS app_config (
  id TEXT PRIMARY KEY,
  agency_name TEXT,
  slogan TEXT,
  contact TEXT,
  emergency_number TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  address TEXT,
  email TEXT,
  home_display JSONB,
  home_layout JSONB
);

-- Aktifkan Realtime untuk tabel-tabel penting agar aplikasi tetap responsif
-- (Abaikan jika "already in publication" muncul)
DO $$
BEGIN
    alter publication supabase_realtime add table reports;
EXCEPTION WHEN OTHERS THEN
END;
$$;

DO $$
BEGIN
    alter publication supabase_realtime add table news;
EXCEPTION WHEN OTHERS THEN
END;
$$;

DO $$
BEGIN
    alter publication supabase_realtime add table banners;
EXCEPTION WHEN OTHERS THEN
END;
$$;

DO $$
BEGIN
    alter publication supabase_realtime add table app_config;
EXCEPTION WHEN OTHERS THEN
END;
$$;
