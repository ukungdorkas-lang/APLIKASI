import fs from 'fs';
let file = 'src/pages/AdminDashboard.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(/const \[logs, setLogs\] = React\.useState<any\[\]>\(\[\]\);\n/g, '');
txt = txt.replace(/const \[riverSensors, setRiverSensors\] = React\.useState<any\[\]>\(\[\]\);\n/g, '');
txt = txt.replace(/logs: true,\n/g, '');
// For the 2313 and 2438 this means the river sensor loop is still in the code! I must not have written my regex right.
// Let remove the whole <div className="space-y-6">....

fs.writeFileSync(file, txt);
