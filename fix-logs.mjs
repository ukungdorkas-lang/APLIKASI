import fs from 'fs';
let file = 'src/pages/AdminDashboard.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Find the start index of activeTab === "logs" 
const logStart = txt.indexOf('{activeTab === "logs" && (');
if (logStart !== -1) {
    let braceCount = 0;
    let foundStart = false;
    let logEnd = -1;
    for (let i = logStart; i < txt.length; i++) {
        if (txt[i] === '{') braceCount++;
        if (txt[i] === '}') {
            braceCount--;
            foundStart = true;
        }
        if (foundStart && braceCount === 0) {
            logEnd = i + 1;
            break;
        }
    }
    if (logEnd !== -1) {
        txt = txt.substring(0, logStart) + txt.substring(logEnd);
        console.log('Removed logs tab UI');
    }
}

// Check if "logs" exists in Sidebar items and remove it.
txt = txt.replace(/\{\s*id:\s*"logs"[\s\S]*?\},\n/g, '');

// Removing anything related to logAudit imports
txt = txt.replace(/import\s*\{\s*logAudit\s*\}\s*from\s*"\.\.\/lib\/auditLogger";\n/g, '');

fs.writeFileSync(file, txt);
