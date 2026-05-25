import { GoogleGenAI, Type } from "@google/genai";
import { EmergencyReport } from "../types";

const isServer = typeof process !== 'undefined' && process.env;
const ai = new GoogleGenAI({ apiKey: isServer ? process.env.GEMINI_API_KEY || '' : '' });

export function generateLocalFallbackNews(report: EmergencyReport) {
  const type = report.type || "Kejadian Darurat";
  const location = report.location?.address || "Kabupaten Malinau";
  const timeStr = new Date(report.createdAt).toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short'
  });
  const chronology = report.documentation?.chronology || report.description || "Petugas melaksanakan penanganan operasional darurat sesuai prosedur.";
  const personnel = report.documentation?.personnel || "Peralatan & Regu Cepat";
  const units = report.documentation?.units && report.documentation.units.length > 0 
    ? report.documentation.units.join(', ') 
    : "Unit Reaksi Cepat Damkar";
  const actions = report.documentation?.actions || "pemadaman, evakuasi, dan pengamanan area sekitar";
  const victims = report.documentation?.victims || "Tidak ada korban jiwa dilaporkan dalam insiden ini";
  const duration = report.documentation?.duration || "Selesai ditangani";

  const title = `Sigap Tanggap: Petugas Damkar Malinau Atasi Insiden ${type} di ${location.split(',')[0]}`;
  
  const content = `### DINAS PEMADAM KEBAKARAN DAN PENYELAMATAN KABUPATEN MALINAU BERHASIL ATASI ${type.toUpperCase()}
  
**Malinau, Kalimantan Utara** — Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau kembali membuktikan kesiapannya dalam menjaga keamanan masyarakat. Pada hari **${timeStr}**, petugas berhasil menangani laporan keadaan darurat berupa **${type}** yang berlokasi di **${location}**.

Penanganan insiden dipimpin langsung oleh komandan regu piket setelah koordinasi call center menerima panggilan darurat dari warga setempat. Tim Rescue dan pemadam segera dimobilisasi ke titik koordinat membawa peralatan keselamatan lengkap.

#### Proses Penanganan Lapangan
Sebanyak kurang lebih **${personnel} personel** dikerahkan ke lokasi dengan menggunakan bantuan armada operasional utama berupa **${units}**. Setibanya di lokasi, petugas segera melakukan tindakan taktis berupa *${actions}* untuk melokalisir keadaan agar tidak meluas atau menimbulkan bahaya yang lebih besar.

"Petugas kami langsung meluncur dan berkoordinasi erat dengan instansi terkait serta masyarakat setempat. Alhamdulillah, berkat ketepatan respons, penanganan berjalan lancar selama kurang lebih *${duration}*," ungkap koordinator operasional lapangan BPBD/Damkar Malinau.

#### Status Terakhir dan Korban
Hingga laporan penanganan selesai diterbitkan, situasi di lokasi dilaporkan telah sepenuhnya kondusif dan aman. Mengenai dampak kerugian serta korban, pihak dinas mengonfirmasi: **${victims}**. 

#### Himbauan Keselamatan
Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau senantiasa menghimbau kepada seluruh lapisan masyarakat Kabupaten Malinau agar terus meningkatkan kewaspadaan terhadap potensi bencana atau kebakaran di lingkungan masing-masing. Pastikan instalasi listrik terawat, hindari pembakaran sampah terbuka ilegal, dan segera lakukan mitigasi dini jika melihat tanda-bahaya.

Apabila masyarakat membutuhkan bantuan darurat atau ingin melaporkan insiden serupa, silakan segera menghubungi Call Center resmi Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau di nomor telepon **(0553) 2021476** (Aktif 24 Jam Bebas Tarif Lapangan).

*Badan Dokumentasi & PPID Damkar/Penyelamatan Kabupaten Malinau*`;

  const summary = `Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau sukses menangani insiden ${type} di ${location} dengan koordinasi sigap seluruh personel lapangan.`;

  return { title, content, summary };
}

export async function generateNewsArticle(report: EmergencyReport) {
  try {
    // If we are on client side, try calling the server API first
    if (typeof window !== 'undefined') {
      const resp = await fetch('/api/ai/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      });
      if (!resp.ok) {
         const data = await resp.json().catch(() => ({}));
         throw new Error(data?.error || "Gagal menghubungi server AI");
      }
      const data = await resp.json();
      if (data.success) {
         return data.data;
      } else {
         throw new Error(data.error || "Gagal memproses AI");
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
      model: "gemini-2.0-flash",
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
  } catch (error: any) {
    console.warn("AI News Generation failed, applying local fallback template:", error);
    return generateLocalFallbackNews(report);
  }
}
