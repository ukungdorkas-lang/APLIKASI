import fs from 'fs';

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Replace dynamic imports
content = content.replace(/import\('@\/src\/lib\/supabase-adapter'\)/g, "import('firebase/firestore')");
content = content.replace(/import { supabase } from '\.\.\/lib\/supabase';/g, "import { storage } from '../lib/firebase';\nimport { ref, deleteObject } from 'firebase/storage';");

// Replace supabase storage remove
content = content.replace(/const \{ error \} = await supabase\.storage\.from\('gallery'\)\.remove\(\[fname\]\);/g, "const { error } = await deleteObject(ref(storage, `gallery/${fname}`)).then(() => ({error: null})).catch(e => ({error: e}));");

fs.writeFileSync('src/pages/AdminDashboard.tsx', content, 'utf8');
console.log("Fixed AdminDashboard.tsx");
