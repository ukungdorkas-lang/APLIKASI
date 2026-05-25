import 'dotenv/config';
import { supabase } from './src/lib/supabase.js';

async function testInsert() {
  const id = "12345678"; // Invalid UUID string
  const finalData = {
    reporter_name: "Test",
    id: id
  };
  const { data, error } = await supabase
    .from('reports')
    .upsert(finalData, { onConflict: 'id' });
  console.log("Error:", error);
}
testInsert();
