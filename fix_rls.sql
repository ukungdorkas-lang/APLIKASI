-- =====================================================================
-- JALANKAN PERINTAH SQL BERIKUT DI SUPABASE SQL EDITOR ANDA
-- UNTUK MENGATASI MASALAH ROW LEVEL SECURITY (RLS) DI SEMUA TABEL
-- =====================================================================

-- 1. Menonaktifkan RLS sepenuhnya pada semua tabel agar frontend bisa melakukan baca/tulis langsung:
ALTER TABLE firestore_docs DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE education DISABLE ROW LEVEL SECURITY;
ALTER TABLE profile_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE personnel DISABLE ROW LEVEL SECURITY;
ALTER TABLE weather_upstream DISABLE ROW LEVEL SECURITY;
ALTER TABLE river_monitoring DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE operational_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE sectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE squads DISABLE ROW LEVEL SECURITY;

-- 2. ALTERNATIF LAIN (Jika Anda ingin RLS tetap AKTIF tetapi mengizinkan akses Publik tanpa batas ke semua tabel):
-- CREATE POLICY "Allow public access to firestore_docs" ON firestore_docs FOR ALL USING (true);
-- CREATE POLICY "Allow public access to reports" ON reports FOR ALL USING (true);
-- CREATE POLICY "Allow public access to admins" ON admins FOR ALL USING (true);
-- CREATE POLICY "Allow public access to news" ON news FOR ALL USING (true);
-- CREATE POLICY "Allow public access to gallery" ON gallery FOR ALL USING (true);
-- CREATE POLICY "Allow public access to education" ON education FOR ALL USING (true);
-- CREATE POLICY "Allow public access to profile_sections" ON profile_sections FOR ALL USING (true);
-- CREATE POLICY "Allow public access to banners" ON banners FOR ALL USING (true);
-- CREATE POLICY "Allow public access to bank_data" ON bank_data FOR ALL USING (true);
-- CREATE POLICY "Allow public access to app_config" ON app_config FOR ALL USING (true);
-- CREATE POLICY "Allow public access to personnel" ON personnel FOR ALL USING (true);
-- CREATE POLICY "Allow public access to weather_upstream" ON weather_upstream FOR ALL USING (true);
-- CREATE POLICY "Allow public access to river_monitoring" ON river_monitoring FOR ALL USING (true);
-- CREATE POLICY "Allow public access to ai_chats" ON ai_chats FOR ALL USING (true);
-- CREATE POLICY "Allow public access to themes" ON themes FOR ALL USING (true);
-- CREATE POLICY "Allow public access to operational_reports" ON operational_reports FOR ALL USING (true);
-- CREATE POLICY "Allow public access to sectors" ON sectors FOR ALL USING (true);
-- CREATE POLICY "Allow public access to squads" ON squads FOR ALL USING (true);
