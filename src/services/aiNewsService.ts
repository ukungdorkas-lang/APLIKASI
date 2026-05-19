import { GoogleGenAI, Type } from "@google/genai";
import { EmergencyReport } from "../types";

const isServer = typeof process !== 'undefined' && process.env;
const ai = new GoogleGenAI({ apiKey: isServer ? process.env.GEMINI_API_KEY || '' : '' });

export async function generateNewsArticle(report: EmergencyReport) {
  try {
    // If we are on client side, try calling the server API first
    if (typeof window !== 'undefined') {
      const resp = await fetch('/api/ai/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) return data.data;
      }
    }
  const prompt = `
    Anda adalah Pejabat Pengelola Informasi dan Dokumentasi (PPID) Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau.
    Tugas Anda adalah membuat berita resmi pemerintah berdasarkan data kejadian berikut.
    
    DATA KEJADIAN:
    Jenis: ${report.type}
    Lokasi: ${report.location.address}
    Waktu: ${new Date(report.createdAt).toLocaleString('id-ID')}
    Kronologi: ${report.documentation?.chronology || report.description}
    Personel: ${report.documentation?.personnel || 0} orang
    Unit: ${report.documentation?.units?.join(', ') || 'Unit Reaksi Cepat'}
    Tindakan: ${report.documentation?.actions || 'Pemadam dan Penyelamatan'}
    Korban/Kerugian: ${report.documentation?.victims || 'Dalam pendataan'}
    Durasi Penanganan: ${report.documentation?.duration || 'Selesai ditangani'}

    INSTRUKSI:
    1. Buat judul berita yang profesional, menarik, dan informatif.
    2. Kembangkan kronologi menjadi narasi berita yang lengkap, formal (bahasa resmi Damkar), namun mudah dipahami.
    3. Pastikan memuat elemen 5W+1H.
    4. Gunakan gaya bahasa resmi instansi pemerintah (Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau).
    5. Berita harus diakhiri dengan pesan edukasi atau himbauan kepada masyarakat.

    FORMAT OUTPUT (JSON):
    {
      "title": "Judul Berita",
      "content": "Isi berita lengkap dalam format markdown",
      "summary": "Ringkasan singkat berita (1-2 kalimat)"
    }
  `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["title", "content", "summary"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("AI News Generation Error:", error);
    throw error;
  }
}
