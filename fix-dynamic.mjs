import fs from 'fs';

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');
content = content.replace(/await import\(['"]firebase\/firestore['"]\)/g, "await import('@/lib/supabase-adapter')");
fs.writeFileSync('src/pages/AdminDashboard.tsx', content, 'utf-8');
console.log("Updated AdminDashboard");
