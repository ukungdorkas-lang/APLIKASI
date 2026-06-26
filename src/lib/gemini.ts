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
    
    // Server-side fallback logic (if executed on server directly)
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
    - Tindakan Penyelamatan: ${report.documentation?.actions || 'Pemadaman dan Penyelamatan'}
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
      model: "gemini-2.0-flash",
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
  } catch (error: any) {
    console.warn(`AI Generation Error: Falling back to local template. ${error instanceof Error ? error.message : ''}`);
    const type = report.type || "Kejadian Darurat";
    const loc = report.location?.address || "Kabupaten Malinau";
    return {
      title: `Sigap Tanggap: Petugas Damkar Malinau Atasi Insiden ${type} di ${loc.split(',')[0]}`,
      content: `### DINAS PEMADAM KEBAKARAN DAN PENYELAMATAN KABUPATEN MALINAU BERHASIL ATASI ${type.toUpperCase()}
      
Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau kembali membuktikan kesiapannya dalam menjaga keamanan masyarakat. Petugas berhasil menangani laporan keadaan darurat berupa **${type}** yang berlokasi di **${loc}**.

Penanganan insiden dipimpin langsung oleh komandan regu piket setelah koordinasi call center menerima panggilan darurat dari warga setempat. Tim Rescue dan pemadam segera dimobilisasi ke titik koordinat membawa peralatan keselamatan lengkap.

#### Proses Penanganan Lapangan
Sebanyak kurang lebih **${report.documentation?.personnel || 5} personel** dikerahkan ke lokasi dengan menggunakan bantuan armada operasional utama berupa **${report.documentation?.units?.join(', ') || 'Unit Reaksi Cepat'}**. Setibanya di lokasi, petugas segera melakukan tindakan taktis untuk melokalisir keadaan agar tidak meluas atau menimbulkan bahaya yang lebih besar.

"Petugas kami langsung meluncur dan berkoordinasi erat dengan instansi terkait serta masyarakat setempat. Alhamdulillah, berkat ketepatan respons, penanganan berjalan lancar," ungkap koordinator operasional lapangan BPBD/Damkar Malinau.

#### Status Terakhir dan Korban
Hingga laporan penanganan selesai diterbitkan, situasi di lokasi dilaporkan telah sepenuhnya kondusif dan aman. Mengenai dampak kerugian serta korban, pihak dinas mengonfirmasi: **${report.documentation?.victims || 'Tidak ada korban jiwa'}**. 

#### Himbauan Keselamatan
Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau senantiasa menghimbau kepada seluruh lapisan masyarakat Kabupaten Malinau agar terus meningkatkan kewaspadaan terhadap potensi bencana atau kebakaran di lingkungan masing-masing.

Apabila masyarakat membutuhkan bantuan darurat atau ingin melaporkan insiden serupa, silakan segera menghubungi Call Center resmi Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau di nomor telepon **(0553) 2021476** (Aktif 24 Jam Bebas Tarif Lapangan).`,
      summary: `Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau sukses menangani insiden ${type} di ${loc} dengan koordinasi sigap seluruh personel lapangan.`,
      personnelCount: report.documentation?.personnel || 5,
      unitsUsed: report.documentation?.units || ["Unit Reaksi Cepat"]
    };
  }
}


