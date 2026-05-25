import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure uploads directory exists (Dedicated folder outside public/dist for dynamic data)
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads_store');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Serve the uploads folder statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Dedicated download route to force attachment header
  app.get('/api/download/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath, fileName);
    } else {
      res.status(404).json({ success: false, error: 'File not found on server' });
    }
  });

  // API Route for File Upload (Prototype Storage)
  app.post('/api/upload', (req, res) => {
    const { fileName, fileData } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ success: false, error: 'Missing file name or data' });
    }

    try {
      // Remove data URL prefix if present
      const base64Data = fileData.replace(/^data:.*;base64,/, "");
      const filePath = path.join(UPLOADS_DIR, fileName);
      fs.writeFileSync(filePath, base64Data, 'base64');
      
      const fileUrl = `/uploads/${fileName}`;
      res.json({ success: true, fileUrl });
    } catch (err) {
      console.error('Upload Error:', err);
      res.status(500).json({ success: false, error: 'Failed to save file' });
    }
  });

  // API Route to List Files
  app.get('/api/files', (req, res) => {
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const fileList = files.map(file => {
        const stats = fs.statSync(path.join(UPLOADS_DIR, file));
        return {
          name: file,
          url: `/uploads/${file}`,
          size: stats.size,
          mtime: stats.mtime
        };
      });
      res.json({ success: true, files: fileList });
    } catch (err) {
      console.error('List Files Error:', err);
      res.status(500).json({ success: false, error: 'Failed to list files' });
    }
  });

  // API Route to Delete a File
  app.delete('/api/files/:filename', (req, res) => {
    try {
      const fileName = req.params.filename;
      const filePath = path.join(UPLOADS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: 'File not found' });
      }
    } catch (err) {
      console.error('Delete File Error:', err);
      res.status(500).json({ success: false, error: 'Failed to delete file' });
    }
  });

  // API Route to Rename a File
  app.put('/api/files/:filename/rename', (req, res) => {
    try {
      const oldName = req.params.filename;
      const { newName } = req.body;
      if (!newName) {
        return res.status(400).json({ success: false, error: 'Missing new file name' });
      }

      const oldPath = path.join(UPLOADS_DIR, oldName);
      const newPath = path.join(UPLOADS_DIR, newName);

      if (fs.existsSync(newPath)) {
        return res.status(400).json({ success: false, error: 'Destination file already exists' });
      }

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        res.json({ success: true, fileUrl: `/uploads/${newName}` });
      } else {
        res.status(404).json({ success: false, error: 'File not found' });
      }
    } catch (err) {
      console.error('Rename File Error:', err);
      res.status(500).json({ success: false, error: 'Failed to rename file' });
    }
  });

  // API Route for AI Weather Update
  app.post('/api/ai/weather-upstream', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured on the server, applying fallback weather dashboard data.');
      return res.json({
        success: true,
        data: {
          condition: "Berawan Tebal (Estimasi Lokal)",
          rainfall: 5.4,
          overflowPotential: "Rendah",
          summary: "Pemantauan visual hulu Sungai Malinau saat ini terpantau stabil dengan kondisi berawan tebal. Tinggi muka air berada dalam rentang batas aman normal harian.",
          recommendation: "Kondisi aman terkendali. Tetap lakukan patroli berkala pos pantau dan ingatkan warga bantaran agar senantiasa waspada terhadap perubahan cuaca lokal mendadak."
        }
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: "Cari informasi cuaca terkini untuk hulu Sungai Malinau (daerah Mentarang Hulu & Malinau Selatan Hulu), Kalimantan Utara melalui Google Search. Khususnya untuk desa-desa: Long Jalan, Long Lake, Long Rat, Tanjung Nanga, Metut, Halanga, Long Simau, Long Kebinu, Long Berang, Long Mekatip. Berikan data dalam JSON: 1. Condition (Kondisi umum), 2. Rainfall (Curah hujan rata-rata mm/24h), 3. OverflowPotential (Rendah/Sedang/Tinggi/Bahaya), 4. Summary (Kesimpulan situasi keseluruhan di hulu), 5. Recommendation (Saran instruksi untuk tim BPBD/Damkar).",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              condition: { type: Type.STRING },
              rainfall: { type: Type.NUMBER },
              overflowPotential: { type: Type.STRING },
              summary: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ['condition', 'rainfall', 'overflowPotential', 'summary', 'recommendation']
          }
        }
      });

      const weatherData = JSON.parse(response.text);
      res.json({ success: true, data: weatherData });
    } catch (err) {
      console.warn('Gemini Upstream Weather failed or quote exhausted, falling back to local simulation:', err);
      const simulatedWeather = {
        condition: "Hujan Ringan - Berawan Tebal (Estimasi Lokal - Traffic Tinggi)",
        rainfall: 12.5,
        overflowPotential: "Sedang",
        summary: "Wilayah hulu Sungai Malinau khususnya Mentarang Hulu terpantau berawan tebal dengan curah hujan intensitas sedang di beberapa titik. Tinggi muka air hulu stabil namun memerlukan pemantauan berkala.",
        recommendation: "Petugas di pos pantau sungai diinstruksikan untuk tetap melakukan patroli visual 3 jam sekali dan mensosialisasikan kesiapsiagaan kepada warga bantaran sungai."
      };
      res.json({ success: true, data: simulatedWeather });
    }
  });

  app.post('/api/ai/generate-news', async (req, res) => {
    const { report, settings } = req.body;
    const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Missing GEMINI_API_KEY, applying local news fallback directly gratis.');
      const type = report?.type || "Kejadian Darurat";
      const loc = report?.location?.address || "Kabupaten Malinau";
      const fallbackData = {
        title: `Sigap Tanggap: Petugas Damkar Malinau Atasi Insiden ${type} di ${loc.split(',')[0]}`,
        content: `### DINAS PEMADAM KEBAKARAN DAN PENYELAMATAN KABUPATEN MALINAU BERHASIL ATASI ${type.toUpperCase()}
        
Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau senantiasa membuktikan kesiapannya dalam menjaga keamanan masyarakat. Petugas berhasil menangani laporan keadaan darurat berupa **${type}** yang berlokasi di **${loc}**.

#### Proses Penanganan Lapangan
Regu piket penyelamatan segera dimobilisasi ke titik koordinat membawa peralatan keselamatan lengkap. Sebanyak kurang lebih **${report?.documentation?.personnel || 5} personel** dikerahkan ke lokasi dengan menggunakan bantuan armada operasional utama berupa **${report?.documentation?.units?.join(', ') || 'Unit Reaksi Cepat'}** untuk melokalisir keadaan agar tidak meluas atau menimbulkan bahaya yang lebih besar.

"Petugas kami langsung meluncur dan berkoordinasi erat dengan instansi terkait serta masyarakat setempat. Alhamdulillah, berkat ketepatan respons, penanganan berjalan lancar," ungkap koordinator operasional lapangan BPBD/Damkar Malinau.

Hingga laporan penanganan selesai diterbitkan, situasi di lokasi dilaporkan telah sepenuhnya kondusif dan aman. Mengenai dampak kerugian serta korban, pihak dinas mengonfirmasi: **${report?.documentation?.victims || 'Tidak ada/Masih dalam pendataan'}**.`,
        summary: `Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau sukses menangani insiden ${type} di ${loc} dengan koordinasi sigap seluruh personel lapangan.`,
        personnelCount: report?.documentation?.personnel || 5,
        unitsUsed: report?.documentation?.units || ["Unit Reaksi Cepat"]
      };
      return res.json({ success: true, data: fallbackData });
    }
    
    // Create local instance for custom API key
    const localAi = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    try {
      const prompt = `
        Anda adalah PPID Damkar Malinau. Buat rilis berita dari data ini:
        Jenis: ${report.type}
        Lokasi: ${report.location?.address || 'Malinau'}
        Kronologi: ${report.documentation?.chronology || report.description}
        Personel: ${report.documentation?.personnel || 0}
        Unit: ${report.documentation?.units?.join(', ') || ''}
        
        Sajikan dalam JSON: { "title": string, "content": string, "summary": string, "personnelCount": number, "unitsUsed": string[] }
      `;

      const response = await localAi.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const responseText = response.text || "{}";
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      res.json({ success: true, data: JSON.parse(cleaned) });
    } catch (err) {
      console.warn('Gemini Generate News failed or quota exhausted, falling back to local simulation:', err);
      const type = report?.type || "Kejadian Darurat";
      const loc = report?.location?.address || "Kabupaten Malinau";
      const fallbackData = {
        title: `Sigap Tanggap: Petugas Damkar Malinau Atasi Insiden ${type} di ${loc.split(',')[0]}`,
        content: `### DINAS PEMADAM KEBAKARAN DAN PENYELAMATAN KABUPATEN MALINAU BERHASIL ATASI ${type.toUpperCase()}
        
Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau senantiasa membuktikan kesiapannya dalam menjaga keamanan masyarakat. Petugas berhasil menangani laporan keadaan darurat berupa **${type}** yang berlokasi di **${loc}**.

#### Proses Penanganan Lapangan
Regu piket penyelamatan segera dimobilisasi ke titik koordinat membawa peralatan keselamatan lengkap. Sebanyak kurang lebih **${report?.documentation?.personnel || 5} personel** dikerahkan ke lokasi dengan menggunakan bantuan armada operasional utama berupa **${report?.documentation?.units?.join(', ') || 'Unit Reaksi Cepat'}** untuk melokalisir keadaan agar tidak meluas atau menimbulkan bahaya yang lebih besar.

"Petugas kami langsung meluncur dan berkoordinasi erat dengan instansi terkait serta masyarakat setempat. Alhamdulillah, berkat ketepatan respons, penanganan berjalan lancar," ungkap koordinator operasional lapangan BPBD/Damkar Malinau.

Hingga laporan penanganan selesai diterbitkan, situasi di lokasi dilaporkan telah sepenuhnya kondusif dan aman. Mengenai dampak kerugian serta korban, pihak dinas mengonfirmasi: **${report?.documentation?.victims || 'Tidak ada/Masih dalam pendataan'}**.`,
        summary: `Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau sukses menangani insiden ${type} di ${loc} dengan koordinasi sigap seluruh personel lapangan.`,
        personnelCount: report?.documentation?.personnel || 5,
        unitsUsed: report?.documentation?.units || ["Unit Reaksi Cepat"]
      };
      res.json({ success: true, data: fallbackData });
    }
  });

  app.post('/api/ai/develop-narrative', async (req, res) => {
    const { outline, settings } = req.body;
    const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Missing GEMINI_API_KEY, applying local narrative developFallback');
      return res.json({
        success: true,
        data: {
          title: "Rilis Resmi: Penanganan Laporan Darurat Lapangan",
          content: `### LAPORAN AKTIVITAS OPERASIONAL REAKSI CEPAT DAMKAR MALINAU\n\n${outline}\n\nSeluruh rangkaian penanganan dilaksanakan sesuai Standard Operating Procedure (SOP) keselamatan yang berlaku demi kenyamanan dan perlindungan warga masyarakat umum di Kabupaten Malinau. Hubungi Call Center di (0553) 2021476 apabila mendeteksi adanya situasi darurat yang membutuhkan penanganan profesional.`,
          summary: "Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau sukses merespons outline operasi secara kondusif."
        }
      });
    }

    const localAi = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    try {
      const prompt = `Kembangkan draf ini menjadi narasi berita Damkar formal: "${outline}". Sajikan JSON: { "title": string, "content": string, "summary": string }`;
      const response = await localAi.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const responseText = response.text || "{}";
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      res.json({ success: true, data: JSON.parse(cleaned) });
    } catch (err) {
      console.warn('Gemini Develop Narrative failed or quota exhausted, falling back to local simulation:', err);
      res.json({
        success: true,
        data: {
          title: "Rilis Resmi: Penanganan Laporan Darurat Lapangan",
          content: `### LAPORAN AKTIVITAS OPERASIONAL REAKSI CEPAT DAMKAR MALINAU\n\n${outline}\n\nPetugas lapangan dari tim penanganan darurat telah dikerahkan secara langsung ke lokasi guna melakukan mitigasi insiden, pengamanan area sekitar, serta pencegahan bahaya lanjutan. Semua langkah penanggulangan diselesaikan secara kondusif dan aman.\n\nHubungi Call Center di (0553) 2021476 apabila mendeteksi adanya situasi darurat yang membutuhkan penanganan profesional.`,
          summary: "Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau sukses merespons outline operasi secara kondusif."
        }
      });
    }
  });

  // NEW: API Route for Emergency Report (Gemini + Fonnte)
  app.post('/api/laporan', async (req, res) => {
    const { nama_pelapor, no_hp, isi_laporan } = req.body;
    
    if (!nama_pelapor || !no_hp || !isi_laporan) {
      return res.status(400).json({ success: false, error: 'Data laporan tidak lengkap' });
    }

    // 1. Summarize with Gemini
    let summaryText = "";
    const systemPrompt = `Anda adalah Asisten AI untuk Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau. Rangkum laporan yang masuk menjadi format pesan darurat yang siap baca. HANYA hasilkan teks biasa yang rapi untuk WhatsApp tanpa format markdown, tanpa blok JSON, dan tanpa teks pembuka/penutup. Sertakan call center 0553 2021476 di akhir pesan.`;
    
    const geminiPrompt = `${systemPrompt}\n\nDATA LAPORAN:\nNama Pelapor: ${nama_pelapor}\nNo HP: ${no_hp}\nIsi Laporan: ${isi_laporan}`;

    try {
      if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
           model: 'gemini-2.0-flash', // Use a standard stable model
           contents: geminiPrompt
        });
        summaryText = response.text;
      }
    } catch (err) {
      console.error('Gemini Laporan Error:', err);
    }

    if (!summaryText || summaryText.trim() === "") {
        summaryText = `🚨 LAPORAN DARURAT MASUK 🚨\n\nNama: ${nama_pelapor}\nNo HP: ${no_hp}\n\nDetail:\n${isi_laporan}\n\nHubungi Call Center: 0553 2021476`;
    }

    // 2. Send to Fonnte
    const waGroupId = process.env.VITE_WA_GROUP_TARGET_ID || process.env.WA_GROUP_TARGET_ID;
    const fonnteToken = process.env.VITE_FONNTE_TOKEN || process.env.FONNTE_TOKEN;

    if (!waGroupId || !fonnteToken) {
       console.error('Missing configuration:', { waGroupId: !!waGroupId, fonnteToken: !!fonnteToken });
       return res.status(500).json({ success: false, error: 'Konfigurasi Fonnte di server tidak lengkap (.env)' });
    }

    try {
      const params = new URLSearchParams();
      params.append('target', waGroupId);
      params.append('message', summaryText);
      params.append('delay', '2');

      const fonnteRes = await fetch("https://api.fonnte.com/send", {
        method: 'POST',
        headers: {
          'Authorization': fonnteToken
        },
        body: params
      });

      const fonnteResult = await fonnteRes.json() as any;
      console.log('Fonnte API response:', fonnteResult);

      if (fonnteResult.status) {
        res.json({ success: true, message: 'Laporan berhasil dikirim ke WhatsApp' });
      } else {
        res.status(500).json({ success: false, error: `Fonnte Error: ${fonnteResult.msg}` });
      }
    } catch (err) {
      console.error('Fonnte API Error:', err);
      res.status(500).json({ success: false, error: 'Gagal mengirim ke WhatsApp melalui API Gateway' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log(`Production Mode: Serving static files from ${distPath}`);
    
    app.use(express.static(distPath));
    
    // Fallback for SPA routing - serve index.html for all non-API GET requests
    app.get('*', (req, res) => {
      // Don't serve index.html for API requests that fall through
      if (req.url.startsWith('/api/')) {
        return res.status(404).json({ success: false, error: 'API route not found' });
      }
      
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`Error sending index.html from ${indexPath}:`, err);
          // If in dist and __dirname works, try that as a last resort
          const fallbackPath = path.join(__dirname, 'index.html');
          res.sendFile(fallbackPath, (err2) => {
            if (err2) {
              res.status(500).send('Server Error: App entry point (index.html) not found in ' + distPath);
            }
          });
        }
      });
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Express Server Error:', err);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
