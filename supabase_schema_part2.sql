-- Script SQL Tambahan untuk Tabel-Tabel Pendukung SI-DAMKAR di Supabase
-- Silakan copy dan jalankan script ini di menu "SQL Editor" -> "New Query" di Supabase Dashboard

-- 9. TABEL ADMINS (Manajemen Admin)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- nyambung ke auth.users
  email TEXT,
  name TEXT,
  role TEXT,
  status TEXT DEFAULT 'active',
  created_at BIGINT
);

-- 10. TABEL PERSONNEL (Data Anggota / Personil)
CREATE TABLE IF NOT EXISTS personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- nyambung ke auth.users
  email TEXT,
  name TEXT,
  position TEXT,
  rank TEXT,
  status TEXT DEFAULT 'active',
  department TEXT,
  created_at BIGINT
);

-- 11. TABEL WEATHER_UPSTREAM (Cuaca Hulu)
CREATE TABLE IF NOT EXISTS weather_upstream (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location TEXT,
  condition TEXT,
  temperature NUMERIC,
  humidity NUMERIC,
  water_level TEXT,
  status TEXT,
  recorded_at BIGINT,
  updated_at BIGINT
);

-- 12. TABEL RIVER_MONITORING (Pemantauan Sungai)
CREATE TABLE IF NOT EXISTS river_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  points JSONB,
  updated_at BIGINT
);

-- 13. TABEL AI_CHATS (Riwayat Chat AI)
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT,
  user_id UUID,
  role TEXT,
  content TEXT,
  created_at BIGINT
);

-- 14. TABEL THEMES (Pengaturan Tema)
CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  background TEXT,
  text_card TEXT,
  is_dark BOOLEAN
);

-- 15. TABEL OPERATIONAL_REPORTS (Laporan Operasional Internal)
CREATE TABLE IF NOT EXISTS operational_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  date BIGINT,
  description TEXT,
  personnel JSONB,
  units JSONB,
  location TEXT,
  equipment JSONB,
  status TEXT,
  created_by TEXT,
  photos JSONB
);

-- Aktifkan Realtime
DO $$
BEGIN
    alter publication supabase_realtime add table admins;
EXCEPTION WHEN OTHERS THEN
END;
$$;

DO $$
BEGIN
    alter publication supabase_realtime add table personnel;
EXCEPTION WHEN OTHERS THEN
END;
$$;

DO $$
BEGIN
    alter publication supabase_realtime add table operational_reports;
EXCEPTION WHEN OTHERS THEN
END;
$$;
