import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, the bundled server.cjs is in the 'dist' folder
    // So __dirname will be the 'dist' folder itself.
    const distPath = process.env.NODE_ENV === 'production' 
      ? path.resolve(__dirname) 
      : path.resolve(process.cwd(), 'dist');

    console.log(`Production Mode: Serving static files from ${distPath}`);
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`Error sending index.html from ${indexPath}:`, err);
          res.status(500).send('Server Error: index.html not found');
        }
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
