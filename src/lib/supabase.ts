import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (envUrl && envUrl.trim() !== '') ? envUrl.trim() : 'https://dummy.supabase.co';
const supabaseAnonKey = (envKey && envKey.trim() !== '') ? envKey.trim() : 'dummy-key';

if (supabaseUrl === 'https://dummy.supabase.co') {
  console.warn('Supabase URL atau Anon Key belum disetel di Environment Variables. Pastikan Anda mengatur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di Vercel Settings -> Environment Variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

