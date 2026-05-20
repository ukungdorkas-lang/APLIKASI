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

  // API Route for AI Weather Update
  app.post('/api/ai/weather-upstream', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'GEMINI_API_KEY is not configured on the server. Please check your Secrets in Settings.' 
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
      console.error('Gemini Error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: `AI Weather Error: ${errMsg}` });
    }
  });

  app.post('/api/ai/generate-news', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY missing' });
    }
    const { report } = req.body;
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

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      res.json({ success: true, data: JSON.parse(response.text) });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  app.post('/api/ai/develop-narrative', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY missing' });
    }
    const { outline } = req.body;
    try {
      const prompt = `Kembangkan draf ini menjadi narasi berita Damkar formal: "${outline}". Sajikan JSON: { "title": string, "content": string, "summary": string }`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      res.json({ success: true, data: JSON.parse(response.text) });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
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
