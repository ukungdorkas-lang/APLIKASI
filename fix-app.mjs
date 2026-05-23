import fs from 'fs';
const file = 'src/App.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(/query\(\n\s*collection\(db, 'news'\),\n\s*orderBy\('date', 'desc'\)\n\s*\);/, "query(\n      collection(db, 'news'),\n      orderBy('date', 'desc'),\n      limit(10)\n    );");
fs.writeFileSync(file, txt);
console.log('Fixed news limit in App.tsx');
