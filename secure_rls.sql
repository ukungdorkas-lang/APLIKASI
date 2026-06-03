-- ============================================================================
-- SCRIPT PENGAMANAN DATABASE SUPABASE (ROW LEVEL SECURITY)
-- Eksekusi script ini di SQL Editor Supabase Anda untuk mencegah kebocoran data
-- ============================================================================

-- 1. AKTIFKAN RLS DI SEMUA TABEL
ALTER TABLE firestore_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_upstream ENABLE ROW LEVEL SECURITY;
ALTER TABLE river_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;

-- 2. HAPUS POLICY LAMA (Jika ada)
-- Ini mencegah konflik dengan policy yang dibuat secara sembarangan
DROP POLICY IF EXISTS "Public Read Access" on reports;
-- (Opsional jika Anda sudah punya nama policy yang lain, biarkan timpa saja di bawah)

-- 3. BACA PUBLIK (Masyarakat Tampil Bebas Tanpa Login)
-- Mengizinkan Frontend aplikasi menarik data yang sifatnya terlihat oleh publik.
CREATE POLICY "Publik Bisa Baca Data Publik" ON news FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Laporan" ON reports FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Galeri" ON gallery FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Edukasi" ON education FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Profil" ON profile_sections FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Banner" ON banners FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Data Air" ON bank_data FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Config" ON app_config FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Cuaca" ON weather_upstream FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Sungai" ON river_monitoring FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Tema" ON themes FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Firestore Docs" ON firestore_docs FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Regu" ON squads FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Baca Sektor" ON sectors FOR SELECT USING (true);

-- (Untuk bisa login atau cek akun, tabel personnel dan admin dibolehkan di read sementara)
CREATE POLICY "Publik Bisa Cek Akun Admin" ON admins FOR SELECT USING (true);
CREATE POLICY "Publik Bisa Cek Akun Personil" ON personnel FOR SELECT USING (true);

-- 4. LAPORAN DARURAT PUBLIK (Masyarakat Bisa Buat Laporan Walau Tidak Login)
CREATE POLICY "Publik Bisa Buat Laporan" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Publik Bisa Buat Laporan Docs" ON firestore_docs FOR INSERT WITH CHECK (true);
CREATE POLICY "Publik Bisa Kirim Chat AI" ON ai_chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Publik Bisa Lihat Chat AI" ON ai_chats FOR SELECT USING (true);

-- 5. KONTROL REGISTRASI PENDAFTARAN (Mencegah Orang Sembarangan Jadi Admin)
-- Hanya user yang baru autentikasi yang bisa membuat row datanya sendiri.
CREATE POLICY "Pemilik Akun Bisa Daftar Sendiri" ON admins FOR INSERT 
WITH CHECK ( auth.uid()::text = id );

CREATE POLICY "Pemilik Akun Bisa Daftar Personil Sendiri" ON personnel FOR INSERT 
WITH CHECK ( auth.uid()::text = id );

CREATE POLICY "Pemilik Akun Bisa Update Profil Sendiri" ON admins FOR UPDATE 
USING ( auth.uid()::text = id );
CREATE POLICY "Pemilik Akun Bisa Update Profil Personil" ON personnel FOR UPDATE 
USING ( auth.uid()::text = id );


-- 6. AKSES DEWA UNTUK SUPER ADMIN (Ukung Dorkas) 🔥
-- Jika email = ukungdorkas@gmail.com, bisa modifikasi SEMUANYA di SEMUA tabel!
-- Di PostgreSQL Supabase, auth.jwt()->>'email' adalah email orang yang login.

CREATE POLICY "Super Admin Bypass ALL on news" ON news FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on gallery" ON gallery FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on education" ON education FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on profile_sections" ON profile_sections FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on banners" ON banners FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on admins" ON admins FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on personnel" ON personnel FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on reports" ON reports FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on firestore_docs" ON firestore_docs FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on bank_data" ON bank_data FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on app_config" ON app_config FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on weather_upstream" ON weather_upstream FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on river_monitoring" ON river_monitoring FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on ai_chats" ON ai_chats FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on themes" ON themes FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on operational_reports" ON operational_reports FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on sectors" ON sectors FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');
CREATE POLICY "Super Admin Bypass ALL on squads" ON squads FOR ALL USING (auth.jwt()->>'email' = 'ukungdorkas@gmail.com');

-- 7. AKSES ADMIN UMUM (Bagi admin biasa yang sudah berstatus aktif dan di-ACC)
-- Memungkinkan admin biasa mengubah laporan ops dsb.
CREATE POLICY "Admin Aktif Bisa Tulis Laporan Ops" ON operational_reports FOR ALL 
USING ( EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()::text AND admins.status = 'active') );

CREATE POLICY "Admin Aktif Bisa Tulis Berita" ON news FOR ALL 
USING ( EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()::text AND admins.status = 'active') );

CREATE POLICY "Admin Aktif Bisa Update Laporan" ON reports FOR UPDATE
USING ( EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()::text AND admins.status = 'active') );

-- ============================================================================
-- SELESAI. Script ini mengamankan API Anda tanpa mengubah source code aplikasi.
