# Security Specification - DAMKAR Malinau

## Data Invariants
1. Laporan darurat tidak bisa dibuat tanpa data lokasi (lat/lng).
2. Hanya admin/petugas yang bisa mengubah status laporan ke 'responding' atau 'resolved'.
3. Berita hanya bisa dibuat oleh sistem atau admin setelah laporan selesai.
4. User umum hanya bisa membaca berita dan mengirim laporan.

## The Dirty Dozen Payloads (Rejection Targets)
1. Laporan tanpa nama pelapor.
2. Laporan dengan ID lokasi palsu (junk string).
3. Update status laporan oleh user yang bukan admin.
4. Menghapus laporan oleh user umum.
5. Membuat berita tanpa referensi reportId yang valid.
6. Mengatur status laporan langsung ke 'resolved' saat pembuatan.

## Test Cases
- [ ] Create Report: Anonymous OK (Emergency requirement)
- [ ] Update Report Status: Unauthorized -> DENY
- [ ] Create News: Unauthorized -> DENY
- [ ] Delete Report: Unauthorized -> DENY
