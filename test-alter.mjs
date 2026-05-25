import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function alter() {
  const { data, error } = await supabase.rpc('alter_gallery_table', {});
  console.log("Error:", error);
}

alter();
