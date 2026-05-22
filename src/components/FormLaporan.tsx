import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AlertCircle, CheckCircle2, Phone, Send, Loader2, ChevronDown } from 'lucide-react';

// Tipe Data untuk Form dan Hasil API
export interface LaporanFormData {
  nama_pelapor: string;
  no_hp: string;
  isi_laporan: string;
  jenis_laporan: string;
  sub_jenis_laporan: string;
}

export default function FormLaporan() {
  const locationState = useLocation();
  const queryParams = new URLSearchParams(locationState.search);
  const initialType = queryParams.get('type') || 'Kebakaran';

  const [formData, setFormData] = useState<LaporanFormData>({
    nama_pelapor: '',
    no_hp: '',
    isi_laporan: '',
    jenis_laporan: initialType === 'Evakuasi' || initialType === 'Penyelamatan' ? 'Penyelamatan' : 'Kebakaran',
    sub_jenis_laporan: initialType === 'Evakuasi' ? 'Evakuasi' : (initialType === 'Kebakaran' ? 'Rumah' : 'Dan Lainnya')
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [ticketId, setTicketId] = useState('');

  // Handler untuk mengelola perubahan input text dan select
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'jenis_laporan') {
      setFormData({
        ...formData,
        jenis_laporan: value,
        sub_jenis_laporan: value === 'Kebakaran' ? 'Rumah' : 'Evakuasi' // Reset sub jenis sesuai kategori baru
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handler utama memproses pengiriman data ke Google Apps Script
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');
    setTicketId('');

    // Mengambil URL Google Apps Script dari file konfigurasi (.env)
    const gasUrl = import.meta.env.VITE_GAS_URL; 

    if (!gasUrl) {
      setErrorMessage("Konfigurasi belum lengkap! VITE_GAS_URL belum diatur di file .env Anda.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Simpan ke Database Firestore
      const docRef = await addDoc(collection(db, 'laporan_masuk'), {
        ...formData,
        createdAt: Date.now(),
        status: 'pending'
      });
      console.log("Laporan berhasil tersimpan di Firestore dengan ID:", docRef.id);

      // 2. Kirim data ke Google Apps Script (Backend)
      console.log("Meneruskan laporan ke Backend GAS...");
      const responGas = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(formData) 
      });

      // 3. Baca jawaban dari GAS
      const hasilGas = await responGas.json();
      console.log("Balasan dari sistem WA:", hasilGas);

      if (hasilGas.status === true) {
        setTicketId(docRef.id);
        setSuccessMessage("Laporan berhasil dikirim dan diteruskan ke Grup WhatsApp petugas!");
        setFormData({ nama_pelapor: '', no_hp: '', isi_laporan: '', jenis_laporan: 'Kebakaran', sub_jenis_laporan: 'Rumah' }); // Reset form
      } else {
        setErrorMessage("Gagal mengirim notifikasi WA: " + (hasilGas.msg || JSON.stringify(hasilGas)));
      }

    } catch (error: any) {
      console.error("Terjadi pengecualian jaringan:", error);
      setErrorMessage(`Terjadi kesalahan sistem/jaringan saat mengirim ke backend. Pastikan URL GAS benar.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="bg-brand-red/10 p-3 rounded-full">
            <AlertCircle className="w-6 h-6 text-brand-red" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lapor Darurat</h2>
            <p className="text-xs text-slate-500 font-medium">Layanan Pemadam Kebakaran & Penyelamatan</p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 text-emerald-800">
            <CheckCircle2 className="w-6 h-6 mt-0.5 shrink-0" />
            <div className="space-y-3 w-full">
              <p className="text-sm font-semibold">{successMessage}</p>
              {ticketId && (
                <div className="p-4 bg-white border border-emerald-100 rounded-lg shadow-sm w-full">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Tiket Laporan Anda:</p>
                  <p className="text-2xl font-mono font-black text-emerald-900 tracking-widest">{ticketId.substring(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Simpan nomor tiket ini untuk mengecek status laporan.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="nama_pelapor" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Pelapor</label>
            <input
              id="nama_pelapor"
              name="nama_pelapor"
              type="text"
              required
              placeholder="Masukkan nama lengkap Anda"
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-medium outline-none focus:border-brand-red transition-colors"
              value={formData.nama_pelapor}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="no_hp" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nomor Handphone / WA</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-slate-400" />
              </div>
              <input
                id="no_hp"
                name="no_hp"
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                className="w-full bg-slate-50 border-2 border-slate-100 pl-12 p-4 rounded-xl font-medium outline-none focus:border-brand-red transition-colors"
                value={formData.no_hp}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="jenis_laporan" className="text-xs font-bold uppercase tracking-wider text-slate-500">Jenis Laporan</label>
              <div className="relative">
                <select
                  id="jenis_laporan"
                  name="jenis_laporan"
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-medium outline-none focus:border-brand-red transition-colors appearance-none cursor-pointer"
                  value={formData.jenis_laporan}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="Kebakaran">Kebakaran</option>
                  <option value="Penyelamatan">Penyelamatan</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sub_jenis_laporan" className="text-xs font-bold uppercase tracking-wider text-slate-500">Kategori Kejadian</label>
              <div className="relative">
                <select
                  id="sub_jenis_laporan"
                  name="sub_jenis_laporan"
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-medium outline-none focus:border-brand-red transition-colors appearance-none cursor-pointer"
                  value={formData.sub_jenis_laporan}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {formData.jenis_laporan === 'Kebakaran' ? (
                    <>
                      <option value="Lahan">Lahan</option>
                      <option value="Rumah">Rumah</option>
                    </>
                  ) : (
                    <>
                      <option value="Evakuasi">Evakuasi</option>
                      <option value="Pohon Tumbang">Pohon Tumbang</option>
                      <option value="Hewan Berbahaya">Hewan Berbahaya</option>
                      <option value="Banjir">Banjir</option>
                      <option value="Perbantuan">Perbantuan</option>
                      <option value="Dan Lainnya">Dan Lainnya</option>
                    </>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="isi_laporan" className="text-xs font-bold uppercase tracking-wider text-slate-500">Isi Laporan Kejadian</label>
            <textarea
              id="isi_laporan"
              name="isi_laporan"
              required
              rows={4}
              placeholder="Sebutkan lokasi kejadian, jenis kejadian (kebakaran, penyelamatan hewan, dll)"
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-medium outline-none focus:border-brand-red transition-colors resize-none"
              value={formData.isi_laporan}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 bg-brand-red hover:bg-red-700 text-white font-bold p-4 rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Kirim Laporan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}