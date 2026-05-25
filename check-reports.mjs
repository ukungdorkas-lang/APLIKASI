import { supabase } from './src/lib/supabase.js';

async function checkReports() {
  const { data, error } = await supabase.from('reports').select('*');
  console.log("Error:", error);
  console.log("Count:", data?.length || 0);

  if (data && data.length > 0) {
    console.log(JSON.stringify(data[data.length-1], null, 2));
  }
}
checkReports();
