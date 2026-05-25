import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  try {
    const { data, error } = await supabase.from('reports').select('*').limit(1);
    if (error) {
      console.log("Supabase error:", error);
    } else {
      console.log("Success! Data length:", data.length);
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}
check();
