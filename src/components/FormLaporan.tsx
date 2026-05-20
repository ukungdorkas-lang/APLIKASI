import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AlertCircle, CheckCircle2, Phone, Send, Loader2 } from 'lucide-react';

// Tipe Data untuk Form dan Hasil API
export interface LaporanFormData {
  nama_pelapor: string;
  no_hp: string;
  isi_laporan: string;
}

export interface FonnteResponse {
  status: boolean;
  msg: string;
  detail?: any;
}

export default function FormLaporan() {
  const [formData, setFormData] = useState<LaporanFormData>({
    nama_pelapor: '',
    no_hp: '',
    isi_laporan: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handler untuk mengelola perubahan input text
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handler utama memproses pengiriman data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    /* 
      PERHATIAN: Menyimpan API Key di sisi klien (frontend) seperti import.meta.env
      bisa berisiko secara keamanan di aplikasi produksi. Direkomendasikan 
      menggunakan backend/server untuk merahasiakan token-token ini.
    */
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const fonnteToken = import.meta.env.VITE_FONNTE_TOKEN;
    const waGroupId = import.meta.env.VITE_WA_GROUP_TARGET_ID;

    if (!geminiKey || !fonnteToken || !waGroupId) {
      setErrorMessage("Kunci API (.env) belum lengkap!");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Simpan ke Database (Firestore) 
      // Menyimpan data laporan ke dalam koleksi 'laporan_masuk'
      const docRef = await addDoc(collection(db, 'laporan_masuk'), {
        ...formData,
        createdAt: Date.now(),
        status: 'pending'
      });

      // 2. Kirim ke Google Gemini API (menggunakan REST API fetch)
      let summaryText = "";
      const systemPrompt = `Anda adalah Asisten AI untuk Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau. Rangkum laporan yang masuk menjadi format pesan darurat yang siap baca. HANYA hasilkan teks biasa yang rapi untuk WhatsApp tanpa format markdown, tanpa blok JSON, dan tanpa teks pembuka/penutup. Sertakan call center 0553 2021476 di akhir pesan.`;
      
      const geminiPrompt = `${systemPrompt}\n\nDATA LAPORAN:\nNama Pelapor: ${formData.nama_pelapor}\nNo HP: ${formData.no_hp}\nIsi Laporan: ${formData.isi_laporan}`;

      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }]
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          if (geminiData.candidates && geminiData.candidates.length > 0) {
            summaryText = geminiData.candidates[0].content.parts[0].text;
          }
        }
      } catch (geminiError) {
        console.error("Gagal mendapatkan respons Gemini:", geminiError);
      }

      // 3. Terima Respons Gemini (Atau gunakan fallback teks jika gagal)
      if (!summaryText || summaryText.trim() === "") {
        summaryText = `🚨 LAPORAN DARURAT MASUK 🚨\n\nNama: ${formData.nama_pelapor}\nNo HP: ${formData.no_hp}\n\nDetail:\n${formData.isi_laporan}\n\nHubungi Call Center: 0553 2021476`;
      }

      // 4. Kirim ke WhatsApp via Fonnte (POST Request)
      const fonnteFormData = new FormData();
      fonnteFormData.append('target', waGroupId);
      fonnteFormData.append('message', summaryText);
      fonnteFormData.append('delay', '2');

      const fonnteRes = await fetch("https://api.fonnte.com/send", {
        method: 'POST',
        headers: {
          'Authorization': fonnteToken
        },
        body: fonnteFormData
      });

      const fonnteResult = await fonnteRes.json() as FonnteResponse;

      if (fonnteResult.status) {
        setSuccessMessage("Laporan berhasil dikirim dan diteruskan ke petugas!");
        setFormData({ nama_pelapor: '', no_hp: '', isi_laporan: '' }); // reset form
      } else {
        setErrorMessage(`Laporan tersimpan tapi gagal diteruskan ke WhatsApp: ${fonnteResult.msg}`);
      }

    } catch (error) {
      console.error("Error utama saat memproses form:", error);
      setErrorMessage("Terjadi kesalahan sistem saat memproses laporan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-xl">
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
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold">{successMessage}</p>
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
  );
}
