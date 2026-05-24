-- Jalankan perintah ini di Supabase SQL Editor untuk mengatasi masalah RLS pada firestore_docs:

ALTER TABLE firestore_docs DISABLE ROW LEVEL SECURITY;

-- Atau jika Anda ingin tetap mengaktifkan RLS tetapi mengizinkan semua operasi (insert, select, update, delete) untuk tabel tersebut:
-- CREATE POLICY "Allow public access to firestore_docs" ON firestore_docs FOR ALL USING (true);
