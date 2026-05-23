import fs from 'fs';
let file = 'src/pages/AdminDashboard.tsx';
let txt = fs.readFileSync(file, 'utf8');

// remove unsubLogs useEffect
txt = txt.replace(/React\.useEffect\(\(\) => \{\n\s*if \(activeTab !== "logs" && activeTab !== "overview"\) return;\n\s*const unsubLogs = onSnapshot\([\s\S]*?return \(\) => unsubLogs\(\);\n\s*\}, \[activeTab\]\);\n/g, '');

// remove river_sensors logic
txt = txt.replace(/const unsubRiver = onSnapshot\([\s\S]*?setDataLoading\(\(prev\) => \(\{ \.\.\.prev, monitoring: false \}\)\);\n\s*\}\n\s*\);\n/, '');
txt = txt.replace(/return \(\) => \{ unsubRiver\(\); unsubWeather\(\); \};/, 'return () => { unsubWeather(); };');

// Also try removing logAudit imports and calls
txt = txt.replace(/import \{ logAudit \} from "\.\.\/lib\/auditLogger";\n/g, '');
txt = txt.replace(/await logAudit\(.*\);\n/g, '');

fs.writeFileSync(file, txt);
console.log('Fixed use effects');
