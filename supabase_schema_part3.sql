-- Script SQL Tambahan ke-3 untuk Master Data SI-DAMKAR di Supabase
-- Silakan copy dan jalankan script ini di menu "SQL Editor" -> "New Query" di Supabase Dashboard

-- 16. TABEL SECTORS (Sektor Wilayah)
CREATE TABLE IF NOT EXISTS sectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  description TEXT,
  coverage_area JSONB,
  status TEXT DEFAULT 'active'
);

-- 17. TABEL SQUADS (Regu Pemadam)
CREATE TABLE IF NOT EXISTS squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  sector_id UUID REFERENCES sectors(id),
  leader_id UUID REFERENCES personnel(id), -- atau TEXT jika sementara pakai nama
  shift_schedule TEXT,
  status TEXT DEFAULT 'active'
);

-- Aktifkan Realtime
DO $$
BEGIN
    alter publication supabase_realtime add table sectors;
EXCEPTION WHEN OTHERS THEN
END;
$$;

DO $$
BEGIN
    alter publication supabase_realtime add table squads;
EXCEPTION WHEN OTHERS THEN
END;
$$;
