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

  app.use(express.json());

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
