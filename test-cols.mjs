import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('personnel').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Personnel Columns:", Object.keys(data[0]));
  } else {
    console.log("No data or Error:", error);
  }
}

check();
