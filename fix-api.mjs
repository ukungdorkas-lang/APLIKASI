import fs from 'fs';
let file = 'src/pages/AdminDashboard.tsx';
let txt = fs.readFileSync(file, 'utf8');

const saveRiverRg = /const handleSaveRiver = async \(e: React\.FormEvent\) => \{[\s\S]*?\}\n\s*};\n/g;
txt = txt.replace(saveRiverRg, '');

fs.writeFileSync(file, txt);