export async function developNarrative(outline: string, settings?: AppConfig) {
  try {
    if (typeof window !== 'undefined') {
      const resp = await fetch('/api/ai/develop-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline, settings })
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
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    console.warn(`AI Narrative Development failed, using local fallback. ${error instanceof Error ? error.message : ''}`);
    return {
      title: "Rilis Resmi: Penanganan Laporan Darurat Lapangan",
      content: `### LAPORAN AKTIVITAS OPERASIONAL DINAS PEMADAM KEBAKARAN KABUPATEN MALINAU

Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau terus berkomitmen tinggi merespons setiap laporan kedaruratan yang disampaikan oleh seluruh lapisan masyarakat secara profesional dan bertanggung jawab.

Berdasarkan garis besar laporan operasional terbaru:
> ${outline}

Menindaklanjuti rangkuman kejadian tersebut, petugas lapangan dari tim penanganan darurat telah dikerahkan secara langsung ke lokasi guna melakukan mitigasi insiden, pengamanan area sekitar, serta pencegahan bahaya lanjutan. Semua langkah penanggulangan diselesaikan secara kondusif dan aman.

Kami kembali mengingatkan seluruh masyarakat Kabupaten Malinau untuk waspada terhadap segala risiko bahaya kebakaran ataupun kedaruratan lainnya di pemukiman. Selalu simpan nomor darurat Call Center Pemadam Kebakaran Malinau di **(0553) 2021476** untuk penanganan responsif gratis 24 jam.`,
      summary: "Petugas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau sukses merespons draf operasi secara kondusif."
    };
  }
}

export async function getChatAssistantResponse(message: string, history: { role: string, text: string }[], settings?: AppConfig) {
  try {
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

    const chat = ai.chats.create({ 
      model: "gemini-2.0-flash",
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
    console.warn("Chat Assistant Error, using smart local fallback engine:", error);
    const msg = message.toLowerCase();
    
    if (msg.includes("kontak") || msg.includes("nomor") || msg.includes("telp") || msg.includes("telepon") || msg.includes("hubungi") || msg.includes("call")) {
      return `📞 **Kontak Darurat Damkar Kabupaten Malinau**:\n\n- **Telepon Darurat**: (0553) 2021476\n- **Call Center Layanan**: 112 (Bebas pulsa)\n\nLayanan kami aktif 24 jam sehari, 7 hari seminggu. Segera hubungi nomor di atas jika terjadi kebakaran, korban terperangkap, atau ancaman bahaya darurat lainnya!`;
    }
    
    if (msg.includes("lapor") || msg.includes("kebakaran") || msg.includes("bencana") || msg.includes("darurat") || msg.includes("api") || msg.includes("asap")) {
      return `🚨 **PANDUAN DARURAT CEPAT**:\n\nJika Anda sedang menghadapi **KEBAKARAN** atau situasi **DARURAT** saat ini:\n1. Selamatkan diri Anda dan keluarga ke tempat aman terlebih dahulu.\n2. Hubungi Call Center Damkar Malinau segera di **(0553) 2021476**.\n3. Tekan tombol **"Lapor Darurat"** di halaman depan situs web ini untuk mengirimkan detail serta titik peta koordinat lokasi Anda secara presisi.\n\nPetugas Rescue kami selalu bersiaga siap meluncur ke lokasi kejadian!`;
    }
    
    if (msg.includes("ular") || msg.includes("tawon") || msg.includes("evakuasi") || msg.includes("hewan") || msg.includes("kucing") || msg.includes("rescue")) {
      return `🐍 **Layanan Penyelamatan (Rescue) Non-Kebakaran**:\n\nDinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau tidak hanya memadamkan api, tetapi juga memiliki regu khusus penyelamatan (Rescue Force) untuk:\n- Pembasmian & evakuasi sarang tawon Vespa/lebah raksasa.\n- Evakuasi satwa liar berbahaya (ular kobra, piton, biawak, dll) yang masuk ke pemukiman warga.\n- Penyelamatan hewan peliharaan (kucing terjebak di sumur, dll).\n- Penanganan cincin yang macet di jari tangan.\n\nSemua layanan ini diberikan secara **GRATIS** tanpa dipungut biaya apapun! Hubungi Call Center di (0553) 2021476.`;
    }
    
    if (msg.includes("alamat") || msg.includes("lokasi") || msg.includes("kantor") || msg.includes("pos")) {
      return `📍 **Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau**:\n\n- **Alamat Kantor Pusat**: Jl. Panglima Batur, Malinau Kota, Kabupaten Malinau, Kalimantan Utara.\n- **Wilayah Tugas**: Meliputi seluruh kecamatan di Malinau dengan beberapa pos sektor siaga terdekat untuk mempercepat jangkauan bantuan.`;
    }
    
    if (msg.includes("profil") || msg.includes("sejarah") || msg.includes("siapa") || msg.includes("damkar")) {
      return `🚒 **Tentang "Tanya Damkar"**:\n\nSaya adalah asisten virtual resmi Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau. Petugas kami memiliki misi luhur "Pantang Pulang Sebelum Padam" demi menyelamatkan jiwa, aset daerah, dan melestarikan kedamaian lingkungan di Kabupaten Malinau dari ancaman bahaya api serta bencana darurat lainnya.`;
    }

    return `Halo! Saya **Tanya Damkar**, asisten pintar Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau.

Saat ini sistem kecerdasan buatan (Gemini AI) kami sedang mengalami peningkatan trafik/kuota harian, namun saya ingin menginformasikan ketentuan penting berikut untuk membantu Anda:

1. 🚨 **Laporan Masuk & Darurat**: Bila ada kejadian kebakaran, kecelakaan, atau penyelamatan segera, mohon hubungi Call Center kami di **(0553) 2021476**.
2. 📋 **Form Laporan**: Anda juga bisa mengajukan laporan darurat dengan menekan tombol **"Laporkan Kejadian"** di beranda website untuk ditindaklanjuti secara online.
3. 🐝 **Layanan Gratis**: Seluruh aktivitas penyelamatan kebakaran, evakuasi satwa liar (lebah, ular), dan kedaruratan umum tidak dipungut biaya (*100% Gratis*).

Ada yang bisa saya bantu terkait informasi penyelamatan di Malinau?`;
  }
}
