import { supabase } from './src/lib/supabase.ts';
import { getDocs, collection, addDoc } from './src/lib/supabase-adapter.ts';

async function test() {
  try {
    const d = await getDocs(collection({} as any, "themes"));
    console.log("Success! themes fetched:", d.docs.length);
  } catch (err) {
    console.error("Error Themes", err.message);
  }

  try {
    const d = await getDocs(collection({} as any, "bank_data"));
    console.log("Success! bank_data fetched:", d.docs.length);
  } catch (err) {
    console.error("Error Bank_data", err.message);
  }
}

test();
