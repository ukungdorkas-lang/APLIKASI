import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const t1 = await supabase.from('education').select('*').limit(1);
  if (t1.data && t1.data.length > 0) console.log("education:", Object.keys(t1.data[0]));
  
  const t2 = await supabase.from('admins').select('*').limit(1);
  if (t2.data && t2.data.length > 0) console.log("admins:", Object.keys(t2.data[0]));
  
  const t3 = await supabase.from('bank_data').select('*').limit(1);
  if (t3.data && t3.data.length > 0) console.log("bank_data:", Object.keys(t3.data[0]));
}

check();
