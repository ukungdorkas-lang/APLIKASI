import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function add() {
  const { data, error } = await supabase.from('gallery').insert({
    title: "Test",
    type: "OPERASIONAL",
    url: "https://example.com/test.jpg",
    created_at: Date.now(),
    tags: { test: "ok" }
  });
  console.log("Error:", error);
}

add();
