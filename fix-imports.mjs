import fs from 'fs';
const file = 'src/pages/AdminDashboard.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(/updateDoc,/, 'updateDoc, limit,');
fs.writeFileSync(file, txt);
console.log('Fixed limit import');
