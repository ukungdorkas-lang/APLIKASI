import { GoogleGenAI } from "@google/genai";
import { EmergencyReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateNewsFromReport(report: EmergencyReport) {
  const prompt = `
    Anda adalah Pejabat Pengelola Informasi dan Dokumentasi (PPID) Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau.
    Tugas Anda adalah memproduksi rilis berita resmi pemerintah berdasarkan data kejadian yang telah ditangani oleh tim lapangan.

    DATA OPERASIONAL:
    - Jenis Kejadian: ${report.type}
    - Lokasi: ${report.location.address || 'Malinau'}
    - Waktu Kejadian: ${new Date(report.createdAt).toLocaleString('id-ID')}
    - Kronologi Lapangan: ${report.documentation?.chronology || report.description}
    - Personel Terlibat: ${report.documentation?.personnel || report.officerNotes?.match(/\d+/)?.[0] || '1 Tim'} Personel
    - Unit Armada: ${report.documentation?.units?.join(', ') || 'Unit Reaksi Cepat'}
    - Tindakan Penyelamatan: ${report.documentation?.actions || 'Pemuadaman dan Penyelamatan'}
    - Korban/Kerugian: ${report.documentation?.victims || 'Tidak ada/Masih dalam pendataan'}
    - Durasi Penanganan: ${report.documentation?.duration || 'Selesai'}

    INSTRUKSI PENULISAN:
    1. JUDUL: Buat judul berita yang kuat, formal, dan mencerminkan kesigapan petugas (Gunakan huruf kapital di awal kata).
    2. NARASI: Kembangkan kronologi menjadi berita profesional 3-5 paragraf. Gunakan bahasa Indonesia yang baik dan benar (EYD).
    3. GAYA BAHASA: Gunakan gaya bahasa resmi instansi pemerintah (Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau). Pastikan alurnya logis dan informatif.
    4. PESAN EDUKASI: Selalu sertakan himbauan keselamatan di akhir berita yang relevan dengan jenis kejadian.
    5. FORMAT: Sajikan dalam format JSON.

    PROMPT PENGEMBANGAN NARASI:
    Ubah narasi singkat seperti "Kebakaran rumah berhasil dipadamkan" menjadi rilis berita lengkap: 
    "Petugas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau berhasil menangani kejadian kebakaran rumah warga yang terjadi pada malam hari di wilayah Kecamatan Malinau Kota. Proses pemadaman berlangsung cepat setelah tim menerima laporan dari masyarakat..."

    JSON STRUCTURE:
    {
      "title": "Title String",
      "content": "Full markdown content with detailed narrative",
      "summary": "Short snippet for preview",
      "personnelCount": number,
      "unitsUsed": ["unit1", "unit2"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      ...parsed,
      personnelCount: parsed.personnelCount || report.documentation?.personnel || 0,
      unitsUsed: parsed.unitsUsed || report.documentation?.units || []
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}
