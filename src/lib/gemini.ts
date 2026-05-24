import { GoogleGenAI } from "@google/genai";
import { EmergencyReport, AppConfig } from "../types";

const isServer = typeof process !== 'undefined' && process.env;
let currentApiKey = isServer && process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : '';
let aiInstance: GoogleGenAI | null = null;

export function getAiInstance(settings?: AppConfig) {
  const apiKey = settings?.geminiApiKey || (isServer ? process.env.GEMINI_API_KEY || '' : '');
  
  if (apiKey && (apiKey !== currentApiKey || !aiInstance)) {
    currentApiKey = apiKey;
    aiInstance = new GoogleGenAI({ apiKey: currentApiKey });
  }
  
  if (!aiInstance) {
    // Return a dummy instance or fallback if it's strictly required but not used on client without key
    // Actually, we can return a new instance with a dummy key just to avoid crashes if someone calls it, 
    // or we just initialize it with a dummy key here. 
    // Wait, if we return null, the caller will crash on ai.models.
    // Let's create an instance with a placeholder if absolutely needed, or throw a clear error.
    console.warn('API key should be set when using the Gemini API.');
    // Try to init without key, it will throw when used
    aiInstance = new GoogleGenAI({ apiKey: 'API_KEY_NOT_SET' });
  }
  
  return aiInstance;
}

export async function generateNewsFromReport(report: EmergencyReport, settings?: AppConfig) {
  try {
    // If we are on client side, try calling the server API first
    if (typeof window !== 'undefined') {
      const resp = await fetch('/api/ai/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, settings })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) return data.data;
      }
    }
    const ai = getAiInstance(settings);
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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

export async function developNarrative(outline: string, settings?: AppConfig) {
  try {
    if (typeof window !== 'undefined') {
      const resp = await fetch('/api/ai/develop-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) return data.data;
      }
    }
    const ai = getAiInstance(settings);
    const prompt = `
    Anda adalah Asisten Penulis Berita (Pena Narasi AI) untuk Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau.
    Tugas Anda adalah mengembangkan draf atau kerangka berita singkat menjadi narasi berita yang lengkap, menarik, dan profesional.

    DRAF/KERANGKA:
    "${outline}"

    INSTRUKSI:
    1. Kembangkan draf di atas menjadi artikel berita formal (300-500 kata).
    2. Pertahankan akurasi fakta dari draf.
    3. Gunakan gaya bahasa jurnalistik resmi pemerintah.
    4. Berikan judul yang menarik dan mencerminkan instansi.
    5. Tambahkan detail-detail narasi yang logis untuk memperkaya cerita (misal: kesigapan tim, koordinasi dengan warga, atau pesan bupati/kepala dinas jika relevan secara umum).
    6. Akhiri dengan pesan edukasi pencegahan kebakaran/bahaya.
    7. FORMAT: Return JSON.

    JSON STRUCTURE:
    {
      "title": "Judul Berita",
      "content": "Narasi Berita Lengkap dalam format Markdown",
      "summary": "Ringkasan singkat"
    }
  `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Narrative Development Error:", error);
    return null;
  }
}

export async function getChatAssistantResponse(message: string, history: { role: string, text: string }[], settings?: AppConfig) {
  const ai = getAiInstance(settings);
  const systemPrompt = `
    Anda adalah "Tanya Damkar", asisten virtual resmi dari Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau.
    Tugas Anda adalah melayani masyarakat dengan memberikan informasi seputar:
    1. Prosedur pelaporan darurat (Hubungi Nomor Darurat ${settings?.emergencyNumber || '112'}).
    2. Edukasi pencegahan kebakaran.
    3. Informasi umum mengenai profil Damkar Malinau.
    4. Status laporan (jika relevan).

    KEPRIBADIAN:
    - Sigap, ramah, dan profesional.
    - Menggunakan bahasa Indonesia yang sopan (bisa sedikit santai tapi tetap hormat).
    - Selalu mengutamakan keselamatan warga.

    KONTRAK RESPON:
    - Jika ada yang melaporkan kebakaran SEKARANG, segera arahkan untuk menekan tombol darurat atau hubungi nomor telepon ${settings?.emergencyNumber || '112'}. JANGAN HANYA DICHAT.
    - Berikan jawaban yang singkat, padat, dan informatif.
  `;

  try {
    const chat = ai.chats.create({ 
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemPrompt
      }
    });
    
    // Concatenate history for the first message since ai.chats.create simple SDK 
    // might not support history initialization directly in all variants.
    // Or just use the last message if history is too complex for this simplified call.
    const fullMessage = history.length > 0 
      ? history.map(h => `${h.role === 'user' ? 'Masyarakat' : 'Damkar'}: ${h.text}`).join('\n') + '\n\nMasyarakat: ' + message
      : message;

    const response = await chat.sendMessage({ message: fullMessage });
    return response.text || "Maaf, saya tidak mengerti.";
  } catch (error) {
    console.error("Chat Assistant Error:", error);
    return "Maaf, sistem sedang mengalami gangguan. Mohon hubungi nomor darurat kami segera jika ada kejadian kritis.";
  }
}
